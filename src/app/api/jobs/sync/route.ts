import { NextResponse } from "next/server";
import startupsSeed from "@/data/startups.json";
import type { Startup } from "@/types";
import { fetchJobsForCompany, listSyncableCompanyIds } from "@/utils/jobSync";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    syncable: listSyncableCompanyIds(),
    note: "POST { companyId } or { companyId: \"all\" } to sync open roles from ATS/careers feeds.",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { companyId?: string };
    const companyId = body.companyId?.trim();
    if (!companyId) {
      return NextResponse.json({ error: "companyId is required" }, { status: 400 });
    }

    const startups = startupsSeed as Startup[];
    const targets = companyId === "all"
      ? startups.filter((item) => listSyncableCompanyIds().includes(item.id))
      : startups.filter((item) => item.id === companyId);

    if (targets.length === 0) {
      return NextResponse.json({ error: "No syncable company found" }, { status: 404 });
    }

    const results = [];
    for (const company of targets) {
      try {
        const { jobs, source } = await fetchJobsForCompany(company);
        results.push({
          companyId: company.id,
          companyName: company.name,
          count: jobs.length,
          source,
          jobs,
          ok: true,
        });
      } catch (error) {
        results.push({
          companyId: company.id,
          companyName: company.name,
          count: 0,
          source: "error",
          jobs: [],
          ok: false,
          error: error instanceof Error ? error.message : "Sync failed",
        });
      }
    }

    return NextResponse.json({
      syncedAt: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Invalid request",
    }, { status: 500 });
  }
}
