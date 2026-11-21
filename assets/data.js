/* ==========================================================
   Data bawaan + penyimpanan untuk web Rumah Kost Syari Mahira
   ----------------------------------------------------------
   - Jika web dipasang di Netlify (dengan folder netlify/functions),
     data disimpan di server sehingga semua pengunjung melihat
     perubahan yang dibuat admin.
   - Jika dibuka langsung dari komputer (tanpa server), data
     disimpan di browser ini saja (localStorage).
   ========================================================== */

const DATA_BAWAAN = {
  profil: {
    nama: "Rumah Kost Syari Mahira",
    tagline: "Hunian nyaman, aman, dan islami untuk pelajar, mahasiswa, dan keluarga",
    deskripsi:
      "Rumah Kost Syari Mahira adalah hunian dengan suasana islami yang tenang dan bersih. " +
      "Kami menyediakan 2 bangunan terpisah, masing-masing dilengkapi 2 kamar tidur, dapur, dan kamar mandi, " +
      "sehingga cocok untuk pelajar dan mahasiswa yang ingin fokus belajar maupun keluarga kecil yang mencari tempat tinggal yang aman.",
    // TEBAKAN: ganti dengan alamat, nomor WhatsApp, dan email yang asli
    alamat: "Jl. Contoh No. 1, Kota Anda (mohon diganti)",
    wa: "6281234567890",
    email: "kost.mahira@example.com",
    jamKunjung: "Setiap hari, 08.00 - 17.00 WIB",
    mapsEmbed: "",
  },
  harga: {
    bulanan: 1000000,
    // Diskon sesuai arahan pemilik. Sewa 7-11 bulan mengikuti diskon 25% (TEBAKAN, bisa diubah di admin).
    diskon: [
      { min: 1, max: 2, persen: 15 },
      { min: 3, max: 4, persen: 20 },
      { min: 5, max: 11, persen: 25 },
      { min: 12, max: 12, persen: 40 },
    ],
  },
  bangunan: [
    {
      nama: "Bangunan 1",
      peruntukan: "Putri / Keluarga",
      isi: "2 kamar tidur, 1 dapur, 1 kamar mandi",
      kamar: [
        { nama: "Kamar 1A", status: "tersedia" },
        { nama: "Kamar 1B", status: "tersedia" },
      ],
    },
    {
      nama: "Bangunan 2",
      peruntukan: "Putra / Keluarga",
      isi: "2 kamar tidur, 1 dapur, 1 kamar mandi",
      kamar: [
        { nama: "Kamar 2A", status: "tersedia" },
        { nama: "Kamar 2B", status: "tersedia" },
      ],
    },
  ],
  fasilitas: [
    { ikon: "🛏️", nama: "Kamar Tidur", ket: "2 kamar tidur di setiap bangunan" },
    { ikon: "🍳", nama: "Dapur Bersama", ket: "1 dapur di setiap bangunan untuk memasak sendiri" },
    { ikon: "🚿", nama: "Kamar Mandi", ket: "1 kamar mandi di setiap bangunan" },
    { ikon: "🏍️", nama: "Parkir Motor", ket: "Area parkir motor untuk penghuni" },
    { ikon: "🕌", nama: "Lingkungan Islami", ket: "Suasana tenang dengan aturan syar'i" },
    { ikon: "🔒", nama: "Aman & Terjaga", ket: "Tamu lawan jenis tidak masuk area kamar" },
  ],
  aturan: [
    "Tamu lawan jenis hanya diterima di ruang tamu/teras, tidak masuk kamar.",
    "Jam malam pukul 22.00 WIB (bisa disesuaikan pemilik).",
    "Menjaga kebersihan kamar, dapur, dan kamar mandi bersama.",
    "Dilarang merokok, minuman keras, dan barang terlarang.",
    "Pembayaran sewa di awal periode.",
  ],
  galeri: [
    // Tempel link Google Drive di halaman admin. Pastikan file di Drive diatur "Siapa saja yang memiliki link dapat melihat".
  ],
  faq: [
    { q: "Apakah kost ini khusus putri?", a: "Kami menerima pelajar, mahasiswa, dan keluarga. Pembagian bangunan putra/putri dapat ditanyakan langsung ke pengelola." },
    { q: "Apakah harga sudah termasuk listrik dan air?", a: "Silakan hubungi pengelola melalui WhatsApp untuk rincian biaya listrik dan air." },
    { q: "Bagaimana cara survei lokasi?", a: "Isi formulir Jadwalkan Kunjungan di halaman ini, atau langsung hubungi kami lewat WhatsApp." },
  ],
};

const DATA_PRIVAT_BAWAAN = {
  penghuni: [],
  pengunjung: [],
};

/* ---------------- Helper umum ---------------- */

function rupiah(n) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

function diskonUntuk(bulan, harga) {
  const t = (harga.diskon || []).find((d) => bulan >= d.min && bulan <= d.max);
  return t ? t.persen : 0;
}

function hitungSewa(bulan, harga) {
  const persen = diskonUntuk(bulan, harga);
  const normal = harga.bulanan * bulan;
  const total = normal * (1 - persen / 100);
  return { persen, normal, total, hemat: normal - total, perBulan: total / bulan };
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* Ubah link Google Drive menjadi link yang bisa ditampilkan */
function driveId(link) {
  if (!link) return null;
  const m = link.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || link.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : null;
}
function driveGambar(link) {
  const id = driveId(link);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1600` : link;
}
function driveVideo(link) {
  const id = driveId(link);
  return id ? `https://drive.google.com/file/d/${id}/preview` : link;
}

/* ---------------- Penyimpanan ---------------- */

const KUNCI_LOKAL = "mahira-data-v1";
const KUNCI_PRIVAT = "mahira-privat-v1";

const Store = {
  mode: "lokal", // "server" atau "lokal"

  async muat() {
    try {
      const r = await fetch("/api/data", { cache: "no-store" });
      if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
        const d = await r.json();
        this.mode = "server";
        return gabung(DATA_BAWAAN, d || {});
      }
    } catch (e) { /* tidak ada server, pakai mode lokal */ }
    this.mode = "lokal";
    try {
      const s = localStorage.getItem(KUNCI_LOKAL);
      if (s) return gabung(DATA_BAWAAN, JSON.parse(s));
    } catch (e) {}
    return structuredClone(DATA_BAWAAN);
  },

  async simpan(data, sandi) {
    if (this.mode === "server") {
      const r = await fetch("/api/data", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-password": sandi },
        body: JSON.stringify({ publik: data }),
      });
      if (!r.ok) throw new Error("Gagal menyimpan ke server (" + r.status + ")");
      return;
    }
    localStorage.setItem(KUNCI_LOKAL, JSON.stringify(data));
  },

  async muatPrivat(sandi) {
    if (this.mode === "server") {
      const r = await fetch("/api/data?privat=1", { headers: { "x-admin-password": sandi }, cache: "no-store" });
      if (!r.ok) throw new Error("Sandi salah atau server bermasalah");
      return gabung(DATA_PRIVAT_BAWAAN, await r.json());
    }
    try {
      const s = localStorage.getItem(KUNCI_PRIVAT);
      if (s) return gabung(DATA_PRIVAT_BAWAAN, JSON.parse(s));
    } catch (e) {}
    return structuredClone(DATA_PRIVAT_BAWAAN);
  },

  async simpanPrivat(privat, sandi) {
    if (this.mode === "server") {
      const r = await fetch("/api/data", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-password": sandi },
        body: JSON.stringify({ privat }),
      });
      if (!r.ok) throw new Error("Gagal menyimpan ke server (" + r.status + ")");
      return;
    }
    localStorage.setItem(KUNCI_PRIVAT, JSON.stringify(privat));
  },

  /* Formulir kunjungan dari halaman publik */
  async kirimKunjungan(isian) {
    if (this.mode === "server") {
      const r = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isian),
      });
      if (!r.ok) throw new Error("Gagal mengirim");
      return;
    }
    const p = await this.muatPrivat();
    p.pengunjung.unshift({ ...isian, id: Date.now(), dibuat: new Date().toISOString(), status: "baru" });
    localStorage.setItem(KUNCI_PRIVAT, JSON.stringify(p));
  },
};

function gabung(bawaan, isi) {
  const hasil = structuredClone(bawaan);
  for (const k of Object.keys(isi || {})) {
    if (isi[k] && typeof isi[k] === "object" && !Array.isArray(isi[k]) && typeof hasil[k] === "object" && !Array.isArray(hasil[k])) {
      hasil[k] = { ...hasil[k], ...isi[k] };
    } else if (isi[k] !== undefined) {
      hasil[k] = isi[k];
    }
  }
  return hasil;
}
