import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface CloudflareBindings {
  DB?: D1Database;
  R2?: R2Bucket;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
}

export function getCloudflareBindings() {
  try {
    return getCloudflareContext().env as CloudflareBindings | undefined;
  } catch {
    return undefined;
  }
}
