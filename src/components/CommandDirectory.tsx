import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { BookOpen, ChevronDown, EyeOff, Search, Terminal, X } from "lucide-react";
import { commandGuides } from "../data/commandGuides";
import { gameCommands } from "../data/commands";
import type { GameCommand } from "../data/commands";

type AccessBand = "all" | "player" | "trusted" | "moderator" | "admin" | "owner";
type SortMode = "alphabetical" | "level-asc" | "level-desc";

const accessFilters: Array<{ id: AccessBand; label: string }> = [
  { id: "all", label: "All levels" },
  { id: "player", label: "Player" },
  { id: "trusted", label: "Trusted" },
  { id: "moderator", label: "Moderator" },
  { id: "admin", label: "Admin" },
  { id: "owner", label: "Owner" },
];

const sortOptions: Array<{ id: SortMode; label: string }> = [
  { id: "alphabetical", label: "A–Z" },
  { id: "level-asc", label: "Level ↑" },
  { id: "level-desc", label: "Level ↓" },
];

function accessBand(level: number): Exclude<AccessBand, "all"> {
  if (level <= 40) return "player";
  if (level < 80) return "trusted";
  if (level <= 90) return "moderator";
  if (level <= 100) return "admin";
  return "owner";
}

function levelBadgeStyle(level: number): CSSProperties {
  const clampedLevel = Math.min(Math.max(level, 0), 101);
  const isHighAccess = clampedLevel >= 90;
  const highAccessProgress = isHighAccess ? (clampedLevel - 90) / 11 : 0;
  const hue = Math.round(isHighAccess ? 210 + highAccessProgress * 140 : 150 + (clampedLevel / 90) * 60);
  const endHue = Math.min(hue + (isHighAccess ? 18 : 10), 359);
  const saturation = Math.round(isHighAccess ? 74 + highAccessProgress * 14 : 68);
  const lightness = Math.round(isHighAccess ? 79 - highAccessProgress * 8 : 78);
  const borderAlpha = isHighAccess ? 0.38 + highAccessProgress * 0.24 : 0.32;
  const backgroundAlpha = isHighAccess ? 0.18 + highAccessProgress * 0.12 : 0.14;

  return {
    color: `hsl(${hue} ${saturation}% ${lightness}%)`,
    borderColor: `hsl(${hue} ${saturation}% 62% / ${borderAlpha})`,
    background: `linear-gradient(135deg, hsl(${hue} ${saturation}% 55% / ${backgroundAlpha}), hsl(${endHue} ${saturation}% 58% / ${backgroundAlpha / 2}))`,
  };
}

function normalizeHelpLine(value: string) {
  return value.toLowerCase().replace(/^usage:\s*/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function additionalHelp(command: GameCommand) {
  const summaryLines = new Set([command.usage, command.description].map(normalizeHelpLine));
  return command.help.filter((line, index) => {
    const normalizedLine = normalizeHelpLine(line);
    return normalizedLine && !summaryLines.has(normalizedLine) && command.help.indexOf(line) === index;
  });
}

function CommandDocumentation({ command, id }: { command: GameCommand; id: string }) {
  const guide = commandGuides[command.name];
  const help = additionalHelp(command);

  return (
    <div className="command-documentation" id={id} role="region" aria-label={`Documentation for !${command.name}`}>
      <div className="command-guide-body">
        <div className="command-guide-header">
          <div>
            <p className="command-guide-kicker">
              <BookOpen size={14} aria-hidden="true" />
              Command guide
            </p>
            <h3><code>!{command.name}</code></h3>
            <p className="command-guide-introduction">{guide?.introduction ?? command.description}</p>
          </div>
          <dl className="command-guide-meta">
            <div className="command-guide-meta-syntax">
              <dt>Syntax</dt>
              <dd><code>{command.usage}</code></dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>Level {command.levels.join(" / ")}</dd>
            </div>
            <div>
              <dt>Aliases</dt>
              <dd>{command.aliases.length > 0 ? command.aliases.map((alias) => `!${alias}`).join(", ") : "None"}</dd>
            </div>
            <div>
              <dt>Chat input</dt>
              <dd>{command.hidden ? "Hidden from public chat" : "Visible in public chat"}</dd>
            </div>
          </dl>
        </div>

        {guide ? (
          <div className="command-guide-sections">
            {guide.sections.map((section) => (
              <section key={section.title}>
                <h3>{section.title}</h3>
                {section.introduction ? <p>{section.introduction}</p> : null}
                {section.syntax ? <code className="command-guide-syntax">{section.syntax}</code> : null}
                <ul className="command-guide-items">
                  {section.items.map((item) => (
                    <li key={item.command}>
                      <code>{item.command}</code>
                      <p>{item.description}</p>
                      {item.options ? (
                        <ul className="command-guide-options">
                          {item.options.map((option) => (
                            <li key={option.name}>
                              <code>{option.name}</code>
                              <span>{option.description}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {section.examples ? (
                  <div className="command-guide-examples">
                    <h4>Examples</h4>
                    {section.examples.map((example) => (
                      <code key={example}>{example}</code>
                    ))}
                  </div>
                ) : null}
                {section.note ? <p className="command-guide-note">{section.note}</p> : null}
              </section>
            ))}
          </div>
        ) : (
          <section className="command-help-section">
            <h3>In-game guidance</h3>
            {help.length > 0 ? (
              <ul className="command-help-lines">
                {help.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p>Use the syntax shown above. The in-game help does not list any additional options for this command.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export function CommandDirectory() {
  const [query, setQuery] = useState("");
  const [access, setAccess] = useState<AccessBand>("all");
  const [sort, setSort] = useState<SortMode>("level-asc");
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);

  const playerCount = useMemo(() => gameCommands.filter((command) => command.minLevel <= 40).length, []);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filteredCommands = gameCommands.filter((command) => {
      if (access !== "all" && accessBand(command.minLevel) !== access) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        command.name,
        ...command.aliases,
        command.usage,
        command.description,
        ...command.help,
        commandGuides[command.name] ? JSON.stringify(commandGuides[command.name]) : "",
        String(command.minLevel),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });

    return filteredCommands.sort((left, right) => {
      if (sort === "level-asc" && left.minLevel !== right.minLevel) return left.minLevel - right.minLevel;
      if (sort === "level-desc" && left.minLevel !== right.minLevel) return right.minLevel - left.minLevel;
      return left.name.localeCompare(right.name);
    });
  }, [access, query, sort]);

  function clearFilters() {
    setQuery("");
    setAccess("all");
  }

  return (
    <div className="commands-page">
      <section className="commands-hero" aria-labelledby="commands-title">
        <div className="commands-hero-copy">
          <p className="eyebrow">In-game reference</p>
          <h1 id="commands-title">Every command, in one place.</h1>
          <p>
            Browse every Call of Duty 2 in-game command by name, alias, admin level, or purpose. Type commands in chat
            with the leading <code>!</code>.
          </p>
        </div>
        <dl className="commands-summary" aria-label="Command directory summary">
          <div>
            <dt>Registered</dt>
            <dd>{gameCommands.length}</dd>
          </div>
          <div>
            <dt>Player tier</dt>
            <dd>{playerCount}</dd>
          </div>
          <div>
            <dt>Access levels</dt>
            <dd>−1–101</dd>
          </div>
        </dl>
      </section>

      <section className="command-browser" aria-labelledby="command-browser-title">
        <div className="command-browser-heading">
          <p className="eyebrow" id="command-browser-title">Command browser</p>
          <p>
            <span>{results.length}</span> of {gameCommands.length} commands
          </p>
        </div>

        <div className="command-toolbar">
          <label className="command-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search commands</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search command, alias, argument, or purpose…"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear command search">
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
          </label>

          <div className="command-filter-group" aria-label="Filter by access level">
            <span>Access</span>
            <div className="command-filter-scroll">
              {accessFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={access === filter.id ? "is-active" : ""}
                  onClick={() => setAccess(filter.id)}
                  aria-pressed={access === filter.id}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="command-filter-group" aria-label="Sort commands">
            <span>Sort by</span>
            <div className="command-filter-scroll">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={sort === option.id ? "is-active" : ""}
                  onClick={() => setSort(option.id)}
                  aria-pressed={sort === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="command-legend" aria-label="Command table legend">
          <div>
            <Terminal size={16} aria-hidden="true" />
            <p>
              Replace labels such as <code>[player]</code> with a value; choices are separated by a slash, such as
              <code> [on/off]</code>. Select a command row to open its complete documentation.
            </p>
          </div>
          <div>
            <EyeOff size={15} aria-hidden="true" />
            <p>The crossed-eye icon means your typed command is not broadcast in public chat.</p>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="command-table" aria-label="In-game commands">
            <div className="command-row command-row-head" aria-hidden="true">
              <span>Command</span>
              <span>Access</span>
              <span>Usage &amp; arguments</span>
              <span>What it does</span>
              <span />
            </div>
            {results.map((command) => {
              const isExpanded = expandedCommand === command.name;
              const guideId = `command-documentation-${command.name}`;

              return (
                <article className={`command-entry${isExpanded ? " is-expanded" : ""}`} key={command.name}>
                  <button
                    className="command-row command-row-button"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={guideId}
                    onClick={() => setExpandedCommand(isExpanded ? null : command.name)}
                  >
                    <span className="command-name-cell" data-label="Command">
                      <code>!{command.name}</code>
                      {command.aliases.length > 0 ? (
                        <span className="command-aliases">Aliases: {command.aliases.map((alias) => `!${alias}`).join(", ")}</span>
                      ) : null}
                    </span>
                    <span className="command-access-cell" data-label="Access">
                      <span className="access-badge" style={levelBadgeStyle(command.minLevel)}>
                        Level {command.levels.join(" / ")}
                      </span>
                    </span>
                    <span className="command-usage-cell" data-label="Usage & arguments">
                      <code>{command.usage}</code>
                      {command.hidden ? (
                        <span className="command-hidden" title="Input is not broadcast in public chat">
                          <EyeOff size={13} aria-hidden="true" />
                          <span className="sr-only">Input is not broadcast in public chat</span>
                        </span>
                      ) : null}
                    </span>
                    <span className="command-description-cell" data-label="What it does">
                      <span>{command.description}</span>
                    </span>
                    <span className="command-expand-cell" aria-hidden="true">
                      <ChevronDown size={18} />
                    </span>
                    <span className="sr-only">{isExpanded ? "Collapse" : "Expand"} command documentation</span>
                  </button>
                  {isExpanded ? <CommandDocumentation command={command} id={guideId} /> : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="command-empty">
            <Terminal size={24} aria-hidden="true" />
            <h3>No commands found</h3>
            <p>Try another search or reset the access and game filters.</p>
            <button type="button" onClick={clearFilters}>
              Reset filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
