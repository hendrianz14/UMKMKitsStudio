# UMKM Kits Studio Monorepo

Monorepo untuk platform kreatif UMKM Kits Studio. Struktur ini terdiri atas aplikasi web Next.js modern untuk antarmuka pengguna dan Firebase Functions berbasis Express untuk API backend yang aman.

## Struktur Repo

```
/
├─ apps/web              # Next.js 15 UI dengan Tailwind & react-three-fiber
├─ services/functions    # Firebase Functions + Express API
├─ firebase              # Konfigurasi Firebase Hosting/Functions/Rules
├─ n8n                   # Workflow otomasi AI caption di n8n
├─ .github/workflows     # CI GitHub Actions
├─ .env.example          # Contoh env untuk UI
└─ pnpm-workspace.yaml   # Definisi workspace pnpm
```

## Prasyarat

- Node.js 20+
- pnpm 9+
- Firebase CLI (opsional untuk emulator/deploy)
- Vercel CLI (opsional untuk preview lokal)

## Menjalankan Secara Lokal

1. **Install dependensi**

   ```bash
   pnpm install
   ```

2. **Salin berkas environment**

   ```bash
   cp .env.example .env.local
   cp services/functions/.env.example services/functions/.env
   ```

   Sesuaikan nilai variabel sesuai kredensial Firebase, Midtrans, dan n8n Anda sebelum menjalankan produksi. Nilai contoh aman untuk build lokal.

3. **Jalankan UI Next.js**

   ```bash
   pnpm -C apps/web dev
   ```

   Aplikasi akan tersedia di `http://localhost:3000`. Landing page mendukung bahasa `id` (default) dan `en`.

4. **Jalankan Functions**

   Untuk pengembangan cepat, Anda dapat menjalankan server Express secara lokal:

   ```bash
   pnpm -C services/functions dev
   ```

   Endpoint kesehatan tersedia di `http://localhost:5001/api-health`.

   Untuk penggunaan Firebase Emulator atau deploy, jalankan perintah Firebase CLI seperti biasa setelah melakukan `firebase login` dan `firebase use`.

5. **Testing**

   ```bash
   pnpm test
   ```

   Menggunakan Vitest untuk menguji utilitas kritikal seperti Midtrans signature, kredit atomik, dan enkripsi.

## Deploy

1. Deploy UI ke Vercel dan set `NEXT_PUBLIC_API_BASE` mengarah ke domain Functions.
2. Deploy API ke Firebase Functions menggunakan `firebase deploy --only functions`.
3. Pastikan domain Vercel, staging, dan produksi masuk ke variabel `CORS_ALLOWED_ORIGINS`.
4. Verifikasi endpoint `GET /api-health` berjalan dan menampilkan status lingkungan.

## Catatan Tambahan

- Secrets dan webhook hanya di-backend. UI hanya berinteraksi lewat REST API.
- Guard environment disediakan lewat pengecekan variabel sebelum inisialisasi Firebase Admin/Client.
- Rate limiting berbasis token bucket in-memory tersedia dengan opsi Redis.
- Workflow n8n mencakup contoh job caption dan callback aman.

## Lisensi

Lihat [LICENSE](./LICENSE).
