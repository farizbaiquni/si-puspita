"use client";

import {
  ArrowRight,
  FileText,
  Search,
  UploadCloud,
  LayoutDashboard,
  Phone,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  Clock,
  BookOpen,
  ClipboardList,
  Bell,
  ShieldCheck,
  FileSearch,
  FileBadge,
  Building2,
  LogIn,
  Eye,
  EyeOff,
  KeyRound,
  User,
} from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Beranda", hasDropdown: false, href: "#beranda" },
  { label: "SOP & Flowchart", hasDropdown: false, href: "#sop" },
  { label: "Formulir Pengajuan", hasDropdown: false, href: "#formulir" },
  { label: "Tracking Status", hasDropdown: false, href: "#tracking" },
  { label: "Kontak Layanan", hasDropdown: false, href: "#kontak" },
];

const STAKEHOLDERS = [
  "OPD Pemohon",
  "BPKAD Kendal",
  "Bagian Hukum",
  "Inspektorat",
  "TPUPPD",
  "PUPN",
];

const FITUR = [
  {
    icon: (
      <ClipboardList className="w-10 h-10 text-gray-700" strokeWidth={1.5} />
    ),
    title: "Formulir Pengajuan Online",
    desc: "OPD mengisi data pemohon, data piutang, dasar permohonan, dan riwayat penagihan secara digital. Nomor registrasi otomatis diterbitkan setelah submit.",
  },
  {
    icon: <UploadCloud className="w-10 h-10 text-gray-700" strokeWidth={1.5} />,
    title: "Unggah Dokumen Persyaratan",
    desc: "Upload SK Penetapan, BA Penagihan, BA Piutang Macet, dan dokumen pendukung lainnya dalam satu repositori digital yang aman dan mudah ditelusuri.",
  },
  {
    icon: <Search className="w-10 h-10 text-gray-700" strokeWidth={1.5} />,
    title: "Tracking Status Real-Time",
    desc: "Pantau posisi berkas tanpa perlu datang ke kantor. Input nomor registrasi untuk melihat status: Diterima, Diverifikasi, Proses Telaah, hingga Selesai.",
  },
  {
    icon: (
      <LayoutDashboard className="w-10 h-10 text-gray-700" strokeWidth={1.5} />
    ),
    title: "Panel Admin BPKAD",
    desc: "Petugas BPKAD dapat melihat daftar pengajuan masuk, memperbarui status, mengunggah hasil validasi, dan memantau log aktivitas dari satu dashboard.",
  },
];

const KEUNGGULAN = [
  {
    num: "1",
    title: "Proses Lebih Cepat & Terstandar",
    desc: "SOP dan flowchart terintegrasi menghubungkan urutan proses antar unit: OPD → BPKAD → Bagian Hukum → Inspektorat dengan standar waktu yang jelas.",
  },
  {
    num: "2",
    title: "Satu Pintu Layanan Digital",
    desc: "OPD tidak perlu bolak-balik antar unit. Ajukan permohonan, unggah dokumen, dan pantau status dari satu portal yang terintegrasi.",
  },
  {
    num: "3",
    title: "Transparan & Akuntabel",
    desc: "Semua dokumen tersimpan dalam repositori digital, mudah ditelusuri untuk keperluan audit, pemeriksaan, dan pelaporan.",
  },
];

const ALUR = [
  {
    icon: <BookOpen className="w-7 h-7 text-blue-600" strokeWidth={1.5} />,
    num: "01",
    title: "Baca SOP & Flowchart",
    desc: "Pahami alur dan kelengkapan dokumen yang dibutuhkan sebelum mengajukan permohonan.",
  },
  {
    icon: <ClipboardList className="w-7 h-7 text-blue-600" strokeWidth={1.5} />,
    num: "02",
    title: "Isi Formulir Pengajuan",
    desc: "Lengkapi identitas OPD, data piutang, dasar permohonan, dan unggah dokumen persyaratan.",
  },
  {
    icon: <FileBadge className="w-7 h-7 text-blue-600" strokeWidth={1.5} />,
    num: "03",
    title: "Terima Nomor Registrasi",
    desc: "Sistem menerbitkan nomor registrasi otomatis sebagai tanda berkas telah diterima.",
  },
  {
    icon: <Search className="w-7 h-7 text-blue-600" strokeWidth={1.5} />,
    num: "04",
    title: "Pantau Status Pengajuan",
    desc: "Gunakan nomor registrasi untuk memantau posisi berkas secara real-time tanpa perlu ke kantor.",
  },
];

const STATUS_LIST = [
  { label: "Diterima", color: "bg-blue-100 text-blue-700" },
  { label: "Diverifikasi", color: "bg-indigo-100 text-indigo-700" },
  { label: "Proses Telaah", color: "bg-yellow-100 text-yellow-700" },
  { label: "Proses Hukum", color: "bg-orange-100 text-orange-700" },
  { label: "Proses Inspektorat", color: "bg-purple-100 text-purple-700" },
  { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
];

const DOKUMEN_REQD = [
  "SK Penetapan Piutang",
  "BA Penagihan",
  "BA Piutang Macet",
  "Laporan Keuangan OPD",
  "Surat Permohonan Penghapusan",
  "Dokumen pendukung lainnya",
];

export default function SiPuspitaLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");
    if (!loginForm.username || !loginForm.password) {
      setLoginError("Username dan password wajib diisi.");
      return;
    }
    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      setLoginError("Username atau password salah. Silakan coba lagi.");
    }, 1200);
  };

  return (
    <div className="font-sans bg-white text-gray-900 overflow-x-hidden">
      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 font-bold text-[20px] text-gray-900 tracking-tight">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <span className="text-blue-600">SI</span> PUSPITA
              <div className="text-[10px] font-normal text-gray-400 leading-none -mt-0.5 tracking-wide">
                BPKAD KAB. KENDAL
              </div>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[14px] font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-1.5 text-[14px] font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Masuk
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors">
              Ajukan Sekarang
            </button>
          </div>

          <button
            className="lg:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-5 flex flex-col gap-4">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[15px] font-medium text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            <hr className="border-gray-100 my-1" />
            <button className="bg-blue-600 text-white text-[14px] font-semibold px-5 py-2.5 rounded-full w-fit">
              Ajukan Sekarang
            </button>
          </div>
        )}
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section id="beranda" className="bg-[#0c1428] text-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[12px] font-semibold px-4 py-1.5 rounded-full mb-6">
              <Building2 className="w-3.5 h-3.5" />
              BPKAD Kabupaten Kendal
            </div>
            <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-bold leading-[1.12] tracking-tight mb-6">
              Sistem Pengajuan Penghapusan Piutang Terintegrasi
            </h1>
            <p className="text-[16px] text-gray-400 leading-[1.75] mb-10 max-w-[500px]">
              SI PUSPITA memfasilitasi pengajuan penghapusan piutang daerah
              secara online, mengintegrasikan alur persetujuan antar OPD, BPKAD,
              Bagian Hukum, dan Inspektorat dalam satu platform digital.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-semibold px-7 py-3.5 rounded-full transition-colors">
                Ajukan Permohonan
              </button>
              <button className="border border-gray-600 hover:border-gray-400 text-white text-[15px] font-semibold px-7 py-3.5 rounded-full transition-colors">
                Lihat Panduan
              </button>
            </div>
          </div>

          {/* Right — status tracking mock */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-[300px] sm:w-[320px]">
              <div className="bg-[#162040] rounded-3xl p-6 border border-blue-900/50 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[13px] font-semibold text-white">
                    Status Pengajuan
                  </span>
                  <span className="text-[11px] text-blue-400 font-medium">
                    REG-2025-0042
                  </span>
                </div>

                {/* Timeline status */}
                <div className="flex flex-col gap-0">
                  {[
                    {
                      label: "Berkas Diterima",
                      done: true,
                      date: "10 Jun 2025",
                    },
                    {
                      label: "Verifikasi BPKAD",
                      done: true,
                      date: "13 Jun 2025",
                    },
                    { label: "Proses Telaah", done: true, date: "18 Jun 2025" },
                    {
                      label: "Proses Bagian Hukum",
                      done: false,
                      date: "Menunggu...",
                    },
                    { label: "Proses Inspektorat", done: false, date: "—" },
                    { label: "Selesai", done: false, date: "—" },
                  ].map((item, i, arr) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.done ? "bg-blue-600" : "bg-gray-700 border border-gray-600"}`}
                        >
                          {item.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Clock className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className={`w-px h-7 ${item.done ? "bg-blue-700" : "bg-gray-700"}`}
                          />
                        )}
                      </div>
                      <div className="pb-1">
                        <p
                          className={`text-[13px] font-semibold leading-tight ${item.done ? "text-white" : "text-gray-500"}`}
                        >
                          {item.label}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {item.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* OPD info */}
                <div className="mt-5 bg-[#0c1428] rounded-2xl p-4 border border-blue-900/30">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Pemohon
                  </p>
                  <div className="flex justify-between">
                    {[
                      ["OPD", "Dinas Kesehatan"],
                      ["Total Piutang", "Rp 142,5 Jt"],
                      ["Tahun", "2022"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[10px] text-gray-500">{k}</p>
                        <p className="text-[12px] font-bold text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ TERINTEGRASI DENGAN ══════════════════ */}
      <section className="border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="inline-flex items-center border border-gray-300 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[13px] font-medium text-gray-600">
              Terintegrasi dengan Unit Kerja
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {STAKEHOLDERS.map((s, i) => (
              <span
                key={i}
                className="text-[13px] font-bold text-gray-400 tracking-wide"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FITUR UTAMA ══════════════════ */}
      <section id="formulir" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-[280px_1fr] gap-16 xl:gap-24">
            <div className="flex flex-col justify-start">
              <h2 className="text-[36px] sm:text-[40px] font-bold leading-[1.15] text-gray-900 mb-4">
                Fitur Layanan SI PUSPITA
              </h2>
              <p className="text-[14px] text-gray-500 leading-[1.75] mb-8">
                Dirancang untuk menyederhanakan proses penghapusan piutang
                daerah yang sebelumnya manual dan tersebar.
              </p>
              <a
                href="#formulir"
                className="inline-flex items-center gap-2.5 w-fit border border-gray-800 text-gray-900 text-[14px] font-semibold px-5 py-2.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
                Mulai Pengajuan
              </a>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-14">
              {FITUR.map((f) => (
                <div key={f.title}>
                  <div className="mb-4">{f.icon}</div>
                  <h3 className="text-[17px] font-bold text-gray-900 mb-3 leading-snug">
                    {f.title}
                  </h3>
                  <p className="text-[14px] text-gray-500 leading-[1.75] mb-5">
                    {f.desc}
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:border-blue-500 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ KEUNGGULAN ══════════════════ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[36px] sm:text-[44px] font-bold text-center text-gray-900 leading-[1.2] mb-16">
            Mengapa SI PUSPITA Lebih Efektif
            <br className="hidden sm:block" /> dari Proses Manual?
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">
            <div className="flex flex-col gap-4">
              {KEUNGGULAN.map((k) => (
                <div
                  key={k.num}
                  className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-[12px] font-bold text-white">
                        {k.num}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-blue-700">
                      {k.title}
                    </h3>
                  </div>
                  <p className="text-[14px] text-gray-500 leading-[1.7] pl-10">
                    {k.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Dokumen requirements visual */}
            <div className="flex justify-center">
              <div className="relative w-[320px] sm:w-[360px]">
                <div className="bg-[#0c1428] rounded-3xl p-6 border border-blue-900/40 shadow-xl">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-[14px] font-semibold text-white">
                      Dokumen Persyaratan
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {DOKUMEN_REQD.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-[#162040] rounded-xl px-4 py-2.5 border border-blue-900/30"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-[13px] text-gray-300">{doc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-blue-900/30 flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">
                      Format diterima
                    </span>
                    <div className="flex gap-2">
                      {["PDF", "DOCX", "JPG"].map((fmt) => (
                        <span
                          key={fmt}
                          className="text-[11px] font-bold bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-full"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-emerald-500 rounded-2xl px-4 py-2.5 shadow-lg">
                  <p className="text-[12px] font-bold text-white leading-tight">
                    Tersimpan Digital
                  </p>
                  <p className="text-[11px] text-emerald-100">
                    Mudah ditelusuri
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ ALUR PENGAJUAN ══════════════════ */}
      <section id="sop" className="py-20 sm:py-28 bg-[#0c1428] text-white">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-[36px] sm:text-[46px] font-bold mb-5 leading-[1.15]">
            Alur Pengajuan Penghapusan Piutang
          </h2>
          <p className="text-[15px] text-gray-400 leading-[1.75] max-w-[480px] mx-auto mb-16">
            Proses pengajuan yang terstandar dan terintegrasi antara OPD, BPKAD,
            Bagian Hukum, dan Inspektorat Kabupaten Kendal.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14 relative">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px border-t border-dashed border-blue-900" />

            {ALUR.map((step) => (
              <div
                key={step.num}
                className="flex flex-col items-center gap-4 relative z-10"
              >
                <div className="w-[64px] h-[64px] rounded-2xl bg-[#162040] border border-blue-800/50 flex items-center justify-center mb-2">
                  {step.icon}
                </div>
                <h3 className="text-[15px] font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-[13px] text-gray-400 leading-[1.7] max-w-[200px]">
                  {step.desc}
                </p>
                <div className="w-9 h-9 rounded-full border border-blue-800 flex items-center justify-center mt-1">
                  <span className="text-[12px] font-semibold text-blue-400">
                    {step.num}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Status pills */}
          <div className="mb-12">
            <p className="text-[13px] text-gray-500 mb-4">
              Status pengajuan yang dapat dipantau:
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {STATUS_LIST.map((s) => (
                <span
                  key={s.label}
                  className={`text-[13px] font-semibold px-4 py-1.5 rounded-full ${s.color}`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-semibold px-9 py-4 rounded-full transition-colors">
            Mulai Pengajuan Sekarang
          </button>
        </div>
      </section>

      {/* ══════════════════ KONTAK ══════════════════ */}
      <section id="kontak" className="py-20 sm:py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-[34px] sm:text-[40px] font-bold text-gray-900 leading-[1.2] mb-4">
                Kontak Layanan SI PUSPITA
              </h2>
              <p className="text-[15px] text-gray-500 leading-[1.75] mb-8">
                Hubungi Admin BPKAD Kabupaten Kendal untuk informasi lebih
                lanjut mengenai proses pengajuan penghapusan piutang daerah.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    icon: <Phone className="w-5 h-5 text-blue-600" />,
                    label: "Telepon",
                    val: "(0294) 381124",
                  },
                  {
                    icon: <Bell className="w-5 h-5 text-blue-600" />,
                    label: "Jam Layanan",
                    val: "Senin–Jumat, 08.00–16.00 WIB",
                  },
                  {
                    icon: <Building2 className="w-5 h-5 text-blue-600" />,
                    label: "Unit Pengelola",
                    val: "Sub Bidang Akuntansi & Pelaporan, BPKAD Kab. Kendal",
                  },
                ].map(({ icon, label, val }) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl px-5 py-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-[15px] font-semibold text-gray-800 mt-0.5">
                        {val}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="text-[20px] font-bold text-gray-900 mb-6">
                Pertanyaan Umum (FAQ)
              </h3>
              <div className="flex flex-col gap-4">
                {[
                  {
                    q: "Siapa yang dapat mengajukan permohonan?",
                    a: "OPD (Organisasi Perangkat Daerah) di lingkungan Pemerintah Kabupaten Kendal yang memiliki piutang daerah yang telah memenuhi kriteria penghapusan.",
                  },
                  {
                    q: "Berapa lama proses penghapusan piutang?",
                    a: "Setiap tahap memiliki standar waktu proses. OPD dapat memantau perkembangan secara real-time melalui fitur tracking status.",
                  },
                  {
                    q: "Dokumen apa saja yang wajib diunggah?",
                    a: "SK Penetapan, BA Penagihan, BA Piutang Macet, Laporan Keuangan OPD, Surat Permohonan, dan dokumen pendukung lainnya sesuai SOP.",
                  },
                  {
                    q: "Bagaimana cara mengetahui nomor registrasi?",
                    a: "Nomor registrasi diterbitkan otomatis oleh sistem setelah formulir pengajuan berhasil di-submit.",
                  },
                ].map(({ q, a }, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-2xl px-5 py-4"
                  >
                    <p className="text-[14px] font-bold text-gray-900 mb-2">
                      {q}
                    </p>
                    <p className="text-[13px] text-gray-500 leading-[1.7]">
                      {a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="bg-[#080d1c] text-gray-500 py-10 border-t border-blue-950">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 font-bold text-[18px] text-white mb-1.5">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                  <FileSearch className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <span>
                  <span className="text-blue-400">SI</span> PUSPITA
                </span>
              </div>
              <p className="text-[12px] text-gray-500">
                Sistem Pengajuan Penghapusan Piutang Terintegrasi
                <br />
                BPKAD Kabupaten Kendal
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px]">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="hover:text-white transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
          <hr className="border-blue-950 my-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]">
            <p>
              © {new Date().getFullYear()} BPKAD Kabupaten Kendal. Hak Cipta
              Dilindungi.
            </p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Ketentuan Layanan
              </a>
            </div>
          </div>
        </div>
      </footer>
      {/* ══════════════════ MODAL LOGIN ══════════════════ */}
      {/* ══════════ MODAL LOGIN ══════════ */}
      {loginOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{
            backgroundColor: "rgba(8,13,28,0.7)",
            backdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLoginOpen(false);
              setLoginError("");
              setLoginForm({ username: "", password: "" });
            }
          }}
        >
          <div className="bg-white w-full sm:max-w-[420px] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
            {/* Top accent line */}
            <div className="h-[3px] bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />

            {/* Content */}
            <div className="px-8 pt-8 pb-9">
              {/* Header row */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FileSearch
                        className="w-3.5 h-3.5 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[12px] font-bold text-blue-600 tracking-widest uppercase">
                      SI PUSPITA
                    </span>
                  </div>
                  <h2 className="text-[24px] font-bold text-gray-900 leading-tight tracking-tight">
                    Selamat datang
                  </h2>
                  <p className="text-[13px] text-gray-400 mt-1">
                    Masuk untuk mengakses sistem
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLoginOpen(false);
                    setLoginError("");
                    setLoginForm({ username: "", password: "" });
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors mt-0.5 shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {/* Username field */}
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="Masukkan username Anda"
                    value={loginForm.username}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, username: e.target.value });
                      setLoginError("");
                    }}
                    className="w-full px-4 py-3.5 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl placeholder-gray-300 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                  />
                </div>

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-[12px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
                    >
                      Lupa password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => {
                        setLoginForm({
                          ...loginForm,
                          password: e.target.value,
                        });
                        setLoginError("");
                      }}
                      className="w-full px-4 py-3.5 pr-12 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl placeholder-gray-300 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {loginError && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-500 text-[13px] px-4 py-3 rounded-2xl">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <X className="w-2.5 h-2.5 text-white" />
                    </div>
                    {loginError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 text-white text-[15px] font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {loginLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Masuk <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider + note */}
              <div className="flex items-center gap-3 mt-7">
                <div className="flex-1 h-px bg-gray-100" />
                <p className="text-[11px] text-gray-300 font-medium shrink-0">
                  BPKAD Kabupaten Kendal
                </p>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
