import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { MapInfo } from "../lib/types";
import { thumbImageURL } from "../lib/images";

type Props = {
  maps: MapInfo[];
  error: string | null;
};

const filters = ["all", "jump", "defrag", "surf"] as const;

export function MapExplorer({ maps, error }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof filters)[number]>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return maps
      .filter((map) => type === "all" || map.type === type)
      .filter((map) => {
        if (!needle) return true;
        return `${map.name} ${map.author || ""}`.toLowerCase().includes(needle);
      });
  }, [maps, query, type]);

  return (
    <section className="content-section" id="maps" aria-labelledby="maps-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Rotation</p>
          <h2 id="maps-title">Maps</h2>
        </div>
        <span className="section-meta">{filtered.length}/{maps.length} shown</span>
      </div>

      {error ? <p className="inline-alert">Map API unavailable: {error}</p> : null}

      <div className="map-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search maps" />
        </label>
        <div className="segmented-control" aria-label="Map type">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={type === item ? "is-active" : ""}
              onClick={() => setType(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="map-table" role="table" aria-label="J4L map list">
        <div className="map-row map-row-head" role="row">
          <span role="columnheader">Map</span>
          <span role="columnheader">Type</span>
          <span role="columnheader">Difficulty</span>
          <span role="columnheader">Finishes</span>
          <span role="columnheader">Author</span>
        </div>
        {filtered.map((map, index) => (
          <div className="map-row" role="row" key={mapKey(map, index)}>
            <span className="map-name-cell" role="cell" data-label="Map">
              <span className="map-thumb" aria-hidden="true">
                <img
                  src={thumbImageURL(map.name, maps)}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </span>
              <span>
                <strong>{map.name}</strong>
              </span>
            </span>
            <span role="cell" data-label="Type">
              <span className={`type-badge type-${map.type}`}>{map.type}</span>
            </span>
            <span role="cell" data-label="Difficulty">{formatDifficulty(map.difficulty)}</span>
            <span role="cell" data-label="Finishes">
              {typeof map.individual_finish_count === "number" ? map.individual_finish_count.toLocaleString() : "-"}
            </span>
            <span role="cell" data-label="Author">{map.author || "-"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDifficulty(value: number | null) {
  if (!value) return "-";
  return value <= 5 ? `${value}/5` : value.toFixed(1);
}

function mapKey(map: MapInfo, index: number) {
  return `${map.cp_id ?? map.mapid ?? index}-${map.name}`;
}
