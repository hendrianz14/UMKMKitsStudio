# UMKM Kits Studio Monorepo

Monorepo untuk platform kreatif UMKM Kits Studio. Saat ini fokus pada aplikasi web Next.js modern dengan autentikasi email OTP berbasis Supabase (Auth + Postgres).

## Struktur Repo

```
/
├─ apps/web              # Next.js 15 UI dengan Tailwind & react-three-fiber
├─ services/functions    # (Legacy) Firebase Functions + Express API
├─ firebase              # (Legacy) Konfigurasi Firebase Hosting/Functions/Rules
├─ n8n                   # Workflow otomasi AI caption di n8n
├─ .github/workflows     # CI GitHub Actions
├─ .env.example          # Contoh env untuk UI
└─ pnpm-workspace.yaml   # Definisi workspace pnpm
```

## Prasyarat

- Node.js 20+
- pnpm 9+


## Menjalankan Secara Lokal

1. **Install dependensi UI**

   ```bash
   pnpm -C apps/web install
   ```

2. **Konfigurasi environment Next.js**

   Edit `apps/web/.env.local` dan isi nilai berikut:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...        # URL proyek Supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # anon/public key Supabase
   SUPABASE_SERVICE_ROLE_KEY=...       # service role key (server only)
   APP_URL=http://localhost:3000       # URL aplikasi lokal
   SESSION_SECRET=change_me_long_random # minimal 32 karakter acak
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASS=...
   EMAIL_FROM="UMKM MINI Studio <no-reply@domain.com>"
   ```

3. **Siapkan database Supabase**

   Buka [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new), salin isi `apps/web/supabase.sql`, lalu jalankan untuk membuat tabel `email_otps`.

4. **Jalankan UI Next.js**

   ```bash
   pnpm -C apps/web dev
   ```

   Aplikasi akan tersedia di `http://localhost:3000`.

## Uji Cepat

1. Buka `http://localhost:3000/login` dan masukkan email kerja Anda.
2. Klik **Kirim Kode** untuk meminta OTP (cek inbox/spam jika menggunakan SMTP nyata).
3. Setelah diarahkan ke `/otp`, masukkan kode 6 digit yang diterima lalu klik **Verifikasi**.
4. Jika berhasil, Anda akan diarahkan ke `/dashboard` dan sesi login tersimpan di cookie.

## Deploy

1. Deploy UI (mis. Vercel) dan set environment seperti pada `.env.local`.
2. Simpan `SUPABASE_SERVICE_ROLE_KEY` hanya pada variabel server-side (mis. `NEXT_PUBLIC_` **tidak** digunakan).
3. Pastikan SMTP siap mengirim email OTP dan domain pengirim telah diverifikasi.
4. Jalankan ulang skrip `apps/web/supabase.sql` di Supabase jika memulai proyek baru.

## Catatan Tambahan

- Otentikasi menggunakan Supabase Postgres sehingga tidak ada dependensi Firebase pada UI.
- Cookie sesi ditandatangani dengan HMAC dan berlaku 7 hari.
- Domain email disposable diblokir dan MX record diverifikasi sebelum OTP dikirim.
- Workflow n8n tetap tersedia untuk otomasi caption namun terpisah dari alur login.

## Lisensi

Lihat [LICENSE](./LICENSE).
