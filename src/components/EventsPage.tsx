import { Fragment, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Clock, Trophy } from "lucide-react";
import { fetchEvent, fetchEventList, fetchSeason, fetchSeasonList } from "../lib/api";
import { defaultFPS, formatCountdown, formatTicks } from "../lib/eventFormat";
import type { EventSummary, EventWinner, LoadState, Season, SeasonSummary, WeeklyEvent } from "../lib/types";
import { usePolling } from "../lib/usePolling";
import { ColoredPlayerName, stripColorCodes } from "./ColoredPlayerName";

type Tab = "current" | "history" | "seasons";
type View = { tab: Tab; eventID?: number; seasonID?: number };

const tabs: Array<[Tab, string]> = [
  ["current", "Current week"],
  ["history", "History"],
  ["seasons", "Seasons"],
];
const fpsOptions: Array<[number, string]> = [
  [125, "125"],
  [250, "250"],
];
const modeOptions: Array<[boolean, string]> = [
  [false, "Summary"],
  [true, "Full"],
];
const bucketLabels: Record<string, string> = { very_easy: "Very easy", easy: "Easy", medium: "Medium", hard: "Hard" };
const REFRESH_MS = 60_000;
const SEASON_WEEKS = 12;

function parseView(hash: string): View {
  const [, kind, id] = /^#(week|season)-(\d+)$/.exec(hash) ?? [];
  if (kind === "week") return { tab: "history", eventID: Number(id) };
  if (kind === "season") return { tab: "seasons", seasonID: Number(id) };
  return { tab: tabs.find(([tab]) => `#${tab}` === hash)?.[0] ?? "current" };
}

export function EventsPage() {
  const [view, setView] = useState(() => parseView(window.location.hash));
  const [full, setFull] = useState(false);

  useEffect(() => {
    function onHashChange() {
      setView(parseView(window.location.hash));
      window.scrollTo(0, 0);
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  let content: ReactNode;
  if (view.tab === "current" || view.eventID) {
    content = <EventView key={view.eventID ?? "current"} eventID={view.eventID} full={full} setFull={setFull} />;
  } else if (view.tab === "history") {
    content = (
      <>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Weekly events</p>
            <h2>History</h2>
          </div>
        </div>
        <WeekList />
      </>
    );
  } else {
    content = (
      <>
        <SeasonView key={view.seasonID ?? "current"} seasonID={view.seasonID} />
        <h3>{view.seasonID ? "Weeks" : "All seasons"}</h3>
        {view.seasonID ? <WeekList key={view.seasonID} seasonID={view.seasonID} /> : <SeasonList />}
      </>
    );
  }

  return (
    <section className="content-section events-page" aria-label="Weekly events">
      <nav className="events-nav" aria-label="Events views">
        <Toggle
          label="Events view"
          options={tabs}
          value={view.tab}
          onChange={(tab) => {
            window.location.hash = tab;
          }}
        />
      </nav>
      {content}
    </section>
  );
}

type EventViewProps = {
  eventID?: number;
  full: boolean;
  setFull: (full: boolean) => void;
};

function EventView({ eventID, full, setFull }: EventViewProps) {
  // Views are keyed, so a pick lasts for this view only.
  const [picked, setFPS] = useState<number>();
  const loader = useCallback((signal: AbortSignal) => fetchEvent(eventID, signal), [eventID]);
  const state = usePolling<WeeklyEvent | null>(null, loader, REFRESH_MS);
  const event = state.data;
  if (!event) return <Notice state={state} notFound="No event yet" />;

  const fps = picked ?? defaultFPS(event.boards);
  const finished = event.status === "finished";
  const board = event.boards.find((item) => item.fps === fps);
  const routes = new Map(event.routes.map((route) => [route.cp_id, route]));

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Season {event.season_id}</p>
          <h2>Week {event.week_no}</h2>
        </div>
        <div className="section-meta">
          <Clock size={16} aria-hidden="true" />
          {finished ? `Finished · ${dateRange(event.starts_at, event.ends_at)}` : <Countdown endsAt={event.ends_at} />}
        </div>
      </div>

      <h3>Routes</h3>
      <EventTable
        label="Routes"
        head={["Route", "Map", "Difficulty"]}
        empty="No routes."
        rows={event.routes.map((route) => ({
          key: route.slot,
          cells: [bucketLabels[route.bucket] ?? route.bucket, twoLine(route.mapname, route.ender), Number(route.difficulty).toFixed(2)],
        }))}
      />

      <h3>Standings</h3>
      <div className="leaderboard-toolbar">
        <Toggle label="FPS" options={fpsOptions} value={fps} onChange={setFPS} />
        <Toggle label="Detail" options={modeOptions} value={full} onChange={setFull} />
      </div>
      <EventTable
        label={`Standings at ${fps} fps`}
        head={["Rank", "Player", "Points", "Maps", "1st places", ...(finished ? ["XP", "Coins"] : [])]}
        empty="No finishes yet."
        rows={(board?.standings ?? []).map((row) => ({
          key: row.player_id,
          rank: row.rank,
          cells: [
            rankCell(row.rank),
            playerCell(row),
            row.points.toLocaleString(),
            row.maps_finished,
            row.first_places,
            ...(finished ? [row.xp_awarded.toLocaleString(), row.coins_awarded.toLocaleString()] : []),
          ],
        }))}
      />

      {full
        ? board?.maps.map((map) => {
            const route = routes.get(map.cp_id);
            return (
              <Fragment key={map.cp_id}>
                <h3>{route ? `${bucketLabels[route.bucket] ?? route.bucket} · ${route.mapname}` : `Route ${map.cp_id}`}</h3>
                <EventTable
                  label={`${route?.mapname ?? map.cp_id} results at ${fps} fps`}
                  head={["Rank", "Player", "Time", "Nades", "Points", "Date"]}
                  empty="No finishes yet."
                  rows={map.results.map((row) => ({
                    key: row.player_id,
                    rank: row.rank,
                    cells: [
                      rankCell(row.rank),
                      playerCell(row),
                      formatTicks(row.time_played),
                      row.nadejumps,
                      row.points,
                      formatDateTime(row.time_created),
                    ],
                  }))}
                />
              </Fragment>
            );
          })
        : null}
    </>
  );
}

function WeekList({ seasonID }: { seasonID?: number }) {
  const loader = useCallback((signal: AbortSignal) => fetchEventList(seasonID, signal), [seasonID]);
  const state = usePolling<EventSummary[] | null>(null, loader, REFRESH_MS);
  if (!state.data) return <Notice state={state} notFound="No event yet" />;

  return (
    <EventTable
      label="Weeks"
      head={["Week", "Dates", "125 winner", "250 winner"]}
      empty="No event yet"
      rows={state.data.map((event) => ({
        key: event.event_id,
        cells: [
          <a href={`#week-${event.event_id}`}>Week {event.week_no}</a>,
          twoLine(dateRange(event.starts_at, event.ends_at), `Season ${event.season_id} · ${statusLabel(event.status)}`),
          winnerCell(event.winners, 125, event.status),
          winnerCell(event.winners, 250, event.status),
        ],
      }))}
    />
  );
}

function SeasonView({ seasonID }: { seasonID?: number }) {
  const [picked, setFPS] = useState<number>();
  const loader = useCallback((signal: AbortSignal) => fetchSeason(seasonID, signal), [seasonID]);
  const state = usePolling<Season | null>(null, loader, REFRESH_MS);
  const season = state.data;
  if (!season) return <Notice state={state} notFound="No season yet" />;

  const fps = picked ?? defaultFPS(season.boards);
  const finished = season.status === "finished";
  const standings = season.boards.find((board) => board.fps === fps)?.standings ?? [];

  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{finished ? "Finished season" : "Current season"}</p>
          <h2>Season {season.season_id}</h2>
        </div>
        <div className="section-meta">
          {season.weeks} / {SEASON_WEEKS} weeks · {dateRange(season.starts_at, season.ends_at)}
        </div>
      </div>
      <div className="leaderboard-toolbar">
        <Toggle label="FPS" options={fpsOptions} value={fps} onChange={setFPS} />
      </div>
      <EventTable
        label={`Season standings at ${fps} fps`}
        head={["Rank", "Player", "Points", "Weeks", "Weekly wins", ...(finished ? ["XP", "Coins"] : [])]}
        empty="No standings yet. They update when a week closes."
        rows={standings.map((row) => ({
          key: row.player_id,
          rank: row.rank,
          cells: [
            rankCell(row.rank),
            playerCell(row),
            row.points.toLocaleString(),
            row.weeks_played,
            row.weekly_wins,
            ...(finished ? [row.xp_awarded.toLocaleString(), row.coins_awarded.toLocaleString()] : []),
          ],
        }))}
      />
    </>
  );
}

function SeasonList() {
  const state = usePolling<SeasonSummary[] | null>(null, fetchSeasonList, REFRESH_MS);
  if (!state.data) return <Notice state={state} notFound="No season yet" />;

  return (
    <EventTable
      label="Seasons"
      head={["Season", "Dates", "125 winner", "250 winner"]}
      empty="No season yet"
      rows={state.data.map((season) => ({
        key: season.season_id,
        cells: [
          <a href={`#season-${season.season_id}`}>Season {season.season_id}</a>,
          twoLine(dateRange(season.starts_at, season.ends_at), `${season.weeks} weeks · ${statusLabel(season.status)}`),
          winnerCell(season.winners, 125, season.status),
          winnerCell(season.winners, 250, season.status),
        ],
      }))}
    />
  );
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const left = formatCountdown(Date.parse(endsAt) - now);
  return <>{left ? `Ends in ${left}` : "New week starting soon"}</>;
}

function Notice({ state, notFound }: { state: LoadState<unknown>; notFound: string }) {
  // request() errors read "<status> <statusText>".
  const status = state.error?.slice(0, 3);
  if (state.error && status !== "404" && status !== "503") {
    return <p className="inline-alert">Events API unavailable: {state.error}</p>;
  }

  const text = status === "503" ? "Weekly events are not available yet" : status === "404" ? notFound : "Loading…";
  return <p className="compact-section">{text}</p>;
}

type Row = { key: string | number; rank?: number; cells: ReactNode[] };

function EventTable({ label, head, rows, empty }: { label: string; head: string[]; rows: Row[]; empty: string }) {
  return (
    <div
      className="leaderboard-table event-table"
      role="table"
      aria-label={label}
      style={{ "--event-cols": head.length - 2 } as CSSProperties}
    >
      <div className="leaderboard-row leaderboard-row-head" role="row">
        {head.map((title) => (
          <span role="columnheader" key={title}>
            {title}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={row.key}
          role="row"
          className={`leaderboard-row ${row.rank && row.rank <= 3 ? `is-podium rank-${row.rank}` : ""}`}
        >
          {row.cells.map((cell, index) => (
            <span
              key={index}
              role="cell"
              data-label={head[index]}
              className={index === 0 ? "rank-cell" : index === 1 ? "leaderboard-player" : undefined}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
      {rows.length === 0 ? <div className="empty-state">{empty}</div> : null}
    </div>
  );
}

function Toggle<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented-control" aria-label={label}>
      {options.map(([option, text]) => (
        <button key={text} type="button" className={value === option ? "is-active" : ""} onClick={() => onChange(option)}>
          {text}
        </button>
      ))}
    </div>
  );
}

function twoLine(main: ReactNode, sub?: ReactNode, title?: string) {
  return (
    <span className="leaderboard-player-copy">
      <strong title={title}>{main}</strong>
      {sub ? <small>{sub}</small> : null}
    </span>
  );
}

function playerCell(player: { player_id: number; playername: string; country: string }) {
  return twoLine(
    <ColoredPlayerName name={player.playername} />,
    player.country ? player.country.toUpperCase() : `ID ${player.player_id}`,
    stripColorCodes(player.playername),
  );
}

function rankCell(rank: number) {
  return (
    <>
      <Trophy size={16} aria-hidden="true" />#{rank}
    </>
  );
}

function winnerCell(winners: EventWinner[], fps: number, status: string) {
  const winner = winners.find((item) => item.fps === fps);
  if (!winner) return status === "active" ? "In progress" : "-";
  return (
    <>
      <span className="event-winner" title={stripColorCodes(winner.playername)}>
        <ColoredPlayerName name={winner.playername} />
      </span>
      {winner.points.toLocaleString()} pts
    </>
  );
}

function statusLabel(status: string) {
  return status === "active" ? "In progress" : "Finished";
}

function dateRange(start: string, end: string | null) {
  const day = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${day(start)} – ${end ? day(end) : "ongoing"}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
