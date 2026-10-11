"use client";

/* ------------------------------------------------------------------ */
/*  DaftarDokumenReadOnly.tsx                                          */
/*  Panel dokumen pendukung READ-ONLY — untuk admin / non-giliran /    */
/*  telaah selesai. Tampilkan status per-dokumen dari tiap level.      */
/* ------------------------------------------------------------------ */

import { Fragment, useMemo, useState } from "react";
import type { FormulirPenghapusanPiutangOPDRecord } from "@/types/types";
import type { TelaahLevel, TelaahLogEntry } from "@/types/telaah-internal";
import { TELAAH_LEVEL_LABEL } from "@/types/telaah-internal";
import {
  buildDokumenTampilan,
  flattenDokumenTampilan,
  findEntryByLevel,
  ModalPreviewPDF,
  type DokumenEntry,
} from "./TelaahDokumenShared";

interface DaftarDokumenReadOnlyProps {
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  riwayat: TelaahLogEntry[];
}

type StatusDokumenTelaah = "sesuai" | "belum_sesuai" | null;
type ChecklistItem = { status: StatusDokumenTelaah; catatan: string };

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
    width="12"
    height="12"
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

const IconX = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
  >
    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
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

const IconLock = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" strokeLinecap="round" />
  </svg>
);

/* ==================== Helper prev entry ==================== */

interface PrevLevelInfo {
  level: TelaahLevel;
  levelLabel: string;
  timestamp: string;
  docItem: ChecklistItem | undefined;
  isTeruskan: boolean;
  catatanGlobal: string;
}

const LEVEL_ORDER: TelaahLevel[] = ["kasubbid", "kabid", "sekban"];

/* ==================== Sub-line ==================== */

const PrevSubLine: React.FC<{ items: PrevLevelInfo[] }> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {items.map((p, idx) => {
        const isLast = idx === items.length - 1;
        const prefix = isLast ? "└" : "├";

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
              {isSesuai ? <IconCheck /> : <IconX />}
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

/* ==================== Header Section ==================== */

const HeaderSection: React.FC<{
  totalUploaded: number;
  totalAll: number;
}> = ({ totalUploaded, totalAll }) => (
  <div className="rounded-sm border-2 border-[#1a4e8f]/15 bg-white p-5">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1a4e8f] text-white">
        <IconClipboard />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-bold text-[#1a1a2e]">
          Dokumen Pendukung
        </h3>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[#5a6474]">
          <span className="font-semibold text-[#1a4e8f]">{totalUploaded}</span>{" "}
          dari <span className="font-semibold text-[#1a4e8f]">{totalAll}</span>{" "}
          dokumen diupload.
        </p>
      </div>
    </div>

    <div className="mt-3 flex items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-white text-[#7a8899]">
        <IconLock />
      </span>
      <p className="text-[11.5px] text-[#5a6474]">
        Panel read-only — Anda hanya dapat melihat dokumen (tidak dapat
        mengubah).
      </p>
    </div>
  </div>
);

/* ==================== DocRow (read-only) ==================== */

interface DocRowProps {
  nomor: number | null;
  entry: DokumenEntry;
  wajib?: boolean;
  keterangan?: string;
  prevItems: PrevLevelInfo[];
  onPreview: () => void;
}

const DocRow: React.FC<DocRowProps> = ({
  nomor,
  entry,
  wajib,
  keterangan,
  prevItems,
  onPreview,
}) => {
  const uploaded = !!entry.file;

  return (
    <tr
      className={`border-b border-[#eef1f5] ${
        uploaded ? "hover:bg-[#f7f8fa]" : "bg-[#fbfbfc]"
      }`}
    >
      <td className="w-10 px-3 py-3 align-top">
        <span
          className={`text-[12.5px] font-bold ${
            uploaded ? "text-[#1a4e8f]" : "text-[#b0bac5]"
          }`}
        >
          {nomor !== null ? `${nomor}.` : ""}
        </span>
      </td>

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

      <td className="w-32 px-3 py-3 align-top">
        {uploaded ? (
          <button
            type="button"
            onClick={onPreview}
            className="flex h-8 items-center justify-center rounded-sm border border-[#e2e8f2] bg-white px-3 text-[11px] font-semibold text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
          >
            Lihat
          </button>
        ) : (
          <span className="text-[11px] text-[#b0bac5] italic">—</span>
        )}
      </td>
    </tr>
  );
};

/* ==================== Komponen utama ==================== */

export default function DaftarDokumenReadOnly({
  pengajuan,
  riwayat,
}: DaftarDokumenReadOnlyProps) {
  const [previewDoc, setPreviewDoc] = useState<DokumenEntry | null>(null);

  const dokumenTampilan = useMemo(
    () => buildDokumenTampilan(pengajuan),
    [pengajuan],
  );
  const dokumenFlat = useMemo(
    () => flattenDokumenTampilan(dokumenTampilan),
    [dokumenTampilan],
  );

  // Kumpulkan entry terakhir per level DARI SIKLUS SAAT INI.
  const allEntries = useMemo(() => {
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
    return LEVEL_ORDER.map((level) => ({
      level,
      levelLabel: TELAAH_LEVEL_LABEL[level],
      entry: findEntryByLevel(riwayatSiklusIni, level),
    }));
  }, [riwayat]);

  const totalUploaded = dokumenFlat.filter((d) => d.file !== null).length;
  const totalAll = dokumenFlat.length;

  const buildPrevForDoc = (docKey: string): PrevLevelInfo[] =>
    allEntries
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

  const renderDocRow = (
    entry: DokumenEntry,
    opts: {
      nomor: number | null;
      wajib?: boolean;
      keterangan?: string;
    },
  ) => (
    <DocRow
      key={entry.key}
      nomor={opts.nomor}
      entry={entry}
      wajib={opts.wajib}
      keterangan={opts.keterangan}
      prevItems={buildPrevForDoc(entry.key)}
      onPreview={() => setPreviewDoc(entry)}
    />
  );

  return (
    <div className="space-y-4">
      {previewDoc?.file && (
        <ModalPreviewPDF
          namaFile={previewDoc.file.namaFile}
          url={previewDoc.file.url}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      <HeaderSection totalUploaded={totalUploaded} totalAll={totalAll} />

      {dokumenFlat.length === 0 ? (
        <div className="rounded-sm border border-dashed border-[#e2e8f2] bg-white py-8 text-center text-[13px] text-[#7a8899]">
          Tidak ada dokumen yang dilampirkan.
        </div>
      ) : (
        <>
          {/* DESKTOP */}
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
                  <th className="w-32 px-3 py-2.5 text-left text-[10.5px] font-bold tracking-wider text-[#5a6474] uppercase">
                    Aksi
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
                        <td colSpan={2} className="px-3 py-2 align-middle">
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

          {/* MOBILE */}
          <div className="space-y-3 md:hidden">
            {dokumenTampilan.map((tampilan) => {
              if (tampilan.type === "single") {
                const entry = tampilan.entry;
                const uploaded = !!entry.file;
                const prevItems = buildPrevForDoc(entry.key);

                return (
                  <div
                    key={entry.key}
                    className={`overflow-hidden rounded-sm border ${
                      uploaded
                        ? "border-[#e2e8f2] bg-white"
                        : "border-dashed border-[#e2e8f2] bg-[#fbfbfc]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 p-3">
                      <span
                        className={`mt-0.5 text-[12.5px] font-bold ${
                          uploaded ? "text-[#1a4e8f]" : "text-[#b0bac5]"
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
                      <div className="border-t border-[#eef1f5] bg-white px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(entry)}
                          className="flex h-8 w-full items-center justify-center rounded-sm border border-[#e2e8f2] bg-white text-[11px] font-semibold text-[#1a4e8f] transition hover:bg-[#e8f0fb]"
                        >
                          Lihat
                        </button>
                      </div>
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
                    const prevItems = buildPrevForDoc(entry.key);

                    return (
                      <div
                        key={entry.key}
                        className={`overflow-hidden rounded-sm border ${
                          uploaded
                            ? "border-[#e2e8f2] bg-white"
                            : "border-dashed border-[#e2e8f2] bg-[#fbfbfc]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 p-3">
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
                          <div className="border-t border-[#eef1f5] bg-white px-3 py-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(entry)}
                              className="flex h-8 w-full items-center justify-center rounded-sm border border-[#e2e8f2] bg-white text-[11px] font-semibold text-[#1a4e8f] transition hover:bg-[#e8f0fb]"
                            >
                              Lihat
                            </button>
                          </div>
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
