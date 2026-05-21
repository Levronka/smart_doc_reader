"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ExtractionForm from "@/components/ExtractionForm";
import Link from "next/link";
import Image from "next/image";

interface DocumentDetail {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  status: string;
  created_at: string;
}

interface ExtractionDetail {
  id: string;
  vendor_name: string | null;
  vendor_conf: number | null;
  date: string | null;
  date_conf: number | null;
  total: number | null;
  total_conf: number | null;
  currency: string | null;
  currency_conf: number | null;
  is_reviewed: number;
  raw_json: string | null;
  line_items: {
    id: string;
    name: string | null;
    quantity: number | null;
    unit_price: number | null;
    subtotal: number | null;
    conf: number | null;
  }[];
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [extraction, setExtraction] = useState<ExtractionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/documents/${params.id}`);
        const data = (await res.json()) as {
          document: DocumentDetail;
          extraction: ExtractionDetail;
        };
        setDocument(data.document);
        setExtraction(data.extraction);
      } catch {
        console.error("Failed to fetch document detail");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-4 animate-spin">⏳</div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-4">❌</div>
        <p>Document not found.</p>
        <Link
          href="/"
          className="text-blue-500 hover:underline mt-2 inline-block"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {document.filename}
          </h1>
          <p className="text-sm text-gray-400">
            Uploaded {new Date(document.created_at).toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Document Preview
          </h2>
          {document.file_type === "image" ? (
            <Image
              src={`/api/file/${document.file_url}`}
              alt={document.filename}
              width={1200}
              height={900}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-auto w-full max-h-96 rounded-lg border object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-2">📋</div>
                <p className="text-sm">PDF Preview</p>
                <a
                  href={`/api/file/${document.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  Open PDF
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Extracted Data
            {document.status === "failed" && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                Extraction Failed
              </span>
            )}
          </h2>

          {extraction ? (
            <ExtractionForm documentId={document.id} extraction={extraction} />
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No extraction data available.</p>
              <p className="text-sm mt-1">
                The document may still be processing or extraction failed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
