// Menerima formulir "Jadwalkan Kunjungan" dari halaman publik.
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

const potong = (v, n) => String(v ?? "").trim().slice(0, n);

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Metode tidak didukung" }, 405);
  const b = await req.json().catch(() => null);
  if (!b || !potong(b.nama, 80) || !potong(b.hp, 20)) return json({ error: "Nama dan nomor wajib diisi" }, 400);

  const store = getStore("kost-mahira");
  const privat = (await store.get("privat", { type: "json" })) || { penghuni: [], pengunjung: [] };
  privat.pengunjung = privat.pengunjung || [];
  if (privat.pengunjung.length > 2000) privat.pengunjung.length = 2000;
  privat.pengunjung.unshift({
    id: Date.now(),
    dibuat: new Date().toISOString(),
    status: "baru",
    sumber: "web",
    nama: potong(b.nama, 80),
    hp: potong(b.hp, 20),
    kategori: potong(b.kategori, 20),
    tanggal: potong(b.tanggal, 10),
    durasi: potong(b.durasi, 20),
    jumlah: potong(b.jumlah, 3),
    catatan: potong(b.catatan, 500),
  });
  await store.setJSON("privat", privat);
  return json({ ok: true });
};

export const config = { path: "/api/booking" };
