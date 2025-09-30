"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supaBrowser } from "@/lib/supabase-browser";

export default function UpdatePasswordClient() {
  const search = useSearchParams();
  const router = useRouter();
  const once = useRef(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (once.current) return;
    once.current = true;
  }, [search]);

  const submit = async () => {
    const sb = supaBrowser();
    setMsg("Menyimpan...");
    const { error } = await sb.auth.updateUser({ password });
    if (error) {
      setMsg(error.message || "Gagal menyimpan password");
      return;
    }
    setMsg("Berhasil. Mengarahkan...");
    router.replace("/login?reset=ok");
  };

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl font-semibold mb-3">Setel Ulang Password</h1>
      <input
        className="w-full border rounded p-2 mb-2 bg-transparent text-white"
        type="password"
        placeholder="Password baru"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button className="w-full rounded p-2 bg-blue-600 text-white" onClick={submit}>
        Simpan Password
      </button>
      <p className="text-sm mt-2">{msg}</p>
    </div>
  );
}
