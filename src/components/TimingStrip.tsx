"use client";

import { Clock3, Sparkles, Zap } from "lucide-react";
import type { Startup } from "@/types";
import type { RoleIntent } from "@/utils/intent";

type Timing = {
  kicker: string;
  title: string;
  picks: Startup[];
};

type Props = {
  timing: Timing;
  intent: RoleIntent | null;
  matches: Startup[];
  onSelect: (startup: Startup) => void;
  onHireSprint: () => void;
};

export default function TimingStrip({ timing, intent, matches, onSelect, onHireSprint }: Props) {
  const picks = intent && matches.length ? matches : timing.picks;
  return (
    <section className="timing-strip">
      <div className="timing-copy">
        <span className="eyebrow"><Clock3 size={11} /> {intent ? intent.headline : timing.kicker}</span>
        <strong>{intent ? intent.hint : timing.title}</strong>
      </div>
      <div className="timing-picks">
        {picks.map((startup) => (
          <button key={startup.id} type="button" onClick={() => onSelect(startup)}>
            <b>{startup.name}</b>
            <small>{startup.isBoosted ? "Looking now" : startup.location.area}</small>
          </button>
        ))}
      </div>
      <button type="button" className="timing-sprint" onClick={onHireSprint}>
        {intent ? <Sparkles size={13} /> : <Zap size={13} />}
        Hire sprint
      </button>
    </section>
  );
}
