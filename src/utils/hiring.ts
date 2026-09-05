import type { Startup } from "@/types";

export function isActivelyHiring(startup: Startup) {
  return Boolean(startup.hiring.careersUrl && (startup.hiring.isHiring || startup.hiring.jobs.length > 0));
}

/** Synced ATS roles, or 1 if the company only publishes a live careers page. */
export function hiringSignal(startup: Startup) {
  if (startup.hiring.jobs.length) return startup.hiring.jobs.length;
  return isActivelyHiring(startup) ? 1 : 0;
}

export function hiringStats(startups: Startup[]) {
  const roles = startups.reduce((sum, item) => sum + item.hiring.jobs.length, 0);
  const boards = startups.filter(isActivelyHiring).length;
  return {
    roles,
    boards,
    jobs: roles || boards,
    label: roles ? "roles" : "hiring",
  };
}
