// Penyimpanan data di database Upstash Redis (dipasang lewat Vercel > Storage / Marketplace).
// Vercel otomatis mengisi variabel KV_REST_API_URL dan KV_REST_API_TOKEN
// (atau UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN).
import { Redis } from "@upstash/redis";

let redis;
const memori = new Map(); // hanya untuk uji coba lokal (MAHIRA_MEMORY_STORE=1)

function klien() {
  if (redis !== undefined) return redis;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export function penyimpananSiap() {
  return Boolean(klien()) || process.env.MAHIRA_MEMORY_STORE === "1";
}

export async function ambil(kunci) {
  const r = klien();
  if (r) return (await r.get("mahira:" + kunci)) || null;
  return memori.get(kunci) ?? null;
}

export async function simpan(kunci, nilai) {
  const r = klien();
  if (r) return r.set("mahira:" + kunci, nilai);
  memori.set(kunci, structuredClone(nilai));
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export function sandiBenar(req) {
  const sandi = process.env.ADMIN_PASSWORD;
  return Boolean(sandi) && req.headers.get("x-admin-password") === sandi;
}
