# Command behavior and rewrite specification

Status: draft implementation reference  
Scope: all 123 registered commands  
Source review date: 2026-07-22

This document turns the source review into a characterization specification for a future command rewrite. It records what the old game scripts currently do, including awkward behavior and confirmed mismatches, then proposes a cleaner contract. The two are deliberately separate: an observed bug is evidence, not a requirement.

The public wording is maintained in [`src/data/commandGuides.ts`](../src/data/commandGuides.ts). Mechanical argument evidence for all 123 commands is generated in [`docs/COMMAND_ARGUMENT_AUDIT.md`](./COMMAND_ARGUMENT_AUDIT.md). This file is the implementation-oriented layer between them and is maintained by hand after source review.

## Confidence and limits

- Registration, aliases, access levels, handlers, help handlers, argument reads, switch branches, defaults, ranges, free-text joins, and same-file helper calls were reviewed in source.
- The `taunt` review also followed the quick-message data used by its handler.
- The reviewed branches were not all exercised against a running COD2 server. Database results, map-search ranking, engine callbacks, and client rendering remain integration concerns.
- Source locations below are relative to `../jump4life/gsc`; most handlers live in `shared/jumpmod`, with COD2-specific setting behavior in `cod2/jumpmod`.
- “Current” means source-observed behavior. “Rewrite” means a proposed contract that still needs product approval before intentionally changing compatibility.

## Shared legacy input model

Registered handlers receive a `data` array. `data[0]` and `data[1]` are command metadata; the first user argument is `data[2]`. The old implementation mixes positional reads, loops over `data[i]`, `data.size` checks, switch statements, and command-specific helper calls. That makes syntax and validation difficult to audit consistently.

The rewrite should separate four stages:

1. **Parse** tokens into a command-specific request without side effects.
2. **Authorize** the caller, target, and current player/map state.
3. **Execute** one domain operation using the parsed request.
4. **Present** a stable success or error result to the player and logs.

A command definition should carry at least:

```text
name, aliases, access level, visibility
variants[]: syntax, parser, defaults, validation
policies[]: caller state, target relation, map/server state
executor: domain operation
result messages and audit fields
compatibility aliases and deprecation state
```

## Shared parsers and policies

These are recurring concepts in the reviewed commands and should be implemented once:

| Component | Used by | Required behavior |
| --- | --- | --- |
| `parseFreeTextTail` | `frename`, `kick`, `pm`, `poll`, `rename`, `saybold`, `setauthor`, `setprefname` | Require or allow an empty tail as declared; join all remaining tokens consistently; apply color stripping only when the command requests it. |
| `parseMapQuery` | `changemap`, `findmap`, `mapinfo`, `nominate`, `viewrecords`, `vote map` | Preserve all search tokens, return explicit no-match/ambiguous/exact outcomes, and keep search separate from the resulting action. |
| `parsePlayerTarget` | player-management, messaging, teleport, and player-record commands | Resolve one connected player and return an explicit not-found/ambiguous result. Never let a failed lookup silently select another player. |
| `parseRecordFilters` | `battle record`, `deleterec`, `personalbest`, `personalbestplayer` | Parse metric, FPS, rank, and scope independently of argument order; reject unknown or duplicate filters; centralize aliases and defaults. |
| `parseTeam` | `forceteam`, `moveteam` | Normalize playing-team and spectator aliases; only accept `none` where persistent assignment can be removed. |
| `parseBoundedInteger` | `battle`, `cpt`, `deleterec`, `setdate`, `taunt`, `vote` | Distinguish missing, malformed, and out-of-range values. Clamp only where the public contract explicitly says to clamp. |
| `parseBooleanMode` | `anglehelper`, `autobhop`, `autoload`, `autoreset`, `autostand`, `checkpointsound`, `classicmode`, `crosshair`, `csc`, `draw2d`, `drawgun`, `enablesave`, `fog`, `fullscreennotification`, `gun` | Normalize only the aliases declared by the setting. Unknown strings must fail instead of being coerced through `int(value)`. |
| `parseClientDisplayValue` | `drawdist`, `fov`, `fps` | Parse complete numeric tokens or a declared `cycle` action; enforce the active setting's supported range/set before mutation. |
| `parseCommandReference` | `help` | Resolve canonical names and aliases through the registry and return explicit unknown/inaccessible outcomes. |
| `parseHudControl` | `huds`, `measure`, `nowaypoints` | Parse a closed component/action pair and generate every displayed variant from the same accepted definition. |
| `parseOptionalSpeed` | `noclip` | Distinguish omitted toggle behavior from a complete finite numeric speed; reject malformed/non-positive values and apply the declared maximum once. |
| `parseAdminLevel` | `promote` | Require a complete integer token, preserve the intentional `-1` state, and evaluate caller-specific caps through a named authorization policy. |
| `parseSignedMinutes` | `addtime`, `allowvote`, `vote addtime`, `vote disable` | Keep signed adjustment, delayed-enable duration, and bounded vote duration as different types even though all are expressed in minutes. |
| `parsePositiveAmount` | `addxp` and later administrative numeric commands | Require a complete positive integer token and apply an explicit upper bound or delegate to a named domain limit. |
| `parseVotePin` | `confirmvote` | Require 4-10 ASCII digits exactly; never print or log the credential. |
| `parseReplayAction` | `replayexit`, `replaynextcp`, `replaypause`, `replayprevcp`, `replayskip`, replay HUD commands | Require replay state where the action needs it, represent requests as a closed enum, and return an explicit result instead of mutating unrelated HUD state outside playback. |
| `parseServerSelection` | `servers`, `players` | Preserve a declared search tail, distinguish zero/one/many matches, and bind the selected stable server ID to the subsequent action. |
| `parseSpawnAction` | `spawnpoint` | Accept only `put` or `purge`; represent purge as a destructive map-scoped operation requiring confirmation. |
| `parseXpMultiplier` | `xpmultiplier` | Parse complete finite decimal values with an optional trailing `x`, normalize to thousandths, and enforce 1.000-10.000. |
| `requireTargetBelowCaller` | `banplayer`, `fmute`, `forceteam`, `forcespec`, `frename`, `funmute`, `kick`, `killplayer`, `moveteam`, `mute`, `nades`, `promote`, `rename` | Apply one documented self-target rule and one lower-level comparison rule. |
| `requirePlaying` | `shock`, `teleplayer`, `teleport`, `telesave` | Return a stable failure when the caller or target is not actively playing. |
| `confirmDestructiveAction` | `cpt delete`, `cpt import delete`, `deleterec`, `reset`, `spawnpoint purge` | Bind confirmation to caller, action, exact target, and a short expiry; invalidate it when the selection changes. |

## Confirmed legacy issues and design debt

| ID | Command | Source-observed condition | Rewrite disposition |
| --- | --- | --- | --- |
| `CMD-001` | `vote mute` | The branch reads `data[2]`, the literal `mute`, for player lookup instead of the supplied player in `data[3]`. | Fix the request shape and add a regression test before enabling the branch. |
| `CMD-002` | `vote` | Help advertises `setnextmap`, but the active handler has no matching branch. | Remove the help entry or implement an intentional alias; do not leave it ambiguous. |
| `CMD-003` | `customtheme` | Help advertises `onscreen_stats`, but the handler has no matching case. | Remove it or implement it with a defined value type. |
| `CMD-004` | `cpt import delete` | Deletes all published checkpoints for the map without a confirmation step. | Route through the common destructive-action confirmation flow. |
| `CMD-005` | `setdate` | Year, month, and day ranges are checked independently; impossible calendar dates pass this handler. | Validate a real calendar date before persistence. |
| `CMD-006` | `nominate` | Legacy help refers to `setnextmap`; the registered active command is `nominate`. | Make `nominate` canonical and decide explicitly whether `setnextmap` remains an alias. |
| `CMD-007` | `frename` | The special uppercase value `NULL` is mixed into the free-text name grammar. | Add an explicit `clear` variant and keep `NULL` only as a compatibility alias if needed. |
| `CMD-008` | `deleterec` | Confirmation is expressed by repeating the same selection rather than an explicit confirmation command/token. | Use a target-bound confirmation record and expose the exact record about to be deleted. |
| `CMD-009` | `addtime` | Negative values are supported for level 80+, but the safety expression subtracts a negative adjustment and therefore does not validate the post-removal time as intended. Legacy help also describes only adding 1-1000 minutes. | Split add/remove requests and validate the resulting map time directly. |
| `CMD-010` | `afk` | `!afk <player>` checks another player's AFK status, but the in-game help advertises only the no-argument manual pause. | Document and test both variants or split the status check into a named command. |
| `CMD-011` | `banplayer` | The handler enforces neither a lower-admin target rule nor the help's claimed named-player limitation; help also says `!ban` although only `!banplayer` is registered here. | Add explicit target policy, remove stale restrictions, and use one canonical name before retaining this command. |
| `CMD-012` | `confirmvote` | Non-digits are silently stripped, the resulting PIN is printed to the server console, and success is reported before the asynchronous update is confirmed. | Require exact digits, treat the PIN as a secret, and acknowledge only a confirmed write. |
| `CMD-013` | `country` | The handler is read-only despite the old generated description saying “shows or sets”; the literal code `UK` is reported as unknown. | Keep the command read-only and normalize country codes through one ISO-aware lookup. |
| `CMD-014` | `csc` | The old generated description called this client-side collision, while the handler and help implement cross-server chat. | Keep cross-server chat as the canonical documented meaning. |
| `CMD-015` | `checkpointsound` | Unrecognized values fall through numeric coercion and still return success, commonly disabling the sound instead of reporting invalid input. | Accept a closed enum and reject every unknown value before mutation. |
| `CMD-016` | `donated`, `fignore`, `fmute`, `funmute`, `promote` | Live state and success output can be applied before the asynchronous database operation is confirmed; some paths continue after enqueue errors. | Define transactional result semantics, report persistence failure, and reconcile or roll back live state. |
| `CMD-017` | `endmap` | The old generated description says the command ends the current map, but the handler starts an end-map vote and can refuse while an equal/higher admin is online. | Name and document the vote operation explicitly; reserve direct map termination for a separate privileged action if required. |
| `CMD-018` | `fov` | Help advertises 65-95, while the active setting accepts 13-160 and `cycle`; invalid input is silently ignored because the handler drops the setting result. | Generate range/modes from the setting definition and return an explicit validation result. |
| `CMD-019` | `fps` | The main usage line omits 1000 and `cycle`, although both are accepted by the setting handler. | Generate usage and validation from one ordered FPS-preset definition. |
| `CMD-020` | `getlist` | The old generated description says it lists saved runs, but the handler lists connected-player identifiers. | Document the live-player listing and give saved-run discovery a separate name and data source. |
| `CMD-021` | `drawdist` | Non-numeric text is coerced to zero and accepted, which silently disables the override. | Require a complete non-negative integer token and report malformed input without changing state. |
| `CMD-022` | `drawgun` | The handler accepts `toggle`, but the legacy help advertises only `on` and `off`. | Generate help from the accepted enum and retain `toggle` as a documented mode. |
| `CMD-023` | `hello`, `english` | A call made during the shared cooldown resets its expiry, so repeated blocked attempts prolong the wait; `hello` also contains unregistered `!ola` and `!lethal` branches. | Model cooldown as a non-mutating authorization check and either register intentional aliases or delete unreachable branches. |
| `CMD-024` | `givebacksave` | A single numeric ID immediately restores and teleports a player's live run with no preview, confirmation, or audit record; malformed text becomes ID zero. | Require a positive ID, load a typed restore preview, confirm the exact target/snapshot, and audit the outcome. |
| `CMD-025` | `howmany` | The old generated description says it counts connected players, but it queries fully finished maps. The undocumented player argument silently falls back to the caller when lookup fails. | Document completed-map count, parse the optional target explicitly, and return not-found instead of changing query subject. |
| `CMD-026` | `huds` | Help advertises `stat top/bottom`, which the handler rejects, while implemented `seconds` and `nades`/`rpgs` variants are omitted. | Define HUD components and modes once, then generate handler parsing, help, and website variants from it. |
| `CMD-027` | `nadecheat` | The implemented `angle` diagnostic is absent from help; the command remains registered on COD4 even though the relevant damage-feedback path exits before applying these COD2-specific modes. | Separate cheat and diagnostic actions, declare game availability per variant, and generate help accordingly. |
| `CMD-028` | `noclip` | An undocumented speed is accepted, malformed/non-positive text becomes speed 1, and values above 50 are compared before being clamped by the setting handler. | Parse a strict optional speed in one place and base toggle/change behavior on the validated effective value. |
| `CMD-029` | `promote` | Malformed level text becomes zero, and level-91+ callers can therefore accidentally perform a demotion; live state is changed before persistence confirmation. | Require an exact integer, expose the effective caller cap, and commit/audit before changing live authority. |
| `CMD-030` | `myid` | The old generated description implies player, entity, and user IDs, but the handler prints only the persistent `player_id`. | Name the identifier precisely and add separate explicit commands/fields if other IDs are needed. |
| `CMD-031` | `help` | Unknown names produce no output, even though inaccessible known commands return their required level. | Return explicit unknown-command and inaccessible-command results from registry lookup. |
| `CMD-032` | `pistol` | Translated help contains a stale COD2-only subset while the handler builds different COD2/COD4 lists dynamically, including donor weapons. | Generate options and donor restrictions from the runtime weapon catalog for the active game. |
| `CMD-033` | `reset` | The command sets `sure_about_reset` before calling the menu reset helper, bypassing that helper's confirmation and immediately discarding the current run state. | Make immediate reset an explicit product decision or require a target-bound confirmation before destructive state replacement. |
| `CMD-034` | `savelist` | The name and old description imply listing saves, but the handler only changes a sort key and asynchronously refreshes saved-run history. | Rename it to a history-sort operation or make the displayed command contract explicit. |
| `CMD-035` | `saverun`, `savesettings`, `spawnpoint` | These paths print success before their asynchronous writes are confirmed; failure can therefore leave the player with a false acknowledgement. | Return a queued state followed by confirmed success/failure, or await a result before acknowledging completion. |
| `CMD-036` | `spawnpoint` | `purge` deletes every stored spawn for the current map without confirmation; `put` stores each position component after adding one and integer conversion. | Require destructive confirmation, audit the affected map/count, and either explain or remove the coordinate offset under migration tests. |
| `CMD-037` | `speclist` | Undercover spectators are filtered from player output but their names are printed to the server console while filtering. | Keep privacy filtering silent or send identity only to an explicit privileged audit sink. |
| `CMD-038` | `temppromote` | Malformed level text becomes zero; despite its name, the command permits temporary demotion and self-demotion and changes live authority without persistence. | Parse an exact level and expose the action as a clearly temporary live authority override with explicit promote/demote policy. |
| `CMD-039` | `theme` | The setting supports `cycle`, but invalid input is silent because the command drops the setting handler's failure result. | Generate the accepted theme enum and return explicit current/success/invalid results. |
| `CMD-040` | `replayanimdebug` | The hidden level-0 command is not replay-gated and prints a potentially large animation-name dump to the player and server console. | Restrict it to a development capability, paginate output, and separate current-animation inspection from pattern search. |
| `CMD-041` | replay HUD commands | Outside replay, handlers mutate or hide client HUD state; `replayhud` specifically forces global `cg_draw2D` on and clears text instead of returning not-in-replay. | Scope display ownership to replay elements, snapshot/restore prior client state, and return an explicit invalid-state result. |
| `CMD-042` | `xpmultiplier` | The handler accepts decimals and a trailing `x`, while legacy usage presents a simpler integer-looking range; `off` means neutral 1x rather than disabling XP. | Use one strict decimal grammar and label the neutral action `reset` or `1x`, retaining `off` only as a compatibility alias. |

## Per-command contracts

### `!ambiant`

**Registration:** level 0; alias `!ambient`; visible.  
**Source:** `_j4l_cmd_client_settings.gsc:41-79` (`ambiant`, `helpambiant`).

**Current behavior**

- Grammar: `!ambiant <on|off|toggle|cycle>`.
- A mode is required. `on` enables fallback ambient sound; `off` disables it; `toggle` and `cycle` both invert the current setting.
- The setting is player-scoped. Missing or unrecognized input falls back to command help.

**Proposed rewrite contract**

- Parse a required enum and normalize `cycle` to the compatibility alias of `toggle`.
- Return the resulting state, not merely the requested action, so repeated commands are observable and testable.
- Keep `ambient` as a spelling alias; consider deprecating the misspelled canonical name separately from the rewrite.

**Characterization and acceptance cases**

- From off, `!ambiant on` ends on; from on, `!ambiant off` ends off.
- `toggle` and `cycle` produce the same state transition.
- Missing and unknown modes do not mutate state and return syntax guidance.

### `!battle`

**Registration:** level 0; visible.  
**Source:** `_j4l_cmd.gsc:3957-4136` (`battle`, `helpbattle`).

**Current behavior**

- Target grammar: `!battle private`, `!battle public`, or `!battle player <player>`. The legacy token `privjet` means `private`.
- Grenade grammar: `!battle nades <equal|none|0|inf|infinite|infinity|infty|integer>`.
- Record grammar: `!battle record [metric] [fps] [rank] [player]`. Filters are scanned independently of order.
- Metrics are `time(s)`, `save(s)`, `load(s)`, `jump(s)`, and `nades`/`nadejumps`. FPS is `43`, `76`, `125`, `250`, `333`, or `mix`/`mixed`. Rank is 1-10.
- Record defaults are metric `time`, FPS `125`, and rank `1`. The `player` flag changes the comparison from the exact ranked run to that ranked player's best performance.
- The command updates which benchmark the player's battle HUD follows.

**Proposed rewrite contract**

- Model the request as distinct variants: `Personal`, `Public`, `Player(target)`, `Grenades(mode)`, and `RankedRecord(filters, comparePlayerBest)`.
- Use the common record-filter parser, reject duplicate filters, and return the normalized selection in the result.
- Preserve `privjet` and plural metric spellings only as compatibility aliases. Do not allow an arbitrary integer grenade value to collide with other variant parsing.

**Characterization and acceptance cases**

- `!battle record`, `!battle record 125 time 1`, and `!battle record time 1 125` select the same benchmark.
- Every infinity spelling selects the same grenade mode; `none` and `0` select zero.
- An unresolved player, invalid rank, unknown FPS, duplicate filter, or non-integer grenade count leaves the previous benchmark unchanged.

### `!changemap`

**Registration:** level 80; visible.  
**Source:** `_j4l_cmd.gsc:1055-1097` (`changemap`, `helpchangemap`).

**Current behavior**

- Grammar: `!changemap <map name or search terms...>`; every remaining token contributes to map search.
- After selecting a result, the handler schedules the map change after a short delay.
- The change is refused while an equal- or higher-level administrator is online; the caller is directed to that administrator or to voting.

**Proposed rewrite contract**

- Parse and resolve the map before authorizing the change. Report exact, ambiguous, and missing results distinctly.
- Isolate the “higher administrator online” policy from map lookup and make the comparison rule reusable and testable.
- Audit the caller, requested query, resolved map, policy decision, and scheduled execution time.

**Characterization and acceptance cases**

- Multi-word queries reach the map resolver intact.
- A unique result with no blocking administrator schedules exactly one map change.
- Ambiguous/no-match queries and the equal-or-higher-admin condition schedule no change.

### `!cpt`

**Registration:** level 40; visible; selected administrative branches require level 100.  
**Source:** `_j4l_cmd.gsc:3192-3564` (`cptroutes`, `cptrename`, `cptdelete`, `cpt2`, `helpcpt` and adjacent helpers).

**Current behavior**

- Placement grammar: `!cpt [radius <units>] [trigger <name>] [type <flags>] [event <name>] [entity]`. With no management subcommand, a temporary checkpoint is placed at the caller's current position.
- `trigger` creates trigger/secret-based passage behavior and disables radius when no explicit radius is supplied. `entity` attaches to the entity directly below the player.
- `type` flags are substring-matched and combinable: `onground`, `noweapon`, `notrace`, `hidden`, and `noprint`.
- Global events include `cheated` and `warned`; maps may register additional event names.
- Draft operations are `remove`, `removeall`, and `parse [radius] [route]`. `parse` marks the latest draft checkpoint as the endpoint and applies radius to checkpoints without one; radius defaults to 50.
- Published-route operations are `routes`, `rename <name|checkpoint_id> <new_name>`, and `delete <name|checkpoint_id>`. Rename and delete require level 100. Delete is confirmed with `!cpt delete <checkpoint_id> confirm`, and routes with recorded history are protected.
- `import <player_id>` publishes another player's draft and requires level 100. `import delete` deletes all published checkpoints for the map, also at level 100, currently without confirmation.

**Proposed rewrite contract**

- Split placement, draft, route, and import operations into explicit variants before executing any branch.
- Parse flags as exact tokens rather than substring matches, reject duplicates, and validate incompatible combinations.
- Replace overloaded `import delete` with an explicit `delete-all` administrative variant protected by target-bound confirmation.
- Use stable route IDs internally. Names are lookup conveniences and must surface ambiguity rather than choosing silently.
- Validate draft ownership, endpoint presence, event existence, entity availability, radius range, and recorded-history protection in named policies.

**Characterization and acceptance cases**

- Bare `!cpt` creates one caller-owned draft checkpoint; placement validation failure creates none.
- `parse` uses radius 50 only where radius was unset and marks exactly one endpoint.
- Level 40 cannot execute level-100 route mutations.
- Delete confirmation is bound to the exact route; changing the route invalidates it.
- The rewrite must add confirmation before any delete-all operation.

### `!customtheme`

**Registration:** level 1; alias `!ct`; hidden.  
**Source:** `_j4l_cmd.gsc:1338-1516` (`customtheme`, `helpcustomtheme`).

**Current behavior**

- Operations: `reset` clears custom values; `import <theme>` copies supported values from a registered theme.
- RGB items require three numeric components in the inclusive range 0-1: `highlight_safe`, `highlight_cheat`, `highlight_warn`, `ownrecord_background`, `color_8`, and `color_9`.
- Alpha items require one value in the inclusive range 0-1: `ownrecord_background_alpha` and `highlight_alpha`.
- Toggle items require `on|off`: `strip_name_colors` and `strip_name_colors_self`.
- Template items consume a template value: `name_other`, `name_self`, `number_other`, `number_self`, `rec_other`, `rec_self`, `hud_stats`, `hud_stats_value`, and `hud_stats_mix_string_m`.
- Template validation accepts formatting characters but rejects alphabetic characters other than `C`, `c`, and `s`.
- Help mentions `onscreen_stats`, but the handler does not implement it (`CMD-003`).

**Proposed rewrite contract**

- Declare each key once with a value type (`rgb`, `alpha`, `boolean`, or `template`), validator, default, and renderer destination.
- Make `set <key> <value...>`, `reset`, and `import <theme>` distinct variants. Unknown keys must return the valid key set for their expected type.
- Validate the entire value before mutating any theme state. Import should be atomic and report missing/unsupported fields.
- Remove `onscreen_stats` from documentation unless a typed implementation is added.

**Characterization and acceptance cases**

- RGB requires exactly three finite values from 0 through 1; alpha requires exactly one.
- Toggle values other than `on` and `off` do not mutate the theme.
- Reset and import either complete atomically or leave the previous custom theme unchanged.
- Every documented key has a handler definition, and every handler key is generated into documentation.

### `!deleterec`

**Registration:** level 100; visible.  
**Source:** `_j4l_cmd.gsc:1961-2070` (`deleterec`, `helpdeleterec`).

**Current behavior**

- Grammar: `!deleterec <metric> [fps] <rank>`; filters are scanned from the supplied arguments.
- Metric is required and accepts time/save/load/jump/nades families. FPS accepts `43`, `76`, `125`, `250`, `333`, or `mix` and defaults to `125`. Rank 1-10 is required.
- The selected ranked record belongs to the current route.
- The same fully specified selection must be repeated to confirm deletion. A changed filter selects a different record and does not match the pending confirmation.

**Proposed rewrite contract**

- Resolve filters into a normalized record identity before confirmation, then display player, metric, FPS, rank, value, route, and immutable record ID.
- Confirm by immutable record ID plus caller and expiry, not by raw argument repetition.
- Re-check that the record still exists and still matches the displayed identity immediately before deletion.

**Characterization and acceptance cases**

- Missing metric/rank, unknown tokens, or out-of-range rank delete nothing.
- First valid invocation creates a pending action and deletes nothing.
- Confirmation for a changed, expired, or already-deleted record fails safely.
- A successful confirmation deletes exactly the displayed record and clears pending state.

### `!findmap`

**Registration:** level 0; hidden.  
**Source:** `_j4l_cmd_vote.gsc:12-39` (`findmap`, `helpfindmap`).

**Current behavior**

- Grammar: `!findmap <map name or search terms...>`.
- Every remaining token contributes to a search of installed maps; the command presents matching results without changing the map.

**Proposed rewrite contract**

- Use the shared map resolver in search-only mode and return stable result IDs/names that can be reused by map-changing commands.
- Define a result limit and deterministic ordering. Distinguish exact, partial, no-match, and truncated result sets.

**Characterization and acceptance cases**

- Multi-token input is preserved and produces no server mutation.
- Empty input returns syntax help; no match returns an explicit no-match result.
- Repeating the same query against an unchanged map catalog returns the same ordering.

### `!forceteam`

**Registration:** level 90; visible.  
**Source:** `_j4l_cmd.gsc:3638-3714` (`forceteam`, `helpforceteam`).

**Current behavior**

- Grammar: `!forceteam <allies|axis|spectator|none> <player>`.
- `spectator` and `spectate` are accepted spectator spellings. `none` and `n` remove the assignment.
- A playing or spectator selection immediately moves the player and stores a persistent team assignment. The target must be below the caller's admin level.

**Proposed rewrite contract**

- Parse team mode before resolving the target; represent removal as `ClearTeamLock`, not as a pseudo-team.
- Apply the lower-level target policy consistently and audit old/new assignment plus the immediate move outcome.
- If moving succeeds but persistence fails, report and reconcile the partial operation rather than pretending success.

**Characterization and acceptance cases**

- Playing and spectator modes both move and persist the chosen assignment.
- `none`/`n` removes persistence without inventing a team value.
- Equal/higher-level, ambiguous, or missing targets produce no move and no stored change.

### `!frename`

**Registration:** level 80; visible.  
**Source:** `_j4l_cmd.gsc:1257-1313` (`frename`, `helpfrename`).

**Current behavior**

- Grammar: `!frename <player> <new name...>` or `!frename <player> NULL`.
- The target may be the caller or a lower-level player. All remaining words are joined as the enforced name.
- The uppercase sentinel `NULL` clears the active forced-name flag and stores a null expiry.
- Callers at level 90 or above create a one-day expiry; lower authorized callers create a two-hour expiry.

**Proposed rewrite contract**

- Use explicit `set <player> <name...>` and `clear <player>` variants; optionally retain `NULL` as a deprecated alias.
- Centralize name sanitation, empty-name/length rules, color handling, target policy, and expiry calculation.
- Store who imposed or cleared the rule, the normalized name, reason if later added, creation time, and expiry.

**Characterization and acceptance cases**

- Multi-word names are preserved according to the common free-text normalization rule.
- The level boundary produces exactly the documented two-hour or one-day expiry.
- Clear removes enforcement without writing the literal name `NULL`.
- Invalid/equal-or-higher targets and invalid names leave both live and stored names unchanged.

### `!kick`

**Registration:** level 90; visible.  
**Source:** `_j4l_cmd.gsc:5100-5135` (`kickplayer`, `helpkickplayer`).

**Current behavior**

- Grammar: `!kick <player> [reason...]`.
- The target may be the caller or a lower-level player. All tokens after the target are appended to the kick message.
- The command disconnects the selected player; the reason is optional.

**Proposed rewrite contract**

- Resolve and authorize the immutable player/session identity before building the message.
- Normalize the optional reason once, enforce output length, and log caller, target identity, and reason separately from the client-facing text.
- Decide explicitly whether self-kick remains allowed; do not inherit it accidentally from a shared comparison helper.

**Characterization and acceptance cases**

- A valid lower-level target is disconnected once with the full normalized reason.
- Omitting the reason remains valid and uses a stable default message.
- Ambiguous, disconnected, equal-level, or higher-level targets are not kicked.

### `!mapinfo`

**Registration:** level 0; aliases `!mapinfos`, `!minfo`; visible.  
**Source:** `_j4l_cmd.gsc:2286-2310`, `2483-2487` (`mapinfo`, `helpmapinfo`).

**Current behavior**

- `!mapinfo` shows stored metadata for the current map.
- `!mapinfo <map name or search terms...>` searches for another map and shows the selected result's metadata.

**Proposed rewrite contract**

- Model current-map lookup and searched-map lookup as separate parser variants using the same metadata presenter.
- Surface missing fields as unavailable, not as empty values, and include the stable map identity used for later commands.

**Characterization and acceptance cases**

- No arguments always target the current map.
- A unique query targets only the resolved map; ambiguous/no-match results do not fall back to current map.
- Both variants render the same metadata schema.

### `!moveteam`

**Registration:** level 100; visible.  
**Source:** `_j4l_cmd.gsc:3586-3636` (`moveteam`, `helpmoveteam`).

**Current behavior**

- Grammar: `!moveteam <allies|axis|spectator> <player>`.
- Spectator aliases are `spectator`, `spectate`, and `spec`.
- The target may be the caller or a player below the caller's admin level.
- The command performs a one-time move and does not store a future team lock.

**Proposed rewrite contract**

- Share exact team and player parsing with `forceteam`, but expose only a `MoveOnce` executor and no `none` variant.
- Return both the previous and resulting team and audit the move independently of persistent team assignments.

**Characterization and acceptance cases**

- Every spectator alias produces the same one-time move.
- A successful move creates or changes no persistent force-team record.
- Invalid team and unauthorized/unresolved target cases produce no move.

### `!nominate`

**Registration:** level 20; visible.  
**Source:** `_j4l_cmd.gsc:4694-4725` (`nominate`, `helpnominate`).

**Current behavior**

- Grammar: `!nominate <map name or search terms...>`; all remaining tokens contribute to map search.
- The selected map is stored as the caller's next-map nomination.
- Legacy in-game help calls this operation `setnextmap`, but `nominate` is the active registered command (`CMD-006`).

**Proposed rewrite contract**

- Resolve one stable map ID, then store one nomination per player according to an explicit replace/update policy.
- Make `nominate` canonical. Either register and test `setnextmap` as a deprecated alias or remove it from every help surface.
- Return the resolved map and whether a previous nomination was replaced.

**Characterization and acceptance cases**

- A unique multi-word query stores exactly the resolved map for the caller.
- Ambiguous/no-match input changes no existing nomination.
- Website help, in-game help, and registered aliases agree on the `setnextmap` decision.

### `!personalbest`

**Registration:** level 1; alias `!pb`; visible.  
**Source:** `_j4l_cmd.gsc:2599-2821` (`personalbest`, `helppersonalbest`).

**Current behavior**

- Grammar: `!personalbest [metric] [fps] [all]`; optional filters can appear in any order.
- Metric aliases are `time(s)`, `save(s)`, `load(s)`, and `jump(s)`. Metric defaults to `time`.
- FPS accepts `43`, `76`, `125`, `250`, `333`, or `mix`/`mixed`; COD2 defaults to `125`.
- Without `all`, the query uses the current route/endpoint. `all` queries every non-funmode endpoint.

**Proposed rewrite contract**

- Use the shared record-filter parser with scope `CurrentRoute|AllNonFunmodeRoutes` and caller as the fixed subject.
- Return structured no-record results separately from parser failures.
- Define ordering and output limits for `all`; do not let the data layer decide presentation implicitly.

**Characterization and acceptance cases**

- Bare `!pb` equals `!personalbest time 125` for the current route.
- Equivalent filter orders and aliases resolve to the same normalized query.
- Unknown/duplicate filters fail before querying; `all` never includes funmode routes.

### `!personalbestplayer`

**Registration:** level 1; alias `!pbp`; visible.  
**Source:** `_j4l_cmd.gsc:381-617` (`personalbestplayer`, `helppersonalbestplayer`).

**Current behavior**

- Grammar: `!personalbestplayer <player> [metric] [fps] [all]`.
- The player is required and must resolve to a logged-in player; remaining filters can appear in any order.
- Metric, FPS, defaults, and `all` scope match `personalbest`.

**Proposed rewrite contract**

- Resolve the player to a stable player ID before running the common personal-best query.
- Share all filter and output behavior with `personalbest`; only subject resolution differs.
- Decide separately whether an offline/stored player lookup should be supported instead of accidentally depending on current connection state.

**Characterization and acceptance cases**

- For the caller as target, normalized `pbp` and `pb` queries return the same data.
- Missing/ambiguous/offline target fails before querying records under the current contract.
- Filter aliases, defaults, scope, ordering, and funmode exclusion match `personalbest` exactly.

### `!pm`

**Registration:** level 0; hidden.  
**Source:** `_j4l_cmd.gsc:2187-2252` (`pm`, `helppm`).

**Current behavior**

- Grammar: `!pm <player> <message...>`; both recipient and non-empty message are required.
- Every token after the target becomes the private message.
- Delivery is blocked when either player is ignoring the other and is subject to spam protection.

**Proposed rewrite contract**

- Resolve one recipient session, normalize and length-check the message, then evaluate mutual-ignore and rate-limit policies before delivery.
- Return one privacy-safe failure for blocked delivery where exposing ignore state is undesirable; log the internal policy reason separately.
- Emit sender and recipient views from one message event so formatting cannot diverge.

**Characterization and acceptance cases**

- A valid unblocked message is delivered exactly once to the intended recipient and acknowledged to the sender.
- Missing/ambiguous target, empty message, either ignore direction, or active rate limit delivers nothing.
- Message formatting cannot inject another command or unintended server formatting beyond the declared policy.

### `!poll`

**Registration:** level 40; visible.  
**Source:** `_j4l_cmd.gsc:3566-3584` (`poll`, `helppoll`).

**Current behavior**

- Grammar: `!poll <question...>`.
- At least one word is required; all remaining words form the yes/no poll question.

**Proposed rewrite contract**

- Parse a non-empty bounded question, normalize whitespace, and pass it to a poll service that owns active-poll conflicts, duration, eligible voters, and result publication.
- Audit the caller and normalized question independently from presentation formatting.

**Characterization and acceptance cases**

- Multi-word punctuation-bearing questions are preserved under the documented normalization rule.
- Empty or over-limit questions create no poll.
- A second poll follows an explicit replace/reject policy rather than overwriting implicitly.

### `!rename`

**Registration:** level 80; visible.  
**Source:** `_j4l_cmd.gsc:4885-4923` (`rename`, `helprename`).

**Current behavior**

- Grammar: `!rename <player> <new name...>`.
- The target may be the caller or a lower-level player. Every remaining word becomes the player's current client name.
- Unlike `frename`, this does not create a stored forced-name rule.

**Proposed rewrite contract**

- Reuse target policy and name validation with `frename`, but execute only an immediate session rename.
- Explicitly define empty, maximum-length, duplicate-name, color-code, and reserved-name behavior.
- Return the old and normalized new name and write an administrative audit event.

**Characterization and acceptance cases**

- Multi-word names are joined and validated consistently.
- A successful rename changes only the live name and creates no forced-name persistence.
- Invalid names and unauthorized/unresolved targets preserve the old name.

### `!saybold`

**Registration:** level 60; alias `!sb`; visible.  
**Source:** `_j4l_cmd.gsc:4644-4692` (`saybold`, `helpsaybold`).

**Current behavior**

- Grammar: `!saybold <message...>`; all remaining tokens form a centered bold broadcast.
- Recipients who ignore the sender do not receive the message.
- The command is blocked while the sender is muted and uses an anti-spam cooldown that becomes shorter at higher admin levels.

**Proposed rewrite contract**

- Normalize one bounded broadcast message, evaluate mute and caller-specific rate-limit policy, then derive the recipient set using ignore relationships.
- Record successful recipient count without leaking individual ignore choices.
- Keep transport/presentation separate from policy so another broadcast format cannot bypass mute or spam checks.

**Characterization and acceptance cases**

- Eligible non-ignoring recipients receive one identical message; ignoring recipients receive none.
- A muted or rate-limited caller broadcasts nothing.
- Admin-level cooldown boundaries are deterministic and covered by clock-controlled tests.

### `!setauthor`

**Registration:** level 90; visible.  
**Source:** `_j4l_cmd.gsc:1155-1175` (`setauthor`, `helpsetauthor`).

**Current behavior**

- Grammar: `!setauthor <author...>`; every remaining token becomes the current map's author metadata.
- Level 100 can overwrite an existing author. Other authorized callers can set it only when the current author is null/empty.

**Proposed rewrite contract**

- Parse a non-empty bounded author string and perform a compare-and-set operation for non-level-100 callers.
- Put overwrite policy in authorization, not in string/persistence code. Audit previous value, new value, map ID, and caller.
- Avoid check-then-write races by enforcing the empty-only condition in the persistence operation.

**Characterization and acceptance cases**

- An authorized non-level-100 caller can set an empty author exactly once and cannot overwrite it.
- Level 100 can replace an existing value.
- Empty/invalid values and failed policy checks leave metadata unchanged.

### `!setdate`

**Registration:** level 90; visible.  
**Source:** `_j4l_cmd.gsc:1126-1153` (`setdate`, `helpsetdate`).

**Current behavior**

- Grammar: `!setdate <YYYY> <MM> <DD>`.
- Year is limited to 2000-2050, month to 1-12, and day to 1-31.
- The handler checks component ranges but does not itself reject impossible calendar combinations such as day 31 in a 30-day month (`CMD-005`).

**Proposed rewrite contract**

- Parse exactly three integer tokens, construct a real calendar date, and reject normalization/rollover.
- Store one canonical date representation while formatting year/month/day only at presentation boundaries.
- Keep the existing 2000-2050 product range unless intentionally changed.

**Characterization and acceptance cases**

- Boundary years 2000 and 2050 and valid leap day 2024-02-29 pass.
- 1999, 2051, month 0/13, 2025-02-29, and 2026-04-31 fail without persistence.
- Extra tokens and non-integers are rejected rather than ignored.

### `!setprefname`

**Registration:** level 0; visible.  
**Source:** `_j4l_cmd.gsc:4449-4482` (`setprefname`, `helpsetprefname`).

**Current behavior**

- Grammar: `!setprefname [preferred name...]`.
- With no argument, the player's current name is used. With arguments, all remaining tokens become the preference.
- Game color formatting is stripped. The stored preferred name becomes active for records after the next map change.

**Proposed rewrite contract**

- Resolve the source (`CurrentName` or `ExplicitName`), strip formatting once, then apply the shared name validator before persistence.
- Return both the normalized preference and its activation timing. Keep pending and active values distinct if activation remains delayed.

**Characterization and acceptance cases**

- No-argument invocation stores the color-stripped current name.
- Explicit multi-word input is joined, stripped, validated, and stored.
- The current map's record identity does not change early; the next-map activation occurs exactly once.

### `!taunt`

**Registration:** level 40; hidden.  
**Source:** `_j4l_cmd.gsc:1939-1959` (`taunt`, `helptaunt`) plus the quick-message category data consumed by the handler.

**Current behavior**

- Grammar: `!taunt <category 1-3> <row 1-9> <variant>`; all three arguments are required.
- Category 1 selects quick commands, 2 quick statements, and 3 quick responses. Row selects one of nine phrase groups.
- Variant selects a sound clip; an oversized value falls back to a random available clip for the chosen phrase.

**Proposed rewrite contract**

- Parse category and row as bounded integers and resolve them to a phrase definition before handling the variant.
- Decide explicitly whether out-of-range variant means random, a dedicated `random` token, or an error. Prefer `random` plus a bounded explicit variant for predictable behavior.
- Keep phrase text, available clips, localization, cooldown, and playback transport in a data definition rather than nested command branches.

**Characterization and acceptance cases**

- Categories 1-3 and rows 1-9 map to the expected phrase family and row.
- Missing/non-numeric/out-of-range category or row plays nothing.
- The current oversized-variant random fallback is captured before intentionally changing to an explicit `random` contract.

### `!teleport`

**Registration:** level 1; aliases `!tele`, `!te`; hidden.  
**Source:** `_j4l_cmd.gsc:4259-4300` (`teleport`, `helpteleport`).

**Current behavior**

- Grammar: `!teleport <player>`.
- Both caller and target must be actively playing. The caller is moved to the target's current position and view direction.
- Use of the command marks the caller through the anti-cut warning path.

**Proposed rewrite contract**

- Resolve a target session, snapshot target position/angles, evaluate both player-state policies, then perform one teleport operation.
- Define self-target behavior and target-disconnect races explicitly. Apply anti-cut state in the same success transaction/path as movement.
- Audit source and destination identities without logging sensitive positional data unless needed diagnostically.

**Characterization and acceptance cases**

- A valid playing target copies position and angles and applies the anti-cut marker exactly once.
- Spectator/dead/unavailable caller or target causes no movement.
- If target state becomes invalid before execution, the operation fails rather than using stale coordinates.

### `!telesave`

**Registration:** level 1; alias `!ts`; hidden.  
**Source:** `_j4l_cmd.gsc:4302-4350` (`telesave`, `helptelesave`).

**Current behavior**

- Grammar: `!telesave <player>`.
- The caller must be actively playing and the connected target must have a saved position.
- The target's latest save and checkpoint state are copied into the caller's save state, then loaded immediately.

**Proposed rewrite contract**

- Snapshot a versioned, complete save object, validate it against the current map/route, then atomically replace and load the caller's save.
- Never partially copy checkpoint/save fields. Define whether self-target is a no-op, reload, or error.
- Audit the operation by player and save identity/version rather than raw coordinates.

**Characterization and acceptance cases**

- A valid target save copies every required save/checkpoint field and loads the copied position.
- Missing target save, inactive caller, wrong map/route, or stale/invalid save leaves the caller's prior save and position unchanged.
- Failure during load does not leave a partially replaced save state.

### `!viewrecords`

**Registration:** level 0; hidden.  
**Source:** `_j4l_cmd.gsc:1517-1545` (`viewrecords`, `helpviewrecords`).

**Current behavior**

- Grammar: `!viewrecords <map name or search terms...>`.
- Every remaining token contributes to map search; the selected map's record leaderboard is opened.

**Proposed rewrite contract**

- Resolve a stable map ID through the shared map parser, then open one leaderboard view with explicit initial metric/FPS/scope defaults.
- Keep map selection separate from UI opening so search errors cannot open a stale or previous map.

**Characterization and acceptance cases**

- A unique multi-word query opens records for exactly that map.
- Empty, ambiguous, and no-match input opens no leaderboard and reports the corresponding result.
- Repeated invocation does not accumulate duplicate UI state.

### `!vote`

**Registration:** level 1; aliases `!v`, `!callvote`, `!cv`; visible.  
**Source:** `_j4l_cmd_vote.gsc:41-243` (`vote`, `helpvote`).

**Current behavior**

- Map variants: `!vote map <map name...>`, `!vote map next`, `!vote map_rotate`, `!vote endmap`, and `!vote map_restart`.
- `!vote addtime [minutes]` defaults to 30 and clamps supplied values to 10-60. Aliases are `add_time` and `time`.
- `!vote disable [minutes]` defaults to 15 and clamps supplied values to 5-30. Alias: `disablevote`.
- `!vote nades [on|off]` sets grenade availability; omitting the state votes to invert the current value. Aliases are `grenade`, `grenades`, and `nade`.
- `!vote mute <player>` is intended to target a lower-level non-admin player, but the current branch looks up the literal `mute` token rather than the supplied player (`CMD-001`).
- Help advertises `setnextmap`, but the handler has no active branch for it (`CMD-002`).

**Proposed rewrite contract**

- Parse into closed variants: `Map(mapId)`, `RotateMap`, `RestartMap`, `AddTime(minutes)`, `DisableVoting(minutes)`, `SetNades(state|toggle)`, and `Mute(playerId)`.
- Apply common vote eligibility/cooldown/active-vote policy after variant parsing and before any vote is announced.
- Preserve documented clamping only if product intent is truly “coerce”; otherwise reject out-of-range values. Whichever decision is chosen must be explicit in generated help.
- Fix mute target indexing, require a resolved lower-level non-admin target, and add end-to-end regression coverage before exposing it as working.
- Remove `setnextmap` from help unless intentionally registered as an alias to a defined map-vote variant.

**Characterization and acceptance cases**

- Missing add-time/disable values use 30/15; current out-of-range inputs normalize to their documented boundaries.
- Bare `nades` computes the inverse of current state at vote creation; explicit `on|off` does not depend on current state.
- `map next`, `map_rotate`, and `endmap` normalize to the intended rotation variant; `map_restart` remains distinct.
- `mute <player>` resolves `data[3]`/the parsed target, never the subcommand token, and rejects administrators or unauthorized targets.
- Every help-advertised vote variant has a reachable parser branch and a characterization test.

## Batch 1 — next 20 commands

This batch contains the first 20 previously unreviewed commands in alphabetical order. The next batch therefore starts after `csc`.

### `!addtime`

**Registration:** level 60; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4398-4447` (`addtime`, `helpaddtime`).

**Current behavior**

- Grammar: `!addtime <signed minutes>`. Missing, non-numeric, and zero input prints help.
- Positive values are available at level 60. Values over 1000 and adjustments that would put total elapsed-plus-remaining map time above 1000 minutes are rejected.
- Negative values enter a separate level-80 branch and remove minutes. The branch consults equal/higher admins, but its remaining-time expression subtracts the already-negative input, so it does not reliably protect the intended four-minute floor (`CMD-009`).
- Successful changes call the shared time manager and broadcast the magnitude added or removed.

**Proposed rewrite contract**

- Parse explicit `AddMinutes(positive)` and `RemoveMinutes(positive)` requests with separate access policy.
- Validate the resulting map deadline directly against named minimum and maximum limits. Define the equal/higher-admin veto independently of time arithmetic.
- Return old remaining time, applied adjustment, and new remaining time for audit and presentation.

**Characterization and acceptance cases**

- Level 60 can add valid positive minutes but cannot remove time.
- Level 80 removal cannot produce less than the agreed minimum remaining time.
- Zero, malformed, over-limit, or policy-blocked requests do not change the deadline.

### `!addxp`

**Registration:** level 100; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1682-1806` (`addxp`, `adjustrankxpcommand`, `adjustrankxpcallback`, `helpaddxp`).

**Current behavior**

- Grammar: `!addxp <player> <amount>`; amount must parse to an integer greater than zero. The handler sets no maximum.
- The target must be connected. No target-level comparison is performed in this branch.
- An asynchronous stored procedure applies the adjustment and may return a block reason. On success, an online target's XP cache, scoreboard value, and rank information are refreshed and both parties are notified.

**Proposed rewrite contract**

- Parse a bounded positive amount, resolve a stable player ID, and authorize the adjustment before calling the rank service.
- Treat the stored procedure as authoritative and acknowledge success only from its result. Record requested and actual delta because domain limits may alter the applied value.
- Make target hierarchy/self-target and maximum adjustment explicit policies.

**Characterization and acceptance cases**

- Missing target/amount, unresolved target, non-integer, zero, and negative amounts do not call the procedure.
- A procedure block reason produces no local XP mutation and is reported to the caller.
- Successful adjustment refreshes a still-connected player and remains correct if the target disconnects before callback.

### `!afk`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2823-2861`; `shared/jumpmod/_distancetracking.gsc:40-94`.

**Current behavior**

- Bare `!afk` starts a manual pause only during an active logged-in run, outside replay/end/link-to-spawn states, while exactly still on the ground with no input pressed.
- Starting the pause records stop time, origin, AFK state, and the COD2 jump timer. Movement/input later resumes the run through distance tracking. Reissuing while already paused returns silently.
- `!afk <player>` is an undocumented second variant that reports whether the target's AFK timer exceeds `level.afktimevote` (`CMD-010`).

**Proposed rewrite contract**

- Split `PauseRun` and `CheckPlayerStatus(target)` at parse time, or move the status check to an explicit subcommand.
- Return named pause-precondition failures and make resume conditions part of the AFK pause service.
- Keep run timer, jump timer, AFK flags, and resume cleanup atomic.

**Characterization and acceptance cases**

- Valid still/on-ground active-run state pauses both timers; any failed precondition changes none.
- Movement or input resumes exactly once and clears manual pause state.
- Player-status lookup never starts or changes the caller's pause.

### `!alias`

**Registration:** level 0; aliases `!a`, `!realname`, `!rn`, `!getrealname`; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:5201-5283` (`alias`, callbacks, `helpalias`).

**Current behavior**

- Grammar: `!alias <player>`; the target must be connected and supplies a stable player ID.
- The first asynchronous query derives up to 25 recorded names, weighted by accumulated checkpoint time. The callback prints them, then a second query prints the stored preferred name when defined.
- Results are shown only to the caller; callbacks free results and stop presenting if the caller disconnected.

**Proposed rewrite contract**

- Resolve the subject once and query a repository method that returns `{recordedNames, preferredName}` with deterministic ranking semantics.
- Define whether aliases are public, admin-only, or privacy-controlled rather than inheriting unrestricted level-0 access accidentally.
- Return one coherent response even when one data source is unavailable.

**Characterization and acceptance cases**

- Unresolved target schedules no query.
- Zero aliases displays a no-alias state while still checking preferred name.
- Disconnect races free resources and do not address results to a reused entity/session.

### `!allowvote`

**Registration:** level 60; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_vote.gsc:245-285` (`allowvote`, `helpallowvote`).

**Current behavior**

- Grammar: `!allowvote <on|off|minutes>`.
- `on` sets `vote_enable_time` to now, enables voting, and broadcasts the state. `off` clears the enable time, disables voting, and broadcasts.
- A numeric value must be 5-45. It disables voting and sets a future enable timestamp; it broadcasts “off” only when voting was previously enabled.

**Proposed rewrite contract**

- Parse `EnableNow`, `DisableIndefinitely`, or `DisableUntil(duration)` as closed variants.
- Have one vote-state service own the boolean/timestamp invariant and scheduled re-enable behavior.
- Return the effective state and timestamp in a structured audit event.

**Characterization and acceptance cases**

- Boundaries 5 and 45 schedule correctly; 4, 46, zero, and malformed input do not mutate state.
- `on` clears any future delay; `off` cannot accidentally retain one.
- Delayed enable becomes available once at the intended server time.

### `!anglehelper`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:187-201`; setting effect in `shared/jumpmod/_jumpmod.gsc:368-410`.

**Current behavior**

- Grammar: `!anglehelper <on|off>` with exact tokens.
- The shared setting path updates player state and UI cvars. Enabling starts the angle-helper HUD thread; disabling invokes HUD cleanup.

**Proposed rewrite contract**

- Use the common boolean-setting parser and an idempotent angle-helper component with explicit start/stop lifecycle.
- Return the final state after the component transition succeeds.

**Characterization and acceptance cases**

- Repeated `on` creates at most one helper loop; repeated `off` leaves no HUD artifacts.
- Missing or unknown input changes neither setting nor HUD.

### `!autobhop`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2270-2284` (`autobhop`, `helpautobhop`).

**Current behavior**

- Grammar: `!autobhop <on|off>` with exact tokens.
- It updates the player `autobhop` setting used by the movement logic that automatically jumps after holding jump for 500 ms and touching ground or a ladder.

**Proposed rewrite contract**

- Define this as a typed player preference and keep the 500 ms movement behavior in the movement subsystem, not the command.
- Document whether the preference persists across reconnects and generate command/settings UI from the same definition.

**Characterization and acceptance cases**

- `on` and `off` set the expected boolean; missing/unknown input does not coerce to false.
- Enabling changes only eligible held-jump movement, not single normal jumps.

### `!autoload`

**Registration:** level 1; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1620-1640`; setting effect in `shared/jumpmod/_measure.gsc:49-65`.

**Current behavior**

- Grammar: `!autoload <on|off>` with exact tokens.
- It toggles `autoload_init`. Disabling also clears the stored `autoload_org` height/origin; enabling does not itself choose a height.
- The help describes shooting a platform to choose a height and loading the prior position when falling below it.

**Proposed rewrite contract**

- Separate `Enable`, `Disable`, and `SetThreshold(origin)` operations in the autoload subsystem even if threshold selection remains a weapon interaction.
- Return whether a valid threshold exists and make disable cleanup idempotent.

**Characterization and acceptance cases**

- `off` always clears the threshold; `on` never fabricates one.
- Falling below a valid threshold loads once according to the save/load policy.
- Invalid command input changes neither enabled state nor threshold.

### `!autoreset`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4381-4396` (`autoreset`, `helpautoreset`).

**Current behavior**

- Grammar: `!autoreset <on|off>` with exact tokens.
- It updates the player's `auto_reset` setting, which controls automatic statistic reset when loading without an available save.

**Proposed rewrite contract**

- Keep command parsing as a typed boolean preference and define the no-save load behavior in the save/load service.
- Generate the same wording for command help and settings UI.

**Characterization and acceptance cases**

- `on` and `off` select the exact no-save policy; unknown input does not mutate it.
- The reset path runs only on the declared no-save condition.

### `!autostand`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2254-2268` (`autostand`, `helpautostand`).

**Current behavior**

- Grammar: `!autostand <on|off>` with exact tokens.
- It updates the player's `auto_stand` preference used after loading a saved position.

**Proposed rewrite contract**

- Treat stance restoration as a save/load policy fed by this typed preference.
- Make the exact relationship with saved crouch/prone stance explicit in tests.

**Characterization and acceptance cases**

- Enabled loads end standing; disabled loads follow the normal saved/current stance rule.
- Invalid input preserves the prior preference.

### `!banplayer`

**Registration:** level 90; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:356-379` (`banplayer`, `helpbanplayer`).

**Current behavior**

- Grammar: `!banplayer <player>`; the target must be connected.
- Two asynchronous writes set a one-year account ban and insert a one-year IP ban, then the target is immediately kicked.
- The branch does not compare target and caller admin levels and does not implement the help's named-player restriction. The help uses the unregistered spelling `!ban` (`CMD-011`).

**Proposed rewrite contract**

- Require an explicit lower-target policy, reason, duration, caller identity, and stable player/account/IP targets.
- Persist one auditable ban transaction before disconnecting, or report a clearly recoverable partial failure. Avoid independent writes with unconditional success behavior.
- Remove hardcoded-person wording and decide whether `ban` is an intentional alias.

**Characterization and acceptance cases**

- Equal/higher-level, self, unresolved, or already-disconnected targets follow explicit non-destructive policies.
- A confirmed successful ban covers the intended account and IP and disconnects exactly that session.
- Persistence failure is visible and cannot be reported as a complete ban.

### `!bounce`

**Registration:** level 90; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:876-910` (`bounce`, `helpbounce`).

**Current behavior**

- Grammar: `!bounce [status|on|off]`.
- Bare usage prints current `jump_bounceEnable`, map type, and help. `status` prints the value and map type without help.
- `on`/`off` synchronizes the server dvar to 1/0 and reports that the override lasts until next map initialization.

**Proposed rewrite contract**

- Parse query and mutation variants separately and put temporary dvar ownership in a map-lifetime server-settings service.
- Return previous/current values and reset provenance so map initialization can deterministically restore its configured default.

**Characterization and acceptance cases**

- Query variants never mutate the dvar.
- On/off affects all players once and map initialization restores the map-derived value.
- Unknown input leaves the value unchanged.

### `!checkpointsound`

**Registration:** level 0; alias `!cpsound`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1887-1903`; COD2 setting handler `cod2/jumpmod/_checkpoints.gsc:33-66`.

**Current behavior**

- Documented modes are `on`, `off`, `toggle`, and legacy `default`/`none`; the handler also accepts `cycle` and `pass_cp`.
- `on`, `default`, and `pass_cp` enable; `off` and `none` disable; `toggle` and `cycle` invert the boolean.
- Any other value is coerced with `int(value)`, stored as a boolean-like value, and reported as success (`CMD-015`).

**Proposed rewrite contract**

- Use a closed boolean-mode enum, normalize compatibility aliases, and reject unknown modes.
- If multiple checkpoint sounds are desired later, introduce a real sound-choice enum rather than numeric coercion.

**Characterization and acceptance cases**

- All documented aliases normalize to the expected boolean.
- Toggle/cycle invert exactly once and respect debounce policy.
- Unknown input preserves the previous state and returns valid choices.

### `!classicmode`

**Registration:** level 1; aliases `!funmode`, `!classic`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2576-2596`; COD2 setting handler `cod2/jumpmod/_checkpoints.gsc:33-50`.

**Current behavior**

- Grammar: `!classicmode <on|off>` with exact tokens.
- The command refuses when the map has no defined funmode. When state changes, the COD2 setting handler updates `funmode` and starts a run reset.
- Funmode does not punish cuts and uses only the final checkpoint according to the legacy help.

**Proposed rewrite contract**

- Model route/mode selection explicitly and validate map capability before changing it.
- Reset the run as an intentional consequence returned by the mode service, not a hidden setting callback.
- Keep all three command names mapped to the same definition.

**Characterization and acceptance cases**

- Unsupported maps reject both modes without resetting.
- A real state transition resets once; requesting the already-active state does not.
- Normal and funmode route/record namespaces remain isolated.

### `!clonetheme`

**Registration:** level 1; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1315-1336` (`clonetheme`, `helpclonetheme`).

**Current behavior**

- Grammar: `!clonetheme <player>`; the source must be connected.
- It assigns the target's `custom_theme` object to the caller and switches the caller to theme `custom`.
- The handler does not verify that the target theme is defined, complete, or independently copied.

**Proposed rewrite contract**

- Resolve and validate a versioned theme value, deep-copy supported fields, then atomically activate it.
- Report unsupported/missing fields and preserve the caller's prior theme if validation or activation fails.

**Characterization and acceptance cases**

- A valid source produces an independent equivalent theme for the caller.
- Missing/incomplete source theme changes nothing.
- Later source edits cannot mutate the caller's cloned value by shared reference.

### `!commands`

**Registration:** level 0; aliases `!cmds`, `!cmd`, `!command`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:5155-5199` (`commands`, `helpcommands`).

**Current behavior**

- Grammar: `!commands`; the handler ignores argument data.
- It iterates registered commands whose minimum level is at or below the caller's admin level, prints canonical names four per line, and points the caller to `!help`.
- Aliases and syntax are not included.

**Proposed rewrite contract**

- Query the same command registry used by dispatch and documentation, applying explicit visibility and capability policies.
- Paginate/format from structured command summaries instead of building aligned color-coded strings in the handler.

**Characterization and acceptance cases**

- A caller sees every and only the commands allowed by the agreed access/visibility policy.
- Aliases never create duplicate canonical entries.
- Registry, website count, and in-game list remain semantically consistent.

### `!confirmvote`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:313-354` (`getpin`, `confirmvote`, `helpconfirmvote`).

**Current behavior**

- Grammar: `!confirmvote <pin>`; only `data[2]` is read.
- `getpin` keeps digit characters and silently discards everything else. The resulting value must contain 4-10 digits.
- The normalized PIN is printed to the server console, an asynchronous update stores it in `player_information.mapvote_pin`, and success is printed immediately without callback confirmation (`CMD-012`).

**Proposed rewrite contract**

- Require exactly 4-10 digits, reject rather than sanitize mixed input, and treat the value as a secret in logs and telemetry.
- Bind confirmation to the current contest/player/action as appropriate and acknowledge only a confirmed persistence result.
- Define replacement, expiry, retry, and rate-limit behavior.

**Characterization and acceptance cases**

- Four and ten digits pass; shorter, longer, mixed, missing, or extra-token input fails.
- No plaintext PIN appears in console, audit, error, or analytics output.
- Database failure cannot produce a success acknowledgement.

### `!country`

**Registration:** level 1; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:3716-3736`, `3951-3955` (`country`, `helpcountry`).

**Current behavior**

- Grammar: `!country <player>`; the target must be connected.
- It reads the target's session `country` code and translates it to a long name. Missing, empty, and literal `UK` values are reported as unknown.
- The command does not set country information despite the former generated description (`CMD-013`).

**Proposed rewrite contract**

- Keep the command read-only and resolve a normalized ISO country code through one country service.
- Define privacy policy and use a stable `Known|Unknown|Hidden` result rather than special-casing a country literal in the command.

**Characterization and acceptance cases**

- Known normalized codes return their long name; absent/invalid data returns unknown.
- The lookup never mutates target data.
- `GB`/`UK` compatibility follows one documented normalization rule.

### `!crosshair`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:134-148`; setting effect in `shared/jumpmod/_fov.gsc:5-63`.

**Current behavior**

- Grammar: `!crosshair <on|off>` with exact tokens.
- The setting handler converts the boolean to an integer and calls `setcrosshair`, while the shared setting path updates UI state.

**Proposed rewrite contract**

- Represent crosshair visibility as a typed preference with one renderer/client-cvar adapter.
- Make settings UI and command aliases consume the same definition.

**Characterization and acceptance cases**

- On/off update both stored session state and the effective client crosshair.
- Unknown input preserves both.

### `!csc`

**Registration:** level 1; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1600-1618`; setting effect in `shared/jumpmod/_jumpmod.gsc:368-375`.

**Current behavior**

- Grammar: `!csc <on|off>` with exact tokens.
- It updates the player `csc` boolean and prints whether cross-server chat is enabled or disabled.
- This is cross-server chat, not client-side collision (`CMD-014`).

**Proposed rewrite contract**

- Rename the internal setting to an unambiguous `cross_server_chat_enabled` while retaining `csc` as the command name/alias.
- Route all cross-server message sending/receiving through the same preference check.

**Characterization and acceptance cases**

- On/off produce the matching setting and acknowledgement.
- Disabled players neither send nor receive cross-server chat according to the agreed policy.
- Unknown input does not silently disable the feature.

## Batch 2 — next 20 commands

This batch continues alphabetically after `csc`. The next batch begins after `hello`.

### `!donated`

**Registration:** level 100; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1642-1680` (`donated`, `helpdonated`).

**Current behavior**

- Grammar: `!donated <player> <1|0>`; the target must be connected and the state token must be exactly `1` or `0`.
- The live `donated` value changes immediately, followed by an asynchronous `player_information` update.
- The handler announces the grant/revocation even when queuing the database operation reports an error. Granting also tells the player which donor pistol command applies to the current game.

**Proposed rewrite contract**

- Parse a connected account target and a typed grant/revoke action, then persist through a donation-status service.
- Define whether persistence or live state is authoritative; acknowledge only a committed outcome and record actor, target, previous state, and new state in an audit event.

**Characterization and acceptance cases**

- Exact `1` grants and exact `0` revokes; missing, malformed, and alternate boolean tokens do nothing.
- Persistence failure cannot leave an unreported live-only status.
- Repeating the current state is idempotent and reports the resulting state.

### `!draw2d`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:912-926`; shared setting application in `_j4l_cmd_client_settings.gsc`.

**Current behavior**

- Grammar: `!draw2d <on|off>` with exact tokens.
- It stores a player-scoped boolean and applies the corresponding client HUD setting.

**Proposed rewrite contract**

- Use a typed client-display preference with one adapter responsible for both stored session state and the effective client value.
- Return the resulting state and keep settings UI/help sourced from the same definition.

**Characterization and acceptance cases**

- On/off update both the stored value and effective 2D rendering state.
- Missing or unknown input preserves both values and returns syntax guidance.

### `!drawdist`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:81-96`; active setting in `shared/jumpmod/_fov.gsc`.

**Current behavior**

- Grammar is intended as `!drawdist <non-negative integer>`; zero disables the custom override and there is no command-level maximum.
- Missing input or a parsed value below zero prints help.
- Numeric conversion turns malformed text into zero, so an invalid token can be accepted as a request to disable the override.

**Proposed rewrite contract**

- Require a complete non-negative integer token and represent zero as the explicit disabled state.
- Apply the validated value through a client-render settings service and surface its success/failure result.

**Characterization and acceptance cases**

- Zero disables; a positive integer sets that exact draw distance.
- Negative, fractional, malformed, or missing input does not mutate the existing value.
- Very large values follow an explicit engine-safe upper bound rather than relying on undocumented engine behavior.

### `!drawgun`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:853-874` (`drawgun`, `helpdrawgun`).

**Current behavior**

- Grammar: `!drawgun <on|off|toggle>`. `toggle` is implemented but omitted from legacy help.
- It changes first-person weapon-model visibility through the shared client HUD setting path; it does not control whether the weapon can be used.

**Proposed rewrite contract**

- Parse a closed display-mode enum and keep visibility separate from the `gun` capability setting.
- Generate help and settings UI from the same accepted mode list.

**Characterization and acceptance cases**

- On shows, off hides, and toggle deterministically inverts current visibility.
- No mode changes weapon availability.
- Unknown input leaves visibility unchanged.

### `!enablesave`

**Registration:** level 1; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1177-1209` (`enablesave`, `helpenablesave`).

**Current behavior**

- Grammar: `!enablesave <on|off>` with exact tokens.
- On sets the save override. If `cansave` is currently defined and false, it enables saving and marks the run cheated.
- Off clears the override and, when `cansave` is defined, disables saving. When that field is undefined, the override changes without an immediate message or effective-state update.

**Proposed rewrite contract**

- Model the user preference, current route permission, and ranked-run eligibility as separate typed states.
- Return the effective save state and any ranking consequence for every valid request, including pre-run invocation.

**Characterization and acceptance cases**

- Enabling a route-blocked save makes saving available and marks the run ineligible exactly once.
- Disabling prevents saving without silently changing unrelated run state.
- Invocation before `cansave` initialization has a defined deferred or rejected outcome.

### `!endmap`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4834-4850` (`endmap`, `helpendmap`).

**Current behavior**

- Grammar: `!endmap`; arguments are ignored.
- It searches for equal- or higher-level admins. If none are present, it schedules the end-map vote to start on the next frame.
- If such an admin is present, it refuses and asks the caller to contact them or use a vote. It never directly ends the map.

**Proposed rewrite contract**

- Expose this as a named request to start an end-map vote, with the higher-admin policy made explicit and independently testable.
- Return a structured `vote_started`, `blocked_by_admin`, or `vote_unavailable` result.

**Characterization and acceptance cases**

- With no equal/higher admin, exactly one vote starts.
- With one present, no map action or vote starts.
- Extra arguments do not accidentally select a different action; the rewrite may reject them for strictness.

### `!english`

**Registration:** level 80; alias `!en`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2099-2151` (`english`, `helpenglish`).

**Current behavior**

- Grammar: `!english <player>`; the target must be connected, cannot be the caller, and is protected at admin level 100. A muted caller is also rejected.
- It plays `english_motherfucker` for the target and prints a bold English-language reminder.
- It shares `hello_cooldown` with `hello`: level 80-90 callers wait one minute and level 91+ callers have no wait. A blocked call resets the expiry to a full wait again.

**Proposed rewrite contract**

- Resolve a non-self eligible target, authorize the sender, and consume a shared sound-action cooldown only after the action succeeds.
- Make the sound/message an explicit moderation preset with auditable actor and target fields.

**Characterization and acceptance cases**

- Self, disconnected, and level-100 targets receive no effect.
- A muted caller cannot trigger the action.
- Checking a live cooldown never extends it; a successful action creates exactly one cooldown interval.

### `!fignore`

**Registration:** level 20; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_chat.gsc:24-27,80-102,118-123` (`fignore`, `doignore`, `helpfignore`).

**Current behavior**

- Grammar: `!fignore <player>`; the target must be connected and cannot have admin level 100.
- If the target account ID is absent from the caller's ignore array, it is added immediately and asynchronously inserted into persistent ignore storage.
- There is no explicit self-target rejection. The success message can still follow a database enqueue error.

**Proposed rewrite contract**

- Resolve an account target, apply an explicit self/protected-target policy, and persist an idempotent ignore relation.
- Change live filtering only with a defined persistence result or visibly mark a temporary unsaved state.

**Characterization and acceptance cases**

- Adding a new eligible target persists one relation and activates filtering once.
- Re-adding an existing relation is idempotent and does not duplicate storage.
- Protected, malformed, and persistence-failed requests have no falsely acknowledged outcome.

### `!fmute`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4925-4957` (`fmute`, `helpfmute`).

**Current behavior**

- Grammar: `!fmute <player>`; the target must be connected.
- Self-target is allowed. Any other target whose admin level is greater than or equal to the caller's is rejected.
- The handler asynchronously stores a one-hour expiry, then immediately sets live `muted` state and the muting admin level without waiting for confirmation.

**Proposed rewrite contract**

- Parse a target and a fixed one-hour mute request, then enforce a shared moderation hierarchy policy.
- Persist actor, target, reason/source, start, and expiry; derive live state from the committed moderation result.

**Characterization and acceptance cases**

- Self or a lower-level target receives a one-hour mute; an equal/higher non-self target is unchanged.
- Persistence failure is reported and reconciles live state.
- Repeated mute requests have a documented expiry rule rather than silently replacing timestamps.

### `!fog`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:837-851` (`fog`, `helpfog`).

**Current behavior**

- Grammar: `!fog <on|off>` with exact tokens.
- It updates the player-scoped fog boolean through the shared client HUD-setting path.

**Proposed rewrite contract**

- Represent fog as a typed client-render preference with one application adapter.
- Return the resulting stored and effective state.

**Characterization and acceptance cases**

- On/off produce matching stored and effective fog states.
- Missing or unknown input preserves the current state.

### `!forcespec`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4998-5026` (`forcespec`, `helpforcespec`).

**Current behavior**

- Grammar: `!forcespec <player>`; the target must be connected.
- Self-target is allowed. Any other target at or above the caller's admin level is rejected.
- A non-spectating target is moved to spectators on the next frame. An existing spectator produces an informational message. No persistent team lock is created.

**Proposed rewrite contract**

- Reuse the shared moderation target policy, then request one immediate team transition without changing assignment policy.
- Distinguish successful movement, already-spectating, protected-target, and transition-failed results.

**Characterization and acceptance cases**

- An eligible playing target is moved once and remains free to choose another team later.
- An existing spectator is not reinitialized.
- Equal/higher non-self targets are unaffected.

### `!fov`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:118-132`; active setting in `shared/jumpmod/_fov.gsc`.

**Current behavior**

- Active grammar: `!fov <13-160|cycle>`, although legacy help advertises only 65-95.
- An integer from 13 through 160 sets the exact FOV. `cycle` advances through configured values.
- The command discards the setting handler's false result, so invalid input produces no help or failure message.

**Proposed rewrite contract**

- Source direct range, presets, and cycle behavior from one FOV definition used by parser, UI, and client application.
- Report the resulting value or a typed malformed/out-of-range error.

**Characterization and acceptance cases**

- Both endpoints 13 and 160 succeed; values outside the range do not mutate state.
- Cycle always selects the next declared preset and wraps deterministically.
- Malformed input returns guidance rather than failing silently.

### `!fps`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:98-116`; preset handling in `shared/jumpmod/_fov.gsc`.

**Current behavior**

- Active grammar: `!fps <43|76|125|250|333|1000|cycle>`.
- A supported number sets the exact maximum FPS; `cycle` advances through the same ordered list.
- Invalid input prints help. The primary help usage omits 1000 and does not mention `cycle`, although another help line mentions 1000.

**Proposed rewrite contract**

- Define the ordered preset set once and reuse it for validation, cycling, help, and client application.
- Return the selected value, with explicit unsupported-value errors.

**Characterization and acceptance cases**

- Every declared preset, including 1000, succeeds unchanged.
- Cycle visits only declared presets and wraps in the declared order.
- Other integers and malformed input leave the current FPS value unchanged.

### `!fullscreennotification`

**Registration:** level 0; alias `!fsn`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2863-2877`; setting effect in `shared/jumpmod/_saveload.gsc`.

**Current behavior**

- Grammar: `!fullscreennotification <on|off>` with exact tokens.
- On stores the `fsn` boolean and immediately previews a blue fullscreen notification.
- Off stores false and destroys an active fullscreen notification if present. The setting changes save/load feedback between fullscreen effects and normal print messages.

**Proposed rewrite contract**

- Use one typed save/load notification preference and keep preview cleanup in the presentation adapter.
- Make preference mutation and preview result independently observable.

**Characterization and acceptance cases**

- On enables and previews once; off disables and removes any active preview.
- Alias and canonical name have identical behavior.
- Unknown input changes neither preference nor active notification.

### `!funignore`

**Registration:** level 20; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_chat.gsc:29-32,80-102,125-130` (`funignore`, `doignore`, `helpfunignore`).

**Current behavior**

- Grammar: `!funignore <player>`; the target must be connected.
- If the target ID exists in the caller's live ignore array, it is removed by swapping in the final element, and the persistent relation is asynchronously deleted.
- If the ID is absent, the handler reports that the caller is not ignoring the target and does not issue a database deletion.

**Proposed rewrite contract**

- Delete an idempotent account-to-account ignore relation and update live filtering from the defined persistence outcome.
- Avoid requiring the target to be online once a stable account selector or ignore-list UI exists.

**Characterization and acceptance cases**

- Removing an existing relation leaves no live or persistent ignore entry.
- Removing a missing relation is a successful no-op or a stable `not_ignored` result.
- Persistence failure cannot be announced as a durable removal.

### `!funmute`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4959-4996` (`funmute`, `helpfunmute`).

**Current behavior**

- Grammar: `!funmute <player>`; the target must be connected.
- Self-target is allowed. Other targets at or above the caller's level are rejected, as are mutes recorded as imposed by an admin above the caller.
- The database expiry is cleared asynchronously while live `muted` and `muted_lvl` fields are cleared immediately.

**Proposed rewrite contract**

- Authorize unmute against the persisted moderation record's actor level, not only mutable live fields.
- Commit the revocation and audit event before deriving the effective live mute state.

**Characterization and acceptance cases**

- An authorized unmute clears the persistent record and live state once.
- A higher-authority mute remains intact.
- Persistence failure leaves or restores the effective mute and reports failure.

### `!getlist`

**Registration:** level 1; alias `!list`; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4727-4750` (`getlist`, `helpgetlist`).

**Current behavior**

- Grammar: `!getlist`; arguments are ignored.
- It lists connected players whose data and login completion are available, printing country, numeric admin level, entity number, and current name.
- Missing/empty country and the literal `UK` are shown as `??`. Contrary to the old generated description, it does not list saved runs.

**Proposed rewrite contract**

- Query a typed connected-player summary and render stable labeled fields with an explicit unknown-country value.
- Separate public and moderator-visible identifiers if entity/admin details should not be exposed to every level-1 user.

**Characterization and acceptance cases**

- Every eligible connected player appears once with the four intended fields.
- Partially initialized players are excluded without breaking the rest of the list.
- Alias and canonical name return the same snapshot.

### `!givebacksave`

**Registration:** level 100; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:213-290` (`givebacksave`, `givebacksave_callback`, `helpgivebacksave`).

**Current behavior**

- Grammar: `!givebacksave <checkpoint pass ID>`; numeric conversion is used without positive-ID validation, so malformed text queries ID zero.
- The asynchronous query joins the checkpoint pass to its run. The first row restores the connected owner only when its checkpoint exists on the current map.
- Restoration resets current save/checkpoint state; restores run/checkpoint IDs, counters, elapsed time, grenade statistics, distance tracking, and pure FPS; marks the run safe; teleports the player to the checkpoint; and resumes replay/checkpoint processing.
- No preview or confirmation is required. Missing result, offline owner, or wrong-map checkpoint is announced through broad error messages.

**Proposed rewrite contract**

- Parse a positive pass ID, load one immutable restore snapshot, and validate account, map, checkpoint, and replay compatibility without mutation.
- Present actor, target, map, checkpoint, and affected run state for target-bound confirmation; apply atomically and write an audit event.
- Return explicit not-found, player-offline, wrong-map, stale-snapshot, apply-failed, and restored outcomes.

**Characterization and acceptance cases**

- Invalid and missing IDs execute no query or mutation.
- Wrong-map/offline cases preserve all live run state.
- A confirmed valid snapshot restores every declared field and teleport exactly once; partial failure rolls back or leaves a recoverable audit record.

### `!gun`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:928-962` (`gun`, `helpgun`).

**Current behavior**

- Grammar: `!gun <on|off|toggle>`.
- The default state is enabled. On calls the engine weapon-enable path; off calls weapon-disable; toggle chooses the inverse of the current state.
- It synchronizes the `ui_mod_gun_enabled` client value. This controls weapon availability, not merely the drawn model.

**Proposed rewrite contract**

- Represent weapon availability as a typed gameplay preference/capability distinct from `drawgun` visibility.
- Apply server state and client UI state through one operation that reports the resulting value.

**Characterization and acceptance cases**

- On/off/toggle produce matching gameplay and UI state.
- First use begins from the documented enabled default.
- Changing `gun` does not implicitly change `drawgun`, and vice versa.

### `!hello`

**Registration:** level 40; alias `!bonjour`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2500-2531` (`hello`, `helphello`).

**Current behavior**

- Grammar presented to users is `!hello`; it plays a randomly selected `j4l_taunt_songs_*` sound rather than printing a multilingual greeting.
- The cooldown is eight minutes for levels 40-59, five for 60-79, one for 80-90, and zero for 91+. It is shared with `english`.
- A call during cooldown resets expiry to a full interval. An undocumented `fucker` argument halves the duration.
- Branches for command tokens `!ola` and `!lethal` exist, but neither is registered as an alias in the active command registration, making them unreachable through normal dispatch.

**Proposed rewrite contract**

- Define one random-song action with declared aliases, sound pool, access rule, and a shared non-extending cooldown policy.
- Remove the hidden duration argument and either register intentional sound aliases with normal metadata or delete unreachable token branches.

**Characterization and acceptance cases**

- Canonical and `bonjour` invocation select one configured sound and consume one cooldown interval.
- A blocked attempt reports remaining time without changing expiry.
- No undocumented token changes rate limits, and every supported alias is discoverable from the registry.

## Batch 3 — next 20 unreviewed commands

This batch continues with the first 20 alphabetical commands not already covered by the initial review or batches 1-2. The next batch begins after `removexp`.

### `!help`

**Registration:** level 0; alias `!h`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4752-4832` (`help`, `helphelp`).

**Current behavior**

- Grammar: `!help <command>`; a missing argument prints help for `help` itself.
- The lookup lowercases the token and scans canonical names, then aliases. A known command at or below the caller's level invokes that command's help handler and prints its canonical name plus aliases.
- A known inaccessible command reports its required level. An unknown command completes silently. Hidden status does not prevent lookup.

**Proposed rewrite contract**

- Resolve one command reference through the canonical registry and return `found`, `inaccessible`, or `unknown` explicitly.
- Render syntax, aliases, access, and curated guide sections from the same definition used by website documentation.

**Characterization and acceptance cases**

- Canonical, alias, and differently cased references resolve to the same definition.
- Inaccessible commands reveal only the agreed metadata and do not invoke their help executor.
- Unknown input returns a stable message and suggestions without silently succeeding.

### `!howmany`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:747-751,2312-2350` (`helphowmany`, `howmany`, `howmany_show`).

**Current behavior**

- Active grammar: `!howmany [player]`, although help documents only the no-argument form.
- It asynchronously counts maps for which the selected account has a finished run containing every end checkpoint defined for that map.
- With no target it uses the caller. If player lookup fails for any supplied token, it silently queries the caller and later formats the result as the caller's count.

**Proposed rewrite contract**

- Parse an optional connected-player target with distinct omitted, resolved, not-found, and ambiguous outcomes.
- Put the exact definition of “fully finished” in a named progress query and return subject identity with the count.

**Characterization and acceptance cases**

- Omitted target queries the caller; a valid target queries only that account.
- Invalid or ambiguous target executes no fallback query.
- Database failure returns an error rather than producing no message.

### `!hudedit`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4212-4219`; editor open path in `shared/jumpmod/_hud_editor.gsc:23-36`.

**Current behavior**

- Grammar: `!hudedit`; arguments are ignored.
- For a player with completed login data, it ensures and snapshots HUD positions, marks the editor open, clears selection, freezes controls, synchronizes the menu, and opens the HUD editor.
- Before login completion, the editor helper returns silently.

**Proposed rewrite contract**

- Treat editor opening as a state transition with explicit readiness, already-open, opened, and failed results.
- Keep position snapshot/rollback and input-freeze cleanup owned by an editor session object.

**Characterization and acceptance cases**

- A ready player gets one snapshot and one open editor session.
- A not-ready player receives a stable message and is never frozen.
- Closing or failing the editor always restores controls and either commits or rolls back positions intentionally.

### `!huds`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4154-4210` (`huds`, `helphuds`); setting consumers in `_onscreen_stats.gsc` and `_showrecords.gsc`.

**Current behavior**

- `!huds <on|off>` changes both record and statistics HUD visibility.
- Component forms are `stat <on|off>`, `rec <on|off|full|smart>`, `seconds <small|large>`, and `nades|rpgs <on|off>`. The two grenade labels write the same `show_nades` setting.
- Help advertises `stat top|bottom`, which has no handler branch. It omits `seconds` and `nades`/`rpgs`.

**Proposed rewrite contract**

- Define each HUD component, accepted mode, affected setting, and display label in one structured registry.
- Separate visibility from layout/size choices and report the resulting component state.

**Characterization and acceptance cases**

- Global on/off changes exactly record and statistics visibility.
- Every documented component/mode maps to one intended setting; aliases produce identical results.
- `stat top|bottom` is either implemented through a position setting or removed everywhere.

### `!ignore`

**Registration:** level 1; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_chat.gsc:14-17,80-109` (`ignore`, `doignore`, `helpignore`).

**Current behavior**

- Grammar: `!ignore <player>`; the target must be connected.
- It rejects an admin-level-100 target, otherwise adds the target account ID to the caller's non-persistent ignore list.
- There is no explicit self-target rejection. The relation lasts only for the current map session and is removed with `unignore`.

**Proposed rewrite contract**

- Reuse one account-target and ignore-relation service with an explicit self/protected-target policy and a declared session scope.
- Keep session and persistent variants as the same operation with different storage lifetimes.

**Characterization and acceptance cases**

- A new eligible target is filtered once; repeating the request is idempotent.
- Protected and unresolved targets do not change filtering.
- Session ignore is cleared at the declared lifecycle boundary while persistent ignore is not.

### `!jumptimer`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_vote.gsc:298-321`; HUD consumer in `cod2/jumpmod/_nadejumps.gsc`.

**Current behavior**

- Grammar: `!jumptimer <on|off>` with exact tokens.
- It directly changes `jumptimer_enabled`; the active COD2 jump handler shows the HUD countdown only while recovery is active.
- Valid requests print no acknowledgement and bypass the shared `changesetting` command path.

**Proposed rewrite contract**

- Store this as a typed HUD preference through the shared settings service and apply it to the countdown renderer.
- Return the resulting state and define whether the preference persists across sessions.

**Characterization and acceptance cases**

- On shows the countdown during recovery; off hides it immediately.
- Unknown input leaves both preference and rendered HUD unchanged.
- Command, settings menu, and persisted preference remain synchronized.

### `!killplayer`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:5028-5056` (`killplayer`, `helpkillplayer`).

**Current behavior**

- Grammar: `!killplayer <player>`; the target must be connected.
- Self-target is allowed. Any other target at or above the caller's admin level is protected.
- An actively playing target goes through the normal `dosuicide` path; a spectator/dead target produces an already-dead response.

**Proposed rewrite contract**

- Resolve and authorize a moderation target, require an alive/playing state, and execute one audited forced-death action.
- Return distinct protected, not-playing, already-dead, and killed outcomes.

**Characterization and acceptance cases**

- An eligible live target is killed exactly once through normal death cleanup.
- Equal/higher non-self targets and non-playing targets are unchanged.
- The self-target policy is explicit rather than emerging from a comparison exception.

### `!measure`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:964-985` (`measure`, `helpmeasure`); consumers in `shared/jumpmod/_measure.gsc`.

**Current behavior**

- Grammar: `!measure <numbers|graph|maxspeed|color> <on|off>` with exact tokens.
- The components map respectively to `measure_on`, `measure_graph`, `measure_maxspeed`, and `measure_color` through the shared setting path.
- Numbers controls the angle/speed measurement HUDs, while graph controls the speed graph.

**Proposed rewrite contract**

- Parse a typed measurement component and boolean state, backed by one component-to-setting map.
- Make dependent rendering behavior explicit, particularly whether graph/max-speed/color require numbers mode.

**Characterization and acceptance cases**

- Each component changes only its mapped preference and effective display.
- Missing/unknown component or mode preserves all measurement settings.
- Independent and dependent component combinations have defined renderer outcomes.

### `!mute`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:5404-5440` (`mute`, `helpmute`).

**Current behavior**

- Grammar: `!mute <player>`; the target must be connected and not already muted.
- Self-target is allowed. Any other target at or above the caller's admin level is protected.
- It sets live `muted` and `muted_lvl` fields and broadcasts the action, but writes no timed mute to the database.

**Proposed rewrite contract**

- Name this as an explicitly session-scoped mute and route target hierarchy through the shared moderation policy.
- Store actor, target, reason/source, and lifecycle boundary even for an in-memory moderation action.

**Characterization and acceptance cases**

- An eligible unmuted target becomes muted for the declared session scope.
- Already-muted and protected targets retain their existing mute record.
- `mute` and persistent `fmute` expose clearly different duration/persistence contracts.

### `!myid`

**Registration:** level 0; alias `!id`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2489-2499` (`myid`, `helpmyid`).

**Current behavior**

- Grammar: `!myid`; arguments are ignored.
- It prints only `self.data["player_id"]`, the persistent logged-in account/player ID.
- It does not print the temporary entity number or multiple identifier types implied by the old generated summary.

**Proposed rewrite contract**

- Return a labeled stable account ID and define a not-logged-in outcome.
- Keep entity/session IDs separate and expose them only through explicitly named diagnostic fields or commands.

**Characterization and acceptance cases**

- A logged-in player receives exactly their persistent account ID.
- Missing account state returns an explicit unavailable response rather than stringifying an undefined value.
- Alias and canonical name are identical.

### `!nadecheat`

**Registration:** level 1; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1211-1255` (`nadecheat`, `helpnadecheat`); damage behavior in `shared/jumpmod/_jump.gsc:356-382`.

**Current behavior**

- Grammar: `!nadecheat <on|off|99|angle>`. Help lists only on/off/99.
- On enables lethal-grenade protection and calls the anti-cut warning path. Off clears both `nadecheat` and `exilenade`, but leaves `nadeangle` unchanged.
- `99` forces COD2 grenade feedback damage to 99 and warns the run. `angle` independently toggles angle/effectiveness printouts without calling the warning path.
- The COD4 grenade-feedback path returns before applying these COD2-specific flags, although the command is registered there.

**Proposed rewrite contract**

- Split invulnerability/damage override from diagnostics, declare game compatibility per action, and model ranking eligibility explicitly.
- Replace magic token `99` with a named mode while retaining it only as a compatibility alias if required.

**Characterization and acceptance cases**

- Cheat modes consistently mark the run ineligible and have no hidden carry-over after disable.
- Diagnostic mode changes only diagnostic output unless product policy declares otherwise.
- Unsupported game/version returns an explicit response without mutating ineffective flags.

### `!nades`

**Registration:** level 80; visible where registered by the game configuration.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:807-837` (`nades`, `helpnades`); weapon application in `shared/jumpmod/_weapons.gsc:261-284`.

**Current behavior**

- Grammar: `!nades <player> <on|off>`; both arguments are required and exact.
- Self-target is allowed. Any other target at or above the caller's admin level is protected.
- It stores `grenades_enabled`; for an actively playing target it immediately gives/configures or removes the current game's grenade weapon, then broadcasts a bare success line server-wide.

**Proposed rewrite contract**

- Apply a typed player capability through one weapon-loadout service with shared hierarchy authorization.
- Return previous/current state and target identity, and use an intentional moderation announcement/audit channel.

**Characterization and acceptance cases**

- On gives and configures exactly the active game's grenade/RPG; off removes it.
- A non-playing eligible target gets the declared deferred preference for their next spawn.
- Protected or invalid targets receive no capability change.

### `!noclip`

**Registration:** level 1; alias `!nc`; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:5058-5081`; setting effect in `shared/jumpmod/_noclip.gsc:8-25`.

**Current behavior**

- Active grammar: `!noclip [speed]`, although help documents no argument. The caller must be actively playing.
- With no argument, off becomes speed 1 and any active noclip becomes off. With an argument, the same active speed toggles off; a different speed enables/changes noclip.
- Malformed, zero, and negative values become speed 1. The downstream handler caps above 50, but toggle comparison happens against the pre-clamp requested value.
- Any non-zero effective setting calls the anti-cut warning path.

**Proposed rewrite contract**

- Parse omitted toggle separately from a strict finite speed in the inclusive range 1-50.
- Compute the effective value once, then decide disable/change behavior and ranking eligibility from that value.

**Characterization and acceptance cases**

- Bare invocation toggles off/on at the documented default.
- A valid different speed changes active noclip; repeating it disables.
- Malformed, non-positive, and above-maximum input does not mutate movement state.

### `!nowaypoints`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4138-4152`; setting effect in `shared/jumpmod/_checkpoint_pointers.gsc`.

**Current behavior**

- Grammar: `!nowaypoints <on|off>` with exact tokens.
- On writes `waypoints_enable = false`; off writes true. The setting updates client state and hides/shows existing checkpoint pointers.
- The inversion is intentional relative to the negatively named command but obscured in the underlying boolean.

**Proposed rewrite contract**

- Expose a positive `waypointsVisible` preference internally and map the compatibility command's on/off wording at the boundary.
- Return the resulting visibility, not the inverted storage value.

**Characterization and acceptance cases**

- `nowaypoints on` hides all checkpoint waypoints; off shows eligible waypoints.
- Existing and newly created pointers follow the same preference.
- Invalid input preserves visibility.

### `!osmode`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2560-2574`; mode consumers in COD2 movement/checkpoint code and shared save/load code.

**Current behavior**

- Grammar: `!osmode <on|off>` with exact tokens.
- It changes the player-scoped `os_mode` boolean. COD2 movement code consumes it, completed runs use a separate `os_mode` category, and saved positions capture/restore it.
- The command itself performs no run reset or transition validation.

**Proposed rewrite contract**

- Treat movement/ranking mode as run configuration with an explicit policy for switching during an active run.
- Bind saved-position compatibility and record category to the run's immutable mode rather than a freely mutable current flag.

**Characterization and acceptance cases**

- Starting in OS mode consistently uses OS physics, save state, and record category.
- Mid-run changes either reset/start a new run or are rejected; they cannot create a mixed-mode ranked run.
- Off returns subsequent eligible runs to normal mode without rewriting historical state.

### `!pistol`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:150-185`; catalogs/application in `shared/jumpmod/_weapons.gsc:4-70,114-162`.

**Current behavior**

- Grammar is `!pistol <runtime pistol name>`; it compares the token with display names generated from the active game's weapon catalog.
- COD2 exposes `luger`, `tt30`, `colt`, `webley`, `deagle`, and `weblev`; `deagle` is donor-only. COD4 exposes `deagle`, `beretta`, `colt`, `usp`, and `deaglegold`; `deaglegold` is donor-only.
- A valid selection changes the pistol setting and immediately re-gives the primary weapon slot. Invalid or unauthorized selection prints help/current options.

**Proposed rewrite contract**

- Define weapon ID, public token, game availability, donor policy, and display label in one catalog.
- Resolve a typed selection and apply it through loadout state with an explicit unavailable/forbidden result.

**Characterization and acceptance cases**

- Every runtime-listed standard pistol is selectable in its game only.
- A donor pistol succeeds only for a donor and never falls through to another weapon.
- Help exactly matches the active catalog and restrictions.

### `!players`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2901-3013` (`playerservers`, `helpplayerservers`, callbacks).

**Current behavior**

- Grammar: `!players [server-name fragment]`; only `data[2]` is used, so multi-word fragments are not joined.
- It asynchronously selects non-empty remote servers seen within the last five minutes, excluding the current server. An argument applies a SQL substring match to server name.
- For each server it queries account names and preferred names for the reported player IDs, then prints a server heading and rows.

**Proposed rewrite contract**

- Query a typed server-presence repository using a normalized optional free-text search and a single consistent snapshot time.
- Return structured servers and players, preserving server identity across asynchronous fan-out and reporting partial failures.

**Characterization and acceptance cases**

- Bare usage includes every eligible remote server once and never the current server.
- Multi-word search is either supported as a full tail or rejected clearly; no tokens are silently ignored.
- Empty results and database failures return distinct messages.

### `!promote`

**Registration:** level 60; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4580-4642` (`promote`, `helppromote`).

**Current behavior**

- Grammar: `!promote <player> <level>`; numeric conversion accepts malformed text as zero. The broad range is -1 through 99 because requested level must be below the caller and cannot exceed 100.
- Other targets at or above the caller's current level are protected. Effective promotion caps are 20 for caller levels 60-79, 40 for 80-89, 60 for level 90, and caller-minus-one for 91-100.
- Callers at level 90 or below cannot demote. Level 91+ can demote, including self-demotion where the remaining conditions allow it.
- It changes live admin/score state and announces success before the asynchronous account update is confirmed.

**Proposed rewrite contract**

- Parse an exact admin-level value and evaluate it through one capability matrix covering target hierarchy, promotion ceiling, demotion, self-change, and special level -1.
- Persist and audit actor/target/previous/new levels before deriving live authorization from the committed account state.

**Characterization and acceptance cases**

- Each caller tier accepts exactly its declared range and operation direction.
- Malformed input, protected targets, and forbidden demotions make no live or persistent change.
- Persistence failure cannot leave an acknowledged live privilege change.

### `!pstats`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4353-4379` (`pstats`, `helppstats`).

**Current behavior**

- Grammar: `!pstats [player]`.
- With no argument, it closes existing menus, opens the statistics menu, and sets `selected_a_player` to zero.
- With a valid connected target, it opens the same menu and starts `showprofile(target)`. An unresolved target reports no player found and does not open it.

**Proposed rewrite contract**

- Resolve an optional profile subject explicitly, load a stable profile view model, then open the menu only for a ready result.
- Use one self-selection representation instead of a magic client-cvar zero.

**Characterization and acceptance cases**

- Bare usage opens the caller's/default profile consistently.
- Valid target usage cannot display stale data from a previous selection.
- Unresolved target preserves the existing UI state and reports failure.

### `!removexp`

**Registration:** level 100; alias `!remxp`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1687-1812` (`removexp`, shared XP adjustment/callback, `helpremovexp`).

**Current behavior**

- Grammar: `!removexp <player> <positive amount>`; the target must be connected. Numeric conversion rejects malformed text because it becomes zero, but the command declares no maximum.
- It sends a negative delta to the database rank-adjustment procedure, which returns before/after XP, applied delta, and an optional block reason. The resulting XP is clamped at zero by that procedure.
- On confirmed success, an online target's cached XP, score field, and rank information are refreshed; the player gets the resulting demotion label and the admin gets the removed amount.
- Query-enqueue failure is printed only to the server console.

**Proposed rewrite contract**

- Parse a bounded positive XP amount and stable account target, then call one signed XP-adjustment service shared with `addxp`.
- Return applied delta, before/after XP, before/after rank, and a typed block/failure reason; audit the administrative change.

**Characterization and acceptance cases**

- A valid amount removes at most the target's current XP and never produces negative XP.
- Missing, malformed, non-positive, and over-policy amounts issue no procedure call.
- Enqueue, procedure, and callback failures are visible to the caller and do not update cached XP.

## Batch 4 — next 20 unreviewed commands

This batch follows the replay controller, reset/run identity, run-history persistence, linked-server join, shellshock, and checkpoint-visualization paths beyond their command wrappers.

### `!replayanimdebug`

**Registration:** level 0; alias `!rad`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:35-47`.

**Current behavior**

- Grammar: `!replayanimdebug`; arguments are ignored. The handler is not gated by `replay_mode`.
- It prints the current leg animation when defined, then enumerates animation names matching jump, fall, land, and air patterns to both player and server console.
- It does not toggle a debug flag despite the previous generated description.

**Proposed rewrite contract**

- Move animation inspection behind a development/admin capability and split current-animation inspection from catalog search.
- Return bounded/paginated output and avoid duplicating a large dump into two sinks by default.

**Characterization and acceptance cases**

- Invocation inside and outside replay currently produces the same lookup behavior.
- Missing current animation still performs pattern enumeration.
- The rewrite never exposes an unbounded diagnostic dump to an ordinary level-0 caller.

### `!replayexit`

**Registration:** level 0; alias `!rx`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:156-164`.

**Current behavior**

- Grammar: `!replayexit`; arguments are ignored.
- In replay mode it records exit reason `exited`, ends the loading state, notifies `replay_stop`, and starts asynchronous cleanup.
- Outside replay mode it silently returns.

**Proposed rewrite contract**

- Execute one idempotent `ExitReplay` operation with explicit `exited`, `already-stopping`, and `not-in-replay` results.
- Centralize cleanup ownership so repeated exit requests cannot race or duplicate restoration.

**Characterization and acceptance cases**

- One active invocation produces exactly one stop transition and cleanup sequence.
- A second invocation during cleanup is harmless and observable.
- Outside replay no player or client state changes.

### `!replayfpshud`

**Registration:** level 0; alias `!rf`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:829-838`; initialization near `:66-109`.

**Current behavior**

- Grammar: `!replayfpshud`; arguments are ignored. Replay FPS visibility initializes to true.
- During replay it toggles the FPS display; outside replay it hides the replay FPS element.

**Proposed rewrite contract**

- Store replay overlay preferences in one typed display state and apply them only while the replay owns its overlay.
- Return the resulting visibility and restore the pre-replay client display state on exit.

**Characterization and acceptance cases**

- A new replay starts with FPS visible; successive calls alternate hidden/visible.
- Calling outside replay cannot modify unrelated HUD state.
- Replay exit removes the element without losing the saved preference unless that reset is intentional.

### `!replayhud`

**Registration:** level 0; alias `!rh`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:748-771`.

**Current behavior**

- Grammar: `!replayhud`; arguments are ignored.
- During replay it toggles client-wide `cg_draw2D` and the replay controls together.
- Outside replay it forces `cg_draw2D = 1`, clears replay/client text, and hides controls (`CMD-041`).

**Proposed rewrite contract**

- Toggle only replay-owned overlays, or explicitly name a client-wide HUD action if global 2D drawing is required.
- Snapshot the prior `cg_draw2D` value at replay entry and restore it exactly at exit.

**Characterization and acceptance cases**

- Two in-replay invocations restore the initial replay HUD state.
- Entering/exiting replay preserves a pre-existing user choice for global 2D drawing.
- Outside replay returns `not-in-replay` without clearing text or changing cvars.

### `!replaykeyhud`

**Registration:** level 0; alias `!rk`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:807-816`; initialization near `:66-109`.

**Current behavior**

- Grammar: `!replaykeyhud`; arguments are ignored. The key overlay initializes to false.
- During replay it toggles recorded key input; outside replay it hides the element.

**Proposed rewrite contract**

- Use the shared replay-overlay state with an explicit `keys` component and resulting visibility.
- Preserve the declared default in the same definition used by the UI documentation.

**Characterization and acceptance cases**

- A new replay starts without the key overlay.
- One call shows it and the next hides it.
- Outside replay makes no persistent preference or unrelated client-state change.

### `!replaynextcp`

**Registration:** level 0; alias `!rnext`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:132-137` and playback-loop request handling.

**Current behavior**

- Grammar: `!replaynextcp`; arguments are ignored.
- During replay it sets a next-checkpoint request. The playback loop resolves the checkpoint and seeks its recorded sample/tick, or prints that none exists.
- Outside replay it silently returns.

**Proposed rewrite contract**

- Queue a typed relative checkpoint seek and return accepted, no-checkpoint, or invalid-state results.
- Define behavior for repeated requests and pause state instead of relying on frame timing.

**Characterization and acceptance cases**

- A valid next checkpoint seeks to its exact recorded boundary.
- At the final checkpoint playback position is unchanged and a stable result is returned.
- Rapid repeated requests have a documented queue/coalescing policy.

### `!replaypause`

**Registration:** level 0; alias `!rp`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:111-116` and playback-loop request handling.

**Current behavior**

- Grammar: `!replaypause`; arguments are ignored.
- During replay it sets `replay_pause_requested`; the playback loop later toggles pause/resume and prints the resulting status.
- Outside replay it silently returns.

**Proposed rewrite contract**

- Represent pause as an idempotent desired state (`pause`, `resume`, or documented toggle) rather than an unqualified boolean request vulnerable to duplicate input.
- Return accepted and final playback state distinctly if processing remains asynchronous.

**Characterization and acceptance cases**

- One request while playing pauses; one while paused resumes.
- Duplicate requests before loop consumption have deterministic behavior.
- Outside replay changes nothing and returns an explicit invalid-state result.

### `!replayprevcp`

**Registration:** level 0; alias `!rprev`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:125-130` and playback-loop request handling.

**Current behavior**

- Grammar: `!replayprevcp`; arguments are ignored.
- During replay it requests the previous checkpoint and the playback loop seeks its sample/tick or reports that none exists.
- Outside replay it silently returns.

**Proposed rewrite contract**

- Share the relative checkpoint-seek request used by `replaynextcp` with direction as typed data.
- Define whether “previous” from just after a checkpoint selects the same checkpoint or the preceding checkpoint.

**Characterization and acceptance cases**

- A valid previous checkpoint seeks to the stored boundary.
- At the earliest boundary, position is preserved and `no-previous-checkpoint` is returned.
- Pause and repeated-request behavior matches next-checkpoint seeking.

### `!replayskip`

**Registration:** level 0; alias `!rs`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:118-123` and playback-loop request handling.

**Current behavior**

- Grammar: `!replayskip`; arguments are ignored.
- During replay it requests a manual skip. The loop consumes manual skip only while not paused.
- Automatic replay skipping is a separate, default-enabled behavior toggled through replay controls rather than this command.

**Proposed rewrite contract**

- Name and model manual skip separately from automatic-skip preference.
- Return `accepted`, `paused`, `not-applicable`, or `not-in-replay`; do not silently retain an ambiguous request.

**Characterization and acceptance cases**

- While playing, one valid request performs exactly one manual skip.
- While paused, the command's result and whether the request survives resume are deterministic.
- Automatic skip remains unchanged by this command.

### `!replayspeedhud`

**Registration:** level 0; alias `!rsh`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:773-787`; initialization near `:66-109`.

**Current behavior**

- Grammar: `!replayspeedhud`; arguments are ignored. Replay speed visibility initializes to false.
- During replay it toggles `replay_speedmeter_on`; outside replay it hides the speed meter.

**Proposed rewrite contract**

- Define `speed` in the shared replay-overlay state and return the resulting visibility.
- Keep rendering lifecycle separate from stored preference so hiding on exit does not imply disabling next time.

**Characterization and acceptance cases**

- A new replay begins without the speed meter.
- Two calls round-trip its visibility.
- Outside replay does not mutate the saved preference or global HUD.

### `!replaytimerhud`

**Registration:** level 0; alias `!rt`; hidden.  
**Source:** `shared/jumpmod/_replay_playback.gsc:818-827`; initialization near `:66-109`.

**Current behavior**

- Grammar: `!replaytimerhud`; arguments are ignored. Replay jump-timer visibility initializes to false.
- During replay it toggles the timer; outside replay it hides the replay timer element.

**Proposed rewrite contract**

- Define the exact timer meaning in the display schema and share overlay lifecycle/result semantics with the other replay HUD commands.

**Characterization and acceptance cases**

- A new replay begins without the timer.
- Two calls restore its original visibility.
- Outside replay leaves the stored preference and unrelated HUD untouched.

### `!reset`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:5383-5396`; reset implementation in `shared/jumpmod/_menu_interface.gsc:117-157`.

**Current behavior**

- Grammar: `!reset`; arguments are ignored.
- It marks an existing positive run ID as resetting, waits a frame, sets `sure_about_reset = true`, and invokes `resetstats(true)`.
- That flag bypasses the reset helper's normal confirmation. Replay recording is cleaned up, statistics are reset, run ID enters initialization state, and a new run-ID query is queued (`CMD-033`).

**Proposed rewrite contract**

- Define whether command reset is intentionally immediate. If not, route it through caller-bound expiring confirmation displaying what will be lost.
- Serialize reset against run initialization, replay cleanup, save/load, and another reset; return a committed new run identity before claiming completion.

**Characterization and acceptance cases**

- One accepted reset abandons exactly one old run and allocates one replacement.
- Busy or already-reset state does not produce overlapping database work.
- Confirmation, when adopted, cannot be reused after run identity changes.

### `!runid`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1003-1023`.

**Current behavior**

- Grammar: `!runid [player]`; omission selects the caller and a supplied value resolves one connected player.
- It prints the target's current `data["run_id"]`; an unresolved player reports failure.
- It does not distinguish positive persistent IDs from negative initialization/reset sentinels.

**Proposed rewrite contract**

- Return a typed run state (`active(id)`, `initializing`, `resetting`, `unavailable`) and disclose another player's ID only under an explicit visibility policy.

**Characterization and acceptance cases**

- Bare invocation reads caller state; valid target invocation reads that target only.
- Lookup failure never falls back to caller.
- Transitional sentinels render as states, not misleading database IDs.

### `!savelist`

**Registration:** level 1; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:753-783`.

**Current behavior**

- Grammar: `!savelist <cps|time|date>`; the help identifies date as default, but the handler requires one of the exact tokens.
- It stores `loadpos_order_by`, starts an asynchronous saved-run history refresh, and reopens the history menu.
- It does not directly print or independently retrieve a list (`CMD-034`).

**Proposed rewrite contract**

- Rename the operation to history sorting or expose it as a menu preference; use a typed sort enum with a real omission default.
- Refresh into a new view model and swap the menu only after data is ready, preserving the prior view on failure.

**Characterization and acceptance cases**

- Each accepted token produces the corresponding query order and refreshed menu.
- Missing/invalid input does not change the current order.
- Multiple quick changes cannot let an older asynchronous response overwrite the latest selection.

### `!saverun`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:785-805`.

**Current behavior**

- Grammar: `!saverun`; arguments are ignored.
- It requires replay metadata support, a positive run ID, and an unfinished run. It asynchronously marks the replay metadata protected until six months from now and clears archive error state.
- It immediately reports protection without observing the write result (`CMD-035`). It does not export the run or create a position save.

**Proposed rewrite contract**

- Name the domain action `ProtectRunReplay(retentionUntil)` and return unsupported, invalid-run, already-finished, queued, confirmed, and failed outcomes.
- Make retention duration a server policy rather than an unexplained command constant.

**Characterization and acceptance cases**

- Only the caller's current positive unfinished run is updated.
- Unsupported/finished/uninitialized runs issue no update.
- A database failure cannot produce a final success message.

### `!savesettings`

**Registration:** level 0; alias `!save`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4484-4494`; persistence in `shared/jumpmod/_playersettings.gsc`.

**Current behavior**

- Grammar: `!savesettings`; arguments are ignored.
- It gathers roughly eighty shared and game-specific preferences, removes legacy settings, queues chunked player-setting upserts, and writes the client config.
- The command prints success immediately before asynchronous writes complete (`CMD-035`).

**Proposed rewrite contract**

- Take one versioned settings snapshot, validate it, and persist it through a repository returning complete/partial/failure details.
- Separate server-backed preferences from client-config serialization while reporting each result accurately.

**Characterization and acceptance cases**

- A confirmed save represents one coherent settings version, not a mixture of values changed mid-write.
- Chunk failure is visible and retryable without duplicating or deleting unrelated keys.
- Extra arguments cannot affect the stored snapshot.

### `!servers`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2879-2899,3015-3054`.

**Current behavior**

- Grammar: `!servers` opens the menu; `!servers join <server-name fragment>` searches compatible same-shortversion servers, excluding the current server. Only the single fragment at `data[3]` is consumed.
- Exactly one match connects. Zero and multiple matches report failure.
- Passworded servers require the caller's current userinfo password to match, except level 100 can receive the stored server password before connecting.

**Proposed rewrite contract**

- Resolve a stable server selection from a full declared query and connect by immutable server identity chosen from a fresh compatible-server snapshot.
- Treat credentials as secrets: never place stored server passwords into broadly observable state, logs, or results; authorize privileged bypass through a connection broker.

**Characterization and acceptance cases**

- Bare invocation opens the menu without a join query.
- Zero/ambiguous matches never connect; one eligible match produces one connection action.
- Version, current-server exclusion, password, and caller capability are rechecked immediately before connection.

### `!shock`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4852-4883`.

**Current behavior**

- Grammar: `!shock <player>`; target must be connected and actively playing.
- Self-target is allowed. Another target at or above caller level is protected.
- It applies the configured shellshock for seven seconds and broadcasts the action.

**Proposed rewrite contract**

- Reuse typed target/playing/hierarchy policies and a named shellshock effect definition with duration visible in audit data.
- Decide explicitly whether self-target remains supported and whether repeated effects replace or stack.

**Characterization and acceptance cases**

- A permitted active target receives exactly the declared effect/duration.
- Protected targets and spectators receive no effect.
- Self behavior and overlapping invocation behavior are fixed by tests.

### `!showclips`

**Registration:** level 0; visible; COD2 only.  
**Source:** `shared/jumpmod/_j4l_cmd_gameversion.gsc:35-89`.

**Current behavior**

- Grammar: `!showclips <on|off|toggle>`.
- It stores a per-player setting, syncs the UI cvar, globally hides registered clip models, then re-shows them to every player whose setting is enabled.
- A map without `level.clipmodels` reports unsupported; the command is not registered on COD4.

**Proposed rewrite contract**

- Represent clip visualization as a game/map capability plus per-player visibility without global hide/reapply churn on each change.
- Generate game availability and supported-map state into documentation/results.

**Characterization and acceptance cases**

- On/off/toggle produce correct visibility independently for two players with different settings.
- Changing one player does not produce a visible transient for another.
- Unsupported game/map leaves state unchanged with an explicit result.

### `!showcpid`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:721-745`.

**Current behavior**

- Grammar: `!showcpid <on|off|toggle>`.
- It stores a player boolean, synchronizes `ui_mod_showcpid`, and reports the resulting state. The display supports multiroute checkpoint creation.

**Proposed rewrite contract**

- Keep one positive `checkpointIdsVisible` preference and generate parser/help/UI binding from its boolean modes.
- Make visibility availability explicit when no checkpoint-building context exists.

**Characterization and acceptance cases**

- On and off are idempotent; toggle exactly inverts state.
- Unknown/missing input preserves the setting and returns syntax guidance.
- Client cvar and rendered labels converge on the stored state.

## Final batch — remaining 16 commands

This batch completes the command set with map-spawn administration, spectator/music preferences, live authority and mute controls, vote vetoes, local voice controls, and XP policy.

### `!spawnpoint`

**Registration:** level 100; alias `!sp`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2153-2185`.

**Current behavior**

- Grammar: `!spawnpoint <put|purge>`.
- `put` inserts the caller's position and yaw for the current map; each origin component is stored as `int(component + 1)`.
- `purge` deletes every spawn row for the current map without confirmation. Both paths acknowledge immediately after queuing the query (`CMD-035`, `CMD-036`).

**Proposed rewrite contract**

- Parse a closed action enum. Represent placement as typed position/yaw with an explicit coordinate conversion policy.
- Preview purge count and require map-bound expiring confirmation; commit an audit entry with caller, map, affected rows, and result.

**Characterization and acceptance cases**

- Put creates exactly one spawn for the current map with migration-tested coordinates.
- First purge invocation deletes nothing; only a valid confirmation for the same map can delete.
- Query failure cannot produce success, and concurrent map change cannot redirect the operation.

### `!specfix`

**Registration:** level 60; visible; COD2 only.  
**Source:** `shared/jumpmod/_j4l_cmd_gameversion.gsc:16-33`.

**Current behavior**

- Grammar: `!specfix`; arguments are ignored.
- If persistent team and session state both identify spectator, it preserves pitch/yaw, zeros roll, and reapplies view angles.
- Otherwise it reports that the caller is not spectating.

**Proposed rewrite contract**

- Expose a COD2 spectator-recovery operation with named eligible states and an observable fixed/not-needed/unsupported result.
- Prefer repairing the underlying transition that leaves spectator orientation stuck; retain the command as a recovery fallback.

**Characterization and acceptance cases**

- Eligible spectator state preserves pitch/yaw and normalizes roll.
- Playing or partially transitioned state is not mutated.
- COD4 has no registered command or falsely advertised availability.

### `!speclist`

**Registration:** level 0; hidden.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1547-1598`.

**Current behavior**

- Grammar: `!speclist`; arguments are ignored.
- A playing caller lists spectators targeting the caller. A spectator lists spectators targeting the player currently followed, with fallback to self and caller excluded.
- Undercover spectators are omitted from player output, but their names are logged to server console while filtering (`CMD-037`).

**Proposed rewrite contract**

- Resolve the viewed subject explicitly and apply one privacy policy before presentation.
- Keep filtered identities out of ordinary logs; if auditing is required, use access-controlled structured events.

**Characterization and acceptance cases**

- Playing and spectating subject selection is deterministic, including free-spectator state.
- Caller is not duplicated in the spectator-of-spectator result.
- Undercover identities appear in neither player output nor unprivileged console logs.

### `!startmusic`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:16-27`; ambient transition in `shared/jumpmod/_ambient.gsc:273-290`.

**Current behavior**

- Grammar: `!startmusic`; arguments are ignored.
- It is refused while a spectator follows another player and directs the caller to free spectator.
- Otherwise it clears `map_ambient_stopped`, enables `map_music_enable`, synchronizes the setting, and selects current ambient audio.

**Proposed rewrite contract**

- Model audio preference and current playback separately, returning enabled, already-enabled, blocked-by-follow, or unavailable.
- Apply changes atomically through one ambient controller so displayed preference and audible track cannot diverge.

**Characterization and acceptance cases**

- Eligible invocation enables map music and selects one valid current track.
- Follow-spectator invocation changes neither preference nor playback.
- Repeated start is idempotent and does not restart audio unless explicitly designed to.

### `!stopmusic`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:29-39`; ambient transition in `shared/jumpmod/_ambient.gsc:254-270`.

**Current behavior**

- Grammar: `!stopmusic`; arguments are ignored.
- It has the same follow-spectator refusal as `startmusic`.
- Otherwise it marks map ambient stopped, disables `map_music_enable`, synchronizes it, and refreshes ambient selection; fallback server ambient may remain active.

**Proposed rewrite contract**

- Pair this with start under one typed map-music preference while documenting fallback ambient independently.
- Return resulting map-music and fallback-audio states rather than saying simply stopped.

**Characterization and acceptance cases**

- Eligible invocation disables map music without claiming all server audio is silent.
- Follow-spectator invocation preserves state.
- Repeated stop is idempotent and start/stop round-trip the preference.

### `!taunts`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_chat.gsc:132-147`.

**Current behavior**

- Grammar: `!taunts <on|off>`.
- On stores `ignore_taunts = false`; off stores true through player settings, then reports the public positive state.
- The underlying negative boolean makes direct reasoning and documentation easy to invert accidentally.

**Proposed rewrite contract**

- Expose/store a positive `tauntsEnabled` preference or isolate inversion inside one compatibility adapter.
- Use the shared strict boolean parser and report persistence separately when relevant.

**Characterization and acceptance cases**

- On permits taunts and off suppresses them.
- Unknown/missing input preserves state.
- Persisted and live preference resolve to the same positive meaning after reconnect.

### `!teleplayer`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4222-4257`.

**Current behavior**

- Grammar: `!teleplayer <player>`; both caller and target must be actively playing.
- It rejects every target whose admin is at least the caller's, without a self exception, so self-targeting fails.
- It moves the target to the caller's origin/angles, temporarily sets target contents to zero, sends anti-cut warning state, and notifies both parties.

**Proposed rewrite contract**

- Name direction explicitly as `BringPlayerToCaller`; use reusable active-state and lower-target policies with a deliberate self rule.
- Execute collision-safe placement and audit source/destination rather than directly zeroing contents without a typed teleport service.

**Characterization and acceptance cases**

- Permitted target arrives at caller position/orientation and caller does not move.
- Equal/higher target, self, or either spectator causes no teleport.
- Failed placement restores collision state and reports the reason.

### `!temppromote`

**Registration:** level 98; alias `!tpromote`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:4544-4578`.

**Current behavior**

- Grammar: `!temppromote <player> <level>`; malformed text converts to zero.
- Other targets at or above the caller are protected; self is allowed. Requested level must be at least zero and strictly below caller level.
- It changes only live admin and score state, broadcasts the action, and therefore also supports temporary demotion/self-demotion despite its name (`CMD-038`).

**Proposed rewrite contract**

- Parse an exact level and rename the operation `SetTemporaryAdminLevel`, with explicit promote, demote, self-change, lifetime, and restoration policies.
- Store actor, original/effective level, reason, expiry/session boundary, and audit event in one override record.

**Characterization and acceptance cases**

- Accepted range for a level-98 caller is 0-97; level-100 caller is 0-99.
- Malformed, negative, caller-level-or-higher values do not change authority.
- Temporary state never persists accidentally and restoration is deterministic.

### `!theme`

**Registration:** level 1; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:2533-2558`; catalog/setting in `shared/jumpmod/_themes.gsc`.

**Current behavior**

- Grammar: `!theme <default|matrix|egz|custom|cycle>`; registered themes are exactly default, matrix, egz, and custom.
- `cycle` is implemented by the setting handler. Missing input prints choices.
- Invalid input returns false from the setting handler, but the command ignores the result and produces no response (`CMD-039`).

**Proposed rewrite contract**

- Define theme IDs, order, availability, and display metadata in one catalog used by parser, cycling, renderer, and documentation.
- Return selected, unchanged, unavailable-custom, and invalid-theme results explicitly.

**Characterization and acceptance cases**

- Every listed theme can be selected; cycle visits each in defined order.
- Invalid input changes nothing and reports the accepted set.
- Custom theme selection has a defined result when no custom values exist.

### `!thirdperson`

**Registration:** level 0; alias `!3rd`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_client_settings.gsc:987-1001`.

**Current behavior**

- Grammar: `!thirdperson <on|off>` with exact tokens.
- It delegates to the player-setting layer; missing/unknown input shows help.

**Proposed rewrite contract**

- Keep a strict positive boolean preference with game/state availability declared in the setting definition.
- Return the resulting camera state and any engine refusal rather than assuming the client applied it.

**Characterization and acceptance cases**

- On and off are idempotent, alias and canonical name behave identically.
- Unknown/missing input preserves state.
- Respawn, spectator transition, and reconnect behavior follow the declared preference lifecycle.

### `!unignore`

**Registration:** level 1; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_chat.gsc:19-22` and shared ignore helper.

**Current behavior**

- Grammar: `!unignore <player>`; target must currently be connected.
- It removes the target account ID from the caller's live session ignore list. No admin hierarchy restriction is applied on removal.
- It does not remove the persistent relation created by `fignore`.

**Proposed rewrite contract**

- Resolve the relation by stable account identity and name session versus persistent scope explicitly in command/result text.
- Permit removal even if the ignored player disconnected by account selection/history if product requirements call for it.

**Characterization and acceptance cases**

- Existing session relation is removed exactly once; repeated removal is a stable not-ignored result.
- Persistent ignore remains untouched.
- Target lookup failure never removes a different relation.

### `!unmute`

**Registration:** level 80; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:5442-5482`.

**Current behavior**

- Grammar: `!unmute <player>`; target must be connected and currently live-muted.
- Self is allowed; another target at or above the caller is protected. A stored `muted_lvl` above caller level also prevents clearing.
- It clears only live mute fields and broadcasts. A database-backed forced mute may return in another session; `funmute` is the persistent counterpart.

**Proposed rewrite contract**

- Model mute source/scope/issuer level/expiry as typed data and select an explicit live or persistent removal operation.
- Make authority comparison one shared policy and report when another active mute source remains.

**Characterization and acceptance cases**

- Authorized live mute is cleared; higher-issued/protected-target mute is unchanged.
- Clearing live state cannot falsely claim a persistent forced mute was removed.
- Self rule and missing metadata behavior are explicit and tested.

### `!veto`

**Registration:** level 60; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_vote.gsc:287-296`; policy in `shared/jumpmod/_voting.gsc:459-518`.

**Current behavior**

- Grammar: `!veto`; arguments are ignored. There must be an active, not-yet-vetoed vote.
- Kick, add-time, and disable-vote types require level 80; other types use the registered level-60 threshold.
- If a starter exists, veto is refused when starter admin is more than 20 levels above caller. An accepted action sets the vote veto flag for the monitor to finish.

**Proposed rewrite contract**

- Express veto capability by vote type and actor/starter relationship in one policy matrix, then execute against a stable vote ID.
- Return no-active, already-vetoed, insufficient-type-level, starter-protected, accepted, and completed outcomes.

**Characterization and acceptance cases**

- Every vote type maps to exactly one required level.
- Caller/starter boundary at caller+20 is accepted; above it is refused.
- A stale command cannot veto a newer vote that replaced the observed one.

### `!vignore`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_chat.gsc:34-55`.

**Current behavior**

- Grammar: `!vignore <player>`; target must be connected.
- It resolves the target's current entity number and executes client command `muteplayer <slot>` for the caller.
- It is client-local voice state with no admin hierarchy or persistence and is distinct from text ignore/server mute.

**Proposed rewrite contract**

- Name the operation local voice mute and bind it to stable player identity, reconciling the current entity slot at execution time.
- Return already-muted/not-supported where the engine exposes that state; do not imply server enforcement.

**Characterization and acceptance cases**

- Valid connected target issues one local mute for the correct slot.
- Slot reuse cannot silently transfer an identity-bound preference to another player.
- Text chat and server mute state remain unchanged.

### `!vunignore`

**Registration:** level 0; visible.  
**Source:** `shared/jumpmod/_j4l_cmd_chat.gsc:57-78`.

**Current behavior**

- Grammar: `!vunignore <player>`; target must be connected.
- It executes `unmuteplayer <entity number>` locally for the caller, without hierarchy or persistence.

**Proposed rewrite contract**

- Pair with `vignore` under one local voice preference service keyed by stable identity and current engine slot.
- Return the resulting local voice state without suggesting text ignore or administrative mute was changed.

**Characterization and acceptance cases**

- Valid target issues one local unmute for the correct current slot.
- Repeated unmute is harmless and observable when possible.
- Text/session/persistent mute relations remain unchanged.

### `!xpmultiplier`

**Registration:** level 100; aliases `!xpmult`, `!xpbonus`; visible.  
**Source:** `shared/jumpmod/_j4l_cmd.gsc:1814-1885`; checkpoint XP consumption in COD2 checkpoint code.

**Current behavior**

- Grammar: `!xpmultiplier <off|number|numberx>`. Missing input prints help and the current value; `off` normalizes to 1x.
- A trailing lowercase-normalized `x` is stripped, the value is converted to float and rounded to thousandths, and accepted values are 1.000-10.000 inclusive.
- It writes server cvar `j4l_xp_multiplier` and broadcasts; checkpoint XP calculation consumes the value with defensive bounds. It is not database-persisted (`CMD-042`).

**Proposed rewrite contract**

- Parse a complete finite decimal with optional `x`, normalize once, and expose `reset`/`1x` as the neutral action while retaining `off` only for compatibility.
- Store the multiplier in typed server configuration with declared persistence/restart behavior and audit actor, old value, and new value.

**Characterization and acceptance cases**

- `1`, `1x`, and `off` all produce neutral 1.000; `2.5` and `2.5x` produce 2.500.
- Values below 1 or above 10, non-finite, malformed, or partially parsed tokens do not change state.
- Award calculations observe one normalized value, and server restart behavior matches the declared configuration policy.

## Rewrite sequence

1. **Freeze behavior:** convert the characterization cases above into tests around the current handlers or an extracted parser facade. Add runtime smoke tests for `battle`, `cpt`, `customtheme`, `deleterec`, `taunt`, and `vote` because they have the broadest or riskiest branches.
2. **Introduce shared parsing:** migrate free-text, player, map, team, bounded-number, and record-filter parsing without changing execution behavior.
3. **Introduce policies:** centralize access, target-level comparisons, playing-state checks, ignore/mute/rate limits, and destructive confirmation.
4. **Split execution from presentation:** make handlers return structured results and generate player text from those results.
5. **Fix confirmed issues:** address `CMD-001` through `CMD-042` behind explicit tests and compatibility decisions.
6. **Generate documentation:** derive website syntax, aliases, defaults, constraints, and examples from the same command definitions used by parsing. Keep implementation-only policy and security notes out of the public renderer.
7. **Keep coverage complete:** require every registered command to have generated argument evidence, a public guide, and a reviewed behavior contract before command-registry changes can merge.

## Definition of done for a rewritten command

- All registered names and compatibility aliases map to exactly one definition.
- Every documented variant parses, and every parser variant is documented.
- Required/optional arguments, defaults, aliases, range behavior, and free-text handling are covered by table-driven tests.
- Authorization and state policies are tested independently from parsing.
- Side effects occur only after successful parse and authorization and are auditable by stable identities.
- Destructive operations use target-bound, expiring confirmation.
- Characterization tests document every deliberate compatibility break.
- The command directory and in-game help are generated from the same definition or checked for exact semantic parity.
