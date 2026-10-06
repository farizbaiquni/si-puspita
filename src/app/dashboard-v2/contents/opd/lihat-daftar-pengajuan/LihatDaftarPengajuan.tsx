"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  StatusFormulir,
  UploadedFileRef,
} from "@/types/types";
import {
  JENIS_PENGHAPUSAN_OPTIONS,
  JENIS_PIUTANG_OPTIONS,
  getOpdBySlug,
} from "@/types/types";
import { usePengajuanStore, useRiwayatRevisi } from "@/store/pengajuan-store";
import { ajukanUlangPengajuan } from "@/lib/pengajuan";
import {
  IconSearch,
  IconFilter,
  IconClose,
  IconEye,
  IconUser,
  IconBriefcase,
  IconDocument,
  IconCalendar,
  IconTag,
  IconUsers,
  IconCash,
  IconTrash,
  IconFile,
} from "./icons";

// Ikon kecil khusus dipakai di dalam file ini (edit/upload) — tidak ada di
// ./icons, jadi didefinisikan lokal saja.
const IconPencil = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M11.5 2.5a1.5 1.5 0 012.12 2.12L5 13.25l-3 .75.75-3 8.75-8.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCopy = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect
      x="5.5"
      y="5.5"
      width="8.5"
      height="8.5"
      rx="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 10.5h-1a1 1 0 01-1-1v-7a1 1 0 011-1h7a1 1 0 011 1v1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCheck = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      d="M3 8.5l3.2 3L13 4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconUpload = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M8 10.5V2M8 2L5 5M8 2l3 3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 10.5v2a1.5 1.5 0 001.5 1.5h8a1.5 1.5 0 001.5-1.5v-2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ────────────────────────────── HELPERS ─────────────────────────────────────
function formatRupiah(angka: string): string {
  const num = parseInt(angka, 10);
  return isNaN(num) ? "Rp 0" : "Rp " + num.toLocaleString("id-ID");
}

function formatTanggal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "T00:00:00Z"));
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTanggalWaktu(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB"
  );
}

// ────────────────────────────── STATUS CONFIG ───────────────────────────────
const STATUS_CONFIG: Record<
  StatusFormulir,
  { label: string; badgeClass: string; dotClass: string }
> = {
  diajukan: {
    label: "Diajukan",
    badgeClass: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    dotClass: "bg-[#3b82f6]",
  },
  revisi: {
    label: "Revisi",
    badgeClass: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dotClass: "bg-[#f97316]",
  },
  teregistrasi: {
    label: "Teregistrasi",
    badgeClass: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
    dotClass: "bg-[#10b981]",
  },
};

/** Badge config untuk status Reviu Inspektorat (display-only, mengoverride
 *  badge "Teregistrasi" saat `reviuInspektoratStatus === "MENUNGGU_REVIU"`). */
const REVIU_BADGE_CONFIG = {
  label: "Menunggu Reviu Inspektorat",
  badgeClass: "bg-[#f3efff] text-[#5b21b6] border-[#ddd0fb]",
  dotClass: "bg-[#7c3aed]",
} as const;

// Urutan grup status pada daftar: teregistrasi (teregistrasi verifikasi) paling
// atas, lalu revisi, lalu yang masih diajukan / menunggu verifikasi.
const STATUS_ORDER: StatusFormulir[] = ["teregistrasi", "revisi", "diajukan"];

// ──────────────────────── SORT INDICATOR ────────────────────────────────────
const SortIndicator: React.FC<{
  sortKey: string;
  currentKey: string;
  currentDir: "asc" | "desc";
}> = ({ sortKey, currentKey, currentDir }) => {
  if (sortKey !== currentKey) return null;
  return currentDir === "asc" ? (
    <span className="ml-1 inline-block text-[10px]">▲</span>
  ) : (
    <span className="ml-1 inline-block text-[10px]">▼</span>
  );
};

// ──────────────────── STATUS GROUP HEADER ───────────────────────────────────
const StatusGroupHeader: React.FC<{
  status: StatusFormulir;
  count: number;
}> = ({ status, count }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 ${cfg.badgeClass}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dotClass}`} />
      <span className="text-[11.5px] font-bold tracking-wide uppercase">
        {cfg.label}
      </span>
      <span className="rounded-full bg-white/70 px-1.75 py-px text-[10.5px] font-bold">
        {count}
      </span>
    </div>
  );
};

// ──────────────────── STAT CARD ─────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: number | string;
  accentClass: string;
  cardClass: string;
  icon: React.ReactNode;
}> = ({ label, value, accentClass, cardClass, icon }) => (
  <div
    className={`flex min-w-0 items-center gap-2.5 rounded-md border px-3 py-3 sm:gap-3 sm:px-4.5 sm:py-3.5 ${cardClass}`}
  >
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white sm:h-9 sm:w-9 ${accentClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="truncate text-lg leading-tight font-bold text-[#1a1a2e] sm:text-xl">
        {value}
      </div>
      <div className="mt-0.5 truncate text-[11px] text-[#7a8899] sm:text-xs">
        {label}
      </div>
    </div>
  </div>
);

// ───────────────────────── STATUS BADGE ─────────────────────────────────────
const StatusBadge: React.FC<{
  status: StatusFormulir;
  reviuStatus?: "MENUNGGU_REVIU" | null;
}> = ({ status, reviuStatus }) => {
  const cfg =
    reviuStatus === "MENUNGGU_REVIU"
      ? REVIU_BADGE_CONFIG
      : STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.25 rounded-full border px-2.25 py-0.75 text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
};

// ──────────────────── IDENTIFIER CHIP (NO. PENGAJUAN / NO. REGISTRASI + SALIN) ─
const IdentifierChip: React.FC<{
  status: StatusFormulir;
  nomorPengajuan: string;
  nomorRegistrasi: string | null;
  className?: string;
}> = ({ status, nomorPengajuan, nomorRegistrasi, className = "" }) => {
  const [copied, setCopied] = useState(false);
  const isRegistered = status === "teregistrasi";
  const rawValue = isRegistered ? (nomorRegistrasi ?? null) : nomorPengajuan;
  const label = isRegistered ? "No. Registrasi" : "No. Pengajuan";
  const canCopy = !!rawValue;
  const displayValue = rawValue ?? "Belum terbit";

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rawValue) return;
    try {
      await navigator.clipboard.writeText(rawValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API tidak tersedia — abaikan secara diam-diam.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!canCopy}
      title={
        canCopy
          ? `${label}: ${rawValue} — klik untuk salin`
          : "Nomor registrasi belum terbit"
      }
      className={`group/chip mt-1 inline-flex max-w-full items-center gap-1 rounded-[5px] border px-1.5 py-0.5 text-[10.5px] font-medium transition-colors duration-150 ${
        isRegistered
          ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46] hover:bg-[#d7f7e8]"
          : "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412] hover:bg-[#ffedd5]"
      } ${canCopy ? "cursor-pointer" : "cursor-default opacity-70"} ${className}`}
    >
      <span className="shrink-0 opacity-75">{label}</span>
      <span className="truncate font-mono text-[10.5px]">{displayValue}</span>
      {canCopy && (
        <span
          className={`shrink-0 transition-opacity duration-150 ${
            copied ? "opacity-100" : "opacity-50 group-hover/chip:opacity-100"
          }`}
        >
          {copied ? <IconCheck /> : <IconCopy />}
        </span>
      )}
    </button>
  );
};

// ──────────────────── MODAL PREVIEW PDF (FULLSCREEN DENGAN PADDING KECIL) ────
const PdfPreviewModal: React.FC<{
  url: string;
  title: string;
  onClose: () => void;
}> = ({ url, title, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-full w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="truncate text-sm font-medium text-gray-700">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={url}
            className="h-full w-full"
            title={title}
            style={{ border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

// ──────────────── HASIL VERIFIKASI (beda tampilan revisi vs teregistrasi) ──────────
const HasilVerifikasiSection: React.FC<{
  record: FormulirPenghapusanPiutangOPDRecord;
}> = ({ record }) => {
  const { status, catatanVerifikasi, tanggalVerifikasi } = record;

  // Belum diverifikasi — tidak ada apa pun untuk ditampilkan di sini.
  if (status === "diajukan") return null;

  const isRevisi = status === "revisi";

  return (
    <div className="mb-6">
      <h3
        className={`mb-3 text-xs font-bold tracking-widest uppercase ${
          isRevisi ? "text-[#c0392b]" : "text-[#0f6e56]"
        }`}
      >
        Hasil Verifikasi BPKAD
      </h3>

      {isRevisi ? (
        <div className="overflow-hidden rounded-lg border border-[#fecaca] bg-linear-to-br from-[#fef2f2] to-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-[#fecaca]/70 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fee2e2] text-[#c0392b]">
              <svg
                className="h-4.5 w-4.5"
                fill="none"
                viewBox="0 0 16 16"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M8 1.5L14.5 13H1.5L8 1.5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M8 6.5v3.5M8 11.5v.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#991b1b]">
                Pengajuan perlu direvisi
              </div>
              {tanggalVerifikasi && (
                <p className="mt-0.5 text-[11px] text-[#b45454]">
                  Ditinjau pada {formatTanggalWaktu(tanggalVerifikasi)}
                </p>
              )}
            </div>
          </div>

          {/* Keterangan / alasan revisi dari BPKAD */}
          <div className="p-4">
            <div className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#7a1f1f] uppercase">
              Keterangan dari BPKAD
            </div>
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-[#3f1d1d]">
              {catatanVerifikasi || "Tidak ada keterangan tambahan."}
            </p>
            <p className="mt-3 flex items-start gap-1.5 text-[12px] text-[#b45454]">
              <svg
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 16 16"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M8 5v4M8 11.5v.01" strokeLinecap="round" />
                <circle cx="8" cy="8" r="6.5" />
              </svg>
              Lengkapi atau perbaiki dokumen sesuai keterangan di atas, kemudian
              ajukan kembali.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#a7f3d0] bg-linear-to-br from-[#ecfdf5] to-white shadow-sm">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-[#0f6e56]">
              <svg
                className="h-4.5 w-4.5"
                fill="none"
                viewBox="0 0 16 16"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M3 8l3.5 3.5L13 4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#065f46]">
                Pengajuan Teregistrasi
              </div>
              {tanggalVerifikasi && (
                <p className="mt-0.5 text-[11px] text-[#3a8f74]">
                  Diverifikasi pada {formatTanggalWaktu(tanggalVerifikasi)}
                </p>
              )}
            </div>
          </div>
          {catatanVerifikasi && (
            <div className="border-t border-[#a7f3d0]/70 p-4">
              <div className="mb-1 text-[11px] font-semibold tracking-wide text-[#0f6e56] uppercase">
                Catatan tambahan dari BPKAD
              </div>
              <p className="text-[13px] leading-relaxed whitespace-pre-line text-[#0f4c3c]">
                {catatanVerifikasi}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ──────────────────── GROUP CAPTION (penanda kelompok: teks vs berkas) ─────
// Label kecil di atas tiap grid supaya langsung terlihat apakah isinya data
// isian formulir (teks) atau berkas PDF yang diunggah — tanpa perlu
// menebak dari tampilan kartunya saja.
const GroupCaption: React.FC<{ variant: "teks" | "berkas" }> = ({
  variant,
}) => {
  const isBerkas = variant === "berkas";
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span
        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded ${
          isBerkas
            ? "bg-[#eff6ff] text-[#1a4e8f]"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {isBerkas ? <IconFile /> : <IconDocument />}
      </span>
      <span
        className={`text-[10px] font-bold tracking-wider uppercase ${
          isBerkas ? "text-[#1a4e8f]" : "text-slate-500"
        }`}
      >
        {isBerkas ? "Berkas PDF Terunggah" : "Data Isian Formulir"}
      </span>
      <span className="h-px flex-1 bg-[#e8edf4]" />
    </div>
  );
};

// ──────────────────── INFO ROW (label/value, dipakai di grid ringkasan) ────
// Gaya netral (abu-abu, tanpa aksen biru) — sengaja dibuat kontras dengan
// DocumentCard di bawah supaya "data teks" dan "berkas PDF" tidak tertukar
// secara visual sekilas pandang.
const InfoRow: React.FC<{
  icon?: React.ReactNode;
  uraian: string;
  value: React.ReactNode;
}> = ({ icon, uraian, value }) => (
  <div className="flex items-start gap-2.5 rounded-md border border-[#eef1f6] bg-[#f8fafc] px-3 py-2.5">
    {icon && (
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white text-[#64748b] ring-1 ring-[#e8edf4]">
        {icon}
      </span>
    )}
    <div className="min-w-0">
      <div className="text-[10.5px] font-semibold tracking-wide text-[#8a96a3] uppercase">
        {uraian}
      </div>
      <div className="mt-0.5 text-[13px] leading-snug font-semibold wrap-break-word text-[#0f172a]">
        {value || "-"}
      </div>
    </div>
  </div>
);

// ──────────────────── DOCUMENT CARD (dipakai di semua daftar dokumen) ──────
// Gaya "attachment": aksen garis biru di kiri + badge "PDF" eksplisit,
// supaya langsung terbaca sebagai berkas terunggah, bukan data teks biasa.
const DocumentCard: React.FC<{
  label: string;
  file: UploadedFileRef | null | undefined;
  keterangan?: string;
  onPreview: (file: UploadedFileRef, title: string) => void;
}> = ({ label, file, keterangan, onPreview }) => {
  const tersedia = !!file;
  return (
    <div
      className={`flex items-center gap-3 rounded-md border border-l-[3px] bg-white px-3 py-2.5 shadow-xs ${
        tersedia
          ? "border-[#e2e8f2] border-l-[#1a4e8f]"
          : "border-red-100 border-l-red-300 bg-red-50/40"
      }`}
    >
      <div
        className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md ${
          tersedia ? "bg-[#eff6ff] text-[#1a4e8f]" : "bg-red-50 text-red-300"
        }`}
      >
        <IconFile />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className="truncate text-[12.5px] font-semibold text-[#1a1a2e]"
            title={label}
          >
            {label}
          </p>
          {tersedia && (
            <span className="shrink-0 rounded-[3px] bg-[#1a4e8f] px-1 py-px text-[9px] font-bold tracking-wide text-white">
              PDF
            </span>
          )}
        </div>
        {tersedia ? (
          <p
            className="truncate text-[11px] text-[#7a8899]"
            title={file!.namaFile}
          >
            {file!.namaFile}
            {typeof file!.ukuranBytes === "number" && (
              <> · {(file!.ukuranBytes / 1024 / 1024).toFixed(2)} MB</>
            )}
          </p>
        ) : (
          <p className="text-[11px] font-medium text-[#c0392b]">
            {keterangan ?? "Tidak ada"}
          </p>
        )}
      </div>
      {tersedia && (
        <button
          type="button"
          onClick={() => onPreview(file!, `${label} (${file!.namaFile})`)}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1.5 text-[11px] font-semibold text-[#1a4e8f] shadow-sm transition-all hover:bg-[#dbeafe] hover:shadow-md"
        >
          <IconEye />
          <span className="hidden sm:inline">Preview</span>
        </button>
      )}
    </div>
  );
};

// ──────────────────── LEGEND BOX (kelompok dokumen dg judul bingkai) ───────
const LegendBox: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div
    className={`relative rounded-md border border-[#dbe4f0] bg-[#fafbfd] px-3 pt-4 pb-3 ${className}`}
  >
    <span className="absolute -top-2.5 left-3 rounded bg-white px-1.5 text-[10.5px] font-bold tracking-wide text-[#1a4e8f] uppercase">
      {title}
    </span>
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{children}</div>
  </div>
);

// ──────────────────────── MODAL DETAIL ──────────────────────────
// Label tampilan untuk key field yang muncul di snapshot riwayat revisi
// (dataSebelum). Field yang tidak ada di map ini ditampilkan apa adanya
// (fallback ke key mentahnya) — supaya field dokumen atau field baru yang
// belum sempat dilabeli tidak bikin bagian ini error.
const LABEL_FIELD_REVISI: Partial<Record<string, string>> = {
  namaPenanggungJawab: "Nama Penanggung Jawab",
  jabatan: "Jabatan",
  nomorSurat: "Nomor Surat",
  tanggalSurat: "Tanggal Surat",
  jumlahDebitur: "Jumlah Debitur",
  totalNilaiPiutang: "Total Nilai Piutang",
  jenisPiutang: "Jenis Piutang",
  jenisPenghapusan: "Jenis Penghapusan",
};

function formatNilaiRevisi(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object" && "namaFile" in (value as object)) {
    return `📎 ${(value as { namaFile: string }).namaFile}`;
  }
  if (key === "totalNilaiPiutang" && typeof value === "string") {
    return formatRupiah(value);
  }
  if (key === "tanggalSurat" && typeof value === "string") {
    return formatTanggal(value);
  }
  return String(value);
}

// Menampilkan histori data SEBELUM tiap kali OPD "Edit & Ajukan Ulang" —
// dibaca real-time dari subcollection Firestore
// "pengajuan/{id}/riwayatRevisi" (lihat ajukanUlangPengajuan() di
// lib/pengajuan.ts). Data lama tidak pernah tertimpa: setiap revisi cuma
// menambah satu dokumen baru di sini, bukan mengubah yang sebelumnya.
const RiwayatRevisiSection: React.FC<{ pengajuanId: string }> = ({
  pengajuanId,
}) => {
  const { riwayat, isLoading } = useRiwayatRevisi(pengajuanId);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="mb-6 text-xs text-[#7a8899]">Memuat riwayat revisi…</div>
    );
  }
  if (riwayat.length === 0) return null;

  return (
    <div className="mb-6 scroll-mt-3">
      <h3 className="mb-3 text-xs font-bold tracking-widest text-[#1a4e8f] uppercase">
        Riwayat Revisi ({riwayat.length}x)
      </h3>
      <div className="space-y-2">
        {riwayat.map((r) => {
          const isOpen = Boolean(expanded[r.id]);
          const fieldEntries = Object.entries(r.dataSebelum).filter(
            ([key]) =>
              ![
                "status",
                "catatanVerifikasi",
                "tanggalVerifikasi",
                "verifikatorId",
              ].includes(key),
          );
          return (
            <div
              key={r.id}
              className="rounded-md border border-[#e2e8f2] bg-[#fafbfc]"
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                }
                className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left"
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#1a1a2e]">
                    Revisi ke-{r.revisiKe} · {formatTanggalWaktu(r.createdAt)}
                  </div>
                  {r.catatanVerifikasi && (
                    <div className="mt-0.5 truncate text-[11.5px] text-[#7a8899]">
                      Menjawab catatan: {r.catatanVerifikasi}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-[#1a4e8f]">
                  {isOpen ? "Tutup" : "Lihat data lama"}
                </span>
              </button>
              {isOpen && (
                <div className="space-y-1.5 border-t border-[#e2e8f2] px-3 py-2.5">
                  {fieldEntries.length === 0 ? (
                    <p className="text-[11.5px] text-[#7a8899]">
                      Tidak ada field yang berubah pada revisi ini.
                    </p>
                  ) : (
                    fieldEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col gap-0.5 text-[12px] sm:flex-row sm:justify-between"
                      >
                        <span className="text-[#7a8899]">
                          {LABEL_FIELD_REVISI[key] ?? key}
                        </span>
                        <span className="font-medium text-[#1a1a2e] sm:text-right">
                          {formatNilaiRevisi(key, value)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ModalDetail: React.FC<{
  record: FormulirPenghapusanPiutangOPDRecord;
  onClose: () => void;
}> = ({ record, onClose }) => {
  const nom = record;
  const [preview, setPreview] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [copiedNomor, setCopiedNomor] = useState(false);

  const refIdentitas = useRef<HTMLDivElement>(null);
  const refDokumen = useRef<HTMLDivElement>(null);
  const refSubstantif = useRef<HTMLDivElement>(null);
  const refVerifikasi = useRef<HTMLDivElement>(null);

  // Handler stabil — refs baru dibaca (.current) saat tombol benar-benar
  // diklik, bukan saat render. Data yang dirender (navItems) hanya berisi
  // id string, tidak menyimpan objek ref sama sekali.
  const handleNavClick = useCallback(
    (id: "verifikasi" | "dokumen" | "substantif" | "identitas") => {
      const targetRef =
        id === "verifikasi"
          ? refVerifikasi
          : id === "dokumen"
            ? refDokumen
            : id === "substantif"
              ? refSubstantif
              : refIdentitas;
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  const isRegistered = record.status === "teregistrasi";
  const nomorAktif = isRegistered
    ? record.nomorRegistrasi
    : record.nomorPengajuan;
  const labelNomor = isRegistered ? "No. Registrasi" : "No. Pengajuan";

  const handleCopyNomor = async () => {
    if (!nomorAktif) return;
    try {
      await navigator.clipboard.writeText(nomorAktif);
      setCopiedNomor(true);
      window.setTimeout(() => setCopiedNomor(false), 1500);
    } catch {
      // Clipboard API tidak tersedia — abaikan secara diam-diam.
    }
  };

  const openPreview = (file: UploadedFileRef, title: string) =>
    setPreview({ url: file.url, title });

  const identitasRows = [
    { icon: <IconUser />, uraian: "OPD Pengusul", value: record.namaOPD },
    {
      icon: <IconUser />,
      uraian: "Nama Penanggung Jawab",
      value: record.namaPenanggungJawab,
    },
    {
      icon: <IconBriefcase />,
      uraian: "Jabatan (Ka OPD)",
      value: record.jabatan,
    },
    {
      icon: <IconDocument />,
      uraian: "Nomor Surat Pengantar",
      value: record.nomorSurat,
    },
    {
      icon: <IconCalendar />,
      uraian: "Tanggal Surat",
      value: formatTanggal(record.tanggalSurat),
    },
    { icon: <IconTag />, uraian: "Jenis Piutang", value: record.jenisPiutang },
    {
      icon: <IconUsers />,
      uraian: "Jumlah Debitur",
      value: `${record.jumlahDebitur} orang`,
    },
    {
      icon: <IconCash />,
      uraian: "Total Nilai Piutang yang Diusulkan",
      value: formatRupiah(record.totalNilaiPiutang),
    },
    {
      icon: <IconCash />,
      uraian: "Rekapitulasi Angsuran (Rp)",
      value: formatRupiah(nom.nilaiRekapitulasiAngsuran),
    },
    {
      icon: <IconTrash />,
      uraian: "Jenis Penghapusan",
      value: record.jenisPenghapusan,
    },
  ];

  const dokumenChecklist = [
    {
      label: "Bukti Piutang Macet (SKRD/SK/Surat Perjanjian)",
      file: nom.persyaratanPiutangMacet,
    },
    { label: "Surat Pengantar Usulan", file: nom.suratPengantarUsulan },
    {
      label: "Daftar Nominatif Usulan Piutang SKPD",
      file: nom.daftarNominatifPiutang,
    },
    {
      label: "Dokumen Dasar Piutang",
      file:
        nom.opsiDokumenDasarPiutang === "ada" ? nom.dokumenDasarPiutang : null,
      keterangan:
        nom.opsiDokumenDasarPiutang === "tidak_ada" ? "Tidak ada" : undefined,
    },
    {
      label: "Rekapitulasi Saldo Piutang (Rp)",
      file: nom.daftarNominatifPiutang,
    },
    {
      label: "Neraca Awal Terjadinya Piutang",
      file: nom.persyaratanUsiaPencatatan,
    },
    {
      label: "Rekapitulasi Angsuran (Rp)",
      file: nom.daftarNominatifPiutang,
    },
    {
      label:
        "Telah dilakukan kerja sama penagihan dengan melibatkan pihak ketiga (khusus untuk nominal di atas Rp1 Miliar)",
      file:
        nom.opsiKerjaSamaPihakKetiga === "ya"
          ? nom.buktiKerjaSamaPihakKetiga
          : null,
      keterangan:
        nom.opsiKerjaSamaPihakKetiga === "ya" ? undefined : "Tidak dilakukan",
    },
  ];

  const riwayatPenagihanDokumen = [
    {
      label: "Riwayat Penagihan (1)",
      file:
        nom.opsiRiwayatPenagihan === "riwayat_tagihan"
          ? nom.riwayatPenagihan1
          : null,
    },
    {
      label: "Riwayat Penagihan (2)",
      file:
        nom.opsiRiwayatPenagihan === "riwayat_tagihan"
          ? nom.riwayatPenagihan2
          : null,
    },
    {
      label: "Riwayat Penagihan (3)",
      file:
        nom.opsiRiwayatPenagihan === "riwayat_tagihan"
          ? nom.riwayatPenagihan3
          : null,
    },
    {
      label: "Surat Pernyataan OPD",
      file:
        nom.opsiRiwayatPenagihan === "penyataan_opd"
          ? nom.filePernyataanOPD
          : null,
    },
  ];

  const buktiTidakMampuDokumen = [
    {
      label: "Kartu Keluarga Miskin",
      file: nom.buktiTidakMampuKartuKeluargaMiskin,
    },
    { label: "Putusan Pailit", file: nom.buktiTidakMampuPutusanPailit },
    {
      label: "Surat Keterangan Kelurahan / Instansi Berwenang",
      file: nom.buktiTidakMampuSuratKeteranganKelurahan,
    },
    {
      label: "Bukti Penerima Bantuan Sosial (BPNT/BST/PKH)",
      file: nom.buktiTidakMampuBantuanSosial,
    },
    {
      label: "Bukti Kunjungan Penagihan",
      file: nom.buktiTidakMampuKunjunganPenagihan,
    },
  ];

  const substantifDokumen = [
    ...(nom.opsiUpayaOptimal === "ada"
      ? [{ label: "Bukti Upaya Optimal", file: nom.buktiUpayaOptimal }]
      : []),
  ];

  const navItems = [
    ...(record.status !== "diajukan"
      ? [
          {
            id: "verifikasi" as const,
            label: "Hasil Verifikasi",
          },
        ]
      : []),
  ];

  return (
    <>
      {preview && (
        <PdfPreviewModal
          url={preview.url}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}

      <div
        className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,20,40,0.45)] p-0 backdrop-blur-sm sm:p-4 lg:p-6"
        onClick={onClose}
      >
        <div
          className="animate-scale-in flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header ringkas */}
          <div className="shrink-0 bg-linear-to-r from-[#1a4e8f] to-[#0e3b6e] px-4 py-3 text-white sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">
                    {record.namaPenanggungJawab}
                  </h2>
                  <StatusBadge
                    status={record.status}
                    reviuStatus={record.reviuInspektoratStatus}
                  />
                </div>
                <p className="truncate text-sm text-blue-100">
                  {record.namaOPD}
                </p>
                {nomorAktif && (
                  <button
                    type="button"
                    onClick={handleCopyNomor}
                    title="Klik untuk salin nomor"
                    className="group mt-1.5 inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-2 py-1 text-[11px] font-medium text-blue-50 transition-colors hover:bg-white/20"
                  >
                    <span className="shrink-0 opacity-75">{labelNomor}</span>
                    <span className="truncate font-mono">{nomorAktif}</span>
                    <span className="shrink-0 opacity-70 group-hover:opacity-100">
                      {copiedNomor ? <IconCheck /> : <IconCopy />}
                    </span>
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                title="Tutup"
              >
                <IconClose />
              </button>
            </div>
          </div>

          {/* Navigasi cepat antar-bagian — disesuaikan urutan */}
          {navItems.length > 0 && (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-[#e2e8f2] bg-[#f7f8fa] px-4 py-2 sm:px-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className="shrink-0 cursor-pointer rounded-full border border-[#e2e8f2] bg-white px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-[#5a6474] transition-colors hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Body dengan scroll - URUTAN BARU */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {/* 1. Identitas Usulan */}
            <div ref={refIdentitas} className="mb-6 scroll-mt-3">
              <h3 className="mb-3 text-xs font-bold tracking-widest text-[#1a4e8f] uppercase">
                Identitas Usulan
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {identitasRows.map((item, i) => (
                  <InfoRow
                    key={i}
                    icon={item.icon}
                    uraian={item.uraian}
                    value={item.value}
                  />
                ))}
              </div>
            </div>

            {/* 2. Hasil Verifikasi BPKAD — DIPINDAHKAN KE ATAS, DI BAWAH IDENTITAS */}
            {record.status !== "diajukan" && (
              <div ref={refVerifikasi} className="scroll-mt-3">
                <HasilVerifikasiSection record={record} />
              </div>
            )}

            {/* 2b. Riwayat Revisi — hanya muncul kalau pernah direvisi. */}
            {Boolean(record.jumlahRevisi) && (
              <RiwayatRevisiSection pengajuanId={record.id} />
            )}

            {/* 3. Dokumen Administrasi */}
            <div ref={refDokumen} className="mb-6 scroll-mt-3">
              <h3 className="mb-3 text-xs font-bold tracking-widest text-[#1a4e8f] uppercase">
                Dokumen Administrasi
              </h3>
              <GroupCaption variant="berkas" />
              <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {dokumenChecklist.map((doc, idx) => (
                  <DocumentCard
                    key={idx}
                    label={doc.label}
                    file={doc.file}
                    keterangan={doc.keterangan}
                    onPreview={openPreview}
                  />
                ))}
              </div>
              <LegendBox title="Bukti Surat Riwayat Penagihan" className="mt-4">
                {riwayatPenagihanDokumen.map((doc, idx) => (
                  <DocumentCard
                    key={idx}
                    label={doc.label}
                    file={doc.file}
                    onPreview={openPreview}
                  />
                ))}
              </LegendBox>
            </div>

            {/* 4. Checklist Persyaratan Substantif */}
            <div ref={refSubstantif} className="mb-6 scroll-mt-3">
              {substantifDokumen.length > 0 && (
                <div className="mb-3">
                  <GroupCaption variant="berkas" />
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {substantifDokumen.map((doc, idx) => (
                      <DocumentCard
                        key={idx}
                        label={doc.label}
                        file={doc.file}
                        onPreview={openPreview}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-3">
                <LegendBox title="Tidak Mempunyai Kemampuan untuk Menyelesaikan Utang">
                  {buktiTidakMampuDokumen.map((doc, idx) => (
                    <DocumentCard
                      key={idx}
                      label={doc.label}
                      file={doc.file}
                      onPreview={openPreview}
                    />
                  ))}
                </LegendBox>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animasi */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.96);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

// ──────────────────── SLOT FILE (upload ulang / hapus) DI FORM EDIT ────────
// Mendukung 3 aksi per dokumen: Ganti (pilih file baru), Hapus (hapus file
// lama tanpa ganti — dipakai kalau dokumen ternyata tidak relevan/salah
// unggah), dan Batalkan (balik ke keadaan semula sebelum diedit).

const EditFileSlot: React.FC<{
  label: string;
  existingFile: UploadedFileRef | null;
  newFile: File | null;
  dihapus?: boolean;
  onChangeFile: (file: File | null) => void;
  onHapus?: () => void;
  onBatalkanHapus?: () => void;
  required?: boolean;
}> = ({
  label,
  existingFile,
  newFile,
  dihapus = false,
  onChangeFile,
  onHapus,
  onBatalkanHapus,
  required = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChangeFile(file);
    e.target.value = "";
  };

  const tampilanNama = newFile ? newFile.name : existingFile?.namaFile;
  const adaFileLama = Boolean(existingFile);
  const adaFile = Boolean(newFile) || (adaFileLama && !dihapus);

  return (
    <div className="space-y-1">
      <label className="block text-[12.5px] font-semibold text-[#3a4454]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div
        className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${
          newFile
            ? "border-[#a0bdec] bg-[#eff6ff]"
            : dihapus
              ? "border-red-200 bg-red-50"
              : adaFile
                ? "border-[#e2e8f2] bg-[#f7f8fa]"
                : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[#7a8899]">
            <IconFile />
          </span>
          <div className="min-w-0">
            <p
              className={`truncate text-[12.5px] font-medium ${
                dihapus ? "text-red-500 line-through" : "text-[#1a1a2e]"
              }`}
            >
              {dihapus
                ? existingFile?.namaFile
                : tampilanNama || "Belum ada file"}
            </p>
            {newFile && (
              <p className="text-[10.5px] font-semibold text-[#1a4e8f]">
                File baru — akan menggantikan file lama
              </p>
            )}
            {dihapus && (
              <p className="text-[10.5px] font-semibold text-red-500">
                Akan dihapus, tidak digantikan file baru
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePick}
          />
          {!dihapus && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#1a4e8f] hover:bg-[#e8f0fb]"
            >
              <IconUpload />
              {adaFile ? "Ganti" : "Unggah"}
            </button>
          )}
          {newFile && (
            <button
              type="button"
              onClick={() => onChangeFile(null)}
              className="rounded-sm border border-red-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-red-600 hover:bg-red-50"
            >
              Batal
            </button>
          )}
          {/* Hapus file lama (tanpa ganti) — cuma muncul kalau ada file lama,
              belum pilih file baru, dan belum ditandai hapus. Tidak muncul
              kalau dokumen wajib (required) supaya OPD tidak bisa
              mengosongkan dokumen yang harus ada. */}
          {!required && adaFileLama && !newFile && !dihapus && onHapus && (
            <button
              type="button"
              onClick={onHapus}
              className="rounded-sm border border-red-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          )}
          {dihapus && onBatalkanHapus && (
            <button
              type="button"
              onClick={onBatalkanHapus}
              className="rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#5a6474] hover:bg-[#f7f8fa]"
            >
              Batalkan Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────── MODAL EDIT (KHUSUS STATUS REVISI) ────────────────
// Daftar dokumen di sini SENGAJA disamakan persis (nomor, label, keterangan,
// dan field-nya) dengan checklist yang dipakai BPKAD di panel verifikasi
// (lihat buildDokumenTampilan di LihatDaftarPengajuanAdmin.tsx) — supaya
// OPD memperbaiki dokumen yang sama persis dengan yang dinilai BPKAD, dan
// tidak ada field yang salah alamat.

const BUKTI_TIDAK_MAMPU_ITEMS: {
  key: keyof FormulirPenghapusanPiutangOPDRecord;
  label: string;
}[] = [
  { key: "buktiTidakMampuKartuKeluargaMiskin", label: "Kartu Keluarga Miskin" },
  { key: "buktiTidakMampuPutusanPailit", label: "Putusan Pailit" },
  {
    key: "buktiTidakMampuSuratKeteranganKelurahan",
    label: "Surat Keterangan Kelurahan / Instansi Berwenang",
  },
  {
    key: "buktiTidakMampuBantuanSosial",
    label: "Bukti Penerima Bantuan Sosial (BPNT / BST / PKH)",
  },
  {
    key: "buktiTidakMampuKunjunganPenagihan",
    label: "Bukti Kunjungan Penagihan",
  },
];

// Grup 6: "Surat tagihan telah diterbitkan" — 4 kemungkinan bukti, sama
// persis dengan anak grup nomor 6 di buildDokumenTampilan (BPKAD).
const SURAT_TAGIHAN_ITEMS: {
  key: keyof FormulirPenghapusanPiutangOPDRecord;
  label: string;
}[] = [
  { key: "riwayatPenagihan1", label: "Bukti riwayat tagihan ke-1" },
  { key: "riwayatPenagihan2", label: "Bukti riwayat tagihan ke-2" },
  { key: "riwayatPenagihan3", label: "Bukti riwayat tagihan ke-3" },
  { key: "filePernyataanOPD", label: "Bukti pernyataan OPD" },
];

function formatRupiahInput(value: string): string {
  if (!value) return "";
  const num = parseFloat(value.replace(/,/g, ""));
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace(/\s/g, "");
}

const parseRupiahInput = (value: string): string =>
  value.replace(/[^0-9]/g, "");

// Section wrapper kecil supaya tiap bagian formulir konsisten tampilannya.
const EditSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3 className="mb-3 text-xs font-bold tracking-widest text-[#1a4e8f] uppercase">
      {title}
    </h3>
    <div className="space-y-3.5">{children}</div>
  </div>
);

const ModalEditRevisi: React.FC<{
  record: FormulirPenghapusanPiutangOPDRecord;
  onClose: () => void;
  onSimpan: (
    id: string,
    updates: Partial<FormulirPenghapusanPiutangOPDRecord>,
  ) => void;
}> = ({ record, onClose, onSimpan }) => {
  // ── Data Pengajuan ──────────────────────────────────────────────────────
  const [namaPenanggungJawab, setNamaPenanggungJawab] = useState(
    record.namaPenanggungJawab,
  );
  const [jabatan, setJabatan] = useState(record.jabatan);
  const [nomorSurat, setNomorSurat] = useState(record.nomorSurat);
  const [tanggalSurat, setTanggalSurat] = useState(record.tanggalSurat);
  const [jumlahDebitur, setJumlahDebitur] = useState(record.jumlahDebitur);
  const [totalNilaiPiutang, setTotalNilaiPiutang] = useState(
    record.totalNilaiPiutang,
  );
  const [jenisPiutang, setJenisPiutang] = useState(record.jenisPiutang);
  const [jenisPenghapusan, setJenisPenghapusan] = useState(
    record.jenisPenghapusan,
  );

  // ── File: dua map terpisah, "file baru" (ganti) dan "ditandai hapus" ──
  const [fileBaru, setFileBaru] = useState<
    Partial<Record<string, File | null>>
  >({});
  const [fileDihapus, setFileDihapus] = useState<Record<string, boolean>>({});

  const setFile = (key: string, file: File | null) => {
    setFileBaru((prev) => ({ ...prev, [key]: file }));
    if (file) {
      setFileDihapus((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };
  const hapusFile = (key: string) => {
    setFileDihapus((prev) => ({ ...prev, [key]: true }));
    setFileBaru((prev) => ({ ...prev, [key]: null }));
  };
  const batalkanHapusFile = (key: string) => {
    setFileDihapus((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSimpan = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const fieldBaru: Partial<
        Pick<
          FormulirPenghapusanPiutangOPDRecord,
          | "namaPenanggungJawab"
          | "jabatan"
          | "nomorSurat"
          | "tanggalSurat"
          | "jumlahDebitur"
          | "totalNilaiPiutang"
          | "jenisPiutang"
          | "jenisPenghapusan"
        >
      > = {
        namaPenanggungJawab,
        jabatan,
        nomorSurat,
        tanggalSurat,
        jumlahDebitur,
        totalNilaiPiutang,
        jenisPiutang,
        jenisPenghapusan,
      };

      // Map field dokumen -> File baru (diupload) | null (ditandai hapus,
      // tidak diganti) — field yang tidak disentuh sama sekali TIDAK
      // dimasukkan supaya dokumen lama di Firestore tidak ikut tertimpa.
      const fileUpdates: Partial<Record<string, File | null>> = {};
      (Object.keys(fileBaru) as string[]).forEach((key) => {
        if (fileBaru[key]) fileUpdates[key] = fileBaru[key];
      });
      (Object.keys(fileDihapus) as string[]).forEach((key) => {
        if (fileDihapus[key] && !fileBaru[key]) fileUpdates[key] = null;
      });

      // Upload sungguhan ke Cloudinary + simpan snapshot data lama ke
      // riwayatRevisi + timpa dokumen utama — semua di dalam satu fungsi
      // supaya data lama tidak pernah hilang (lihat lib/pengajuan.ts).
      await ajukanUlangPengajuan(
        record.id,
        fieldBaru,
        fileUpdates,
        record.createdBy,
      );

      onSimpan(record.id, { ...fieldBaru, status: "diajukan" });
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan revisi:", err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan revisi. Coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Helper render slot dokumen — bungkus EditFileSlot supaya tiap
  // pemanggilan tidak perlu tulis ulang state hapus/batal. `key` HARUS
  // persis nama field di FormulirPenghapusanPiutangOPDRecord (types.ts)
  // supaya tidak salah alamat saat disimpan.
  const renderSlot = (
    key: keyof FormulirPenghapusanPiutangOPDRecord,
    label: string,
    required = true,
    keterangan?: string,
  ) => (
    <div className="space-y-1">
      <EditFileSlot
        label={label}
        existingFile={record[key] as unknown as UploadedFileRef | null}
        newFile={(fileBaru[key as string] as File | null) ?? null}
        dihapus={Boolean(fileDihapus[key as string])}
        onChangeFile={(f) => setFile(key as string, f)}
        onHapus={() => hapusFile(key as string)}
        onBatalkanHapus={() => batalkanHapusFile(key as string)}
        required={required}
      />
      {keterangan && (
        <p className="pl-1 text-[11px] text-[#7a8899]">{keterangan}</p>
      )}
    </div>
  );

  const jumlahBuktiTidakMampu = BUKTI_TIDAK_MAMPU_ITEMS.filter(({ key }) => {
    if (fileDihapus[key as string]) return false;
    return Boolean(fileBaru[key as string] ?? record[key]);
  }).length;

  const jumlahSuratTagihan = SURAT_TAGIHAN_ITEMS.filter(({ key }) => {
    if (fileDihapus[key as string]) return false;
    return Boolean(fileBaru[key as string] ?? record[key]);
  }).length;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,20,40,0.45)] p-0 backdrop-blur-sm sm:p-4 lg:p-6"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 bg-linear-to-r from-[#c0392b] to-[#9a2e22] px-4 py-3 text-white sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <IconPencil />
              <h2 className="text-base font-bold">Edit &amp; Ajukan Ulang</h2>
            </div>
            <p className="truncate text-sm text-red-100">
              {record.namaPenanggungJawab} · {record.nomorSurat}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            title="Tutup"
          >
            <IconClose />
          </button>
        </div>

        {/* Catatan revisi BPKAD */}
        {record.catatanVerifikasi && (
          <div className="shrink-0 border-b border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-[12.5px] text-[#7a1f1f] sm:px-6">
            <span className="font-bold">Catatan BPKAD: </span>
            {record.catatanVerifikasi}
          </div>
        )}

        {/* Body scrollable */}
        <div className="flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-6">
          <p className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-[12px] text-[#1d4ed8]">
            Perbaiki bagian mana pun sesuai catatan BPKAD di atas — input data,
            ganti dokumen yang salah unggah, atau hapus dokumen yang tidak
            relevan. Dokumen yang tidak disentuh akan tetap memakai file lama.
          </p>

          {/* Data Pengajuan */}
          <EditSection title="Data Pengajuan">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Nama Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={namaPenanggungJawab}
                  onChange={(e) => setNamaPenanggungJawab(e.target.value)}
                  className="w-full rounded-md border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#1a4e8f]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full rounded-md border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#1a4e8f]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Nomor Surat Pengantar
                </label>
                <input
                  type="text"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  className="w-full rounded-md border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#1a4e8f]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Tanggal Surat
                </label>
                <input
                  type="date"
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  className="w-full rounded-md border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] scheme-light outline-none focus:ring-1 focus:ring-[#1a4e8f]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Jumlah Debitur
                </label>
                <input
                  type="text"
                  value={jumlahDebitur}
                  onChange={(e) =>
                    setJumlahDebitur(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full rounded-md border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#1a4e8f]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Total Nilai Piutang
                </label>
                <input
                  type="text"
                  value={formatRupiahInput(totalNilaiPiutang)}
                  onChange={(e) =>
                    setTotalNilaiPiutang(parseRupiahInput(e.target.value))
                  }
                  className="w-full rounded-md border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#1a4e8f]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Jenis Piutang
                </label>
                <select
                  value={jenisPiutang}
                  onChange={(e) =>
                    setJenisPiutang(e.target.value as typeof jenisPiutang)
                  }
                  className="w-full cursor-pointer rounded-md border border-[#e2e8f2] bg-white px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#1a4e8f]/30"
                >
                  {JENIS_PIUTANG_OPTIONS.map((opsi) => (
                    <option key={opsi} value={opsi}>
                      {opsi}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Jenis Penghapusan
                </label>
                <select
                  value={jenisPenghapusan}
                  onChange={(e) =>
                    setJenisPenghapusan(
                      e.target.value as typeof jenisPenghapusan,
                    )
                  }
                  className="w-full cursor-pointer rounded-md border border-[#e2e8f2] bg-white px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#1a4e8f]/30"
                >
                  {JENIS_PENGHAPUSAN_OPTIONS.map((opsi) => (
                    <option key={opsi} value={opsi}>
                      {opsi}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {renderSlot("fileSurat", "Surat Pengantar (Surat Utama)")}
          </EditSection>

          {/* Dokumen Pendukung — nomor, label, dan field SAMA PERSIS dengan
              checklist yang dipakai BPKAD di panel verifikasi. */}
          <EditSection title="Dokumen Pendukung">
            {renderSlot("suratPengantarUsulan", "1. Surat Pengantar Usulan")}
            {renderSlot(
              "daftarNominatifPiutang",
              "2. Daftar Nominatif Usulan Piutang SKPD",
            )}
            {renderSlot(
              "persyaratanPiutangMacet",
              "3. Piutang telah berstatus macet dengan usia piutang > 3 tahun",
              true,
              "Upload SKRD/SK/Surat Perjanjian",
            )}
            {renderSlot(
              "persyaratanUsiaPencatatan",
              "4. Usia pencatatan piutang telah memenuhi ketentuan",
              false,
              "Upload neraca awal terjadinya piutang",
            )}

            {/* 5. Tidak mempunyai kemampuan untuk menyelesaikan utang */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-[#3a4454]">
                  5. Tidak mempunyai kemampuan untuk menyelesaikan utang{" "}
                  <span className="text-red-500">*</span>
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    jumlahBuktiTidakMampu > 0
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {jumlahBuktiTidakMampu} dari {BUKTI_TIDAK_MAMPU_ITEMS.length}{" "}
                  diunggah
                </span>
              </div>
              <p className="text-[11px] text-[#7a8899]">
                Minimal satu harus dipenuhi dibawah ini.
              </p>
              <div className="space-y-3 rounded-md border border-[#e2e8f2] bg-[#f7f8fa] p-3">
                {BUKTI_TIDAK_MAMPU_ITEMS.map((item) => (
                  <EditFileSlot
                    key={item.key as string}
                    label={item.label}
                    existingFile={
                      record[item.key] as unknown as UploadedFileRef | null
                    }
                    newFile={
                      (fileBaru[item.key as string] as File | null) ?? null
                    }
                    dihapus={Boolean(fileDihapus[item.key as string])}
                    onChangeFile={(f) => setFile(item.key as string, f)}
                    onHapus={() => hapusFile(item.key as string)}
                    onBatalkanHapus={() =>
                      batalkanHapusFile(item.key as string)
                    }
                    required={false}
                  />
                ))}
              </div>
            </div>

            {/* 6. Surat tagihan telah diterbitkan */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-[#3a4454]">
                  6. Surat tagihan telah diterbitkan{" "}
                  <span className="text-red-500">*</span>
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    jumlahSuratTagihan > 0
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {jumlahSuratTagihan} dari {SURAT_TAGIHAN_ITEMS.length}{" "}
                  diunggah
                </span>
              </div>
              <p className="text-[11px] text-[#7a8899]">
                Minimal satu harus dipenuhi dibawah ini.
              </p>
              <div className="space-y-3 rounded-md border border-[#e2e8f2] bg-[#f7f8fa] p-3">
                {SURAT_TAGIHAN_ITEMS.map((item) => (
                  <EditFileSlot
                    key={item.key as string}
                    label={item.label}
                    existingFile={
                      record[item.key] as unknown as UploadedFileRef | null
                    }
                    newFile={
                      (fileBaru[item.key as string] as File | null) ?? null
                    }
                    dihapus={Boolean(fileDihapus[item.key as string])}
                    onChangeFile={(f) => setFile(item.key as string, f)}
                    onHapus={() => hapusFile(item.key as string)}
                    onBatalkanHapus={() =>
                      batalkanHapusFile(item.key as string)
                    }
                    required={false}
                  />
                ))}
              </div>
            </div>

            {renderSlot(
              "buktiUpayaOptimal",
              "7. Telah dilakukan upaya optimal sesuai ketentuan",
              false,
              "Opsional",
            )}
            {renderSlot(
              "buktiKerjaSamaPihakKetiga",
              "8. Telah dilakukan kerja sama penagihan dengan melibatkan pihak ketiga",
              false,
              "Khusus untuk nominal di atas Rp 1 Milyar",
            )}
          </EditSection>
        </div>

        {/* Footer aksi */}
        <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#e2e8f2] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {saveError && (
            <p className="w-full text-left text-[12px] font-medium text-[#c0392b] sm:mr-auto sm:w-auto">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-full rounded-md border border-[#e2e8f2] bg-white px-4 py-2.5 text-sm font-medium text-[#5a6474] transition hover:bg-[#f7f8fa] disabled:opacity-50 sm:w-auto"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSimpan}
            disabled={isSaving}
            className="w-full rounded-md bg-[#1a4e8f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0e3b6e] disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Menyimpan…" : "Simpan & Ajukan Ulang"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────── KARTU PENGAJUAN (TAMPILAN MOBILE, PENGGANTI TABEL) ─────
const RecordCardMobile: React.FC<{
  record: FormulirPenghapusanPiutangOPDRecord;
  nomor: number;
  onLihatDetail: () => void;
  onEditRevisi: () => void;
}> = ({ record, nomor, onLihatDetail, onEditRevisi }) => (
  <div className="rounded-md border border-[#e2e8f2] bg-white p-3.5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="text-[11px] font-semibold text-[#b0bac5]">
          #{nomor}
        </span>
        <div className="mt-1 truncate text-[13px] font-semibold text-[#1a1a2e]">
          {record.namaPenanggungJawab}
        </div>
        <div className="truncate text-[11px] text-[#7a8899]">
          {record.jabatan}
        </div>
        <IdentifierChip
          status={record.status}
          nomorPengajuan={record.nomorPengajuan}
          nomorRegistrasi={record.nomorRegistrasi}
        />
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onLihatDetail}
          title="Lihat Detail"
          className="flex h-8 cursor-pointer items-center gap-1 rounded-[7px] border border-[#e2e8f2] bg-[#f7f8fa] px-2 text-[11px] font-semibold text-[#7a8899] transition-colors duration-150 hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
        >
          <IconEye /> Lihat
        </button>
        {record.status === "revisi" && (
          <button
            onClick={onEditRevisi}
            title="Edit Pengajuan"
            className="flex h-8 cursor-pointer items-center gap-1 rounded-[7px] border border-[#fed7aa] bg-[#fff7ed] px-2 text-[11px] font-semibold text-[#9a3412] transition-colors duration-150 hover:border-[#f97316] hover:bg-[#ffedd5]"
          >
            <IconPencil /> Edit
          </button>
        )}
      </div>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#f1f5f9] pt-3 text-xs">
      <div>
        <div className="text-[10px] tracking-wide text-[#b0bac5] uppercase">
          Tanggal Surat
        </div>
        <div className="mt-0.5 text-[#5a6474]">
          {formatTanggal(record.tanggalSurat)}
        </div>
      </div>
      <div>
        <div className="text-[10px] tracking-wide text-[#b0bac5] uppercase">
          Debitur
        </div>
        <div className="mt-0.5 text-[#5a6474]">
          {record.jumlahDebitur} orang
        </div>
      </div>
      <div className="col-span-2">
        <div className="text-[10px] tracking-wide text-[#b0bac5] uppercase">
          Total Piutang
        </div>
        <div className="mt-0.5 font-bold text-[#1a4e8f]">
          {formatRupiah(record.totalNilaiPiutang)}
        </div>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f1f5f9] pt-3">
      <StatusBadge
        status={record.status}
        reviuStatus={record.reviuInspektoratStatus}
      />
      {record.status === "revisi" && (
        <button
          onClick={onLihatDetail}
          className="cursor-pointer text-[11px] font-semibold text-[#c0392b] hover:underline"
        >
          Lihat catatan revisi →
        </button>
      )}
    </div>
  </div>
);

// ──────────────────────────── MAIN COMPONENT ─────────────────────────────────
export default function DaftarPengajuanOPDBaru({
  data: dataProp,
  namaOPDAktif,
}: {
  data?: FormulirPenghapusanPiutangOPDRecord[];
  namaOPDAktif?: string;
}) {
  const NAMA_OPD_AKTIF =
    namaOPDAktif ?? getOpdBySlug("disdagkopukm")?.nama ?? "";

  const { data: dataStore, isLoading } = usePengajuanStore();
  // `overrides` HANYA dipakai saat komponen dipakai dengan `data` prop
  // manual (mis. cerita/preview tanpa Firestore) — kalau ambil dari
  // dataStore, onSnapshot di PengajuanProvider sudah otomatis membawa
  // perubahan real-time setelah ajukanUlangPengajuan() berhasil, jadi
  // tidak perlu (dan tidak boleh) di-override manual lagi di sini.
  const [overrides, setOverrides] = useState<
    Record<string, Partial<FormulirPenghapusanPiutangOPDRecord>>
  >({});

  const data = useMemo(() => {
    if (dataProp) {
      return dataProp
        .filter((r) => r.namaOPD === NAMA_OPD_AKTIF)
        .map((r) => (overrides[r.id] ? { ...r, ...overrides[r.id] } : r));
    }
    return dataStore.filter((r) => r.namaOPD === NAMA_OPD_AKTIF);
  }, [dataProp, dataStore, overrides, NAMA_OPD_AKTIF]);

  const [filter, setFilter] = useState<{
    search: string;
    status: StatusFormulir | "SEMUA";
  }>({ search: "", status: "SEMUA" });

  const [sortKey, setSortKey] = useState<"tanggal" | "total">("tanggal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedRecord, setSelectedRecord] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);
  const [editRecord, setEditRecord] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);

  // Dipanggil ModalEditRevisi SETELAH ajukanUlangPengajuan() sukses simpan
  // ke Firestore. Untuk mode dataStore (real), tidak perlu apa-apa lagi di
  // sini — onSnapshot yang urus refresh tampilan. `overrides` cuma dipakai
  // untuk mode `data` prop manual (lihat komentar di atas).
  const handleSimpanEdit = (
    id: string,
    updates: Partial<FormulirPenghapusanPiutangOPDRecord>,
  ) => {
    if (dataProp) {
      setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
    }
  };

  const stats = useMemo(() => {
    const total = data.length;
    const diajukan = data.filter((r) => r.status === "diajukan").length;
    const revisi = data.filter((r) => r.status === "revisi").length;
    const teregistrasi = data.filter((r) => r.status === "teregistrasi").length;
    return { total, diajukan, revisi, teregistrasi };
  }, [data]);

  const filtered = useMemo(() => {
    let result = [...data];
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.nomorPengajuan.toLowerCase().includes(q) ||
          (r.nomorRegistrasi?.toLowerCase().includes(q) ?? false) ||
          r.namaPenanggungJawab.toLowerCase().includes(q) ||
          r.nomorSurat.toLowerCase().includes(q),
      );
    }
    if (filter.status !== "SEMUA") {
      result = result.filter((r) => r.status === filter.status);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "tanggal") {
        cmp = a.tanggalSurat.localeCompare(b.tanggalSurat);
      } else {
        const totalA = parseInt(a.totalNilaiPiutang, 10) || 0;
        const totalB = parseInt(b.totalNilaiPiutang, 10) || 0;
        cmp = totalA - totalB;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [data, filter, sortKey, sortDir]);

  const grouped = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      items: filtered.filter((r) => r.status === status),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  const toggleSortKey = (key: "tanggal" | "total") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (isLoading && !dataProp) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-[#7a8899]">
        Memuat daftar pengajuan…
      </div>
    );
  }

  return (
    <div className="font-inherit">
      {selectedRecord && (
        <ModalDetail
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {editRecord && (
        <ModalEditRevisi
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSimpan={handleSimpanEdit}
        />
      )}

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Pengajuan"
          value={stats.total}
          accentClass="bg-[#1a4e8f]"
          cardClass="bg-[#e8f0fb] border-[#c8d9f5]"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <path
                d="M9 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V7L9 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 2v5h5" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Diajukan"
          value={stats.diajukan}
          accentClass="bg-[#2563eb]"
          cardClass="bg-[#eff6ff] border-[#bfdbfe]"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <circle cx="8" cy="8" r="6.5" />
              <path
                d="M8 5v3.5l2 1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Revisi"
          value={stats.revisi}
          accentClass="bg-[#f97316]"
          cardClass="bg-[#fff7ed] border-[#fed7aa]"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <path
                d="M8 1.5L14.5 13H1.5L8 1.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8 6.5v3.5M8 11.5v.5" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Teregistrasi"
          value={stats.teregistrasi}
          accentClass="bg-[#10b981]"
          cardClass="bg-[#ecfdf5] border-[#a7f3d0]"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <path
                d="M3 8l3.5 3.5L13 4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5 rounded-md border border-[#e2e8f2] bg-white p-3 sm:p-[14px_16px]">
        <div className="flex min-w-0 flex-[1_1_100%] items-center gap-2 rounded-lg border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.75 sm:flex-[1_1_200px]">
          <span className="shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari nomor registrasi, nama, atau nomor surat…"
            value={filter.search}
            onChange={(e) =>
              setFilter((f) => ({ ...f, search: e.target.value }))
            }
            className="w-full border-none bg-transparent text-[13px] text-[#1a1a2e] outline-none"
          />
          {filter.search && (
            <button
              onClick={() => setFilter((f) => ({ ...f, search: "" }))}
              className="flex cursor-pointer border-none bg-transparent p-0 text-[#7a8899]"
            >
              <IconClose />
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[#7a8899]">
            <IconFilter />
          </span>
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                status: e.target.value as StatusFormulir | "SEMUA",
              }))
            }
            className="cursor-pointer rounded-[7px] border border-[#e2e8f2] bg-white px-2.5 py-1.5 text-xs text-[#1a1a2e] outline-none"
          >
            <option value="SEMUA">Semua Status</option>
            {(Object.keys(STATUS_CONFIG) as StatusFormulir[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto shrink-0 text-xs whitespace-nowrap text-[#7a8899]">
          {filtered.length} dari {data.length} pengajuan
        </div>
      </div>

      {/* Daftar pengajuan */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-[#e2e8f2] bg-white p-[56px_24px] text-[#7a8899]">
          <div className="text-[#1a4e8f] opacity-35">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path
                d="M18 3H8a2 2 0 00-2 2v22a2 2 0 002 2h16a2 2 0 002-2V11L18 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M18 3v8h8M11 17h10M11 21h7" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-[#8a96a3]">
            Tidak ada pengajuan yang cocok
          </div>
          <div className="text-xs text-[#b0bac5]">
            Coba ubah filter atau kata kunci pencarian.
          </div>
        </div>
      ) : (
        <>
          {/* Tampilan mobile */}
          <div className="space-y-4 md:hidden">
            {(() => {
              let counter = 0;
              return grouped.map((group) => (
                <div key={group.status} className="space-y-3">
                  <StatusGroupHeader
                    status={group.status}
                    count={group.items.length}
                  />
                  {group.items.map((record) => {
                    counter += 1;
                    return (
                      <RecordCardMobile
                        key={record.id}
                        record={record}
                        nomor={counter}
                        onLihatDetail={() => setSelectedRecord(record)}
                        onEditRevisi={() => setEditRecord(record)}
                      />
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* Tampilan desktop */}
          <div className="hidden overflow-x-auto rounded-md border border-[#e2e8f2] bg-white md:block">
            <table className="w-full min-w-180 border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e8f2] bg-[#263e6e]">
                  <th className="w-8 p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    No
                  </th>
                  <th className="p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    Pengajuan
                  </th>
                  <th
                    className="w-30 cursor-pointer p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none"
                    onClick={() => toggleSortKey("tanggal")}
                  >
                    Tanggal Surat{" "}
                    <SortIndicator
                      sortKey={sortKey}
                      currentKey="tanggal"
                      currentDir={sortDir}
                    />
                  </th>
                  <th
                    className="w-45 cursor-pointer p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none"
                    onClick={() => toggleSortKey("total")}
                  >
                    Total Piutang{" "}
                    <SortIndicator
                      sortKey={sortKey}
                      currentKey="total"
                      currentDir={sortDir}
                    />
                  </th>
                  <th className="w-20 p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    Debitur
                  </th>
                  <th className="w-32.5 p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    Status
                  </th>
                  <th className="w-18 p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let counter = 0;
                  return grouped.map((group) => {
                    const cfg = STATUS_CONFIG[group.status];
                    return (
                      <React.Fragment key={group.status}>
                        <tr>
                          <td
                            colSpan={7}
                            className={`border-b p-[7px_14px] ${cfg.badgeClass}`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-1.75 w-1.75 shrink-0 rounded-full ${cfg.dotClass}`}
                              />
                              <span className="text-[11px] font-bold tracking-[0.06em] uppercase">
                                {cfg.label}
                              </span>
                              <span className="rounded-full bg-white/70 px-1.75 py-px text-[10px] font-bold">
                                {group.items.length}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {group.items.map((record, idxInGroup) => {
                          counter += 1;
                          const isLastRow =
                            idxInGroup === group.items.length - 1;
                          return (
                            <tr
                              key={record.id}
                              className={`transition-colors duration-150 hover:bg-[#fafbfc] ${isLastRow ? "" : "border-b border-[#e2e8f2]"}`}
                            >
                              <td className="p-[12px_14px] text-xs font-semibold whitespace-nowrap text-[#7a8899]">
                                {counter}
                              </td>
                              <td className="p-[12px_14px]">
                                <div className="text-[13px] font-semibold whitespace-nowrap text-[#1a1a2e]">
                                  {record.namaPenanggungJawab}
                                </div>
                                <div className="mt-px text-[11px] text-[#7a8899]">
                                  {record.jabatan}
                                </div>
                                <IdentifierChip
                                  status={record.status}
                                  nomorPengajuan={record.nomorPengajuan}
                                  nomorRegistrasi={record.nomorRegistrasi}
                                />
                              </td>
                              <td className="p-[12px_14px] text-xs whitespace-nowrap text-[#5a6474]">
                                {formatTanggal(record.tanggalSurat)}
                              </td>
                              <td className="p-[12px_14px] font-bold whitespace-nowrap text-[#1a4e8f]">
                                {formatRupiah(record.totalNilaiPiutang)}
                              </td>
                              <td className="p-[12px_14px] text-xs whitespace-nowrap text-[#5a6474]">
                                {record.jumlahDebitur} orang
                              </td>
                              <td className="p-[12px_14px] whitespace-nowrap">
                                <StatusBadge
                                  status={record.status}
                                  reviuStatus={record.reviuInspektoratStatus}
                                />
                                {record.status === "revisi" && (
                                  <button
                                    onClick={() => setSelectedRecord(record)}
                                    className="mt-1 block cursor-pointer text-[11px] font-semibold text-[#c0392b] hover:underline"
                                  >
                                    Lihat catatan revisi →
                                  </button>
                                )}
                              </td>
                              <td className="p-[12px_14px] whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setSelectedRecord(record)}
                                    title="Lihat Detail"
                                    className="flex h-7 cursor-pointer items-center gap-1 rounded-[7px] border border-[#e2e8f2] bg-[#f7f8fa] px-2 text-[11px] font-semibold text-[#7a8899] transition-colors duration-150 hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
                                  >
                                    <IconEye /> Lihat
                                  </button>
                                  {record.status === "revisi" && (
                                    <button
                                      onClick={() => setEditRecord(record)}
                                      title="Edit Pengajuan"
                                      className="flex h-7 cursor-pointer items-center gap-1 rounded-[7px] border border-[#fed7aa] bg-[#fff7ed] px-2 text-[11px] font-semibold text-[#9a3412] transition-colors duration-150 hover:border-[#f97316] hover:bg-[#ffedd5]"
                                    >
                                      <IconPencil /> Edit
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}

      {filtered.length > 0 && (
        <div className="mt-2.5 text-right text-[11px] text-[#b0bac5]">
          Menampilkan {filtered.length} dari {data.length} pengajuan
        </div>
      )}
    </div>
  );
}
