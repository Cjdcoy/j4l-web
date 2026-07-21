export const LEVEL_COUNT = 50;
export const MAX_PRESTIGE = 10;
export const LOOP_BAR_XP = 360_000;
export const LOOP_XP = LOOP_BAR_XP + LEVEL_COUNT;
export const MAX_DISPLAY_XP = LOOP_XP * MAX_PRESTIGE;

export interface RankLevel {
  level: number;
  title: string;
  family: "Core" | "Mythic";
  image: string;
  startXP: number;
  barXP: number;
  xpToNext: number;
}

export interface PrestigeRank {
  prestige: number;
  title: string;
  image: string;
  startXP: number;
  levelDisplay: "1-50" | "???";
}

export interface RankLevelGroup {
  family: RankLevel["family"];
  image: string;
  startLevel: number;
  endLevel: number;
  levels: RankLevel[];
}

export const TOP_TEN_BONUSES = [60, 50, 45, 40, 35, 30, 25, 20, 10, 5] as const;
export const RANKED_FPS_BUCKETS = [43, 76, 125, 250, 333] as const;

const LEVEL_TITLES = [
  "Mortal Runner",
  "Wall Seeker",
  "Nade Seeker",
  "Bounce Seeker",
  "Ladder Seeker",
  "Strafe Seeker",
  "Switch Seeker",
  "Wall Disciple",
  "Nade Disciple",
  "Bounce Disciple",
  "Ladder Disciple",
  "Strafe Disciple",
  "Switch Disciple",
  "Wall Adept",
  "Nade Adept",
  "Bounce Adept",
  "Ladder Adept",
  "Strafe Adept",
  "Switch Adept",
  "Wall Mystic",
  "Nade Mystic",
  "Bounce Mystic",
  "Ladder Mystic",
  "Strafe Mystic",
  "Switch Mystic",
  "Wall Dragon",
  "Nade Dragon",
  "Bounce Dragon",
  "Ladder Dragon",
  "Strafe Dragon",
  "Switch Dragon",
  "Wall Ascendant",
  "Nade Ascendant",
  "Bounce Ascendant",
  "Ladder Ascendant",
  "Strafe Ascendant",
  "Switch Ascendant",
  "Wall Immortal",
  "Nade Immortal",
  "Bounce Immortal",
  "Ladder Immortal",
  "Strafe Immortal",
  "Switch Immortal",
  "Cloud Immortal",
  "Jade Immortal",
  "Dragon Immortal",
  "Heaven Sage",
  "Void Sage",
  "Dao Sovereign",
  "Jumpmaster",
] as const;

const PRESTIGE_TITLES = [
  "Ascended Jumpmaster",
  "Cloud Sovereign",
  "Jade Vanguard",
  "Heavenly Switcher",
  "Talisman Sage",
  "Dao Ascendant",
  "Void Immortal",
  "Jade Emperor",
  "Eternal Dragon",
  "Celestial Jump God",
] as const;

function rankAsset(level: number): { family: RankLevel["family"]; image: string } {
  if (level >= 44) {
    return {
      family: "Mythic",
      image: `/ranks/rank-mythic-${String(level - 43).padStart(2, "0")}.avif`,
    };
  }

  const core = level === 1 ? 1 : Math.floor((level - 2) / 6) + 2;
  return {
    family: "Core",
    image: `/ranks/rank-core-${String(core).padStart(2, "0")}.avif`,
  };
}

function buildLevelCosts(): number[] {
  const weights = Array.from({ length: LEVEL_COUNT }, (_, index) => {
    const level = index + 1;
    const weight = Math.pow(level, 1.35);
    return level === LEVEL_COUNT ? weight * 2 : weight;
  });
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  const costs = weights.map((weight) => Math.max(1, Math.floor((weight / totalWeight) * LOOP_BAR_XP)));
  const assignedXP = costs.reduce((total, cost) => total + cost, 0);
  costs[LEVEL_COUNT - 1] += LOOP_BAR_XP - assignedXP;
  return costs;
}

const LEVEL_COSTS = buildLevelCosts();

export const RANK_LEVELS: RankLevel[] = LEVEL_TITLES.map((title, index) => {
  const level = index + 1;
  const barXP = LEVEL_COSTS[index];
  const startXP = LEVEL_COSTS.slice(0, index).reduce((total, cost) => total + cost, index);
  const asset = rankAsset(level);

  return {
    level,
    title,
    ...asset,
    startXP,
    barXP,
    xpToNext: barXP + 1,
  };
});

export function levelEmblemURL(level?: number): string | null {
  if (typeof level !== "number" || !Number.isFinite(level)) return null;
  const normalizedLevel = Math.min(LEVEL_COUNT, Math.max(1, Math.trunc(level)));
  return RANK_LEVELS[normalizedLevel - 1]?.image ?? null;
}

export const RANK_LEVEL_GROUPS = RANK_LEVELS.reduce<RankLevelGroup[]>((groups, rank) => {
  const currentGroup = groups[groups.length - 1];
  if (currentGroup?.image === rank.image) {
    currentGroup.endLevel = rank.level;
    currentGroup.levels.push(rank);
    return groups;
  }

  groups.push({
    family: rank.family,
    image: rank.image,
    startLevel: rank.level,
    endLevel: rank.level,
    levels: [rank],
  });
  return groups;
}, []);

export const PRESTIGE_RANKS: PrestigeRank[] = PRESTIGE_TITLES.map((title, index) => {
  const prestige = index + 1;
  return {
    prestige,
    title,
    image: `/ranks/rank-prestige-${String(prestige).padStart(2, "0")}.avif`,
    startXP: prestige * LOOP_XP,
    levelDisplay: prestige === MAX_PRESTIGE ? "???" : "1-50",
  };
});

export function prestigeEmblemURL(prestige?: number): string | null {
  if (typeof prestige !== "number" || !Number.isFinite(prestige) || prestige < 1) return null;
  const normalizedPrestige = Math.min(MAX_PRESTIGE, Math.trunc(prestige));
  return `/ranks/rank-prestige-${String(normalizedPrestige).padStart(2, "0")}-compact.avif`;
}

export function formatXP(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
