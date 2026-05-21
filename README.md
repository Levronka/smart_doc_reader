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
