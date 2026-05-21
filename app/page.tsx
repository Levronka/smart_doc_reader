"use client";

import { useState, useEffect, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import DocumentCard from "@/components/DocumentCard";

interface Document {
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

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterVendor, setFilterVendor] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterVendor) params.set("vendor", filterVendor);
      if (filterDate) params.set("date", filterDate);

      const res = await fetch(`/api/documents?${params}`);
      const data = (await res.json()) as { documents: Document[] };
      setDocuments(data.documents ?? []);
    } catch {
      console.error("Failed to fetch documents");
    } finally {
      setIsLoading(false);
    }
  }, [filterVendor, filterDate]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Upload Documents
        </h2>
        <UploadZone onUploadComplete={fetchDocuments} />
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          All Documents
        </h2>

        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Filter by vendor..."
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
            style={{ minWidth: "150px" }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 flex-1"
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {(filterVendor || filterDate) && (
            <button
              onClick={() => {
                setFilterVendor("");
                setFilterDate("");
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded-lg"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3 animate-spin">⏳</div>
            <p>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>No documents yet. Upload one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
