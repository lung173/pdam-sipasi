"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Search as SearchIcon, Loader2, FileText, Eye, Calendar, User, ArrowLeft, Download
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DOCUMENT_TYPE_LABELS } from "@/types";
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

function GlobalSearchClient() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || searchParams.get("q") || "";
  
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDocuments = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "15",
      });
      if (search) params.set("search", search);
      if (filterType) params.set("documentType", filterType);

      const res = await fetch(`/api/documents?${params}`);
      const json = await res.json() as { 
        success: boolean; 
        data: { data: DocumentItem[]; totalPages: number; total: number } 
      };
      if (json.success) {
        setDocuments(json.data.data ?? []);
        setTotalPages(json.data.totalPages ?? 1);
        setTotal(json.data.total ?? 0);
        setPage(pageNum);
      }
    } catch {
      console.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, [search, filterType]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDocuments(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search, filterType, fetchDocuments]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterType) params.set("documentType", filterType);
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
              <SearchIcon className="w-6 h-6 text-indigo-600" />
              Pencarian Global
            </h1>
            <p className="page-subtitle">Cari dokumen dari semua jenis dan kategori</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export Hasil Pencarian
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="card p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all text-sm font-medium"
              placeholder="Ketik nomor surat, perihal, atau asal surat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="relative w-full md:w-64 shrink-0">
            <select
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium appearance-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Semua Jenis Dokumen</option>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
            {loading ? "Mencari..." : `Ditemukan ${total} dokumen`}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading && documents.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 dark:text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium text-gray-500 dark:text-slate-400">Tidak ada hasil</p>
            <p className="text-sm">Coba gunakan kata kunci lain.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-slate-300">Jenis & No. Surat</th>
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
                        <span className="block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                          {DOCUMENT_TYPE_LABELS[doc.documentType as DocumentType]}
                        </span>
                        <span className="font-mono text-xs text-gray-900 dark:text-slate-200">{doc.nomorSurat}</span>
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
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded transition-colors"
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
                    onClick={() => fetchDocuments(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="btn-secondary text-xs px-3 py-1"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => fetchDocuments(Math.min(totalPages, page + 1))}
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

export default function GlobalSearchPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>}>
        <GlobalSearchClient />
      </Suspense>
    </div>
  );
}
