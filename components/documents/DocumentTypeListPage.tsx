// components/documents/DocumentTypeListPage.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft, Plus, Search, Eye, Loader2,
  Calendar, FileText, Download
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DOCUMENT_TYPE_LABELS, CATEGORY_LABELS } from "@/types";
import type { DocumentType, DocumentCategory, DocumentStatus } from "@prisma/client";

interface DocumentItem {
  id: string;
  nomorSurat: string;
  perihal: string;
  asalSurat: string | null;
  tanggalSurat: string | Date;
  currentStatus: DocumentStatus;
  documentType: DocumentType;
  category: DocumentCategory;
  createdAt: string | Date;
  createdBy: { id: string; name: string; divisi: string | null };
}

interface Props {
  documentType: DocumentType;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  basePath: string;
  showCreateButton?: boolean;
  createLabel?: string;
}

export function DocumentTypeListPage({
  documentType,
  title,
  description,
  icon: Icon,
  iconColor,
  basePath,
  showCreateButton = true,
  createLabel = "Buat Baru",
}: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        documentType,
        page: String(page),
        limit: "15",
      });
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterCategory) params.set("category", filterCategory);

      const res = await fetch(`/api/documents?${params}`);
      const json = await res.json() as { 
        success: boolean; 
        data: { data: DocumentItem[]; totalPages: number; total: number } 
      };
      if (json.success) {
        setDocuments(json.data.data ?? []);
        setTotalPages(json.data.totalPages ?? 1);
        setTotal(json.data.total ?? 0);
      }
    } catch {
      console.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, [documentType, page, search, filterStatus, filterCategory]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleExport = () => {
    const params = new URLSearchParams({ documentType });
    if (filterStatus) params.set("status", filterStatus);
    window.open(`/api/documents/export?${params.toString()}`, "_blank");
  };

  const fmtDate = (d: string | Date) =>
    format(new Date(d), "dd MMM yyyy", { locale: localeId });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Icon className={`w-6 h-6 ${iconColor}`} />
              {title}
            </h1>
            <p className="page-subtitle">{description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn-secondary whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          {showCreateButton && (
            <Link
              href={`${basePath}/buat`}
              className="btn-primary whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {createLabel}
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              className="form-input pl-10 text-sm"
              placeholder="Cari nomor surat, perihal, asal surat..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              className="form-input text-sm pr-8 min-w-[180px]"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="MENUNGGU_REVIEW_AGENDARIS">Menunggu Review</option>
              <option value="DIJADWALKAN_KE_DIREKTUR">Dijadwalkan</option>
              <option value="MENUNGGU_KEPUTUSAN_DIREKTUR">Menunggu Keputusan</option>
              <option value="KEPUTUSAN_DIREKTUR_SELESAI">Keputusan Selesai</option>
              <option value="MENUNGGU_ARSIP_ADMIN">Menunggu Arsip</option>
              <option value="ARSIP_FINAL_TERSIMPAN">Arsip Tersimpan</option>
            </select>
          </div>

        </div>

        {/* Result count */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {loading ? "Memuat..." : `${total} dokumen ditemukan`}
          </p>
          <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
            {DOCUMENT_TYPE_LABELS[documentType]}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 dark:text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium text-gray-500 dark:text-slate-400">Belum ada data</p>
            <p className="text-sm">Belum ada {title.toLowerCase()} yang tersimpan.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">No. Surat</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Perihal</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300 hidden md:table-cell">Asal</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300 hidden lg:table-cell">Tanggal</th>

                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Status</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-slate-300 w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-blue-700 dark:text-blue-400">{doc.nomorSurat}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-slate-200 truncate max-w-[250px]">{doc.perihal}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">Oleh: {doc.createdBy.name}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-600 dark:text-slate-400">{doc.asalSurat ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(doc.tanggalSurat)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={doc.currentStatus as DocumentStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/dashboard/admin/dokumen/${doc.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-800">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
