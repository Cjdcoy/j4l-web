import { ShieldCheck } from "lucide-react";

type RuleGroup = {
  title: string;
  description: string;
  allowed?: string[];
  note?: string;
};

const ruleGroups: RuleGroup[] = [
  {
    title: "Scripts",
    description: "Scripts are considered cheating unless they have been explicitly approved by an admin.",
  },
  {
    title: "External software",
    description:
      "Any external software that modifies, improves, or interacts with CoD2 is considered cheating unless approved by an admin.",
    allowed: ["ISLC", "dgVoodoo2"],
  },
  {
    title: "Custom clients",
    description: "Custom clients are considered cheating unless approved by an admin.",
    allowed: ["CoD2x", "Momentum HUD"],
  },
  {
    title: "Mod bugs",
    description:
      "Abusing bugs caused by the mod is considered cheating unless the bug has been explicitly approved.",
    allowed: [
      "FF bounce, as patching it would make some maps impossible",
      "Respawning to restart from the beginning",
      "Starting a parallel run to throw a grenade for your current run",
    ],
  },
  {
    title: "In-game physics",
    description:
      "Using normal CoD2 physics and physics exploits is allowed unless a specific technique has been explicitly forbidden.",
    note:
      "Please report any game-breaking exploit you discover instead of abusing it, so it can be accepted without your run risking deletion.",
  },
  {
    title: "Shortcuts",
    description: "Any shortcut is allowed as long as it follows all the rules above.",
  },
];

export function RulesSection() {
  return (
    <section className="content-section compact-section rules-section" id="rules" aria-labelledby="rules-title">
      <div className="section-heading">
        <div className="heading-with-icon">
          <ShieldCheck size={20} aria-hidden="true" />
          <div>
            <p className="eyebrow">Rules</p>
            <h2 id="rules-title">Cheating, Clients &amp; Exploits</h2>
          </div>
        </div>
      </div>

      <div className="rule-groups">
        {ruleGroups.map((group) => (
          <article className="rule-group" key={group.title}>
            <h3>{group.title}</h3>
            <p>{group.description}</p>

            {group.allowed ? (
              <div className="rule-allowed">
                <strong>Currently allowed</strong>
                <ul>
                  {group.allowed.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {group.note ? <p className="rule-note">{group.note}</p> : null}
          </article>
        ))}
      </div>

      <p className="rule-reminder">When in doubt, ask an admin before using something.</p>
    </section>
  );
}
