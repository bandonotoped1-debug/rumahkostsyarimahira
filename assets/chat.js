/* ==========================================================
   Asisten Mahira (chatbot)
   1. Jika web berjalan di Vercel dan kunci AI sudah dipasang,
      pertanyaan dijawab oleh AI (Claude) lewat /api/chat.
   2. Jika belum, bot menjawab dengan aturan sederhana berdasarkan
      data kost (harga, fasilitas, kamar, aturan, FAQ).
   ========================================================== */
const Chatbot = {
  data: null,
  riwayat: [],
  aiAktif: true,

  pasang(data) {
    this.data = data;
    const panel = document.getElementById("chatPanel");
    document.getElementById("chatTombol").onclick = () => {
      panel.classList.toggle("buka");
      if (panel.classList.contains("buka")) document.getElementById("chatInput").focus();
    };
    document.getElementById("chatTutup").onclick = () => panel.classList.remove("buka");
    document.getElementById("chatForm").onsubmit = (e) => {
      e.preventDefault();
      const inp = document.getElementById("chatInput");
      const t = inp.value.trim();
      if (t) { inp.value = ""; this.tanya(t); }
    };
    const saran = ["Berapa harga sewanya?", "Fasilitas apa saja?", "Kamar masih tersedia?", "Aturan kost?", "Lokasinya di mana?"];
    const s = document.getElementById("chatSaran");
    s.innerHTML = saran.map((x) => `<button type="button">${x}</button>`).join("");
    s.onclick = (e) => { if (e.target.tagName === "BUTTON") this.tanya(e.target.textContent); };

    this.tulis("bot", `Assalamu'alaikum! Saya Asisten Mahira 😊\nSaya bisa bantu menjawab pertanyaan seputar harga, diskon, fasilitas, kamar, dan aturan ${data.profil.nama}. Silakan bertanya.`);
  },

  tulis(siapa, teks) {
    const isi = document.getElementById("chatIsi");
    const el = document.createElement("div");
    el.className = "gelembung " + siapa;
    el.textContent = teks;
    isi.appendChild(el);
    isi.scrollTop = isi.scrollHeight;
    return el;
  },

  async tanya(teks) {
    this.tulis("saya", teks);
    this.riwayat.push({ role: "user", content: teks });
    const ketik = this.tulis("bot mengetik", "Sedang mengetik...");
    let jawaban = null;
    if (this.aiAktif) {
      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pesan: this.riwayat.slice(-10) }),
        });
        if (r.ok) jawaban = (await r.json()).jawaban;
        else if (r.status === 404 || r.status === 501) this.aiAktif = false;
      } catch (e) { this.aiAktif = false; }
    }
    if (!jawaban) {
      await new Promise((ok) => setTimeout(ok, 450));
      jawaban = this.jawabLokal(teks);
    }
    ketik.remove();
    this.tulis("bot", jawaban);
    this.riwayat.push({ role: "assistant", content: jawaban });
  },

  /* Penjawab sederhana tanpa AI */
  jawabLokal(teks) {
    const d = this.data;
    const t = teks.toLowerCase();
    const ada = (...k) => k.some((x) => t.includes(x));
    const wa = "+" + String(d.profil.wa).replace(/\D/g, "");

    const angka = t.match(/(\d+)\s*(bulan|bln)/);
    const tahun = ada("1 tahun", "setahun", "satu tahun", "12 bulan");
    if (angka || tahun) {
      const b = tahun ? 12 : Math.min(12, Math.max(1, Number(angka[1])));
      const satu = hitungSewa(b, d.harga, 1);
      const dua = hitungSewa(b, d.harga, 2);
      const minta2 = ada("2 kamar", "dua kamar", "bangunan", "satu rumah", "1 rumah");
      const rinci = (judul, h) => `${judul}:\n• Harga normal: ${rupiah(h.normal)}\n• Diskon ${h.persen}%, total bayar ${rupiah(h.total)} (setara ${rupiah(h.perBulan)}/bulan)`;
      return `Untuk sewa ${b} bulan:\n\n` + (minta2 ? rinci("1 bangunan (2 kamar)", dua) : rinci("1 kamar", satu) + "\n\n" + rinci("1 bangunan (2 kamar)", dua)) +
        `\n\nIngin langsung pesan? Hubungi WhatsApp ${wa}.`;
    }
    if (ada("harga", "biaya", "tarif", "berapa", "sewa", "diskon", "promo", "murah")) {
      const daftar = d.harga.diskon.map((x) => `• ${x.min === 12 ? "1 tahun" : x.min === x.max ? x.min + " bulan" : x.min + "-" + x.max + " bulan"}: diskon ${x.persen}%`).join("\n");
      return `Harga sewa ${rupiah(hargaPokok(d.harga, 1))} per kamar per bulan, atau ${rupiah(hargaPokok(d.harga, 2))} per bulan untuk 1 bangunan (2 kamar). Ada diskon sesuai lama sewa:\n${daftar}\n\nCoba tanyakan misalnya "sewa 6 bulan berapa?" untuk menghitung totalnya.`;
    }
    if (ada("fasilitas", "dapur", "kamar mandi", "wc", "parkir", "motor")) {
      return "Fasilitas kami:\n" + d.fasilitas.map((f) => `${f.ikon} ${f.nama}: ${f.ket}`).join("\n");
    }
    if (ada("kamar", "tersedia", "kosong", "available", "penuh", "bangunan")) {
      const r = d.bangunan.map((b) => `${b.nama} (${b.peruntukan}): ` + b.kamar.map((k) => `${k.nama} ${k.status}`).join(", ")).join("\n");
      return `Kami punya ${d.bangunan.length} bangunan, masing-masing ${d.bangunan[0]?.isi || ""}.\n\nStatus kamar saat ini:\n${r}`;
    }
    if (ada("aturan", "tertib", "tamu", "jam malam", "syar", "boleh", "larang")) {
      return "Tata tertib kost:\n" + d.aturan.map((a, i) => `${i + 1}. ${a}`).join("\n");
    }
    if (ada("alamat", "lokasi", "dimana", "di mana", "maps", "peta", "jalan")) {
      return `Alamat kami: ${d.profil.alamat}.\nJam kunjungan: ${d.profil.jamKunjung}. Anda bisa menjadwalkan survei lewat formulir "Jadwalkan Kunjungan" di halaman ini.`;
    }
    if (ada("survei", "survey", "kunjung", "lihat langsung", "datang")) {
      return `Silakan isi formulir "Jadwalkan Kunjungan" di halaman ini, atau hubungi WhatsApp ${wa}. Jam kunjungan: ${d.profil.jamKunjung}.`;
    }
    if (ada("kontak", "whatsapp", "wa", "telepon", "hp", "nomor", "hubungi", "email")) {
      return `Hubungi kami di WhatsApp ${wa} atau email ${d.profil.email}.`;
    }
    if (ada("keluarga", "mahasiswa", "pelajar", "siswa", "putri", "putra", "cewek", "cowok", "laki", "perempuan")) {
      return `${d.profil.nama} terbuka untuk pelajar, mahasiswa, dan keluarga. Pembagian bangunan: ` + d.bangunan.map((b) => `${b.nama} untuk ${b.peruntukan}`).join(", ") + ".";
    }
    for (const f of d.faq) {
      const kata = f.q.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
      if (kata.some((w) => t.includes(w))) return f.a;
    }
    if (ada("assalam", "halo", "hai", "hi", "pagi", "siang", "sore", "malam")) {
      return "Wa'alaikumussalam warahmatullah 😊 Ada yang bisa saya bantu? Anda bisa menanyakan harga, fasilitas, kamar yang tersedia, atau aturan kost.";
    }
    if (ada("terima kasih", "makasih", "thanks", "jazak")) {
      return "Sama-sama, semoga Allah mudahkan urusan Anda 🤲";
    }
    return `Maaf, saya belum bisa menjawab pertanyaan itu. Silakan hubungi pengelola langsung di WhatsApp ${wa}, insya Allah segera dibalas.`;
  },
};
