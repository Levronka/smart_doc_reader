This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# smart_doc_reader

## Cloudflare / OpenNext Deployment Checklist

This project is configured to deploy to Cloudflare Workers using OpenNext. Before deploying, verify the items below.

- **Secrets (required):** Set `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`) in the Cloudflare Workers runtime (Workers Dashboard or via `wrangler secret put`). Do NOT keep production secrets in `.env.local` — rotate and remove the key currently in `.env.local`.
- **Bindings (required):** Ensure the D1 and R2 bindings declared in `wrangler.jsonc` exist in your Cloudflare account and their names match the config.
- **Worker name / services:** Confirm the `name` in `wrangler.jsonc` matches the worker/service referenced by CI (example: `smartdocreader`). If you see service binding errors, either create the named worker first or update `wrangler.jsonc` to match your account.
- **Build & post-build (CI/local):**
  - Install dependencies: `npm install`
  - Build Next: `npm run build` (this produces `.next`)
  - Ensure the OpenNext postbuild step runs to produce `.open-next/worker.js` (the repo includes a `postbuild` script that runs OpenNext). You can run it manually with `npm run postbuild`.
  - Deploy with Wrangler: `npx wrangler deploy` (or your CI pipeline that runs OpenNext/Workers Builds).
- **Artifacts:** After a successful build the `.open-next/worker.js` and compiled OpenNext files must exist — Wrangler/OpenNext requires these to deploy the Worker bundle.
- **Runtime checks / troubleshooting:**
  - Extraction fails with "OPENROUTER_API_KEY is missing": add the secret to the Cloudflare runtime.
  - Preview image not showing: confirm the document row `file_url` is set and that `GET /api/file/[key]` returns `200` with the correct `Content-Type`.
  - SQLITE_BUSY or build-time DB lock: retry in CI or avoid concurrent OpenNext build steps that access the local SQLite file.

## Quick Commands

```bash
npm install
npm run build
# (optional) run postbuild if you need to compile OpenNext manually:
npm run postbuild
npx wrangler deploy
```

## Security note

- Immediately rotate and remove any sensitive keys found in `.env.local`. Use Cloudflare secrets for runtime values instead of committing them to files.

If you want, I can also add a short `deploy.md` with step-by-step CI instructions and example `wrangler` commands.

## Ringkasan OCR / AI (singkat)

- **Stack:** Next.js (App Router), TypeScript, Cloudflare Workers (OpenNext), D1 (SQLite), R2 (object storage), OpenRouter (vision/LLM API). UI menggunakan React + minimal server routes under `app/api`.
- **Pendekatan OCR/AI:** gambar diunggah ke R2, file di-encode dan dikirim ke OpenRouter vision endpoint untuk ekstraksi teks/struktur; hasil AI disimpan di D1 sebagai `extraction` dan dipakai untuk menampilkan dan mengedit hasil di UI.
- **Alasan pendekatan:** menggunakan OpenRouter (cloud API) untuk memanfaatkan model vision + LLM tanpa menjalankan beratnya model lokal; R2/D1 dipilih karena integrasi native dengan Cloudflare Workers dan biaya rendah untuk prototyping.

## Asumsi yang Diambil

- Pipeline mengandalkan ketersediaan `OPENROUTER_API_KEY` sebagai secret runtime (tidak disimpan di repo).
- Dokumen utama bersifat gambar atau PDF yang dapat di-preview melalui endpoint `GET /api/file/[key]`.
- Akurasi model vision/LLM tidak sempurna; UI harus memungkinkan verifikasi dan koreksi manual.

## AI Workflow Log (tools / agent)

- **Tool / Agent yang dipakai:**
  - `OpenRouter` – model vision + LLM, dipanggil dari `lib/openrouter.ts` untuk ekstraksi teks dan struktur.
  - `@opennextjs/cloudflare` (OpenNext) – untuk bundling Next.js ke Cloudflare Workers.
  - `D1` & `R2` – penyimpanan ekstraksi dan file.
  - `LocalStore` (fallback) – saat pengembangan tanpa Cloudflare.
- **Peran singkat:**
  - Upload: `app/api/upload/route.ts` menyimpan file ke R2, membuat row dokumen di D1, memanggil OpenRouter untuk ekstraksi dan menyimpan hasil.
  - Preview: `app/api/file/[key]/route.ts` menyajikan object R2 ke browser.
  - Admin/UI: halaman detail memungkinkan edit hasil ekstraksi.
- **Prompt kunci (contoh, akan dibahas saat interview):**
  - "Baca gambar ini dan ekstrak semua field berikut: [judul, tanggal, jumlah, baris item — format JSON yang mudah di-parse]. Berikan jawaban sebagai objek JSON dengan key kebih jelas, tanpa tambahan narasi."
  - Catatan: prompt final disesuaikan di `lib/openrouter.ts` dan membutuhkan iterasi bersama tim saat interview.

## Menangani Akurasi Rendah

- Tampilkan hasil AI sebagai draft yang mudah diubah oleh pengguna (UI edit + simpan).
- Simpan confidence/metadata dari model bila tersedia, tampilkan tag confidence untuk memprioritaskan verifikasi manual.
- Terapkan fallback sederhana: bila confidence rendah, tunjukkan preview crop gambar pada bagian yang relevan untuk memudahkan user verifikasi.
- Catat koreksi pengguna untuk membuat dataset kecil yang dapat dipakai untuk memperbaiki prompt atau melatih pemrosesan pasca-model (rule-based post-processing).

## Jika Waktu Diperbanyak 2x — Rencana Perbaikan

- Integrasi pipeline retraining / feedback loop: kumpulkan koreksi user, buat dataset terstruktur, dan gunakan fine-tuning atau prompt engineering yang sistematis.
- Tambah pre-processing gambar: rotation correction, denoising, deskewing, konversi halaman PDF ke gambar berkualitas tinggi.
- Ganti atau augment model vision dengan layanan khusus OCR (mis. Cloud Vision, Tesseract hybrid) untuk kasus tabel/format kompleks.
- Tambah end-to-end tests dan metrik akurasi otomatis; dashboard feedback untuk melihat distribusi error dan prioritas perbaikan.

---

Jika Anda ingin, saya bisa memecah bagian tersebut ke `docs/ai.md` dan membuat `deploy.md` berisi contoh CI/CD (wrangler + opennext) langkah-demi-langkah.
