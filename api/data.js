// Menyimpan dan membaca data web (profil, harga, kamar, galeri, penghuni, pengunjung).
// Sandi admin diatur di Vercel: Settings > Environment Variables > ADMIN_PASSWORD
import { ambil, simpan, json, sandiBenar, penyimpananSiap } from "../lib/store.js";

export async function GET(req) {
  if (!penyimpananSiap()) return json({ error: "Database belum dipasang" }, 503);
  const url = new URL(req.url);
  if (url.searchParams.get("privat")) {
    if (!sandiBenar(req)) return json({ error: "Sandi salah" }, 401);
    return json((await ambil("privat")) || {});
  }
  return json((await ambil("publik")) || {});
}

export async function POST(req) {
  if (!penyimpananSiap()) return json({ error: "Database belum dipasang" }, 503);
  if (!sandiBenar(req)) return json({ error: "Sandi salah" }, 401);
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "Data tidak valid" }, 400);
  if (body.publik) await simpan("publik", body.publik);
  if (body.privat) await simpan("privat", body.privat);
  return json({ ok: true });
}
