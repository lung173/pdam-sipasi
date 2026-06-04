// components/layout/AjukanSuratButton.tsx
/**
 * @file components/layout/AjukanSuratButton.tsx
 * @description Komponen tombol untuk memicu modal pengajuan surat baru. Biasanya ditampilkan di TopBar atau Sidebar untuk akses cepat.
 * @location Dirender di Sidebar dan/atau halaman yang butuh akses cepat (terutama untuk Staff).
 */
"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { AjukanSuratModal } from "./AjukanSuratModal";

export function AjukanSuratButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary bg-green-600 hover:bg-green-700 gap-2"
      >
        <Send className="w-4 h-4" />
        Ajukan Surat
      </button>
      <AjukanSuratModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
