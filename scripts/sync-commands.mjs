import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const gameRoot = process.env.J4L_GAME_REPO
  ? path.resolve(process.env.J4L_GAME_REPO)
  : path.resolve(projectRoot, "../jump4life");
const outputPath = path.join(projectRoot, "src/data/commands.ts");
const checkOnly = process.argv.includes("--check");

const cod4OnlyCommands = new Set(["dontspecme", "minimap", "viewbob"]);
const excludedCommands = new Set(["hideme"]);

const descriptionOverrides = {
  battle: "Toggles the battle minigame HUD and challenge controls.",
  build: "Runs the map-specific building tool on jm_build2 and jm_builder.",
  csc: "Toggles the custom client-side collision setting.",
  hate: "Runs the map-specific effect on jm_tech.",
  howmany: "Shows how many players are currently connected.",
  hudedit: "Opens the in-game HUD editor.",
  hello: "Prints a multilingual greeting in chat.",
  maze: "Runs the map-specific maze command on maze.",
  players: "Lists players across the linked Jump4Life servers.",
  pusher: "Controls the map-specific pusher on mp_izno3.",
  replayfpshud: "Toggles the FPS display during replay playback.",
  replayanimdebug: "Toggles replay animation debugging information.",
  replayhud: "Toggles all replay playback HUD elements.",
  replaykeyhud: "Toggles the key input display during replay playback.",
  replaynextcp: "Jumps to the next checkpoint during replay playback.",
  replayprevcp: "Jumps to the previous checkpoint during replay playback.",
  replayspeedhud: "Toggles the speed display during replay playback.",
  replaytimerhud: "Toggles the timer display during replay playback.",
};

const usageOverrides = {
  changemap: "!changemap [map name]",
  confirmvote: "!confirmvote [pin]",
  findmap: "!findmap [map name]",
  help: "!help [command]",
  personalbest: "!personalbest [time/load/save/jump] [fps/mix]",
  personalbestplayer: "!personalbestplayer [player] [time/load/save/jump] [fps/mix]",
  pm: "!pm [player] [message]",
  replaynextcp: "!replaynextcp",
  replayprevcp: "!replayprevcp",
  setprefname: "!setprefname [preferred name]",
  vote: "!vote [type] [value]",
};

function walk(directory, extension, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const itemPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(itemPath, extension, result);
    } else if (itemPath.endsWith(extension)) {
      result.push(itemPath);
    }
  }
  return result;
}

function stripGameFormatting(value) {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\^[0-9]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTranslations() {
  const translations = new Map();
  const translationRoot = path.join(gameRoot, "gsc/shared/translations");

  for (const file of walk(translationRoot, ".txt")) {
    let reference = null;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const referenceMatch = line.match(/^REFERENCE\s+(.+)$/);
      if (referenceMatch) {
        reference = referenceMatch[1].trim();
        continue;
      }

      const englishMatch = line.match(/^LANG_EN\s+"(.*)"\s*$/);
      if (reference && englishMatch) {
        translations.set(reference, stripGameFormatting(englishMatch[1]));
      }
    }
  }

  return translations;
}

function parseDocumentation() {
  const descriptions = new Map();
  const source = fs.readFileSync(path.join(gameRoot, "docs/IN_GAME_COMMANDS.md"), "utf8");

  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\| `!([^`]+)` \| .*? \| (?:yes|no) \| (.*?) \|$/);
    if (!match) continue;

    const description = match[2]
      .replace(/`/g, "")
      .replace(/ Candidate for review.*$/i, "")
      .replace(/ Exact usefulness should be reviewed\.?$/i, "")
      .replace(/ Needs review; name is unclear\.?$/i, "")
      .trim();
    descriptions.set(match[1], description);
  }

  return descriptions;
}

function extractFunctionBody(source, functionName) {
  const escapedName = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^${escapedName}\\s*\\([^\\n]*\\)\\s*\\n\\{`, "m").exec(source);
  if (!match) return "";

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
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  return "";
}

function helpLines(source, helpFunction, translations) {
  const body = extractFunctionBody(source, helpFunction);
  const result = [];
  const callPattern = /(?:locprintln|locPrintLn|iprintln|iprintlnbold)(?:_alternative)?\s*\(\s*"([^"]+)"/gi;

  for (const match of body.matchAll(callPattern)) {
    result.push(translations.get(match[1]) ?? stripGameFormatting(match[1]));
  }

  return result.filter(Boolean);
}

function parseRegistrations(translations, documentation) {
  const sourceRoot = path.join(gameRoot, "gsc");
  const registrations = [];
  const registrationPattern = /^\s*(?:[A-Za-z0-9_\\]+::)?addcmd\("([^"]+)",\s*::([A-Za-z0-9_]+),\s*::([A-Za-z0-9_]+),\s*(-?\d+),\s*(true|false)(.*)\);/;

  for (const file of walk(sourceRoot, ".gsc")) {
    const source = fs.readFileSync(file, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(registrationPattern);
      if (!match) continue;

      const name = match[1];
      const relativeFile = path.relative(gameRoot, file);
      if (
        excludedCommands.has(name) ||
        cod4OnlyCommands.has(name) ||
        relativeFile.startsWith("gsc/cod2/maps/mp/")
      ) {
        continue;
      }
      const help = helpLines(source, match[3], translations);
      const usageHelp = help.find((item) => /usage:/i.test(item) && item.includes("!"));
      const firstHelpLine = help.find((item) => !/usage:|available options/i.test(item));
      const aliases = [...match[6].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
      let usage = usageOverrides[name] ?? usageHelp?.replace(/^.*?usage:\s*/i, "") ?? `!${name}`;
      usage = usage.replace(/![a-z0-9_-]+/i, `!${name}`);

      registrations.push({
        name,
        aliases,
        minLevel: Number(match[4]),
        levels: [Number(match[4])],
        hidden: match[5] === "true",
        usage: stripGameFormatting(usage),
        description:
          descriptionOverrides[name] ??
          documentation.get(name) ??
          firstHelpLine ??
          `Runs the ${name} in-game command.`,
        source: relativeFile,
      });
    }
  }

  const merged = new Map();
  for (const command of registrations) {
    const existing = merged.get(command.name);
    if (!existing) {
      merged.set(command.name, command);
      continue;
    }

    existing.aliases = [...new Set([...existing.aliases, ...command.aliases])];
    existing.levels = [...new Set([...existing.levels, ...command.levels])].sort((a, b) => a - b);
    existing.minLevel = Math.min(...existing.levels);
  }

  return [...merged.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function render(commands) {
  const rows = commands.map((command) => `  ${JSON.stringify(command)},`).join("\n");
  return `// Generated by \`npm run sync:commands\` from ../jump4life. Do not edit manually.\n\nexport interface GameCommand {\n  name: string;\n  aliases: string[];\n  minLevel: number;\n  levels: number[];\n  hidden: boolean;\n  usage: string;\n  description: string;\n  source: string;\n}\n\nexport const gameCommands: GameCommand[] = [\n${rows}\n];\n`;
}

for (const requiredPath of [path.join(gameRoot, "gsc"), path.join(gameRoot, "docs/IN_GAME_COMMANDS.md")]) {
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`Jump4Life source not found at ${requiredPath}. Set J4L_GAME_REPO to override the default path.`);
  }
}

const commands = parseRegistrations(parseTranslations(), parseDocumentation());
const output = render(commands);

if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== output) {
    console.error("Command data is out of date. Run `npm run sync:commands`.");
    process.exitCode = 1;
  } else {
    console.log(`Command data is current (${commands.length} commands).`);
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
  console.log(`Wrote ${commands.length} commands to ${path.relative(projectRoot, outputPath)}.`);
}
