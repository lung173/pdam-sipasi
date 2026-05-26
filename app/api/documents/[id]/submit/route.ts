// app/api/documents/[id]/submit/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, successResponse, errorResponse, getClientIp } from "@/lib/auth-helpers";
import { createAuditLog, createStatusTimeline } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/submit
// Staff atau Agendaris mengirimkan dokumen ke tahap review
export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user, request) => {
    if (user.role !== "ADMIN_STAFF" && user.role !== "AGENDARIS") {
      return errorResponse("Hanya Staff atau Agendaris yang dapat mengirim dokumen.", 403);
    }

    try {
      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
        include: { files: true },
      });

      if (!doc) return errorResponse("Dokumen tidak ditemukan.", 404);

      // Staff hanya bisa submit dokumen miliknya sendiri
      if (user.role === "ADMIN_STAFF" && doc.createdById !== user.id) {
        return errorResponse("Akses ditolak.", 403);
      }

      const allowedStatuses = ["DRAFT", "PERLU_REVISI"];
      if (user.role === "AGENDARIS") {
        allowedStatuses.push("MENUNGGU_REVIEW_AGENDARIS");
      }

      if (!allowedStatuses.includes(doc.currentStatus)) {
        return errorResponse(
          `Dokumen tidak dapat dikirim dari status "${doc.currentStatus}".`,
          400
        );
      }

      // Minimal harus ada 1 file draft
      const hasDraft = doc.files.some((f) => f.fileType === "DRAFT");
      if (!hasDraft) {
        return errorResponse("Wajib upload minimal 1 file draft sebelum mengirim.", 400);
      }

      const prevStatus = doc.currentStatus;
      const updated = await prisma.suratMasuk.update({
        where: { id: params.id },
        data: {
          currentStatus: "MENUNGGU_REVIEW_AGENDARIS",
          currentHolder: "AGENDARIS",
        },
      });

      await createStatusTimeline({
        suratMasukId: doc.id,
        fromStatus: prevStatus,
        toStatus: "MENUNGGU_REVIEW_AGENDARIS",
        changedBy: user.id,
        notes: user.role === "AGENDARIS"
          ? "Dokumen dibuat dan diproses oleh Agendaris"
          : "Dokumen dikirim ke Agendaris untuk review",
      });

      await createAuditLog({
        userId: user.id,
        suratMasukId: doc.id,
        action: "DOCUMENT_SUBMITTED",
        description: user.role === "AGENDARIS"
          ? `${doc.nomorSurat} siap diproses oleh Agendaris`
          : `${doc.nomorSurat} dikirim ke Agendaris`,
        ipAddress: getClientIp(request),
      });

      return successResponse(
        updated,
        user.role === "AGENDARIS"
          ? "Dokumen berhasil diproses."
          : "Dokumen berhasil dikirim ke Agendaris."
      );
    } catch (error) {
      console.error("[POST /api/documents/[id]/submit]", error);
      return errorResponse("Gagal memproses dokumen.", 500);
    }
  });
}
