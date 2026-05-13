import nodemailer from "nodemailer";
import { prisma } from "./prisma";

/**
 * Konfigurasi Transport Nodemailer
 * Harap isi variabel di .env:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Fungsi pembantu untuk mengirim Pesan WhatsApp.
 * Saat ini disiapkan untuk menggunakan API Fonnte / Watsap.
 * Harap isi WA_API_TOKEN dan WA_API_URL di .env.
 */
async function sendWhatsAppMessage(targetNumber: string, message: string) {
  const waToken = process.env.WA_API_TOKEN;
  const waUrl = process.env.WA_API_URL || "https://api.fonnte.com/send"; // Default Fonnte

  if (!waToken || !targetNumber) {
    console.log("[WA Notification] Skipped. Token or Number missing.", { targetNumber });
    return;
  }

  try {
    const response = await fetch(waUrl, {
      method: "POST",
      headers: {
        "Authorization": waToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: targetNumber,
        message: message,
        countryCode: "62", // Indonesia
      }),
    });

    if (!response.ok) {
      console.error("[WA Notification Error]", await response.text());
    } else {
      console.log(`[WA Notification] Sent to ${targetNumber}`);
    }
  } catch (error) {
    console.error("[WA Notification Failed]", error);
  }
}

/**
 * Fungsi pembantu untuk mengirim Email.
 */
async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER) {
    console.log("[Email Notification] Skipped. SMTP_USER missing.");
    return;
  }
  
  if (!to) return;

  try {
    await transporter.sendMail({
      from: `"Sistem SIPASI" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email Notification] Sent to ${to}`);
  } catch (error) {
    console.error("[Email Notification Failed]", error);
  }
}

// =========================================================================
// PUBLIC NOTIFICATION TRIGGERS
// =========================================================================

/**
 * Trigger: Saat dokumen baru masuk ke web sispasi dan memohon agendaris, beritahu Direktur
 */
export async function notifyDirekturNewDocument(documentId: string, agendarisName: string) {
  try {
    const doc = await prisma.suratMasuk.findUnique({ where: { id: documentId } });
    if (!doc) return;

    // Cari akun Direktur
    const direkturList = await prisma.user.findMany({ where: { role: "DIREKTUR", isActive: true } });
    
    for (const direktur of direkturList) {
      const waMessage = `*SIPASI - Dokumen Baru*\nYth. Bapak/Ibu Direktur,\n\nTerdapat dokumen baru yang telah didaftarkan oleh Agendaris (${agendarisName}) dan membutuhkan tinjauan/keputusan Anda.\n\n*No. Surat:* ${doc.nomorSurat}\n*Perihal:* ${doc.perihal}\n*Asal:* ${doc.asalSurat || "-"}\n\nSilakan buka aplikasi SIPASI untuk memproses dokumen tersebut.\n\nTerima kasih.`;
      
      const emailHtml = `
        <h3>SIPASI - Dokumen Baru Membutuhkan Keputusan</h3>
        <p>Yth. Bapak/Ibu Direktur,</p>
        <p>Terdapat dokumen baru yang telah didaftarkan oleh Agendaris (<strong>${agendarisName}</strong>) dan menunggu keputusan Anda.</p>
        <ul>
          <li><strong>Nomor Surat:</strong> ${doc.nomorSurat}</li>
          <li><strong>Perihal:</strong> ${doc.perihal}</li>
          <li><strong>Asal:</strong> ${doc.asalSurat || "-"}</li>
        </ul>
        <p>Silakan login ke aplikasi <a href="${process.env.NEXTAUTH_URL}/login">SIPASI</a> untuk mendisposisi atau meninjau surat tersebut.</p>
      `;

      if (direktur.phoneNumber) await sendWhatsAppMessage(direktur.phoneNumber, waMessage);
      if (direktur.email) await sendEmail(direktur.email, `Dokumen Baru: ${doc.perihal}`, emailHtml);
    }
  } catch (error) {
    console.error("[notifyDirekturNewDocument Error]", error);
  }
}

/**
 * Trigger: Saat dokumen didisposisi ke Staff
 */
export async function notifyStaffAssigned(documentId: string, staffIds: string[], assignerName: string, notes: string) {
  try {
    const doc = await prisma.suratMasuk.findUnique({ where: { id: documentId } });
    if (!doc) return;

    const staffList = await prisma.user.findMany({ where: { id: { in: staffIds }, isActive: true } });

    for (const staff of staffList) {
      const waMessage = `*SIPASI - Tugas Baru*\nHalo ${staff.name},\n\nAnda mendapatkan penugasan/disposisi dokumen baru dari ${assignerName}.\n\n*No. Surat:* ${doc.nomorSurat}\n*Perihal:* ${doc.perihal}\n*Instruksi/Catatan:* ${notes || "-"}\n\nSilakan buka aplikasi SIPASI untuk menindaklanjuti dokumen ini.\n\nTerima kasih.`;
      
      const emailHtml = `
        <h3>SIPASI - Disposisi Dokumen Baru</h3>
        <p>Halo <strong>${staff.name}</strong>,</p>
        <p>Anda mendapatkan penugasan/disposisi dokumen baru dari <strong>${assignerName}</strong>.</p>
        <ul>
          <li><strong>Nomor Surat:</strong> ${doc.nomorSurat}</li>
          <li><strong>Perihal:</strong> ${doc.perihal}</li>
          <li><strong>Catatan Instruksi:</strong> ${notes || "-"}</li>
        </ul>
        <p>Silakan login ke aplikasi <a href="${process.env.NEXTAUTH_URL}/login">SIPASI</a> untuk menindaklanjuti atau menyelesaikan tugas tersebut.</p>
      `;

      if (staff.phoneNumber) await sendWhatsAppMessage(staff.phoneNumber, waMessage);
      if (staff.email) await sendEmail(staff.email, `Tugas Baru: Disposisi Surat ${doc.nomorSurat}`, emailHtml);
    }
  } catch (error) {
    console.error("[notifyStaffAssigned Error]", error);
  }
}
