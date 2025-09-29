import "server-only";

import { resolveMx } from "node:dns/promises";

export async function hasMx(domain: string): Promise<boolean> {
  if (!domain) return false;
  try {
    const records = await resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[mx] Failed to resolve MX for ${domain}`, error);
    }
    return false;
  }
}
