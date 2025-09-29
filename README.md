# UMKM Kits Studio Monorepo

Monorepo untuk platform kreatif UMKM Kits Studio. Struktur ini terdiri atas aplikasi web Next.js modern untuk antarmuka pengguna dan layanan backend yang terintegrasi dengan Supabase.

## Struktur Repo

```
/
├─ apps/web              # Next.js 15 UI dengan Tailwind & react-three-fiber
├─ n8n                   # Workflow otomasi AI caption di n8n
├─ .github/workflows     # CI GitHub Actions
├─ .env.example          # Contoh env untuk UI
└─ pnpm-workspace.yaml   # Definisi workspace pnpm
```

## Prasyarat

- Node.js 20+
- pnpm 9+
- Supabase CLI (opsional untuk pengelolaan Edge Function/Storage)
- Vercel CLI (opsional untuk preview lokal)

## Menjalankan Secara Lokal

1. **Install dependensi**

   ```bash
   pnpm install
   ```

2. **Salin dan isi berkas environment**

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

   Buka `apps/web/.env.local` kemudian isi seluruh variabel dengan kredensial Supabase, SMTP, dan URL aplikasi Anda sebelum menjalankan secara lokal maupun produksi.

3. **Buat tabel OTP di Supabase**

   Jalankan isi dari `apps/web/supabase.sql` di Supabase SQL Editor agar tabel `email_otps` tersedia.

4. **Jalankan UI Next.js**

   ```bash
   pnpm -C apps/web install && pnpm -C apps/web dev
   ```

   Aplikasi akan tersedia di `http://localhost:3000`. Landing page mendukung bahasa `id` (default) dan `en`.

5. **Testing**

   ```bash
   pnpm test
   ```

   Menggunakan Vitest untuk menguji utilitas kritikal seperti Midtrans signature, kredit atomik, dan enkripsi.

## Deploy

1. Deploy UI ke Vercel dan set `NEXT_PUBLIC_API_BASE` mengarah ke layanan backend Anda.
2. Kelola storage, auth, dan edge functions melalui Supabase Project yang terhubung.
3. Pastikan domain Vercel, staging, dan produksi masuk ke variabel `CORS_ALLOWED_ORIGINS`.
4. Verifikasi endpoint `GET /api-health` berjalan dan menampilkan status lingkungan.

## Catatan Tambahan

- Secrets dan webhook hanya di-backend. UI hanya berinteraksi lewat REST API.
- Guard environment disediakan lewat pengecekan variabel sebelum inisialisasi klien Supabase.
- Rate limiting berbasis token bucket in-memory tersedia dengan opsi Redis.
- Workflow n8n mencakup contoh job caption dan callback aman.

## Lisensi

Lihat [LICENSE](./LICENSE).
