// app/api/user/avatar/route.ts
/**
 * @file app/api/user/avatar/route.ts
 * @description API untuk upload foto profil user. Menyimpan file ke disk dan mengembalikan URL path.
 * Ini mencegah base64 image masuk ke JWT token yang menyebabkan session cookie membengkak.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  return requireAuth(req, async (user, request) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return errorResponse("File tidak ditemukan.", 400);
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return errorResponse("Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.", 400);
      }

      if (file.size > MAX_SIZE) {
        return errorResponse("Ukuran file maksimal 2MB.", 400);
      }

      // Generate filename
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${user.id}-${Date.now()}.${ext}`;

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });

      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      // Return the URL path (not base64!)
      const imageUrl = `/uploads/avatars/${filename}`;

      return successResponse({ url: imageUrl }, "Foto berhasil diupload.");
    } catch (error) {
      console.error("[POST /api/user/avatar]", error);
      return errorResponse("Gagal mengupload foto.");
    }
  });
}
