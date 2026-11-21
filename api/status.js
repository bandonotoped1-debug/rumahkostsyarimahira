// Memberi tahu halaman admin apa saja yang sudah dipasang di Vercel (tanpa membuka rahasia).
import { json, penyimpananSiap } from "../lib/store.js";

export async function GET() {
  return json({
    database: penyimpananSiap(),
    sandiAdmin: Boolean(process.env.ADMIN_PASSWORD),
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
