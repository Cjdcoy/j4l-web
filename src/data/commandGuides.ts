export interface CommandGuideOption {
  name: string;
  description: string;
}

export interface CommandGuideItem {
  command: string;
  description: string;
  options?: CommandGuideOption[];
}

export interface CommandGuideSection {
  title: string;
  introduction?: string;
  syntax?: string;
  items: CommandGuideItem[];
  examples?: string[];
  note?: string;
}

export interface CommandGuide {
  introduction: string;
  sections: CommandGuideSection[];
}

export const commandGuides: Partial<Record<string, CommandGuide>> = {
  replayanimdebug: {
    introduction:
      "Prints animation diagnostics for movement and replay development. Despite its name, it is not a toggle and does not require an active replay.",
    sections: [
      {
        title: "Animation diagnostics",
        syntax: "!replayanimdebug",
        items: [
          { command: "!replayanimdebug / !rad", description: "Prints the current leg animation when available, followed by animation names matching jump, fall, land, and air patterns." },
        ],
        note: "Output goes to both the player and server console and can be lengthy. Extra arguments are ignored.",
      },
    ],
  },
  replayexit: {
    introduction: "Stops the active replay and begins asynchronous replay cleanup.",
    sections: [
      {
        title: "Exit playback",
        syntax: "!replayexit",
        items: [
          { command: "!replayexit / !rx", description: "Marks the replay as exited, ends its loading state, stops playback, and schedules cleanup." },
        ],
        note: "The command silently does nothing outside replay mode. Extra arguments are ignored.",
      },
    ],
  },
  replayfpshud: {
    introduction: "Toggles the replay-only FPS readout, which starts enabled when replay controls are initialized.",
    sections: [
      {
        title: "Replay FPS",
        syntax: "!replayfpshud",
        items: [
          { command: "!replayfpshud / !rf", description: "Hides the FPS readout when enabled, or shows it when disabled." },
        ],
        note: "Outside replay mode the handler hides the replay FPS element instead of toggling it. Extra arguments are ignored.",
      },
    ],
  },
  replayhud: {
    introduction: "Toggles all 2D HUD drawing and replay controls during active replay playback.",
    sections: [
      {
        title: "Replay HUD",
        syntax: "!replayhud",
        items: [
          { command: "!replayhud / !rh", description: "Switches the client-wide 2D HUD between visible and hidden and updates replay-control visibility." },
        ],
        note: "Outside replay mode the handler forces 2D drawing on and clears replay text and controls. This is broader than toggling only replay-owned elements.",
      },
    ],
  },
  replaykeyhud: {
    introduction: "Toggles the replay key-input display, which starts disabled.",
    sections: [
      {
        title: "Replay keys",
        syntax: "!replaykeyhud",
        items: [
          { command: "!replaykeyhud / !rk", description: "Shows or hides the keys recorded for replay playback." },
        ],
        note: "Outside replay mode the handler hides the key display. Extra arguments are ignored.",
      },
    ],
  },
  replaynextcp: {
    introduction: "Seeks an active replay to the next recorded checkpoint.",
    sections: [
      {
        title: "Next checkpoint",
        syntax: "!replaynextcp",
        items: [
          { command: "!replaynextcp / !rnext", description: "Requests the next checkpoint and seeks to its recorded sample and tick when one exists." },
        ],
        note: "The playback loop reports when there is no next checkpoint. Outside replay mode the command silently does nothing.",
      },
    ],
  },
  replaypause: {
    introduction: "Requests a pause or resume transition for the active replay.",
    sections: [
      {
        title: "Pause playback",
        syntax: "!replaypause",
        items: [
          { command: "!replaypause / !rp", description: "Toggles between paused and playing when the playback loop consumes the request." },
        ],
        note: "The command silently does nothing outside replay mode. Extra arguments are ignored.",
      },
    ],
  },
  replayprevcp: {
    introduction: "Seeks an active replay to the previous recorded checkpoint.",
    sections: [
      {
        title: "Previous checkpoint",
        syntax: "!replayprevcp",
        items: [
          { command: "!replayprevcp / !rprev", description: "Requests the previous checkpoint and seeks to its recorded sample and tick when one exists." },
        ],
        note: "The playback loop reports when there is no previous checkpoint. Outside replay mode the command silently does nothing.",
      },
    ],
  },
  replayskip: {
    introduction: "Requests a manual skip ahead during active replay playback.",
    sections: [
      {
        title: "Skip replay",
        syntax: "!replayskip",
        items: [
          { command: "!replayskip / !rs", description: "Queues the replay loop's manual skip operation." },
        ],
        note: "Manual skip is consumed only while playback is not paused. It is separate from the replay's default-enabled automatic skip behavior.",
      },
    ],
  },
  replayspeedhud: {
    introduction: "Toggles the replay speed display, which starts disabled.",
    sections: [
      {
        title: "Replay speed",
        syntax: "!replayspeedhud",
        items: [
          { command: "!replayspeedhud / !rsh", description: "Shows or hides the replay speed meter." },
        ],
        note: "Outside replay mode the handler hides the speed meter. Extra arguments are ignored.",
      },
    ],
  },
  replaytimerhud: {
    introduction: "Toggles the replay jump-timer display, which starts disabled.",
    sections: [
      {
        title: "Replay timer",
        syntax: "!replaytimerhud",
        items: [
          { command: "!replaytimerhud / !rt", description: "Shows or hides the timer during replay playback." },
        ],
        note: "Outside replay mode the handler hides the timer element. Extra arguments are ignored.",
      },
    ],
  },
  reset: {
    introduction: "Immediately abandons the current run state and starts a fresh run-state allocation.",
    sections: [
      {
        title: "Reset run",
        syntax: "!reset",
        items: [
          { command: "!reset", description: "Marks an existing run as reset, clears current statistics and replay recording state, and queues creation of a new run ID." },
        ],
        note: "Unlike the menu reset path, this command pre-authorizes the action and does not ask for confirmation. Extra arguments are ignored.",
      },
    ],
  },
  runid: {
    introduction: "Prints the active database-backed run ID for you or a connected player.",
    sections: [
      {
        title: "Run identifier",
        syntax: "!runid [player]",
        items: [
          { command: "!runid", description: "Shows your current run ID." },
          { command: "!runid <player>", description: "Shows the selected connected player's current run ID." },
        ],
        note: "An unresolved player reports an error. The ID may reflect run initialization or reset state rather than a finished result.",
      },
    ],
  },
  savelist: {
    introduction: "Changes how the saved-run history is sorted and refreshes that history; it does not directly print a save list.",
    sections: [
      {
        title: "History ordering",
        syntax: "!savelist <cps|time|date>",
        items: [
          { command: "cps", description: "Orders saved-run history by checkpoint count." },
          { command: "time", description: "Orders saved-run history by run time." },
          { command: "date", description: "Orders saved-run history by date; this is also the documented default." },
        ],
        note: "The refresh runs asynchronously and reopens the history menu. Unknown or missing values show command help.",
      },
    ],
  },
  saverun: {
    introduction: "Protects the current unfinished run's replay metadata from normal retention cleanup for six months.",
    sections: [
      {
        title: "Protect replay metadata",
        syntax: "!saverun",
        items: [
          { command: "!saverun", description: "Queues a retention update for the active positive run ID when that run has not ended." },
        ],
        note: "This command does not export the run or save the player's current position. It reports protection immediately, before the asynchronous database result is known.",
      },
    ],
  },
  savesettings: {
    introduction: "Persists the current collection of player preferences and writes the client settings configuration.",
    sections: [
      {
        title: "Save preferences",
        syntax: "!savesettings",
        items: [
          { command: "!savesettings / !save", description: "Collects the current shared and game-specific settings, queues database upserts in chunks, removes legacy settings, and writes client configuration." },
        ],
        note: "The success message is printed before all asynchronous writes are confirmed. Extra arguments are ignored.",
      },
    ],
  },
  servers: {
    introduction: "Browses compatible linked servers or connects to a uniquely matched server.",
    sections: [
      {
        title: "Server browser",
        syntax: "!servers",
        items: [
          { command: "!servers", description: "Opens the linked-server selection menu." },
          { command: "!servers join <fragment>", description: "Searches same-version servers by one server-name fragment, excluding the current server, and connects only when exactly one result matches." },
        ],
        note: "Multiple matches are refused. A level-100 caller may be connected to a passworded matched server with its stored password supplied to the client.",
      },
    ],
  },
  shock: {
    introduction: "Applies the server's seven-second shellshock effect to an actively playing target.",
    sections: [
      {
        title: "Shellshock player",
        syntax: "!shock <player>",
        items: [
          { command: "<player>", description: "Selects yourself or a connected active player below your admin level." },
        ],
        note: "Spectators cannot be shocked. The action is announced server-wide and self-targeting is allowed.",
      },
    ],
  },
  showclips: {
    introduction: "Controls visibility of map clip-model geometry for the player on COD2 servers.",
    sections: [
      {
        title: "Clip visualization",
        syntax: "!showclips <on|off|toggle>",
        items: [
          { command: "on", description: "Shows every registered clip model to the player." },
          { command: "off", description: "Hides registered clip models from the player." },
          { command: "toggle", description: "Inverts the current per-player setting." },
        ],
        note: "The command is registered only on COD2 and reports when the current map has no supported clip models.",
      },
    ],
  },
  showcpid: {
    introduction: "Controls checkpoint-ID labels used when creating or inspecting multiroute checkpoints.",
    sections: [
      {
        title: "Checkpoint identifiers",
        syntax: "!showcpid <on|off|toggle>",
        items: [
          { command: "on", description: "Enables checkpoint-ID labels." },
          { command: "off", description: "Disables checkpoint-ID labels." },
          { command: "toggle", description: "Inverts the current setting." },
        ],
        note: "The resulting setting is synchronized to the client UI state.",
      },
    ],
  },
  spawnpoint: {
    introduction: "Adds a map spawn at the caller's current position or deletes every stored spawn for the current map.",
    sections: [
      {
        title: "Map spawn management",
        syntax: "!spawnpoint <put|purge>",
        items: [
          { command: "put", description: "Queues a new spawn using the caller's origin and yaw; each stored coordinate is integer-rounded after adding one unit." },
          { command: "purge", description: "Queues deletion of all spawn rows for the current map." },
        ],
        note: "Purge has no confirmation. Both actions report success immediately, before the asynchronous database operation is confirmed.",
      },
    ],
  },
  specfix: {
    introduction: "Repairs a stuck COD2 spectator by reapplying the current view orientation.",
    sections: [
      {
        title: "Spectator repair",
        syntax: "!specfix",
        items: [
          { command: "!specfix", description: "Preserves pitch and yaw, zeros roll, and reapplies the angles when both persistent team and session state say spectator." },
        ],
        note: "The command is registered only on COD2. It reports that you are not spectating when the required states do not match.",
      },
    ],
  },
  speclist: {
    introduction: "Lists visible spectators watching you, or watching the player you currently follow as a spectator.",
    sections: [
      {
        title: "Spectator list",
        syntax: "!speclist",
        items: [
          { command: "While playing", description: "Lists spectators whose current target is you." },
          { command: "While spectating", description: "Lists spectators of the player you are following, excluding you from the result." },
        ],
        note: "Spectators in undercover mode are filtered from the player-facing list. Extra arguments are ignored.",
      },
    ],
  },
  startmusic: {
    introduction: "Enables map music and selects the current ambient track for the player.",
    sections: [
      {
        title: "Start map music",
        syntax: "!startmusic",
        items: [
          { command: "!startmusic", description: "Marks map ambient as running, enables map music, synchronizes the preference, and selects the current ambient track." },
        ],
        note: "It is refused while you are spectating and following another player; switch to free spectator first. Extra arguments are ignored.",
      },
    ],
  },
  stopmusic: {
    introduction: "Disables map music for the player and returns sound selection to the fallback ambient behavior.",
    sections: [
      {
        title: "Stop map music",
        syntax: "!stopmusic",
        items: [
          { command: "!stopmusic", description: "Marks map ambient as stopped, disables map music, synchronizes the preference, and refreshes the ambient track." },
        ],
        note: "It is refused while you are spectating and following another player; switch to free spectator first. Fallback server ambient may remain available.",
      },
    ],
  },
  taunts: {
    introduction: "Controls whether you receive player taunts.",
    sections: [
      {
        title: "Taunt reception",
        syntax: "!taunts <on|off>",
        items: [
          { command: "on", description: "Allows player taunts by clearing the internal ignore-taunts preference." },
          { command: "off", description: "Suppresses player taunts by enabling the internal ignore-taunts preference." },
        ],
        note: "The public setting is positive even though the stored value is the inverse.",
      },
    ],
  },
  teleplayer: {
    introduction: "Teleports another active player to the caller's position and view direction.",
    sections: [
      {
        title: "Bring player",
        syntax: "!teleplayer <player>",
        items: [
          { command: "<player>", description: "Selects a connected active target strictly below the caller's admin level." },
        ],
        note: "Both caller and target must be actively playing. Self-targeting is rejected because the target-level comparison has no self exception; the target is marked through the anti-cut warning path.",
      },
    ],
  },
  temppromote: {
    introduction: "Sets a connected player's admin level in live server state only, until that state is rebuilt or the player leaves.",
    sections: [
      {
        title: "Temporary authority",
        syntax: "!temppromote <player> <level>",
        items: [
          { command: "<player>", description: "Selects yourself or a connected player below your current level." },
          { command: "<level>", description: "Sets a live level from 0 through caller-level-minus-one; callers need level 98 or higher." },
        ],
        note: "Despite its name, the command also permits temporary demotion and self-demotion. Malformed level text currently converts to zero, and no account value is persisted.",
      },
    ],
  },
  theme: {
    introduction: "Selects one of the registered HUD themes or cycles to the next theme.",
    sections: [
      {
        title: "HUD theme",
        syntax: "!theme <default|matrix|egz|custom|cycle>",
        items: [
          { command: "default", description: "Uses the standard theme." },
          { command: "matrix", description: "Uses the Matrix theme." },
          { command: "egz", description: "Uses the EGZ theme." },
          { command: "custom", description: "Uses your custom-theme values." },
          { command: "cycle", description: "Advances through the registered theme catalog." },
        ],
        note: "Missing input shows the options. Invalid input currently produces no response because the command ignores the setting handler's failure result.",
      },
    ],
  },
  thirdperson: {
    introduction: "Controls the player's third-person camera preference.",
    sections: [
      {
        title: "Third-person view",
        syntax: "!thirdperson <on|off>",
        items: [
          { command: "on", description: "Enables third-person view." },
          { command: "off", description: "Returns to first-person view." },
        ],
        note: "Alias: !3rd. Unknown or missing modes show command help.",
      },
    ],
  },
  unignore: {
    introduction: "Removes a connected player from your current map-session chat ignore list.",
    sections: [
      {
        title: "Session unignore",
        syntax: "!unignore <player>",
        items: [
          { command: "<player>", description: "Selects the connected player's account ID to remove from your live ignore relation." },
        ],
        note: "This affects only the session relation created by !ignore. Use !funignore to remove a persistent ignore.",
      },
    ],
  },
  unmute: {
    introduction: "Removes a player's live mute when the caller has enough authority to clear it.",
    sections: [
      {
        title: "Live unmute",
        syntax: "!unmute <player>",
        items: [
          { command: "<player>", description: "Selects yourself or a connected muted player below your admin level." },
        ],
        note: "A mute made at a higher level cannot be cleared by a lower-level caller. This clears live fields only; a persistent forced mute may return in a later session, where !funmute is the persistent counterpart.",
      },
    ],
  },
  veto: {
    introduction: "Vetoes the currently active vote when the vote type and starter hierarchy permit it.",
    sections: [
      {
        title: "Vote veto",
        syntax: "!veto",
        items: [
          { command: "Standard vote", description: "Requires level 60 and permits veto when the vote starter is no more than 20 levels above the caller." },
          { command: "kick/addtime/disable-vote", description: "These sensitive vote types require level 80 even though the command is registered at level 60." },
        ],
        note: "There must be an active, not-yet-vetoed vote. Extra arguments are ignored.",
      },
    ],
  },
  vignore: {
    introduction: "Mutes one connected player's voice locally for the caller through the game client's voice-mute command.",
    sections: [
      {
        title: "Local voice mute",
        syntax: "!vignore <player>",
        items: [
          { command: "<player>", description: "Resolves a connected player's current entity slot and issues the local muteplayer client command." },
        ],
        note: "This is client-local voice state, not text ignore or a server-enforced mute. No admin hierarchy check is applied.",
      },
    ],
  },
  vunignore: {
    introduction: "Unmutes one connected player's voice locally for the caller.",
    sections: [
      {
        title: "Local voice unmute",
        syntax: "!vunignore <player>",
        items: [
          { command: "<player>", description: "Resolves a connected player's current entity slot and issues the local unmuteplayer client command." },
        ],
        note: "This changes client-local voice state only. It does not clear text ignore or a server-enforced mute.",
      },
    ],
  },
  xpmultiplier: {
    introduction: "Sets the server-wide multiplier applied to eligible checkpoint XP awards.",
    sections: [
      {
        title: "Checkpoint XP multiplier",
        syntax: "!xpmultiplier <off|1-10|1x-10x>",
        items: [
          { command: "off", description: "Sets the neutral 1x multiplier; it does not disable XP awards." },
          { command: "<1-10>", description: "Accepts integer or decimal values from 1.000 through 10.000." },
          { command: "<value>x", description: "Accepts the same range with a trailing x, such as 2.5x." },
        ],
        note: "The normalized value is stored in a server cvar and announced server-wide. Missing input shows help and the current multiplier; the setting is not persisted to the database.",
      },
    ],
  },
  help: {
    introduction:
      "Shows the in-game help handler for a command you are allowed to use, resolved by canonical name or alias.",
    sections: [
      {
        title: "Command help",
        syntax: "!help <command>",
        items: [
          { command: "<command>", description: "Accepts a canonical command name or any registered alias, with or without uppercase letters." },
        ],
        examples: ["!help vote", "!h pb"],
        note: "The command also prints the canonical name and aliases. An unknown command currently produces no response, while a command above your level reports the required level.",
      },
    ],
  },
  howmany: {
    introduction:
      "Counts maps fully completed by you or an optionally selected connected player. It does not count online players.",
    sections: [
      {
        title: "Completed-map count",
        syntax: "!howmany [player]",
        items: [
          { command: "!howmany", description: "Queries your number of fully finished maps." },
          { command: "!howmany <player>", description: "Queries the connected player's number of fully finished maps." },
        ],
        note: "The optional-player variant is missing from legacy help. An unresolved player currently falls back to your own count instead of reporting an error.",
      },
    ],
  },
  hudedit: {
    introduction:
      "Opens the interactive editor used to reposition supported HUD elements.",
    sections: [
      {
        title: "HUD editor",
        syntax: "!hudedit",
        items: [
          { command: "!hudedit", description: "Snapshots the current HUD positions, freezes your controls, and opens the editor menu." },
        ],
        note: "The editor silently stays closed until player login data has finished loading. Extra command arguments are ignored.",
      },
    ],
  },
  huds: {
    introduction:
      "Controls the record and statistics HUDs plus several related display preferences.",
    sections: [
      {
        title: "HUD groups",
        items: [
          { command: "!huds <on|off>", description: "Enables or disables both record and statistics HUDs." },
          { command: "!huds stat <on|off>", description: "Controls only the statistics HUD." },
          { command: "!huds rec <on|off>", description: "Controls only the record HUD." },
          { command: "!huds rec <full|smart>", description: "Selects the full or partial record-list layout." },
          { command: "!huds seconds <small|large>", description: "Selects the compact or large seconds display." },
          { command: "!huds <nades|rpgs> <on|off>", description: "Controls the shared grenade/RPG record indicator." },
        ],
        note: "Legacy help advertises stat top/bottom, but the handler rejects those values. Conversely, seconds and nades/rpgs are implemented but omitted from help.",
      },
    ],
  },
  ignore: {
    introduction:
      "Ignores all text messages from a connected player for the current map session.",
    sections: [
      {
        title: "Session ignore",
        syntax: "!ignore <player>",
        items: [
          { command: "<player>", description: "Adds the selected player's account ID to your live ignore list." },
        ],
        note: "Level-100 players cannot be ignored. This relation is not persisted; use !fignore for a persistent ignore and !unignore to remove a session entry.",
      },
    ],
  },
  jumptimer: {
    introduction:
      "Controls the HUD countdown showing when full jump power will be restored.",
    sections: [
      {
        title: "Jump-power timer",
        syntax: "!jumptimer <on|off>",
        items: [
          { command: "on", description: "Shows the countdown while jump-power recovery is active." },
          { command: "off", description: "Hides the countdown." },
        ],
        note: "The handler changes the live preference directly and prints no success message.",
      },
    ],
  },
  killplayer: {
    introduction:
      "Forces an actively playing target to use the server's normal suicide path.",
    sections: [
      {
        title: "Kill player",
        syntax: "!killplayer <player>",
        items: [
          { command: "<player>", description: "Selects yourself or a connected player below your admin level." },
        ],
        note: "Spectators and already-dead players are not affected. The command permits self-targeting.",
      },
    ],
  },
  measure: {
    introduction:
      "Controls individual parts of the movement measurement display.",
    sections: [
      {
        title: "Measurement display",
        syntax: "!measure <numbers|graph|maxspeed|color> <on|off>",
        items: [
          { command: "numbers", description: "Controls the measurement numbers, including angle and speed HUD elements." },
          { command: "graph", description: "Controls the speed graph." },
          { command: "maxspeed", description: "Controls maximum-speed tracking in the measurement display." },
          { command: "color", description: "Controls the measurement color treatment." },
        ],
        examples: ["!measure numbers on", "!measure graph off"],
      },
    ],
  },
  mute: {
    introduction:
      "Mutes a connected player in live server state without writing a timed mute to the database.",
    sections: [
      {
        title: "Live mute",
        syntax: "!mute <player>",
        items: [
          { command: "<player>", description: "Selects yourself or a connected player below your admin level." },
        ],
        note: "The action is announced server-wide. It differs from !fmute, which records a one-hour mute persistently.",
      },
    ],
  },
  myid: {
    introduction:
      "Prints your persistent player account ID from the logged-in player data.",
    sections: [
      {
        title: "Account identifier",
        syntax: "!myid",
        items: [
          { command: "!myid / !id", description: "Prints your database-backed player ID." },
        ],
        note: "It does not print the temporary server entity number despite the older generated description implying multiple ID types.",
      },
    ],
  },
  nadecheat: {
    introduction:
      "Controls COD2 grenade-damage assistance and an optional angle/effectiveness diagnostic.",
    sections: [
      {
        title: "Grenade modes",
        syntax: "!nadecheat <on|off|99|angle>",
        items: [
          { command: "on", description: "Enables lethal-grenade protection and marks the run warned/unsafe for normal ranking." },
          { command: "off", description: "Disables lethal protection and the forced-99-damage mode; it does not disable the angle diagnostic." },
          { command: "99", description: "Forces reported COD2 grenade damage to 99 and marks the run warned/unsafe." },
          { command: "angle", description: "Toggles grenade angle and horizontal-effectiveness diagnostics." },
        ],
        note: "The angle mode is implemented but omitted from legacy help. COD4 returns from the grenade-feedback path before these COD2-specific effects are applied.",
      },
    ],
  },
  nades: {
    introduction:
      "Enables or disables grenade availability for yourself or a lower-level connected player.",
    sections: [
      {
        title: "Player grenades",
        syntax: "!nades <player> <on|off>",
        items: [
          { command: "on", description: "Stores grenades as enabled and immediately gives the configured grenade/RPG when the target is playing." },
          { command: "off", description: "Stores grenades as disabled and immediately removes the configured grenade/RPG when the target is playing." },
        ],
        note: "Self-targeting is allowed; another player at or above your admin level is protected. Success is announced to the whole server.",
      },
    ],
  },
  noclip: {
    introduction:
      "Toggles noclip while you are actively playing, with an optional movement speed.",
    sections: [
      {
        title: "Noclip movement",
        syntax: "!noclip [speed]",
        items: [
          { command: "!noclip", description: "Enables noclip at speed 1 when off, or disables the current noclip mode when on." },
          { command: "!noclip <speed>", description: "Enables or changes speed; repeating the active speed disables noclip. Effective speed is capped at 50." },
        ],
        examples: ["!noclip", "!nc 5"],
        note: "The speed argument is absent from legacy help. Malformed, zero, and negative values currently become speed 1; enabling noclip marks the run warned/unsafe.",
      },
    ],
  },
  nowaypoints: {
    introduction:
      "Controls whether checkpoint waypoint markers are hidden.",
    sections: [
      {
        title: "Waypoint visibility",
        syntax: "!nowaypoints <on|off>",
        items: [
          { command: "on", description: "Turns no-waypoints mode on, hiding checkpoint markers." },
          { command: "off", description: "Turns no-waypoints mode off, showing checkpoint markers." },
        ],
        note: "The handler stores the inverse as waypoints_enabled; the public command is phrased in terms of hiding them.",
      },
    ],
  },
  osmode: {
    introduction:
      "Controls old-school movement mode and places completed runs in the separate old-school record category.",
    sections: [
      {
        title: "Old-school mode",
        syntax: "!osmode <on|off>",
        items: [
          { command: "on", description: "Enables the old-school movement/ranking mode." },
          { command: "off", description: "Returns to the normal movement/ranking mode." },
        ],
        note: "The mode value is also captured in saved positions and restored when those positions are loaded.",
      },
    ],
  },
  pistol: {
    introduction:
      "Selects the pistol placed in your primary weapon slot from the current game's configured list.",
    sections: [
      {
        title: "COD2 pistols",
        syntax: "!pistol <luger|tt30|colt|webley|deagle|weblev>",
        items: [
          { command: "deagle", description: "The COD2 donor pistol; non-donors cannot select it." },
          { command: "other listed names", description: "Selects that standard COD2 pistol immediately." },
        ],
      },
      {
        title: "COD4 pistols",
        syntax: "!pistol <deagle|beretta|colt|usp|deaglegold>",
        items: [
          { command: "deaglegold", description: "The COD4 donor pistol; non-donors cannot select it." },
          { command: "other listed names", description: "Selects that standard COD4 pistol immediately." },
        ],
        note: "The command builds its available-option list at runtime. Older translated help contains a stale COD2-only subset.",
      },
    ],
  },
  players: {
    introduction:
      "Lists players reported by other recently active Jump4Life servers.",
    sections: [
      {
        title: "Cross-server player list",
        syntax: "!players [server-name fragment]",
        items: [
          { command: "!players", description: "Lists non-empty remote servers seen during the last five minutes." },
          { command: "!players <fragment>", description: "Restricts results to remote server names containing that one-token fragment." },
        ],
        note: "The current server is excluded. Each player is shown with their current name and preferred name when available; multi-word search input is not joined.",
      },
    ],
  },
  promote: {
    introduction:
      "Sets a connected player's admin level, subject to target hierarchy and caller-specific promotion limits.",
    sections: [
      {
        title: "Admin-level change",
        syntax: "!promote <player> <level>",
        items: [
          { command: "caller level 60-79", description: "May set a level up to 20 and may not demote." },
          { command: "caller level 80-89", description: "May set a level up to 40 and may not demote." },
          { command: "caller level 90", description: "May set a level up to 60 and may not demote." },
          { command: "caller level 91-99", description: "May set a lower level than their own, including demotions down to -1." },
          { command: "caller level 100", description: "May set levels from -1 through 99." },
        ],
        note: "Malformed level text currently converts to zero. Live admin state and success messages are applied before the asynchronous database write is confirmed.",
      },
    ],
  },
  pstats: {
    introduction:
      "Opens the player-statistics menu for yourself or a selected connected player.",
    sections: [
      {
        title: "Player profile",
        syntax: "!pstats [player]",
        items: [
          { command: "!pstats", description: "Opens the statistics menu with the default self-selection state." },
          { command: "!pstats <player>", description: "Opens the menu and loads the selected connected player's profile." },
        ],
      },
    ],
  },
  removexp: {
    introduction:
      "Removes rank XP from a connected player through the server's rank-adjustment procedure.",
    sections: [
      {
        title: "XP removal",
        syntax: "!removexp <player> <amount>",
        items: [
          { command: "<player>", description: "Selects the connected player whose rank XP is adjusted." },
          { command: "<amount>", description: "Must parse to a positive integer; the command handler declares no maximum." },
        ],
        note: "The database procedure clamps the resulting XP at zero. After confirmed success, the player's cached XP/rank display is refreshed and both player and admin receive the result. Alias: !remxp.",
      },
    ],
  },
  donated: {
    introduction:
      "Grants or revokes donation status for a connected player and persists the change to their account.",
    sections: [
      {
        title: "Donation status",
        syntax: "!donated <player> <1|0>",
        items: [
          { command: "1", description: "Marks the selected player as a donor." },
          { command: "0", description: "Revokes the selected player's donor status." },
        ],
        examples: ["!donated Player 1", "!donated Player 0"],
        note: "The status changes in the live session before the asynchronous database update is confirmed.",
      },
    ],
  },
  draw2d: {
    introduction: "Controls whether the client draws the 2D HUD layer.",
    sections: [
      {
        title: "2D HUD",
        syntax: "!draw2d <on|off>",
        items: [
          { command: "on", description: "Shows the 2D HUD layer." },
          { command: "off", description: "Hides the 2D HUD layer." },
        ],
      },
    ],
  },
  drawdist: {
    introduction:
      "Overrides the distance at which the client draws the world. Use zero to turn the override off.",
    sections: [
      {
        title: "Draw distance",
        syntax: "!drawdist <distance>",
        items: [
          { command: "0", description: "Disables the custom draw-distance override." },
          { command: "positive integer", description: "Sets the requested draw distance without a command-level maximum." },
        ],
        examples: ["!drawdist 0", "!drawdist 200"],
        note: "The legacy parser converts non-numeric text to zero; a rewrite should reject it instead of silently disabling the override.",
      },
    ],
  },
  drawgun: {
    introduction:
      "Controls whether the first-person weapon model is drawn. This is visual only; use !gun to control weapon use.",
    sections: [
      {
        title: "Weapon model",
        syntax: "!drawgun <on|off|toggle>",
        items: [
          { command: "on", description: "Shows the first-person weapon model." },
          { command: "off", description: "Hides the first-person weapon model." },
          { command: "toggle", description: "Switches to the opposite of the current state." },
        ],
        note: "Toggle is implemented by the handler but omitted from the legacy in-game help.",
      },
    ],
  },
  enablesave: {
    introduction:
      "Overrides whether you may save a position during the current run.",
    sections: [
      {
        title: "Save override",
        syntax: "!enablesave <on|off>",
        items: [
          { command: "on", description: "Force-enables saving when the current route or state has blocked it." },
          { command: "off", description: "Disables saving and clears the force-enable override." },
        ],
        note: "Force-enabling a blocked save marks the current run as cheated, so it cannot be treated as a normal ranked run.",
      },
    ],
  },
  endmap: {
    introduction:
      "Requests an end-map vote. Despite its name, the command does not immediately end the map.",
    sections: [
      {
        title: "End-map vote",
        syntax: "!endmap",
        items: [
          { command: "!endmap", description: "Starts the end-map vote when no equal- or higher-level admin is online." },
        ],
        note: "If an equal- or higher-level admin is present, the command asks you to contact them or use the normal vote path.",
      },
    ],
  },
  english: {
    introduction:
      "Plays the server's English-language reminder for another connected player.",
    sections: [
      {
        title: "Language reminder",
        syntax: "!english <player>",
        items: [
          { command: "<player>", description: "Selects another connected player; level-100 targets are protected." },
        ],
        note: "The command shares its cooldown with !hello: one minute at levels 80-90 and no cooldown at level 91+. A blocked attempt currently restarts that cooldown.",
      },
    ],
  },
  fignore: {
    introduction:
      "Adds a connected player to your persistent chat ignore list.",
    sections: [
      {
        title: "Persistent ignore",
        syntax: "!fignore <player>",
        items: [
          { command: "<player>", description: "Ignores that player's chat now and on future visits." },
        ],
        note: "Level-100 players cannot be ignored. Use !funignore to remove an entry.",
      },
    ],
  },
  fmute: {
    introduction:
      "Force-mutes a connected player for one hour and records the mute on their account.",
    sections: [
      {
        title: "One-hour mute",
        syntax: "!fmute <player>",
        items: [
          { command: "<player>", description: "Selects yourself or a player below your admin level." },
        ],
        note: "The live mute takes effect before the asynchronous database update is confirmed.",
      },
    ],
  },
  fog: {
    introduction: "Controls whether the client renders map fog.",
    sections: [
      {
        title: "Fog rendering",
        syntax: "!fog <on|off>",
        items: [
          { command: "on", description: "Enables fog rendering." },
          { command: "off", description: "Disables fog rendering." },
        ],
      },
    ],
  },
  forcespec: {
    introduction:
      "Moves a connected player to spectators once without locking their future team choice.",
    sections: [
      {
        title: "Move to spectators",
        syntax: "!forcespec <player>",
        items: [
          { command: "<player>", description: "Selects yourself or a player below your admin level." },
        ],
        note: "If the target is already spectating, no move is performed. This differs from !forceteam spectator, which creates a persistent team lock.",
      },
    ],
  },
  fov: {
    introduction:
      "Sets your field of view directly or advances through the server's preset values.",
    sections: [
      {
        title: "Field of view",
        syntax: "!fov <13-160|cycle>",
        items: [
          { command: "13 to 160", description: "Sets an exact field-of-view value, inclusive." },
          { command: "cycle", description: "Advances to the next configured FOV preset." },
        ],
        examples: ["!fov 90", "!fov cycle"],
        note: "The legacy help still says 65-95, but the active setting handler accepts 13-160. Invalid input currently fails silently.",
      },
    ],
  },
  fps: {
    introduction:
      "Sets your maximum FPS to a supported server preset or advances to the next preset.",
    sections: [
      {
        title: "FPS cap",
        syntax: "!fps <43|76|125|250|333|1000|cycle>",
        items: [
          { command: "43 / 76 / 125 / 250 / 333 / 1000", description: "Sets that exact maximum FPS value." },
          { command: "cycle", description: "Advances through the supported values in server order." },
        ],
        examples: ["!fps 125", "!fps cycle"],
        note: "The primary legacy usage line omits 1000 and does not advertise cycle, although both are implemented.",
      },
    ],
  },
  fullscreennotification: {
    introduction:
      "Controls whether save/load feedback uses fullscreen colored notifications instead of ordinary print messages.",
    sections: [
      {
        title: "Fullscreen notifications",
        syntax: "!fullscreennotification <on|off>",
        items: [
          { command: "on", description: "Enables fullscreen save/load notifications and previews the effect." },
          { command: "off", description: "Returns save/load feedback to normal messages and removes any active fullscreen notification." },
        ],
        note: "Alias: !fsn.",
      },
    ],
  },
  funignore: {
    introduction:
      "Removes a connected player from your persistent chat ignore list.",
    sections: [
      {
        title: "Remove persistent ignore",
        syntax: "!funignore <player>",
        items: [
          { command: "<player>", description: "Stops ignoring that player's chat now and on future visits." },
        ],
        note: "The target must currently be in your live ignore list; otherwise no database removal is attempted.",
      },
    ],
  },
  funmute: {
    introduction:
      "Removes a forced mute from yourself or a connected player below your authority.",
    sections: [
      {
        title: "Remove forced mute",
        syntax: "!funmute <player>",
        items: [
          { command: "<player>", description: "Selects yourself or a lower-level player whose mute should be cleared." },
        ],
        note: "You cannot clear a mute imposed by an admin above your level. The live state changes before database confirmation.",
      },
    ],
  },
  getlist: {
    introduction:
      "Lists connected, logged-in players with the identifiers useful for moderation and diagnostics.",
    sections: [
      {
        title: "Connected-player list",
        syntax: "!getlist",
        items: [
          { command: "country", description: "Shows the detected country code, or ?? when it is missing, empty, or UK." },
          { command: "admin level", description: "Shows the player's numeric admin level." },
          { command: "entity number", description: "Shows the player's current server entity number." },
          { command: "name", description: "Shows the player's current display name." },
        ],
        note: "Alias: !list. This command lists live players; it does not list saved runs.",
      },
    ],
  },
  givebacksave: {
    introduction:
      "Restores a deleted checkpoint pass from its database ID to the corresponding connected player.",
    sections: [
      {
        title: "Checkpoint-pass restore",
        syntax: "!givebacksave <checkpoint pass ID>",
        items: [
          { command: "<checkpoint pass ID>", description: "Selects the stored pass and its associated run, checkpoint, counters, time, and FPS state." },
        ],
        note: "The player must be connected and the checkpoint must belong to the current map. Restoration changes live run state and teleports the player immediately, with no confirmation step.",
      },
    ],
  },
  gun: {
    introduction:
      "Controls whether you can use a weapon. This differs from !drawgun, which only changes the first-person model's visibility.",
    sections: [
      {
        title: "Weapon use",
        syntax: "!gun <on|off|toggle>",
        items: [
          { command: "on", description: "Enables weapon use." },
          { command: "off", description: "Disables weapon use." },
          { command: "toggle", description: "Switches to the opposite of the current state." },
        ],
      },
    ],
  },
  hello: {
    introduction:
      "Plays a randomly selected server song or taunt. The !bonjour alias performs the same action.",
    sections: [
      {
        title: "Random song",
        syntax: "!hello",
        items: [
          { command: "!hello / !bonjour", description: "Plays one random sound from the configured server set." },
        ],
        note: "The cooldown is eight minutes at levels 40-59, five at 60-79, one at 80-90, and disabled at 91+. It is shared with !english, and a blocked attempt currently restarts the wait.",
      },
    ],
  },
  addtime: {
    introduction:
      "Changes the current map's remaining time. Positive values add minutes; removing time is restricted to higher admins.",
    sections: [
      {
        title: "Map time",
        syntax: "!addtime <minutes>",
        items: [
          { command: "1 to 1000", description: "Adds that many minutes, provided total map time stays at or below 1000 minutes." },
          { command: "negative minutes", description: "Removes time and requires admin level 80 or higher." },
        ],
        examples: ["!addtime 30", "!addtime -10"],
        note: "The current negative-time safety calculation is inconsistent; removal should be treated as a legacy administrative path until it is fixed.",
      },
    ],
  },
  addxp: {
    introduction:
      "Adds rank XP to a connected player through the server's rank-adjustment procedure.",
    sections: [
      {
        title: "XP adjustment",
        syntax: "!addxp <player> <amount>",
        items: [
          { command: "<player>", description: "Selects the connected player whose rank XP is adjusted." },
          { command: "<amount>", description: "Must parse to a positive integer. The command handler defines no maximum." },
        ],
        note: "The database procedure can still reject an adjustment. On success, the online player's cached XP and rank display are refreshed.",
      },
    ],
  },
  afk: {
    introduction:
      "Pauses your active run while you remain motionless on the ground. An optional player argument uses a separate AFK-status check.",
    sections: [
      {
        title: "Pause your run",
        syntax: "!afk",
        items: [
          { command: "!afk", description: "Pauses run and jump timing when you are in an active run, logged in, on the ground, and completely still." },
          { command: "move or press a button", description: "Ends the manual AFK pause and resumes timing." },
        ],
      },
      {
        title: "Check another player",
        syntax: "!afk <player>",
        items: [
          { command: "<player>", description: "Reports whether the connected player's AFK timer exceeds the server AFK-vote threshold." },
        ],
        note: "The player-check variant exists in the handler but is missing from the legacy in-game help.",
      },
    ],
  },
  alias: {
    introduction:
      "Shows names associated with a connected player's stored player ID.",
    sections: [
      {
        title: "Recorded names",
        syntax: "!alias <player>",
        items: [
          { command: "<player>", description: "Selects a connected player and queries up to 25 names found in their recorded runs." },
          { command: "preferred name", description: "A second query also prints the player's stored preferred name when one exists." },
        ],
        note: "Aliases are ranked from accumulated checkpoint time in the current implementation, not simple use count.",
      },
    ],
  },
  allowvote: {
    introduction:
      "Controls whether players can start votes immediately or after a delay.",
    sections: [
      {
        title: "Voting state",
        syntax: "!allowvote <on|off|minutes>",
        items: [
          { command: "on", description: "Enables voting immediately and clears any delay." },
          { command: "off", description: "Disables voting without scheduling automatic re-enablement." },
          { command: "5-45", description: "Disables voting now and schedules it to become available after that many minutes." },
        ],
      },
    ],
  },
  anglehelper: {
    introduction: "Controls the HUD that helps visualize strafe angles.",
    sections: [
      {
        title: "Display",
        syntax: "!anglehelper <on|off>",
        items: [
          { command: "on", description: "Enables the setting and starts the angle-helper HUD logic." },
          { command: "off", description: "Disables the setting and cleans up the helper HUD." },
        ],
      },
    ],
  },
  autobhop: {
    introduction:
      "Controls automatic jumping after jump has been held for 500 ms and the player touches ground or a ladder.",
    sections: [
      {
        title: "Automatic jump",
        syntax: "!autobhop <on|off>",
        items: [
          { command: "on", description: "Enables automatic jumping." },
          { command: "off", description: "Disables automatic jumping." },
        ],
      },
    ],
  },
  autoload: {
    introduction:
      "Controls height-triggered automatic loading. The height target is set separately by shooting a platform.",
    sections: [
      {
        title: "Automatic load",
        syntax: "!autoload <on|off>",
        items: [
          { command: "on", description: "Enables automatic loading when you fall below the selected height." },
          { command: "off", description: "Disables the feature and clears its stored height origin." },
        ],
        note: "Shooting somewhere high or far away is the legacy quick-disable interaction described by the game help.",
      },
    ],
  },
  autoreset: {
    introduction:
      "Controls whether a failed load with no available save automatically resets run statistics.",
    sections: [
      {
        title: "Automatic reset",
        syntax: "!autoreset <on|off>",
        items: [
          { command: "on", description: "Enables the automatic reset behavior." },
          { command: "off", description: "Disables the automatic reset behavior." },
        ],
      },
    ],
  },
  autostand: {
    introduction:
      "Controls whether loading a saved position automatically returns the player to a standing stance.",
    sections: [
      {
        title: "Load stance",
        syntax: "!autostand <on|off>",
        items: [
          { command: "on", description: "Automatically stands after loading a position." },
          { command: "off", description: "Preserves normal prone/crouch load behavior." },
        ],
      },
    ],
  },
  banplayer: {
    introduction:
      "Bans a connected player's stored account and current IP for one year, then disconnects them.",
    sections: [
      {
        title: "One-year ban",
        syntax: "!banplayer <player>",
        items: [
          { command: "<player>", description: "Selects the connected player whose account and IP receive a one-year ban." },
        ],
        note: "The current handler does not enforce the lower-admin target rule, and the help's claimed named-player limitation is not implemented in the branch.",
      },
    ],
  },
  bounce: {
    introduction:
      "Shows or temporarily changes the server's jump_bounceEnable value used for COD4-style bounce collision.",
    sections: [
      {
        title: "Bounce collision",
        syntax: "!bounce [status|on|off]",
        items: [
          { command: "!bounce / !bounce status", description: "Prints the current dvar value and detected map type. Bare usage also prints help." },
          { command: "on", description: "Sets jump_bounceEnable to 1." },
          { command: "off", description: "Sets jump_bounceEnable to 0." },
        ],
        note: "The override lasts only until the next map initialization.",
      },
    ],
  },
  checkpointsound: {
    introduction:
      "Controls whether passing a checkpoint plays the standard checkpoint sound.",
    sections: [
      {
        title: "Checkpoint audio",
        syntax: "!checkpointsound <on|off|toggle|cycle|default|none>",
        items: [
          { command: "on / default / pass_cp", description: "Enables the standard checkpoint sound." },
          { command: "off / none", description: "Disables checkpoint sound." },
          { command: "toggle / cycle", description: "Inverts the current sound state." },
        ],
        note: "The legacy handler coerces unknown values to a number and can silently turn the sound off; use one of the documented modes.",
      },
    ],
  },
  classicmode: {
    introduction:
      "Controls the map's classic/funmode route, where cuts are not punished and only the final checkpoint is used.",
    sections: [
      {
        title: "Classic mode",
        syntax: "!classicmode <on|off>",
        items: [
          { command: "on", description: "Enables funmode when the current map defines it." },
          { command: "off", description: "Returns to the normal checkpoint route." },
        ],
        note: "Changing the state resets the current run. Aliases: !funmode and !classic.",
      },
    ],
  },
  clonetheme: {
    introduction:
      "Copies another connected player's custom-theme data and immediately switches your active theme to custom.",
    sections: [
      {
        title: "Theme source",
        syntax: "!clonetheme <player>",
        items: [
          { command: "<player>", description: "Selects the connected player whose custom-theme object is copied." },
        ],
        note: "The current handler does not verify that the target has a complete custom theme before switching.",
      },
    ],
  },
  commands: {
    introduction:
      "Lists canonical command names whose registered minimum level is available to your current admin level.",
    sections: [
      {
        title: "Available commands",
        syntax: "!commands",
        items: [
          { command: "!commands", description: "Prints the count and command names in rows of four, followed by a reminder to use !help." },
        ],
        note: "Aliases are not listed; use !help <command> for the command-specific syntax.",
      },
    ],
  },
  confirmvote: {
    introduction:
      "Stores the PIN used to confirm your map-contest vote.",
    sections: [
      {
        title: "Vote PIN",
        syntax: "!confirmvote <pin>",
        items: [
          { command: "4-10 digits", description: "Stores the resulting digit string in your player-information record." },
        ],
        note: "The current handler removes non-digits from the supplied token before checking length. Enter digits only to avoid surprising normalization.",
      },
    ],
  },
  country: {
    introduction:
      "Shows the detected country for a connected player using the country code already stored on their session.",
    sections: [
      {
        title: "Player origin",
        syntax: "!country <player>",
        items: [
          { command: "<player>", description: "Selects the connected player whose stored country code is displayed." },
        ],
        note: "Empty country data and the literal code UK are reported as unknown by the current handler. This command does not set country data.",
      },
    ],
  },
  crosshair: {
    introduction: "Controls the player's crosshair setting.",
    sections: [
      {
        title: "Crosshair",
        syntax: "!crosshair <on|off>",
        items: [
          { command: "on", description: "Enables the crosshair." },
          { command: "off", description: "Disables the crosshair." },
        ],
      },
    ],
  },
  csc: {
    introduction:
      "Controls whether the player participates in cross-server chat.",
    sections: [
      {
        title: "Cross-server chat",
        syntax: "!csc <on|off>",
        items: [
          { command: "on", description: "Enables cross-server chat for your session setting." },
          { command: "off", description: "Disables cross-server chat for your session setting." },
        ],
      },
    ],
  },
  ambiant: {
    introduction:
      "Controls the fallback server ambient sound. A mode is required; running the command without one prints help.",
    sections: [
      {
        title: "Modes",
        syntax: "!ambiant <on|off|toggle|cycle>",
        items: [
          { command: "on", description: "Enables fallback server ambient sound." },
          { command: "off", description: "Disables fallback server ambient sound." },
          { command: "toggle / cycle", description: "Both names invert the current setting." },
        ],
      },
    ],
  },
  battle: {
    introduction:
      "Changes which benchmark the battle HUD compares against. The command can follow personal, public, player, grenade, or ranked-record targets.",
    sections: [
      {
        title: "Battle target",
        items: [
          { command: "!battle private", description: "Battles your personal-best runs. The legacy alias privjet is also accepted." },
          { command: "!battle public", description: "Battles the public record runs." },
          { command: "!battle player <player>", description: "Battles the selected logged-in player's personal performances." },
        ],
      },
      {
        title: "Grenade benchmark",
        syntax: "!battle nades <equal|none|infinite|count>",
        items: [
          { command: "equal", description: "Matches the benchmark's grenade count." },
          { command: "none / 0", description: "Uses a zero-grenade benchmark." },
          { command: "inf / infinite / infinity / infty", description: "Uses an unlimited-grenade benchmark." },
          { command: "<integer>", description: "Uses that explicit grenade count." },
        ],
      },
      {
        title: "Ranked record benchmark",
        syntax: "!battle record [type] [fps] [rank] [player]",
        introduction: "Filters can be supplied in any order.",
        items: [
          { command: "time / save / load / jump / nades", description: "Selects the record metric. Defaults to time." },
          { command: "43 / 76 / 125 / 250 / 333 / mix", description: "Selects the FPS category. Defaults to 125." },
          { command: "1-10", description: "Selects the leaderboard rank. Defaults to 1." },
          { command: "player", description: "Battles that ranked player's best performance instead of the exact ranked run." },
        ],
        examples: ["!battle record", "!battle record saves 250 3", "!battle record jumps mix 1 player"],
      },
    ],
  },
  changemap: {
    introduction:
      "Searches the map database and changes to the selected result after a short delay. Multiple words are treated as search fragments.",
    sections: [
      {
        title: "Map search",
        syntax: "!changemap <map name or search terms...>",
        items: [
          { command: "<map name or terms...>", description: "The complete remaining message is used to find the map." },
        ],
        examples: ["!changemap jm_legend", "!changemap scu legend"],
        note: "The change is refused while an equal- or higher-level admin is online; ask them or use a vote instead.",
      },
    ],
  },
  cpt: {
    introduction:
      "!cpt requires admin level 40. Running it without a subcommand places a temporary checkpoint at your current position.",
    sections: [
      {
        title: "Placement options",
        syntax: "!cpt [radius <units>] [trigger <name>] [type <flags>] [event <name>] [entity]",
        items: [
          {
            command: "radius <units>",
            description: "Sets an explicit spherical radius.",
          },
          {
            command: "trigger <name>",
            description:
              "Passes when the matching trigger or secret is activated. Without an explicit radius, radius is disabled.",
          },
          {
            command: "type <flags>",
            description: "Applies checkpoint behavior modifiers. Flags are substring-matched and can be combined.",
            options: [
              { name: "onground", description: "The player must be on the ground." },
              { name: "noweapon", description: "The player must have no weapon equipped." },
              { name: "notrace", description: "Ignores the normal line-of-sight check." },
              { name: "hidden", description: "Hides the checkpoint waypoint or pointer." },
              { name: "noprint", description: "Silently advances through this intermediate checkpoint." },
            ],
          },
          {
            command: "event <name>",
            description:
              "Runs a registered event when passed. Globally registered events include cheated and warned; maps can add custom events.",
          },
          {
            command: "entity",
            description:
              "Attaches the checkpoint to the targeted entity directly beneath the player. It takes no additional argument.",
          },
        ],
        examples: ["!cpt radius 75 type onground_notrace"],
      },
      {
        title: "Draft management",
        items: [
          {
            command: "!cpt remove",
            description: "Deletes your latest temporary checkpoint on the current map.",
          },
          {
            command: "!cpt removeall",
            description: "Deletes all your temporary checkpoints on the current map.",
          },
          {
            command: "!cpt parse [radius] [route]",
            description:
              "Finalizes the route by marking the latest checkpoint as the endpoint and applying the radius to unset checkpoints.",
          },
        ],
        examples: ["!cpt parse", "!cpt parse 75", "!cpt parse main", "!cpt parse 75 main"],
        note: "The default parse radius is 50.",
      },
      {
        title: "Published routes",
        items: [
          {
            command: "!cpt routes",
            description: "Lists published routes with checkpoint ID, name, mode, radius, and recorded runs.",
          },
          {
            command: "!cpt rename <name|checkpoint_id> <new_name>",
            description: "Renames a published route. Requires level 100.",
          },
          {
            command: "!cpt delete <name|checkpoint_id>",
            description:
              "Starts deletion of a published route. Confirm with !cpt delete <checkpoint_id> confirm. Requires level 100, and routes with recorded history are protected.",
          },
        ],
      },
      {
        title: "Publishing and administration",
        items: [
          {
            command: "!cpt import <player_id>",
            description: "Publishes that player's temporary checkpoints for the current map. Requires level 100.",
          },
          {
            command: "!cpt import delete",
            description:
              "Deletes all published checkpoints for the current map. Requires level 100 and currently has no confirmation step.",
          },
          {
            command: "!cpt help",
            description: "Prints the in-game command summary.",
          },
        ],
      },
    ],
  },
  customtheme: {
    introduction:
      "Creates a custom HUD theme. Different item groups require RGB triples, a single alpha value, on/off, a template string, or a registered theme name.",
    sections: [
      {
        title: "Theme operations",
        items: [
          { command: "!customtheme reset", description: "Clears every custom value and switches to a fresh custom theme." },
          { command: "!customtheme import <theme>", description: "Copies all supported colors and templates from a registered theme." },
        ],
      },
      {
        title: "Colors and opacity",
        items: [
          {
            command: "!customtheme <color item> <red> <green> <blue>",
            description: "Each component must be between 0 and 1.",
            options: [
              { name: "highlight_safe", description: "Safe-record highlight color." },
              { name: "highlight_cheat", description: "Cheated-record highlight color." },
              { name: "highlight_warn", description: "Warning highlight color." },
              { name: "ownrecord_background", description: "Own-record background color." },
              { name: "color_8 / color_9", description: "Additional theme palette colors." },
            ],
          },
          {
            command: "!customtheme <alpha item> <0-1>",
            description: "Sets one opacity value.",
            options: [
              { name: "ownrecord_background_alpha", description: "Own-record background opacity." },
              { name: "highlight_alpha", description: "Record highlight opacity." },
            ],
          },
        ],
        examples: ["!customtheme highlight_safe 0.2 0.9 0.5", "!customtheme highlight_alpha 0.5"],
      },
      {
        title: "Toggles and templates",
        items: [
          {
            command: "!customtheme <toggle item> <on|off>",
            description: "Supported toggle items are strip_name_colors and strip_name_colors_self.",
          },
          {
            command: "!customtheme <template item> <value>",
            description:
              "Template values accept formatting characters but reject letters other than C, c, and s.",
            options: [
              { name: "name_other / name_self", description: "Player-name templates." },
              { name: "number_other / number_self", description: "Rank-number templates." },
              { name: "rec_other / rec_self", description: "Record templates." },
              { name: "hud_stats / hud_stats_value / hud_stats_mix_string_m", description: "HUD statistics templates." },
            ],
          },
        ],
        note: "The in-game help mentions onscreen_stats, but the current handler has no onscreen_stats branch.",
      },
    ],
  },
  deleterec: {
    introduction:
      "Deletes one ranked record from the current route. The same fully specified command must be run twice: once to select the run and again to confirm it.",
    sections: [
      {
        title: "Record selection",
        syntax: "!deleterec <time|save|load|jump|nades> [43|76|125|250|333|mix] <rank 1-10>",
        introduction: "Filters can be supplied in any order, but both a metric and rank are required.",
        items: [
          { command: "time / save / load / jump / nades", description: "Selects the leaderboard metric." },
          { command: "43 / 76 / 125 / 250 / 333 / mix", description: "Selects the FPS category. Defaults to 125." },
          { command: "1-10", description: "Selects the record's rank in that leaderboard." },
        ],
        examples: ["!deleterec time 125 3", "!deleterec jumps mix 1"],
        note: "Repeat the identical command when prompted. Changing any filter selects a different run and cancels the match.",
      },
    ],
  },
  findmap: {
    introduction: "Searches for installed maps using one or more fragments of the map name.",
    sections: [
      {
        title: "Search",
        syntax: "!findmap <map name or search terms...>",
        items: [
          { command: "<terms...>", description: "Every remaining word contributes to the map search." },
        ],
        examples: ["!findmap jm_legend", "!findmap scu legend"],
      },
    ],
  },
  forceteam: {
    introduction:
      "Moves a lower-level player and keeps them assigned to that team. Use none to remove the persistent assignment.",
    sections: [
      {
        title: "Team lock",
        syntax: "!forceteam <allies|axis|spectator|none> <player>",
        items: [
          { command: "allies / axis", description: "Moves the player and locks future assignment to that playing team." },
          { command: "spectator / spectate", description: "Moves the player to spectators and keeps that assignment." },
          { command: "none / n", description: "Removes the stored team lock." },
          { command: "<player>", description: "Must resolve to a player with a lower admin level than the caller." },
        ],
      },
    ],
  },
  frename: {
    introduction:
      "Immediately renames a lower-level player and enforces the name beyond a normal client rename.",
    sections: [
      {
        title: "Forced name",
        syntax: "!frename <player> <new name...>",
        items: [
          { command: "<player>", description: "Must resolve to the caller or a lower-level player." },
          { command: "<new name...>", description: "All remaining words become the enforced name." },
          { command: "NULL", description: "Clears the active forced-name flag and sets the stored expiry to NULL." },
        ],
        note: "Callers at level 90 or above set a one-day expiry; lower authorized callers set a two-hour expiry.",
      },
    ],
  },
  kick: {
    introduction: "Disconnects a selected lower-level player, optionally including a free-text reason.",
    sections: [
      {
        title: "Kick target",
        syntax: "!kick <player> [reason...]",
        items: [
          { command: "<player>", description: "Must resolve to the caller or a lower-level player." },
          { command: "[reason...]", description: "All remaining words are appended to the kick message." },
        ],
      },
    ],
  },
  mapinfo: {
    introduction: "Shows stored metadata for the current map or a map found from search terms.",
    sections: [
      {
        title: "Map selection",
        syntax: "!mapinfo [map name or search terms...]",
        items: [
          { command: "!mapinfo", description: "Shows information for the current map." },
          { command: "!mapinfo <terms...>", description: "Searches for another map and shows the selected result." },
        ],
      },
    ],
  },
  moveteam: {
    introduction:
      "Moves a player once without locking later team changes. This differs from !forceteam, which stores a persistent assignment.",
    sections: [
      {
        title: "One-time team move",
        syntax: "!moveteam <allies|axis|spectator> <player>",
        items: [
          { command: "allies / axis", description: "Moves the selected player to that playing team." },
          { command: "spectator / spectate / spec", description: "Moves the selected player to spectators." },
          { command: "<player>", description: "Can target yourself or a player below your admin level." },
        ],
      },
    ],
  },
  nominate: {
    introduction: "Searches for a map and stores the selected result as your next-map nomination.",
    sections: [
      {
        title: "Map nomination",
        syntax: "!nominate <map name or search terms...>",
        items: [
          { command: "<terms...>", description: "All remaining words are used to search the map list." },
        ],
        examples: ["!nominate jm_legend", "!nominate scu legend"],
        note: "The legacy in-game help calls this !setnextmap; the active registered command is !nominate.",
      },
    ],
  },
  personalbest: {
    introduction:
      "Shows your best result on the current route. Optional filters can appear in any order, and all expands the query to every non-funmode route.",
    sections: [
      {
        title: "Result filters",
        syntax: "!personalbest [type] [fps] [all]",
        items: [
          { command: "time / times", description: "Shows the best completion time. This is the default metric." },
          { command: "save(s) / load(s) / jump(s)", description: "Shows the lowest count for that metric." },
          { command: "43 / 76 / 125 / 250 / 333", description: "Restricts the result to that FPS category. COD2 defaults to 125." },
          { command: "mix / mixed", description: "Uses the mixed-FPS category." },
          { command: "all", description: "Shows the result for every non-funmode endpoint instead of the current endpoint." },
        ],
        examples: ["!personalbest", "!personalbest saves 250", "!personalbest all jumps mix"],
      },
    ],
  },
  personalbestplayer: {
    introduction:
      "Shows another logged-in player's best result. The player is required; the remaining filters can appear in any order.",
    sections: [
      {
        title: "Player and filters",
        syntax: "!personalbestplayer <player> [type] [fps] [all]",
        items: [
          { command: "<player>", description: "Selects the logged-in player whose stored results are queried." },
          { command: "time / save / load / jump", description: "Selects the result metric. Defaults to time." },
          { command: "43 / 76 / 125 / 250 / 333 / mix", description: "Selects the FPS category. COD2 defaults to 125." },
          { command: "all", description: "Queries every non-funmode endpoint instead of the current endpoint." },
        ],
        examples: ["!pbp playername", "!pbp playername loads 333", "!pbp playername all time mix"],
      },
    ],
  },
  pm: {
    introduction:
      "Sends a private message to one player. The message is blocked when either player is ignoring the other and is subject to spam protection.",
    sections: [
      {
        title: "Private message",
        syntax: "!pm <player> <message...>",
        items: [
          { command: "<player>", description: "Selects the currently connected recipient." },
          { command: "<message...>", description: "Every remaining word becomes the private message." },
        ],
      },
    ],
  },
  poll: {
    introduction: "Starts a server poll using the complete remaining message as its question.",
    sections: [
      {
        title: "Poll question",
        syntax: "!poll <question...>",
        items: [
          { command: "<question...>", description: "At least one word is required; all remaining words are preserved." },
        ],
        examples: ["!poll Is J4L awesome?"],
      },
    ],
  },
  rename: {
    introduction:
      "Changes a connected player's current client name. Unlike !frename, this does not create a stored forced-name rule.",
    sections: [
      {
        title: "Player name",
        syntax: "!rename <player> <new name...>",
        items: [
          { command: "<player>", description: "Can target yourself or a player below your admin level." },
          { command: "<new name...>", description: "Every remaining word becomes the player's new current name." },
        ],
      },
    ],
  },
  saybold: {
    introduction:
      "Prints a bold free-text message to connected players, except recipients who are ignoring the sender.",
    sections: [
      {
        title: "Broadcast message",
        syntax: "!saybold <message...>",
        items: [
          { command: "<message...>", description: "Every remaining word becomes the centered bold message." },
        ],
        examples: ["!saybold Server restart in five minutes"],
        note: "The command is blocked while muted and has an anti-spam cooldown that becomes shorter at higher admin levels.",
      },
    ],
  },
  setauthor: {
    introduction: "Sets the current map's stored author using the complete remaining message.",
    sections: [
      {
        title: "Author metadata",
        syntax: "!setauthor <author...>",
        items: [
          { command: "<author...>", description: "Every remaining word becomes the author value." },
        ],
        note: "Level 100 can overwrite an existing author. Other authorized levels only set the value when it is currently empty.",
      },
    ],
  },
  setdate: {
    introduction: "Sets the current map's stored release date from three numeric fields.",
    sections: [
      {
        title: "Release date",
        syntax: "!setdate <YYYY> <MM> <DD>",
        items: [
          { command: "YYYY", description: "Year from 2000 through 2050." },
          { command: "MM", description: "Month from 1 through 12." },
          { command: "DD", description: "Day from 1 through 31." },
        ],
        examples: ["!setdate 2026 07 22"],
        note: "The handler checks numeric ranges but does not itself reject impossible month/day combinations.",
      },
    ],
  },
  setprefname: {
    introduction:
      "Stores the preferred name used for future records. The stored preference becomes active on the next map change.",
    sections: [
      {
        title: "Preferred name",
        syntax: "!setprefname [preferred name...]",
        items: [
          { command: "!setprefname", description: "Uses your current player name after removing game color formatting." },
          { command: "!setprefname <name...>", description: "Stores the complete supplied name after removing game color formatting." },
        ],
      },
    ],
  },
  taunt: {
    introduction:
      "Directly selects a quick-message family, one of its nine rows, and a sound variant.",
    sections: [
      {
        title: "Quick-message selection",
        syntax: "!taunt <category 1-3> <row 1-9> <variant>",
        items: [
          { command: "1", description: "Uses the quick-commands family." },
          { command: "2", description: "Uses the quick-statements family." },
          { command: "3", description: "Uses the quick-responses family." },
          { command: "<row 1-9>", description: "Selects the phrase group within that family." },
          { command: "<variant>", description: "Selects a sound clip for the phrase; an oversized value falls back to a random available clip." },
        ],
        note: "All three arguments are required by the command handler.",
      },
    ],
  },
  teleport: {
    introduction:
      "Teleports you to another active player and copies their current view direction. Both players must be actively playing.",
    sections: [
      {
        title: "Player teleport",
        syntax: "!teleport <player>",
        items: [
          { command: "<player>", description: "Selects the connected player whose current position and angles are copied." },
        ],
        note: "Using the command marks the teleporting player through the anti-cut warning path.",
      },
    ],
  },
  telesave: {
    introduction:
      "Copies another connected player's latest save into your own save state and immediately loads that position.",
    sections: [
      {
        title: "Saved-position teleport",
        syntax: "!telesave <player>",
        items: [
          { command: "<player>", description: "Selects the player whose latest save and checkpoint state are copied." },
        ],
        note: "You must be actively playing, and the target must have a saved position available.",
      },
    ],
  },
  viewrecords: {
    introduction: "Searches for a map and opens its record leaderboard.",
    sections: [
      {
        title: "Map leaderboard",
        syntax: "!viewrecords <map name or search terms...>",
        items: [
          { command: "<terms...>", description: "Every remaining word contributes to the map search." },
        ],
        examples: ["!viewrecords jm_legend", "!viewrecords scu legend"],
      },
    ],
  },
  vote: {
    introduction:
      "Starts one of the supported server votes. Each vote type has its own argument rules and numeric defaults.",
    sections: [
      {
        title: "Map votes",
        items: [
          { command: "!vote map <map name...>", description: "Searches for a map and starts a change-map vote." },
          { command: "!vote map next", description: "Starts the map-rotation vote." },
          { command: "!vote map_rotate / !vote endmap", description: "Starts the map-rotation vote directly." },
          { command: "!vote map_restart", description: "Starts a restart-current-map vote." },
        ],
      },
      {
        title: "Time and rules votes",
        items: [
          {
            command: "!vote addtime [minutes]",
            description: "Adds time; defaults to 30 minutes and clamps supplied values to 10-60. Aliases: add_time and time.",
          },
          {
            command: "!vote disable [minutes]",
            description: "Disables further voting; defaults to 15 minutes and clamps supplied values to 5-30. Alias: disablevote.",
          },
          {
            command: "!vote nades [on|off]",
            description: "Votes to set grenade availability. Omitting on/off votes to invert the current setting; grenade, grenades, and nade are aliases.",
          },
        ],
      },
      {
        title: "Player vote",
        items: [
          { command: "!vote mute <player>", description: "Intended to start a mute vote against a lower-level non-admin player." },
        ],
        note: "Current source mismatch: the mute branch looks up the word mute instead of the supplied player, so this path needs a game-script fix. The in-game help also advertises setnextmap, but the active handler has no setnextmap branch.",
      },
    ],
  },
};
