import { NextRequest, NextResponse } from "next/server";
import { getFromR2 } from "@/lib/r2";
import { getCloudflareBindings } from "@/lib/cloudflare";

export const runtime = "nodejs";

interface CloudflareEnv {
  R2: R2Bucket;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    const env = getCloudflareBindings() as CloudflareEnv | undefined;
    const object = await getFromR2(env?.R2, key);

    if (!object) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType ?? "application/octet-stream",
    );
    headers.set("Cache-Control", "public, max-age=31536000");

    if (object.body instanceof ReadableStream) {
      return new NextResponse(object.body, { headers });
    }

    const arrayBuffer = Uint8Array.from(object.body).buffer;
    return new NextResponse(arrayBuffer, { headers });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 },
    );
  }
}
