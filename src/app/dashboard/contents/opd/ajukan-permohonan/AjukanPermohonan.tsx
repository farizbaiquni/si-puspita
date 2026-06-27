"use client";

/**
 * AjukanPermohonan.tsx
 * Wizard pengajuan permohonan penghapusan piutang daerah.
 * Mengikuti alur App Design & Flow SI PUSPITA + Perbup Kendal.
 *
 * Path: src/app/dashboard/contents/opd/AjukanPermohonan.tsx
 */

import React, { useState, useCallback, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  XCircle,
} from "lucide-react";
import type {
  WizardState,
  DokumenUpload,
  JenisPiutang,
  JalurPengajuan,
  Pengajuan,
} from "@/types/types";
import {
  BATAS_WAKTU_NON_PUPN,
  OPSI_PENAGIHAN_OPTIMAL,
  OPSI_KETIDAKMAMPUAN,
} from "@/types/types";

// ─────────────────────────────────────────────────────────────────────────────
// Palette & constants
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  primary: "#1a4e8f",
  primaryLight: "#e8f0fb",
  primaryMid: "#2d63a8",
  accent: "#0f9b6e", // hijau sukses / konfirmasi
  accentLight: "#e6f7f2",
  warn: "#e07020",
  warnLight: "#fff3e6",
  danger: "#c0392b",
  dangerLight: "#fdecea",
  muted: "#7a8899",
  border: "#e2e8f2",
  bg: "#f7f8fa",
  white: "#ffffff",
  text: "#1a1a2e",
  textSub: "#5a6474",
};

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRupiah(value: string): string {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  return "Rp " + parseInt(num, 10).toLocaleString("id-ID");
}

function parseNominal(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, "") || "0", 10);
}

export const getBatasWaktu = (nominal: number) => {
  const item = BATAS_WAKTU_NON_PUPN.find(
    (x) =>
      nominal >= x.minSisa && (x.maxSisa === undefined || nominal <= x.maxSisa),
  )!;

  return {
    ...item,
    batasTahun: item.tahun,
  };
};

async function validatePDF(
  file: File,
): Promise<{ valid: boolean; error?: string }> {
  if (file.type !== "application/pdf") {
    return { valid: false, error: "File harus berformat PDF." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file melebihi ${MAX_FILE_SIZE_MB} MB.`,
    };
  }

  // Cek magic bytes PDF
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      const header = String.fromCharCode(arr[0], arr[1], arr[2], arr[3]);
      if (header !== "%PDF") {
        resolve({
          valid: false,
          error: "File rusak atau bukan PDF yang valid.",
        });
      } else {
        resolve({ valid: true });
      }
    };
    reader.onerror = () =>
      resolve({ valid: false, error: "Gagal membaca file." });
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator Nomor Registrasi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Menghasilkan Nomor Registrasi unik untuk setiap pengajuan yang berhasil
 * diinput. Format: PGJ-<tahun>-<timestamp 6 digit terakhir><random 3 digit>
 * Kombinasi timestamp + random mencegah duplikasi meski dua pengajuan
 * dibuat pada milidetik yang sama.
 */
function generateNomorRegistrasi(): string {
  const tahun = new Date().getFullYear();
  const timestampPart = String(Date.now()).slice(-6);
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `PGJ-${tahun}-${timestampPart}${randomPart}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder — konversi WizardState ke Pengajuan
// ─────────────────────────────────────────────────────────────────────────────

/** Tandai dokumen dengan keterangan jenis — disimpan di field id dengan prefix "keterangan||" */
function tagDok(dok: DokumenUpload, keterangan: string): DokumenUpload {
  return { ...dok, id: `keterangan||${keterangan}||${dok.id}` };
}

function buildPengajuan(state: WizardState): Pengajuan {
  const isPUPN = state.jalur === "PUPN";
  const nominal = parseNominal(state.nominalUtang);

  // Kumpulkan semua dokumen yang valid, tandai dengan keterangan jenisnya
  const dokumen: DokumenUpload[] = [];
  if (isPUPN) {
    if (state.pupn.dokumenSKRD)
      dokumen.push(
        tagDok(
          state.pupn.dokumenSKRD,
          `SKRD — No. ${state.pupn.nomorSKRD || "-"}`,
        ),
      );
    if (state.pupn.dokumenSTRD)
      dokumen.push(
        tagDok(
          state.pupn.dokumenSTRD,
          `STRD — No. ${state.pupn.nomorSTRD || "-"}`,
        ),
      );
    const LABEL_DOK_PUPN: Record<string, string> = {
      beritaAcaraIdentifikasi: "Berita Acara Identifikasi Lapangan",
      suratKematian: "Surat Keterangan Kematian / Akte Kematian",
      suratUsahaTidakBeroperasi: "Surat Keterangan Usaha Tidak Beroperasi",
      suratJaminanTidakCukup: "Surat Keterangan Jaminan Tidak Cukup",
      suratKeberadaanTidakDiketahui:
        "Surat Keterangan Keberadaan Tidak Diketahui",
      suratTidakMampu: "Surat Keterangan Tidak Mampu",
      suratAhliWarisTidakMampu:
        "Surat Keterangan Ahli Waris / Penjamin Tidak Mampu",
    };
    Object.entries(state.pupn.dokumenPendukung).forEach(([key, d]) => {
      if (d) dokumen.push(tagDok(d, LABEL_DOK_PUPN[key] ?? key));
    });
  } else {
    // Non-PUPN: tandai dokumen penagihan dengan label opsi yang dipilih
    const labelPenagihan = state.nonPupn.upayaPenagihanDipilih
      .map((kode) => {
        const found = OPSI_PENAGIHAN_OPTIMAL.find((o) => o.kode === kode);
        return found ? `${kode}. ${found.label}` : kode;
      })
      .join(", ");
    state.nonPupn.dokumenPenagihanOptimal.forEach((d, i) =>
      dokumen.push(
        tagDok(
          d,
          `Bukti Penagihan Optimal${state.nonPupn.dokumenPenagihanOptimal.length > 1 ? ` (${i + 1})` : ""} — ${labelPenagihan}`,
        ),
      ),
    );
    // Non-PUPN: tandai dokumen ketidakmampuan dengan label opsi
    Object.entries(state.nonPupn.dokumenKetidakmampuan).forEach(([kode, d]) => {
      if (!d) return;
      const found = OPSI_KETIDAKMAMPUAN.find((o) => o.kode === kode);
      const label = found ? `${kode}. ${found.label}` : kode;
      dokumen.push(tagDok(d, `Bukti Ketidakmampuan — ${label}`));
    });
  }

  return {
    id: generateNomorRegistrasi(),
    tanggalDibuat: new Date().toISOString(),
    status: "DIAJUKAN",
    jalur: state.jalur,
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
    dokumen,
    dataPenanggung: isPUPN
      ? {
          namaWP: state.pupn.namaWP,
          alamatWP: state.pupn.alamatWP,
          nik: state.pupn.nik,
          pekerjaan: state.pupn.pekerjaan,
          jenisPiutang: state.jenisPiutang,
          nominalUtang: nominal,
          nomorSKRD: state.pupn.nomorSKRD,
          nomorSTRD: state.pupn.nomorSTRD,
          sebabPiutangMacet: state.pupn.sebabPiutangMacet,
          adaBLUD: state.pupn.adaBLUD ?? false,
        }
      : {
          namaWP: state.nonPupn.namaWP,
          alamatWP: state.nonPupn.alamatWP,
          nik: state.nonPupn.nik,
          pekerjaan: "",
          jenisPiutang: state.jenisPiutang,
          nominalUtang: nominal,
          sebabPiutangMacet: state.nonPupn.sebabPiutangMacet,
        },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

const initialState: WizardState = {
  jenisPiutang: null,
  nominalUtang: "",
  jalur: null,
  currentStep: 0,
  pupn: {
    tanggalTerjadi: "",
    nomorSKRD: "",
    dokumenSKRD: null,
    nomorSTRD: "",
    dokumenSTRD: null,
    dokumenPendukung: {
      beritaAcaraIdentifikasi: null,
      suratKematian: null,
      suratUsahaTidakBeroperasi: null,
      suratJaminanTidakCukup: null,
      suratKeberadaanTidakDiketahui: null,
      suratTidakMampu: null,
      suratAhliWarisTidakMampu: null,
    },
    namaWP: "",
    alamatWP: "",
    nik: "",
    pekerjaan: "",
    sebabPiutangMacet: "",
    adaBLUD: null,
  },
  nonPupn: {
    tanggalTerjadi: "",
    upayaPenagihanDipilih: [],
    dokumenPenagihanOptimal: [],
    dokumenKetidakmampuan: {},
    opsiKetidakmampuanDipilih: [],
    namaWP: "",
    alamatWP: "",
    nik: "",
    sebabPiutangMacet: "",
  },
  selesai: false,
  berhenti: false,
  pesanBerhenti: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable UI primitives
// ─────────────────────────────────────────────────────────────────────────────

const Badge: React.FC<{
  label: string;
  color?: "blue" | "green" | "orange";
}> = ({ label, color = "blue" }) => {
  const variants = {
    blue: "border border-blue-200 bg-blue-50 text-blue-700",
    green: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase ${variants[color]}`}
    >
      {label}
    </span>
  );
};

const StepIndicator: React.FC<{
  steps: string[];
  current: number;
  jalur: JalurPengajuan;
}> = ({ steps, current, jalur }) => {
  const isPUPN = jalur === "PUPN";

  const getVariant = (i: number) => {
    const done = i < current;
    const active = i === current;

    if (done) {
      return {
        node: "bg-emerald-600 text-white shadow-sm",
        label: "text-emerald-700 font-semibold",
        connector: "bg-emerald-500",
      };
    }

    if (active) {
      return {
        node: isPUPN
          ? "bg-blue-700 text-white ring-1 ring-slate-700 shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          : "bg-amber-600 text-white ring-1 ring-slate-700 shadow-[0_2px_6px_rgba(0,0,0,0.35)]",
        label: isPUPN
          ? "text-blue-800 font-semibold"
          : "text-amber-800 font-semibold",
        connector: "bg-slate-700",
      };
    }

    return {
      node: "bg-slate-300 border border-slate-700 text-slate-700 shadow-sm",
      label: "text-black",
      connector: "bg-slate-700",
    };
  };

  return (
    <div className="relative mx-10 mt-9 mb-3">
      {/* BACKGROUND TRACK */}
      <div className="absolute top-5 right-0 left-0 h-0.75 rounded-full bg-slate-400" />

      {/* PROGRESS TRACK */}
      <div
        className="absolute top-5 left-0 h-0.75 rounded-full bg-emerald-500 transition-all duration-300"
        style={{
          width: `${(current / (steps.length - 1)) * 100}%`,
        }}
      />

      {/* STEPS */}
      <div className="flex items-start">
        {steps.map((label, i) => {
          const done = i < current;
          const v = getVariant(i);

          const isFirst = i === 0;
          const isLast = i === steps.length - 1;

          return (
            <div
              key={i}
              className={`relative z-10 flex flex-1 flex-col items-center ${isFirst ? "items-start" : ""} ${isLast ? "items-end" : ""} `}
            >
              {/* NODE */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium font-semibold transition-all duration-200 ${v.node} `}
              >
                {done ? "✓" : i + 1}
              </div>

              {/* LABEL */}
              <span
                className={`mt-2 max-w-22.5 text-[11px] leading-tight font-semibold ${v.label} ${isFirst ? "text-left" : ""} ${isLast ? "text-right" : "text-center"} `}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{
  nomor: string;
  judul: string;
  deskripsi?: string;
  jalur?: JalurPengajuan;
  children: React.ReactNode;
}> = ({ nomor, judul, deskripsi, jalur, children }) => {
  const isNonPupn = jalur === "NON_PUPN";

  return (
    <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
      <div
        className={`border-b border-slate-200 px-6 py-2 ${
          isNonPupn ? "bg-amber-700" : "bg-blue-900"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 text-white">
          <span className="text-md font-extrabold">{nomor}.</span>

          <h3 className="text-[16px] font-bold">{judul}</h3>
        </div>

        {deskripsi && (
          <p className="pl-5 text-[14px] leading-snug text-slate-100">
            {deskripsi}
          </p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
};

const RadioOption: React.FC<{
  selected: boolean;
  label: string;
  sublabel?: string;
  warning?: boolean;
  onSelect: () => void;
}> = ({ selected, label, sublabel, warning, onSelect }) => (
  <label
    onClick={onSelect}
    className={`mb-2.5 flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-all duration-150 ${
      selected
        ? warning
          ? "border-amber-500 bg-amber-50"
          : "border-blue-700 bg-blue-50"
        : "border-slate-200 bg-white"
    }`}
  >
    <div
      className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
        selected
          ? warning
            ? "border-amber-500 bg-amber-500"
            : "border-blue-700 bg-blue-700"
          : "border-slate-200 bg-white"
      }`}
    >
      {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
    </div>

    <div>
      <div
        className={`text-sm font-semibold ${
          warning && selected ? "text-amber-700" : "text-slate-800"
        }`}
      >
        {label}
      </div>

      {sublabel && (
        <div className="mt-0.5 text-xs text-slate-500">{sublabel}</div>
      )}
    </div>
  </label>
);

const CheckOption: React.FC<{
  kode: string;
  checked: boolean;
  label: string;
  sublabel?: string;
  wajib?: boolean;
  jalur?: JalurPengajuan;
  onToggle: () => void;
}> = ({ kode, checked, label, sublabel, wajib, jalur = "PUPN", onToggle }) => {
  const isOrange = jalur === "NON_PUPN";

  const wrapperClass = checked
    ? isOrange
      ? "border-amber-600 bg-amber-50"
      : "border-blue-700 bg-blue-50"
    : "border-slate-300 bg-white hover:border-slate-400";

  const boxClass = checked
    ? isOrange
      ? "border-amber-600 bg-amber-600"
      : "border-blue-700 bg-blue-700"
    : "border-slate-300 bg-white";

  return (
    <label
      onClick={onToggle}
      className={`mb-2.5 flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-all duration-150 hover:shadow-sm ${wrapperClass}`}
    >
      <div
        className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border-2 ${boxClass}`}
      >
        {checked && (
          <svg
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M1 4l3 3 5-6"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          {wajib && <Badge label="Wajib > 1M" color="orange" />}
        </div>

        <div className="mt-0.5 text-[13.5px] font-semibold text-slate-800">
          {label}
        </div>

        {sublabel && (
          <div className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {sublabel}
          </div>
        )}
      </div>
    </label>
  );
};

// ── Modal Preview PDF ─────────────────────────────────────────────────────────

const ModalPreviewPDF: React.FC<{
  namaFile: string;
  url: string;
  onClose: () => void;
}> = ({ namaFile, url, onClose }) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-sm bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2">
          <div className="flex min-w-0 items-center gap-x-3 py-1">
            {/* PDF badge */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50">
              <svg
                width="20"
                height="20"
                viewBox="0 0 18 18"
                fill="none"
                stroke="#e53e3e"
                strokeWidth="1.7"
              >
                <path
                  d="M10.5 2H4.5A1.5 1.5 0 003 3.5v11A1.5 1.5 0 004.5 16h9A1.5 1.5 0 0015 14.5V6.5L10.5 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10.5 2v4.5H15" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0 leading-4">
              <p className="truncate text-[15px] font-semibold text-slate-800">
                {namaFile}
              </p>
              <p className="text-[13px] text-slate-600">Preview Dokumen PDF</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {/* Buka di tab baru */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-sm bg-slate-200 px-2.5 py-1.5 text-[13px] font-medium text-slate-800 transition hover:bg-slate-200 hover:text-slate-900"
              title="Buka di tab baru"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 13 13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8"
                  strokeLinecap="round"
                />
                <path
                  d="M8 1h4v4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 1L6 7" strokeLinecap="round" />
              </svg>
              Tab baru
            </a>

            {/* Tutup */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Tutup (Esc)"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 14 14"
                fill="none"
                stroke="gray"
                strokeWidth="3"
              >
                <path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 overflow-hidden bg-slate-100 p-2">
          <iframe
            src={url}
            className="h-full w-full rounded-xl border border-slate-200 bg-white"
            title={namaFile}
          />
        </div>
      </div>
    </div>
  );
};

// ── Upload field ──────────────────────────────────────────────────────────────

const UploadField: React.FC<{
  label: string;
  wajib?: boolean;
  doc: DokumenUpload | null;
  onUpload: (doc: DokumenUpload) => void;
  onRemove: () => void;
}> = ({ label, wajib, doc, onUpload, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);

    const result = await validatePDF(file);

    // Revoke URL lama jika ada
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (!result.valid) {
      onUpload({
        id: Date.now().toString(),
        namaFile: file.name,
        ukuranBytes: file.size,
        status: "invalid",
        errorMessage: result.error,
      });
    } else {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onUpload({
        id: Date.now().toString(),
        namaFile: file.name,
        ukuranBytes: file.size,
        status: "valid",
      });
    }

    setLoading(false);
  };

  // Cleanup object URL saat unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onRemove();
  };

  const formatSize = (b: number) =>
    b > 1024 * 1024
      ? `${(b / (1024 * 1024)).toFixed(1)} MB`
      : `${(b / 1024).toFixed(0)} KB`;

  return (
    <>
      {showPreview && previewUrl && doc && (
        <ModalPreviewPDF
          namaFile={doc.namaFile}
          url={previewUrl}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div>
        <div className="mb-1 text-[12.5px] font-semibold text-slate-600">
          {label}
          {wajib && <span className="ml-1 text-red-500">*</span>}
        </div>

        {!doc ? (
          <div
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3.5 transition-colors ${
              loading
                ? "border-slate-300 bg-slate-50"
                : "border-slate-300 bg-white hover:border-blue-700"
            }`}
          >
            {loading ? (
              <span className="text-xs text-slate-500">
                Memvalidasi dokumen...
              </span>
            ) : (
              <div className="group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="shrink-0 text-slate-400 transition-colors group-hover:text-blue-600"
                >
                  <path
                    d="M10 13V7M7 10l3-3 3 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="flex-1 text-sm text-slate-600 transition-colors group-hover:text-blue-700">
                  Upload PDF
                </span>
                <span className="text-xs text-slate-400">max 10MB</span>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  handleFile(file);
                }

                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
              doc.status === "valid"
                ? "border-emerald-300 bg-emerald-50"
                : "border-red-300 bg-red-50"
            }`}
          >
            <svg
              width="23"
              height="23"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className={
                doc.status === "valid" ? "text-emerald-800" : "text-red-800"
              }
            >
              <path
                d="M10.5 2H4.5A1.5 1.5 0 003 3.5v11A1.5 1.5 0 004.5 16h9A1.5 1.5 0 0015 14.5V6.5L10.5 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10.5 2v4.5H15" strokeLinecap="round" />
            </svg>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-800">
                {doc.namaFile}
              </div>

              {doc.status === "invalid" ? (
                <div className="text-[11px] text-red-600">
                  {doc.errorMessage}
                </div>
              ) : (
                <div className="text-[11px] text-emerald-800">
                  {formatSize(doc.ukuranBytes)} · Valid
                </div>
              )}
            </div>

            {/* Tombol Preview — hanya muncul jika PDF valid dan URL tersedia */}
            {doc.status === "valid" && previewUrl && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex cursor-pointer items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-[13px] font-semibold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100"
                title="Preview PDF"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5" />
                  <circle
                    cx="6.5"
                    cy="6.5"
                    r="1.5"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
                Preview
              </button>
            )}

            {/* Tombol hapus */}
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white hover:text-red-600"
              title="Hapus dokumen"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ── Input field ───────────────────────────────────────────────────────────────

const InputField: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  wajib?: boolean;
  hint?: string;
  onChange: (v: string) => void;
}> = ({
  label,
  value,
  placeholder,
  type = "text",
  readOnly,
  wajib,
  hint,
  onChange,
}) => (
  <div className="mb-3.5">
    <label className="mb-1 block text-[15px] font-semibold text-slate-600">
      {label}
      {wajib && <span className="ml-1 text-red-500">*</span>}
    </label>

    <input
      type={type}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-sm border border-slate-300 px-3 py-2.5 text-sm transition-colors outline-none focus:border-blue-600 ${readOnly ? "bg-slate-100" : "bg-white"} `}
    />

    {hint && <p className="mt-1 text-[11.5px] text-slate-500">{hint}</p>}
  </div>
);

const TextAreaField: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  wajib?: boolean;
  onChange: (v: string) => void;
}> = ({ label, value, placeholder, wajib, onChange }) => (
  <div className="mb-4">
    <label className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600">
      {label}
      {wajib && <span className="ml-1 text-red-500">*</span>}
    </label>

    <textarea
      value={value}
      placeholder={placeholder}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition-all duration-150 outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
    />
  </div>
);

// ── Alert ─────────────────────────────────────────────────────────────────────
const Alert: React.FC<{
  type: "info" | "warning" | "danger" | "success";
  children: React.ReactNode;
}> = ({ type, children }) => {
  const variants = {
    info: {
      wrapper: "border-blue-200 bg-blue-50",
      icon: "text-blue-700",
      Icon: Info,
    },
    warning: {
      wrapper: "border-amber-200 bg-amber-50",
      icon: "text-amber-700",
      Icon: AlertTriangle,
    },
    danger: {
      wrapper: "border-red-200 bg-red-50",
      icon: "text-red-700",
      Icon: XCircle,
    },
    success: {
      wrapper: "border-emerald-200 bg-emerald-50",
      icon: "text-emerald-700",
      Icon: CheckCircle2,
    },
  };

  const variant = variants[type];
  const Icon = variant.Icon;

  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${variant.wrapper}`}
    >
      <Icon
        size={18}
        strokeWidth={2.25}
        className={`mt-0.5 shrink-0 ${variant.icon}`}
      />

      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );
};
// ── Modal Berhenti ────────────────────────────────────────────────────────────

const ModalBerhenti: React.FC<{
  pesan: string;
  onClose: () => void;
}> = ({ pesan, onClose }) => {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <CircleAlert
              size={30}
              strokeWidth={2.25}
              className="text-amber-600"
            />
          </div>

          <h3 className="text-center text-lg font-bold text-slate-900">
            Pengajuan Belum Memenuhi Persyaratan
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-center text-sm leading-relaxed text-slate-600">
            {pesan}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal Selesai ─────────────────────────────────────────────────────────────

const ModalSelesai: React.FC<{
  jalur: JalurPengajuan;
  onReset: () => void;
  onLihatDaftar?: () => void;
}> = ({ jalur, onReset, onLihatDaftar }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(10,20,40,.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
    }}
  >
    <div
      style={{
        background: C.white,
        borderRadius: 18,
        padding: "40px 36px",
        maxWidth: 480,
        width: "90%",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(10,20,40,.25)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: C.accentLight,
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          stroke={C.accent}
          strokeWidth="2.5"
        >
          <circle cx="16" cy="16" r="14" />
          <path
            d="M9 16l5 5 9-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3
        style={{
          margin: "0 0 8px",
          fontSize: 20,
          fontWeight: 800,
          color: C.text,
        }}
      >
        Pengajuan Berhasil Dibuat!
      </h3>
      <div style={{ marginBottom: 12 }}>
        <Badge
          label={jalur === "PUPN" ? "Jalur PUPN" : "Jalur Non-PUPN (PPDTO)"}
          color={jalur === "PUPN" ? "blue" : "orange"}
        />
      </div>
      <p
        style={{
          margin: "0 0 26px",
          fontSize: 14,
          color: C.textSub,
          lineHeight: 1.6,
        }}
      >
        Data pengajuan telah tersimpan dan dikirimkan ke BPKAD untuk
        diverifikasi. Pantau status pengajuan di menu{" "}
        <strong>Lihat Daftar Pengajuan</strong>.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {onLihatDaftar && (
          <button
            onClick={onLihatDaftar}
            style={{
              background: C.accentLight,
              color: C.accent,
              border: `1.5px solid ${C.accent}`,
              borderRadius: 10,
              padding: "11px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Lihat Daftar Pengajuan
          </button>
        )}
        <button
          onClick={onReset}
          style={{
            background: C.primary,
            color: C.white,
            border: "none",
            borderRadius: 10,
            padding: "11px 28px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Ajukan Permohonan Baru
        </button>
      </div>
    </div>
  </div>
);

function hitungUmurTahun(tgl: string): number {
  const d = new Date(tgl);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return diff / (1000 * 60 * 60 * 24 * 365.25);
}

// ─────────────────────────────────────────────────────────────────────────────
// Wizard steps
// ─────────────────────────────────────────────────────────────────────────────

// ── PERTANYAAN UMUM 1: Jenis piutang ─────────────────────────────────────────

const JENIS_PIUTANG_OPTIONS: {
  value: JenisPiutang;
  label: string;
  sublabel?: string;
  warning?: boolean;
}[] = [
  { value: "RETRIBUSI", label: "Piutang Retribusi Daerah" },
  { value: "TP", label: "Tuntutan Perbendaharaan (TP)" },
  { value: "TGR", label: "Tuntutan Ganti Rugi (TGR)" },
  {
    value: "LAINNYA",
    label: "Piutang Daerah Lainnya",
    sublabel: "Perjanjian / perikatan",
  },
  {
    value: "PAJAK",
    label: "Piutang Pajak Daerah",
    sublabel: "Diatur dengan Perbup tersendiri",
    warning: true,
  },
];

const StepJenisPiutang: React.FC<{
  state: WizardState;
  onNext: (jenis: JenisPiutang) => void;
}> = ({ state, onNext }) => {
  const [selected, setSelected] = useState<JenisPiutang | null>(
    state.jenisPiutang,
  );

  return (
    <QuestionCard
      nomor="1"
      judul="Apa jenis piutang daerah yang akan diproses ?"
      deskripsi="Pilih jenis piutang daerah yang akan diproses sesuai dengan asal mula kewajiban/utang tersebut."
    >
      <div className="space-y-2">
        {JENIS_PIUTANG_OPTIONS.map((opt) => (
          <RadioOption
            key={opt.value}
            selected={selected === opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            warning={opt.warning}
            onSelect={() => setSelected(opt.value)}
          />
        ))}
      </div>

      {selected === "PAJAK" && (
        <div className="mt-4">
          <Alert type="warning">
            <div>
              <div className="font-semibold">
                Piutang Pajak Daerah tidak dapat diproses.
              </div>
              <div className="mt-1">
                Piutang Pajak Daerah diatur melalui Peraturan Bupati tersendiri
                dan tidak termasuk dalam mekanisme penyelesaian pada aplikasi
                ini.
              </div>
            </div>
          </Alert>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end border-t border-slate-200 pt-4">
        <Btn
          label="Lanjut →"
          disabled={!selected || selected === "PAJAK"}
          onClick={() => selected && onNext(selected)}
        />
      </div>
    </QuestionCard>
  );
};

// ── PERTANYAAN UMUM 2: Nominal utang ─────────────────────────────────────────

const StepNominal: React.FC<{
  state: WizardState;
  onNext: (nominal: string, jalur: JalurPengajuan) => void;
  onBack: () => void;
}> = ({ state, onNext, onBack }) => {
  const [nominal, setNominal] = useState(state.nominalUtang);

  const parsed = parseNominal(nominal);
  const isNonPUPN = parsed > 0 && parsed <= 8_000_000;
  const isPUPN = parsed > 8_000_000;

  return (
    <QuestionCard
      nomor="2"
      judul="Berapa sisa kewajiban piutang ?"
      deskripsi="Piutang Daerah dengan sisa kewajiban paling banyak Rp8.000.000 per Penanggung Utang dan tidak ada Barang Jaminan atau barang jaminan tidak mempunyai nilai ekonomis masuk jalur Non-PUPN. Melebihi Rp8.000.000 masuk jalur PUPN."
    >
      <div className="mb-4 w-full">
        <InputField
          label="Masukkan nominal sisa utang"
          value={nominal ? formatRupiah(nominal) : ""}
          placeholder="Rp 0"
          wajib
          onChange={(v) => setNominal(v.replace(/\D/g, ""))}
        />
      </div>

      {parsed > 0 && (
        <div
          className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${
            isNonPUPN
              ? "border-amber-300 bg-amber-50"
              : "border-blue-300 bg-blue-50"
          }`}
        >
          <div
            className={`mt-1 h-3 w-3 rounded-full ${
              isNonPUPN ? "bg-amber-500" : "bg-blue-600"
            }`}
          />

          <div>
            <div
              className={`text-sm font-semibold ${
                isNonPUPN ? "text-amber-700" : "text-blue-700"
              }`}
            >
              {isNonPUPN
                ? "Masuk Jalur Non-PUPN (PPDTO)"
                : "Masuk Jalur PUPN (PSBDT)"}
            </div>

            <div className="mt-1 text-xs leading-relaxed text-slate-600">
              {isNonPUPN
                ? "Sisa kewajiban ≤ Rp8.000.000 sehingga tidak memenuhi syarat pelimpahan ke PUPN."
                : "Sisa kewajiban > Rp8.000.000 sehingga wajib dilimpahkan ke PUPN."}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <BtnSecondary label="← Kembali" onClick={onBack} />

        <Btn
          label="Lanjut →"
          disabled={!parsed || (!isNonPUPN && !isPUPN)}
          onClick={() =>
            onNext(parsed.toString(), isNonPUPN ? "NON_PUPN" : "PUPN")
          }
        />
      </div>
    </QuestionCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Jalur PUPN
// ─────────────────────────────────────────────────────────────────────────────

const PUPN_STEPS = [
  "Umur Piutang",
  "Bukti Penagihan",
  "Dok. Kondisi",
  "Form Data",
];

const PupnP1: React.FC<{
  state: WizardState;
  onNext: (tgl: string) => void;
  onBack: () => void;
  onBerhenti: (pesan: string) => void;
}> = ({ state, onNext, onBack, onBerhenti }) => {
  const [tgl, setTgl] = useState(state.pupn.tanggalTerjadi);

  const umur = tgl ? hitungUmurTahun(tgl) : null;
  const lolos = umur !== null && umur > 3;

  return (
    <QuestionCard
      nomor="1"
      judul="Apakah umur piutang lebih dari 3 tahun?"
      jalur="PUPN"
    >
      <InputField
        label="Tanggal terjadinya piutang"
        value={tgl}
        type="date"
        wajib
        hint="Umur piutang dihitung sejak tanggal terjadinya hingga hari ini."
        onChange={setTgl}
      />
      {tgl && umur !== null && (
        <Alert type={lolos ? "success" : "danger"}>
          {lolos
            ? `Umur piutang ${umur.toFixed(1)} tahun — memenuhi syarat (lebih dari 3 tahun).`
            : `Umur piutang baru ${umur.toFixed(1)} tahun — belum memenuhi syarat minimal 3 tahun.`}
        </Alert>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <BtnSecondary label="← Kembali" onClick={onBack} />
        <Btn
          label="Lanjut →"
          disabled={!tgl}
          onClick={() => {
            if (!lolos) {
              onBerhenti(
                "Umur piutang belum mencapai 3 tahun sehingga belum memenuhi syarat penghapusan melalui PUPN.",
              );
            } else {
              onNext(tgl);
            }
          }}
        />
      </div>
    </QuestionCard>
  );
};

const PupnP2: React.FC<{
  state: WizardState;
  onNext: (data: {
    nomorSKRD: string;
    dokumenSKRD: DokumenUpload;
    nomorSTRD: string;
    dokumenSTRD: DokumenUpload;
  }) => void;
  onBack: () => void;
  onPindahNonPUPN: () => void;
}> = ({ state, onNext, onBack, onPindahNonPUPN }) => {
  const [nomorSKRD, setNomorSKRD] = useState(state.pupn.nomorSKRD);
  const [dokSKRD, setDokSKRD] = useState<DokumenUpload | null>(
    state.pupn.dokumenSKRD,
  );
  const [nomorSTRD, setNomorSTRD] = useState(state.pupn.nomorSTRD);
  const [dokSTRD, setDokSTRD] = useState<DokumenUpload | null>(
    state.pupn.dokumenSTRD,
  );

  const allValid =
    nomorSKRD.trim() &&
    dokSKRD?.status === "valid" &&
    nomorSTRD.trim() &&
    dokSTRD?.status === "valid";

  return (
    <QuestionCard
      nomor="2"
      judul="Bukti penagihan optimal — SKRD & STRD Ketiga"
      deskripsi="Penagihan dianggap optimal apabila telah diterbitkan SKRD dan STRD ketiga.
        Upload dokumen PDF masing-masing maksimal 10 MB."
      jalur="PUPN"
    >
      <Alert type="info">
        Jika dokumen tidak tersedia, pengajuan akan dialihkan ke jalur{" "}
        <strong>Non-PUPN (PPDTO)</strong>.
      </Alert>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <InputField
            label="Nomor Surat Ketetapan Retribusi Daerah (SKRD)"
            value={nomorSKRD}
            placeholder="No. SKRD/..."
            wajib
            onChange={setNomorSKRD}
          />
          <UploadField
            label="Dokumen SKRD (PDF)"
            wajib
            doc={dokSKRD}
            onUpload={setDokSKRD}
            onRemove={() => setDokSKRD(null)}
          />
        </div>
        <div>
          <InputField
            label="Nomor Surat Tagihan Retribusi Daerah (STRD) Ketiga"
            value={nomorSTRD}
            placeholder="No. STRD/..."
            wajib
            onChange={setNomorSTRD}
          />
          <UploadField
            label="Dokumen STRD Ketiga (PDF)"
            wajib
            doc={dokSTRD}
            onUpload={setDokSTRD}
            onRemove={() => setDokSTRD(null)}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
          gap: 10,
        }}
      >
        <BtnSecondary label="← Kembali" onClick={onBack} />
        <div style={{ display: "flex", gap: 10 }}>
          <BtnSecondary
            label="Tidak ada dokumen → Non-PUPN"
            onClick={onPindahNonPUPN}
          />
          <Btn
            label="Lanjut →"
            disabled={!allValid}
            onClick={() =>
              onNext({
                nomorSKRD,
                dokumenSKRD: dokSKRD!,
                nomorSTRD,
                dokumenSTRD: dokSTRD!,
              })
            }
          />
        </div>
      </div>
    </QuestionCard>
  );
};

const PUPN_P3_DOCS: {
  key: keyof WizardState["pupn"]["dokumenPendukung"];
  label: string;
  wajib?: boolean;
}[] = [
  {
    key: "beritaAcaraIdentifikasi",
    label: "Berita Acara Identifikasi Lapangan (disahkan Kepala SKPD)",
    wajib: true,
  },
  { key: "suratKematian", label: "Surat Keterangan Kematian / Akte Kematian" },
  {
    key: "suratUsahaTidakBeroperasi",
    label: "Surat Keterangan Usaha Tidak Beroperasi",
  },
  {
    key: "suratJaminanTidakCukup",
    label: "Surat Keterangan Jaminan Tidak Cukup",
  },
  {
    key: "suratKeberadaanTidakDiketahui",
    label: "Surat Keterangan Keberadaan Tidak Diketahui",
  },
  { key: "suratTidakMampu", label: "Surat Keterangan Tidak Mampu" },
  {
    key: "suratAhliWarisTidakMampu",
    label: "Surat Keterangan Ahli Waris / Penjamin Tidak Mampu",
  },
];

const PupnP3: React.FC<{
  state: WizardState;
  onNext: (dokPendukung: WizardState["pupn"]["dokumenPendukung"]) => void;
  onBack: () => void;
  onPindahNonPUPN: () => void;
}> = ({ state, onNext, onBack, onPindahNonPUPN }) => {
  const [docs, setDocs] = useState(state.pupn.dokumenPendukung);

  const setDoc = (key: keyof typeof docs, doc: DokumenUpload | null) =>
    setDocs((prev) => ({ ...prev, [key]: doc }));

  const wajibOk = docs.beritaAcaraIdentifikasi?.status === "valid";

  return (
    <QuestionCard
      nomor="3"
      judul="Dokumen kondisi penanggung utang"
      deskripsi="Upload minimal Berita Acara Identifikasi Lapangan (wajib) dan dokumen pendukung lainnya."
      jalur="PUPN"
    >
      {PUPN_P3_DOCS.map((item) => (
        <UploadField
          key={item.key}
          label={item.label}
          wajib={item.wajib}
          doc={docs[item.key]}
          onUpload={(d) => setDoc(item.key, d)}
          onRemove={() => setDoc(item.key, null)}
        />
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 24,
          gap: 10,
        }}
      >
        <BtnSecondary label="← Kembali" onClick={onBack} />
        <div style={{ display: "flex", gap: 10 }}>
          <BtnSecondary
            label="Tidak ada → Non-PUPN"
            onClick={onPindahNonPUPN}
          />
          <Btn
            label="Lanjut →"
            disabled={!wajibOk}
            onClick={() => onNext(docs)}
          />
        </div>
      </div>
    </QuestionCard>
  );
};

const PupnP4: React.FC<{
  state: WizardState;
  onSubmit: (data: Partial<WizardState["pupn"]>) => void;
  onBack: () => void;
}> = ({ state, onSubmit, onBack }) => {
  const [form, setForm] = useState({
    namaWP: state.pupn.namaWP,
    alamatWP: state.pupn.alamatWP,
    nik: state.pupn.nik,
    pekerjaan: state.pupn.pekerjaan,
    sebabPiutangMacet: state.pupn.sebabPiutangMacet,
    adaBLUD: state.pupn.adaBLUD,
  });

  const set = (key: string, val: string | boolean | null) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const allFilled =
    form.namaWP &&
    form.alamatWP &&
    form.nik &&
    form.pekerjaan &&
    form.sebabPiutangMacet &&
    form.adaBLUD !== null;

  return (
    <QuestionCard
      nomor="4"
      judul="Isi formulir data penanggung utang"
      jalur="PUPN"
    >
      <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
        <InputField
          label="Nama Wajib Bayar"
          value={form.namaWP}
          wajib
          placeholder="Nama lengkap"
          onChange={(v) => set("namaWP", v)}
        />

        <InputField
          label="NIK"
          value={form.nik}
          wajib
          placeholder="16 digit NIK"
          onChange={(v) => set("nik", v.replace(/\D/g, "").slice(0, 16))}
        />

        <InputField
          label="Jenis Piutang"
          value={labelJenis(state.jenisPiutang!)}
          readOnly
          onChange={() => {}}
        />

        <InputField
          label="Pekerjaan"
          value={form.pekerjaan}
          wajib
          placeholder="Pekerjaan"
          onChange={(v) => set("pekerjaan", v)}
        />

        <InputField
          label="Nomor SKRD"
          value={state.pupn.nomorSKRD}
          readOnly
          onChange={() => {}}
        />

        <InputField
          label="Nomor STRD"
          value={state.pupn.nomorSTRD}
          readOnly
          onChange={() => {}}
        />
      </div>

      <TextAreaField
        label="Alamat Wajib Bayar"
        value={form.alamatWP}
        wajib
        placeholder="Alamat lengkap"
        onChange={(v) => set("alamatWP", v)}
      />

      <TextAreaField
        label="Sebab Piutang Macet"
        value={form.sebabPiutangMacet}
        wajib
        placeholder="Uraikan sebab piutang macet..."
        onChange={(v) => set("sebabPiutangMacet", v)}
      />

      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-600">
          Apakah utang termasuk BLUD?
          <span className="ml-1 text-red-500">*</span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          {[true, false].map((v) => {
            const selected = form.adaBLUD === v;

            return (
              <label
                key={String(v)}
                onClick={() => set("adaBLUD", v)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 transition-all duration-150 ${
                  selected
                    ? "border-blue-700 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    selected
                      ? "border-blue-700 bg-blue-700"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </div>

                <span className="text-sm font-semibold">
                  {v ? "Ya, termasuk BLUD" : "Tidak"}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <BtnSecondary label="← Kembali" onClick={onBack} />

        <Btn
          label="Kirim Pengajuan ✓"
          disabled={!allFilled}
          onClick={() => onSubmit(form)}
          primary={false}
          success
        />
      </div>
    </QuestionCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Jalur Non-PUPN
// ─────────────────────────────────────────────────────────────────────────────

const NONPUPN_STEPS = [
  "Usia Piutang",
  "Bukti Penagihan",
  "Ketidakmampuan",
  "Data Penanggung",
];

const NonPupnP1: React.FC<{
  state: WizardState;
  onNext: (tgl: string) => void;
  onBack: () => void;
  onBerhenti: (pesan: string) => void;
}> = ({ state, onNext, onBack, onBerhenti }) => {
  const [tgl, setTgl] = useState(state.nonPupn.tanggalTerjadi);
  const nominal = parseNominal(state.nominalUtang);
  const batas = getBatasWaktu(nominal);
  const umur = tgl ? hitungUmurTahun(tgl) : null;
  const lolos = umur !== null && umur > batas.batasTahun;

  return (
    <QuestionCard
      nomor="1"
      judul={`Usia pencatatan piutang sudah lebih dari ${batas.label} tahun?`}
      deskripsi="Sesuai ketentuan Perbup Kendal, batas waktu minimal ditentukan berdasarkan besaran sisa utang. Tidak terdapat angsuran atau angsuran kurang dari 10% dari kewajiban."
      jalur="NON_PUPN"
    >
      <Alert type="info">
        Berdasarkan sisa utang{" "}
        <strong>{formatRupiah(state.nominalUtang)}</strong>, batas waktu minimal
        adalah <strong>{batas.label} tahun</strong>.
      </Alert>

      <div
        onClick={() => {
          const input = document.querySelector(
            'input[type="date"]',
          ) as HTMLInputElement;
          if (input) {
            if (typeof input.showPicker === "function") {
              input.showPicker();
            } else {
              input.focus();
              input.click();
            }
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <InputField
          label="Tanggal terjadinya piutang"
          value={tgl}
          type="date"
          wajib
          onChange={setTgl}
        />
      </div>

      {tgl && umur !== null && (
        <Alert type={lolos ? "success" : "danger"}>
          {lolos ? (
            <>
              Usia piutang <strong>{umur.toFixed(1)}</strong> tahun dan telah
              memenuhi syarat minimal <strong>{batas.batasTahun}</strong> tahun.
            </>
          ) : (
            <>
              Usia piutang baru <strong>{umur.toFixed(1)}</strong> tahun
              sehingga belum memenuhi syarat minimal{" "}
              <strong>{batas.batasTahun}</strong> tahun.
            </>
          )}
        </Alert>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
        <BtnSecondary label="← Kembali" onClick={onBack} />

        <Btn
          label="Lanjut →"
          disabled={!tgl}
          onClick={() => {
            if (!umur) {
              return;
            }

            if (!lolos) {
              onBerhenti(
                `Usia piutang baru ${umur.toFixed(
                  1,
                )} tahun. Berdasarkan sisa kewajiban yang diinput, batas minimal adalah ${batas.batasTahun} tahun sehingga pengajuan belum dapat diproses.`,
              );

              return;
            }

            onNext(tgl);
          }}
        />
      </div>
    </QuestionCard>
  );
};

const NonPupnP2: React.FC<{
  state: WizardState;
  onNext: (data: { dipilih: string[]; dokumen: DokumenUpload[] }) => void;
  onBack: () => void;
}> = ({ state, onNext, onBack }) => {
  const [dipilih, setDipilih] = useState<string[]>(
    state.nonPupn.upayaPenagihanDipilih,
  );
  const [dokumen, setDokumen] = useState<DokumenUpload[]>(
    state.nonPupn.dokumenPenagihanOptimal,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleOpsi = (kode: string) =>
    setDipilih((prev) =>
      prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode],
    );

  const handleFile = async (file: File) => {
    const result = await validatePDF(file);
    const entry: DokumenUpload = {
      id: Date.now().toString(),
      namaFile: file.name,
      ukuranBytes: file.size,
      status: result.valid ? "valid" : "invalid",
      errorMessage: result.error,
    };
    setDokumen((prev) => [...prev, entry]);
  };

  const removeDoc = (id: string) =>
    setDokumen((prev) => prev.filter((d) => d.id !== id));

  const validDocs = dokumen.filter((d) => d.status === "valid");
  const canNext = dipilih.length > 0 && validDocs.length > 0;

  return (
    <QuestionCard
      nomor="2"
      judul="Apakah penagihan piutang telah dilakukan secara optimal?"
      deskripsi="Pilih minimal satu upaya penagihan yang telah dilakukan dan upload dokumen bukti."
      jalur="NON_PUPN"
    >
      {OPSI_PENAGIHAN_OPTIMAL.map((opt) => (
        <CheckOption
          key={opt.kode}
          kode={opt.kode}
          checked={dipilih.includes(opt.kode)}
          label={opt.label}
          sublabel={opt.deskripsi}
          jalur="NON_PUPN"
          onToggle={() => toggleOpsi(opt.kode)}
        />
      ))}

      <div
        style={{
          marginTop: 20,
          borderTop: `1.5px solid ${C.border}`,
          paddingTop: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label className="block text-sm font-semibold text-slate-800">
                  Dokumen Bukti Penagihan Optimal
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <p className="mt-1 text-xs text-slate-500">
                  Unggah minimal 1 dokumen PDF sebagai bukti pendukung.
                </p>
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md"
              >
                <span>📄</span>
                Unggah PDF
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {dokumen.map((d) => (
          <div
            key={d.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 8,
              marginBottom: 6,
              background: d.status === "valid" ? C.accentLight : C.dangerLight,
              border: `1.5px solid ${d.status === "valid" ? C.accent : C.danger}`,
            }}
          >
            <span style={{ fontSize: 18 }}>📄</span>
            <div style={{ flex: 1, fontSize: 13 }}>{d.namaFile}</div>
            <button
              onClick={() => removeDoc(d.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: C.muted,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <BtnSecondary label="← Kembali" onClick={onBack} />
        <Btn
          label="Lanjut →"
          disabled={!canNext}
          onClick={() => onNext({ dipilih, dokumen: validDocs })}
        />
      </div>
    </QuestionCard>
  );
};

const NonPupnP3: React.FC<{
  state: WizardState;
  onNext: (data: {
    dipilih: string[];
    dokumen: Record<string, DokumenUpload | null>;
  }) => void;
  onBack: () => void;
}> = ({ state, onNext, onBack }) => {
  const nominal = parseNominal(state.nominalUtang);
  const diatasMiliar = nominal > 1_000_000_000;
  const [dipilih, setDipilih] = useState<string[]>(
    state.nonPupn.opsiKetidakmampuanDipilih,
  );
  const [dokumen, setDokumen] = useState<Record<string, DokumenUpload | null>>(
    state.nonPupn.dokumenKetidakmampuan,
  );

  const toggleOpsi = (kode: string) =>
    setDipilih((prev) =>
      prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode],
    );

  const setDok = (kode: string, doc: DokumenUpload | null) =>
    setDokumen((prev) => ({ ...prev, [kode]: doc }));

  // Opsi A wajib jika > 1 miliar
  const opsiA_required = diatasMiliar && !dipilih.includes("A");
  const allOk =
    dipilih.length > 0 &&
    !opsiA_required &&
    dipilih.every((k) => dokumen[k]?.status === "valid");

  return (
    <QuestionCard
      nomor="3"
      judul="Penanggung utang tidak mampu menyelesaikan utang"
      deskripsi="Pilih minimal satu bukti ketidakmampuan penanggung utang dan upload dokumen pendukung."
      jalur="NON_PUPN"
    >
      {diatasMiliar && (
        <Alert type="warning">
          Sisa utang melebihi Rp1 miliar —{" "}
          <strong>Opsi A (Kerjasama DJKN) bersifat wajib</strong>.
        </Alert>
      )}

      {OPSI_KETIDAKMAMPUAN.map((opt) => (
        <div key={opt.kode}>
          <CheckOption
            kode={opt.kode}
            checked={dipilih.includes(opt.kode)}
            label={opt.label}
            wajib={opt.wajibDiatasMilliar && diatasMiliar}
            jalur="NON_PUPN"
            onToggle={() => toggleOpsi(opt.kode)}
          />
          {dipilih.includes(opt.kode) && (
            <div style={{ paddingLeft: 30, marginTop: -6, marginBottom: 10 }}>
              <UploadField
                label={`Dokumen bukti`}
                wajib
                doc={dokumen[opt.kode] ?? null}
                onUpload={(d) => setDok(opt.kode, d)}
                onRemove={() => setDok(opt.kode, null)}
              />
            </div>
          )}
        </div>
      ))}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 24,
        }}
      >
        <BtnSecondary label="← Kembali" onClick={onBack} />
        <Btn
          label="Lanjut →"
          disabled={!allOk}
          onClick={() => onNext({ dipilih, dokumen })}
        />
      </div>
    </QuestionCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NonPupnP4 — Pertanyaan 4: Data Penanggung Utang (Non-PUPN)
// ─────────────────────────────────────────────────────────────────────────────

const NonPupnP4: React.FC<{
  state: WizardState;
  onSubmit: (data: {
    namaWP: string;
    alamatWP: string;
    nik: string;
    sebabPiutangMacet: string;
  }) => void;
  onBack: () => void;
}> = ({ state, onSubmit, onBack }) => {
  const [namaWP, setNamaWP] = useState(state.nonPupn.namaWP ?? "");
  const [alamatWP, setAlamatWP] = useState(state.nonPupn.alamatWP ?? "");
  const [nik, setNik] = useState(state.nonPupn.nik ?? "");
  const [sebabPiutangMacet, setSebabPiutangMacet] = useState(
    state.nonPupn.sebabPiutangMacet ?? "",
  );

  const canSubmit =
    (namaWP ?? "").trim().length >= 3 &&
    (alamatWP ?? "").trim().length >= 5 &&
    (nik ?? "").trim().length === 16 &&
    (sebabPiutangMacet ?? "").trim().length >= 10;

  // Format tanggal untuk tampilan
  const tgl = state.nonPupn.tanggalTerjadi;
  const tglDisplay = tgl
    ? new Date(tgl).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

  // Label jenis piutang
  const jenisPiutangDisplay = labelJenis(state.jenisPiutang);

  return (
    <QuestionCard
      nomor="4"
      judul="Silahkan mengisi formulir data penanggung utang berikut ini"
      deskripsi="Lengkapi identitas dan keterangan penanggung utang. Data bertanda * wajib diisi."
      jalur="NON_PUPN"
    >
      {/* Info otomatis dari sistem */}
      <div
        style={{
          background: "#f8fafc",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Data Otomatis dari Sistem
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px 16px",
          }}
        >
          {[
            {
              label: "Tanggal Terjadinya Piutang",
              value: tglDisplay,
              icon: "📅",
            },
            {
              label: "Jenis Piutang",
              value: jenisPiutangDisplay,
              icon: "📋",
            },
            {
              label: "Sisa Piutang",
              value: formatRupiah(state.nominalUtang),
              icon: "💰",
            },
          ].map(({ label, value, icon }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>{icon}</span>
                {label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "5px 10px",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form input pengguna */}
      <InputField
        label="Nama Penanggung Utang"
        value={namaWP}
        placeholder="Masukkan nama lengkap sesuai KTP"
        wajib
        hint="Minimal 3 karakter."
        onChange={setNamaWP}
      />

      <InputField
        label="NIK"
        value={nik}
        placeholder="16 digit NIK"
        wajib
        hint="Sesuai KTP, 16 digit angka."
        onChange={(v) => setNik(v.replace(/\D/g, "").slice(0, 16))}
      />

      <InputField
        label="Alamat Penanggung Utang"
        value={alamatWP}
        placeholder="Jl. / Desa / Kelurahan, Kecamatan, Kabupaten"
        wajib
        hint="Alamat sesuai domisili penanggung utang."
        onChange={setAlamatWP}
      />

      <TextAreaField
        label="Keterangan Sebab Piutang Macet"
        value={sebabPiutangMacet}
        placeholder="Jelaskan secara singkat penyebab piutang tidak dapat ditagih, misalnya: meninggal dunia / bangkrut / tidak diketahui keberadaannya…"
        wajib
        onChange={setSebabPiutangMacet}
      />

      {!canSubmit && (namaWP || alamatWP || sebabPiutangMacet) && (
        <Alert type="warning">
          Pastikan semua kolom wajib telah terisi dengan benar sebelum mengirim
          pengajuan.
        </Alert>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
          borderTop: `1px solid ${C.border}`,
          paddingTop: 16,
        }}
      >
        <BtnSecondary label="← Kembali" onClick={onBack} />
        <Btn
          label="Kirim Pengajuan ✓"
          disabled={!canSubmit}
          onClick={() => onSubmit({ namaWP, alamatWP, nik, sebabPiutangMacet })}
          success
        />
      </div>
    </QuestionCard>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility buttons
// ─────────────────────────────────────────────────────────────────────────────

const Btn: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  success?: boolean;
}> = ({ label, onClick, disabled, primary = true, success }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "10px 24px",
      borderRadius: 10,
      border: "none",
      fontSize: 14,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all .15s",
      background: disabled ? "#d1d8e4" : success ? C.accent : C.primary,
      color: disabled ? C.muted : C.white,
      boxShadow: disabled
        ? "none"
        : `0 2px 8px ${success ? C.accent + "44" : C.primary + "44"}`,
    }}
  >
    {label}
  </button>
);

const BtnSecondary: React.FC<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 20px",
      borderRadius: 10,
      border: `1.5px solid ${C.border}`,
      background: C.white,
      color: C.textSub,
      fontSize: 13.5,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all .15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = C.primary;
      e.currentTarget.style.color = C.primary;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = C.border;
      e.currentTarget.style.color = C.textSub;
    }}
  >
    {label}
  </button>
);

function labelJenis(j: JenisPiutang): string {
  const map: Record<string, string> = {
    RETRIBUSI: "Piutang Retribusi Daerah",
    TP: "Tuntutan Perbendaharaan (TP)",
    TGR: "Tuntutan Ganti Rugi (TGR)",
    LAINNYA: "Piutang Daerah Lainnya",
  };
  return j ? map[j] || j : "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Jalur info banner
// ─────────────────────────────────────────────────────────────────────────────
import { Building2, FileText } from "lucide-react";

const JalurBanner: React.FC<{ jalur: JalurPengajuan }> = ({ jalur }) => {
  if (!jalur) return null;

  const isPUPN = jalur === "PUPN";

  return (
    <div
      className={`relative mb-5 overflow-hidden rounded-sm border px-3 py-3 text-white ${
        isPUPN
          ? "border-blue-700 bg-linear-to-r from-blue-900 via-blue-800 to-blue-700"
          : "border-slate-700 bg-linear-to-r from-slate-800 via-slate-700 to-slate-600"
      } `}
    >
      {/* accent line */}
      <div
        className={`absolute top-0 left-0 h-full w-2 ${
          isPUPN ? "bg-blue-500" : "bg-amber-500"
        }`}
      />

      {/* ICON */}
      <div className="flex items-start gap-3 pl-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
            isPUPN
              ? "border-blue-700 bg-blue-800 text-blue-100"
              : "border-slate-600 bg-slate-700 text-slate-100"
          } `}
        >
          {isPUPN ? (
            <Building2 className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>

        {/* TEXT */}
        <div className="min-w-0 flex-1">
          {/* TITLE */}
          <div className="text-base leading-tight font-semibold">
            {isPUPN ? "Jalur PUPN (PSBDT)" : "Jalur Non-PUPN (PPDTO)"}
          </div>

          {/* DESCRIPTION */}
          <div className="mt-0.5 text-sm leading-snug text-white/80">
            {isPUPN
              ? "Dilimpahkan ke PUPN/KPKNL"
              : "Diproses oleh PPKD tanpa pelimpahan"}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function AjukanPermohonan({
  onPengajuanBaru,
  onLihatDaftar,
}: {
  onPengajuanBaru?: (p: Pengajuan) => void;
  onLihatDaftar?: () => void;
}) {
  const [state, setState] = useState<WizardState>(initialState);
  // phase: "umum-1" | "umum-2" | "pupn-1" | "pupn-2" | "pupn-3" | "pupn-4"
  //        "nonpupn-1" | "nonpupn-2" | "nonpupn-3" | "nonpupn-4"
  const [phase, setPhase] = useState<string>("umum-1");

  const reset = useCallback(() => {
    setState(initialState);
    setPhase("umum-1");
  }, []);

  const update = (patch: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const updatePupn = (patch: Partial<WizardState["pupn"]>) =>
    setState((prev) => ({ ...prev, pupn: { ...prev.pupn, ...patch } }));

  const updateNonPupn = (patch: Partial<WizardState["nonPupn"]>) =>
    setState((prev) => ({ ...prev, nonPupn: { ...prev.nonPupn, ...patch } }));

  const berhenti = (pesan: string) =>
    update({ berhenti: true, pesanBerhenti: pesan });

  const closeBerhenti = useCallback(() => {
    update({ berhenti: false, pesanBerhenti: "" });
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isPUPN = state.jalur === "PUPN";
  const isNonPUPN = state.jalur === "NON_PUPN";

  const stepIndicatorSteps = isPUPN
    ? PUPN_STEPS
    : isNonPUPN
      ? NONPUPN_STEPS
      : [];
  const currentStepIdx =
    phase === "pupn-1"
      ? 0
      : phase === "pupn-2"
        ? 1
        : phase === "pupn-3"
          ? 2
          : phase === "pupn-4"
            ? 3
            : phase === "nonpupn-1"
              ? 0
              : phase === "nonpupn-2"
                ? 1
                : phase === "nonpupn-3"
                  ? 2
                  : phase === "nonpupn-4"
                    ? 3
                    : -1;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-4" style={{ margin: "0 auto" }}>
      {state.berhenti && (
        <ModalBerhenti pesan={state.pesanBerhenti} onClose={closeBerhenti} />
      )}
      {state.selesai && (
        <ModalSelesai
          jalur={state.jalur}
          onReset={reset}
          onLihatDaftar={onLihatDaftar}
        />
      )}

      {/* Header section */}
      <div className="mb-6">
        {!state.jalur && (
          <Alert type="info">
            Jawab pertanyaan berikut secara berurutan. Sistem akan menentukan
            jalur pengajuan yang sesuai secara otomatis berdasarkan jawaban
            Anda.
          </Alert>
        )}
        {state.jalur && (
          <>
            {currentStepIdx > 0 && <JalurBanner jalur={state.jalur} />}
            {stepIndicatorSteps.length > 0 && currentStepIdx >= 0 && (
              <StepIndicator
                steps={stepIndicatorSteps}
                current={currentStepIdx}
                jalur={state.jalur}
              />
            )}
          </>
        )}
      </div>

      {/* ── Fase Pertanyaan Umum ── */}
      {phase === "umum-1" && (
        <StepJenisPiutang
          state={state}
          onNext={(jenis) => {
            update({ jenisPiutang: jenis });
            setPhase("umum-2");
          }}
        />
      )}

      {phase === "umum-2" && (
        <StepNominal
          state={state}
          onBack={() => setPhase("umum-1")}
          onNext={(nominal, jalur) => {
            update({ nominalUtang: nominal, jalur });
            setPhase(jalur === "PUPN" ? "pupn-1" : "nonpupn-1");
          }}
        />
      )}

      {/* ── Fase PUPN ── */}
      {phase === "pupn-1" && (
        <PupnP1
          state={state}
          onBack={() => setPhase("umum-2")}
          onNext={(tgl) => {
            updatePupn({ tanggalTerjadi: tgl });
            setPhase("pupn-2");
          }}
          onBerhenti={berhenti}
        />
      )}

      {phase === "pupn-2" && (
        <PupnP2
          state={state}
          onBack={() => setPhase("pupn-1")}
          onNext={(data) => {
            updatePupn({
              nomorSKRD: data.nomorSKRD,
              dokumenSKRD: data.dokumenSKRD,
              nomorSTRD: data.nomorSTRD,
              dokumenSTRD: data.dokumenSTRD,
            });
            setPhase("pupn-3");
          }}
          onPindahNonPUPN={() => {
            update({ jalur: "NON_PUPN" });
            setPhase("nonpupn-1");
          }}
        />
      )}

      {phase === "pupn-3" && (
        <PupnP3
          state={state}
          onBack={() => setPhase("pupn-2")}
          onNext={(docs) => {
            updatePupn({ dokumenPendukung: docs });
            setPhase("pupn-4");
          }}
          onPindahNonPUPN={() => {
            update({ jalur: "NON_PUPN" });
            setPhase("nonpupn-1");
          }}
        />
      )}

      {phase === "pupn-4" && (
        <PupnP4
          state={state}
          onBack={() => setPhase("pupn-3")}
          onSubmit={(data) => {
            const nextState: WizardState = {
              ...state,
              pupn: {
                ...state.pupn,
                ...(data as Partial<WizardState["pupn"]>),
              },
            };
            onPengajuanBaru?.(buildPengajuan(nextState));
            updatePupn(data as Partial<WizardState["pupn"]>);
            update({ selesai: true });
          }}
        />
      )}

      {/* ── Fase Non-PUPN ── */}
      {phase === "nonpupn-1" && (
        <NonPupnP1
          state={state}
          onBack={() => setPhase("umum-2")}
          onNext={(tgl) => {
            updateNonPupn({ tanggalTerjadi: tgl });
            setPhase("nonpupn-2");
          }}
          onBerhenti={berhenti}
        />
      )}

      {phase === "nonpupn-2" && (
        <NonPupnP2
          state={state}
          onBack={() => setPhase("nonpupn-1")}
          onNext={(data) => {
            updateNonPupn({
              upayaPenagihanDipilih: data.dipilih,
              dokumenPenagihanOptimal: data.dokumen,
            });
            setPhase("nonpupn-3");
          }}
        />
      )}

      {phase === "nonpupn-3" && (
        <NonPupnP3
          state={state}
          onBack={() => setPhase("nonpupn-2")}
          onNext={(data) => {
            updateNonPupn({
              opsiKetidakmampuanDipilih: data.dipilih,
              dokumenKetidakmampuan: data.dokumen,
            });
            setPhase("nonpupn-4");
          }}
        />
      )}

      {phase === "nonpupn-4" && (
        <NonPupnP4
          state={state}
          onBack={() => setPhase("nonpupn-3")}
          onSubmit={(data) => {
            const updatedNonPupn = {
              ...state.nonPupn,
              namaWP: data.namaWP ?? "",
              alamatWP: data.alamatWP ?? "",
              nik: data.nik ?? "",
              sebabPiutangMacet: data.sebabPiutangMacet ?? "",
            };
            const nextState: WizardState = {
              ...state,
              nonPupn: updatedNonPupn,
            };
            onPengajuanBaru?.(buildPengajuan(nextState));
            updateNonPupn({
              namaWP: data.namaWP ?? "",
              alamatWP: data.alamatWP ?? "",
              nik: data.nik ?? "",
              sebabPiutangMacet: data.sebabPiutangMacet ?? "",
            });
            update({ selesai: true });
          }}
        />
      )}
    </div>
  );
}
