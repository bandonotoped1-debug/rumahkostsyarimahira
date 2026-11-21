// Chatbot AI "Asisten Mahira" memakai Claude (Anthropic).
// Pasang kunci di Vercel: Settings > Environment Variables > ANTHROPIC_API_KEY
// Jika kunci belum ada, fungsi ini membalas 501 dan web memakai penjawab sederhana bawaan.
import Anthropic from "@anthropic-ai/sdk";
import { ambil, json } from "../lib/store.js";

function ringkasData(d) {
  const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const p = d.profil || {};
  const h = d.harga || { bulanan: 1000000, diskon: [] };
  return [
    `Nama: ${p.nama || "Rumah Kost Syari Mahira"}`,
    `Deskripsi: ${p.deskripsi || ""}`,
    `Alamat: ${p.alamat || "-"}`,
    `WhatsApp: +${String(p.wa || "").replace(/\D/g, "")}`,
    `Email: ${p.email || "-"}`,
    `Jam kunjungan: ${p.jamKunjung || "-"}`,
    `Harga: ${rp(h.bulanan)} per bulan.`,
    `Diskon: ` + (h.diskon || []).map((x) => `${x.min}-${x.max} bulan ${x.persen}%`).join("; "),
    `Bangunan dan kamar: ` + (d.bangunan || []).map((b) => `${b.nama} (${b.peruntukan}; ${b.isi}): ` + (b.kamar || []).map((k) => `${k.nama} ${k.status}`).join(", ")).join(" | "),
    `Fasilitas: ` + (d.fasilitas || []).map((f) => `${f.nama} (${f.ket})`).join("; "),
    `Aturan: ` + (d.aturan || []).join("; "),
    `Tanya jawab: ` + (d.faq || []).map((f) => `T: ${f.q} J: ${f.a}`).join(" | "),
  ].join("\n");
}

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "AI belum diaktifkan" }, 501);

  const body = await req.json().catch(() => null);
  const pesan = Array.isArray(body?.pesan) ? body.pesan.slice(-10) : [];
  const riwayat = pesan
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  while (riwayat.length && riwayat[0].role !== "user") riwayat.shift();
  if (!riwayat.length) return json({ error: "Pesan kosong" }, 400);

  let data = {};
  try { data = (await ambil("publik")) || {}; } catch (e) { /* database belum dipasang */ }
  if (!data.profil) data = DATA_DASAR;

  const system = `Anda adalah "Asisten Mahira", asisten ramah untuk calon penyewa Rumah Kost Syari Mahira.
Jawab dalam bahasa Indonesia yang sopan, hangat, dan singkat (maksimal 5 kalimat atau daftar pendek). Boleh memakai sapaan islami secukupnya.
Gunakan hanya informasi di bawah ini. Jika informasi tidak tersedia, katakan dengan jujur dan arahkan ke WhatsApp pengelola. Jangan mengarang harga, fasilitas, atau janji.
Untuk menghitung biaya: total = harga bulanan x jumlah bulan x (1 - diskon). Tulis angka dalam format Rupiah.
Tolak dengan sopan pertanyaan yang tidak berhubungan dengan kost.

DATA KOST:
${ringkasData(data)}`;

  try {
    const client = new Anthropic();
    const res = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: riwayat,
    });
    if (res.stop_reason === "refusal") return json({ jawaban: "Maaf, saya tidak bisa menjawab itu. Silakan hubungi pengelola lewat WhatsApp." });
    const jawaban = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return json({ jawaban: jawaban || "Maaf, silakan ulangi pertanyaan Anda." });
  } catch (err) {
    console.error(err);
    return json({ error: "AI sedang sibuk" }, 502);
  }
}

// Dipakai jika database belum berisi data (admin belum pernah menyimpan).
const DATA_DASAR = {
  profil: { nama: "Rumah Kost Syari Mahira", deskripsi: "Kost syari untuk pelajar, mahasiswa, dan keluarga. 2 bangunan, masing-masing 2 kamar tidur, 1 dapur, 1 kamar mandi, dan parkir motor." },
  harga: { bulanan: 1000000, diskon: [{ min: 1, max: 2, persen: 15 }, { min: 3, max: 4, persen: 20 }, { min: 5, max: 11, persen: 25 }, { min: 12, max: 12, persen: 40 }] },
};
