// components/ui/StatusBadge.tsx
/**
 * @file components/ui/StatusBadge.tsx
 * @description Komponen UI berupa badge warna-warni untuk merepresentasikan status dokumen (misal: DRAFT, DIPROSES, SELESAI).
 * @location Dipanggil di tabel-tabel atau detail dokumen untuk memperjelas status visual dokumen.
 */
import { DocumentStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  status: DocumentStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        STATUS_COLORS[status],
        size === "sm" ? "px-2 py-0.5 text-sm" : "px-2.5 py-1 text-base"
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
