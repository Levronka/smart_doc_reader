import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentById,
  getExtractionByDocumentId,
  updateExtraction,
} from "@/lib/db";
import { getCloudflareBindings } from "@/lib/cloudflare";

export const runtime = "nodejs";

interface CloudflareEnv {
  DB: D1Database;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const env = getCloudflareBindings() as CloudflareEnv | undefined;
    const document = await getDocumentById(env?.DB, params.id);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const extraction = await getExtractionByDocumentId(env?.DB, params.id);

    return NextResponse.json({ document, extraction });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const env = getCloudflareBindings() as CloudflareEnv | undefined;
    const body = (await request.json()) as {
      extraction_id: string;
      vendor_name: string;
      date: string;
      total: number;
      currency: string;
    };
    const { extraction_id, vendor_name, date, total, currency } = body;

    if (!extraction_id) {
      return NextResponse.json(
        { error: "extraction_id is required" },
        { status: 400 },
      );
    }

    await updateExtraction(env?.DB, extraction_id, {
      vendor_name,
      date,
      total,
      currency,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}
