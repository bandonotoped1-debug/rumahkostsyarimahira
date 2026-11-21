# Web Rumah Kost Syari Mahira

## Isi folder
- `index.html` : halaman publik (profil, fasilitas, kamar, kalkulator harga, galeri, aturan, FAQ, formulir survei, kontak, chatbot)
- `admin.html` : panel admin (buka lewat tautan "Masuk Admin" di bagian bawah halaman, atau alamat-web/admin.html)
- `assets/` : tampilan (CSS) dan program (JavaScript)
- `api/` dan `lib/` : bagian server di Vercel untuk menyimpan data dan menjalankan chatbot AI

## Mencoba di komputer
Klik dua kali `index.html`. Web langsung jalan dalam **mode coba**:
- Sandi admin mode coba: `mahira2026`
- Perubahan dari admin hanya tersimpan di browser yang dipakai.
- Chatbot memakai penjawab sederhana bawaan (tanpa AI).

## Memasang di Vercel
1. Masuk ke https://vercel.com/new dengan akun GitHub, pilih repository `rumahkostsyarimahira`, klik **Import**.
   Framework Preset: **Other**. Tidak perlu mengubah pengaturan build. Klik **Deploy**.
2. Pasang database untuk menyimpan perubahan admin:
   buka proyek di Vercel > tab **Storage** > **Create Database** > pilih **Upstash (Redis)** > ikuti langkahnya (paket gratis cukup) > hubungkan ke proyek ini.
3. Buka **Settings > Environment Variables**, tambahkan:
   - `ADMIN_PASSWORD` : sandi admin pilihan Anda
   - `ANTHROPIC_API_KEY` : kunci AI dari https://console.anthropic.com (opsional; tanpa ini chatbot tetap jalan dengan penjawab sederhana)
4. Buka tab **Deployments**, klik titik tiga di deployment teratas > **Redeploy**, agar pengaturan baru terpakai.

Setelah itu semua perubahan dari admin tersimpan di database dan langsung terlihat oleh semua pengunjung, dan formulir "Jadwalkan Kunjungan" masuk ke menu **Pengunjung** di admin.
Setiap perubahan kode yang diunggah ke GitHub akan otomatis tayang di Vercel.

## Foto & video dari Google Drive
Di Drive: klik kanan file > Bagikan > "Siapa saja yang memiliki link" > Salin link. Tempel di menu **Foto & Video** di admin. Gunakan link per file, bukan link folder.

## Hal yang masih perlu diganti
Alamat, nomor WhatsApp, email, dan link Google Maps (menu **Profil Kost** di admin).
