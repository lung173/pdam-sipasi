// components/kalender/KalenderInternal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Calendar, MapPin, Clock,
  Users, AlertTriangle, Bell, BellOff, RefreshCw,
  Video, Map, Loader2, X, ExternalLink, CheckCircle2,
} from "lucide-react";
import { format, getDaysInMonth, startOfMonth, getDay, isToday, isSameDay, parseISO, differenceInCalendarDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────

interface ReminderLog {
  reminderType: string;
  sentAt: string;
  isSuccess: boolean;
}

interface KalenderEvent {
  id: string;
  hari: string;
  tanggal: string;
  deadline: string;
  jam: string;
  tempat: string;
  media: "ONLINE" | "OFFLINE";
  dresscode: string | null;
  catatanLain: string | null;
  undanganType: "INTERNAL" | "EXTERNAL";
  pengirimExternal: string | null;
  suratMasuk: {
    id: string;
    nomorSurat: string;
    perihal: string;
    currentStatus: string;
    createdBy: { name: string; divisi: string | null };
  };
  penerima: {
    user: { id: string; name: string; divisi: string | null };
  }[];
  reminderLogs: ReminderLog[];
}

// ─── Helpers ──────────────────────────────────────────────────

const REMINDER_LABELS: Record<string, string> = {
  H3: "H-3",
  H1: "H-1",
  H0: "H-0",
};

const STATUS_DOT_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-400",
  MENUNGGU_REVIEW_AGENDARIS: "bg-yellow-400",
  DIJADWALKAN_KE_DIREKTUR: "bg-blue-400",
  MENUNGGU_KEPUTUSAN_DIREKTUR: "bg-indigo-400",
  KEPUTUSAN_DIREKTUR_SELESAI: "bg-orange-400",
  ARSIP_FINAL_TERSIMPAN: "bg-green-400",
};

const EVENT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-indigo-500",
];

// ─── Sub-Component: Event Detail Modal ────────────────────────

function EventDetailModal({
  event,
  onClose,
  colorClass,
}: {
  event: KalenderEvent;
  onClose: () => void;
  colorClass: string;
}) {
  const today = new Date();
  const eventDate = parseISO(event.tanggal);
  const daysLeft = differenceInCalendarDays(eventDate, today);
  const sentTypes = event.reminderLogs.filter((l) => l.isSuccess).map((l) => l.reminderType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`${colorClass} p-5 text-white`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
                {event.undanganType === "EXTERNAL" ? "Undangan Eksternal" : "Undangan Internal"}
              </p>
              <h3 className="font-bold text-lg leading-tight">{event.suratMasuk.perihal}</h3>
              <p className="text-xs opacity-75 mt-1 font-mono">{event.suratMasuk.nomorSurat}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Days left badge */}
          <div className="mt-3">
            {daysLeft < 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold">
                ✓ Sudah Berlalu
              </span>
            ) : daysLeft === 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/30 text-xs font-bold animate-pulse">
                🔴 Hari Ini!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold">
                ⏳ {daysLeft} hari lagi
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Time & Place */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Waktu</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.hari}</p>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  {format(eventDate, "dd MMM yyyy", { locale: localeId })}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400">{event.jam} WIB</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              {event.media === "ONLINE"
                ? <Video className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                : <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              }
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Tempat</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{event.tempat}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${event.media === "ONLINE"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                  {event.media}
                </span>
              </div>
            </div>
          </div>

          {/* Dresscode & Catatan */}
          {(event.dresscode || event.catatanLain) && (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 text-sm space-y-1">
              {event.dresscode && (
                <p className="text-gray-700 dark:text-slate-300">
                  <span className="font-semibold text-gray-500">Dresscode:</span> {event.dresscode}
                </p>
              )}
              {event.catatanLain && (
                <p className="text-gray-700 dark:text-slate-300">
                  <span className="font-semibold text-gray-500">Catatan:</span> {event.catatanLain}
                </p>
              )}
            </div>
          )}

          {/* Penerima */}
          {event.penerima.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Penerima ({event.penerima.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {event.penerima.map((p) => (
                  <span
                    key={p.user.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-xs text-gray-700 dark:text-slate-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {p.user.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status Reminder */}
          <div className="border-t border-gray-100 dark:border-slate-800 pt-3">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-1">
              <Bell className="w-3 h-3" /> Status Reminder WA
            </p>
            <div className="flex gap-2">
              {(["H3", "H1", "H0"] as const).map((type) => {
                const sent = sentTypes.includes(type);
                const log = event.reminderLogs.find((l) => l.reminderType === type);
                return (
                  <div
                    key={type}
                    className={`flex-1 flex flex-col items-center py-2 rounded-lg border text-xs font-bold ${sent
                        ? "border-green-200 bg-green-50 dark:bg-green-900/20 text-green-700"
                        : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-400"
                      }`}
                    title={log ? `Dikirim: ${format(new Date(log.sentAt), "dd MMM HH:mm", { locale: localeId })}` : "Belum dikirim"}
                  >
                    {sent ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mb-0.5" />
                    ) : (
                      <BellOff className="w-4 h-4 mb-0.5" />
                    )}
                    {REMINDER_LABELS[type]}
                    {sent && <span className="text-[9px] font-normal mt-0.5">Terkirim</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">
            Tutup
          </button>
          <Link
            href={`/dashboard/admin/arsip/${event.suratMasuk.id}`}
            className="btn-primary flex-1 justify-center text-sm gap-1.5"
            onClick={onClose}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Lihat Dokumen
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function KalenderInternal() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<KalenderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<KalenderEvent | null>(null);
  const [runningCron, setRunningCron] = useState(false);

  const bulan = currentDate.getMonth() + 1;
  const tahun = currentDate.getFullYear();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kalender?bulan=${bulan}&tahun=${tahun}`);
      const json = await res.json();
      if (json.success) setEvents(json.data);
    } catch {
      toast.error("Gagal memuat data kalender.");
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Deteksi bentrok jadwal ────────────────────────────────
  const clashes = events.filter((ev) => {
    const evDate = parseISO(ev.tanggal);
    return events.some(
      (other) =>
        other.id !== ev.id &&
        isSameDay(parseISO(other.tanggal), evDate) &&
        other.jam === ev.jam
    );
  });

  // ── Generate grid kalender ─────────────────────────────────
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getDay(startOfMonth(currentDate)); // 0=Sun
  const paddingDays = firstDay === 0 ? 6 : firstDay - 1; // Senin as first

  const eventColorMap = new Map<string, string>();
  events.forEach((ev, i) => {
    eventColorMap.set(ev.id, EVENT_COLORS[i % EVENT_COLORS.length]);
  });

  const getEventsForDay = (day: number) => {
    const date = new Date(tahun, bulan - 1, day);
    return events.filter((ev) => isSameDay(parseISO(ev.tanggal), date));
  };

  // ── Manual trigger cron ────────────────────────────────────
  const triggerReminder = async () => {
    setRunningCron(true);
    try {
      const res = await fetch("/api/cron/reminders");
      const json = await res.json();
      if (json.success) {
        toast.success(
          json.sent > 0
            ? `✅ ${json.sent} reminder terkirim!`
            : "Tidak ada reminder yang perlu dikirim sekarang."
        );
        fetchEvents();
      } else {
        toast.error(json.error ?? "Gagal menjalankan reminder.");
      }
    } catch {
      toast.error("Koneksi gagal.");
    } finally {
      setRunningCron(false);
    }
  };

  const monthLabel = format(currentDate, "MMMM yyyy", { locale: localeId });
  const today = new Date();

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Kalender Acara Internal
          </h1>
          <p className="page-subtitle">Semua jadwal undangan dan acara kantor dalam satu tampilan</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Manual trigger reminder */}
          <button
            onClick={triggerReminder}
            disabled={runningCron}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 transition-colors"
            title="Kirim reminder WA sekarang (untuk test atau trigger manual)"
          >
            {runningCron ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {runningCron ? "Mengirim..." : "Kirim Reminder WA"}
          </button>

          <button
            onClick={fetchEvents}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Clash Alert ────────────────────────────────────── */}
      {clashes.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300">
              ⚠️ Terdeteksi Bentrok Jadwal!
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
              Ada {clashes.length} acara yang berlangsung pada hari dan jam yang sama.
              Periksa tanggal yang disorot merah di kalender.
            </p>
          </div>
        </div>
      )}

      {/* ── Legenda Reminder ───────────────────────────────── */}
      <div className="card p-4 flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-slate-400">
        <span className="font-semibold text-gray-700 dark:text-slate-300">Legenda Reminder:</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Terkirim
        </span>
        <span className="flex items-center gap-1.5">
          <BellOff className="w-3.5 h-3.5 text-gray-400" /> Belum dikirim
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Hari ini
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Bentrok jadwal
        </span>
        <span className="ml-auto text-[10px] text-gray-400">
          Reminder otomatis terkirim tiap pukul 07:00 WIB
        </span>
      </div>

      {/* ── Kalender Card ──────────────────────────────────── */}
      <div className="card overflow-hidden">
        {/* Navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <button
            onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </button>
          <div className="text-center">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white capitalize">
              {monthLabel}
            </h2>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {loading ? "Memuat..." : `${events.length} acara bulan ini`}
            </p>
          </div>
          <button
            onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {/* Padding awal bulan */}
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div
              key={`pad-${i}`}
              className="min-h-[90px] border-r border-b border-gray-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-slate-900/30"
            />
          ))}

          {/* Hari-hari dalam bulan */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const date = new Date(tahun, bulan - 1, day);
            const dayEvents = getEventsForDay(day);
            const isCurrentDay = isToday(date);
            const hasClash = dayEvents.some((ev) => clashes.includes(ev));
            const colIndex = (paddingDays + day - 1) % 7;
            const isLastCol = colIndex === 6;

            return (
              <div
                key={day}
                className={`min-h-[90px] border-b border-gray-100 dark:border-slate-800 p-1.5 ${!isLastCol ? "border-r" : ""
                  } ${isCurrentDay
                    ? "bg-blue-50/60 dark:bg-blue-900/10"
                    : "hover:bg-gray-50/70 dark:hover:bg-slate-800/30"
                  } ${hasClash ? "ring-1 ring-inset ring-red-300 dark:ring-red-800" : ""} transition-colors`}
              >
                {/* Nomor hari */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isCurrentDay
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-slate-300"
                      }`}
                  >
                    {day}
                  </span>
                  {hasClash && (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const colorClass = eventColorMap.get(ev.id) ?? "bg-blue-500";
                    const allRemindersSent = ["H3", "H1", "H0"].every((t) =>
                      ev.reminderLogs.some((l) => l.reminderType === t && l.isSuccess)
                    );

                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-white text-[10px] font-medium truncate flex items-center gap-1 ${colorClass} hover:opacity-90 transition-opacity`}
                        title={ev.suratMasuk.perihal}
                      >
                        {allRemindersSent ? (
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                        ) : (
                          <Bell className="w-2.5 h-2.5 shrink-0" />
                        )}
                        <span className="truncate">{ev.suratMasuk.perihal}</span>
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <button
                      onClick={() => setSelectedEvent(dayEvents[3])}
                      className="w-full text-center text-[9px] font-bold text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      +{dayEvents.length - 3} lainnya
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Event List View ───────────────────────────────── */}
      {events.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Daftar Acara Bulan {format(currentDate, "MMMM yyyy", { locale: localeId })}
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {events.map((ev) => {
              const evDate = parseISO(ev.tanggal);
              const daysLeft = differenceInCalendarDays(evDate, today);
              const colorClass = eventColorMap.get(ev.id) ?? "bg-blue-500";
              const sentCount = ev.reminderLogs.filter((l) => l.isSuccess).length;

              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full flex items-start gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  {/* Color strip + date */}
                  <div className="shrink-0 text-center">
                    <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center text-white font-bold text-sm`}>
                      {format(evDate, "d")}
                    </div>
                    <p className="text-[9px] text-gray-400 mt-0.5 uppercase font-bold">
                      {format(evDate, "MMM", { locale: localeId })}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {ev.suratMasuk.perihal}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ev.jam} WIB
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        {ev.media === "ONLINE"
                          ? <Video className="w-3 h-3" />
                          : <MapPin className="w-3 h-3" />}
                        {ev.tempat}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {ev.penerima.length} penerima
                      </span>
                    </div>
                  </div>

                  {/* Right: reminder & days left */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {daysLeft < 0 ? (
                      <span className="text-xs text-gray-400">Selesai</span>
                    ) : daysLeft === 0 ? (
                      <span className="text-xs font-bold text-red-600 animate-pulse">Hari Ini!</span>
                    ) : (
                      <span className="text-xs font-bold text-blue-600">{daysLeft}h lagi</span>
                    )}
                    <div className="flex gap-1">
                      {(["H3", "H1", "H0"] as const).map((type) => {
                        const sent = ev.reminderLogs.some(
                          (l) => l.reminderType === type && l.isSuccess
                        );
                        return (
                          <span
                            key={type}
                            className={`text-[9px] font-bold px-1 py-0.5 rounded ${sent
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 dark:bg-slate-700 text-gray-400"
                              }`}
                          >
                            {REMINDER_LABELS[type]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────── */}
      {!loading && events.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="w-14 h-14 text-gray-200 dark:text-slate-700 mb-4" />
          <p className="font-semibold text-gray-500 dark:text-slate-400">Tidak Ada Acara</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            Belum ada undangan terdaftar untuk bulan {monthLabel}.
          </p>
        </div>
      )}

      {/* ── Detail Modal ───────────────────────────────────── */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          colorClass={eventColorMap.get(selectedEvent.id) ?? "bg-blue-500"}
        />
      )}
    </div>
  );
}
