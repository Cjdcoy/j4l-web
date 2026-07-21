import type { MapInfo } from "./types";

export function mapImageKey(mapName: string, maps: MapInfo[]) {
  const direct = maps.find((item) => item.name === mapName);
  return direct?.image_key || direct?.name || mapName;
}

export function cardImageURL(mapName: string, maps: MapInfo[]) {
  const key = mapImageKey(mapName, maps);
  return key && mapName !== "unknown" ? `/maps/cards/${key}.avif` : "";
}

export function thumbImageURL(mapName: string, maps: MapInfo[]) {
  const key = mapImageKey(mapName, maps);
  return key ? `/maps/cards/${key}.avif` : "";
}

export function formatMapName(name: string) {
  if (!name || name === "unknown") return "Unknown map";
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (value) => value.toUpperCase());
}
