/* Panel admin Rumah Kost Syari Mahira */
let DATA, PRIVAT, SANDI = "";
// STATUS diisi oleh cekStatus() di bawah
const SANDI_LOKAL_BAWAAN = "mahira2026"; // TEBAKAN: hanya untuk mode coba. Di Vercel sandi diatur lewat ADMIN_PASSWORD.

const $ = (id) => document.getElementById(id);
const JUDUL = {
  dasbor: "Dasbor", profil: "Profil Kost", harga: "Harga & Diskon", bangunan: "Bangunan & Kamar",
  fasilitas: "Fasilitas", galeri: "Foto & Video", aturan: "Aturan & FAQ", penghuni: "Penghuni",
  pengunjung: "Pengunjung", cadangan: "Cadangan Data",
};

function notif(teks, ok = true) {
  const n = $("notif");
  n.textContent = teks;
  n.className = "notif " + (ok ? "ok" : "gagal");
  clearTimeout(n._t);
  n._t = setTimeout(() => (n.className = "notif"), 2800);
}
function tandaiBerubah() { $("aksiSimpan").hidden = false; }
function tglIndo(s) { if (!s) return "-"; const d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }

/* ---------- Masuk ---------- */
$("formMasuk").onsubmit = async (e) => {
  e.preventDefault();
  const sandi = $("sandi").value.trim();
  const pesan = $("pesanMasuk");
  DATA = await Store.muat();
  try {
    if (Store.mode === "server") {
      if (STATUS && !STATUS.sandiAdmin) throw new Error("ADMIN_PASSWORD belum diatur di Vercel. Buka Settings > Environment Variables, tambahkan ADMIN_PASSWORD, lalu Redeploy.");
      PRIVAT = await Store.muatPrivat(sandi);
    } else {
      if (sandi !== SANDI_LOKAL_BAWAAN) throw new Error(STATUS
        ? "Database belum terpasang, jadi admin berjalan dalam mode coba. Sandi mode coba: mahira2026."
        : "Kata sandi salah. Sandi mode coba: mahira2026.");
      PRIVAT = await Store.muatPrivat();
    }
    SANDI = sandi;
    sessionStorage.setItem("mahira-sandi", sandi);
    bukaAdmin();
  } catch (err) {
    sessionStorage.removeItem("mahira-sandi");
    pesan.className = "pesan gagal";
    pesan.textContent = Store.mode === "server" && !/ADMIN_PASSWORD/.test(err.message) ? "Kata sandi salah. Gunakan sandi yang Anda isi di ADMIN_PASSWORD (Vercel)." : err.message;
  }
};

/* Cek apa saja yang sudah dipasang di server (Vercel) */
let STATUS = null;
(async function cekStatus() {
  try {
    const r = await fetch("/api/status", { cache: "no-store" });
    if (r.ok && (r.headers.get("content-type") || "").includes("json")) STATUS = await r.json();
  } catch (e) {}
  const el = $("statusServer");
  if (!STATUS) { el.innerHTML = "Mode coba (dibuka tanpa server). Sandi: <b>mahira2026</b>"; return; }
  const baris = (ok, teks) => `<div>${ok ? "✅" : "⚠️"} ${teks}</div>`;
  el.innerHTML =
    baris(STATUS.database, STATUS.database ? "Database terpasang" : "Database belum terpasang: perubahan hanya tersimpan di browser ini (sandi mode coba: <b>mahira2026</b>)") +
    baris(STATUS.sandiAdmin, STATUS.sandiAdmin ? "Sandi admin sudah diatur" : "ADMIN_PASSWORD belum diatur di Vercel") +
    baris(STATUS.ai, STATUS.ai ? "Chatbot AI aktif" : "Chatbot memakai jawaban sederhana (ANTHROPIC_API_KEY belum diisi)");
})();

(async function cobaMasukOtomatis() {
  const s = sessionStorage.getItem("mahira-sandi");
  if (s) { $("sandi").value = s; $("formMasuk").requestSubmit(); }
})();

$("keluar").onclick = () => { sessionStorage.removeItem("mahira-sandi"); location.reload(); };

function bukaAdmin() {
  $("layarMasuk").hidden = true;
  $("layarMasuk").style.display = "none";
  $("layarAdmin").hidden = false;
  const m = $("labelMode");
  m.className = "mode " + Store.mode;
  m.textContent = Store.mode === "server" ? "● Tersimpan di database" : "● Mode coba (tersimpan di browser ini)";
  $("peringatanLokal").hidden = Store.mode === "server";
  renderSemua();
}

/* ---------- Navigasi ---------- */
$("menuAdmin").onclick = (e) => {
  const p = e.target.closest("button")?.dataset.p;
  if (!p) return;
  document.querySelectorAll("#menuAdmin button").forEach((b) => b.classList.toggle("aktif", b.dataset.p === p));
  document.querySelectorAll(".panel").forEach((x) => x.classList.toggle("aktif", x.id === "p-" + p));
  $("judulPanel").textContent = JUDUL[p];
  window.scrollTo(0, 0);
};

/* ---------- Penyunting daftar umum ---------- */
function daftarEditor(idWadah, larik, kolom, opsi = {}) {
  const w = $(idWadah);
  const gridKolom = kolom.map((k) => k.lebar || "1fr").join(" ") + " auto";
  w.innerHTML = larik.map((item, i) => `
    <div class="baris-item" style="grid-template-columns:${gridKolom}" data-i="${i}">
      ${kolom.map((k) => {
        const v = typeof item === "string" ? item : item[k.kunci];
        const nilai = escapeHtml(v ?? "");
        let input;
        if (k.jenis === "pilih") input = `<select data-k="${k.kunci}">${k.pilihan.map((p) => `<option ${p === v ? "selected" : ""}>${p}</option>`).join("")}</select>`;
        else if (k.jenis === "panjang") input = `<textarea rows="2" data-k="${k.kunci}">${nilai}</textarea>`;
        else input = `<input data-k="${k.kunci}" type="${k.jenis || "text"}" value="${nilai}">`;
        return `<div><label>${k.label}</label>${input}</div>`;
      }).join("")}
      <button class="hapus" type="button" data-hapus="${i}" title="Hapus">✕</button>
    </div>`).join("") || `<p style="color:var(--teks-2)">Belum ada data.</p>`;

  w.oninput = (e) => {
    const baris = e.target.closest(".baris-item");
    if (!baris) return;
    const i = Number(baris.dataset.i);
    const k = e.target.dataset.k;
    let v = e.target.value;
    if (e.target.type === "number") v = Number(v);
    if (typeof larik[i] === "string") larik[i] = v; else larik[i][k] = v;
    tandaiBerubah();
    opsi.ubah && opsi.ubah(i);
  };
  w.onclick = (e) => {
    const h = e.target.dataset.hapus;
    if (h === undefined) return;
    if (!confirm("Hapus item ini?")) return;
    larik.splice(Number(h), 1);
    tandaiBerubah();
    daftarEditor(idWadah, larik, kolom, opsi);
  };
  opsi.setelah && opsi.setelah();
}

/* ---------- Render tiap panel ---------- */
function renderSemua() {
  renderDasbor();
  renderProfil();
  renderHarga();
  renderBangunan();
  renderFasilitas();
  renderGaleri();
  renderAturan();
  renderPenghuni();
  renderPengunjung();
}

function renderDasbor() {
  const kamar = DATA.bangunan.flatMap((b) => b.kamar);
  $("sKamarKosong").textContent = kamar.filter((k) => k.status === "tersedia").length + "/" + kamar.length;
  const aktif = PRIVAT.penghuni.filter((p) => p.status !== "selesai");
  $("sPenghuni").textContent = aktif.length;
  $("sPengunjungBaru").textContent = PRIVAT.pengunjung.filter((p) => p.status === "baru").length;
  const nilai = aktif.reduce((s, p) => s + hitungSewa(Number(p.durasi) || 1, DATA.harga).total, 0);
  $("sPendapatan").textContent = nilai >= 1e6 ? (nilai / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt" : rupiah(nilai);
  const baru = PRIVAT.pengunjung.slice(0, 5);
  $("dasborPengunjung").innerHTML = baru.length ? tabelPengunjungHtml(baru, false) : `<p style="color:var(--teks-2)">Belum ada permintaan kunjungan.</p>`;
}

function renderProfil() {
  document.querySelectorAll("[data-profil]").forEach((el) => {
    el.value = DATA.profil[el.dataset.profil] || "";
    el.oninput = () => { DATA.profil[el.dataset.profil] = el.value.trim(); tandaiBerubah(); };
  });
}

function renderHarga() {
  $("hargaBulanan").value = DATA.harga.bulanan;
  $("hargaBangunanAdmin").value = rupiah(DATA.harga.bulanan * 2);
  $("hargaBulanan").oninput = (e) => { DATA.harga.bulanan = Number(e.target.value) || 0; $("hargaBangunanAdmin").value = rupiah(DATA.harga.bulanan * 2); tandaiBerubah(); };
  daftarEditor("daftarDiskon", DATA.harga.diskon, [
    { kunci: "min", label: "Dari (bulan)", jenis: "number" },
    { kunci: "max", label: "Sampai (bulan)", jenis: "number" },
    { kunci: "persen", label: "Diskon (%)", jenis: "number" },
  ]);
}
$("tambahDiskon").onclick = () => { DATA.harga.diskon.push({ min: 1, max: 1, persen: 0 }); tandaiBerubah(); renderHarga(); };

function renderBangunan() {
  const w = $("daftarBangunanAdmin");
  w.innerHTML = DATA.bangunan.map((b, i) => `
    <div class="kartu" data-b="${i}">
      <div class="baris-form">
        <div><label>Nama bangunan</label><input data-bk="nama" value="${escapeHtml(b.nama)}"></div>
        <div><label>Untuk</label><input data-bk="peruntukan" value="${escapeHtml(b.peruntukan)}"></div>
      </div>
      <div class="baris-form satu"><div><label>Isi bangunan</label><input data-bk="isi" value="${escapeHtml(b.isi)}"></div></div>
      <label>Kamar</label>
      <div id="kamar-${i}"></div>
      <button class="tombol garis kecil" type="button" data-tambahkamar="${i}">+ Tambah kamar</button>
      <button class="hapus" type="button" data-hapusbangunan="${i}" style="margin-left:8px">Hapus bangunan</button>
    </div>`).join("");
  DATA.bangunan.forEach((b, i) => daftarEditor("kamar-" + i, b.kamar, [
    { kunci: "nama", label: "Nama kamar" },
    { kunci: "status", label: "Status", jenis: "pilih", pilihan: ["tersedia", "dipesan", "terisi"] },
  ], { ubah: () => renderDasbor() }));
  w.querySelectorAll("[data-bk]").forEach((el) => {
    el.oninput = () => { DATA.bangunan[el.closest("[data-b]").dataset.b][el.dataset.bk] = el.value; tandaiBerubah(); };
  });
  w.querySelectorAll("[data-tambahkamar]").forEach((el) => {
    el.onclick = () => { DATA.bangunan[el.dataset.tambahkamar].kamar.push({ nama: "Kamar baru", status: "tersedia" }); tandaiBerubah(); renderBangunan(); };
  });
  w.querySelectorAll("[data-hapusbangunan]").forEach((el) => {
    el.onclick = () => { if (confirm("Hapus bangunan ini beserta kamarnya?")) { DATA.bangunan.splice(el.dataset.hapusbangunan, 1); tandaiBerubah(); renderBangunan(); } };
  });
  isiPilihanKamar();
}
$("tambahBangunan").onclick = () => {
  DATA.bangunan.push({ nama: "Bangunan " + (DATA.bangunan.length + 1), peruntukan: "", isi: "", kamar: [] });
  tandaiBerubah(); renderBangunan();
};

function renderFasilitas() {
  daftarEditor("daftarFasilitasAdmin", DATA.fasilitas, [
    { kunci: "ikon", label: "Ikon", lebar: "70px" },
    { kunci: "nama", label: "Nama fasilitas" },
    { kunci: "ket", label: "Keterangan", lebar: "2fr" },
  ]);
}
$("tambahFasilitas").onclick = () => { DATA.fasilitas.push({ ikon: "⭐", nama: "", ket: "" }); tandaiBerubah(); renderFasilitas(); };

function renderGaleri() {
  daftarEditor("daftarGaleriAdmin", DATA.galeri, [
    { kunci: "tipe", label: "Jenis", jenis: "pilih", pilihan: ["foto", "video"], lebar: "100px" },
    { kunci: "judul", label: "Judul" },
    { kunci: "link", label: "Link Google Drive", lebar: "2fr" },
  ], {
    setelah: () => {
      document.querySelectorAll("#daftarGaleriAdmin .baris-item").forEach((baris) => {
        const g = DATA.galeri[baris.dataset.i];
        if (g && g.tipe === "foto" && g.link) {
          const img = document.createElement("img");
          img.className = "pratinjau";
          img.src = driveGambar(g.link);
          img.alt = "";
          baris.prepend(img);
          baris.style.gridTemplateColumns = "70px " + baris.style.gridTemplateColumns;
        }
        if (g && g.link && !driveId(g.link) && g.link.includes("drive.google")) {
          baris.insertAdjacentHTML("beforeend", `<small style="grid-column:1/-1;color:#a03b2b">Link ini sepertinya link folder. Gunakan link per file.</small>`);
        }
      });
    },
  });
}
$("tambahFoto").onclick = () => { DATA.galeri.push({ tipe: "foto", judul: "", link: "" }); tandaiBerubah(); renderGaleri(); };
$("tambahVideo").onclick = () => { DATA.galeri.push({ tipe: "video", judul: "", link: "" }); tandaiBerubah(); renderGaleri(); };
$("daftarGaleriAdmin").addEventListener("change", (e) => { if (["tipe", "link"].includes(e.target.dataset.k)) renderGaleri(); });

function renderAturan() {
  daftarEditor("daftarAturanAdmin", DATA.aturan, [{ kunci: "teks", label: "Aturan" }]);
  daftarEditor("daftarFaqAdmin", DATA.faq, [
    { kunci: "q", label: "Pertanyaan" },
    { kunci: "a", label: "Jawaban", jenis: "panjang", lebar: "2fr" },
  ]);
}
$("tambahAturan").onclick = () => { DATA.aturan.push(""); tandaiBerubah(); renderAturan(); };
$("tambahFaq").onclick = () => { DATA.faq.push({ q: "", a: "" }); tandaiBerubah(); renderAturan(); };

/* ---------- Penghuni ---------- */
function isiPilihanKamar() {
  $("pilihKamar").innerHTML = DATA.bangunan.flatMap((b) => b.kamar.map((k) =>
    `<option value="${escapeHtml(k.nama)}">${escapeHtml(b.nama)} · ${escapeHtml(k.nama)} (${k.status})</option>`)).join("");
}
function setStatusKamar(nama, status) {
  DATA.bangunan.forEach((b) => b.kamar.forEach((k) => { if (k.nama === nama) k.status = status; }));
}
function tanggalSelesai(mulai, durasi) {
  const d = new Date(mulai);
  if (isNaN(d)) return "";
  d.setMonth(d.getMonth() + Number(durasi || 0));
  return d.toISOString().slice(0, 10);
}

$("formPenghuni").onsubmit = async (e) => {
  e.preventDefault();
  const p = Object.fromEntries(new FormData(e.target).entries());
  p.id = Date.now();
  p.status = "aktif";
  p.selesai = tanggalSelesai(p.mulai, p.durasi);
  PRIVAT.penghuni.unshift(p);
  setStatusKamar(p.kamar, "terisi");
  e.target.reset();
  await simpanSemua("Penghuni ditambahkan.");
};

function renderPenghuni() {
  const l = PRIVAT.penghuni;
  $("tabelPenghuni").innerHTML = l.length ? `
    <table><thead><tr><th>Nama</th><th>Kamar</th><th>Periode</th><th>Total sewa</th><th>Status</th><th></th></tr></thead><tbody>
    ${l.map((p) => {
      const h = hitungSewa(Number(p.durasi) || 1, DATA.harga);
      return `<tr>
        <td><b>${escapeHtml(p.nama)}</b><br><small>${escapeHtml(p.kategori || "")} · ${escapeHtml(p.hp || "")}</small>${p.catatan ? `<br><small>${escapeHtml(p.catatan)}</small>` : ""}</td>
        <td>${escapeHtml(p.kamar)}</td>
        <td>${tglIndo(p.mulai)} - ${tglIndo(p.selesai)}<br><small>${escapeHtml(p.durasi)} bulan</small></td>
        <td>${rupiah(h.total)}<br><small>diskon ${h.persen}%</small></td>
        <td><span class="status ${p.status === "aktif" ? "tersedia" : "terisi"}">${escapeHtml(p.status)}</span></td>
        <td style="white-space:nowrap">
          ${p.status === "aktif" ? `<button class="tombol garis kecil" data-selesai="${p.id}">Selesai</button>` : ""}
          <button class="hapus" data-hapuspenghuni="${p.id}">✕</button></td>
      </tr>`;
    }).join("")}</tbody></table>` : `<p style="color:var(--teks-2)">Belum ada penghuni.</p>`;
}
$("tabelPenghuni").onclick = async (e) => {
  const s = e.target.dataset.selesai, h = e.target.dataset.hapuspenghuni;
  if (s) {
    const p = PRIVAT.penghuni.find((x) => String(x.id) === s);
    p.status = "selesai";
    setStatusKamar(p.kamar, "tersedia");
    await simpanSemua("Masa sewa ditandai selesai, kamar kembali tersedia.");
  }
  if (h && confirm("Hapus data penghuni ini?")) {
    PRIVAT.penghuni = PRIVAT.penghuni.filter((x) => String(x.id) !== h);
    await simpanSemua("Data penghuni dihapus.");
  }
};

/* ---------- Pengunjung ---------- */
$("formPengunjung").onsubmit = async (e) => {
  e.preventDefault();
  const p = Object.fromEntries(new FormData(e.target).entries());
  PRIVAT.pengunjung.unshift({ ...p, id: Date.now(), dibuat: new Date().toISOString(), status: "baru", sumber: "manual" });
  e.target.reset();
  await simpanSemua("Pengunjung ditambahkan.");
};

function tabelPengunjungHtml(l, aksi = true) {
  return `<table><thead><tr><th>Nama</th><th>Tanggal kunjungan</th><th>Rencana</th><th>Status</th>${aksi ? "<th></th>" : ""}</tr></thead><tbody>
    ${l.map((p) => {
      const wa = String(p.hp || "").replace(/\D/g, "").replace(/^0/, "62");
      return `<tr>
      <td><b>${escapeHtml(p.nama)}</b><br><small>${escapeHtml(p.kategori || "")} · ${wa ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener">${escapeHtml(p.hp)}</a>` : "-"}</small>${p.catatan ? `<br><small>${escapeHtml(p.catatan)}</small>` : ""}</td>
      <td>${tglIndo(p.tanggal)}<br><small>masuk ${tglIndo(p.dibuat)}</small></td>
      <td>${escapeHtml(p.durasi || "-")}${p.jumlah ? `<br><small>${escapeHtml(p.jumlah)} orang</small>` : ""}</td>
      <td>${aksi ? `<select data-statuspengunjung="${p.id}">${["baru", "dihubungi", "sudah survei", "jadi sewa", "batal"].map((s) => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select>` : escapeHtml(p.status)}</td>
      ${aksi ? `<td><button class="hapus" data-hapuspengunjung="${p.id}">✕</button></td>` : ""}
    </tr>`;
    }).join("")}</tbody></table>`;
}
function renderPengunjung() {
  $("tabelPengunjung").innerHTML = PRIVAT.pengunjung.length ? tabelPengunjungHtml(PRIVAT.pengunjung) : `<p style="color:var(--teks-2)">Belum ada pengunjung.</p>`;
}
$("tabelPengunjung").onchange = async (e) => {
  const id = e.target.dataset.statuspengunjung;
  if (!id) return;
  PRIVAT.pengunjung.find((x) => String(x.id) === id).status = e.target.value;
  await simpanSemua("Status pengunjung diperbarui.");
};
$("tabelPengunjung").onclick = async (e) => {
  const h = e.target.dataset.hapuspengunjung;
  if (h && confirm("Hapus data pengunjung ini?")) {
    PRIVAT.pengunjung = PRIVAT.pengunjung.filter((x) => String(x.id) !== h);
    await simpanSemua("Data pengunjung dihapus.");
  }
};

/* ---------- Simpan ---------- */
async function simpanSemua(pesan = "Perubahan tersimpan.") {
  try {
    DATA.aturan = DATA.aturan.filter((a) => String(a).trim());
    await Store.simpan(DATA, SANDI);
    await Store.simpanPrivat(PRIVAT, SANDI);
    $("aksiSimpan").hidden = true;
    notif("✓ " + pesan);
    renderSemua();
  } catch (err) {
    notif(err.message || "Gagal menyimpan", false);
  }
}
$("tombolSimpan").onclick = () => simpanSemua();

window.addEventListener("beforeunload", (e) => { if (!$("aksiSimpan").hidden) { e.preventDefault(); e.returnValue = ""; } });

/* ---------- Cadangan ---------- */
$("unduhData").onclick = () => {
  const blob = new Blob([JSON.stringify({ publik: DATA, privat: PRIVAT, waktu: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cadangan-kost-mahira-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
};
$("pulihkanData").onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const isi = JSON.parse(await f.text());
    if (!isi.publik) throw new Error();
    if (!confirm("Ganti semua data dengan isi file cadangan?")) return;
    DATA = gabung(DATA_BAWAAN, isi.publik);
    PRIVAT = gabung(DATA_PRIVAT_BAWAAN, isi.privat || {});
    await simpanSemua("Data dipulihkan dari cadangan.");
  } catch { notif("File cadangan tidak valid", false); }
};
$("resetData").onclick = async () => {
  if (!confirm("Yakin mengembalikan profil, harga, fasilitas, dan galeri ke pengaturan awal?")) return;
  DATA = structuredClone(DATA_BAWAAN);
  await simpanSemua("Data dikembalikan ke awal.");
};
