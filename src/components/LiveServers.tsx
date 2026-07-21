import { useMemo, useState } from "react";
import { ChevronDown, Copy, Lock, MapPin, MessageSquare, RefreshCcw, Users } from "lucide-react";
import type { MapInfo, ServerInfo, ServerStatus } from "../lib/types";
import { ColoredPlayerName, stripColorCodes } from "./ColoredPlayerName";
import { cardImageURL } from "../lib/images";

type Props = {
  status: ServerStatus;
  maps: MapInfo[];
  error: string | null;
  loading: boolean;
  discordURL: string;
};

export function LiveServers({ status, maps, error, loading, discordURL }: Props) {
  const refreshed = status.refreshed_at && new Date(status.refreshed_at).getTime() > 0
    ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(
        new Date(status.refreshed_at),
      )
    : "pending";

  return (
    <section className="content-section" aria-labelledby="servers-title">
      <div className="section-heading server-section-heading">
        <div className="server-heading-copy">
          <h2 id="servers-title">Live Servers</h2>
          <p>
            <strong>{status.online_servers}/{status.servers.length}</strong> online
            <span aria-hidden="true"> · </span>
            {status.total_players} {status.total_players === 1 ? "player" : "players"}
          </p>
        </div>
        <div className="server-heading-actions">
          <div className="section-meta" aria-label={`Last refreshed at ${refreshed}`}>
            <RefreshCcw size={16} className={loading ? "spin" : ""} aria-hidden="true" />
            <span>{refreshed}</span>
          </div>
          <a className="server-discord-link" href={discordURL} target="_blank" rel="noreferrer">
            <MessageSquare size={16} aria-hidden="true" />
            Discord
          </a>
        </div>
      </div>

      {error ? <p className="inline-alert">API unavailable: {error}</p> : null}

      <div className="server-grid">
        {status.servers.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            imageURL={cardImageURL(server.map, maps)}
          />
        ))}
      </div>
    </section>
  );
}

type ServerCardProps = {
  server: ServerInfo;
  imageURL: string;
};

function ServerCard({ server, imageURL }: ServerCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const image = imageFailed ? "" : imageURL || "/maps/cards/jm_bootcamp.avif";
  const playerNames = useMemo(() => server.players.map((player) => player.playername).filter(Boolean), [server.players]);
  const hasOnlinePlayers = server.online && playerNames.length > 0;

  async function copyConnect() {
    await navigator.clipboard?.writeText(`connect ${server.connect}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <article className={`server-card ${server.online ? "is-online" : "is-offline"}`}>
      <div className="server-media">
        {image ? <img src={image} alt="" loading="lazy" onError={() => setImageFailed(true)} /> : null}
        <div className="server-media-fallback" aria-hidden="true" />
        <span className="status-pill">{server.online ? "Online" : "Offline"}</span>
        <span className="server-population">
          <Users size={15} aria-hidden="true" />
          {server.player_count} {server.player_count === 1 ? "player" : "players"}
        </span>
      </div>

      <div className="server-body">
        <div className="server-title-row">
          <div>
            <h3>
              <ColoredPlayerName name={server.name} />
            </h3>
            <p>
              <ColoredPlayerName name={server.hostname || server.game_type || "COD2"} />
            </p>
          </div>
          {server.password ? <Lock size={17} aria-label="Password required" /> : null}
        </div>

        <div className="server-facts">
          <span>
            <MapPin size={16} aria-hidden="true" />
            {server.map || "-"}
          </span>
        </div>

        <div className={`server-actions ${hasOnlinePlayers ? "" : "without-player-toggle"}`}>
          <button type="button" className="icon-text-button copy-button" onClick={copyConnect}>
            <Copy size={16} aria-hidden="true" />
            <span>
              <strong>{copied ? "Copied" : "Copy address"}</strong>
              <code aria-live="polite">{copied ? "Ready to paste" : server.connect}</code>
            </span>
          </button>
          {hasOnlinePlayers ? (
            <button
              type="button"
              className="icon-button"
              onClick={() => setExpanded((current) => !current)}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Hide" : "Show"} players for ${server.name}`}
            >
              <ChevronDown size={18} />
            </button>
          ) : null}
        </div>

        {hasOnlinePlayers && expanded ? (
          <div className="player-list">
            {playerNames.map((name, index) => (
              <span key={`${stripColorCodes(name)}-${index}`}>
                <ColoredPlayerName name={name} />
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
