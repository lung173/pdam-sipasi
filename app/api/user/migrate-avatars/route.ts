// app/api/user/migrate-avatars/route.ts
/**
 * @file app/api/user/migrate-avatars/route.ts
 * @description One-time migration API untuk mengkonversi semua image base64 di database
 * menjadi file di disk. Hanya bisa dijalankan oleh AGENDARIS (admin).
 * 
 * Panggil: POST /api/user/migrate-avatars
 */
import { NextRequest } from "next/server";
import { requireRole, successResponse, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  return requireRole(req, ["AGENDARIS"], async (_user, _request) => {
    try {
      // Cari semua user yang image-nya berupa base64
      const users = await prisma.user.findMany({
        where: {
          image: { not: null },
        },
        select: { id: true, image: true },
      });

      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });

      let migratedCount = 0;

      for (const u of users) {
        if (!u.image || !u.image.startsWith("data:")) continue;

        // Extract mime type and base64 data
        const matches = u.image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) continue;

        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const base64Data = matches[2];
        const filename = `${u.id}-migrated.${ext}`;
        const filePath = path.join(uploadDir, filename);

        // Write to disk
        const buffer = Buffer.from(base64Data, "base64");
        await writeFile(filePath, buffer);

        // Update DB with URL path
        const imageUrl = `/uploads/avatars/${filename}`;
        await prisma.user.update({
          where: { id: u.id },
          data: { image: imageUrl },
        });

        migratedCount++;
      }

      return successResponse(
        { migratedCount, totalChecked: users.length },
        `Berhasil migrasi ${migratedCount} avatar dari base64 ke file.`
      );
    } catch (error) {
      console.error("[POST /api/user/migrate-avatars]", error);
      return errorResponse("Gagal migrasi avatar.");
    }
  });
}
