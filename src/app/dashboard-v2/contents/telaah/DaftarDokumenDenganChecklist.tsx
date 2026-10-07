"use client";

/* ------------------------------------------------------------------ */
/*  DaftarDokumenDenganChecklist.tsx                                   */
/*  Layout Opsi E — Tabel dengan Info Row Tipis.                       */
/*                                                                      */
/*  Tabel 4 kolom: NO | DOKUMEN | AKSI | CATATAN                       */
/*   - NO: plain text (tanpa bulatan)                                  */
/*   - DOKUMEN: label saja (tanpa filename)                            */
/*   - AKSI: [Lihat] (teks) + [✓ Centang]                              */
/*   - CATATAN: textarea                                               */
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
  ModalPreviewPDF,
  type DokumenEntry,
} from "./TelaahDokumenShared";

/* ==================== Tipe publik ==================== */

export type ChecklistItem = { checked: boolean; catatan: string };
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

const IconCheck = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
  >
    <path
      d="M3 8l3.5 3.5L13 4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconAlert = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M8 2.5l6 11H2l6-11z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 6.5v3.5M8 12v.5" strokeLinecap="round" />
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

/* ==================== Helper ==================== */

function fileOf(dok: DokumenEntry): UploadedFileRef | null {
  return dok.file;
}

function findChecklistByLevel(
  riwayat: TelaahLogEntry[],
  level: TelaahLevel,
): { username: string; timestamp: string; checklist: ChecklistMap } | null {
  const milestone =
    level === "kasubbid"
      ? "SUDAH_TELAAH_KASUBBID"
      : level === "kabid"
        ? "SUDAH_TELAAH_KABID"
        : "SUDAH_TELAAH_SEKBAN";

  for (let i = riwayat.length - 1; i >= 0; i--) {
    const r = riwayat[i];
    if (r.milestone === milestone) {
      return {
        username: r.olehUsername,
        timestamp: r.timestamp,
        checklist: r.checklistDokumen ?? {},
      };
    }
  }
  return null;
}

const LEVEL_ORDER: TelaahLevel[] = ["kasubbid", "kabid", "sekban"];

function levelsBeforeCurrent(current: TelaahLevel): TelaahLevel[] {
  const idx = LEVEL_ORDER.indexOf(current);
  return idx <= 0 ? [] : LEVEL_ORDER.slice(0, idx);
}

type StatusKind = "belum" | "checked" | "kosong";

/* ==================== Header Section (Progress) ==================== */

const HeaderSection: React.FC<{
  totalUploaded: number;
  totalAll: number;
  totalChecked: number;
}> = ({ totalUploaded, totalAll, totalChecked }) => {
  const isComplete = totalUploaded > 0 && totalChecked === totalUploaded;
  const isEmpty = totalUploaded === 0;
  const percent =
    totalUploaded === 0 ? 0 : Math.round((totalChecked / totalUploaded) * 100);

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
            Periksa setiap dokumen di bawah.{" "}
            <span className="font-semibold text-[#1a4e8f]">
              Centang semua dokumen yang diupload
            </span>{" "}
            — catatan per dokumen bersifat opsional.
          </p>
        </div>
      </div>

      <div
        className={`mt-4 rounded-sm border px-4 py-3 ${
          isEmpty
            ? "border-[#e2e8f2] bg-[#f7f8fa]"
            : isComplete
              ? "border-[#a7f3d0] bg-[#ecfdf5]"
              : "border-[#fde68a] bg-[#fffbeb]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                isEmpty
                  ? "bg-[#7a8899]"
                  : isComplete
                    ? "bg-[#0f9b6e]"
                    : "bg-[#f59e0b]"
              }`}
            >
              {isComplete ? <IconCheck /> : <IconClipboard />}
            </span>
            <div className="min-w-0">
              <div
                className={`text-[13px] font-bold ${
                  isEmpty
                    ? "text-[#5a6474]"
                    : isComplete
                      ? "text-[#0f6e56]"
                      : "text-[#b45309]"
                }`}
              >
                {isEmpty
                  ? "Tidak ada dokumen yang diupload"
                  : isComplete
                    ? "Semua dokumen sudah dicek"
                    : `${totalUploaded - totalChecked} dokumen belum dicek`}
              </div>
              <div className="text-[11px] text-[#7a8899]">
                {totalUploaded} dari {totalAll} dokumen diupload
              </div>
            </div>
          </div>
          <div
            className={`text-[18px] leading-none font-bold ${
              isEmpty
                ? "text-[#7a8899]"
                : isComplete
                  ? "text-[#0f6e56]"
                  : "text-[#b45309]"
            }`}
          >
            {totalChecked}
            <span className="text-[13px] text-[#7a8899]">/{totalUploaded}</span>
          </div>
        </div>

        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white">
          <div
            className={`h-full transition-all duration-500 ${
              isEmpty
                ? "bg-[#d0d7de]"
                : isComplete
                  ? "bg-[#0f9b6e]"
                  : "bg-[#f59e0b]"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/* ==================== Sub-line: Telaah Sebelumnya ==================== */

const PrevSubLine: React.FC<{
  items: {
    level: TelaahLevel;
    levelLabel: string;
    timestamp: string;
    item: ChecklistItem | undefined;
  }[];
}> = ({ items }) => {
  const valid = items.filter((i) => i.item);
  if (valid.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {valid.map((p, idx) => {
        const isLast = idx === valid.length - 1;
        const prefix = isLast ? "└" : "├";
        return (
          <div
            key={p.level}
            className="flex items-start gap-1.5 text-[10.5px] leading-tight text-[#5a6474]"
          >
            <span className="shrink-0 font-mono text-[#b0bac5]">{prefix}</span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold tracking-wide text-[#0f6e56] uppercase">
              <IconUserBadge />
              {p.levelLabel}
            </span>
            <span className="shrink-0 text-[#b0bac5]">:</span>
            {p.item!.catatan.trim() ? (
              <span className="min-w-0 truncate text-[#3a4454] italic">
                &ldquo;{p.item!.catatan}&rdquo;
              </span>
            ) : (
              <span className="min-w-0 truncate text-[#b0bac5] italic">
                {p.item!.checked
                  ? "(diperiksa, tanpa catatan)"
                  : "(belum diperiksa)"}
              </span>
            )}
            <span className="ml-1 shrink-0">
              {p.item!.checked ? (
                <span className="inline-flex text-[#0f6e56]">
                  <IconCheck />
                </span>
              ) : (
                <span className="inline-flex text-[#c0392b]">
                  <IconAlert />
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ==================== Catatan Input Inline ==================== */

const CatatanInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={2}
    placeholder="Catatan (opsional)…"
    className="w-full resize-none rounded-sm border border-[#e2e8f2] bg-white p-2 text-[12px] text-[#1a1a2e] outline-none focus:border-[#a0bdec] focus:bg-[#f0f6fd]"
  />
);

/* ==================== DocRow ==================== */

interface DocRowProps {
  nomor: number | null;
  entry: DokumenEntry;
  wajib?: boolean;
  keterangan?: string;
  status: StatusKind;
  item: ChecklistItem;
  prevItems: {
    level: TelaahLevel;
    levelLabel: string;
    timestamp: string;
    item: ChecklistItem | undefined;
  }[];
  onPreview: () => void;
  onChangeChecklist: (next: Partial<ChecklistItem>) => void;
}

const DocRow: React.FC<DocRowProps> = ({
  nomor,
  entry,
  wajib,
  keterangan,
  status,
  item,
  prevItems,
  onPreview,
  onChangeChecklist,
}) => {
  const uploaded = !!entry.file;

  return (
    <tr
      className={`border-b border-[#eef1f5] transition-colors ${
        status === "checked"
          ? "bg-[#f7fdfa]"
          : uploaded
            ? "hover:bg-[#f7f8fa]"
            : "bg-[#fbfbfc]"
      }`}
    >
      {/* NO — plain text, tanpa bulatan */}
      <td className="w-10 px-3 py-3 align-top">
        <span
          className={`text-[12.5px] font-bold ${
            status === "checked"
              ? "text-[#0f9b6e]"
              : status === "kosong"
                ? "text-[#b0bac5]"
                : "text-[#1a4e8f]"
          }`}
        >
          {nomor !== null ? `${nomor}.` : ""}
        </span>
      </td>

      {/* DOKUMEN — hanya label (filename dihilangkan) */}
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

      {/* AKSI — Lihat (teks) + Centang */}
      <td className="w-40 px-3 py-3 align-top">
        {uploaded ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPreview}
              className="flex h-8 items-center justify-center rounded-sm border border-[#e2e8f2] bg-white px-3 text-[11px] font-semibold text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
            >
              Lihat
            </button>
            <label
              title={
                item.checked ? "Batalkan centang" : "Centang sudah diperiksa"
              }
              className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 transition ${
                item.checked
                  ? "border-[#a7f3d0] bg-[#ecfdf5]"
                  : "border-[#e2e8f2] bg-white hover:border-[#a0bdec] hover:bg-[#f0f6fd]"
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) =>
                  onChangeChecklist({ checked: e.target.checked })
                }
                className="h-4 w-4 shrink-0 cursor-pointer rounded-sm border-gray-300 accent-[#0f9b6e]"
              />
              <span
                className={`text-[10.5px] font-bold whitespace-nowrap ${
                  item.checked ? "text-[#065f46]" : "text-[#5a6474]"
                }`}
              >
                {item.checked ? "Dicek" : "Centang"}
              </span>
            </label>
          </div>
        ) : (
          <span className="text-[11px] text-[#b0bac5] italic">—</span>
        )}
      </td>

      {/* CATATAN */}
      <td className="w-64 px-3 py-3 align-top">
        {uploaded ? (
          <CatatanInput
            value={item.catatan}
            onChange={(val) => onChangeChecklist({ catatan: val })}
          />
        ) : (
          <span className="text-[11px] text-[#b0bac5] italic">—</span>
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
  const previousChecklists = useMemo(
    () =>
      previousLevels.map((level) => ({
        level,
        levelLabel: TELAAH_LEVEL_LABEL[level],
        data: findChecklistByLevel(riwayat, level),
      })),
    [previousLevels, riwayat],
  );

  const totalUploaded = dokumenFlat.filter((d) => d.file !== null).length;
  const totalAll = dokumenFlat.length;
  const totalChecked = dokumenFlat.filter(
    (d) => d.file !== null && checklistDokumen[d.key]?.checked,
  ).length;

  const getStatus = (key: string, uploaded: boolean): StatusKind => {
    if (!uploaded) return "kosong";
    return checklistDokumen[key]?.checked ? "checked" : "belum";
  };

  const buildPrevForDoc = (docKey: string) =>
    previousChecklists
      .map((p) => {
        if (!p.data) return null;
        return {
          level: p.level,
          levelLabel: p.levelLabel,
          timestamp: p.data.timestamp,
          item: p.data.checklist[docKey],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

  const renderDocRow = (
    entry: DokumenEntry,
    opts: {
      nomor: number | null;
      wajib?: boolean;
      keterangan?: string;
    },
  ) => {
    const uploaded = !!entry.file;
    const status = getStatus(entry.key, uploaded);
    const item = checklistDokumen[entry.key] ?? {
      checked: false,
      catatan: "",
    };
    return (
      <DocRow
        key={entry.key}
        nomor={opts.nomor}
        entry={entry}
        wajib={opts.wajib}
        keterangan={opts.keterangan}
        status={status}
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
        totalChecked={totalChecked}
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
                  <th className="w-40 px-3 py-2.5 text-left text-[10.5px] font-bold tracking-wider text-[#5a6474] uppercase">
                    Aksi
                  </th>
                  <th className="w-64 px-3 py-2.5 text-left text-[10.5px] font-bold tracking-wider text-[#5a6474] uppercase">
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
                      {/* Group header */}
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

                      {/* Sub-dokumen rows (kolom NO kosong) */}
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
                const status = getStatus(entry.key, uploaded);
                const item = checklistDokumen[entry.key] ?? {
                  checked: false,
                  catatan: "",
                };
                const prevItems = buildPrevForDoc(entry.key);

                return (
                  <div
                    key={entry.key}
                    className={`overflow-hidden rounded-sm border ${
                      status === "checked"
                        ? "border-[#a7f3d0] bg-white"
                        : uploaded
                          ? "border-[#e2e8f2] bg-white"
                          : "border-dashed border-[#e2e8f2] bg-[#fbfbfc]"
                    }`}
                  >
                    <div
                      className={`flex items-start gap-2.5 p-3 ${
                        status === "checked" ? "bg-[#f7fdfa]" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 text-[12.5px] font-bold ${
                          status === "checked"
                            ? "text-[#0f9b6e]"
                            : status === "kosong"
                              ? "text-[#b0bac5]"
                              : "text-[#1a4e8f]"
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
                        <div className="flex items-center gap-1.5 border-t border-[#eef1f5] bg-white px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(entry)}
                            className="flex h-8 flex-1 items-center justify-center rounded-sm border border-[#e2e8f2] bg-white text-[11px] font-semibold text-[#1a4e8f] transition hover:bg-[#e8f0fb]"
                          >
                            Lihat
                          </button>
                          <label
                            className={`flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border text-[11px] font-bold transition ${
                              item.checked
                                ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]"
                                : "border-[#e2e8f2] bg-white text-[#5a6474]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) =>
                                onChecklistChange(entry.key, {
                                  checked: e.target.checked,
                                })
                              }
                              className="h-4 w-4 shrink-0 cursor-pointer rounded-sm border-gray-300 accent-[#0f9b6e]"
                            />
                            {item.checked ? "Sudah dicek" : "Centang"}
                          </label>
                        </div>
                        <div className="border-t border-[#eef1f5] px-3 py-2.5">
                          <label className="mb-1 block text-[10px] font-bold tracking-wider text-[#1a4e8f] uppercase">
                            Catatan Anda
                          </label>
                          <CatatanInput
                            value={item.catatan}
                            onChange={(val) =>
                              onChecklistChange(entry.key, { catatan: val })
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              }

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
                    const status = getStatus(entry.key, uploaded);
                    const item = checklistDokumen[entry.key] ?? {
                      checked: false,
                      catatan: "",
                    };
                    const prevItems = buildPrevForDoc(entry.key);

                    return (
                      <div
                        key={entry.key}
                        className={`overflow-hidden rounded-sm border ${
                          status === "checked"
                            ? "border-[#a7f3d0] bg-white"
                            : uploaded
                              ? "border-[#e2e8f2] bg-white"
                              : "border-dashed border-[#e2e8f2] bg-[#fbfbfc]"
                        }`}
                      >
                        <div
                          className={`flex items-start gap-2.5 p-3 ${
                            status === "checked" ? "bg-[#f7fdfa]" : ""
                          }`}
                        >
                          {/* No placeholder untuk sub-dokumen */}
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
                            <div className="flex items-center gap-1.5 border-t border-[#eef1f5] bg-white px-3 py-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(entry)}
                                className="flex h-8 flex-1 items-center justify-center rounded-sm border border-[#e2e8f2] bg-white text-[11px] font-semibold text-[#1a4e8f] transition hover:bg-[#e8f0fb]"
                              >
                                Lihat
                              </button>
                              <label
                                className={`flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm border text-[11px] font-bold transition ${
                                  item.checked
                                    ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]"
                                    : "border-[#e2e8f2] bg-white text-[#5a6474]"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={(e) =>
                                    onChecklistChange(entry.key, {
                                      checked: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 shrink-0 cursor-pointer rounded-sm border-gray-300 accent-[#0f9b6e]"
                                />
                                {item.checked ? "Sudah dicek" : "Centang"}
                              </label>
                            </div>
                            <div className="border-t border-[#eef1f5] px-3 py-2.5">
                              <label className="mb-1 block text-[10px] font-bold tracking-wider text-[#1a4e8f] uppercase">
                                Catatan Anda
                              </label>
                              <CatatanInput
                                value={item.catatan}
                                onChange={(val) =>
                                  onChecklistChange(entry.key, {
                                    catatan: val,
                                  })
                                }
                              />
                            </div>
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
