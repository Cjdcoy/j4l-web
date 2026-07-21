import type { LeaderboardEntry, LeaderboardKind, MapInfo, OnlinePlayer, ServerInfo, ServerStatus } from "./types";

const DEFAULT_API_BASE_URL = "https://jhstats.fly.dev";
const DEFAULT_API_SOURCE = "j4l";
const DEFAULT_MAP_DIFFICULTY_SOURCE = "jh";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
const API_SOURCE = import.meta.env.VITE_API_SOURCE || DEFAULT_API_SOURCE;
const MAP_DIFFICULTY_SOURCE = import.meta.env.VITE_MAP_DIFFICULTY_SOURCE || DEFAULT_MAP_DIFFICULTY_SOURCE;

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

type StatsServerStatus = {
  servers?: StatsServerInfo[];
  total_players?: number;
  online_servers?: number;
  refreshed_at?: string;
};

type StatsServerInfo = {
  id?: string;
  name?: string;
  region?: string;
  domain?: string;
  ip?: string;
  host?: string;
  port?: number;
  connect?: string;
  hostname?: string;
  map?: string;
  mapid?: number;
  game_type?: string;
  players?: OnlinePlayer[];
  player_count?: number;
  online?: boolean;
  password?: boolean;
  error?: string;
};

type StatsMap = {
  mapid?: number;
  mapname?: string;
  cp_id?: number;
  name?: string;
  display_name?: string;
  type?: string;
  author?: string | null;
  released?: string | null;
  hidden?: number | boolean;
  difficulty?: number | Record<string, { difficulty?: number }>;
  timelimit?: number;
  in_rotation?: boolean;
  image_key?: string;
  individual_finish_count?: number;
  nb_checkpoints?: number;
};

const leaderboardPaths: Record<LeaderboardKind, string> = {
  "rank-xp": "/api/v1/leaderboard/rank-xp",
  speed: "/api/v1/leaderboard/speed-skill",
  jump: "/api/v1/leaderboard/jump-skill",
  defrag: "/api/v1/leaderboard/defrag-skill",
  surf: "/api/v1/leaderboard/surf-skill",
  howmany: "/api/v1/leaderboard/howmany",
};

export async function fetchServers(signal?: AbortSignal) {
  const payload = await request<StatsServerStatus>(apiPath("/api/v1/tracker/servers"), signal);
  const servers = Array.isArray(payload.servers) ? payload.servers.map(normalizeServer) : [];

  return {
    servers,
    total_players: numberOrUndefined(payload.total_players) ?? servers.reduce((sum, server) => sum + server.player_count, 0),
    online_servers: numberOrUndefined(payload.online_servers) ?? servers.filter((server) => server.online).length,
    refreshed_at: payload.refreshed_at || new Date().toISOString(),
  } satisfies ServerStatus;
}

export async function fetchMaps(signal?: AbortSignal) {
  const mapsPayload = await request<unknown>(apiPath("/api/v1/map/all"), signal);
  const maps = normalizeMapPayload(mapsPayload);

  try {
    const difficultyPayload = await request<unknown>(apiPath("/api/v1/map/all", {}, MAP_DIFFICULTY_SOURCE), signal);
    return mergeMapDifficulty(maps, normalizeMapPayload(difficultyPayload));
  } catch {
    return maps.map((map) => ({ ...map, difficulty: null }));
  }
}

export async function fetchLeaderboard(kind: LeaderboardKind, fps: string, signal?: AbortSignal) {
  let params: Record<string, string> = {};
  if (kind === "rank-xp") {
    params = { limit: "100" };
  } else if (kind !== "howmany") {
    params = { fps };
  }
  const payload = await request<unknown>(apiPath(leaderboardPaths[kind], params), signal);
  return normalizeLeaderboardPayload(payload);
}

function apiPath(path: string, params: Record<string, string> = {}, source = API_SOURCE) {
  const query = new URLSearchParams({ source, ...params });
  return `${path}?${query.toString()}`;
}

function normalizeServer(server: StatsServerInfo): ServerInfo {
  const host = server.host || server.ip || server.domain || "";
  const port = numberOrZero(server.port);
  const connect = server.connect || (host && port ? `${host}:${port}` : host);
  const players = Array.isArray(server.players) ? server.players : [];

  return {
    id: server.id || connect || `${server.domain || "server"}-${port}`,
    name: server.name || server.domain || (port ? `Server ${port}` : "Jump server"),
    region: server.region,
    domain: server.domain || host,
    ip: server.ip || host,
    host,
    port,
    connect,
    hostname: server.hostname,
    map: server.map || "unknown",
    mapid: numberOrZero(server.mapid),
    game_type: server.game_type || "COD2",
    players,
    player_count: numberOrUndefined(server.player_count) ?? players.length,
    online: Boolean(server.online),
    password: Boolean(server.password),
    error: server.error,
  };
}

function normalizeMapPayload(payload: unknown): MapInfo[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeMap).filter((map) => map.name);
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.maps)) {
      return payload.maps.map(normalizeMap).filter((map) => map.name);
    }

    return Object.values(payload)
      .map((value) => {
        if (isRecord(value) && isRecord(value.Map)) {
          return normalizeMap(value.Map);
        }
        if (isRecord(value) && isRecord(value.map)) {
          return normalizeMap(value.map);
        }
        return normalizeMap(value);
      })
      .filter((map) => map.name);
  }

  return [];
}

function normalizeMap(raw: unknown): MapInfo {
  const map = isRecord(raw) ? (raw as StatsMap) : {};
  const name = stringValue(map.name || map.mapname);
  const type = normalizeMapType(map.type, name);
  const hidden = map.hidden === true || map.hidden === 1;

  return {
    mapid: numberOrUndefined(map.mapid),
    cp_id: numberOrUndefined(map.cp_id),
    name,
    display_name: stringValue(map.display_name),
    type,
    author: nullableString(map.author),
    difficulty: normalizeDifficulty(map.difficulty),
    timelimit: numberOrZero(map.timelimit),
    released: nullableString(map.released) || null,
    in_rotation: typeof map.in_rotation === "boolean" ? map.in_rotation : !hidden,
    hidden,
    image_key: stringValue(map.image_key) || name,
    individual_finish_count: numberOrUndefined(map.individual_finish_count),
    nb_checkpoints: numberOrUndefined(map.nb_checkpoints),
  };
}

function mergeMapDifficulty(maps: MapInfo[], difficultyMaps: MapInfo[]) {
  const difficultyByName = new Map(
    difficultyMaps
      .filter((map) => typeof map.difficulty === "number")
      .map((map) => [mapNameKey(map.name), map.difficulty]),
  );

  return maps.map((map) => ({
    ...map,
    difficulty: difficultyByName.get(mapNameKey(map.name)) ?? null,
  }));
}

function normalizeLeaderboardPayload(payload: unknown): LeaderboardEntry[] {
  const rows = Array.isArray(payload) ? payload : isRecord(payload) && Array.isArray(payload.leaderboard) ? payload.leaderboard : [];

  return rows.map((row): LeaderboardEntry => {
    const entry = isRecord(row) ? row : {};
    return {
      player_id: numberOrZero(entry.player_id),
      player_name: stringValue(entry.player_name) || "Unknown player",
      rank: numberOrZero(entry.rank),
      rating: numberOrZero(entry.rating),
      country: stringValue(entry.country),
      country_code: stringValue(entry.country_code),
      region: stringValue(entry.region),
      last_seen: stringValue(entry.last_seen),
      score: numberOrUndefined(entry.score) ?? numberOrZero(entry.total_xp),
      top_list: isRecord(entry.top_list) ? normalizeNumberRecord(entry.top_list) : {},
      total_xp: numberOrUndefined(entry.total_xp),
      prestige: numberOrUndefined(entry.prestige),
      level: numberOrUndefined(entry.level),
      level_display: stringValue(entry.level_display) || undefined,
      title: stringValue(entry.title) || undefined,
      xp_into_level: numberOrUndefined(entry.xp_into_level),
      xp_for_level: numberOrUndefined(entry.xp_for_level),
      xp_to_next: numberOrUndefined(entry.xp_to_next),
      maxed: typeof entry.maxed === "boolean" ? entry.maxed : undefined,
      map_scores: Array.isArray(entry.map_scores)
        ? entry.map_scores.map((score) => {
            const item = isRecord(score) ? score : {};
            return {
              map_id: numberOrZero(item.map_id),
              map_name: stringValue(item.map_name),
              score: numberOrZero(item.score),
              difficulty: numberOrZero(item.difficulty),
              rank: numberOrZero(item.rank),
            };
          })
        : undefined,
    };
  });
}

function normalizeDifficulty(difficulty: StatsMap["difficulty"]) {
  if (!difficulty) return null;
  if (typeof difficulty === "number") {
    return Number.isFinite(difficulty) && difficulty > 0 ? Math.round(difficulty * 10) / 10 : null;
  }

  const preferred = difficulty["125"] || Object.values(difficulty)[0];
  const value = preferred?.difficulty;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function mapNameKey(name: string) {
  return name.trim().toLowerCase();
}

function normalizeNumberRecord(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, numberOrZero(value)]));
}

function inferMapType(name: string) {
  if (name.startsWith("surf_")) return "surf";
  if (name.startsWith("defrag_") || name.startsWith("df_") || name.startsWith("uj_defrag")) return "defrag";
  return "jump";
}

function normalizeMapType(value: unknown, name: string) {
  const type = stringValue(value).trim().toLowerCase();
  if (type === "jump" || type === "defrag" || type === "surf") {
    return type;
  }
  return inferMapType(name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
