"use client";

import { useState } from "react";
import ConfidenceTag from "./ConfidenceTag";

interface LineItem {
  id: string;
  name: string | null;
  quantity: number | null;
  unit_price: number | null;
  subtotal: number | null;
  conf: number | null;
}

interface ExtractionData {
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
  line_items: LineItem[];
}

interface ExtractionFormProps {
  documentId: string;
  extraction: ExtractionData;
}

export default function ExtractionForm({
  documentId,
  extraction,
}: ExtractionFormProps) {
  const [form, setForm] = useState({
    vendor_name: extraction.vendor_name ?? "",
    date: extraction.date ?? "",
    total: extraction.total?.toString() ?? "",
    currency: extraction.currency ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(extraction.is_reviewed === 1);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraction_id: extraction.id,
          ...form,
          total: parseFloat(form.total) || null,
        }),
      });
      setSaved(true);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const fields = [
    {
      label: "Vendor / Merchant",
      key: "vendor_name",
      conf: extraction.vendor_conf,
      type: "text",
    },
    {
      label: "Date",
      key: "date",
      conf: extraction.date_conf,
      type: "date",
    },
    {
      label: "Total",
      key: "total",
      conf: extraction.total_conf,
      type: "number",
    },
    {
      label: "Currency",
      key: "currency",
      conf: extraction.currency_conf,
      type: "text",
    },
  ] as const;

  return (
    <div className="space-y-6">
      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ This document has been reviewed and saved.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(({ label, key, conf, type }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-gray-700">
                {label}
              </label>
              <ConfidenceTag confidence={conf} />
            </div>
            <input
              type={type}
              value={form[key]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300
                ${
                  conf !== null && conf < 0.7
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
            />
          </div>
        ))}
      </div>

      {/* Line Items */}
      {extraction.line_items?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Line Items</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500">Item</th>
                  <th className="text-right px-3 py-2 text-gray-500">Qty</th>
                  <th className="text-right px-3 py-2 text-gray-500">
                    Unit Price
                  </th>
                  <th className="text-right px-3 py-2 text-gray-500">
                    Subtotal
                  </th>
                  <th className="text-center px-3 py-2 text-gray-500">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {extraction.line_items.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.conf !== null && item.conf < 0.7 ? "bg-red-50" : ""
                    }
                  >
                    <td className="px-3 py-2">{item.name ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {item.quantity ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.unit_price ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.subtotal ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <ConfidenceTag confidence={item.conf} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
      >
        {isSaving ? "Saving..." : "Save & Mark as Reviewed"}
      </button>
    </div>
  );
}
