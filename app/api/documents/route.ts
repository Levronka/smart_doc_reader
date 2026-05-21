import { NextRequest, NextResponse } from "next/server";
import { getDocuments } from "@/lib/db";
import { getCloudflareBindings } from "@/lib/cloudflare";

export const runtime = "nodejs";

interface CloudflareEnv {
  DB: D1Database;
}

export async function GET(request: NextRequest) {
  try {
    const env = getCloudflareBindings() as CloudflareEnv | undefined;
    const { searchParams } = new URL(request.url);

    const vendor = searchParams.get("vendor") || undefined;
    const date = searchParams.get("date") || undefined;

    const documents = await getDocuments(env?.DB, { vendor, date });

    return NextResponse.json({ documents: documents.results });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}
