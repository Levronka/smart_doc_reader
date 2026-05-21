import { NextRequest, NextResponse } from "next/server";
import { getDocuments } from "@/lib/db";
import { getCloudflareBindings } from "@/lib/cloudflare";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

interface CloudflareEnv {
  DB: D1Database;
}

interface ExportDocumentRow {
  id: string;
  filename: string;
  vendor_name: string | null;
  date: string | null;
  total: number | null;
  currency: string | null;
  status: string;
  is_reviewed: number;
  created_at: string;
}

function toSafeString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function escapeCsvCell(value: unknown) {
  return `"${toSafeString(value).replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const env = getCloudflareBindings() as CloudflareEnv | undefined;
    const documents = await getDocuments(env?.DB);
    const format =
      new URL(request.url).searchParams.get("format")?.toLowerCase() ?? "csv";

    // Buat CSV
    const headers = [
      "ID",
      "Filename",
      "Vendor",
      "Date",
      "Total",
      "Currency",
      "Status",
      "Reviewed",
      "Created At",
    ];
    const rows = (documents.results as ExportDocumentRow[]).map((doc) => [
      doc.id,
      doc.filename,
      doc.vendor_name ?? "",
      doc.date ?? "",
      doc.total ?? "",
      doc.currency ?? "",
      doc.status,
      doc.is_reviewed ? "Yes" : "No",
      doc.created_at,
    ]);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No documents available for export. Upload a file and open its detail first.",
        },
        { status: 400 },
      );
    }

    if (format === "xlsx") {
      const sheetRows = [headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");
      const buffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="documents-${Date.now()}.xlsx"`,
        },
      });
    }

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="documents-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
