import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Document Reader",
  description: "AI-powered receipt and invoice extractor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <span className="font-bold text-gray-800">Smart Doc Reader</span>
          </div>
          <a
            href="/api/export"
            className={
              "text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            }
          >
            {"⬇ Export CSV"}
          </a>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
