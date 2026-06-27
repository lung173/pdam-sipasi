import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verifikasi token rahasia untuk mencegah akses publik
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "default_cron_secret"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingNotifications = await prisma.notificationQueue.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        retryCount: { lt: 3 }
      },
      take: 20, // Process 20 at a time
    });

    if (pendingNotifications.length === 0) {
      return NextResponse.json({ success: true, message: "No pending notifications." });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const waToken = process.env.WA_API_TOKEN;
    const waUrl = process.env.WA_API_URL || "https://api.fonnte.com/send";

    for (const notif of pendingNotifications) {
      let isSuccess = false;
      let errorMessage = "";

      try {
        if (notif.type === "WHATSAPP") {
          if (!waToken) throw new Error("WA_API_TOKEN is missing");
          
          const response = await fetch(waUrl, {
            method: "POST",
            headers: {
              "Authorization": waToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              target: notif.target,
              message: notif.message,
              countryCode: "62",
            }),
          });
          
          if (!response.ok) {
            throw new Error(`WA Error: ${await response.text()}`);
          }
          isSuccess = true;
        } else if (notif.type === "EMAIL") {
          if (!process.env.SMTP_USER) throw new Error("SMTP_USER is missing");
          
          await transporter.sendMail({
            from: `"Sistem SIPASI" <${process.env.SMTP_USER}>`,
            to: notif.target,
            subject: notif.subject || "No Subject",
            html: notif.message,
          });
          isSuccess = true;
        }
      } catch (error: any) {
        errorMessage = error.message || "Unknown error";
      }

      await prisma.notificationQueue.update({
        where: { id: notif.id },
        data: {
          status: isSuccess ? "SENT" : "FAILED",
          retryCount: { increment: 1 },
          errorLog: isSuccess ? null : errorMessage,
        }
      });
    }

    return NextResponse.json({ success: true, processed: pendingNotifications.length });
  } catch (error) {
    console.error("[CRON Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
