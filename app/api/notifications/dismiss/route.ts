// app/api/notifications/dismiss/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers";

/**
 * @file app/api/notifications/dismiss/route.ts
 * @description Endpoint untuk menandai notifikasi sebagai sudah dibaca (dismiss).
 * Menyimpan notifKey ke tabel DismissedNotification agar tidak muncul lagi.
 */

export async function POST(req: NextRequest) {
  return requireAuth(req, async (user) => {
    try {
      const body = await req.json();
      const { notifId } = body as { notifId: string };

      if (!notifId) {
        return errorResponse("notifId wajib diisi.", 400);
      }

      // Upsert — jika sudah ada, abaikan (idempotent)
      await prisma.dismissedNotification.upsert({
        where: {
          userId_notifKey: {
            userId: user.id,
            notifKey: notifId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          notifKey: notifId,
        },
      });

      return successResponse({ dismissed: true });
    } catch (error) {
      console.error("[POST /api/notifications/dismiss]", error);
      return errorResponse("Gagal dismiss notifikasi.");
    }
  });
}
