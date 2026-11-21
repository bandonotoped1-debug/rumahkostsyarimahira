# Web Rumah Kost Syari Mahira

## Isi folder
- `index.html` : halaman publik (profil, fasilitas, kamar, kalkulator harga, galeri, aturan, FAQ, formulir survei, kontak, chatbot)
- `admin.html` : panel admin (buka lewat tautan "Masuk Admin" di bagian bawah halaman)
- `assets/` : tampilan (CSS) dan program (JavaScript)
- `netlify/functions/` : bagian server untuk menyimpan data dan menjalankan chatbot AI

## Mencoba di komputer
Klik dua kali `index.html`. Web langsung jalan dalam **mode coba**:
- Sandi admin mode coba: `mahira2026`
- Perubahan dari admin hanya tersimpan di browser yang dipakai.
- Chatbot memakai penjawab sederhana bawaan (tanpa AI).

## Setelah dipasang di Netlify
1. Atur **Environment variables** di Netlify:
   - `ADMIN_PASSWORD` : sandi admin pilihan Anda
   - `ANTHROPIC_API_KEY` : kunci AI dari console.anthropic.com (opsional; tanpa ini chatbot tetap jalan dengan penjawab sederhana)
2. Semua perubahan dari admin tersimpan di server dan langsung terlihat oleh semua pengunjung.
3. Formulir "Jadwalkan Kunjungan" masuk ke menu **Pengunjung** di admin.

## Foto & video dari Google Drive
Di Drive: klik kanan file > Bagikan > "Siapa saja yang memiliki link" > Salin link. Tempel di menu **Foto & Video** di admin. Gunakan link per file, bukan link folder.

## Hal yang masih perlu diganti
Alamat, nomor WhatsApp, email, dan link Google Maps (menu **Profil Kost** di admin).
