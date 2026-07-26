import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const gameRoot = process.env.J4L_GAME_REPO
  ? path.resolve(process.env.J4L_GAME_REPO)
  : path.resolve(projectRoot, "../jump4life");
const commandDataPath = path.join(projectRoot, "src/data/commands.ts");
const outputPath = path.join(projectRoot, "docs/COMMAND_ARGUMENT_AUDIT.md");
const checkOnly = process.argv.includes("--check");

const cod4OnlyCommands = new Set(["dontspecme", "minimap", "viewbob"]);
const excludedCommands = new Set(["hideme"]);

function walk(directory, extension, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    const itemPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(itemPath, extension, result);
    } else if (itemPath.endsWith(extension)) {
      result.push(itemPath);
    }
  }
  return result;
}

function escapeRegExp(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function inlineCode(value) {
  return `\`${String(value).replace(/`/g, "'")}\``;
}

function tableInlineCode(value) {
  return inlineCode(value).replace(/\|/g, "\\|");
}

function parseGeneratedCommands() {
  const source = fs.readFileSync(commandDataPath, "utf8");
  return [...source.matchAll(/^\s*(\{.*\}),?$/gm)].map((match) => JSON.parse(match[1]));
}

function parseRegistrations() {
  const sourceRoot = path.join(gameRoot, "gsc");
  const registrationPattern =
    /^\s*(?:[A-Za-z0-9_\\]+::)?addcmd\("([^"]+)",\s*::([A-Za-z0-9_]+),\s*::([A-Za-z0-9_]+),\s*(-?\d+),\s*(true|false)(.*)\);/;
  const registrations = new Map();

  for (const file of walk(sourceRoot, ".gsc")) {
    const relativeFile = path.relative(gameRoot, file);
    if (relativeFile.startsWith("gsc/cod2/maps/mp/")) continue;

    const source = fs.readFileSync(file, "utf8");
    for (const [index, line] of source.split(/\r?\n/).entries()) {
      const match = line.match(registrationPattern);
      if (!match || excludedCommands.has(match[1]) || cod4OnlyCommands.has(match[1])) continue;

      if (registrations.has(match[1])) {
        throw new Error(`Duplicate active registration for !${match[1]}.`);
      }

      registrations.set(match[1], {
        name: match[1],
        handler: match[2],
        helpHandler: match[3],
        minLevel: Number(match[4]),
        hidden: match[5] === "true",
        aliases: [...match[6].matchAll(/"([^"]+)"/g)].map((item) => item[1]),
        file,
        relativeFile,
        line: index + 1,
        rawLine: line.trim(),
        source,
      });
    }
  }

  return registrations;
}

function extractFunction(source, functionName) {
  const match = new RegExp(`^${escapeRegExp(functionName)}\\s*\\(([^\\n]*)\\)\\s*\\n\\{`, "m").exec(source);
  if (!match) return null;

  const openingBrace = source.indexOf("{", match.index);
  let depth = 0;
  let inString = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index];
    const previous = source[index - 1];
    if (character === '"' && previous !== "\\") inString = !inString;
    if (inString) continue;
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth !== 0) continue;

    const startLine = lineNumberAt(source, match.index);
    const functionSource = source.slice(match.index, index + 1);
    return {
      name: functionName,
      parameters: match[1].trim(),
      body: source.slice(openingBrace + 1, index),
      startLine,
      endLine: lineNumberAt(source, index),
      lines: functionSource.split(/\r?\n/).map((line, offset) => ({
        number: startLine + offset,
        text: line,
      })),
    };
  }

  return null;
}

function functionsCalledWithData(functionBody) {
  const callPattern = /(?:^|[;{}\s])(?:self\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*data\s*[,)]/gm;
  return [...new Set([...functionBody.matchAll(callPattern)].map((match) => match[1]))];
}

function collectEvidenceFunctions(registration) {
  const queue = [
    { name: registration.handler, role: "handler" },
    { name: registration.helpHandler, role: "help handler" },
  ];
  const functions = [];
  const roles = new Map();
  const unresolved = new Set();

  while (queue.length > 0) {
    const queued = queue.shift();
    if (!roles.has(queued.name)) roles.set(queued.name, new Set());
    roles.get(queued.name).add(queued.role);
    if (functions.some((item) => item.name === queued.name)) continue;

    const functionDefinition = extractFunction(registration.source, queued.name);
    if (!functionDefinition) {
      unresolved.add(queued.name);
      continue;
    }

    functions.push(functionDefinition);
    for (const callee of functionsCalledWithData(functionDefinition.body)) {
      if (!roles.has(callee)) queue.push({ name: callee, role: "called with data" });
    }
  }

  return {
    functions: functions.map((item) => ({ ...item, roles: [...(roles.get(item.name) ?? [])] })),
    unresolved: [...unresolved],
  };
}

function argumentReferences(functionBody) {
  const references = [...functionBody.matchAll(/(?<![A-Za-z0-9_.])data\s*\[\s*([^\]\r\n]+?)\s*\]/g)].map(
    (match) => `data[${match[1].replace(/\s+/g, " ").trim()}]`,
  );
  if (/(?<![A-Za-z0-9_.])data\.size\b/.test(functionBody)) references.push("data.size");
  return [...new Set(references)];
}

function caseLabels(functionBody) {
  return [...new Set([...functionBody.matchAll(/^\s*case\s+(.+?)\s*:\s*$/gm)].map((match) => match[1].trim()))];
}

function rawArgumentLines(functionDefinition) {
  const includesArgumentReference = /(?<![A-Za-z0-9_.])data\s*(?:\[|\.size\b)/;
  const passesData = /\(\s*data\s*[,)]/;
  const hasArgumentReference = includesArgumentReference.test(functionDefinition.body);
  const caseOrDefault = /^\s*(?:case\s+.+?|default)\s*:/;

  return functionDefinition.lines.filter(
    (line) =>
      includesArgumentReference.test(line.text) ||
      (line.number !== functionDefinition.startLine && passesData.test(line.text)) ||
      (hasArgumentReference && caseOrDefault.test(line.text)),
  );
}

function quotedLiterals(lines) {
  const values = [];
  for (const line of lines) {
    for (const match of line.text.matchAll(/"((?:\\.|[^"])*)"/g)) values.push(match[1]);
  }
  return [...new Set(values)];
}

function argumentProfile(references, cases) {
  const positionalIndexes = references
    .map((reference) => /^data\[(\d+)\]$/.exec(reference))
    .filter(Boolean)
    .map((match) => Number(match[1]))
    .filter((index) => index >= 2)
    .sort((left, right) => left - right);
  const metadataReferences = references.filter((reference) => /^data\[(?:0|1)\]$/.test(reference));
  const dynamicReferences = references.filter(
    (reference) => reference !== "data.size" && !/^data\[\d+\]$/.test(reference),
  );
  const checksSize = references.includes("data.size");
  const hasArgumentEvidence =
    positionalIndexes.length > 0 || dynamicReferences.length > 0 || checksSize || cases.length > 0;
  const deepReview = cases.length >= 4 || dynamicReferences.length > 0 || positionalIndexes.length >= 3;
  const tier = deepReview ? "Deep review" : hasArgumentEvidence ? "Argument check" : "Confirm no arguments";
  const signals = [];

  if (positionalIndexes.length > 0) {
    const slots = positionalIndexes.map((index) => index - 1);
    signals.push(`positional slot${slots.length === 1 ? "" : "s"} ${slots.join(", ")}`);
  }
  if (dynamicReferences.length > 0) signals.push("dynamic argument scan");
  if (checksSize) signals.push("argument-count check");
  if (cases.length > 0) signals.push(`${cases.length} case label${cases.length === 1 ? "" : "s"}`);
  if (signals.length === 0 && metadataReferences.length > 0) signals.push("command metadata only");
  if (signals.length === 0) signals.push("no direct argument references");

  return {
    tier,
    signals,
    positionalIndexes,
    metadataReferences,
    dynamicReferences,
    checksSize,
    hasArgumentEvidence,
  };
}

function reviewPrompt(profile, helpCount) {
  if (profile.tier === "Deep review") {
    return "Trace each syntax branch and verify accepted values, defaults, required arguments, and examples.";
  }
  if (profile.tier === "Argument check") {
    return "Verify the displayed usage against the observed positions, count checks, and accepted values.";
  }
  if (helpCount > 0) {
    return "Confirm that the command intentionally takes no arguments and that its in-game help is complete.";
  }
  return "Confirm that the command takes no arguments and add a concise help string if players need context.";
}

function renderCommand(command, registration) {
  const evidence = collectEvidenceFunctions(registration);
  const rawLinesByFunction = evidence.functions.map((functionDefinition) => ({
    functionDefinition,
    lines: rawArgumentLines(functionDefinition),
  }));
  const references = [
    ...new Set(evidence.functions.flatMap((functionDefinition) => argumentReferences(functionDefinition.body))),
  ];
  const cases = [
    ...new Set(evidence.functions.flatMap((functionDefinition) => caseLabels(functionDefinition.body))),
  ];
  const profile = argumentProfile(references, cases);
  const literals = quotedLiterals(rawLinesByFunction.flatMap((item) => item.lines));
  const aliases = command.aliases.length > 0 ? command.aliases.map((alias) => `!${alias}`).join(", ") : "none";
  const helpLines = command.help.length > 0
    ? command.help.map((line) => `- ${inlineCode(line)}`).join("\n")
    : "- None found by the command sync parser.";
  const functions = evidence.functions
    .map(
      (functionDefinition) =>
        `- ${inlineCode(`${functionDefinition.name}(${functionDefinition.parameters})`)} — ${functionDefinition.roles.join(", ")}; ` +
        `${inlineCode(`${registration.relativeFile}:${functionDefinition.startLine}-${functionDefinition.endLine}`)}`,
    )
    .join("\n");
  const rawEvidence = rawLinesByFunction
    .filter((item) => item.lines.length > 0)
    .map(
      ({ functionDefinition, lines }) =>
        `#### ${inlineCode(`${functionDefinition.name}(${functionDefinition.parameters})`)}\n\n` +
        `Source: ${inlineCode(`${registration.relativeFile}:${functionDefinition.startLine}-${functionDefinition.endLine}`)}\n\n` +
        "```gsc\n" +
        lines.map((line) => `${String(line.number).padStart(5, " ")} | ${line.text}`).join("\n") +
        "\n```",
    )
    .join("\n\n");
  const positionalSlots = profile.positionalIndexes.length > 0
    ? profile.positionalIndexes
      .map((index) => `${inlineCode(`data[${index}]`)} (argument ${index - 1})`)
      .join(", ")
    : "none found";
  const rawLineCount = rawLinesByFunction.reduce((total, item) => total + item.lines.length, 0);
  const rawEvidenceSection = rawEvidence
    ? `<details>\n<summary>Show ${rawLineCount} raw argument-related source line${rawLineCount === 1 ? "" : "s"}</summary>\n\n${rawEvidence}\n\n</details>`
    : "No raw data references or pass-through calls found.";

  return {
    markdown: `## !${command.name}\n\n` +
      `- Access: level ${command.levels.join(" / ")}\n` +
      `- Aliases: ${aliases}\n` +
      `- Hidden input: ${command.hidden ? "yes" : "no"}\n` +
      `- Current page usage: ${inlineCode(command.usage)}\n` +
      `- Current page summary: ${command.description}\n` +
      `- Registration: ${inlineCode(`${registration.relativeFile}:${registration.line}`)}\n` +
      `- Handler: ${inlineCode(`${registration.handler}(data)`)}\n` +
      `- Help handler: ${inlineCode(`${registration.helpHandler}(data)`)}\n\n` +
      `### Review summary\n\n` +
      `- Review tier: **${profile.tier}**\n` +
      `- Evidence footprint: ${profile.signals.join("; ")}\n` +
      `- Positional arguments observed: ${positionalSlots}\n` +
      `- Dynamic references: ${profile.dynamicReferences.length > 0 ? profile.dynamicReferences.map(inlineCode).join(", ") : "none found"}\n` +
      `- Reads ${inlineCode("data.size")}: ${profile.checksSize ? "yes" : "no"}\n` +
      `- Reviewer focus: ${reviewPrompt(profile, command.help.length)}\n\n` +
      `### In-game help strings collected by the existing sync\n\n${helpLines}\n\n` +
      `### Mechanical argument findings\n\n` +
      `- References: ${references.length > 0 ? references.map(inlineCode).join(", ") : "none found"}\n` +
      `- Case labels in data-referencing functions: ${cases.length > 0 ? cases.map(inlineCode).join(", ") : "none found"}\n` +
      `- Quoted literals on raw matching lines: ${literals.length > 0 ? literals.map(inlineCode).join(", ") : "none found"}\n` +
      `- Unresolved same-file functions called with data: ${evidence.unresolved.length > 0 ? evidence.unresolved.map(inlineCode).join(", ") : "none"}\n\n` +
      `### Evidence functions\n\n${functions}\n\n` +
      `### Raw argument-related matches\n\n${rawEvidenceSection}\n`,
    functionCount: evidence.functions.length,
    rawLineCount,
    referenceCount: references.length,
    profile,
  };
}

function render(commands, registrations) {
  const renderedCommands = commands.map((command) => {
    const registration = registrations.get(command.name);
    if (!registration) throw new Error(`No active source registration found for !${command.name}.`);
    return { command, ...renderCommand(command, registration) };
  });
  const extraRegistrations = [...registrations.keys()].filter(
    (name) => !commands.some((command) => command.name === name),
  );
  if (extraRegistrations.length > 0) {
    throw new Error(`Registrations missing from generated command data: ${extraRegistrations.join(", ")}`);
  }

  const totalFunctions = renderedCommands.reduce((total, item) => total + item.functionCount, 0);
  const totalRawLines = renderedCommands.reduce((total, item) => total + item.rawLineCount, 0);
  const commandsWithReferences = renderedCommands.filter((item) => item.referenceCount > 0).length;
  const reviewCounts = new Map(
    ["Deep review", "Argument check", "Confirm no arguments"].map((tier) => [
      tier,
      renderedCommands.filter((item) => item.profile.tier === tier).length,
    ]),
  );
  const indexRows = renderedCommands
    .map(
      ({ command, profile }, index) =>
        `| ${index + 1} | [${inlineCode(`!${command.name}`)}](#${command.name}) | ${command.levels.join(" / ")} | ${profile.tier} | ${profile.signals.join("; ")} | ${tableInlineCode(command.usage)} |`,
    )
    .join("\n");
  const reviewQueues = ["Deep review", "Argument check", "Confirm no arguments"]
    .map((tier) => {
      const matchingCommands = renderedCommands.filter((item) => item.profile.tier === tier);
      const explanation = tier === "Deep review"
        ? "Commands with dynamic indexing, at least three positional slots, or at least four case labels. Review these branch by branch."
        : tier === "Argument check"
          ? "Commands with a smaller direct argument footprint. Verify syntax, accepted values, and defaults."
          : "Commands with no direct argument evidence after same-file pass-through tracing. Confirm that argument-free usage is intentional.";
      const links = matchingCommands
        .map((item) => `[${inlineCode(`!${item.command.name}`)}](#${item.command.name})`)
      const linkRows = [];
      for (let index = 0; index < links.length; index += 8) {
        linkRows.push(`- ${links.slice(index, index + 8).join(", ")}`);
      }
      return `### ${tier} (${matchingCommands.length})\n\n${explanation}\n\n${linkRows.join("\n")}`;
    })
    .join("\n\n");

  return `# Command argument source inventory\n\n` +
    `> Generated by ${inlineCode("scripts/audit-command-arguments.mjs")}. Do not hand-edit this file; update the generator or source documentation and regenerate it.\n\n` +
    `This inventory gives reviewers traceable evidence for every active command. It deliberately separates observed source facts from semantic conclusions: the scan does not decide whether an argument is required, whether a branch is reachable, or what a value means.\n\n` +
    `- Commands: ${commands.length}\n` +
    `- Active registrations: ${registrations.size}\n` +
    `- Evidence functions: ${totalFunctions}\n` +
    `- Commands with bracket/size references: ${commandsWithReferences}\n` +
    `- Raw matching source lines: ${totalRawLines}\n` +
    `- Deep review: ${reviewCounts.get("Deep review")}\n` +
    `- Argument check: ${reviewCounts.get("Argument check")}\n` +
    `- Confirm no arguments: ${reviewCounts.get("Confirm no arguments")}\n` +
    `- Source root used by the generator: ${inlineCode(path.relative(projectRoot, gameRoot) || ".")}\n` +
    `- Regenerate: ${inlineCode("npm run audit:command-arguments")}\n` +
    `- Verify: ${inlineCode("npm run check:command-arguments")}\n\n` +
    `## How to use this audit\n\n` +
    `1. Start with the deep-review queue, then work through argument checks and argument-free confirmations.\n` +
    `2. Compare the current page usage and summary with the collected in-game help.\n` +
    `3. Use the argument footprint to locate positional slots, loops over arguments, size checks, and switch branches.\n` +
    `4. Read the cited function and raw source lines before changing user-facing wording.\n` +
    `5. Update the canonical source or sync overrides, regenerate both command data and this audit, then run both checks and the build.\n\n` +
    `### Evidence rules and limitations\n\n` +
    `- ${inlineCode("data[0]")} and ${inlineCode("data[1]")} are reported as command metadata; positional command arguments begin at ${inlineCode("data[2]")}.\n` +
    `- The scan follows same-file functions only when unchanged ${inlineCode("data")} is passed as the first argument. Renamed, transformed, stored, or cross-file values are not traced.\n` +
    `- Case labels and quoted literals are candidates, not automatically accepted user input. They may belong to an adjacent branch or internal mode.\n` +
    `- Dynamic indexes such as ${inlineCode("data[i]")} and ${inlineCode("data.size")} checks identify variable input but do not establish minimum or maximum arity.\n` +
    `- Raw evidence is intentionally narrow. Open the cited function for surrounding control flow before documenting behavior.\n\n` +
    `## Review queues\n\n${reviewQueues}\n\n` +
    `## Command index\n\n` +
    `| # | Command | Level | Review tier | Evidence footprint | Current usage |\n` +
    `|---:|---|---:|---|---|---|\n${indexRows}\n\n` +
    renderedCommands.map((item) => item.markdown).join("\n");
}

for (const requiredPath of [path.join(gameRoot, "gsc"), commandDataPath]) {
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`Required source not found at ${requiredPath}. Set J4L_GAME_REPO when the game repo is elsewhere.`);
  }
}

const commands = parseGeneratedCommands();
const registrations = parseRegistrations();
const output = render(commands, registrations);

if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== output) {
    console.error("Command argument audit is out of date. Run `npm run audit:command-arguments`.");
    process.exitCode = 1;
  } else {
    console.log(`Command argument audit is current (${commands.length} commands).`);
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
  console.log(`Wrote argument evidence for ${commands.length} commands to ${path.relative(projectRoot, outputPath)}.`);
}
