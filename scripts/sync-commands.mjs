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
  addtime: "Adds minutes to the current map; level 80+ admins can also remove time.",
  addxp: "Adds a positive amount of rank XP to a connected player.",
  afk: "Pauses an active run while you remain still, or checks another player's AFK status.",
  alias: "Shows a connected player's most-used recorded names and preferred name.",
  allowvote: "Enables voting, disables it, or schedules it to return after 5-45 minutes.",
  ambiant: "Controls the fallback server ambient sound.",
  anglehelper: "Enables or disables the strafe-angle helper HUD.",
  autobhop: "Enables or disables automatic jumping after holding jump for 500 ms.",
  autoload: "Enables or disables the height-triggered automatic load behavior.",
  autoreset: "Controls whether loading without a save automatically resets run statistics.",
  autostand: "Controls whether loading a position automatically returns you to standing.",
  banplayer: "Bans a connected player's account and IP for one year, then disconnects them.",
  battle: "Chooses the record, player, or grenade benchmark shown by the battle HUD.",
  bounce: "Shows or temporarily overrides COD4-style bounce collision for the current map.",
  build: "Runs the map-specific building tool on jm_build2 and jm_builder.",
  changemap: "Searches for a map and changes to the selected result.",
  checkpointsound: "Controls the sound played when passing a checkpoint.",
  classicmode: "Enables or disables the map's classic/funmode route and resets the current run.",
  clonetheme: "Copies a connected player's custom theme and switches to it.",
  commands: "Lists the canonical commands available at your current admin level.",
  confirmvote: "Stores a 4-10 digit PIN to confirm the player's map-contest vote.",
  country: "Shows the detected country of a connected player.",
  cpt: "Builds, publishes, lists, renames, and deletes checkpoint routes for the current map.",
  crosshair: "Enables or disables the player's crosshair.",
  csc: "Enables or disables cross-server chat for the player.",
  customtheme: "Builds a custom HUD theme from colors, templates, toggles, or an existing theme.",
  deleterec: "Deletes a ranked record after repeating the same selection to confirm it.",
  donated: "Sets or revokes a connected player's donation status.",
  draw2d: "Enables or disables all 2D HUD drawing for the player.",
  drawdist: "Sets a non-negative client draw distance; zero disables the override.",
  drawgun: "Shows, hides, or toggles the first-person weapon model.",
  enablesave: "Force-enables or disables saving; enabling a blocked save marks the run cheated.",
  endmap: "Starts an end-map vote when no equal- or higher-level admin is online.",
  english: "Plays an English-language reminder for a selected player.",
  fignore: "Persistently ignores chat from a connected player.",
  findmap: "Searches the map list using one or more name fragments.",
  fmute: "Mutes a connected player for one hour.",
  fog: "Enables or disables client fog rendering.",
  forceteam: "Locks a lower-level player to a team, or removes that lock.",
  forcespec: "Moves yourself or a lower-level player to spectators once.",
  fov: "Sets FOV from 13 to 160 or cycles through preset values.",
  fps: "Sets max FPS to a supported value or cycles through presets.",
  frename: "Immediately enforces a temporary name on a lower-level player.",
  fullscreennotification: "Enables or disables fullscreen save/load notifications.",
  funignore: "Stops persistently ignoring chat from a connected player.",
  funmute: "Removes a forced mute from a connected player.",
  getlist: "Lists connected players with country, admin level, entity number, and name.",
  givebacksave: "Restores a deleted checkpoint pass to its connected player on the matching map.",
  gun: "Enables, disables, or toggles weapon use for the player.",
  hate: "Runs the map-specific effect on jm_tech.",
  help: "Shows command-specific help by canonical name or alias.",
  howmany: "Shows how many maps you or a connected player have fully finished.",
  hudedit: "Opens the in-game HUD editor.",
  huds: "Controls record, statistics, timing, and grenade HUD components.",
  ignore: "Ignores a connected player's messages for the current map session.",
  jumptimer: "Shows or hides the jump-power restoration countdown.",
  kick: "Kicks a lower-level player with an optional reason.",
  killplayer: "Kills yourself or a lower-level connected player who is actively playing.",
  mapinfo: "Shows metadata for the current map or a searched map.",
  measure: "Controls the measurement numbers, graph, maximum-speed, and color displays.",
  hello: "Plays a random song or taunt, subject to a shared cooldown.",
  maze: "Runs the map-specific maze command on maze.",
  moveteam: "Moves a lower-level player to a team once without locking future team changes.",
  mute: "Mutes yourself or a lower-level player for the current live session.",
  myid: "Shows your persistent player account ID.",
  nadecheat: "Controls grenade-damage cheats and grenade-angle diagnostics.",
  nades: "Enables or disables grenades for yourself or a lower-level player.",
  noclip: "Toggles noclip, optionally using a movement-speed value from 1 to 50.",
  nominate: "Searches for and nominates a map for the next-map rotation.",
  nowaypoints: "Enables or disables hiding checkpoint waypoints.",
  osmode: "Enables or disables old-school movement and its separate record category.",
  personalbest: "Shows your best result for the current route or every route.",
  personalbestplayer: "Shows another player's best result for the current route or every route.",
  pm: "Sends a private free-text message to another player.",
  players: "Lists players across the linked Jump4Life servers.",
  pistol: "Selects a game-specific pistol, with the donor pistol restricted to donors.",
  poll: "Starts a yes/no poll with a free-text question.",
  promote: "Sets a connected player's admin level subject to hierarchy and caller-specific caps.",
  pstats: "Opens the player-statistics menu for yourself or a connected player.",
  pusher: "Controls the map-specific pusher on mp_izno3.",
  rename: "Changes a lower-level player's current name.",
  replayanimdebug: "Prints current and matching movement-animation names for replay diagnostics.",
  replayexit: "Stops the active replay and returns the player to normal state.",
  replayfpshud: "Toggles the FPS display during replay playback; it starts enabled.",
  replayhud: "Toggles all 2D HUD drawing during replay playback.",
  replaykeyhud: "Toggles the replay key-input display; it starts disabled.",
  replaynextcp: "Seeks to the next recorded checkpoint during replay playback.",
  replaypause: "Pauses or resumes the active replay.",
  replayprevcp: "Seeks to the previous recorded checkpoint during replay playback.",
  replayskip: "Requests a manual skip ahead in the active replay.",
  replayspeedhud: "Toggles the replay speed display; it starts disabled.",
  replaytimerhud: "Toggles the replay timer display; it starts disabled.",
  reset: "Immediately abandons the current run state and starts a fresh run.",
  removexp: "Removes a positive amount of rank XP from a connected player, clamped at zero.",
  runid: "Shows the current run ID for you or a connected player.",
  saybold: "Prints a bold free-text message to players who are not ignoring the sender.",
  savelist: "Changes saved-run history sorting and refreshes the history menu.",
  saverun: "Protects the current unfinished run's replay metadata from cleanup for six months.",
  savesettings: "Queues persistence of the current player preferences and writes the client settings config.",
  servers: "Opens the linked-server menu or connects to one uniquely matched compatible server.",
  setauthor: "Sets the current map's author metadata.",
  setdate: "Sets the current map's release date metadata.",
  setprefname: "Stores the name used for the player's records after the next map change.",
  shock: "Applies the configured seven-second shellshock effect to an active lower-level player.",
  showclips: "Shows or hides map clip models for the player on COD2.",
  showcpid: "Shows or hides checkpoint IDs used while building multiroute checkpoints.",
  spawnpoint: "Adds the caller's position as a map spawn or purges every map spawn.",
  specfix: "Repairs a stuck COD2 spectator by reapplying spectator orientation.",
  speclist: "Lists visible spectators watching you or your current spectator target.",
  startmusic: "Enables the player's map music while not following another player.",
  stopmusic: "Disables the player's map music and returns to fallback ambient behavior.",
  taunt: "Plays a selected quick-message category, row, and sound variant.",
  taunts: "Enables or disables receiving player taunts.",
  teleplayer: "Teleports an active lower-level target to the active caller's position.",
  teleport: "Teleports you to another active player's position.",
  telesave: "Loads another active player's latest saved position and checkpoint state.",
  temppromote: "Temporarily sets a connected player's live admin level below the caller's level.",
  theme: "Selects, cycles, or lists an available HUD theme.",
  thirdperson: "Enables or disables third-person view.",
  unignore: "Stops ignoring a connected player's chat for the current map session.",
  unmute: "Removes a live mute when the caller has sufficient authority.",
  veto: "Vetoes the active vote when caller and vote-starter policy permit it.",
  viewrecords: "Opens the record leaderboard for a searched map.",
  vignore: "Mutes a connected player's voice locally for the caller.",
  vote: "Starts a supported map, time, mute, restart, disable, or grenade vote.",
  vunignore: "Unmutes a connected player's voice locally for the caller.",
  xpmultiplier: "Sets the server checkpoint XP multiplier from 1x through 10x; off means 1x.",
};

const usageOverrides = {
  addtime: "!addtime [minutes]",
  addxp: "!addxp [player] [amount]",
  afk: "!afk | !afk [player]",
  alias: "!alias [player]",
  allowvote: "!allowvote [on/off/5-45]",
  ambiant: "!ambiant [on/off/toggle/cycle]",
  anglehelper: "!anglehelper [on/off]",
  autobhop: "!autobhop [on/off]",
  autoload: "!autoload [on/off]",
  autoreset: "!autoreset [on/off]",
  autostand: "!autostand [on/off]",
  banplayer: "!banplayer [player]",
  battle: "!battle [private/public] | !battle player [player] | !battle nades [mode] | !battle record [filters]",
  bounce: "!bounce [status/on/off]",
  changemap: "!changemap [map name]",
  checkpointsound: "!checkpointsound [on/off/toggle/cycle/default/none]",
  classicmode: "!classicmode [on/off]",
  clonetheme: "!clonetheme [player]",
  commands: "!commands",
  confirmvote: "!confirmvote [pin]",
  country: "!country [player]",
  cpt: "!cpt [radius <units>] [trigger <name>] [type <flags>] [event <name>] [entity]",
  crosshair: "!crosshair [on/off]",
  csc: "!csc [on/off]",
  customtheme: "!customtheme [item] [value...] | !customtheme reset | !customtheme import [theme]",
  deleterec: "!deleterec [time/save/load/jump/nades] [fps/mix] [rank 1-10]",
  donated: "!donated [player] [1/0]",
  draw2d: "!draw2d [on/off]",
  drawdist: "!drawdist [distance >= 0]",
  drawgun: "!drawgun [on/off/toggle]",
  enablesave: "!enablesave [on/off]",
  endmap: "!endmap",
  english: "!english [player]",
  fignore: "!fignore [player]",
  findmap: "!findmap [map name]",
  fmute: "!fmute [player]",
  fog: "!fog [on/off]",
  forceteam: "!forceteam [allies/axis/spectator/none] [player]",
  forcespec: "!forcespec [player]",
  fov: "!fov [13-160/cycle]",
  fps: "!fps [43/76/125/250/333/1000/cycle]",
  frename: "!frename [player] [new name...] | !frename [player] NULL",
  fullscreennotification: "!fullscreennotification [on/off]",
  funignore: "!funignore [player]",
  funmute: "!funmute [player]",
  getlist: "!getlist",
  givebacksave: "!givebacksave [checkpoint pass ID]",
  gun: "!gun [on/off/toggle]",
  help: "!help [command]",
  hello: "!hello",
  howmany: "!howmany [player]",
  hudedit: "!hudedit",
  huds: "!huds [on/off] | !huds stat [on/off] | !huds rec [on/off/full/smart] | !huds seconds [small/large] | !huds [nades/rpgs] [on/off]",
  ignore: "!ignore [player]",
  jumptimer: "!jumptimer [on/off]",
  kick: "!kick [player] [reason...]",
  killplayer: "!killplayer [player]",
  mapinfo: "!mapinfo [map name]",
  measure: "!measure [numbers/graph/maxspeed/color] [on/off]",
  moveteam: "!moveteam [allies/axis/spectator] [player]",
  mute: "!mute [player]",
  myid: "!myid",
  nadecheat: "!nadecheat [on/off/99/angle]",
  nades: "!nades [player] [on/off]",
  noclip: "!noclip [speed 1-50]",
  nominate: "!nominate [map name]",
  nowaypoints: "!nowaypoints [on/off]",
  osmode: "!osmode [on/off]",
  personalbest: "!personalbest [time/save/load/jump] [43/76/125/250/333/mix] [all]",
  personalbestplayer: "!personalbestplayer [player] [time/save/load/jump] [43/76/125/250/333/mix] [all]",
  pm: "!pm [player] [message...]",
  pistol: "!pistol [pistol name]",
  players: "!players [server-name fragment]",
  poll: "!poll [question...]",
  promote: "!promote [player] [admin level -1 to 99]",
  pstats: "!pstats [player]",
  rename: "!rename [player] [new name...]",
  replaynextcp: "!replaynextcp",
  replayanimdebug: "!replayanimdebug",
  replayexit: "!replayexit",
  replayfpshud: "!replayfpshud",
  replayhud: "!replayhud",
  replaykeyhud: "!replaykeyhud",
  replaypause: "!replaypause",
  replayprevcp: "!replayprevcp",
  replayskip: "!replayskip",
  replayspeedhud: "!replayspeedhud",
  replaytimerhud: "!replaytimerhud",
  reset: "!reset",
  removexp: "!removexp [player] [amount]",
  runid: "!runid [player]",
  saybold: "!saybold [message...]",
  savelist: "!savelist [cps/time/date]",
  saverun: "!saverun",
  savesettings: "!savesettings",
  servers: "!servers | !servers join [server-name fragment]",
  setauthor: "!setauthor [author...]",
  setdate: "!setdate [YYYY] [MM] [DD]",
  setprefname: "!setprefname [preferred name...]",
  shock: "!shock [player]",
  showclips: "!showclips [on/off/toggle]",
  showcpid: "!showcpid [on/off/toggle]",
  spawnpoint: "!spawnpoint [put/purge]",
  specfix: "!specfix",
  speclist: "!speclist",
  startmusic: "!startmusic",
  stopmusic: "!stopmusic",
  taunt: "!taunt [category 1-3] [row 1-9] [variant]",
  taunts: "!taunts [on/off]",
  teleplayer: "!teleplayer [player]",
  teleport: "!teleport [player]",
  telesave: "!telesave [player]",
  temppromote: "!temppromote [player] [admin level 0 to caller-1]",
  theme: "!theme [default/matrix/egz/custom/cycle]",
  thirdperson: "!thirdperson [on/off]",
  unignore: "!unignore [player]",
  unmute: "!unmute [player]",
  veto: "!veto",
  viewrecords: "!viewrecords [map name]",
  vignore: "!vignore [player]",
  vote: "!vote [map/addtime/mute/map_rotate/map_restart/disable/nades] [value]",
  vunignore: "!vunignore [player]",
  xpmultiplier: "!xpmultiplier [off/1-10/1x-10x]",
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
    const translatedLine = translations.get(match[1]);
    if (!translatedLine && /^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(match[1])) continue;
    result.push(translatedLine ?? stripGameFormatting(match[1]));
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
        help: [...new Set(help)],
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
    existing.help = [...new Set([...existing.help, ...command.help])];
    existing.levels = [...new Set([...existing.levels, ...command.levels])].sort((a, b) => a - b);
    existing.minLevel = Math.min(...existing.levels);
  }

  return [...merged.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function render(commands) {
  const rows = commands.map((command) => `  ${JSON.stringify(command)},`).join("\n");
  return `// Generated by \`npm run sync:commands\` from ../jump4life. Do not edit manually.\n\nexport interface GameCommand {\n  name: string;\n  aliases: string[];\n  minLevel: number;\n  levels: number[];\n  hidden: boolean;\n  usage: string;\n  description: string;\n  help: string[];\n  source: string;\n}\n\nexport const gameCommands: GameCommand[] = [\n${rows}\n];\n`;
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
