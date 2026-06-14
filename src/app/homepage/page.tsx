"use client";

import type { FormEvent } from "react";
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
    icon: <ClipboardList strokeWidth={1.8} />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    accent: "from-blue-500 to-blue-600",
    badge: "OPD",
    title: "Formulir Pengajuan Online",
    desc: "OPD mengisi data pemohon, data piutang, dasar permohonan, dan riwayat penagihan secara digital. Nomor registrasi otomatis diterbitkan setelah submit.",
    points: [
      "Wizard langkah demi langkah",
      "Validasi otomatis",
      "Nomor registrasi instan",
    ],
  },
  {
    icon: <UploadCloud strokeWidth={1.8} />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    accent: "from-violet-500 to-violet-600",
    badge: "Dokumen",
    title: "Unggah Dokumen Persyaratan",
    desc: "Upload SK Penetapan, BA Penagihan, BA Piutang Macet, dan dokumen pendukung lainnya dalam satu repositori digital yang aman dan mudah ditelusuri.",
    points: [
      "Format PDF tervalidasi",
      "Repositori terpusat",
      "Mudah ditelusuri saat audit",
    ],
  },
  {
    icon: <Search strokeWidth={1.8} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    accent: "from-emerald-500 to-emerald-600",
    badge: "Real-time",
    title: "Tracking Status Real-Time",
    desc: "Pantau posisi berkas tanpa perlu datang ke kantor. Input nomor registrasi untuk melihat status: Diterima, Diverifikasi, Proses Telaah, hingga Selesai.",
    points: [
      "6 tahap termonitor",
      "Tanpa perlu ke kantor",
      "Notifikasi perubahan status",
    ],
  },
  {
    icon: <LayoutDashboard strokeWidth={1.8} />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    accent: "from-amber-500 to-amber-600",
    badge: "Admin",
    title: "Panel Admin BPKAD",
    desc: "Petugas BPKAD dapat melihat daftar pengajuan masuk, memperbarui status, mengunggah hasil validasi, dan memantau log aktivitas dari satu dashboard.",
    points: ["Dashboard terpadu", "Log aktivitas lengkap", "Multi-role akses"],
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
    icon: <BookOpen className="h-7 w-7 text-blue-600" strokeWidth={1.5} />,
    num: "01",
    title: "Baca SOP & Flowchart",
    desc: "Pahami alur dan kelengkapan dokumen yang dibutuhkan sebelum mengajukan permohonan.",
  },
  {
    icon: <ClipboardList className="h-7 w-7 text-blue-600" strokeWidth={1.5} />,
    num: "02",
    title: "Isi Formulir Pengajuan",
    desc: "Lengkapi identitas OPD, data piutang, dasar permohonan, dan unggah dokumen persyaratan.",
  },
  {
    icon: <FileBadge className="h-7 w-7 text-blue-600" strokeWidth={1.5} />,
    num: "03",
    title: "Terima Nomor Registrasi",
    desc: "Sistem menerbitkan nomor registrasi otomatis sebagai tanda berkas telah diterima.",
  },
  {
    icon: <Search className="h-7 w-7 text-blue-600" strokeWidth={1.5} />,
    num: "04",
    title: "Pantau Status Pengajuan",
    desc: "Gunakan nomor registrasi untuk memantau posisi berkas secara real-time tanpa perlu ke kantor.",
  },
];

const STATUS_LIST = [
  {
    label: "Diterima",
    unit: "Sistem / OPD",
    desc: "Berkas pengajuan berhasil dikirim dan nomor registrasi diterbitkan.",
    dot: "bg-blue-500",
    track: "bg-blue-100",
    text: "text-blue-700",
    icon: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Diverifikasi",
    unit: "BPKAD",
    desc: "Tim BPKAD memeriksa kelengkapan dan keabsahan dokumen.",
    dot: "bg-indigo-500",
    track: "bg-indigo-100",
    text: "text-indigo-700",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    label: "Proses Telaah",
    unit: "BPKAD",
    desc: "Analisis mendalam atas data piutang dan kelayakan penghapusan.",
    dot: "bg-amber-500",
    track: "bg-amber-100",
    text: "text-amber-700",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    label: "Proses Hukum",
    unit: "Bagian Hukum",
    desc: "Kajian aspek hukum dan penyusunan rekomendasi penghapusan.",
    dot: "bg-orange-500",
    track: "bg-orange-100",
    text: "text-orange-700",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  },
  {
    label: "Proses Inspektorat",
    unit: "Inspektorat",
    desc: "Audit dan pengawasan internal sebelum keputusan akhir diterbitkan.",
    dot: "bg-purple-500",
    track: "bg-purple-100",
    text: "text-purple-700",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    label: "Selesai",
    unit: "Pimpinan",
    desc: "Surat keputusan penghapusan piutang diterbitkan dan disahkan.",
    dot: "bg-emerald-500",
    track: "bg-emerald-100",
    text: "text-emerald-700",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
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

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
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
    <div className="overflow-x-hidden bg-white font-sans text-gray-900">
      {/* ══════════════════ NAVBAR ══════════════════ */}
      <header className="sticky top-0 z-50">
        {/* Top bar institusi */}
        <div className="bg-[#1a4e8f] text-white">
          <div className="mx-auto flex h-10 max-w-[1200px] items-center justify-between px-6">
            <div className="flex items-center gap-3 text-[11px] text-blue-100">
              <span className="font-semibold">Pemerintah Kabupaten Kendal</span>
              <span className="h-3 w-px bg-blue-400/50" />
              <span>Badan Pengelolaan Keuangan & Aset Daerah</span>
            </div>
            <div className="hidden items-center gap-4 text-[11px] text-blue-200 sm:flex">
              <a
                href="#kontak"
                className="flex items-center gap-1.5 transition-colors hover:text-white"
              >
                <svg
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                (0294) 381124
              </a>
              <span className="h-3 w-px bg-blue-400/50" />
              <span className="flex items-center gap-1.5">
                <svg
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                Senin–Jumat 08.00–16.00 WIB
              </span>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#1a4e8f] shadow-sm">
                <FileSearch className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div className="leading-tight">
                <div className="text-[16px] leading-none font-extrabold tracking-tight text-[#1a4e8f]">
                  <span className="text-blue-500">SI</span> PUSPITA
                </div>
                <div className="mt-0.5 text-[10px] leading-none font-medium text-gray-400">
                  BPKAD Kab. Kendal
                </div>
              </div>
            </div>

            {/* Desktop links */}
            <div className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="rounded-lg px-3.5 py-2 text-[13.5px] font-medium text-gray-600 transition-colors hover:bg-blue-50 hover:text-[#1a4e8f]"
                >
                  {label}
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden items-center gap-2.5 lg:flex">
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#1a4e8f] px-4 py-2 text-[13.5px] font-semibold text-[#1a4e8f] transition-colors hover:bg-blue-50"
              >
                <LogIn className="h-3.5 w-3.5" /> Masuk
              </button>
              <button className="rounded-lg bg-[#1a4e8f] px-5 py-2 text-[13.5px] font-semibold text-white shadow-sm transition-colors hover:bg-[#153e78]">
                Ajukan Sekarang
              </button>
            </div>

            <button
              className="p-2 text-gray-600 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {mobileOpen && (
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-6 py-5 lg:hidden">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="py-1 text-[15px] font-medium text-gray-700"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))}
              <hr className="my-1 border-gray-100" />
              <button className="w-fit rounded-lg bg-[#1a4e8f] px-5 py-2.5 text-[14px] font-semibold text-white">
                Ajukan Sekarang
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section
        id="beranda"
        className="relative flex min-h-[480px] flex-col justify-end overflow-hidden bg-[#1a4e8f] text-white"
      >
        {/* Background pattern — subtle grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2d5e]/90 via-[#1a4e8f]/60 to-transparent" />

        {/* Accent shapes */}
        <div className="absolute top-0 right-0 h-[400px] w-[600px] rounded-bl-full bg-gradient-to-bl from-blue-400/20 to-transparent" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[400px] rounded-tr-full bg-gradient-to-tr from-blue-900/40 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1200px] px-6 pt-14 pb-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_380px]">
            {/* Kiri — konten utama */}
            <div>
              {/* Eyebrow */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/15 backdrop-blur-sm">
                  <FileSearch className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[12px] leading-none font-bold tracking-wide text-yellow-300 uppercase">
                    Selamat Datang di
                  </div>
                  <div className="mt-0.5 text-[14px] leading-tight font-extrabold text-white">
                    Portal SI PUSPITA — BPKAD Kabupaten Kendal
                  </div>
                </div>
              </div>

              <h1 className="mb-4 text-[32px] leading-[1.1] font-extrabold tracking-tight sm:text-[42px] lg:text-[48px]">
                Sistem Pengajuan
                <br />
                <span className="text-yellow-300">Penghapusan Piutang</span>
                <br />
                Terintegrasi
              </h1>
              <p className="mb-7 max-w-[500px] text-[14px] leading-[1.8] text-blue-100">
                Layanan digital untuk seluruh OPD Kabupaten Kendal — lebih
                cepat, transparan, dan terintegrasi dengan BPKAD, Bagian Hukum,
                serta Inspektorat.
              </p>

              {/* Search bar */}
              <div className="flex max-w-[560px] flex-col gap-2.5 sm:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-xl">
                  <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari informasi atau lacak nomor registrasi…"
                    className="flex-1 bg-transparent text-[13.5px] text-gray-700 outline-none placeholder:text-gray-400"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-[13.5px] font-bold whitespace-nowrap text-[#0f2d5e] shadow-xl transition-all hover:bg-yellow-300">
                  <Search className="h-4 w-4" /> Cari
                </button>
              </div>

              {/* Quick links */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { label: "Ajukan Permohonan", href: "#formulir" },
                  { label: "SOP & Flowchart", href: "#sop" },
                  { label: "Lacak Status Berkas", href: "#tracking" },
                  { label: "Kontak Layanan", href: "#kontak" },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25"
                  >
                    {label} <ArrowRight className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>

            {/* Kanan — mockup status pengajuan */}
            <div className="hidden items-start justify-end pt-2 lg:flex">
              <div className="w-[360px] overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-white/10 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-600 bg-[#1a4e8f]">
                      <FileSearch
                        className="h-3.5 w-3.5 text-white"
                        strokeWidth={2}
                      />
                    </div>
                    <span className="text-[13px] font-bold text-white">
                      Status Pengajuan
                    </span>
                  </div>
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/15 px-2.5 py-1 font-mono text-[10px] font-bold text-yellow-300">
                    REG-2025-0042
                  </span>
                </div>

                {/* Timeline */}
                <div className="flex flex-col gap-0 px-5 py-4">
                  {[
                    {
                      label: "Berkas Diterima",
                      done: true,
                      date: "10 Jun 2025",
                      unit: "Sistem",
                    },
                    {
                      label: "Verifikasi BPKAD",
                      done: true,
                      date: "13 Jun 2025",
                      unit: "BPKAD",
                    },
                    {
                      label: "Proses Telaah",
                      done: true,
                      date: "18 Jun 2025",
                      unit: "BPKAD",
                    },
                    {
                      label: "Proses Bagian Hukum",
                      done: false,
                      date: "Menunggu…",
                      unit: "Bag. Hukum",
                    },
                    {
                      label: "Proses Inspektorat",
                      done: false,
                      date: "—",
                      unit: "Inspektorat",
                    },
                    {
                      label: "Selesai",
                      done: false,
                      date: "—",
                      unit: "Pimpinan",
                    },
                  ].map((item, i, arr) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="flex flex-shrink-0 flex-col items-center">
                        <div
                          className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                            item.done
                              ? "bg-white shadow-sm"
                              : i === arr.findIndex((x) => !x.done)
                                ? "bg-amber-400 shadow-sm"
                                : "border border-white/20 bg-white/10"
                          }`}
                        >
                          {item.done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#1a4e8f]" />
                          ) : i === arr.findIndex((x) => !x.done) ? (
                            <Clock className="h-3 w-3 text-white" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-white/30" />
                          )}
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className={`h-6 w-px ${item.done ? "bg-white/40" : "bg-white/10"}`}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pb-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-[12.5px] leading-tight font-semibold ${item.done ? "text-white" : i === arr.findIndex((x) => !x.done) ? "text-yellow-300" : "text-white/35"}`}
                          >
                            {item.label}
                          </p>
                          <span
                            className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${item.done ? "bg-white/15 text-white/70" : "bg-white/5 text-white/25"}`}
                          >
                            {item.unit}
                          </span>
                        </div>
                        <p
                          className={`mt-0.5 text-[10.5px] ${item.done ? "text-blue-200" : i === arr.findIndex((x) => !x.done) ? "text-yellow-400/80" : "text-white/25"}`}
                        >
                          {item.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info pemohon */}
                <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-black/20 p-3.5">
                  <p className="mb-2 text-[9px] font-bold tracking-widest text-white/40 uppercase">
                    Pemohon
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["OPD", "Dinas Kesehatan"],
                      ["Piutang", "Rp 142,5 Jt"],
                      ["Tahun", "2022"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[9px] text-white/35">{k}</p>
                        <p className="text-[11px] leading-tight font-bold text-white/85">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-[#0f2d5e]/80 backdrop-blur-sm">
          <div className="mx-auto max-w-[1200px] px-6 py-4">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-2">
              {[
                { num: "24+", label: "OPD Terdaftar" },
                { num: "100%", label: "Proses Digital" },
                { num: "6", label: "Tahap Verifikasi" },
                { num: "Real-time", label: "Pemantauan Status" },
              ].map(({ num, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="text-[18px] leading-none font-extrabold text-yellow-300">
                    {num}
                  </span>
                  <span className="max-w-[90px] text-[12px] leading-snug text-blue-200">
                    {label}
                  </span>
                  <span className="ml-2.5 hidden h-6 w-px bg-white/10 last:hidden" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ TERINTEGRASI DENGAN ══════════════════ */}
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="mb-6 inline-flex items-center rounded-full border border-gray-300 px-4 py-1.5">
            <span className="text-[13px] font-medium text-gray-600">
              Terintegrasi dengan Unit Kerja
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {STAKEHOLDERS.map((s, i) => (
              <span
                key={i}
                className="text-[13px] font-bold tracking-wide text-gray-400"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FITUR UTAMA ══════════════════ */}
      <section id="formulir" className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          {/* Heading */}
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-blue-600 uppercase">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Layanan Digital
              </div>
              <h2 className="text-[28px] leading-[1.15] font-extrabold text-[#0f2d5e] sm:text-[34px]">
                Fitur Layanan
                <br className="hidden sm:block" />
                <span className="text-[#2563eb]"> SI PUSPITA</span>
              </h2>
            </div>
            <p className="max-w-[320px] text-[14px] leading-[1.75] text-gray-500 sm:text-right">
              Dirancang untuk menyederhanakan proses penghapusan piutang daerah
              yang sebelumnya manual dan tersebar.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FITUR.map((f, i) => (
              <div
                key={f.title}
                className={`group relative flex flex-col rounded-xl border ${f.border} cursor-default overflow-hidden bg-white shadow-sm transition-all duration-300 hover:shadow-lg`}
              >
                {/* Accent top bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${f.accent}`} />

                <div className="flex flex-1 flex-col p-5">
                  {/* Icon + badge row */}
                  <div className="mb-5 flex items-start justify-between">
                    <div
                      className={`h-12 w-12 rounded-xl ${f.bg} ${f.border} flex flex-shrink-0 items-center justify-center border transition-transform duration-300 group-hover:scale-105`}
                    >
                      <span className={`h-6 w-6 ${f.color}`}>{f.icon}</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${f.bg} ${f.color} border ${f.border} tracking-wide uppercase`}
                    >
                      {f.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-[15px] leading-snug font-bold text-[#0f2d5e]">
                    {f.title}
                  </h3>

                  {/* Desc */}
                  <p className="mb-4 flex-1 text-[13px] leading-[1.7] text-gray-500">
                    {f.desc}
                  </p>

                  {/* Key points */}
                  <ul className="mb-5 flex flex-col gap-1.5">
                    {f.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-2 text-[12px] text-gray-600"
                      >
                        <svg
                          className={`h-3.5 w-3.5 flex-shrink-0 ${f.color}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href="#"
                    className={`inline-flex items-center gap-2 text-[12.5px] font-semibold ${f.color} mt-auto hover:underline`}
                  >
                    Pelajari lebih lanjut
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Hover glow background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${f.accent} pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-[0.03]`}
                />
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="#formulir"
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#1a4e8f] px-7 py-3 text-[14px] font-semibold text-white shadow-md transition-all hover:bg-[#153e78]"
            >
              Mulai Pengajuan Sekarang
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#sop"
              className="flex items-center gap-1.5 text-[14px] font-medium text-gray-500 transition-colors hover:text-[#1a4e8f]"
            >
              Lihat SOP <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════ KEUNGGULAN ══════════════════ */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="mb-8 text-center text-[28px] leading-[1.2] font-bold text-gray-900 sm:text-[36px]">
            Mengapa SI PUSPITA Lebih Efektif
            <br className="hidden sm:block" /> dari Proses Manual?
          </h2>

          <div className="grid items-center gap-12 lg:grid-cols-2 xl:gap-20">
            <div className="flex flex-col gap-4">
              {KEUNGGULAN.map((k) => (
                <div
                  key={k.num}
                  className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm"
                >
                  <div className="mb-2.5 flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
                      <span className="text-[12px] font-bold text-white">
                        {k.num}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-blue-700">
                      {k.title}
                    </h3>
                  </div>
                  <p className="pl-10 text-[14px] leading-[1.7] text-gray-500">
                    {k.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Dokumen requirements visual */}
            <div className="flex justify-center">
              <div className="relative w-[320px] sm:w-[360px]">
                <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl">
                  <div className="mb-5 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <span className="text-[14px] font-semibold text-[#0f2d5e]">
                      Dokumen Persyaratan
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {DOKUMEN_REQD.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-blue-100 bg-[#f0f6ff] px-4 py-2.5"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                        <span className="text-[13px] text-[#1a3a6e]">
                          {doc}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-blue-100 pt-4">
                    <span className="text-[12px] text-[#4a6fa5]">
                      Format diterima
                    </span>
                    <div className="flex gap-2">
                      {["PDF", "DOCX", "JPG"].map((fmt) => (
                        <span
                          key={fmt}
                          className="rounded-full bg-blue-600/20 px-2.5 py-1 text-[11px] font-bold text-blue-400"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 rounded-2xl bg-emerald-500 px-4 py-2.5 shadow-lg">
                  <p className="text-[12px] leading-tight font-bold text-white">
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
      <section id="sop" className="bg-[#f7faff] py-14 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          {/* ── Heading ── */}
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[12px] font-semibold text-blue-600 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              Proses Terstandar & Terintegrasi
            </div>
            <h2 className="text-[32px] leading-[1.15] font-bold text-[#0f2d5e] sm:text-[42px]">
              Alur Pengajuan
              <span className="text-[#2563eb]"> Penghapusan Piutang</span>
            </h2>
            <p className="mx-auto mt-3 max-w-[480px] text-[15px] leading-[1.8] text-[#4a6fa5]">
              Empat langkah terstandar menghubungkan OPD, BPKAD, Bagian Hukum,
              dan Inspektorat dalam satu sistem terpadu.
            </p>
          </div>

          {/* ── Step Cards — redesigned with large numbered lanes ── */}
          <div className="relative mb-16">
            {/* Connector dashed line desktop */}
            <div className="absolute top-[44px] right-[10%] left-[10%] z-0 hidden h-px border-t-2 border-dashed border-blue-200 lg:block" />

            <div className="relative z-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ALUR.map((step, i) => {
                const isFirst = i === 0;
                const colors = [
                  {
                    ring: "ring-blue-500",
                    bg: "bg-blue-600",
                    light: "bg-blue-50",
                    text: "text-blue-600",
                    border: "border-blue-200",
                    numBg: "bg-blue-600",
                  },
                  {
                    ring: "ring-indigo-400",
                    bg: "bg-indigo-600",
                    light: "bg-indigo-50",
                    text: "text-indigo-600",
                    border: "border-indigo-200",
                    numBg: "bg-indigo-600",
                  },
                  {
                    ring: "ring-violet-400",
                    bg: "bg-violet-600",
                    light: "bg-violet-50",
                    text: "text-violet-600",
                    border: "border-violet-200",
                    numBg: "bg-violet-600",
                  },
                  {
                    ring: "ring-blue-400",
                    bg: "bg-[#0f2d5e]",
                    light: "bg-[#eef4ff]",
                    text: "text-[#1a4e8f]",
                    border: "border-blue-200",
                    numBg: "bg-[#0f2d5e]",
                  },
                ][i];
                return (
                  <div
                    key={step.num}
                    className="group flex flex-col items-center text-center"
                  >
                    {/* Icon circle */}
                    <div className="relative mb-5">
                      {isFirst && (
                        <span
                          className={`absolute inset-0 rounded-full ${colors.bg} animate-ping opacity-20`}
                        />
                      )}
                      <div
                        className={`relative flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full border-4 border-white ${colors.bg} shadow-xl transition-transform duration-300 group-hover:scale-105`}
                      >
                        <span className="mb-0.5 text-[10px] font-black tracking-widest text-white/60 uppercase">
                          {step.num}
                        </span>
                        <span className="[&>svg]:h-7 [&>svg]:w-7 [&>svg]:text-white">
                          {step.icon}
                        </span>
                      </div>
                      {/* Connector arrow between steps (desktop) */}
                      {i < 3 && (
                        <div className="absolute top-1/2 -right-[calc(50%+8px)] hidden -translate-y-1/2 lg:block">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            className="text-blue-300"
                          >
                            <path
                              d="M2 8h10M8 4l4 4-4 4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Card */}
                    <div
                      className={`w-full flex-1 rounded-2xl border ${colors.border} ${colors.light} p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md`}
                    >
                      {/* Step label */}
                      <div
                        className={`mb-2 text-[10px] font-black tracking-[0.15em] ${colors.text} uppercase`}
                      >
                        Langkah {step.num}
                      </div>
                      <h3 className="mb-2 text-[15px] leading-snug font-bold text-[#0f2d5e]">
                        {step.title}
                      </h3>
                      <p className="text-[12.5px] leading-[1.7] text-[#4a6fa5]">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Pipeline Status Tracker — redesigned as horizontal card strip ── */}
          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
            {/* Header row */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-700 uppercase">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Pemantauan Status Real-Time
                </div>
                <h3 className="text-[20px] font-bold text-[#0f2d5e]">
                  6 Tahap Proses Verifikasi
                </h3>
                <p className="mt-0.5 text-[13px] text-[#4a6fa5]">
                  Pantau posisi berkas Anda di setiap tahap tanpa perlu ke
                  kantor.
                </p>
              </div>
              <button className="flex w-fit shrink-0 items-center gap-2 rounded-xl bg-[#1a4e8f] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-md shadow-blue-900/15 transition-all hover:bg-[#153e78] active:scale-[0.98]">
                Cek Status Berkas
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M2 7h10M7 2l5 5-5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-6 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-amber-400 transition-all"
                  style={{ width: "41.6%" }}
                />
              </div>
              <span className="shrink-0 text-[12px] font-bold text-[#0f2d5e]">
                Tahap 3/6
              </span>
            </div>

            {/* Status strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {STATUS_LIST.map((s, i) => {
                const isActive = i === 2;
                const isDone = i < 2;
                const isPending = i > 2;
                return (
                  <div
                    key={s.label}
                    className={`group relative flex flex-col rounded-xl border p-3 transition-all ${
                      isDone
                        ? `border-transparent ${s.track}`
                        : isActive
                          ? `border-transparent ${s.track} shadow-md`
                          : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    {/* Status icon */}
                    <div
                      className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-full ${
                        isDone ? s.dot : isActive ? s.dot : "bg-gray-200"
                      }`}
                    >
                      {isDone ? (
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-gray-400"}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={s.icon}
                          />
                        </svg>
                      )}
                      {isActive && (
                        <span
                          className={`absolute inset-0 rounded-full ${s.dot} animate-ping opacity-25`}
                        />
                      )}
                    </div>

                    {/* Status number */}
                    <div
                      className={`mb-0.5 text-[10px] font-bold tracking-wider ${isDone || isActive ? s.text : "text-gray-400"} uppercase`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    {/* Label */}
                    <div
                      className={`text-[12px] leading-tight font-bold ${isDone || isActive ? s.text : "text-gray-400"}`}
                    >
                      {s.label}
                    </div>

                    {/* Unit */}
                    <div
                      className={`mt-1 text-[10.5px] font-medium ${isDone || isActive ? s.text : "text-gray-400"} opacity-80`}
                    >
                      {s.unit}
                    </div>

                    {/* Active badge */}
                    {isActive && (
                      <span
                        className={`mt-2 self-start rounded-full ${s.dot} px-2 py-0.5 text-[9px] font-bold text-white`}
                      >
                        ● Aktif
                      </span>
                    )}
                    {isDone && (
                      <span
                        className={`mt-2 self-start rounded-full ${s.track} ${s.text} px-2 py-0.5 text-[9px] font-bold`}
                      >
                        ✓ Selesai
                      </span>
                    )}
                    {isPending && (
                      <span className="mt-2 self-start rounded-full bg-gray-200 px-2 py-0.5 text-[9px] font-bold text-gray-400">
                        Menunggu
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active status detail */}
            <div className="mt-5 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500 shadow-md">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-amber-900">
                    Berkas sedang dalam Proses Telaah
                  </span>
                  <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    BPKAD
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-amber-700">
                  Analisis mendalam sedang dilakukan atas data piutang. Estimasi
                  selesai <strong>3–5 hari kerja</strong>. Notifikasi akan
                  dikirim saat status berubah.
                </p>
              </div>
              <div className="hidden shrink-0 text-right sm:flex sm:flex-col sm:items-end">
                <div className="rounded-xl bg-amber-100 px-4 py-2.5 text-center">
                  <div className="text-[10px] font-semibold tracking-wide text-amber-600 uppercase">
                    Progress
                  </div>
                  <div className="text-[26px] leading-none font-black text-amber-700">
                    3/6
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ KONTAK ══════════════════ */}
      <section id="kontak" className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-[34px] leading-[1.2] font-bold text-gray-900 sm:text-[40px]">
                Kontak Layanan SI PUSPITA
              </h2>
              <p className="mb-8 text-[15px] leading-[1.75] text-gray-500">
                Hubungi Admin BPKAD Kabupaten Kendal untuk informasi lebih
                lanjut mengenai proses pengajuan penghapusan piutang daerah.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    icon: <Phone className="h-5 w-5 text-blue-600" />,
                    label: "Telepon",
                    val: "(0294) 381124",
                  },
                  {
                    icon: <Bell className="h-5 w-5 text-blue-600" />,
                    label: "Jam Layanan",
                    val: "Senin–Jumat, 08.00–16.00 WIB",
                  },
                  {
                    icon: <Building2 className="h-5 w-5 text-blue-600" />,
                    label: "Unit Pengelola",
                    val: "Sub Bidang Akuntansi & Pelaporan, BPKAD Kab. Kendal",
                  },
                ].map(({ icon, label, val }) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      {icon}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold tracking-wider text-gray-400 uppercase">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[15px] font-semibold text-gray-800">
                        {val}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="mb-6 text-[20px] font-bold text-gray-900">
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
                    className="rounded-2xl border border-gray-200 bg-white px-5 py-4"
                  >
                    <p className="mb-2 text-[14px] font-bold text-gray-900">
                      {q}
                    </p>
                    <p className="text-[13px] leading-[1.7] text-gray-500">
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
      <footer className="bg-[#0d1f3c] text-gray-400">
        {/* Main footer content */}
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Col 1 — Brand + alamat */}
            <div className="lg:col-span-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-700 bg-[#1a4e8f]">
                  <FileSearch className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[16px] leading-none font-extrabold text-white">
                    <span className="text-blue-400">SI</span> PUSPITA
                  </div>
                  <div className="mt-0.5 text-[10px] leading-none font-medium text-blue-400">
                    BPKAD Kab. Kendal
                  </div>
                </div>
              </div>
              <p className="mb-4 text-[12.5px] leading-[1.8] text-gray-400">
                Sistem Pengajuan Penghapusan Piutang Terintegrasi — platform
                digital layanan BPKAD Kabupaten Kendal.
              </p>
              <div className="flex flex-col gap-2.5 text-[12px]">
                <div className="flex items-start gap-2 text-gray-400">
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>
                    Jl. Soekarno Hatta No.1, Kendal, Jawa Tengah 51311
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <svg
                    className="h-3.5 w-3.5 flex-shrink-0 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>(0294) 381124</span>
                </div>
              </div>
            </div>

            {/* Col 2 — Layanan */}
            <div>
              <h4 className="mb-5 text-[13px] font-bold tracking-widest text-white uppercase">
                Layanan
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  { label: "Ajukan Permohonan", href: "#formulir" },
                  { label: "Lacak Status Berkas", href: "#tracking" },
                  { label: "Unduh Formulir", href: "#" },
                  { label: "SOP & Flowchart", href: "#sop" },
                  { label: "FAQ", href: "#kontak" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="flex items-center gap-2 text-[13px] text-gray-400 transition-colors hover:text-white"
                    >
                      <svg
                        className="h-3 w-3 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Informasi */}
            <div>
              <h4 className="mb-5 text-[13px] font-bold tracking-widest text-white uppercase">
                Informasi
              </h4>
              <ul className="flex flex-col gap-3">
                {[
                  { label: "Tentang SI PUSPITA", href: "#" },
                  { label: "Dasar Hukum", href: "#" },
                  { label: "Kebijakan Privasi", href: "#" },
                  { label: "Ketentuan Layanan", href: "#" },
                  { label: "Aksesibilitas", href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="flex items-center gap-2 text-[13px] text-gray-400 transition-colors hover:text-white"
                    >
                      <svg
                        className="h-3 w-3 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Kontak & jam layanan */}
            <div>
              <h4 className="mb-5 text-[13px] font-bold tracking-widest text-white uppercase">
                Jam Layanan
              </h4>
              <div className="mb-6 flex flex-col gap-3">
                {[
                  { hari: "Senin — Kamis", jam: "08.00 — 15.30 WIB" },
                  { hari: "Jumat", jam: "08.00 — 11.00 WIB" },
                  { hari: "Sabtu — Minggu", jam: "Tutup" },
                ].map(({ hari, jam }) => (
                  <div
                    key={hari}
                    className="flex justify-between text-[12.5px]"
                  >
                    <span className="text-gray-400">{hari}</span>
                    <span
                      className={`font-semibold ${jam === "Tutup" ? "text-red-400" : "text-white"}`}
                    >
                      {jam}
                    </span>
                  </div>
                ))}
              </div>
              {/* Email */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                <div className="mb-1 text-[10px] font-bold tracking-wider text-blue-400 uppercase">
                  Email
                </div>
                <a
                  href="mailto:bpkad@kendalkab.go.id"
                  className="text-[13px] font-medium text-white transition-colors hover:text-yellow-300"
                >
                  bpkad@kendalkab.go.id
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 bg-[#07111f]">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
            <p className="text-[12px] text-gray-500">
              © {new Date().getFullYear()} BPKAD Kabupaten Kendal. Semua hak
              cipta dilindungi.
            </p>
            <div className="flex items-center gap-4 text-[12px] text-gray-500">
              <span>Dikembangkan oleh</span>
              <span className="font-semibold text-blue-400">
                BPKAD Kab. Kendal
              </span>
            </div>
          </div>
        </div>
      </footer>
      {/* ══════════════════ MODAL LOGIN ══════════════════ */}
      {/* ══════════ MODAL LOGIN ══════════ */}
      {loginOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
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
          <div className="w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[420px] sm:rounded-3xl">
            {/* Top accent line */}
            <div className="h-[3px] bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />

            {/* Content */}
            <div className="px-8 pt-8 pb-9">
              {/* Header row */}
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                      <FileSearch
                        className="h-3.5 w-3.5 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[12px] font-bold tracking-widest text-blue-600 uppercase">
                      SI PUSPITA
                    </span>
                  </div>
                  <h2 className="text-[24px] leading-tight font-bold tracking-tight text-gray-900">
                    Selamat datang
                  </h2>
                  <p className="mt-1 text-[13px] text-gray-400">
                    Masuk untuk mengakses sistem
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLoginOpen(false);
                    setLoginError("");
                    setLoginForm({ username: "", password: "" });
                  }}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {/* Username field */}
                <div>
                  <label className="mb-2 block text-[12px] font-semibold tracking-wider text-gray-500 uppercase">
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
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[14px] text-gray-900 placeholder-gray-300 transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:outline-none"
                  />
                </div>

                {/* Password field */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[12px] font-semibold tracking-wider text-gray-500 uppercase">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-[12px] font-medium text-blue-500 transition-colors hover:text-blue-700"
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
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-[14px] text-gray-900 placeholder-gray-300 transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-300 transition-colors hover:text-gray-500"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {loginError && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-500">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    {loginError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {loginLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Masuk <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider + note */}
              <div className="mt-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <p className="shrink-0 text-[11px] font-medium text-gray-300">
                  BPKAD Kabupaten Kendal
                </p>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
