-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN_STAFF', 'AGENDARIS', 'DIREKTUR', 'KABAG', 'KASUBAG');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'MENUNGGU_REVIEW_AGENDARIS', 'PERLU_REVISI', 'DIJADWALKAN_KE_DIREKTUR', 'MENUNGGU_KEPUTUSAN_DIREKTUR', 'DIPROSES_DIREKTUR', 'KEPUTUSAN_DIREKTUR_SELESAI', 'MENUNGGU_PENGAMBILAN_STAFF', 'MENUNGGU_SCAN_FINAL', 'MENUNGGU_ARSIP_ADMIN', 'ARSIP_FINAL_TERSIMPAN');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('DISETUJUI', 'DITOLAK', 'REVISI', 'DISPOSISI');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('DRAFT', 'SCAN_MASUK', 'FINAL_SCAN', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DITERUSKAN', 'DIKEMBALIKAN');

-- CreateEnum
CREATE TYPE "SuratType" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "UndanganMedia" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('UNDANGAN', 'SURAT_MASUK', 'SURAT_TUGAS', 'SURAT_KELUAR', 'SK_DIREKTUR', 'PERJANJIAN', 'PERATURAN_DIREKTUR');

-- CreateEnum
CREATE TYPE "UndanganType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('UNDANGAN', 'PEMBELIAN', 'KERJASAMA', 'KEPEGAWAIAN', 'KEUANGAN', 'PERIZINAN', 'PENGADAAN', 'HUKUM', 'TEKNIK', 'DLL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "divisi" TEXT,
    "bagian" TEXT,
    "title" TEXT,
    "image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "signature" TEXT,
    "paraf" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surat_masuk" (
    "id" TEXT NOT NULL,
    "nomor_surat" TEXT NOT NULL,
    "nomor_agenda" TEXT,
    "perihal" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tujuan" TEXT,
    "asal_surat" TEXT,
    "tanggal_surat" TIMESTAMP(3) NOT NULL,
    "tanggal_terima" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "current_holder" TEXT,
    "category" "DocumentCategory" NOT NULL DEFAULT 'DLL',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "document_type" "DocumentType" NOT NULL DEFAULT 'SURAT_MASUK',
    "tanggal_instruksi" TIMESTAMP(3),
    "tanggal_penyelesaian" TIMESTAMP(3),

    CONSTRAINT "surat_masuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_files" (
    "id" TEXT NOT NULL,
    "surat_masuk_id" TEXT NOT NULL,
    "file_type" "FileType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_reviews" (
    "id" TEXT NOT NULL,
    "surat_masuk_id" TEXT NOT NULL,
    "reviewed_by" TEXT NOT NULL,
    "review_note" TEXT,
    "review_status" "ReviewStatus" NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal_direkturs" (
    "id" TEXT NOT NULL,
    "surat_masuk_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "jadwal_kirim" TIMESTAMP(3) NOT NULL,
    "is_urgen" BOOLEAN NOT NULL DEFAULT false,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jadwal_direkturs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "director_decisions" (
    "id" TEXT NOT NULL,
    "surat_masuk_id" TEXT NOT NULL,
    "director_id" TEXT NOT NULL,
    "decision_type" "DecisionType" NOT NULL,
    "decision_note" TEXT,
    "tempat" TEXT,
    "tanggal_tanda_tangan" TIMESTAMP(3),
    "paraf_direktur" TEXT,
    "tanggal_instruksi" TIMESTAMP(3),
    "batal_tanda_tangan" BOOLEAN NOT NULL DEFAULT false,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "director_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lembar_disposisi" (
    "id" TEXT NOT NULL,
    "surat_masuk_id" TEXT NOT NULL,
    "dari_id" TEXT NOT NULL,
    "ke_id" TEXT,
    "jabatan_ke" TEXT,
    "instruksi" TEXT,
    "keterangan" TEXT,
    "tempat" TEXT,
    "tanggal_tanda_tangan" TIMESTAMP(3),
    "paraf_dari_id" TEXT,
    "tanggal_instruksi" TIMESTAMP(3),
    "tanggal_penyelesaian" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lembar_disposisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "undangan" (
    "id" TEXT NOT NULL,
    "surat_masuk_id" TEXT NOT NULL,
    "hari" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jam" TEXT NOT NULL,
    "tempat" TEXT NOT NULL,
    "media" "UndanganMedia" NOT NULL DEFAULT 'OFFLINE',
    "dresscode" TEXT,
    "catatan_lain" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "google_cal_id" TEXT,
    "undangan_type" "UndanganType" NOT NULL DEFAULT 'INTERNAL',
    "pengirim_external" TEXT,
    "kontak_external" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "undangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "undangan_penerima" (
    "id" TEXT NOT NULL,
    "undangan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sudah_baca" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "undangan_penerima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archives" (
    "id" TEXT NOT NULL,
    "surat_masuk_id" TEXT NOT NULL,
    "archived_by" TEXT NOT NULL,
    "server_location" TEXT,
    "bulan" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "archived_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "surat_masuk_id" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_timeline" (
    "id" TEXT NOT NULL,
    "surat_masuk_id" TEXT NOT NULL,
    "from_status" "DocumentStatus",
    "to_status" "DocumentStatus" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "surat_masuk_nomor_surat_key" ON "surat_masuk"("nomor_surat");

-- CreateIndex
CREATE INDEX "surat_masuk_current_status_idx" ON "surat_masuk"("current_status");

-- CreateIndex
CREATE INDEX "surat_masuk_created_by_idx" ON "surat_masuk"("created_by");

-- CreateIndex
CREATE INDEX "surat_masuk_nomor_surat_idx" ON "surat_masuk"("nomor_surat");

-- CreateIndex
CREATE INDEX "surat_masuk_document_type_idx" ON "surat_masuk"("document_type");

-- CreateIndex
CREATE INDEX "document_files_surat_masuk_id_idx" ON "document_files"("surat_masuk_id");

-- CreateIndex
CREATE INDEX "document_files_file_type_idx" ON "document_files"("file_type");

-- CreateIndex
CREATE INDEX "document_reviews_surat_masuk_id_idx" ON "document_reviews"("surat_masuk_id");

-- CreateIndex
CREATE INDEX "jadwal_direkturs_surat_masuk_id_idx" ON "jadwal_direkturs"("surat_masuk_id");

-- CreateIndex
CREATE INDEX "jadwal_direkturs_jadwal_kirim_idx" ON "jadwal_direkturs"("jadwal_kirim");

-- CreateIndex
CREATE INDEX "director_decisions_surat_masuk_id_idx" ON "director_decisions"("surat_masuk_id");

-- CreateIndex
CREATE INDEX "lembar_disposisi_surat_masuk_id_idx" ON "lembar_disposisi"("surat_masuk_id");

-- CreateIndex
CREATE UNIQUE INDEX "undangan_surat_masuk_id_key" ON "undangan"("surat_masuk_id");

-- CreateIndex
CREATE UNIQUE INDEX "undangan_penerima_undangan_id_user_id_key" ON "undangan_penerima"("undangan_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "archives_surat_masuk_id_key" ON "archives"("surat_masuk_id");

-- CreateIndex
CREATE INDEX "archives_bulan_tahun_idx" ON "archives"("bulan", "tahun");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_surat_masuk_id_idx" ON "audit_logs"("surat_masuk_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "status_timeline_surat_masuk_id_idx" ON "status_timeline"("surat_masuk_id");

-- AddForeignKey
ALTER TABLE "surat_masuk" ADD CONSTRAINT "surat_masuk_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_files" ADD CONSTRAINT "document_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_direkturs" ADD CONSTRAINT "jadwal_direkturs_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_direkturs" ADD CONSTRAINT "jadwal_direkturs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_decisions" ADD CONSTRAINT "director_decisions_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_decisions" ADD CONSTRAINT "director_decisions_director_id_fkey" FOREIGN KEY ("director_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembar_disposisi" ADD CONSTRAINT "lembar_disposisi_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembar_disposisi" ADD CONSTRAINT "lembar_disposisi_dari_id_fkey" FOREIGN KEY ("dari_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembar_disposisi" ADD CONSTRAINT "lembar_disposisi_ke_id_fkey" FOREIGN KEY ("ke_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "undangan" ADD CONSTRAINT "undangan_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "undangan_penerima" ADD CONSTRAINT "undangan_penerima_undangan_id_fkey" FOREIGN KEY ("undangan_id") REFERENCES "undangan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "undangan_penerima" ADD CONSTRAINT "undangan_penerima_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archives" ADD CONSTRAINT "archives_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archives" ADD CONSTRAINT "archives_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_timeline" ADD CONSTRAINT "status_timeline_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_timeline" ADD CONSTRAINT "status_timeline_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
