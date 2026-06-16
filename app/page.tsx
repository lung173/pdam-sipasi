/**
 * @file app/page.tsx
 * @description Halaman utama (Landing Page) aplikasi SIPAS PDAM. Berisi informasi singkat sistem dan tombol untuk masuk ke halaman login.
 * @location Ditampilkan saat pengguna mengunjungi URL utama ("/") sebelum login.
 */
import Link from "next/link";
import {
  ArrowRight,
  Droplets,
  Mail,
  Folder,
  FileSignature,
  Phone,
  Globe,
  Share2,
  AtSign,
  MapPin,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Background Glow Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-200/40 dark:bg-sky-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[50%] bg-cyan-200/40 dark:bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/40 dark:border-slate-800/40 shadow-sm transition-all duration-300">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-cyan-500 tracking-tight dark:from-sky-400 dark:to-cyan-300">
              SIPAS PDAM
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600 dark:text-slate-300">
            <a className="text-sky-600 dark:text-sky-400 border-b-2 border-sky-500 pb-1" href="#">Beranda</a>
            <a className="hover:text-sky-500 transition-colors" href="#features">Fitur</a>
            <a className="hover:text-sky-500 transition-colors" href="#about">Tentang Kami</a>
          </div>

          <div className="flex items-center">
            <Link
              href="/login"
              className="bg-sky-600 text-white dark:bg-sky-500 px-6 py-2.5 rounded-full font-semibold hover:bg-sky-700 dark:hover:bg-sky-600 transition-all shadow-md active:scale-95 text-base"
            >
              Masuk Sistem
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-20 flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 relative z-10 w-full">
            <div className="space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50/80 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400 font-semibold text-sm uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                Solusi Administrasi Modern
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Portal Administrasi Internal PDAM
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                Platform terintegrasi untuk pengelolaan persuratan, arsip digital, dan alur kerja operasional khusus pegawai PDAM.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/login"
                  className="bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-600 px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-sky-500/20"
                >
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="relative w-full flex justify-center lg:justify-end">
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-sky-300/20 dark:bg-sky-700/10 blur-[100px] rounded-full"></div>
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-300/20 dark:bg-cyan-700/10 blur-[80px] rounded-full"></div>
              <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 md:p-6 rounded-[32px] border border-white/40 dark:border-slate-800/40 shadow-2xl relative z-10 lg:rotate-2 hover:rotate-0 transition-transform duration-500 max-w-md md:max-w-xl">
                <img
                  alt="Dashboard Preview"
                  className="rounded-2xl w-full h-auto object-cover shadow-inner bg-slate-100 dark:bg-slate-800"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0P7d6Rw9gpHNrKO-FulFWDFSEp66d7Q2AwNKCmSGKLSFFPsreMmzlyWbrUqo_bZSNFjzrFwiu8jIDoHHZwD9JIGIQke7Ri5eR9vcs3CG644r3v6RubCtspDSBjaszHl7oLCId5Y3uxORIr3Y_MaMb6UhZEIsK4MJSfUnf7klpvYySeZIreP5en7KXww1A2qLhaTbTl0DadgyU9TCc2N_R0ZVD7LIGjvxPMEmWHoaJ_jLeQJUlDf1VNMS3_ntxNs03hf6dFIOT4TxF"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-slate-900/40 border-y border-slate-200/50 dark:border-slate-800/50">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Modul Kerja Internal
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
                Dirancang untuk mempermudah birokrasi dan mempercepat alur kerja administratif perusahaan daerah.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-50 dark:bg-slate-900 p-8 md:p-10 rounded-[24px] border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-sky-100 dark:bg-sky-950/50 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Manajemen Surat Internal
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  Sistem surat masuk dan keluar yang tersentralisasi dengan pelacakan status real-time, memastikan tidak ada dokumen yang terlewat.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="bg-slate-50 dark:bg-slate-900 p-8 md:p-10 rounded-[24px] border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-950/50 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Folder className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Arsip Kedinasan
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  Pencarian dokumen instan dengan sistem pengindeksan cerdas dan penyimpanan awan aman terenkripsi tingkat tinggi.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="bg-slate-50 dark:bg-slate-900 p-8 md:p-10 rounded-[24px] border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileSignature className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  E-Signature Pejabat
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                  Percepat alur persetujuan dengan integrasi tanda tangan digital yang sah secara hukum sesuai regulasi nasional.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-sky-600 to-cyan-500 p-12 md:p-20 text-center shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                  Siap Melakukan Transformasi Digital?
                </h2>
                <p className="text-sky-100 text-base md:text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
                  Bergabunglah dengan puluhan unit PDAM lainnya yang telah meningkatkan produktivitas administrasi hingga 80% dengan SIPAS.
                </p>
                <div className="pt-4">
                  <Link
                    href="/login"
                    className="bg-white text-sky-700 hover:bg-slate-50 px-10 py-5 rounded-2xl font-bold text-lg inline-block hover:scale-[1.03] active:scale-95 transition-all shadow-xl"
                  >
                    Masuk ke Portal Pegawai
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="about" className="w-full py-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              SIPAS PDAM
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base">
              Sistem Informasi Pengelolaan Alur Surat Terpadu untuk efisiensi utilitas publik.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-lg">Navigasi</h4>
            <ul className="space-y-2 text-base text-slate-500 dark:text-slate-400">
              <li><a className="hover:text-sky-500 transition-colors" href="#">Beranda</a></li>
              <li><a className="hover:text-sky-500 transition-colors" href="#features">Fitur</a></li>
              <li><a className="hover:text-sky-500 transition-colors" href="#about">Tentang Kami</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-lg">Dukungan</h4>
            <ul className="space-y-2 text-base text-slate-500 dark:text-slate-400">
              <li><a className="hover:text-sky-500 transition-colors" href="#">Panduan Pengguna</a></li>
              <li><a className="hover:text-sky-500 transition-colors" href="#">Kebijakan Privasi</a></li>
              <li><a className="hover:text-sky-500 transition-colors" href="#">Syarat & Ketentuan</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 dark:text-white text-lg">Kontak</h4>
            <ul className="space-y-3 text-base text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-sky-500 flex-shrink-0" />
                <span>(021) 1234-5678</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-sky-500 flex-shrink-0" />
                <span>info@sipaspdam.co.id</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-sky-500 flex-shrink-0" />
                <span>Jakarta, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-8 mt-16 pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-base text-slate-500 dark:text-slate-400 text-center sm:text-left">
            &copy; {new Date().getFullYear()} SIPAS PDAM. Sistem Informasi Pengelolaan Alur Surat Terpadu.
          </p>
          <div className="flex gap-6 text-slate-400">
            <a className="hover:text-sky-500 transition-colors" href="#"><Globe className="w-5 h-5" /></a>
            <a className="hover:text-sky-500 transition-colors" href="#"><Share2 className="w-5 h-5" /></a>
            <a className="hover:text-sky-500 transition-colors" href="#"><AtSign className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
