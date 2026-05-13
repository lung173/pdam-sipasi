import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export async function GET(req: NextRequest) {
  return requireAuth(req, async (user, request) => {
    try {
      const { searchParams } = new URL(request.url);
      
      const documentType = searchParams.get("documentType");
      const status = searchParams.get("status");
      const bulan = searchParams.get("bulan");
      const tahun = searchParams.get("tahun");
      const search = searchParams.get("search");
      
      // Build filters
      const where: any = {};
      if (documentType) where.documentType = documentType;
      if (status) where.currentStatus = status;

      if (search) {
        where.OR = [
          { nomorSurat: { contains: search, mode: "insensitive" } },
          { perihal: { contains: search, mode: "insensitive" } },
          { asalSurat: { contains: search, mode: "insensitive" } },
        ];
      }

      if (bulan || tahun) {
        // If we are filtering by month/year, we assume it's for archived documents
        where.currentStatus = "ARSIP_FINAL_TERSIMPAN";
        where.archive = { is: {} };
        if (bulan) where.archive.is.bulan = parseInt(bulan);
        if (tahun) where.archive.is.tahun = parseInt(tahun);
      }

      // Fetch documents
      const documents = await prisma.suratMasuk.findMany({
        where,
        include: {
          createdBy: { select: { name: true, divisi: true } },
          decisions: {
            orderBy: { decidedAt: "desc" },
            take: 1,
            select: { decisionType: true, decisionNote: true, director: { select: { name: true } } }
          },
          archive: { select: { serverLocation: true, archivedAt: true } }
        },
        orderBy: { updatedAt: "desc" }
      });

      // Format to CSV
      const headers = [
        "No",
        "Nomor Surat",
        "Tipe Dokumen",
        "Perihal",
        "Asal Surat",
        "Tanggal Surat",
        "Dibuat Oleh",
        "Status Terakhir",
        "Keputusan Direktur",
        "Lokasi Arsip"
      ];

      const escapeCsv = (str: string | number | null | undefined) => {
        if (str === null || str === undefined) return '""';
        const stringified = String(str).replace(/"/g, '""');
        return `"${stringified}"`;
      };

      const csvRows = [headers.map(escapeCsv).join(";")];

      documents.forEach((doc, index) => {
        const row = [
          index + 1,
          doc.nomorSurat,
          doc.documentType,
          doc.perihal,
          doc.asalSurat || "-",
          format(new Date(doc.tanggalSurat), "dd MMM yyyy", { locale: localeId }),
          `${doc.createdBy.name} (${doc.createdBy.divisi || "-"})`,
          doc.currentStatus,
          doc.decisions[0] ? doc.decisions[0].decisionType : "-",
          doc.archive ? doc.archive.serverLocation : "-"
        ];
        csvRows.push(row.map(escapeCsv).join(";"));
      });

      const csvContent = "\uFEFF" + "sep=;\n" + csvRows.join("\n");
      const filename = `Laporan_Dokumen_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      });
    } catch (error) {
      console.error("[GET /api/documents/export]", error);
      return errorResponse("Gagal mengexport data dokumen.", 500);
    }
  });
}
