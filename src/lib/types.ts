export type ServerStatus = {
  servers: ServerInfo[];
  total_players: number;
  online_servers: number;
  refreshed_at: string;
};

export type ServerInfo = {
  id: string;
  name: string;
  region?: string;
  domain: string;
  ip: string;
  host: string;
  port: number;
  connect: string;
  hostname?: string;
  map: string;
  mapid: number;
  game_type: string;
  players: OnlinePlayer[];
  player_count: number;
  online: boolean;
  password: boolean;
  error?: string;
};

export type OnlinePlayer = {
  playername: string;
  playerid: number;
  ping: number;
  admin: number;
};

export type MapInfo = {
  mapid?: number;
  cp_id?: number;
  name: string;
  display_name: string;
  type: "jump" | "defrag" | "surf" | string;
  author?: string;
  difficulty: number | null;
  timelimit: number;
  released: string | null;
  in_rotation: boolean;
  hidden: boolean;
  image_key?: string;
  individual_finish_count?: number;
  nb_checkpoints?: number;
};

export type LeaderboardKind = "rank-xp" | "speed" | "jump" | "defrag" | "surf" | "howmany";

export type LeaderboardEntry = {
  player_id: number;
  player_name: string;
  rank: number;
  rating: number;
  country: string;
  country_code: string;
  region: string;
  last_seen: string;
  score: number;
  top_list: Record<string, number>;
  total_xp?: number;
  prestige?: number;
  level?: number;
  level_display?: string;
  title?: string;
  xp_into_level?: number;
  xp_for_level?: number;
  xp_to_next?: number;
  maxed?: boolean;
  map_scores?: Array<{
    map_id: number;
    map_name: string;
    score: number;
    difficulty: number;
    rank: number;
  }>;
};

export type LoadState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};
