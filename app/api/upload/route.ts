import { NextRequest, NextResponse } from "next/server";
import { createDocument, updateDocumentStatus } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import { extractDocument } from "@/lib/openrouter";
import { createExtraction } from "@/lib/db";
import { getCloudflareBindings } from "@/lib/cloudflare";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

interface CloudflareEnv {
  DB: D1Database;
  R2: R2Bucket;
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export async function POST(request: NextRequest) {
  try {
    const env = getCloudflareBindings() as CloudflareEnv | undefined;

    const formData = await request.formData();
    const files = formData.getAll("files") as unknown as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      // Validasi tipe file
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        results.push({ filename: file.name, error: "File type not supported" });
        continue;
      }

      // Upload ke R2
      const fileKey = `${uuidv4()}-${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      await uploadToR2(env?.R2, fileKey, arrayBuffer, file.type);

      // Simpan dokumen ke D1
      const docId = await createDocument(env?.DB, {
        filename: file.name,
        file_url: fileKey,
        file_type: file.type.startsWith("image/") ? "image" : "pdf",
        status: "processing",
      });

      // Konversi ke base64 untuk dikirim ke OpenRouter
      const base64 = arrayBufferToBase64(arrayBuffer);

      try {
        // Ekstraksi via Vision LLM
        const aiResult = await extractDocument(base64, file.type);

        // Simpan hasil ekstraksi ke D1
        await createExtraction(env?.DB, docId, aiResult);
        await updateDocumentStatus(env?.DB, docId, "done");

        results.push({ id: docId, filename: file.name, status: "done" });
      } catch (extractError) {
        await updateDocumentStatus(env?.DB, docId, "failed");
        results.push({
          id: docId,
          filename: file.name,
          status: "failed",
          error:
            extractError instanceof Error
              ? extractError.message
              : "Extraction failed",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
