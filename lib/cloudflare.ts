import { getOptionalRequestContext } from "@cloudflare/next-on-pages";

export interface CloudflareBindings {
  DB?: D1Database;
  R2?: R2Bucket;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
}

export function getCloudflareBindings() {
  try {
    const context = getOptionalRequestContext<
      IncomingRequestCfProperties,
      ExecutionContext
    >();

    return context?.env as CloudflareBindings | undefined;
  } catch {
    return undefined;
  }
}
