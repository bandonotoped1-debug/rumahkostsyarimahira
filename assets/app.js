/* Halaman publik Rumah Kost Syari Mahira */
let DATA;

function labelDurasi(d) {
  if (d.min === 12 && d.max === 12) return "1 tahun";
  if (d.min === d.max) return d.min + " bulan";
  return d.min + "-" + d.max + " bulan";
}

function linkWa(pesan) {
  const no = String(DATA.profil.wa || "").replace(/\D/g, "");
  return "https://wa.me/" + no + (pesan ? "?text=" + encodeURIComponent(pesan) : "");
}

function isiTeks() {
  document.querySelectorAll("[data-isi]").forEach((el) => {
    const v = DATA.profil[el.dataset.isi];
    if (v) el.textContent = v;
  });
  document.querySelectorAll("[data-isi-wa]").forEach((el) => {
    const no = String(DATA.profil.wa || "");
    el.textContent = no.startsWith("62") ? "+" + no : no;
  });
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = linkWa("Assalamu'alaikum, saya ingin bertanya tentang " + DATA.profil.nama + ".");
    el.target = "_blank";
    el.rel = "noopener";
  });
  const hk = hargaPokok(DATA.harga, 1), hb = hargaPokok(DATA.harga, 2);
  document.getElementById("hargaHero").textContent = rupiah(hk);
  document.getElementById("hargaNormal").textContent = rupiah(hk);
  document.getElementById("hargaBangunanHero").textContent = rupiah(hb);
  document.getElementById("hargaBangunan").textContent = rupiah(hb);
  document.getElementById("lblKamar1").textContent = rupiah(hk) + "/bln";
  document.getElementById("lblKamar2").textContent = rupiah(hb) + "/bln";
  document.querySelector(".hero-kartu ul").innerHTML = DATA.harga.diskon
    .map((d) => `<li>Diskon ${d.persen}% untuk sewa ${labelDurasi(d)}</li>`).join("");
  // Angka di bagian atas mengikuti data admin
  const jumlahBangunan = DATA.bangunan.length;
  const jumlahKamar = DATA.bangunan.reduce((s, b) => s + (b.kamar || []).length, 0);
  document.getElementById("statBangunan").textContent = jumlahBangunan;
  document.getElementById("statKamar").textContent = jumlahKamar;
  const terbesar = [...DATA.harga.diskon].sort((a, b) => b.persen - a.persen)[0];
  if (terbesar) {
    document.getElementById("statDiskon").textContent = terbesar.persen + "%";
    document.getElementById("statDiskonLabel").textContent = "Diskon Sewa " + labelDurasi(terbesar);
  }
  const tersedia = DATA.bangunan.reduce((s, b) => s + (b.kamar || []).filter((k) => k.status === "tersedia").length, 0);
  document.getElementById("ringkasBangunan").textContent =
    `${jumlahBangunan} bangunan dengan total ${jumlahKamar} kamar tidur. Saat ini ${tersedia} kamar tersedia.`;
  document.getElementById("tahun").textContent = new Date().getFullYear();

  const peta = document.getElementById("peta");
  const q = DATA.profil.mapsEmbed && DATA.profil.mapsEmbed.startsWith("https://")
    ? DATA.profil.mapsEmbed
    : "https://www.google.com/maps?q=" + encodeURIComponent(DATA.profil.alamat) + "&output=embed";
  peta.innerHTML = `<iframe loading="lazy" src="${escapeHtml(q)}" title="Peta lokasi"></iframe>`;

  const fotoPertama = (DATA.galeri || []).find((g) => g.tipe === "foto");
  if (fotoPertama) {
    document.getElementById("gambarTentang").innerHTML = `<img src="${escapeHtml(driveGambar(fotoPertama.link))}" alt="${escapeHtml(fotoPertama.judul)}">`;
  }
}

function tampilFasilitas() {
  document.getElementById("daftarFasilitas").innerHTML = DATA.fasilitas.map((f) => `
    <div class="kartu fasilitas muncul">
      <div class="ikon">${escapeHtml(f.ikon)}</div>
      <h3>${escapeHtml(f.nama)}</h3>
      <p>${escapeHtml(f.ket)}</p>
    </div>`).join("");
}

function tampilBangunan() {
  document.getElementById("daftarBangunan").innerHTML = DATA.bangunan.map((b) => `
    <div class="kartu bangunan muncul">
      <h3>${escapeHtml(b.nama)} <span class="peruntukan">${escapeHtml(b.peruntukan)}</span></h3>
      <p style="color:var(--teks-2);margin:0">${escapeHtml(b.isi)}</p>
      <div class="daftar-kamar">
        ${(b.kamar || []).map((k) => `<div class="kamar">${escapeHtml(k.nama)} <span class="status ${escapeHtml(k.status)}">${escapeHtml(k.status)}</span></div>`).join("")}
      </div>
    </div>`).join("");
}

function tampilHarga() {
  const terbesar = Math.max(...DATA.harga.diskon.map((d) => d.persen));
  document.getElementById("tabelDiskon").innerHTML = DATA.harga.diskon.map((d) => `
    <div class="diskon-item ${d.persen === terbesar ? "unggulan" : ""}">
      ${d.persen === terbesar ? '<span class="pita">PALING HEMAT</span>' : ""}
      <div class="persen">${d.persen}%</div>
      <div class="durasi">Sewa ${labelDurasi(d)}</div>
      <div class="kecil">${rupiah(hargaPokok(DATA.harga, 1) * (1 - d.persen / 100))} / kamar / bulan</div>
      <div class="kecil">${rupiah(hargaPokok(DATA.harga, 2) * (1 - d.persen / 100))} / bangunan / bulan</div>
    </div>`).join("");

  const slider = document.getElementById("lamaSewa");
  const cepat = document.getElementById("pilihanCepat");
  cepat.innerHTML = [1, 3, 6, 12].map((b) => `<button type="button" data-b="${b}">${b === 12 ? "1 tahun" : b + " bulan"}</button>`).join("");
  cepat.onclick = (e) => { const b = e.target.dataset.b; if (b) { slider.value = b; hitung(); } };
  slider.oninput = hitung;
  let kamar = 1;
  const pk = document.getElementById("pilihKamar");
  pk.onclick = (e) => {
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    kamar = Number(b.dataset.k);
    pk.querySelectorAll("button").forEach((x) => x.classList.toggle("aktif", x === b));
    hitung();
  };
  hitung();

  function hitung() {
    const bulan = Number(slider.value);
    const h = hitungSewa(bulan, DATA.harga, kamar);
    document.getElementById("angkaBulan").textContent = bulan;
    document.getElementById("rNormal").textContent = rupiah(h.normal);
    document.getElementById("rDiskon").textContent = h.persen + "%";
    document.getElementById("rHemat").textContent = rupiah(h.hemat);
    document.getElementById("rPerBulan").textContent = rupiah(h.perBulan);
    document.getElementById("rTotal").textContent = rupiah(h.total);
    cepat.querySelectorAll("button").forEach((x) => x.classList.toggle("aktif", Number(x.dataset.b) === bulan));
    const t = document.getElementById("tombolPesanWa");
    t.href = linkWa(`Assalamu'alaikum, saya ingin menyewa ${kamar === 2 ? "1 bangunan (2 kamar)" : "1 kamar"} di ${DATA.profil.nama} selama ${bulan} bulan (total ${rupiah(h.total)}). Apakah masih tersedia?`);
    t.target = "_blank";
  }
}

function tampilGaleri(filter = "semua") {
  const wadah = document.getElementById("daftarGaleri");
  const isi = (DATA.galeri || []).filter((g) => g.link && (filter === "semua" || g.tipe === filter));
  if (!isi.length) {
    wadah.innerHTML = `<div class="galeri-kosong" style="grid-column:1/-1">Foto dan video akan segera hadir. Insya Allah.</div>`;
    return;
  }
  wadah.innerHTML = isi.map((g) => g.tipe === "video"
    ? `<div class="galeri-item video"><iframe src="${escapeHtml(driveVideo(g.link))}" allow="autoplay; fullscreen" allowfullscreen loading="lazy" title="${escapeHtml(g.judul)}"></iframe></div>`
    : `<div class="galeri-item" data-src="${escapeHtml(driveGambar(g.link))}"><img loading="lazy" src="${escapeHtml(driveGambar(g.link))}" alt="${escapeHtml(g.judul)}"><div class="keterangan">${escapeHtml(g.judul)}</div></div>`
  ).join("");
}

function tampilAturanFaq() {
  document.getElementById("daftarAturan").innerHTML = DATA.aturan.map((a) => `<li>${escapeHtml(a)}</li>`).join("");
  document.getElementById("daftarFaq").innerHTML = DATA.faq.map((f) => `
    <details class="faq"><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join("");
}

function pasangInteraksi() {
  document.getElementById("tombolMenu").onclick = () => document.getElementById("menu").classList.toggle("buka");
  document.querySelectorAll("#menu a").forEach((a) => (a.onclick = () => document.getElementById("menu").classList.remove("buka")));

  document.getElementById("filterGaleri").onclick = (e) => {
    const f = e.target.dataset.f;
    if (!f) return;
    document.querySelectorAll("#filterGaleri button").forEach((b) => b.classList.toggle("aktif", b === e.target));
    tampilGaleri(f);
  };
  const lb = document.getElementById("lightbox");
  document.getElementById("daftarGaleri").onclick = (e) => {
    const item = e.target.closest(".galeri-item[data-src]");
    if (!item) return;
    lb.querySelector("img").src = item.dataset.src;
    lb.classList.add("buka");
  };
  lb.onclick = () => lb.classList.remove("buka");

  const tgl = document.getElementById("kTanggal");
  tgl.min = new Date().toISOString().slice(0, 10);

  document.getElementById("formKunjungan").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const isian = Object.fromEntries(f.entries());
    const pesan = document.getElementById("pesanKunjungan");
    try {
      await Store.kirimKunjungan(isian);
      pesan.className = "pesan ok";
      pesan.textContent = "Jazakallahu khairan! Permintaan kunjungan terkirim. Kami akan segera menghubungi Anda.";
      e.target.reset();
    } catch (err) {
      pesan.className = "pesan gagal";
      pesan.textContent = "Maaf, gagal mengirim. Silakan hubungi kami lewat WhatsApp.";
    }
  };

  const pengamat = new IntersectionObserver((entri) => {
    entri.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("tampil"); pengamat.unobserve(x.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".muncul").forEach((el) => pengamat.observe(el));
}

(async function mulai() {
  DATA = await Store.muat();
  isiTeks();
  tampilFasilitas();
  tampilBangunan();
  tampilHarga();
  tampilGaleri();
  tampilAturanFaq();
  pasangInteraksi();
  Chatbot.pasang(DATA);
})();
