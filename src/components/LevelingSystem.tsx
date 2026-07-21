import {
  Award,
  Calculator,
  CheckCircle2,
  Clock3,
  Crown,
  Gauge,
  Medal,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import {
  formatXP,
  LEVEL_COUNT,
  LOOP_BAR_XP,
  LOOP_XP,
  MAX_DISPLAY_XP,
  MAX_PRESTIGE,
  PRESTIGE_RANKS,
  RANK_LEVEL_GROUPS,
  RANKED_FPS_BUCKETS,
  TOP_TEN_BONUSES,
} from "../lib/leveling";

export function LevelingSystem() {
  return (
    <div className="leveling-page" id="levels">
      <section className="leveling-hero" aria-labelledby="leveling-title">
        <div className="leveling-hero-copy">
          <p className="eyebrow">Lifetime progression</p>
          <h1 id="leveling-title">From Mortal Runner to Celestial Jump God.</h1>
          <p>
            Earn XP at checkpoints and map finishes, climb 50 levels, then carry your lifetime XP through ten
            prestige tiers. Your progress never resets.
          </p>
          <dl className="leveling-stats">
            <div>
              <dt>Levels per loop</dt>
              <dd>{LEVEL_COUNT}</dd>
            </div>
            <div>
              <dt>XP per loop</dt>
              <dd>{formatXP(LOOP_XP)}</dd>
            </div>
            <div>
              <dt>Prestige tiers</dt>
              <dd>{MAX_PRESTIGE}</dd>
            </div>
          </dl>
        </div>
        <div className="leveling-hero-rank">
          <img src="/ranks/rank-prestige-10.avif" alt="" width="640" height="320" />
          <span>Prestige 10</span>
          <strong>Celestial Jump God</strong>
          <small>{formatXP(MAX_DISPLAY_XP)} lifetime XP</small>
        </div>
      </section>

      <section className="content-section" id="earning-xp" aria-labelledby="earning-xp-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The run-to-rank loop</p>
            <h2 id="earning-xp-title">How you earn XP</h2>
          </div>
          <span className="section-meta">
            <Clock3 size={16} aria-hidden="true" /> Based on timed progress
          </span>
        </div>

        <div className="leveling-step-grid">
          <article className="leveling-step-card">
            <span className="leveling-step-icon">
              <Clock3 size={20} aria-hidden="true" />
            </span>
            <p className="leveling-step-number">01</p>
            <h3>Set the base</h3>
            <p>
              Checkpoints use that segment; map finishes use the whole run. Every 20 timing ticks becomes 1 XP,
              rounded down with a 1 XP minimum.
            </p>
          </article>
          <article className="leveling-step-card">
            <span className="leveling-step-icon">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <p className="leveling-step-number">02</p>
            <h3>Add your bonuses</h3>
            <p>
              Donator, difficulty, and eligible route top-10 bonuses stack. The active server multiplier applies
              last.
            </p>
          </article>
          <article className="leveling-step-card">
            <span className="leveling-step-icon">
              <Award size={20} aria-hidden="true" />
            </span>
            <p className="leveling-step-number">03</p>
            <h3>Keep it forever</h3>
            <p>
              The final award adds to lifetime XP, which determines your level, prestige, title, and progress.
            </p>
          </article>
        </div>

        <div className="leveling-xp-details">
          <figure className="leveling-formula">
            <Calculator size={22} aria-hidden="true" />
            <figcaption>
              <span>Final award</span>
              <strong>floor(base XP × (100% + stacked bonuses) × server multiplier)</strong>
            </figcaption>
          </figure>

          <div className="leveling-eligibility-grid">
            <article>
              <CheckCircle2 size={19} aria-hidden="true" />
              <div>
                <h3>One award per checkpoint</h3>
                <p>Each run and checkpoint pair awards XP once.</p>
              </div>
            </article>
            <article>
              <ShieldCheck size={19} aria-hidden="true" />
              <div>
                <h3>Legitimate runs only</h3>
                <p>OS mode, cheated runs, and fun-cheat runs receive 0 XP.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section" id="xp-bonuses" aria-labelledby="xp-bonuses-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Stack your reward</p>
            <h2 id="xp-bonuses-title">XP bonuses</h2>
          </div>
          <span className="section-meta">
            <Zap size={16} aria-hidden="true" /> Additive, then multiplied
          </span>
        </div>

        <div className="leveling-bonus-grid">
          <article>
            <Star size={20} aria-hidden="true" />
            <h3>Donator</h3>
            <strong>+25%</strong>
            <p>Active donator status.</p>
          </article>
          <article>
            <Gauge size={20} aria-hidden="true" />
            <h3>Difficulty</h3>
            <strong>0-50%</strong>
            <p>Five percent per difficulty point.</p>
          </article>
          <article>
            <Trophy size={20} aria-hidden="true" />
            <h3>Route top 10</h3>
            <strong>+5-60%</strong>
            <p>Eligible normal-mode nadejump records.</p>
          </article>
          <article>
            <Zap size={20} aria-hidden="true" />
            <h3>Server multiplier</h3>
            <strong>1x-10x</strong>
            <p>Applied after all percentage bonuses.</p>
          </article>
        </div>

        <div className="leveling-top-ten">
          <div className="leveling-top-ten-copy">
            <p className="eyebrow">Checkpoint and route leaderboard</p>
            <h3>Top-10 bonus scale</h3>
            <p>
              Best run per player, sorted by nadejumps then time. Ranked FPS: {RANKED_FPS_BUCKETS.join(", ")};
              other rates use mixed.
            </p>
          </div>
          <ol className="leveling-top-ten-list">
            {TOP_TEN_BONUSES.map((bonus, index) => (
              <li key={bonus}>
                <span>#{index + 1}</span>
                <strong>+{bonus}%</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="content-section" id="level-path" aria-labelledby="level-path-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Prestige 0</p>
            <h2 id="level-path-title">The 50-level path</h2>
          </div>
          <span className="section-meta">
            <Medal size={16} aria-hidden="true" /> {formatXP(LOOP_BAR_XP)} bar XP + 50 transitions
          </span>
        </div>
        <p className="leveling-section-intro">
          Bars grow with level<sup>1.35</sup>, and level 50 has double weight. Moving past every bar costs one final
          transition XP, making a complete loop {formatXP(LOOP_XP)} XP. Start values below are within the current
          prestige loop. Shared core artwork appears once with every level that uses it; mythic ranks retain their
          individual emblems.
        </p>

        <ol className="leveling-level-groups">
          {RANK_LEVEL_GROUPS.map((group) => {
            const rangeLabel =
              group.startLevel === group.endLevel
                ? `Level ${group.startLevel}`
                : `Levels ${group.startLevel}-${group.endLevel}`;

            return (
              <li className={group.family === "Mythic" ? "is-mythic" : "is-core"} key={group.image}>
                <div className="leveling-level-group-summary">
                  <img
                    src={group.image}
                    alt=""
                    width="360"
                    height="360"
                    loading="lazy"
                    decoding="async"
                  />
                  <small>{group.family} emblem</small>
                  <h3>{rangeLabel}</h3>
                  <p>
                    {group.levels.length === 1
                      ? group.levels[0].title
                      : `${group.levels.length} levels share this artwork`}
                  </p>
                </div>

                <ol className="leveling-group-levels">
                  {group.levels.map((rank) => (
                    <li key={rank.level}>
                      <div className="leveling-group-level-name">
                        <span>Level {rank.level}</span>
                        <strong>{rank.title}</strong>
                      </div>
                      <dl>
                        <div>
                          <dt>Starts</dt>
                          <dd>{formatXP(rank.startXP)} XP</dd>
                        </div>
                        <div>
                          <dt>Next</dt>
                          <dd>{formatXP(rank.xpToNext)} XP</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="content-section" id="prestige-path" aria-labelledby="prestige-path-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Lifetime milestones</p>
            <h2 id="prestige-path-title">Prestige tiers</h2>
          </div>
          <span className="section-meta">
            <Crown size={16} aria-hidden="true" /> XP never resets
          </span>
        </div>
        <p className="leveling-section-intro">
          Prestiges 1 through 9 repeat levels 1-50 while showing the prestige title. At prestige 10, the display
          caps at Level ??? and Celestial Jump God, although lifetime XP can keep increasing.
        </p>

        <ol className="leveling-prestige-grid">
          {PRESTIGE_RANKS.map((rank) => (
            <li className={rank.prestige === MAX_PRESTIGE ? "is-maxed" : undefined} key={rank.prestige}>
              <img
                src={rank.image}
                alt=""
                width="640"
                height="320"
                loading="lazy"
                decoding="async"
              />
              <div>
                <small>Prestige {rank.prestige}</small>
                <h3>{rank.title}</h3>
                <p>Level {rank.levelDisplay}</p>
                <span>Starts at {formatXP(rank.startXP)} lifetime XP</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="content-section" id="rank-details" aria-labelledby="rank-details-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">What happens behind the number</p>
            <h2 id="rank-details-title">Progress you can trust</h2>
          </div>
        </div>

        <div className="leveling-detail-grid">
          <article>
            <Award size={21} aria-hidden="true" />
            <h3>Clear award messages</h3>
            <p>Your XP line includes every active bonus, followed separately by any level or prestige changes.</p>
            <code>+1234 XP (+25% donator, +60% top1, +15% difficulty)</code>
            <code>No XP awarded: cheat</code>
          </article>
          <article>
            <ShieldCheck size={21} aria-hidden="true" />
            <h3>Auditable awards</h3>
            <p>
              Every checkpoint award records its base, bonuses, top rank, block reason, and before/after totals so
              duplicate awards are prevented and problems can be repaired.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
