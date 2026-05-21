"use client";

import { useState, useCallback } from "react";

interface UploadZoneProps {
  onUploadComplete: () => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    { message: string; id?: string }[]
  >([]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((f) =>
        ["image/jpeg", "image/png", "application/pdf"].includes(f.type),
      );

      if (validFiles.length === 0) {
        setUploadStatus([
          { message: "❌ No valid files. Please upload JPG, PNG, or PDF." },
        ]);
        return;
      }

      setIsUploading(true);
      setUploadStatus(
        validFiles.map((f) => ({ message: `⏳ Uploading ${f.name}...` })),
      );

      const formData = new FormData();
      validFiles.forEach((f) => formData.append("files", f));

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as {
          results?: {
            id?: string;
            filename: string;
            status?: string;
            error?: string;
          }[];
          error?: string;
        };

        if (!res.ok) {
          setUploadStatus([
            {
              message: `❌ ${data.error ?? "Upload failed. Please try again."}`,
            },
          ]);
          return;
        }

        const results = data.results ?? [];

        setUploadStatus(
          results.map((r) =>
            r.status === "done"
              ? { message: `✅ ${r.filename} processed`, id: r.id }
              : {
                  message: `❌ ${r.filename} failed${r.error ? `: ${r.error}` : ""}`,
                  id: r.id,
                },
          ),
        );

        onUploadComplete();
      } catch {
        setUploadStatus([{ message: "❌ Upload failed. Please try again." }]);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <div className="text-4xl mb-3">📄</div>
        <p className="text-gray-600 font-medium">
          Drag & drop files here, or{" "}
          <span className="text-blue-500">browse</span>
        </p>
        <p className="text-gray-400 text-sm mt-1">Supports JPG, PNG, PDF</p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Status */}
      {uploadStatus.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadStatus.map((status, i) => (
            <div key={i} className="text-sm p-3 bg-gray-50 rounded-lg border">
              {isUploading && status.message.startsWith("⏳") ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {status.message.replace("⏳ ", "")}
                </span>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span>{status.message}</span>
                  {status.id && !isUploading && (
                    <a
                      href={`/documents/${status.id}`}
                      className="text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Lihat detail
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
