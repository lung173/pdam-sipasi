/**
 * @file lib/reminder-service.ts
 * @description Layanan pengiriman reminder otomatis via WhatsApp.
 * Memeriksa acara undangan H-3, H-1, dan H-0 lalu mengirim pesan WA
 * ke seluruh penerima yang terdaftar. Setiap reminder dicatat di DB
 * agar tidak dikirim dua kali (idempotent).
 *
 * Cara kerja:
 *  1. Cron job (external / Vercel Cron) memanggil GET /api/cron/reminders
 *  2. Endpoint memanggil runReminderJob()
 *  3. runReminderJob mencari undangan yang belum dikirim remindernya
 *  4. Kirim WA, catat log
 */

import { prisma } from "./prisma";
import { format, differenceInCalendarDays, startOfDay, endOfDay, addDays } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Tipe Internal ────────────────────────────────────────────

type ReminderType = "H3" | "H1" | "H0";

interface ReminderResult {
  type: ReminderType;
  undanganId: string;
  perihal: string;
  recipientCount: number;
  success: boolean;
  error?: string;
}

// ─── WhatsApp Sender ──────────────────────────────────────────

async function sendWA(targetNumber: string, message: string): Promise<boolean> {
  const waToken = process.env.WA_API_TOKEN;
  const waUrl = process.env.WA_API_URL || "https://api.fonnte.com/send";

  if (!waToken || !targetNumber) return false;

  try {
    const res = await fetch(waUrl, {
      method: "POST",
      headers: {
        Authorization: waToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: targetNumber,
        message,
        countryCode: "62",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Pesan Template ───────────────────────────────────────────

function buildReminderMessage(
  reminderType: ReminderType,
  opts: {
    recipientName: string;
    perihal: string;
    hari: string;
    tanggal: string;
    jam: string;
    tempat: string;
    media: string;
    dresscode?: string | null;
    catatanLain?: string | null;
    nomorSurat: string;
  }
): string {
  const mediaLabel = opts.media === "ONLINE" ? "🎥 ONLINE" : "📍 OFFLINE";

  const header: Record<ReminderType, string> = {
    H3: "📅 *PENGINGAT ACARA — 3 HARI LAGI*",
    H1: "⏰ *PENGINGAT ACARA — BESOK!*",
    H0: "🔔 *PENGINGAT ACARA — HARI INI!*",
  };

  const urgencyNote: Record<ReminderType, string> = {
    H3: "Silakan cek agenda dan persiapkan diri Anda.",
    H1: "Pastikan Anda sudah siap untuk hadir besok.",
    H0: "Acara berlangsung hari ini. Harap tepat waktu.",
  };

  return `${header[reminderType]}
━━━━━━━━━━━━━━━━━━━━━━
Yth. *${opts.recipientName}*,

${urgencyNote[reminderType]}

*📋 Detail Acara:*
• *Perihal:* ${opts.perihal}
• *Hari/Tgl:* ${opts.hari}, ${opts.tanggal}
• *Jam:* ${opts.jam} WIB
• *Tempat:* ${opts.tempat} (${mediaLabel})
${opts.dresscode ? `• *Dresscode:* ${opts.dresscode}\n` : ""}${opts.catatanLain ? `• *Catatan:* ${opts.catatanLain}\n` : ""}
• *No. Surat:* \`${opts.nomorSurat}\`
━━━━━━━━━━━━━━━━━━━━━━
_Notifikasi otomatis dari Sistem SIPASI PDAM_`;
}

// ─── Core: Cek & Kirim Satu Undangan ─────────────────────────

async function processUndangan(
  undangan: {
    id: string;
    tanggal: Date;
    hari: string;
    jam: string;
    tempat: string;
    media: string;
    dresscode: string | null;
    catatanLain: string | null;
    suratMasuk: { nomorSurat: string; perihal: string };
    penerima: {
      user: { name: string; phoneNumber: string | null };
    }[];
    reminderLogs: { reminderType: string }[];
  },
  reminderType: ReminderType,
  today: Date
): Promise<ReminderResult | null> {
  const alreadySent = undangan.reminderLogs.some(
    (log) => log.reminderType === reminderType
  );

  if (alreadySent) return null;

  const tanggalLabel = format(undangan.tanggal, "dd MMMM yyyy", { locale: localeId });
  const recipients = undangan.penerima.filter((p) => p.user.phoneNumber);

  let successCount = 0;
  const errors: string[] = [];

  for (const penerima of recipients) {
    if (!penerima.user.phoneNumber) continue;

    const msg = buildReminderMessage(reminderType, {
      recipientName: penerima.user.name,
      perihal: undangan.suratMasuk.perihal,
      hari: undangan.hari,
      tanggal: tanggalLabel,
      jam: undangan.jam,
      tempat: undangan.tempat,
      media: undangan.media,
      dresscode: undangan.dresscode,
      catatanLain: undangan.catatanLain,
      nomorSurat: undangan.suratMasuk.nomorSurat,
    });

    const ok = await sendWA(penerima.user.phoneNumber, msg);
    if (ok) successCount++;
    else errors.push(penerima.user.name);
  }

  const isSuccess = errors.length === 0 || successCount > 0;

  // Catat log (upsert — idempotent)
  await prisma.$executeRaw`
    INSERT INTO undangan_reminder_log (id, undangan_id, reminder_type, recipient_count, is_success, error_message)
    VALUES (gen_random_uuid()::text, ${undangan.id}, ${reminderType}, ${successCount}, ${isSuccess}, ${errors.length > 0 ? `Gagal kirim ke: ${errors.join(", ")}` : null})
    ON CONFLICT (undangan_id, reminder_type) DO NOTHING
  `;

  return {
    type: reminderType,
    undanganId: undangan.id,
    perihal: undangan.suratMasuk.perihal,
    recipientCount: successCount,
    success: isSuccess,
    error: errors.length > 0 ? `Gagal: ${errors.join(", ")}` : undefined,
  };
}

// ─── Main Job ─────────────────────────────────────────────────

export async function runReminderJob(): Promise<{
  processed: number;
  sent: number;
  results: ReminderResult[];
}> {
  const today = startOfDay(new Date());

  // Ambil semua undangan dalam rentang H-3 sampai H-0 yang BELUM diarsipkan
  const undanganList = await prisma.undangan.findMany({
    where: {
      tanggal: {
        gte: today,
        lte: endOfDay(addDays(today, 3)),
      },
      suratMasuk: {
        currentStatus: {
          notIn: ["ARSIP_FINAL_TERSIMPAN", "DRAFT"],
        },
      },
    },
    include: {
      suratMasuk: { select: { nomorSurat: true, perihal: true } },
      penerima: {
        include: {
          user: { select: { name: true, phoneNumber: true } },
        },
      },
      reminderLogs: { select: { reminderType: true } },
    },
  });

  const results: ReminderResult[] = [];

  for (const undangan of undanganList) {
    const daysUntilEvent = differenceInCalendarDays(undangan.tanggal, today);

    const typesToSend: ReminderType[] = [];

    if (daysUntilEvent === 3) typesToSend.push("H3");
    if (daysUntilEvent === 1) typesToSend.push("H1");
    if (daysUntilEvent === 0) typesToSend.push("H0");

    for (const type of typesToSend) {
      const result = await processUndangan(
        undangan as Parameters<typeof processUndangan>[0],
        type,
        today
      );
      if (result) results.push(result);
    }
  }

  return {
    processed: undanganList.length,
    sent: results.filter((r) => r.success).length,
    results,
  };
}
