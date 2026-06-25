"use client";

import { useEffect, useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

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

const ALUR_FLOWCHART = [
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

const SOP_STEPS = [
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

const DAFTAR_PENGAJUAN = [
  {
    no: "001/PP/2025",
    opd: "Dinas Kesehatan",
    nilai: "Rp 12.500.000",
    jalur: "PUPN",
    status: "Verifikasi BPKAD",
    warna: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  },
  {
    no: "002/PP/2025",
    opd: "Dinas Pendidikan",
    nilai: "Rp 4.750.000",
    jalur: "Non-PUPN",
    status: "Review Hukum",
    warna: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  {
    no: "003/PP/2025",
    opd: "DPUPR",
    nilai: "Rp 28.000.000",
    jalur: "PUPN",
    status: "Inspektorat",
    warna: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  },
  {
    no: "004/PP/2025",
    opd: "Dinas Perhubungan",
    nilai: "Rp 3.200.000",
    jalur: "Non-PUPN",
    status: "Selesai ✓",
    warna: "bg-green-500/10 text-green-300 border-green-500/20",
  },
];

// ─── Modal Content Components ─────────────────────────────────────────────────

function ModalSOP() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-400">
        Standar Operasional Prosedur penghapusan piutang daerah di lingkungan
        Pemerintah Kabupaten Kendal berdasarkan Permendagri dan regulasi yang
        berlaku.
      </p>
      <div className="space-y-3">
        {SOP_STEPS.map((s) => (
          <div
            key={s.no}
            className="flex gap-4 rounded-xl border border-white/8 bg-white/[0.04] p-4"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400">
              {s.no}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{s.judul}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {s.isi}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3">
        <p className="text-xs text-amber-400/80">
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
      <p className="text-sm leading-relaxed text-slate-400">
        Alur proses pengajuan penghapusan piutang dari OPD hingga persetujuan
        akhir.
      </p>
      <div className="relative space-y-2">
        {ALUR_FLOWCHART.map((item, i) => (
          <div key={item.step} className="relative">
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.04] p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-400">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
            </div>
            {i < ALUR_FLOWCHART.length - 1 && (
              <div className="ml-[22px] h-3 w-0.5 bg-orange-500/25" />
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
      const angka = parseInt(raw);
      setJalur(angka >= 8000000 ? "pupn" : "non-pupn");
    } else {
      setJalur(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-400">
        Isi formulir di bawah untuk memulai pengajuan. Sistem akan otomatis
        menentukan jalur proses berdasarkan nilai piutang.
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Nama OPD
          </label>
          <input
            type="text"
            placeholder="Contoh: Dinas Kesehatan Kab. Kendal"
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Nilai Piutang
          </label>
          <input
            type="text"
            placeholder="Rp 0"
            value={nilai ? formatRupiah(nilai) : ""}
            onChange={handleNilai}
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        {jalur && (
          <div
            className={`rounded-lg border p-3 text-xs font-medium ${
              jalur === "pupn"
                ? "border-blue-500/25 bg-blue-500/10 text-blue-300"
                : "border-green-500/25 bg-green-500/10 text-green-300"
            }`}
          >
            {jalur === "pupn"
              ? "⚡ Jalur PUPN — nilai ≥ Rp8.000.000, diteruskan ke Panitia Urusan Piutang Negara."
              : "✅ Jalur Non-PUPN — nilai < Rp8.000.000, diproses langsung oleh BPKAD."}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Keterangan Singkat
          </label>
          <textarea
            rows={3}
            placeholder="Jelaskan latar belakang pengajuan penghapusan piutang..."
            className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
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
    (typeof DAFTAR_PENGAJUAN)[0] | null | "not-found"
  >(null);

  const handleCari = () => {
    if (!noRef.trim()) return;
    const found = DAFTAR_PENGAJUAN.find((d) =>
      d.no.toLowerCase().includes(noRef.toLowerCase()),
    );
    setHasil(found ?? "not-found");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-400">
        Masukkan nomor referensi pengajuan untuk memantau status berkas Anda.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Contoh: 001/PP/2025"
          value={noRef}
          onChange={(e) => setNoRef(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCari()}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
        />
        <button
          onClick={handleCari}
          className="rounded-lg bg-amber-500 px-4 text-sm font-semibold text-[#0b1f3a] transition hover:bg-amber-400 active:scale-[0.98]"
        >
          Cari
        </button>
      </div>

      {hasil === "not-found" && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
          ❌ Nomor referensi tidak ditemukan. Periksa kembali nomor yang Anda
          masukkan.
        </div>
      )}

      {hasil && hasil !== "not-found" && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">No. Referensi</span>
            <span className="text-sm font-semibold text-slate-200">
              {hasil.no}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">OPD</span>
            <span className="text-sm text-slate-300">{hasil.opd}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Nilai Piutang</span>
            <span className="text-sm text-slate-300">{hasil.nilai}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Jalur</span>
            <span className="text-sm text-slate-300">{hasil.jalur}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Status</span>
            <span
              className={`rounded-full border px-3 py-0.5 text-[11px] font-semibold ${hasil.warna}`}
            >
              {hasil.status}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <p className="mb-2 text-xs font-semibold text-slate-400">
          Pengajuan Terbaru
        </p>
        <div className="space-y-2">
          {DAFTAR_PENGAJUAN.slice(0, 3).map((d) => (
            <div
              key={d.no}
              className="flex cursor-pointer items-center justify-between text-xs"
              onClick={() => {
                setNoRef(d.no);
                setHasil(d);
              }}
            >
              <span className="text-slate-400">
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
      <p className="mb-3 text-sm leading-relaxed text-slate-400">
        Pertanyaan yang sering diajukan seputar proses penghapusan piutang
        daerah.
      </p>
      {FAQ_LIST.map((f, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.04]"
        >
          <button
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <span className="text-sm font-medium text-slate-200">{f.q}</span>
            <span className="ml-3 shrink-0 text-lg leading-none text-amber-400">
              {openIdx === i ? "−" : "+"}
            </span>
          </button>
          {openIdx === i && (
            <div className="border-t border-white/8 px-4 py-3">
              <p className="text-xs leading-relaxed text-slate-400">{f.a}</p>
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
      <p className="text-sm leading-relaxed text-slate-400">
        Daftar seluruh pengajuan penghapusan piutang yang sedang berjalan di
        semua OPD.
      </p>
      <div className="space-y-2">
        {DAFTAR_PENGAJUAN.map((d) => (
          <div
            key={d.no}
            className="rounded-xl border border-white/8 bg-white/[0.04] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-200">{d.opd}</p>
                <p className="mt-0.5 text-xs text-slate-500">
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
              <span className="text-xs text-slate-500">Nilai:</span>
              <span className="text-xs font-medium text-amber-400">
                {d.nilai}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <p className="text-center text-xs text-slate-600">
          Menampilkan 4 dari 4 pengajuan aktif · TA 2025
        </p>
      </div>
    </div>
  );
}

// ─── Kelopak Config (dengan modal content) ────────────────────────────────────

const KELOPAK: KelopakItem[] = [
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

const WARNA_KELOPAK = ["#e85d04", "#f97316", "#fbbf24", "#f59e0b", "#f97316"];
const SUDUT = [0, 72, 144, 216, 288];

// ─── Modal Component ──────────────────────────────────────────────────────────

function Modal({ item, onClose }: { item: KelopakItem; onClose: () => void }) {
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
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-in w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f2441] shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{item.icon}</span>
            <h2 className="text-base font-semibold text-slate-100">
              {item.modalTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-lg leading-none text-slate-400 transition hover:bg-white/15 hover:text-slate-200"
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <div className="max-h-[70vh] scrollbar-thin overflow-y-auto px-5 py-4">
          {item.modalContent}
        </div>
      </div>
    </div>
  );
}

// ─── Bunga SVG ────────────────────────────────────────────────────────────────

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
        {KELOPAK.map((item, index) => {
          const isActive = activeId === item.id;
          const angle = SUDUT[index];
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

        {/* Pusat bunga */}
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

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function MenuLayananPage() {
  const [activeId, setActiveId] = useState<KelopakId | null>(null);
  const [centerActive, setCenterActive] = useState(false);
  const [modalItem, setModalItem] = useState<KelopakItem | null>(null);

  const handleKelopakClick = (id: KelopakId) => {
    setCenterActive(false);
    setActiveId(id);
    const item = KELOPAK.find((k) => k.id === id) ?? null;
    setModalItem(item);
  };

  const handleCenterClick = () => {
    setActiveId(null);
    setCenterActive(true);
    setModalItem(KELOPAK_DAFTAR);
  };

  const handleCloseModal = () => {
    setModalItem(null);
    setActiveId(null);
    setCenterActive(false);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#0b1f3a] px-4 py-10 text-white">
      {/* Background dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(245,158,11,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 mb-6 text-center">
        <p className="mb-1.5 text-[10px] font-semibold tracking-[3px] text-amber-400 uppercase opacity-85">
          BPKAD Kabupaten Kendal
        </p>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-50">
          Menu Layanan <span className="text-amber-400">SI PUSPITA</span>
        </h1>
        <p className="mt-1 text-[11.5px] text-slate-500">
          Sistem Informasi Pengajuan Penghapusan Piutang
        </p>
      </header>

      {/* Flower SVG */}
      <div className="relative z-10 h-72 w-72 sm:h-80 sm:w-80">
        <BungaSVG
          activeId={activeId}
          centerActive={centerActive}
          onKelopakClick={handleKelopakClick}
          onCenterClick={handleCenterClick}
        />
      </div>

      {/* Hint text */}
      <p className="relative z-10 mt-4 text-xs text-slate-600">
        Klik kelopak atau pusat bunga untuk membuka fitur
      </p>

      {/* Modal */}
      {modalItem && <Modal item={modalItem} onClose={handleCloseModal} />}
    </main>
  );
}
