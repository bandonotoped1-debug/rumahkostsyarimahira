// Menyimpan dan membaca data web (profil, harga, kamar, galeri, penghuni, pengunjung).
// Sandi admin diatur di Netlify: Site configuration > Environment variables > ADMIN_PASSWORD
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

function sandiBenar(req) {
  const sandi = process.env.ADMIN_PASSWORD;
  return Boolean(sandi) && req.headers.get("x-admin-password") === sandi;
}

export default async (req) => {
  const store = getStore("kost-mahira");
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (url.searchParams.get("privat")) {
      if (!sandiBenar(req)) return json({ error: "Sandi salah" }, 401);
      return json((await store.get("privat", { type: "json" })) || {});
    }
    return json((await store.get("publik", { type: "json" })) || {});
  }

  if (req.method === "POST") {
    if (!sandiBenar(req)) return json({ error: "Sandi salah" }, 401);
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Data tidak valid" }, 400);
    if (body.publik) await store.setJSON("publik", body.publik);
    if (body.privat) await store.setJSON("privat", body.privat);
    return json({ ok: true });
  }

  return json({ error: "Metode tidak didukung" }, 405);
};

export const config = { path: "/api/data" };
