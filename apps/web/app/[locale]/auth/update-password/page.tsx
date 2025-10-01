import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import UpdatePasswordClient from "./UpdatePasswordClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-sm opacity-70">Membuka…</div>
        </div>
      }
    >
      <UpdatePasswordClient />
    </Suspense>
  );
}
