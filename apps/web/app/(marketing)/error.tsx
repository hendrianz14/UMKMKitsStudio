"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[marketing-error]", error);
  return (
    <div className="container mx-auto py-10">
      <p className="text-sm text-red-400">Halaman gagal dimuat: {error.message}</p>
      <button onClick={() => reset()} className="mt-4 rounded-xl bg-card px-4 h-10 border border-border">Coba lagi</button>
    </div>
  );
}
