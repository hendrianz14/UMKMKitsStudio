export function clientEnvFlags() {
  return {
    API_KEY: typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "string",
    AUTH_DOMAIN: typeof process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN === "string",
    PROJECT_ID: typeof process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "string",
    STORAGE_BUCKET: typeof process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET === "string",
    APP_ID: typeof process.env.NEXT_PUBLIC_FIREBASE_APP_ID === "string",
  };
}
