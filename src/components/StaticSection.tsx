import type { ReactNode } from "react";

type Props = {
  id: string;
  icon: ReactNode;
  title: string;
  items: string[];
};

export function StaticSection({ id, icon, title, items }: Props) {
  return (
    <section className="content-section compact-section" id={id} aria-labelledby={`${id}-title`}>
      <div className="section-heading">
        <div className="heading-with-icon">
          {icon}
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
      </div>
      <ul className="plain-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
