import type { NewsItem, Startup, TechEvent } from "@/types";
import { isActivelyHiring } from "@/utils/hiring";

export type DayPart = "morning" | "midday" | "evening" | "late";

export function hydHour() {
  return Number(new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date()));
}

export function dayPart(hour = hydHour()): DayPart {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "midday";
  if (hour >= 16 && hour < 20) return "evening";
  return "late";
}

export function timingCopy(input: {
  startups: Startup[];
  events: TechEvent[];
  news: NewsItem[];
  hour?: number;
}) {
  const hour = input.hour ?? hydHour();
  const part = dayPart(hour);
  const hiring = input.startups.filter(isActivelyHiring);
  const boosted = input.startups.filter((item) => item.isBoosted);
  const clock = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  if (part === "morning") {
    return {
      part,
      clock,
      kicker: `${clock} IST · morning commute`,
      title: "Corridors are warming up. Check careers before standup.",
      picks: (boosted.length ? boosted : hiring).slice(0, 3),
    };
  }
  if (part === "midday") {
    return {
      part,
      clock,
      kicker: `${clock} IST · midday`,
      title: input.news[0]
        ? `Press is moving — ${input.news[0].source} is the latest Hyd brief.`
        : "Browse live careers while teams are online.",
      picks: hiring.slice(0, 3),
    };
  }
  if (part === "evening") {
    const tonight = input.events[0];
    return {
      part,
      clock,
      kicker: `${clock} IST · evening`,
      title: tonight
        ? `After work: ${tonight.title} · ${tonight.date}`
        : "Events are thin tonight — save a company and come back.",
      picks: hiring.slice(0, 3),
    };
  }
  return {
    part,
    clock,
    kicker: `${clock} IST · after dark`,
    title: "Night mode is for late builders. After-dark spots sit on the map.",
    picks: hiring.slice(0, 3),
  };
}
