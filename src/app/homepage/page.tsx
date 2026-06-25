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
import { useEffect, useState } from "react";
import Image from "next/image";

// ─── Bunga Menu — Data & Types ────────────────────────────────────────────────

type KelopakId = "sop" | "flowchart" | "pengajuan" | "lacak" | "faq" | "daftar";

interface KelopakItem {
  id: KelopakId;
  label: string;
  icon: string;
  tooltip: string;
  modalTitle: string;
  modalContent: React.ReactNode;
}

const FAQ_LIST = [
  {
    q: "Berapa nilai piutang minimal untuk jalur PUPN?",
    a: "Piutang dengan nilai di atas Rp8.000.000 diarahkan ke jalur PUPN (Panitia Urusan Piutang Negara).",
  },
  {
    q: "Dokumen apa saja yang perlu dilampirkan?",
    a: "Surat permohonan, bukti piutang, laporan upaya penagihan, dan dokumen pendukung lainnya sesuai SOP.",
  },
  {
    q: "Berapa lama proses verifikasi berlangsung?",
    a: "Proses verifikasi BPKAD memakan waktu 5–10 hari kerja, tergantung kelengkapan dokumen.",
  },
  {
    q: "Apakah OPD bisa memantau status pengajuan?",
    a: "Ya, OPD dapat memantau status secara real-time melalui fitur Lacak Status Berkas di sistem ini.",
  },
];

const ALUR_FLOWCHART_BUNGA = [
  {
    step: "1",
    label: "OPD Ajukan Permohonan",
    sub: "Input data & upload dokumen",
  },
  {
    step: "2",
    label: "Verifikasi BPKAD",
    sub: "Pemeriksaan kelengkapan berkas",
  },
  { step: "3", label: "Review Bagian Hukum", sub: "Kajian aspek legalitas" },
  {
    step: "4",
    label: "Pemeriksaan Inspektorat",
    sub: "Audit & validasi internal",
  },
  {
    step: "5",
    label: "Persetujuan Pimpinan",
    sub: "Keputusan akhir penghapusan",
  },
];

const SOP_STEPS_BUNGA = [
  {
    no: "01",
    judul: "Identifikasi Piutang Macet",
    isi: "OPD mengidentifikasi piutang yang tidak tertagih selama lebih dari 3 tahun berturut-turut.",
  },
  {
    no: "02",
    judul: "Penyusunan Berkas Permohonan",
    isi: "Lengkapi dokumen sesuai checklist: surat permohonan, bukti piutang, dan laporan upaya penagihan.",
  },
  {
    no: "03",
    judul: "Pengajuan ke BPKAD",
    isi: "Submit permohonan melalui SI PUSPITA. Sistem akan otomatis menentukan jalur PUPN atau Non-PUPN.",
  },
  {
    no: "04",
    judul: "Proses Verifikasi",
    isi: "BPKAD, Bagian Hukum, dan Inspektorat melakukan verifikasi bertahap sesuai ketentuan yang berlaku.",
  },
  {
    no: "05",
    judul: "Penerbitan SK Penghapusan",
    isi: "Setelah disetujui Pimpinan BPKAD, Surat Keputusan Penghapusan Piutang diterbitkan dan didistribusikan ke OPD.",
  },
];

const DAFTAR_PENGAJUAN_BUNGA = [
  {
    no: "001/PP/2025",
    opd: "Dinas Kesehatan",
    nilai: "Rp 12.500.000",
    jalur: "PUPN",
    status: "Verifikasi BPKAD",
    warna: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    no: "002/PP/2025",
    opd: "Dinas Pendidikan",
    nilai: "Rp 4.750.000",
    jalur: "Non-PUPN",
    status: "Review Hukum",
    warna: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    no: "003/PP/2025",
    opd: "DPUPR",
    nilai: "Rp 28.000.000",
    jalur: "PUPN",
    status: "Inspektorat",
    warna: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    no: "004/PP/2025",
    opd: "Dinas Perhubungan",
    nilai: "Rp 3.200.000",
    jalur: "Non-PUPN",
    status: "Selesai ✓",
    warna: "bg-green-100 text-green-700 border-green-200",
  },
];

const WARNA_KELOPAK = ["#e85d04", "#f97316", "#fbbf24", "#f59e0b", "#f97316"];
const SUDUT_KELOPAK = [0, 72, 144, 216, 288];

// ─── Bunga Modal — Content Components ────────────────────────────────────────

function ModalSOP() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-500">
        Standar Operasional Prosedur penghapusan piutang daerah di lingkungan
        Pemerintah Kabupaten Kendal berdasarkan Permendagri dan regulasi yang
        berlaku.
      </p>
      <div className="space-y-3">
        {SOP_STEPS_BUNGA.map((s) => (
          <div
            key={s.no}
            className="flex gap-4 rounded-xl border border-gray-100 bg-orange-50/60 p-4"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
              {s.no}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{s.judul}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                {s.isi}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-700">
          📌 Dasar hukum: PP No. 14 Tahun 2005, Permendagri No. 73 Tahun 2015,
          dan Perbup Kendal terkait.
        </p>
      </div>
    </div>
  );
}

function ModalFlowchart() {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-gray-500">
        Alur proses pengajuan penghapusan piutang dari OPD hingga persetujuan
        akhir.
      </p>
      <div className="relative space-y-2">
        {ALUR_FLOWCHART_BUNGA.map((item, i) => (
          <div key={item.step} className="relative">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
            </div>
            {i < ALUR_FLOWCHART_BUNGA.length - 1 && (
              <div className="ml-[22px] h-3 w-0.5 bg-orange-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalPengajuan() {
  const [jalur, setJalur] = useState<"pupn" | "non-pupn" | null>(null);
  const [nilai, setNilai] = useState("");

  const formatRupiah = (val: string) => {
    const num = val.replace(/\D/g, "");
    if (!num) return "";
    return "Rp " + parseInt(num).toLocaleString("id-ID");
  };

  const handleNilai = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setNilai(raw);
    if (raw) {
      setJalur(parseInt(raw) >= 8000000 ? "pupn" : "non-pupn");
    } else {
      setJalur(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-500">
        Isi formulir di bawah untuk memulai pengajuan. Sistem akan otomatis
        menentukan jalur proses berdasarkan nilai piutang.
      </p>
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Nama OPD
          </label>
          <input
            type="text"
            placeholder="Contoh: Dinas Kesehatan Kab. Kendal"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Nilai Piutang
          </label>
          <input
            type="text"
            placeholder="Rp 0"
            value={nilai ? formatRupiah(nilai) : ""}
            onChange={handleNilai}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
          />
        </div>
        {jalur && (
          <div
            className={`rounded-lg border p-3 text-xs font-medium ${jalur === "pupn" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-green-200 bg-green-50 text-green-700"}`}
          >
            {jalur === "pupn"
              ? "⚡ Jalur PUPN — nilai ≥ Rp8.000.000, diteruskan ke Panitia Urusan Piutang Negara."
              : "✅ Jalur Non-PUPN — nilai < Rp8.000.000, diproses langsung oleh BPKAD."}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Keterangan Singkat
          </label>
          <textarea
            rows={3}
            placeholder="Jelaskan latar belakang pengajuan penghapusan piutang..."
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
          />
        </div>
      </div>
      <button className="w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-[#0b1f3a] transition hover:bg-amber-400 active:scale-[0.98]">
        Ajukan Permohonan →
      </button>
    </div>
  );
}

function ModalLacak() {
  const [noRef, setNoRef] = useState("");
  const [hasil, setHasil] = useState<
    (typeof DAFTAR_PENGAJUAN_BUNGA)[0] | null | "not-found"
  >(null);

  const handleCari = () => {
    if (!noRef.trim()) return;
    const found = DAFTAR_PENGAJUAN_BUNGA.find((d) =>
      d.no.toLowerCase().includes(noRef.toLowerCase()),
    );
    setHasil(found ?? "not-found");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-500">
        Masukkan nomor referensi pengajuan untuk memantau status berkas Anda.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Contoh: 001/PP/2025"
          value={noRef}
          onChange={(e) => setNoRef(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCari()}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
        />
        <button
          onClick={handleCari}
          className="rounded-lg bg-amber-500 px-4 text-sm font-semibold text-[#0b1f3a] transition hover:bg-amber-400 active:scale-[0.98]"
        >
          Cari
        </button>
      </div>
      {hasil === "not-found" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          ❌ Nomor referensi tidak ditemukan. Periksa kembali nomor yang Anda
          masukkan.
        </div>
      )}
      {hasil && hasil !== "not-found" && (
        <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          {[
            ["No. Referensi", hasil.no],
            ["OPD", hasil.opd],
            ["Nilai Piutang", hasil.nilai],
            ["Jalur", hasil.jalur],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{k}</span>
              <span className="text-sm text-gray-700">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Status</span>
            <span
              className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold ${hasil.warna}`}
            >
              {hasil.status}
            </span>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <p className="mb-2 text-xs font-semibold text-gray-500">
          Pengajuan Terbaru
        </p>
        <div className="space-y-2">
          {DAFTAR_PENGAJUAN_BUNGA.slice(0, 3).map((d) => (
            <div
              key={d.no}
              className="flex cursor-pointer items-center justify-between text-xs"
              onClick={() => {
                setNoRef(d.no);
                setHasil(d);
              }}
            >
              <span className="text-gray-500">
                {d.no} — {d.opd}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${d.warna}`}
              >
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      <p className="mb-3 text-sm leading-relaxed text-gray-500">
        Pertanyaan yang sering diajukan seputar proses penghapusan piutang
        daerah.
      </p>
      {FAQ_LIST.map((f, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <button
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <span className="text-sm font-medium text-gray-800">{f.q}</span>
            <span className="ml-3 shrink-0 text-lg leading-none text-amber-500">
              {openIdx === i ? "−" : "+"}
            </span>
          </button>
          {openIdx === i && (
            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs leading-relaxed text-gray-500">{f.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ModalDaftarPengajuan() {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-gray-500">
        Daftar seluruh pengajuan penghapusan piutang yang sedang berjalan di
        semua OPD.
      </p>
      <div className="space-y-2">
        {DAFTAR_PENGAJUAN_BUNGA.map((d) => (
          <div
            key={d.no}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{d.opd}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {d.no} · Jalur {d.jalur}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${d.warna}`}
              >
                {d.status}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">Nilai:</span>
              <span className="text-xs font-medium text-amber-600">
                {d.nilai}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400">
        Menampilkan 4 dari 4 pengajuan aktif · TA 2025
      </p>
    </div>
  );
}

// ─── Bunga Menu — Kelopak Config ──────────────────────────────────────────────

const KELOPAK_LIST: KelopakItem[] = [
  {
    id: "sop",
    label: "SOP",
    icon: "📄",
    tooltip: "Standar Operasional Prosedur",
    modalTitle: "Standar Operasional Prosedur",
    modalContent: <ModalSOP />,
  },
  {
    id: "flowchart",
    label: "Flowchart",
    icon: "🗂️",
    tooltip: "Alur & Diagram Proses",
    modalTitle: "Alur Proses Pengajuan",
    modalContent: <ModalFlowchart />,
  },
  {
    id: "pengajuan",
    label: "Pengajuan",
    icon: "📝",
    tooltip: "Formulir Pengajuan Online",
    modalTitle: "Formulir Pengajuan Baru",
    modalContent: <ModalPengajuan />,
  },
  {
    id: "lacak",
    label: "Lacak",
    icon: "🔍",
    tooltip: "Lacak Status Berkas",
    modalTitle: "Lacak Status Berkas",
    modalContent: <ModalLacak />,
  },
  {
    id: "faq",
    label: "FAQ",
    icon: "❓",
    tooltip: "Pertanyaan Umum",
    modalTitle: "Pertanyaan yang Sering Diajukan",
    modalContent: <ModalFAQ />,
  },
];

const KELOPAK_DAFTAR: KelopakItem = {
  id: "daftar",
  label: "Daftar",
  icon: "☑️",
  tooltip: "Daftar Pengajuan",
  modalTitle: "Daftar Pengajuan",
  modalContent: <ModalDaftarPengajuan />,
};

// ─── Bunga Modal ──────────────────────────────────────────────────────────────

function ModalBunga({
  item,
  onClose,
}: {
  item: KelopakItem;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      style={{
        backgroundColor: "rgba(15,45,94,0.55)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Accent top bar */}
        <div className="h-[3px] bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-lg">
              {item.icon}
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {item.modalTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-lg leading-none text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {item.modalContent}
        </div>
      </div>
    </div>
  );
}

// ─── Bunga SVG Component ──────────────────────────────────────────────────────

function BungaSVG({
  activeId,
  centerActive,
  onKelopakClick,
  onCenterClick,
}: {
  activeId: KelopakId | null;
  centerActive: boolean;
  onKelopakClick: (id: KelopakId) => void;
  onCenterClick: () => void;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-120 -120 240 240"
      className="h-full w-full"
    >
      <defs>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.5"
            floodColor="#000"
            floodOpacity="0.3"
          />
        </filter>
        <linearGradient id="textGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <g>
        {KELOPAK_LIST.map((item, index) => {
          const isActive = activeId === item.id;
          const angle = SUDUT_KELOPAK[index];
          const flip = angle >= 90 && angle <= 270 ? 180 : 0;
          return (
            <g key={item.id}>
              <ellipse
                rx="20"
                ry="44"
                fill={WARNA_KELOPAK[index]}
                stroke={isActive ? "#ffffff" : "rgba(255,255,255,0.3)"}
                strokeWidth={isActive ? 2 : 1.5}
                opacity={isActive ? 1 : 0.85}
                transform={`rotate(${angle}) translate(0,-52)`}
                style={{
                  cursor: "pointer",
                  transition: "stroke 0.2s, opacity 0.2s",
                }}
                onClick={() => onKelopakClick(item.id)}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.opacity = isActive ? "1" : "0.85")
                }
              >
                <title>{item.tooltip}</title>
              </ellipse>
              <text
                x="0"
                y="-108"
                transform={`rotate(${angle}) rotate(${flip}, 0, -108)`}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Segoe UI, system-ui, sans-serif"
                fontSize="13"
                fontWeight="500"
                letterSpacing="0.5"
                fill="url(#textGradient)"
                filter="url(#softShadow)"
                stroke="rgba(0,0,0,0.25)"
                strokeWidth="0.6"
                paintOrder="stroke fill"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {item.label}
              </text>
            </g>
          );
        })}
        {/* Pusat */}
        <circle
          r="20"
          fill="#1f2937"
          stroke={centerActive ? "#f59e0b" : "rgba(255,255,255,0.25)"}
          strokeWidth={centerActive ? 2.5 : 2}
          style={{ cursor: "pointer", transition: "stroke 0.2s" }}
          onClick={onCenterClick}
        >
          <title>Daftar Pengajuan</title>
        </circle>
        <text
          x="0"
          y="7"
          fontFamily="Arial,sans-serif"
          fontSize="18"
          fontWeight="900"
          fill={centerActive ? "#f59e0b" : "#d1d5db"}
          textAnchor="middle"
          style={{
            cursor: "pointer",
            userSelect: "none",
            transition: "fill 0.2s",
          }}
          onClick={onCenterClick}
        >
          &#10003;
        </text>
      </g>
    </svg>
  );
}

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

  // Bunga menu state
  const [bungaActiveId, setBungaActiveId] = useState<KelopakId | null>(null);
  const [bungaCenterActive, setBungaCenterActive] = useState(false);
  const [modalItem, setModalItem] = useState<KelopakItem | null>(null);

  const handleKelopakClick = (id: KelopakId) => {
    setBungaCenterActive(false);
    setBungaActiveId(id);
    setModalItem(KELOPAK_LIST.find((k) => k.id === id) ?? null);
  };

  const handleCenterClick = () => {
    setBungaActiveId(null);
    setBungaCenterActive(true);
    setModalItem(KELOPAK_DAFTAR);
  };

  const handleCloseModal = () => {
    setModalItem(null);
    setBungaActiveId(null);
    setBungaCenterActive(false);
  };

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
        <nav className="border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
            {/* Logo */}
            <Image
              src="/SiPuspita_Fix.png"
              alt="Logo"
              width={100}
              height={100}
              className="w-40"
            />

            {/* Desktop links */}
            <div className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="group relative px-3.5 py-2 text-[13px] font-medium text-gray-600 transition-colors duration-200 hover:text-[#1a4e8f] focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  {label}
                  {/* Underline animasi */}
                  <span className="absolute inset-x-3.5 bottom-1.5 h-[2px] origin-left scale-x-0 rounded-full bg-[#1a4e8f] transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden items-center gap-3 lg:flex">
              <button
                onClick={() => setLoginOpen(true)}
                className="group relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-gray-600 transition-colors duration-200 hover:text-[#1a4e8f]"
              >
                <LogIn className="h-3.5 w-3.5" /> Masuk
                <span className="absolute inset-x-4 bottom-1.5 h-[1.5px] origin-left scale-x-0 rounded-full bg-[#1a4e8f] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>
              <button className="rounded-lg bg-yellow-400 px-5 py-2 text-[13px] font-semibold text-[#0f2d5e] shadow-sm transition-all duration-200 hover:bg-yellow-300 hover:text-[#0a2342] hover:shadow-md">
                Ajukan Sekarang
              </button>
            </div>

            {/* Mobile toggler */}
            <button
              className="rounded-lg p-2 text-gray-600 transition-colors hover:text-[#1a4e8f] lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile menu */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
              mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-white/90 px-6 py-5 backdrop-blur-md">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="group relative py-1 text-[14px] font-medium text-gray-700 transition-colors duration-200 hover:text-[#1a4e8f]"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-[#1a4e8f] transition-all duration-300 ease-out group-hover:w-full" />
                </a>
              ))}
              <hr className="my-1 border-gray-200" />
              <button className="w-fit rounded-lg bg-yellow-400 px-6 py-2.5 text-[14px] font-semibold text-[#0f2d5e] shadow-sm transition-all hover:bg-yellow-300 hover:text-[#0a2342]">
                Ajukan Sekarang
              </button>
              <button
                onClick={() => {
                  setLoginOpen(true);
                  setMobileOpen(false);
                }}
                className="group relative w-fit rounded-lg px-4 py-2 text-[14px] font-medium text-gray-600 transition-colors hover:text-[#1a4e8f]"
              >
                Masuk
                <span className="absolute inset-x-4 bottom-1.5 h-[1.5px] origin-left scale-x-0 rounded-full bg-[#1a4e8f] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section
        id="beranda"
        className="relative flex flex-col justify-center overflow-hidden bg-[#0f2d5e] text-white"
      >
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-blue-800/30 blur-2xl" />
        </div>

        {/* Left accent bar */}
        <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-yellow-400/0 via-yellow-400 to-yellow-400/0" />

        {/* Content wrapper (no duplication) */}
        <div className="relative mx-auto w-full max-w-[1100px] px-12 py-5">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center">
            {/* ── Kiri: teks utama ── */}
            <div className="flex-1">
              {/* Eyebrow */}
              <p className="mb-4 text-[11px] font-bold tracking-[0.2em] text-yellow-400 uppercase">
                BPKAD Kabupaten Kendal
              </p>

              {/* Headline */}
              <h1 className="mb-5 text-[40px] leading-[1.1] font-extrabold tracking-tight lg:text-[52px]">
                <span className="text-orange-400">SI </span>
                <span className="text-purple-400">PUS</span>
                <span className="text-green-400">PI</span>
                <span className="text-red-400">TA</span>
                <span className="mt-1 block text-[22px] font-normal text-blue-100 lg:text-[26px]">
                  <span className="text-orange-400">Si</span>stem Pengajuan
                  Pengha<span className="text-purple-400">pus</span>an{" "}
                  <span className="text-green-400">Pi</span>utang{" "}
                  <span className="text-red-400">T</span>erintegr
                  <span className="text-red-400">a</span>si
                </span>
              </h1>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#formulir"
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 text-[13px] font-bold text-[#0f2d5e] transition hover:bg-yellow-300"
                >
                  Ajukan Permohonan
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <a
                  href="#tracking"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-[13px] font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  Lacak Status Berkas
                </a>
              </div>
            </div>

            {/* ── Kanan: bunga menu interaktif ── */}
            <div className="flex w-full flex-col items-center lg:w-auto lg:shrink-0">
              <div className="h-62 w-62 sm:h-65 sm:w-65">
                <BungaSVG
                  activeId={bungaActiveId}
                  centerActive={bungaCenterActive}
                  onKelopakClick={handleKelopakClick}
                  onCenterClick={handleCenterClick}
                />
              </div>
              <p className="mt-2 text-center text-[13px] text-blue-100">
                Klik kelopak untuk menu layanan
              </p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="mx-auto max-w-[1100px] px-8 py-3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { num: "24+", label: "OPD Terdaftar" },
                { num: "100%", label: "Proses Digital" },
                { num: "6", label: "Tahap Verifikasi" },
                { num: "Real-time", label: "Pemantauan Status" },
              ].map(({ num, label }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[20px] leading-none font-extrabold text-yellow-400">
                    {num}
                  </span>
                  <span className="text-[12px] text-blue-300">{label}</span>
                </div>
              ))}
            </div>
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
        </div>
      </section>

      {/* ══════════════════ KEUNGGULAN ══════════════════ */}
      <section className="bg-white py-6 sm:py-8">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="mb-8 text-center text-[25px] leading-[1.2] font-bold text-gray-900 sm:text-[36px]">
            Mengapa SI PUSPITA Lebih Efektif dari Proses Manual?
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
      <section id="sop" className="bg-[#f7faff] py-7 sm:py-10">
        <div className="mx-auto max-w-[1200px] px-6">
          {/* ── Heading ── */}
          <div className="mb-14 text-center">
            <h2 className="text-[32px] leading-[1.15] font-bold text-[#0f2d5e] sm:text-[42px]">
              Alur Pengajuan
              <span className="text-orange-700"> Penghapusan Piutang</span>
            </h2>
            <p className="mx-auto mt-3 text-[15px] leading-[1.8] text-[#29323e]">
              Empat langkah terstandar menghubungkan OPD, BPKAD, Bagian Hukum,
              dan Inspektorat dalam satu sistem terpadu.
            </p>
          </div>

          {/* ── Step Cards — redesigned with large numbered lanes ── */}
          <div className="relative mb-8">
            {/* Connector dashed line desktop */}
            <div className="absolute top-[44px] right-[10%] left-[10%] z-0 hidden h-px border-t-2 border-dashed border-blue-200 lg:block" />

            <div className="relative z-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ALUR.map((step, i) => {
                const isFirst = i === 0;
                const colors = [
                  {
                    ring: "ring-blue-500",
                    bg: "bg-lime-900",
                    light: "bg-blue-50",
                    text: "text-lime-900",
                    border: "border-blue-200",
                    numBg: "bg-blue-600",
                  },
                  {
                    ring: "ring-indigo-400",
                    bg: "bg-sky-900",
                    light: "bg-indigo-50",
                    text: "text-sky-900",
                    border: "border-indigo-200",
                    numBg: "bg-indigo-600",
                  },
                  {
                    ring: "ring-violet-400",
                    bg: "bg-violet-900",
                    light: "bg-violet-50",
                    text: "text-violet-900",
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
                        <span className="mb-0.5 text-[13px] font-black tracking-widest text-white uppercase">
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
                      className={`w-full flex-1 rounded-md border ${colors.border} ${colors.light} p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md`}
                    >
                      {/* Step label */}
                      <div
                        className={`mb-2 text-[15px] font-black tracking-[0.15em] ${colors.text} uppercase`}
                      >
                        Langkah {step.num}
                      </div>
                      <h3 className="mb-2 text-[15px] leading-snug font-bold text-[#0f2d5e]">
                        {step.title}
                      </h3>
                      <p className="text-[13px] leading-snug text-[#474747]">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ KONTAK ══════════════════ */}
      <section id="kontak" className="bg-gray-50 py-6 sm:py-8">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-2 text-[20px] leading-snug font-bold text-gray-900 sm:text-[40px]">
                Kontak Layanan SI PUSPITA
              </h2>
              <p className="mb-8 text-[15px] text-gray-500">
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
                    className="flex items-start gap-4 rounded-md border border-gray-200 bg-white px-5 py-4"
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
                    className="rounded-md border border-gray-200 bg-white px-5 py-4"
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
      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="bg-[#0d1f3c] text-gray-400">
        {/* Main footer content */}
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Col 1 — Brand + alamat */}
            <div className="lg:col-span-1">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a4e8f] to-blue-600 shadow-md">
                  <FileSearch className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[17px] leading-none font-bold text-white">
                    <span className="text-blue-400">SI</span> PUSPITA
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium tracking-wide text-blue-400/80">
                    BPKAD Kab. Kendal
                  </div>
                </div>
              </div>
              <p className="mb-6 text-[13px] leading-relaxed text-gray-400">
                Sistem Pengajuan Penghapusan Piutang Terintegrasi — platform
                digital layanan BPKAD Kabupaten Kendal.
              </p>
              <div className="flex flex-col gap-3 text-[13px]">
                <div className="flex items-start gap-2.5 text-gray-400">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
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
                <div className="flex items-center gap-2.5 text-gray-400">
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
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
              <ul className="flex flex-col gap-2.5">
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
                      className="group relative inline-block text-[13px] text-gray-400 transition-colors duration-200 hover:text-white"
                    >
                      {label}
                      <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-white/50 transition-all duration-300 group-hover:w-full" />
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
              <ul className="flex flex-col gap-2.5">
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
                      className="group relative inline-block text-[13px] text-gray-400 transition-colors duration-200 hover:text-white"
                    >
                      {label}
                      <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-white/50 transition-all duration-300 group-hover:w-full" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Jam Layanan + Email */}
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
                  <div key={hari} className="flex justify-between text-[13px]">
                    <span className="text-gray-400">{hari}</span>
                    <span
                      className={`font-medium ${jam === "Tutup" ? "text-red-400" : "text-white"}`}
                    >
                      {jam}
                    </span>
                  </div>
                ))}
              </div>

              {/* Email card */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="mb-1 text-[10px] font-semibold tracking-widest text-blue-400 uppercase">
                  Email Resmi
                </div>
                <a
                  href="mailto:bpkad@kendalkab.go.id"
                  className="text-[13px] font-medium text-white transition-colors duration-200 hover:text-yellow-300"
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
              © {new Date().getFullYear()} BPKAD Kabupaten Kendal. Hak cipta
              dilindungi.
            </p>
            <div className="flex items-center gap-4 text-[12px] text-gray-500">
              <span className="hidden sm:inline">Dikembangkan oleh</span>
              <span className="font-medium text-blue-400">
                BPKAD Kab. Kendal — Sub Bidang Akuntansi dan Pelaporan
              </span>
            </div>
          </div>
        </div>
      </footer>
      {/* ══════════════════ MODAL BUNGA ══════════════════ */}
      {modalItem && <ModalBunga item={modalItem} onClose={handleCloseModal} />}

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
