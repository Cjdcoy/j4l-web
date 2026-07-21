import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, Compass, Crown, Map, MessageSquare, Server, ShieldCheck, Terminal, Trophy, Wrench } from "lucide-react";
import { fetchMaps, fetchServers } from "./lib/api";
import { fallbackMaps, fallbackServerStatus } from "./lib/fallbackData";
import { usePolling } from "./lib/usePolling";
import type { MapInfo } from "./lib/types";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { LiveServers } from "./components/LiveServers";
import { LevelingSystem } from "./components/LevelingSystem";
import { MapExplorer } from "./components/MapExplorer";
import { RulesSection } from "./components/RulesSection";
import { StaticSection } from "./components/StaticSection";
import { CommandDirectory } from "./components/CommandDirectory";

type TabID = "servers" | "maps" | "leaderboards" | "levels" | "commands" | "rules" | "start";

const tabs: Array<{ id: TabID; label: string; icon: typeof Server }> = [
  { id: "servers", label: "Servers", icon: Server },
  { id: "maps", label: "Maps", icon: Map },
  { id: "leaderboards", label: "Ranks", icon: Trophy },
  { id: "levels", label: "Levels", icon: Crown },
  { id: "commands", label: "Commands", icon: Terminal },
  { id: "rules", label: "Rules", icon: ShieldCheck },
  { id: "start", label: "Start", icon: BookOpen },
];

const DISCORD_INVITE_URL = "https://discord.com/invite/5zqvy25M9W";

function initialTab(): TabID {
  const hash = window.location.hash.replace("#", "");
  return tabs.some((tab) => tab.id === hash) ? (hash as TabID) : "servers";
}

export function App() {
  const loadServers = useCallback((signal: AbortSignal) => fetchServers(signal), []);
  const serverState = usePolling(fallbackServerStatus, loadServers, 15000);
  const [maps, setMaps] = useState<MapInfo[]>(fallbackMaps);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const discordURL = import.meta.env.VITE_DISCORD_URL || DISCORD_INVITE_URL;
  const [activeTab, setActiveTab] = useState<TabID>(initialTab);

  useEffect(() => {
    const controller = new AbortController();
    fetchMaps(controller.signal)
      .then((items) => {
        if (items.length > 0) {
          setMaps(items);
        }
        setMapsError(null);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMapsError(error instanceof Error ? error.message : "Map request failed");
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    function onHashChange() {
      setActiveTab(initialTab());
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const onlineSummary = useMemo(() => {
    const status = serverState.data;
    return `${status.online_servers}/${status.servers.length} online`;
  }, [serverState.data]);

  function selectTab(tab: TabID) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" type="button" onClick={() => selectTab("servers")} aria-label="Jump4Life servers">
            <span className="brand-mark">J4L</span>
            <span>
              <strong>Jump4Life</strong>
              <small>Call of Duty 2 Jump</small>
            </span>
          </button>

          <nav className="site-tabs" aria-label="Primary navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  className={activeTab === tab.id ? "is-active" : ""}
                  onClick={(event) => {
                    event.preventDefault();
                    selectTab(tab.id);
                  }}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  <Icon size={16} aria-hidden="true" />
                  {tab.label}
                </a>
              );
            })}
          </nav>

          <div className="header-status" aria-label="Live status summary">
            <span className="live-summary">
              <Activity size={15} aria-hidden="true" />
              {onlineSummary}
            </span>
            <span>
              <Compass size={15} aria-hidden="true" />
              {serverState.data.total_players} players
            </span>
            <span>
              <Map size={15} aria-hidden="true" />
              {maps.length} maps
            </span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <aside className="info-banner" aria-label="Website status">
          <Wrench size={18} aria-hidden="true" />
          <strong>Development preview</strong>
          <span>Features and live data may change while the new site is being completed.</span>
          <a className="info-banner-link" href={discordURL} target="_blank" rel="noreferrer">
            Share feedback
          </a>
        </aside>

        {activeTab === "servers" ? (
          <div className="tab-view tab-servers">
            <LiveServers
              status={serverState.data}
              maps={maps}
              error={serverState.error}
              loading={serverState.loading}
              discordURL={discordURL}
            />
          </div>
        ) : null}

        {activeTab === "maps" ? (
          <div className="tab-view">
            <MapExplorer maps={maps} error={mapsError} />
          </div>
        ) : null}

        {activeTab === "leaderboards" ? (
          <div className="tab-view">
            <LeaderboardPanel />
          </div>
        ) : null}

        {activeTab === "levels" ? (
          <div className="tab-view">
            <LevelingSystem />
          </div>
        ) : null}

        {activeTab === "commands" ? (
          <div className="tab-view">
            <CommandDirectory />
          </div>
        ) : null}

        {activeTab === "rules" ? (
          <div className="tab-view tab-narrow">
            <RulesSection />
          </div>
        ) : null}

        {activeTab === "start" ? (
          <div className="tab-view tab-narrow">
            <StaticSection
              id="start"
              icon={<BookOpen size={20} aria-hidden="true" />}
              title="Getting Started"
              items={[
                "Use Call of Duty 2 1.3.",
                "Join through one of the live server connect addresses from the Servers tab.",
                "Keep in-game downloads enabled for map and mod files.",
                "Ask in Discord if a map download or server connect fails.",
              ]}
            />
            <section className="community-band" id="community">
              <div>
                <p className="eyebrow">Community</p>
                <h2>Discord, reports, and server help.</h2>
              </div>
              <a className="community-link discord-button" href={discordURL} target="_blank" rel="noreferrer">
                <MessageSquare size={18} aria-hidden="true" />
                Discord
              </a>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
