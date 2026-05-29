// app/api/documents/[id]/print-combined/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, props: Params) {
  const params = await props.params;
  return requireAuth(req, async (user) => {
    try {
      const doc = await prisma.suratMasuk.findUnique({
        where: { id: params.id },
        include: {
          files: {
            orderBy: { uploadedAt: "desc" },
          },
          disposisi: {
            include: { dari: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!doc) return new NextResponse("Dokumen tidak ditemukan", { status: 404 });

      // Create new PDF
      const combinedPdf = await PDFDocument.create();
      const fontBold = await combinedPdf.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await combinedPdf.embedFont(StandardFonts.Helvetica);

      // --- 1. GENERATE DISPOSISI PAGE ---
      const dispPage = combinedPdf.addPage([595.28, 841.89]); // A4
      const { width, height } = dispPage.getSize();
      const margin = 40;

      // Draw border (Thick 4px border matching high-fidelity layout)
      dispPage.drawRectangle({
        x: margin,
        y: margin,
        width: width - margin * 2,
        height: height - margin * 2,
        borderWidth: 4,
        borderColor: rgb(0, 0, 0),
      });

      // Header
      dispPage.drawText("PERUSAHAAN UMUM DAERAH AIR MINUM", {
        x: width / 2 - 145,
        y: height - 75,
        size: 11,
        font: fontBold,
      });
      dispPage.drawText("TIRTA MAKMUR KABUPATEN SUKOHARJO", {
        x: width / 2 - 135,
        y: height - 90,
        size: 11,
        font: fontBold,
      });
      
      const docTypeTitle = doc.documentType === "UNDANGAN" 
        ? "LEMBAR DISPOSISI SURAT UNDANGAN" 
        : "LEMBAR DISPOSISI SURAT MASUK";
      
      dispPage.drawText(docTypeTitle, {
        x: width / 2 - fontBold.widthOfTextAtSize(docTypeTitle, 13) / 2,
        y: height - 120,
        size: 13,
        font: fontBold,
      });

      // Double horizontal line (Double Underline style)
      dispPage.drawLine({
        start: { x: margin, y: height - 138 },
        end: { x: width - margin, y: height - 138 },
        thickness: 3,
      });
      dispPage.drawLine({
        start: { x: margin, y: height - 142 },
        end: { x: width - margin, y: height - 142 },
        thickness: 1,
      });

      // Info rows (Simplified: No vertical and no horizontal separator lines)
      const col1X = margin + 20;
      const col2X = width / 2 + 10;
      let infoY = height - 165;

      const drawInfoField = (label: string, value: string, x: number, y: number) => {
        dispPage.drawText(`${label.toUpperCase()}`, { x, y, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        dispPage.drawText(`:  ${value || "-"}`, { x: x + 95, y, size: 9.5, font: fontBold, color: rgb(0.11, 0.3, 0.85) }); // royal blue color for values!
      };

      drawInfoField("Tanggal Surat", format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId }), col1X, infoY);
      drawInfoField("Tanggal Terima", format(new Date(doc.tanggalTerima), "dd MMMM yyyy", { locale: localeId }), col2X, infoY);

      infoY -= 18;
      drawInfoField("Asal Surat", doc.asalSurat ?? "-", col1X, infoY);
      drawInfoField("Agenda", doc.nomorAgenda ?? "-", col2X, infoY);

      infoY -= 18;
      drawInfoField("Perihal", doc.perihal, col1X, infoY);
      drawInfoField("Nomor Surat", doc.nomorSurat, col2X, infoY);

      // Bottom section divider line
      dispPage.drawLine({
        start: { x: margin, y: infoY - 14 },
        end: { x: width - margin, y: infoY - 14 },
        thickness: 3,
      });

      // Draw middle vertical line (Divider for bottom section columns)
      dispPage.drawLine({
        start: { x: width / 2, y: margin },
        end: { x: width / 2, y: infoY - 14 },
        thickness: 3,
      });

      // Bottom section layout
      const latestDisp = doc.disposisi[0];
      const isMatched = (item: string) => {
        if (!latestDisp?.jabatanKe) return false;
        const selected = latestDisp.jabatanKe.toLowerCase();
        const cleanItem = item.toLowerCase();
        
        if (cleanItem.includes("adum") && (selected.includes("adum") || selected.includes("keuangan") || selected.includes("administrasi"))) return true;
        if (cleanItem.includes("teknik") && selected.includes("teknik")) return true;
        if (cleanItem.includes("hublang") && (selected.includes("hublang") || selected.includes("hubungan langganan"))) return true;
        if (cleanItem.includes("spi") && selected.includes("spi")) return true;
        if (cleanItem.includes("utara") && selected.includes("utara")) return true;
        if (cleanItem.includes("selatan") && selected.includes("selatan")) return true;
        
        return selected.includes(cleanItem);
      };

      const standardItems = [
        "Kabag Adum dan Keu",
        "Kabag Teknik",
        "Kabag Hublang",
        "Kepala SPI",
        "Kacab. Utara",
        "Kacab. Selatan",
      ];

      // --- Left Column: Disposisi Kepada + Isi Instruksi (Merged without divider) ---
      let leftY = infoY - 32;
      dispPage.drawText("DISPOSISI KEPADA :", { x: margin + 15, y: leftY, size: 9.5, font: fontBold });
      leftY -= 18;

      standardItems.forEach((item, index) => {
        const num = index + 1;
        const active = isMatched(item);
        
        // Draw number with simulated circle if active
        if (active) {
          dispPage.drawCircle({
            x: margin + 22,
            y: leftY + 3,
            size: 8,
            borderWidth: 1.5,
            borderColor: rgb(0.11, 0.3, 0.85),
            color: rgb(0.93, 0.96, 1.0),
          });
          dispPage.drawText(`${num}`, { x: margin + 20, y: leftY, size: 7.5, font: fontBold, color: rgb(0.11, 0.3, 0.85) });
          dispPage.drawText(item, { x: margin + 38, y: leftY, size: 9, font: fontBold, color: rgb(0.11, 0.3, 0.85) });
        } else {
          dispPage.drawText(`${num}`, { x: margin + 20, y: leftY, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
          dispPage.drawText(item, { x: margin + 38, y: leftY, size: 8.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
        }
        leftY -= 15;
      });

      // Director signature placement (Left column, bottom right)
      if (latestDisp?.dari?.signature) {
        try {
          const sigImgBase64 = latestDisp.dari.signature.split(',')[1] || latestDisp.dari.signature;
          const sigImg = await combinedPdf.embedPng(Buffer.from(sigImgBase64, 'base64'));
          
          const sigY = margin + 50;
          const sigX = width / 2 - 130;
          
          dispPage.drawText(`Sukoharjo, ${latestDisp.tanggalTandaTangan ? format(new Date(latestDisp.tanggalTandaTangan), "dd MMMM yyyy", { locale: localeId }) : ""}`, {
            x: sigX,
            y: sigY + 60,
            size: 8,
            font: fontBold,
          });

          dispPage.drawImage(sigImg, {
            x: sigX,
            y: sigY + 12,
            width: 80,
            height: 40,
          });

          dispPage.drawText(latestDisp.dari.name, {
            x: sigX,
            y: sigY + 2,
            size: 9,
            font: fontBold,
          });

          const ROLE_LABELS: Record<string, string> = {
            ADMIN_STAFF: "Admin Staff",
            AGENDARIS: "Agendaris",
            DIREKTUR: "Direktur Utama",
            KABAG: "Kepala Bagian",
            KASUBAG: "Kepala Sub Bagian",
          };
          const senderRole = latestDisp.dari.role ? ROLE_LABELS[latestDisp.dari.role] : "Direktur Utama";
          
          dispPage.drawText(senderRole, {
            x: sigX,
            y: sigY - 8,
            size: 8,
            font: fontRegular,
            color: rgb(0.3, 0.3, 0.3),
          });
        } catch (e) {
          console.error("Gagal embed signature di disposisi", e);
        }
      }

      // --- Right Column: Tanggal Penyelesaian + Catatan (Merged without divider & no "CATATAN:" label) ---
      let rightY = infoY - 32;
      dispPage.drawText("TANGGAL PENYELESAIAN :", { x: width / 2 + 15, y: rightY, size: 9.5, font: fontBold });
      rightY -= 18;

      const completionDate = latestDisp?.tanggalPenyelesaian 
        ? format(new Date(latestDisp.tanggalPenyelesaian), "dd MMMM yyyy", { locale: localeId }) 
        : "-";
        
      dispPage.drawText(completionDate, { x: width / 2 + 15, y: rightY, size: 10.5, font: fontBold, color: rgb(0.11, 0.3, 0.85) });

      rightY -= 25;

      // Draw Keterangan/Notes value if available
      if (latestDisp?.keterangan) {
        dispPage.drawText("CATATAN :", { x: width / 2 + 15, y: rightY, size: 9.5, font: fontBold });
        rightY -= 16;
        dispPage.drawText(latestDisp.keterangan, {
          x: width / 2 + 15,
          y: rightY,
          size: 10,
          font: fontBold,
          color: rgb(0.11, 0.3, 0.85),
          maxWidth: width - margin - (width / 2 + 30),
        });
        rightY -= 20;
      }

      // --- 2. MERGE MAIN DOCUMENT (FALLBACK: Try FINAL_SCAN first, then DRAFT) ---
      const mergeFile = doc.files.find(f => f.fileType === "FINAL_SCAN") || doc.files.find(f => f.fileType === "DRAFT");
      
      if (mergeFile) {
        try {
          const response = await fetch(new URL(mergeFile.filePath, req.url).href);
          const fileBytes = await response.arrayBuffer();
          const mainPdf = await PDFDocument.load(fileBytes);
          const mainPages = await combinedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
          
          // --- 3. AUTOMATIC SIGNATURE INSIDE LETTER ---
          const director = await prisma.user.findFirst({ where: { role: "DIREKTUR" } });
          if (director && director.signature) {
            const firstPage = mainPages[0];
            const { width: pWidth, height: pHeight } = firstPage.getSize();
            
            try {
              const sigImgBase64 = director.signature.split(',')[1] || director.signature;
              const sigImg = await combinedPdf.embedPng(Buffer.from(sigImgBase64, 'base64'));
              
              firstPage.drawImage(sigImg, {
                x: pWidth - 200,
                y: 100,
                width: 120,
                height: 60,
              });
            } catch (e) {
              console.error("Gagal embed signature di surat utama", e);
            }
          }

          mainPages.forEach((page) => combinedPdf.addPage(page));
        } catch (e) {
          console.error("Gagal memuat file utama", e);
        }
      }

      const pdfBytes = await combinedPdf.save();
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Surat_Gabungan_${doc.nomorSurat}.pdf"`,
        },
      });
    } catch (error) {
      console.error("[GET /api/documents/[id]/print-combined]", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  });
}
