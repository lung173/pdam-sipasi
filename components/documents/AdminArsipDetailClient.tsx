// components/documents/AdminArsipDetailClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, FileText, Download, Calendar, User, Printer, Eye, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/documents/StatusTimeline";
import { AdminArchivePanel } from "@/components/documents/AdminArchivePanel";
import { AgendarisActionPanel } from "@/components/documents/AgendarisActionPanel";
import { FileListViewer } from "@/components/documents/FileListViewer";
import { EditDokumenModal } from "@/components/documents/EditDokumenModal";
import { DECISION_LABELS } from "@/types";
import { DecisionType } from "@prisma/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminArsipDetailClient({ doc, staffUsers }: { doc: any; staffUsers: any }) {

  const latestDecision = doc.decisions[0];
  const latestDisposisi = doc.disposisi?.[0] ?? null;
  const draftFiles = doc.files.filter((f: any) => f.fileType === "DRAFT");
  const scanFiles = doc.files.filter((f: any) => f.fileType === "FINAL_SCAN");

  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini secara permanen? Aksi ini tidak dapat dibatalkan.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus dokumen");
      toast.success("Dokumen berhasil dihapus!");
      router.push("/dashboard/admin");
    } catch (error: any) {
      toast.error(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin/arsip" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="page-title">Detail & Pengarsipan Dokumen</h1>
            <p className="page-subtitle font-mono text-xs">{doc.nomorSurat}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{doc.perihal}</h2>
              <StatusBadge status={doc.currentStatus} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={FileText} label="Nomor Surat" value={doc.nomorSurat} mono />
              <InfoRow icon={Calendar} label="Tanggal Surat"
                value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
              <InfoRow icon={User} label="Pembuat"
                value={`${doc.createdBy.name} (${doc.createdBy.divisi ?? "-"})`} />
              <InfoRow icon={User} label="Email" value={doc.createdBy.email} />
            </div>

            {doc.deskripsi && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">{doc.deskripsi}</p>
              </div>
            )}
          </div>

          {/* Detail Kegiatan Undangan */}
          {doc.documentType === "UNDANGAN" && doc.undangan && (
            <div className="card p-5 bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 space-y-4">
              <h3 className="font-bold text-purple-900 dark:text-purple-200 text-sm uppercase tracking-wide flex items-center gap-2">
                📋 Detail Kegiatan Undangan
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-purple-600 dark:text-purple-400 font-medium text-xs block">Hari</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{doc.undangan.hari}</span>
                </div>
                <div>
                  <span className="text-purple-600 dark:text-purple-400 font-medium text-xs block">Jam</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{doc.undangan.jam}</span>
                </div>
                <div>
                  <span className="text-purple-600 dark:text-purple-400 font-medium text-xs block">Tanggal Kegiatan</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{format(new Date(doc.undangan.tanggal), "dd MMMM yyyy", { locale: localeId })}</span>
                </div>
                <div>
                  <span className="text-purple-600 dark:text-purple-400 font-medium text-xs block">Tempat</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{doc.undangan.tempat}</span>
                </div>
                <div>
                  <span className="text-purple-600 dark:text-purple-400 font-medium text-xs block">Media</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {doc.undangan.media === "ONLINE" 
                      ? `Daring${doc.undangan.detailMedia ? ` (${doc.undangan.detailMedia})` : ""}` 
                      : "Luring"}
                  </span>
                </div>
                <div>
                  <span className="text-purple-600 dark:text-purple-400 font-medium text-xs block">Pakaian</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{doc.undangan.dresscode ?? "-"}</span>
                </div>
                {doc.undangan.catatanLain && (
                  <div className="col-span-2 sm:col-span-3 mt-1 pt-3 border-t border-purple-200/60 dark:border-purple-800/60">
                    <span className="text-purple-600 dark:text-purple-400 font-medium text-xs block mb-1">Catatan Tambahan</span>
                    <span className="text-gray-900 dark:text-white font-medium text-sm whitespace-pre-wrap">{doc.undangan.catatanLain}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Keputusan Direktur */}
          {latestDecision && (
            <div className="card p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 space-y-2">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Keputusan Direktur: {DECISION_LABELS[latestDecision.decisionType as DecisionType]}
              </p>
              {latestDecision.decisionNote && (
                <p className="text-sm text-purple-700 dark:text-purple-300">{latestDecision.decisionNote}</p>
              )}
              <p className="text-xs text-purple-400 dark:text-purple-500">
                {latestDecision.director.name} ·{" "}
                {format(new Date(latestDecision.decidedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
              </p>
            </div>
          )}

          {/* Files - Draft */}
          <FileListViewer 
            files={draftFiles} 
            title="File Draft" 
            emptyMessage="Belum ada file draft." 
          />
          
          {/* Files - Scan Final */}
          <FileListViewer 
            files={scanFiles} 
            title="File Scan Final" 
            emptyMessage="Belum ada file scan final. Pastikan Staff sudah mengupload scan." 
          />

          {/* Lembar Disposisi (tampil setelah Direktur memberikan keputusan) */}
          {doc.currentStatus === "KEPUTUSAN_DIREKTUR_SELESAI" && (
            <div className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Lembar Disposisi</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/admin/arsip/${doc.id}/cetak-disposisi`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl transition-all shadow-sm shadow-blue-200 dark:shadow-none hover:-translate-y-0.5"
                  >
                    <Printer className="w-4 h-4" /> Cetak Lembar Disposisi
                  </Link>
                  <a
                    href={`/api/documents/${doc.id}/print-combined`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl transition-all shadow-sm shadow-emerald-200 dark:shadow-none hover:-translate-y-0.5"
                  >
                    <Printer className="w-4 h-4" /> Cetak Gabungan (Surat + Disposisi)
                  </a>
                </div>
              </div>

              <div className="border-2 border-gray-400 dark:border-slate-600 rounded-lg overflow-hidden text-sm bg-white dark:bg-slate-900">
                {/* Header */}
                <div className="border-b-2 border-gray-400 dark:border-slate-600 py-3 px-4 text-center">
                  <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide leading-snug">
                    PERUSAHAAN UMUM DAERAH AIR MINUM TIRTA MAKMUR KABUPATEN SUKOHARJO
                  </p>
                  <p className="text-base font-bold mt-1 tracking-widest text-gray-900 dark:text-white">
                    {doc.documentType === "UNDANGAN" ? "LEMBAR DISPOSISI SURAT UNDANGAN" : "LEMBAR DISPOSISI SURAT MASUK"}
                  </p>
                </div>

                {/* Info rows */}
                <div className="divide-y divide-gray-300 dark:divide-slate-700 border-b-2 border-gray-400 dark:border-slate-600 text-xs">
                  <div className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-slate-700">
                    <DisposisiRow label="Tanggal Surat" value={format(new Date(doc.tanggalSurat), "dd MMMM yyyy", { locale: localeId })} />
                    <DisposisiRow label="Tanggal Terima" value={format(new Date(doc.tanggalTerima), "dd MMMM yyyy", { locale: localeId })} />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-slate-700">
                    <DisposisiRow label="Asal Surat" value={doc.asalSurat ?? "-"} />
                    <DisposisiRow label="No. Agenda" value={doc.nomorAgenda ?? "-"} />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-slate-700">
                    <DisposisiRow label="Perihal" value={doc.perihal} />
                    <DisposisiRow label="Nomor Surat" value={doc.nomorSurat} mono />
                  </div>
                </div>

                {/* Disposisi Kepada + Tanggal Penyelesaian */}
                <div className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-slate-700 border-b-2 border-gray-400 dark:border-slate-600 text-xs">
                  <div className="p-3">
                    <p className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Disposisi Kepada :</p>
                    <div className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                      {latestDisposisi?.jabatanKe ? (
                        <ul className="list-decimal pl-4 space-y-0.5">
                          {latestDisposisi.jabatanKe.split(",").map((j: string, i: number) => (
                            <li key={i}>{j.trim()}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <p className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">Tanggal Penyelesaian :</p>
                      <p className="text-blue-700 dark:text-blue-400 font-medium">
                        {latestDisposisi?.tanggalTandaTangan
                          ? format(new Date(latestDisposisi.tanggalTandaTangan), "dd MMMM yyyy", { locale: localeId })
                          : "-"}
                      </p>
                    </div>
                    {latestDisposisi?.keterangan && (
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">Catatan :</p>
                        <p className="text-blue-700 dark:text-blue-400 font-medium whitespace-pre-wrap">{latestDisposisi?.keterangan}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instruksi */}
                <div className="p-3 text-xs">
                  <p className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Isi Instruksi / Informasi :</p>
                  <p className="text-blue-700 dark:text-blue-400 font-medium whitespace-pre-wrap leading-relaxed">{latestDisposisi?.instruksi ?? "-"}</p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-slate-700 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 flex justify-between text-[10px] text-gray-400 dark:text-slate-500">
                  <span>Dari: {latestDisposisi?.dari?.name ?? "-"}</span>
                  <span>Status: Dikembalikan ke Agendaris</span>
                </div>
              </div>
            </div>
          )}

          {/* Review action */}
          <AgendarisActionPanel
            doc={doc}
            staffUsers={staffUsers}
            existingDisposisi={latestDisposisi ? { jabatanKe: latestDisposisi.jabatanKe, instruksi: latestDisposisi.instruksi, keterangan: latestDisposisi.keterangan } : null}
          />

          {/* Archive action */}
          {!doc.archive ? (
            <AdminArchivePanel doc={doc} hasScanFile={scanFiles.length > 0} />
          ) : (
            <div className="card p-5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 space-y-3">
              <h3 className="font-semibold text-green-900 dark:text-green-200 flex items-center gap-2">
                ✅ Dokumen Sudah Diarsipkan
              </h3>
              <div className="text-sm text-green-800 dark:text-green-300 space-y-1">
                <p><span className="font-medium">Diarsipkan oleh:</span> {doc.archive.archivedBy.name}</p>
                <p><span className="font-medium">Tanggal:</span>{" "}
                  {format(new Date(doc.archive.archivedAt), "dd MMMM yyyy, HH:mm", { locale: localeId })}</p>
                <p><span className="font-medium">Lokasi:</span>{" "}
                  <code className="bg-green-100 dark:bg-green-900/40 px-1.5 rounded text-xs">{doc.archive.serverLocation}</code></p>
                {doc.archive.notes && <p><span className="font-medium">Catatan:</span> {doc.archive.notes}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Riwayat Status</h3>
            <StatusTimeline timeline={doc.statusTimeline} />
          </div>
        </div>
      </div>

      {/* Spacing bottom */}
      <div className="h-10" />

      {showEditModal && (
        <EditDokumenModal doc={doc} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</p>
      </div>
      <p className={`text-sm text-gray-900 dark:text-slate-200 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}



function DisposisiRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-1 px-3 py-2">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 shrink-0 w-28">{label}</span>
      <span className="text-xs text-gray-500 dark:text-slate-500 shrink-0">:</span>
      <span className={`text-xs text-gray-900 dark:text-white ml-1 ${mono ? "font-mono" : ""} truncate`}>{value}</span>
    </div>
  );
}
