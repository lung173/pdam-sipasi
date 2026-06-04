// components/documents/UndanganDetail.tsx
/**
 * @file components/documents/UndanganDetail.tsx
 * @description Komponen halaman detail khusus untuk tipe dokumen "Undangan", menampilkan waktu acara, lokasi, dan detail spesifik lainnya.
 * @location Dirender di dalam halaman detail dokumen jika kategori surat adalah Undangan.
 */
"use client";

import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar, MapPin, Clock, Shirt, Users, ExternalLink, Share2, Mail, Check, Video, Map } from "lucide-react";
import toast from "react-hot-toast";

interface PenerimaItem {
  user: {
    id: string;
    name: string;
    divisi: string | null;
  };
}

interface UndanganProps {
  hari: string;
  tanggal: Date | string;
  deadline: Date | string; // Repurposed as Tanggal Selesai
  jam: string;
  tempat: string;
  media: "ONLINE" | "OFFLINE";
  dresscode: string | null;
  catatanLain: string | null;
  googleCalId: string | null;
  undanganType: "INTERNAL" | "EXTERNAL";
  pengirimExternal: string | null;
  kontakExternal: string | null;
  penerima: PenerimaItem[];
}

export function UndanganDetail({
  undangan,
  perihal,
}: {
  undangan: UndanganProps;
  perihal: string;
}) {
  const [copied, setCopied] = useState(false);

  const startDate = new Date(undangan.tanggal);
  const endDate = new Date(undangan.deadline);
  
  // Hitung durasi (hari)
  const durationDays = differenceInDays(endDate, startDate) + 1;
  const isMultiDay = durationDays > 1;

  const fmtStart = format(startDate, "EEEE, dd MMMM yyyy", { locale: localeId });
  const fmtEnd = format(endDate, "EEEE, dd MMMM yyyy", { locale: localeId });

  // Generate Google Calendar Link
  const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  // Set end date to be 1 hour later for gcal if same day, or use end date
  const gcalStart = formatGCalDate(startDate);
  const gcalEnd = formatGCalDate(new Date(endDate.getTime() + 60 * 60 * 1000));
  
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Undangan: ${perihal}`
  )}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(
    `Dresscode: ${undangan.dresscode || "-"}\nCatatan: ${undangan.catatanLain || "-"}\n\nDisinkronkan otomatis via PDAM SIPASI.`
  )}&location=${encodeURIComponent(undangan.tempat)}`;

  // Generate WhatsApp Prefilled Text
  const recipientNames = undangan.penerima.map((p) => `- ${p.user.name} (${p.user.divisi || "-"})`).join("\n");
  const waText = `*UNDANGAN INTRA-OFFICE PDAM TIRTA MAKMUR*
--------------------------------------------------
*Perihal:* ${perihal}
*Hari/Tanggal:* ${undangan.hari}, ${fmtStart}${isMultiDay ? ` s/d \n               ${fmtEnd}` : ""}
*Jam:* ${undangan.jam} WIB
*Tempat:* ${undangan.tempat} (${undangan.media === "ONLINE" ? "ONLINE" : "OFFLINE"})
${undangan.dresscode ? `*Dresscode:* ${undangan.dresscode}\n` : ""}${undangan.catatanLain ? `*Catatan:* ${undangan.catatanLain}\n` : ""}
${undangan.undanganType === "EXTERNAL" ? `*Pengirim:* ${undangan.pengirimExternal || "-"} (${undangan.kontakExternal || "-"})\n` : ""}
*Penerima Undangan:*
${recipientNames || "-"}
--------------------------------------------------
_Silakan koordinasikan agenda ini melalui aplikasi SIPASI._`;

  const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

  const handleCopyWA = () => {
    navigator.clipboard.writeText(waText);
    setCopied(true);
    toast.success("Teks undangan disalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-purple-50 dark:from-purple-950/20 to-white dark:to-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-5 rounded-full bg-purple-500 shadow-sm"></span>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Detail Acara Undangan</h3>
        </div>
        <div className="flex items-center gap-2">
          {undangan.undanganType === "EXTERNAL" ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Eksternal
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 uppercase tracking-wider">
              Internal
            </span>
          )}
          {isMultiDay && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              {durationDays} Hari Acara
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tanggal & Waktu */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Hari & Tanggal</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mt-0.5">
                  {undangan.hari}
                </p>
                {isMultiDay ? (
                  <div className="mt-1 text-xs text-gray-600 dark:text-slate-400 space-y-0.5">
                    <p><span className="font-semibold text-purple-600">Mulai:</span> {fmtStart}</p>
                    <p><span className="font-semibold text-purple-600">Selesai:</span> {fmtEnd}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{fmtStart}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Waktu Acara</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{undangan.jam} WIB</p>
              </div>
            </div>
          </div>

          {/* Tempat, Media & Dresscode */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Tempat / Ruangan</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                  {undangan.tempat}
                  {undangan.media === "ONLINE" ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-[9px] font-bold uppercase">
                      <Video className="w-2.5 h-2.5" /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[9px] font-bold uppercase">
                      <Map className="w-2.5 h-2.5" /> Offline
                    </span>
                  )}
                </p>
              </div>
            </div>

            {undangan.dresscode && (
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shrink-0">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dress Code</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mt-0.5">{undangan.dresscode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Eksternal Pengirim Info */}
        {undangan.undanganType === "EXTERNAL" && (undangan.pengirimExternal || undangan.kontakExternal) && (
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 space-y-1">
            <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Informasi Pengirim Luar</p>
            <div className="text-xs text-amber-900 dark:text-amber-300 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {undangan.pengirimExternal && <p><strong>Instansi:</strong> {undangan.pengirimExternal}</p>}
              {undangan.kontakExternal && <p><strong>Kontak:</strong> {undangan.kontakExternal}</p>}
            </div>
          </div>
        )}

        {/* Catatan Lain */}
        {undangan.catatanLain && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800/80">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Catatan Tambahan</p>
            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
              {undangan.catatanLain}
            </p>
          </div>
        )}

        {/* Penerima Undangan List */}
        {undangan.penerima.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-500" /> Penerima Undangan Internal
            </p>
            <div className="flex flex-wrap gap-2">
              {undangan.penerima.map((p) => (
                <div
                  key={p.user.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900 text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  {p.user.name}
                  {p.user.divisi && (
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                      ({p.user.divisi})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-slate-800" />

        {/* Actions panel */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Google Calendar Link */}
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-xs shadow-sm transition-all border border-blue-100 dark:border-blue-900/30 hover:scale-[1.02]"
          >
            <Calendar className="w-4 h-4" />
            Tambah ke Google Calendar
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* WhatsApp Direct Share */}
          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-sm transition-all border border-emerald-100 dark:border-emerald-900/30 hover:scale-[1.02]"
          >
            <Share2 className="w-4 h-4" />
            Kirim ke WhatsApp
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Copy WA Text */}
          <button
            onClick={handleCopyWA}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-xs shadow-sm transition-all border border-gray-200 dark:border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                Tersalin!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Salin Teks WA
              </>
            )}
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/20 text-[10px] text-purple-700 dark:text-purple-400 font-semibold">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Notifikasi Email Terkirim ke Penerima</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
