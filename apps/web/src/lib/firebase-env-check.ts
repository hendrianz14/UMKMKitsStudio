import { clientEnvFlags } from "@/lib/env-flags-client";

const CLIENT_FLAG_TO_ENV_KEY = {
  API_KEY: "NEXT_PUBLIC_FIREBASE_API_KEY",
  AUTH_DOMAIN: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  PROJECT_ID: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  STORAGE_BUCKET: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  APP_ID: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const satisfies Record<keyof ReturnType<typeof clientEnvFlags>, string>;

export type FirebaseEnvKey = (typeof CLIENT_FLAG_TO_ENV_KEY)[keyof typeof CLIENT_FLAG_TO_ENV_KEY];

export function collectMissingFirebaseEnvKeys(flags = clientEnvFlags()): FirebaseEnvKey[] {
  return Object.entries(flags)
    .filter(([, value]) => !value)
    .map(([key]) => CLIENT_FLAG_TO_ENV_KEY[key as keyof typeof CLIENT_FLAG_TO_ENV_KEY]);
}

export async function fetchMissingFirebaseEnvKeys(): Promise<FirebaseEnvKey[]> {
  try {
    const res = await fetch("/api/env-check", { cache: "no-store" });
    const json = await res.json();
    if (Array.isArray(json?.missing)) {
      return json.missing as FirebaseEnvKey[];
    }
    const flags = json?.flags ?? {};
    const missing: FirebaseEnvKey[] = [];
    if (!flags?.API_KEY) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (!flags?.AUTH_DOMAIN) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    if (!flags?.PROJECT_ID) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!flags?.STORAGE_BUCKET) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
    if (!flags?.APP_ID) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");
    return missing;
  } catch {
    return [];
  }
}
