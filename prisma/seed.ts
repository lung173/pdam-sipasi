// prisma/seed.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = `${process.env.DIRECT_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database for clean development mode (removing dummy data)...\n");

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  // ── Hapus data lama (urutan sesuai dependensi) ──
  await prisma.auditLog.deleteMany();
  await prisma.statusTimeline.deleteMany();
  await prisma.archive.deleteMany();
  await prisma.undanganPenerima.deleteMany();
  await prisma.undanganReminderLog.deleteMany();
  await prisma.undangan.deleteMany();
  await prisma.lembarDisposisi.deleteMany();
  await prisma.jadwalDirekturs.deleteMany();
  await prisma.directorDecision.deleteMany();
  await prisma.documentReview.deleteMany();
  await prisma.documentFile.deleteMany();
  await prisma.suratMasuk.deleteMany();
  await prisma.dismissedNotification.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Data lama dihapus\n");

  // ═══════════════════════════════════════════
  //  1. USERS (5 user default untuk development)
  // ═══════════════════════════════════════════
  await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "staff@pdam.go.id",
      passwordHash: hash("Staff@12345"),
      role: "ADMIN_STAFF",
      divisi: "Administrasi & Umum",
      bagian: "Tata Usaha",
    },
  });

  await prisma.user.create({
    data: {
      name: "Rina Marlina",
      email: "staff2@pdam.go.id",
      passwordHash: hash("Staff2@12345"),
      role: "ADMIN_STAFF",
      divisi: "Keuangan",
      bagian: "Akuntansi",
    },
  });

  await prisma.user.create({
    data: {
      name: "Sari Dewi",
      email: "agendaris@pdam.go.id",
      passwordHash: hash("Agendaris@12345"),
      role: "AGENDARIS",
      divisi: "Sekretariat",
      bagian: "Agenda & Arsip",
    },
  });

  await prisma.user.create({
    data: {
      name: "Ir. H. Ahmad Subagyo",
      email: "direktur@pdam.go.id",
      passwordHash: hash("Direktur@12345"),
      role: "DIREKTUR",
      divisi: "Direksi",
      paraf: "paraf_direktur_base64",
      signature: "signature_direktur_base64",
    },
  });

  await prisma.user.create({
    data: {
      name: "Drs. Hendra Wijaya",
      email: "kabag@pdam.go.id",
      passwordHash: hash("Kabag@12345"),
      role: "KABAG",
      divisi: "Hubungan Langganan",
      bagian: "Pelayanan",
    },
  });

  console.log("✅ 5 Default Users created successfully");
  console.log("\n🎉 Seeding complete!\n");
  console.log("📊 Data Summary:");
  console.log("  Users              : 5");
  console.log("  Surat Masuk        : 0 (Cleared)");
  console.log("\n📋 Default Credentials:");
  console.log("  Admin Staff 1 → staff@pdam.go.id       / Staff@12345");
  console.log("  Admin Staff 2 → staff2@pdam.go.id      / Staff2@12345");
  console.log("  Agendaris     → agendaris@pdam.go.id   / Agendaris@12345");
  console.log("  Direktur      → direktur@pdam.go.id    / Direktur@12345");
  console.log("  Kabag         → kabag@pdam.go.id       / Kabag@12345");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());