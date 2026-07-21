import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { EyeOff, Search, Terminal, X } from "lucide-react";
import { gameCommands } from "../data/commands";

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

export function CommandDirectory() {
  const [query, setQuery] = useState("");
  const [access, setAccess] = useState<AccessBand>("all");
  const [sort, setSort] = useState<SortMode>("level-asc");

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
              <code> [on/off]</code>.
            </p>
          </div>
          <div>
            <EyeOff size={15} aria-hidden="true" />
            <p>The crossed-eye icon means your typed command is not broadcast in public chat.</p>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="command-table" role="table" aria-label="In-game commands">
            <div className="command-row command-row-head" role="row">
              <span role="columnheader">Command</span>
              <span role="columnheader">Access</span>
              <span role="columnheader">Usage &amp; arguments</span>
              <span role="columnheader">What it does</span>
            </div>
            {results.map((command) => {
              return (
                <article className="command-row" role="row" key={command.name}>
                  <div className="command-name-cell" role="cell" data-label="Command">
                    <code>!{command.name}</code>
                    {command.aliases.length > 0 ? (
                      <span className="command-aliases">Aliases: {command.aliases.map((alias) => `!${alias}`).join(", ")}</span>
                    ) : null}
                  </div>
                  <div className="command-access-cell" role="cell" data-label="Access">
                    <span className="access-badge" style={levelBadgeStyle(command.minLevel)}>
                      Level {command.levels.join(" / ")}
                    </span>
                  </div>
                  <div className="command-usage-cell" role="cell" data-label="Usage & arguments">
                    <code>{command.usage}</code>
                    {command.hidden ? (
                      <span className="command-hidden" title="Input is not broadcast in public chat">
                        <EyeOff size={13} aria-hidden="true" />
                        <span className="sr-only">Input is not broadcast in public chat</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="command-description-cell" role="cell" data-label="What it does">
                    <p>{command.description}</p>
                  </div>
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
