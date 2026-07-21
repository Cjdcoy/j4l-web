import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Trophy } from "lucide-react";
import { fetchLeaderboard } from "../lib/api";
import { levelEmblemURL, prestigeEmblemURL } from "../lib/leveling";
import type { LeaderboardEntry, LeaderboardKind, LoadState } from "../lib/types";
import { ColoredPlayerName, stripColorCodes } from "./ColoredPlayerName";

const leaderboardKinds: Array<{ id: LeaderboardKind; label: string }> = [
  { id: "rank-xp", label: "XP Rank" },
  { id: "jump", label: "Jump" },
  { id: "speed", label: "Speed" },
  { id: "defrag", label: "Defrag" },
  { id: "surf", label: "Surf" },
  { id: "howmany", label: "How Many" },
];

const fpsOptions = ["125", "250", "333", "76", "43", "0"];

export function LeaderboardPanel() {
  const [kind, setKind] = useState<LeaderboardKind>("rank-xp");
  const [fps, setFPS] = useState("125");
  const [state, setState] = useState<LoadState<LeaderboardEntry[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let disposed = false;
    let timeoutID: number | undefined;
    let controller: AbortController | null = null;

    async function load() {
      controller?.abort();
      controller = new AbortController();
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const data = await fetchLeaderboard(kind, fps, controller.signal);
        if (!disposed) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          setState((current) => ({
            ...current,
            loading: false,
            error: error instanceof Error ? error.message : "Leaderboard request failed",
          }));
        }
      } finally {
        if (!disposed) {
          timeoutID = window.setTimeout(load, 60000);
        }
      }
    }

    load();

    return () => {
      disposed = true;
      controller?.abort();
      if (timeoutID !== undefined) {
        window.clearTimeout(timeoutID);
      }
    };
  }, [fps, kind]);

  const rows = useMemo(() => state.data.slice(0, 100), [state.data]);
  const selectedKind = leaderboardKinds.find((item) => item.id === kind)?.label || "Leaderboard";
  const usesFPS = kind !== "rank-xp" && kind !== "howmany";

  return (
    <section className="content-section" id="leaderboards" aria-labelledby="leaderboards-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Ranks</p>
          <h2 id="leaderboards-title">Leaderboards</h2>
        </div>
        <div className="section-meta">
          <RefreshCcw size={16} className={state.loading ? "spin" : ""} />
          <span>{rows.length} players</span>
        </div>
      </div>

      {state.error ? <p className="inline-alert">Leaderboard API unavailable: {state.error}</p> : null}

      <div className="leaderboard-toolbar">
        <div className="segmented-control" aria-label="Leaderboard type">
          {leaderboardKinds.map((item) => (
            <button
              key={item.id}
              type="button"
              className={kind === item.id ? "is-active" : ""}
              onClick={() => setKind(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {usesFPS ? (
          <div className="segmented-control" aria-label="FPS">
            {fpsOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={fps === option ? "is-active" : ""}
                onClick={() => setFPS(option)}
              >
                {option === "0" ? "Mix" : option}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="leaderboard-table" role="table" aria-label={`${selectedKind} leaderboard`}>
        <div className="leaderboard-row leaderboard-row-head" role="row">
          <span role="columnheader">Rank</span>
          <span role="columnheader">Player</span>
          <span role="columnheader">{kind === "rank-xp" ? "XP" : "Score"}</span>
          <span role="columnheader">{kind === "rank-xp" ? "Level" : "Rating"}</span>
          <span role="columnheader">{kind === "rank-xp" ? "Title" : "Tops"}</span>
          <span role="columnheader">Last seen</span>
        </div>

        {rows.map((entry) => (
          <div
            className={`leaderboard-row ${entry.rank >= 1 && entry.rank <= 3 ? `is-podium rank-${entry.rank}` : ""}`}
            role="row"
            key={`${kind}-${fps}-${entry.rank}-${entry.player_id}`}
          >
            <span className="rank-cell" role="cell" data-label="Rank">
              <Trophy size={16} />
              #{entry.rank || "-"}
            </span>
            <span className="leaderboard-player" role="cell" data-label="Player">
              {kind === "rank-xp" ? <PlayerRankEmblem entry={entry} /> : null}
              <span className="leaderboard-player-copy">
                <strong title={stripColorCodes(entry.player_name)}>
                  <ColoredPlayerName name={entry.player_name} />
                </strong>
                <small>{playerSubline(entry)}</small>
              </span>
            </span>
            <span role="cell" data-label={kind === "rank-xp" ? "XP" : "Score"}>{formatNumber(entry.score)}</span>
            <span role="cell" data-label={kind === "rank-xp" ? "Level" : "Rating"}>
              {kind === "rank-xp" ? formatLevel(entry) : entry.rating ? entry.rating.toFixed(1) : "-"}
            </span>
            <span role="cell" data-label={kind === "rank-xp" ? "Title" : "Tops"}>
              {kind === "rank-xp" ? entry.title || "-" : formatTopList(entry.top_list)}
            </span>
            <span role="cell" data-label="Last seen">{formatDate(entry.last_seen)}</span>
          </div>
        ))}

        {!state.loading && rows.length === 0 ? <div className="empty-state">No leaderboard rows returned.</div> : null}
      </div>
    </section>
  );
}

function PlayerRankEmblem({ entry }: { entry: LeaderboardEntry }) {
  const prestigeImageURL = prestigeEmblemURL(entry.prestige);
  const imageURL = prestigeImageURL || levelEmblemURL(entry.level);
  const isPrestige = Boolean(prestigeImageURL);
  return imageURL ? (
    <span className="leaderboard-rank-emblem-slot" aria-hidden="true">
      <img
        className={`leaderboard-rank-emblem ${isPrestige ? "is-prestige" : "is-level"}`}
        src={imageURL}
        alt=""
        width={isPrestige ? 80 : 48}
        height={isPrestige ? 40 : 48}
        loading="lazy"
        decoding="async"
      />
    </span>
  ) : null;
}

function playerSubline(entry: LeaderboardEntry) {
  return [entry.country_code || entry.country, entry.region].filter(isUsefulLabel).join(" / ") || `ID ${entry.player_id}`;
}

function isUsefulLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  return Boolean(normalized) && normalized !== "n/a" && normalized !== "unknown";
}

function formatTopList(topList: Record<string, number>) {
  const entries = Object.entries(topList)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => Number(left) - Number(right));

  if (entries.length === 0) return "-";
  return entries
    .slice(0, 3)
    .map(([rank, count]) => `#${rank}: ${count}`)
    .join(", ");
}

function formatLevel(entry: LeaderboardEntry) {
  if (entry.maxed) return "Max";
  if (!entry.level_display) return "-";
  return entry.prestige ? `P${entry.prestige} / ${entry.level_display}` : entry.level_display;
}

function formatNumber(value: number) {
  return value ? Math.round(value).toLocaleString() : "-";
}

function formatDate(value: string) {
  if (!value) return "-";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return value;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(new Date(time));
}
