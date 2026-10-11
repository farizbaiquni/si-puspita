"use client";

/* ------------------------------------------------------------------ */
/*  DaftarDokumenDenganChecklist.tsx                                   */
/*  Tabel telaah dengan RADIO "Sesuai"/"Belum Sesuai" per dokumen.     */
/*  Textarea catatan hanya muncul jika "Belum Sesuai" (wajib, min 5 ch).*/
/* ------------------------------------------------------------------ */

import { Fragment, useMemo, useState } from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  UploadedFileRef,
} from "@/types/types";
import type { TelaahLevel, TelaahLogEntry } from "@/types/telaah-internal";
import { TELAAH_LEVEL_LABEL } from "@/types/telaah-internal";
import {
  buildDokumenTampilan,
  flattenDokumenTampilan,
  findEntryByLevel,
  ModalPreviewPDF,
  type DokumenEntry,
} from "./TelaahDokumenShared";

/* ==================== Tipe publik ==================== */

export type StatusDokumenTelaah = "sesuai" | "belum_sesuai" | null;

export type ChecklistItem = {
  status: StatusDokumenTelaah;
  catatan: string;
};

export type ChecklistMap = Record<string, ChecklistItem>;

interface DaftarDokumenDenganChecklistProps {
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  riwayat: TelaahLogEntry[];
  currentLevel: TelaahLevel;
  checklistDokumen: ChecklistMap;
  onChecklistChange: (docKey: string, value: Partial<ChecklistItem>) => void;
}

/* ==================== Ikon ==================== */

const IconPdfDoc: React.FC<{ muted?: boolean }> = ({ muted = false }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 18 18"
    fill="none"
    stroke={muted ? "#b0bac5" : "#1a4e8f"}
    strokeWidth="1.7"
  >
    <path
      d="M10.5 2H4.5A1.5 1.5 0 003 3.5v11A1.5 1.5 0 004.5 16h9A1.5 1.5 0 0015 14.5V6.5L10.5 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10.5 2v4.5H15" strokeLinecap="round" />
  </svg>
);

const IconCheckCircle = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      d="M3 8l3.5 3.5L13 4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconXCircle = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M6 3.5l4 4.5-4 4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconUserBadge = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <circle cx="8" cy="5.5" r="2.5" />
    <path d="M3 14c0-2.7 2.2-5 5-5s5 2.3 5 5" strokeLinecap="round" />
  </svg>
);

const IconClipboard = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M7 3.5H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 17.5h10a1.5 1.5 0 001.5-1.5V5A1.5 1.5 0 0015 3.5h-2"
      strokeLinecap="round"
    />
    <rect x="7" y="1.5" width="6" height="4" rx="1" />
    <path d="M7 10h6M7 13h4" strokeLinecap="round" />
  </svg>
);

/* ==================== Helper prev entry ==================== */

interface PrevLevelInfo {
  level: TelaahLevel;
  levelLabel: string;
  timestamp: string;
  /** Item checklist untuk dokumen ini (undefined jika level tidak telaah doc ini / teruskan). */
  docItem: ChecklistItem | undefined;
  /** True kalau entry ini cuma "diteruskan" — tidak ada checklistDokumen. */
  isTeruskan: boolean;
  /** Catatan global dari level ini (untuk milestone turun). */
  catatanGlobal: string;
}

const LEVEL_ORDER: TelaahLevel[] = ["kasubbid", "kabid", "sekban"];

function levelsBeforeCurrent(current: TelaahLevel): TelaahLevel[] {
  const idx = LEVEL_ORDER.indexOf(current);
  return idx <= 0 ? [] : LEVEL_ORDER.slice(0, idx);
}

/* ==================== Header Section (Progress) ==================== */

const HeaderSection: React.FC<{
  totalUploaded: number;
  totalAll: number;
  totalSesuai: number;
  totalBelumSesuai: number;
}> = ({ totalUploaded, totalAll, totalSesuai, totalBelumSesuai }) => {
  const totalBelumDitelaah = totalUploaded - totalSesuai - totalBelumSesuai;
  const isComplete = totalUploaded > 0 && totalBelumDitelaah === 0;
  const isEmpty = totalUploaded === 0;
  const adaBelumSesuai = totalBelumSesuai > 0;

  const pct = (n: number) =>
    totalUploaded === 0 ? 0 : (n / totalUploaded) * 100;

  // Warna header kartu: hijau kalau semua Sesuai, merah kalau ada Belum Sesuai,
  // kuning kalau masih ada yang belum ditelaah, abu kalau kosong.
  const cardClass = isEmpty
    ? "border-[#e2e8f2] bg-[#f7f8fa]"
    : adaBelumSesuai
      ? "border-[#fecaca] bg-[#fef2f2]"
      : isComplete
        ? "border-[#a7f3d0] bg-[#ecfdf5]"
        : "border-[#fde68a] bg-[#fffbeb]";

  const statusIconBg = isEmpty
    ? "bg-[#7a8899]"
    : adaBelumSesuai
      ? "bg-[#c0392b]"
      : isComplete
        ? "bg-[#0f9b6e]"
        : "bg-[#f59e0b]";

  const statusText = isEmpty
    ? "Tidak ada dokumen yang diupload"
    : adaBelumSesuai
      ? `${totalBelumSesuai} dokumen Belum Sesuai`
      : isComplete
        ? "Semua dokumen sudah ditelaah"
        : `${totalBelumDitelaah} dokumen belum ditelaah`;

  const statusTextClass = isEmpty
    ? "text-[#5a6474]"
    : adaBelumSesuai
      ? "text-[#991b1b]"
      : isComplete
        ? "text-[#0f6e56]"
        : "text-[#b45309]";

  return (
    <div className="rounded-sm border-2 border-[#1a4e8f]/15 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1a4e8f] text-white">
          <IconClipboard />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-[#1a1a2e]">
            Telaah Dokumen
          </h3>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[#5a6474]">
            Pilih <span className="font-semibold text-[#0f6e56]">Sesuai</span>{" "}
            atau{" "}
            <span className="font-semibold text-[#c0392b]">Belum Sesuai</span>{" "}
            untuk setiap dokumen yang diupload. Dokumen &ldquo;Belum
            Sesuai&rdquo; wajib diberi catatan.
          </p>
        </div>
      </div>

      <div className={`mt-4 rounded-sm border px-4 py-3 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${statusIconBg}`}
            >
              {adaBelumSesuai ? (
                <IconXCircle />
              ) : isComplete ? (
                <IconCheckCircle />
              ) : (
                <IconClipboard />
              )}
            </span>
            <div className="min-w-0">
              <div className={`text-[13px] font-bold ${statusTextClass}`}>
                {statusText}
              </div>
              <div className="text-[11px] text-[#7a8899]">
                {totalUploaded} dari {totalAll} dokumen diupload
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-semibold">
            <span className="text-[#0f6e56]">
              {totalSesuai} <span className="text-[10px]">Sesuai</span>
            </span>
            <span className="text-[#c0392b]">
              {totalBelumSesuai}{" "}
              <span className="text-[10px]">Belum Sesuai</span>
            </span>
            <span className="text-[#7a8899]">
              {totalBelumDitelaah}{" "}
              <span className="text-[10px]">Belum ditelaah</span>
            </span>
          </div>
        </div>

        {/* Stacked progress bar */}
        <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
          {totalSesuai > 0 && (
            <div
              className="h-full bg-[#0f9b6e] transition-all duration-500"
              style={{ width: `${pct(totalSesuai)}%` }}
            />
          )}
          {totalBelumSesuai > 0 && (
            <div
              className="h-full bg-[#c0392b] transition-all duration-500"
              style={{ width: `${pct(totalBelumSesuai)}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ==================== Sub-line: Telaah Sebelumnya ==================== */

const PrevSubLine: React.FC<{ items: PrevLevelInfo[] }> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {items.map((p, idx) => {
        const isLast = idx === items.length - 1;
        const prefix = isLast ? "└" : "├";

        // Kasus "diteruskan" — level ini cuma meneruskan tanpa telaah per-doc.
        if (p.isTeruskan) {
          return (
            <div
              key={p.level}
              className="flex items-start gap-1.5 text-[10.5px] leading-tight text-[#5a6474]"
            >
              <span className="shrink-0 font-mono text-[#b0bac5]">
                {prefix}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold tracking-wide text-[#5a6474] uppercase">
                <IconUserBadge />
                {p.levelLabel}
              </span>
              <span className="shrink-0 text-[#b0bac5]">:</span>
              <span className="min-w-0 truncate text-[#7a8899] italic">
                (diteruskan
                {p.catatanGlobal.trim() ? ` — "${p.catatanGlobal}"` : ""})
              </span>
            </div>
          );
        }

        const item = p.docItem;

        // Belum ada entry / status null → belum ditelaah.
        if (!item || item.status === null) {
          return (
            <div
              key={p.level}
              className="flex items-start gap-1.5 text-[10.5px] leading-tight text-[#5a6474]"
            >
              <span className="shrink-0 font-mono text-[#b0bac5]">
                {prefix}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold tracking-wide text-[#7a8899] uppercase">
                <IconUserBadge />
                {p.levelLabel}
              </span>
              <span className="shrink-0 text-[#b0bac5]">:</span>
              <span className="text-[#b0bac5] italic">(belum ditelaah)</span>
            </div>
          );
        }

        const isSesuai = item.status === "sesuai";

        return (
          <div
            key={p.level}
            className="flex items-start gap-1.5 text-[10.5px] leading-tight text-[#5a6474]"
          >
            <span className="shrink-0 font-mono text-[#b0bac5]">{prefix}</span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold tracking-wide uppercase">
              <IconUserBadge />
              <span className={isSesuai ? "text-[#0f6e56]" : "text-[#c0392b]"}>
                {p.levelLabel}
              </span>
            </span>
            <span className="shrink-0 text-[#b0bac5]">:</span>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-px text-[9.5px] font-bold uppercase ${
                isSesuai
                  ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]"
                  : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
              }`}
            >
              {isSesuai ? <IconCheckCircle /> : <IconXCircle />}
              {isSesuai ? "Sesuai" : "Belum Sesuai"}
            </span>
            {!isSesuai && item.catatan.trim() && (
              <span className="min-w-0 truncate text-[#3a4454] italic">
                &ldquo;{item.catatan}&rdquo;
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ==================== Radio Group Inline (custom, browser-safe) ======== */

const RadioStatusGroup: React.FC<{
  value: StatusDokumenTelaah;
  onChange: (v: StatusDokumenTelaah) => void;
}> = ({ value, onChange }) => {
  const isSesuai = value === "sesuai";
  const isBelumSesuai = value === "belum_sesuai";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Tombol Sesuai */}
      <button
        type="button"
        role="radio"
        aria-checked={isSesuai}
        onClick={() => onChange("sesuai")}
        className={`flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-1 text-[10.5px] font-semibold transition ${
          isSesuai
            ? "border-[#0f9b6e] bg-[#ecfdf5] text-[#065f46] shadow-xs"
            : "border-[#e2e8f2] bg-white text-[#7a8899] hover:border-[#a7f3d0] hover:bg-[#ecfdf5]/50"
        }`}
      >
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition ${
            isSesuai ? "border-[#0f9b6e] bg-white" : "border-[#d0d7de] bg-white"
          }`}
        >
          {isSesuai && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#0f9b6e]" />
          )}
        </span>
        <span className="whitespace-nowrap">Sesuai</span>
      </button>

      {/* Tombol Belum Sesuai */}
      <button
        type="button"
        role="radio"
        aria-checked={isBelumSesuai}
        onClick={() => onChange("belum_sesuai")}
        className={`flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-1 text-[10.5px] font-semibold transition ${
          isBelumSesuai
            ? "border-[#c0392b] bg-[#fef2f2] text-[#991b1b] shadow-xs"
            : "border-[#e2e8f2] bg-white text-[#7a8899] hover:border-[#fecaca] hover:bg-[#fef2f2]/50"
        }`}
      >
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition ${
            isBelumSesuai
              ? "border-[#c0392b] bg-white"
              : "border-[#d0d7de] bg-white"
          }`}
        >
          {isBelumSesuai && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#c0392b]" />
          )}
        </span>
        <span className="whitespace-nowrap">Belum Sesuai</span>
      </button>
    </div>
  );
};

/* ==================== Catatan Input ==================== */

const CatatanInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  showError?: boolean;
}> = ({ value, onChange, placeholder, showError }) => {
  const isError = showError && value.trim().length < 5;
  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder ?? "Catatan wajib (minimal 5 karakter)…"}
        className={`w-full resize-none rounded-sm border p-2 text-[12px] transition outline-none ${
          isError
            ? "border-red-400 bg-red-50 text-[#1a1a2e] focus:border-red-500"
            : "border-[#e2e8f2] bg-white text-[#1a1a2e] focus:border-[#a0bdec] focus:bg-[#f0f6fd]"
        }`}
      />
      {isError && (
        <p className="text-[10.5px] font-medium text-red-600">
          Catatan wajib diisi minimal 5 karakter.
        </p>
      )}
    </div>
  );
};

/* ==================== DocRow ==================== */

interface DocRowProps {
  nomor: number | null;
  entry: DokumenEntry;
  wajib?: boolean;
  keterangan?: string;
  item: ChecklistItem;
  prevItems: PrevLevelInfo[];
  onPreview: () => void;
  onChangeChecklist: (next: Partial<ChecklistItem>) => void;
}

const DocRow: React.FC<DocRowProps> = ({
  nomor,
  entry,
  wajib,
  keterangan,
  item,
  prevItems,
  onPreview,
  onChangeChecklist,
}) => {
  const uploaded = !!entry.file;
  const isBelumSesuai = item.status === "belum_sesuai";

  return (
    <tr
      className={`border-b border-[#eef1f5] transition-colors ${
        item.status === "sesuai"
          ? "bg-[#f7fdfa]"
          : isBelumSesuai
            ? "bg-[#fef6f6]"
            : uploaded
              ? "hover:bg-[#f7f8fa]"
              : "bg-[#fbfbfc]"
      }`}
    >
      {/* NO */}
      <td className="w-10 px-3 py-3 align-top">
        <span
          className={`text-[12.5px] font-bold ${
            item.status === "sesuai"
              ? "text-[#0f9b6e]"
              : isBelumSesuai
                ? "text-[#c0392b]"
                : uploaded
                  ? "text-[#1a4e8f]"
                  : "text-[#b0bac5]"
          }`}
        >
          {nomor !== null ? `${nomor}.` : ""}
        </span>
      </td>

      {/* DOKUMEN */}
      <td className="px-3 py-3 align-top">
        <div className="flex items-start gap-2.5">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
              uploaded ? "bg-[#eff6ff]" : "bg-[#f0f4fb]"
            }`}
          >
            <IconPdfDoc muted={!uploaded} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[13px] leading-snug font-semibold ${
                uploaded ? "text-[#1a1a2e]" : "text-[#8a96a3]"
              }`}
            >
              {entry.label}
              {wajib && uploaded && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </p>
            {!uploaded && (
              <p className="mt-0.5 text-[10.5px] text-[#c0392b] italic">
                Tidak diupload
              </p>
            )}
            {keterangan && uploaded && (
              <p className="mt-0.5 text-[10.5px] text-[#b0bac5] italic">
                ({keterangan})
              </p>
            )}
            <PrevSubLine items={prevItems} />
          </div>
        </div>
      </td>

      {/* AKSI — Radio + Lihat */}
      <td className="w-56 px-3 py-3 align-top">
        {uploaded ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onPreview}
                className="flex h-7 items-center justify-center rounded-sm border border-[#e2e8f2] bg-white px-2.5 text-[11px] font-semibold text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
              >
                Lihat
              </button>
              <RadioStatusGroup
                value={item.status}
                onChange={(v) => onChangeChecklist({ status: v })}
              />
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-[#b0bac5] italic">—</span>
        )}
      </td>

      {/* CATATAN — hanya muncul jika Belum Sesuai */}
      <td className="w-72 px-3 py-3 align-top">
        {uploaded && isBelumSesuai ? (
          <CatatanInput
            value={item.catatan}
            onChange={(val) => onChangeChecklist({ catatan: val })}
            showError
          />
        ) : (
          <span className="text-[11px] text-[#b0bac5] italic">
            {uploaded && item.status === "sesuai"
              ? "(Sesuai — tidak perlu catatan)"
              : "—"}
          </span>
        )}
      </td>
    </tr>
  );
};

/* ==================== Komponen utama ==================== */

export default function DaftarDokumenDenganChecklist({
  pengajuan,
  riwayat,
  currentLevel,
  checklistDokumen,
  onChecklistChange,
}: DaftarDokumenDenganChecklistProps) {
  const [previewDoc, setPreviewDoc] = useState<DokumenEntry | null>(null);

  const dokumenTampilan = useMemo(
    () => buildDokumenTampilan(pengajuan),
    [pengajuan],
  );
  const dokumenFlat = useMemo(
    () => flattenDokumenTampilan(dokumenTampilan),
    [dokumenTampilan],
  );

  const previousLevels = levelsBeforeCurrent(currentLevel);

  // Untuk setiap level sebelumnya, cari entry terakhirnya. Karena riwayat
  // append-only dan bisa multi-siklus, kita ambil entry PALING AKHIR dari
  // level itu yang berada di siklus saat ini (cari dari belakang, stop
  // kalau ketemu DIAJUKAN/SIKLUS_BARU_DIMULAI).
  const previousEntries = useMemo(() => {
    // Cari index awal siklus saat ini.
    let siklusAwalIdx = 0;
    for (let i = riwayat.length - 1; i >= 0; i--) {
      if (
        riwayat[i].milestone === "DIAJUKAN" ||
        riwayat[i].milestone === "SIKLUS_BARU_DIMULAI"
      ) {
        siklusAwalIdx = i;
        break;
      }
    }
    const riwayatSiklusIni = riwayat.slice(siklusAwalIdx);

    return previousLevels.map((level) => ({
      level,
      levelLabel: TELAAH_LEVEL_LABEL[level],
      entry: findEntryByLevel(riwayatSiklusIni, level),
    }));
  }, [riwayat, previousLevels]);

  const totalUploaded = dokumenFlat.filter((d) => d.file !== null).length;
  const totalAll = dokumenFlat.length;

  const totalSesuai = dokumenFlat.filter(
    (d) => d.file !== null && checklistDokumen[d.key]?.status === "sesuai",
  ).length;
  const totalBelumSesuai = dokumenFlat.filter(
    (d) =>
      d.file !== null && checklistDokumen[d.key]?.status === "belum_sesuai",
  ).length;

  const buildPrevForDoc = (docKey: string): PrevLevelInfo[] => {
    return previousEntries
      .map((p) => {
        if (!p.entry) return null;
        const entry = p.entry;
        const hasChecklist = !!entry.checklistDokumen;
        const isTeruskan =
          entry.milestone.startsWith("DITERUSKAN_") ||
          entry.milestone === "DIKIRIM_KE_OPD";

        return {
          level: p.level,
          levelLabel: p.levelLabel,
          timestamp: entry.timestamp,
          docItem: hasChecklist ? entry.checklistDokumen![docKey] : undefined,
          isTeruskan,
          catatanGlobal: entry.catatan,
        };
      })
      .filter((x): x is PrevLevelInfo => x !== null);
  };

  const renderDocRow = (
    entry: DokumenEntry,
    opts: {
      nomor: number | null;
      wajib?: boolean;
      keterangan?: string;
    },
  ) => {
    const item = checklistDokumen[entry.key] ?? {
      status: null,
      catatan: "",
    };
    return (
      <DocRow
        key={entry.key}
        nomor={opts.nomor}
        entry={entry}
        wajib={opts.wajib}
        keterangan={opts.keterangan}
        item={item}
        prevItems={buildPrevForDoc(entry.key)}
        onPreview={() => setPreviewDoc(entry)}
        onChangeChecklist={(next) => onChecklistChange(entry.key, next)}
      />
    );
  };

  return (
    <div className="space-y-4">
      {previewDoc?.file && (
        <ModalPreviewPDF
          namaFile={previewDoc.file.namaFile}
          url={previewDoc.file.url}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      <HeaderSection
        totalUploaded={totalUploaded}
        totalAll={totalAll}
        totalSesuai={totalSesuai}
        totalBelumSesuai={totalBelumSesuai}
      />

      {dokumenFlat.length === 0 ? (
        <div className="rounded-sm border border-dashed border-[#e2e8f2] bg-white py-8 text-center text-[13px] text-[#7a8899]">
          Tidak ada dokumen yang dilampirkan.
        </div>
      ) : (
        <>
          {/* ══════════════════ DESKTOP (≥ md): Tabel ══════════════════ */}
          <div className="hidden overflow-hidden rounded-sm border border-[#e2e8f2] bg-white md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f2] bg-[#f7f9fc]">
                  <th className="w-10 px-3 py-2.5 text-left text-[10.5px] font-bold tracking-wider text-[#5a6474] uppercase">
                    No
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10.5px] font-bold tracking-wider text-[#5a6474] uppercase">
                    Dokumen
                  </th>
                  <th className="w-56 px-3 py-2.5 text-left text-[10.5px] font-bold tracking-wider text-[#5a6474] uppercase">
                    Status
                  </th>
                  <th className="w-72 px-3 py-2.5 text-left text-[10.5px] font-bold tracking-wider text-[#5a6474] uppercase">
                    Catatan
                  </th>
                </tr>
              </thead>
              <tbody>
                {dokumenTampilan.map((tampilan) => {
                  if (tampilan.type === "single") {
                    return renderDocRow(tampilan.entry, {
                      nomor: tampilan.nomor,
                      wajib: tampilan.wajib,
                      keterangan: tampilan.keterangan,
                    });
                  }
                  return (
                    <Fragment key={`grup-${tampilan.nomor}`}>
                      <tr className="border-b border-[#e2e8f2] bg-[#f0f6fd]">
                        <td className="w-10 px-3 py-2 align-middle">
                          <span className="text-[12.5px] font-bold text-[#1a4e8f]">
                            {tampilan.nomor}.
                          </span>
                        </td>
                        <td colSpan={3} className="px-3 py-2 align-middle">
                          <p className="text-[12.5px] leading-snug font-bold text-[#1a1a2e]">
                            {tampilan.label}
                            {tampilan.wajib && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                          </p>
                          {tampilan.keterangan && (
                            <p className="mt-0.5 text-[10.5px] text-[#5a6474] italic">
                              ({tampilan.keterangan})
                            </p>
                          )}
                        </td>
                      </tr>
                      {tampilan.anak.map((entry) =>
                        renderDocRow(entry, { nomor: null }),
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ══════════════════ MOBILE (< md): Card View ══════════════════ */}
          <div className="space-y-3 md:hidden">
            {dokumenTampilan.map((tampilan) => {
              if (tampilan.type === "single") {
                const entry = tampilan.entry;
                const uploaded = !!entry.file;
                const item = checklistDokumen[entry.key] ?? {
                  status: null,
                  catatan: "",
                };
                const prevItems = buildPrevForDoc(entry.key);
                const isBelumSesuai = item.status === "belum_sesuai";

                return (
                  <div
                    key={entry.key}
                    className={`overflow-hidden rounded-sm border ${
                      item.status === "sesuai"
                        ? "border-[#a7f3d0] bg-white"
                        : isBelumSesuai
                          ? "border-[#fecaca] bg-white"
                          : uploaded
                            ? "border-[#e2e8f2] bg-white"
                            : "border-dashed border-[#e2e8f2] bg-[#fbfbfc]"
                    }`}
                  >
                    <div
                      className={`flex items-start gap-2.5 p-3 ${
                        item.status === "sesuai"
                          ? "bg-[#f7fdfa]"
                          : isBelumSesuai
                            ? "bg-[#fef6f6]"
                            : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 text-[12.5px] font-bold ${
                          item.status === "sesuai"
                            ? "text-[#0f9b6e]"
                            : isBelumSesuai
                              ? "text-[#c0392b]"
                              : uploaded
                                ? "text-[#1a4e8f]"
                                : "text-[#b0bac5]"
                        }`}
                      >
                        {tampilan.nomor !== null ? `${tampilan.nomor}.` : ""}
                      </span>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
                          uploaded ? "bg-[#eff6ff]" : "bg-[#f0f4fb]"
                        }`}
                      >
                        <IconPdfDoc muted={!uploaded} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] leading-snug font-semibold ${
                            uploaded ? "text-[#1a1a2e]" : "text-[#8a96a3]"
                          }`}
                        >
                          {entry.label}
                          {tampilan.wajib && uploaded && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </p>
                        {!uploaded && (
                          <p className="mt-0.5 text-[10.5px] text-[#c0392b] italic">
                            Tidak diupload
                          </p>
                        )}
                        <PrevSubLine items={prevItems} />
                      </div>
                    </div>

                    {uploaded && (
                      <>
                        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#eef1f5] bg-white px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(entry)}
                            className="flex h-7 items-center justify-center rounded-sm border border-[#e2e8f2] bg-white px-2.5 text-[11px] font-semibold text-[#1a4e8f] transition hover:bg-[#e8f0fb]"
                          >
                            Lihat
                          </button>
                          <RadioStatusGroup
                            value={item.status}
                            onChange={(v) =>
                              onChecklistChange(entry.key, { status: v })
                            }
                          />
                        </div>
                        {isBelumSesuai && (
                          <div className="border-t border-[#eef1f5] bg-[#fef6f6] px-3 py-2.5">
                            <label className="mb-1 block text-[10px] font-bold tracking-wider text-[#c0392b] uppercase">
                              Catatan Anda (wajib)
                            </label>
                            <CatatanInput
                              value={item.catatan}
                              onChange={(val) =>
                                onChecklistChange(entry.key, { catatan: val })
                              }
                              showError
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              }

              // Group
              return (
                <Fragment key={`grup-${tampilan.nomor}`}>
                  <div className="flex items-start gap-2.5 rounded-sm border border-[#dbe6f7] bg-[#f0f6fd] px-3 py-2.5">
                    <span className="text-[12.5px] font-bold text-[#1a4e8f]">
                      {tampilan.nomor}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] leading-snug font-bold text-[#1a1a2e]">
                        {tampilan.label}
                        {tampilan.wajib && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </p>
                      {tampilan.keterangan && (
                        <p className="mt-0.5 text-[10.5px] text-[#5a6474] italic">
                          ({tampilan.keterangan})
                        </p>
                      )}
                    </div>
                  </div>

                  {tampilan.anak.map((entry) => {
                    const uploaded = !!entry.file;
                    const item = checklistDokumen[entry.key] ?? {
                      status: null,
                      catatan: "",
                    };
                    const prevItems = buildPrevForDoc(entry.key);
                    const isBelumSesuai = item.status === "belum_sesuai";

                    return (
                      <div
                        key={entry.key}
                        className={`overflow-hidden rounded-sm border ${
                          item.status === "sesuai"
                            ? "border-[#a7f3d0] bg-white"
                            : isBelumSesuai
                              ? "border-[#fecaca] bg-white"
                              : uploaded
                                ? "border-[#e2e8f2] bg-white"
                                : "border-dashed border-[#e2e8f2] bg-[#fbfbfc]"
                        }`}
                      >
                        <div
                          className={`flex items-start gap-2.5 p-3 ${
                            item.status === "sesuai"
                              ? "bg-[#f7fdfa]"
                              : isBelumSesuai
                                ? "bg-[#fef6f6]"
                                : ""
                          }`}
                        >
                          <div className="w-5 shrink-0" />
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
                              uploaded ? "bg-[#eff6ff]" : "bg-[#f0f4fb]"
                            }`}
                          >
                            <IconPdfDoc muted={!uploaded} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[13px] leading-snug font-semibold ${
                                uploaded ? "text-[#1a1a2e]" : "text-[#8a96a3]"
                              }`}
                            >
                              {entry.label}
                            </p>
                            {!uploaded && (
                              <p className="mt-0.5 text-[10.5px] text-[#c0392b] italic">
                                Tidak diupload
                              </p>
                            )}
                            <PrevSubLine items={prevItems} />
                          </div>
                        </div>

                        {uploaded && (
                          <>
                            <div className="flex flex-wrap items-center gap-1.5 border-t border-[#eef1f5] bg-white px-3 py-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(entry)}
                                className="flex h-7 items-center justify-center rounded-sm border border-[#e2e8f2] bg-white px-2.5 text-[11px] font-semibold text-[#1a4e8f] transition hover:bg-[#e8f0fb]"
                              >
                                Lihat
                              </button>
                              <RadioStatusGroup
                                value={item.status}
                                onChange={(v) =>
                                  onChecklistChange(entry.key, { status: v })
                                }
                              />
                            </div>
                            {isBelumSesuai && (
                              <div className="border-t border-[#eef1f5] bg-[#fef6f6] px-3 py-2.5">
                                <label className="mb-1 block text-[10px] font-bold tracking-wider text-[#c0392b] uppercase">
                                  Catatan Anda (wajib)
                                </label>
                                <CatatanInput
                                  value={item.catatan}
                                  onChange={(val) =>
                                    onChecklistChange(entry.key, {
                                      catatan: val,
                                    })
                                  }
                                  showError
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
