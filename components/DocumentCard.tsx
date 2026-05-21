import Link from "next/link";

interface DocumentCardProps {
  doc: {
    id: string;
    filename: string;
    vendor_name: string | null;
    date: string | null;
    total: number | null;
    currency: string | null;
    status: string;
    is_reviewed: number;
    created_at: string;
  };
}

export default function DocumentCard({ doc }: DocumentCardProps) {
  const statusColor =
    {
      done: "bg-green-100 text-green-700",
      processing: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
      pending: "bg-gray-100 text-gray-700",
    }[doc.status] ?? "bg-gray-100 text-gray-700";

  return (
    <Link href={`/documents/${doc.id}`}>
      <div className="border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer bg-white hover:border-blue-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">
              {doc.filename.endsWith(".pdf") ? "📋" : "🖼️"}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-gray-800 truncate">
                {doc.filename}
              </p>
              <p className="text-sm text-gray-400">
                {new Date(doc.created_at).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}
            >
              {doc.status}
            </span>
            {doc.is_reviewed === 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                ✓ reviewed
              </span>
            )}
          </div>
        </div>

        {doc.status === "done" && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Vendor</p>
              <p className="font-medium truncate">{doc.vendor_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Date</p>
              <p className="font-medium">{doc.date ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total</p>
              <p className="font-medium text-blue-600">
                {doc.total
                  ? `${doc.currency ?? ""} ${doc.total.toLocaleString()}`
                  : "—"}
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-blue-600 font-medium">Lihat detail →</span>
          <span className="text-gray-400">Buka dokumen</span>
        </div>

        {doc.status === "failed" && (
          <p className="mt-2 text-xs text-red-500">
            ⚠ Extraction failed — click to review manually
          </p>
        )}
      </div>
    </Link>
  );
}
