"use client";

/* ------------------------------------------------------------------ */
/*  TelaahInternalAdmin.tsx (Compact Version)                          */
/*  Menu "Telaah Internal" untuk admin — 3 tab + filter OPD.           */
/*                                                                      */
/*  Kartu design compact: 2 baris utama + action button di kanan.      */
/*   - Baris 1: nomor + badge + nominal (kanan)
/*   - Baris 2: OPD · PJ · debitur                                        */
/*   - Baris 3 (khusus Dalam Proses/Selesai): meta tambahan              */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import type { FormulirPenghapusanPiutangOPDRecord } from "@/types/types";
import type { TelaahTahap } from "@/types/telaah-internal";
import { useAuth } from "@/store/auth-store";
import { usePengajuanStore } from "@/store/pengajuan-store";
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import { formatRupiah, formatTanggalWaktu } from "./TelaahDokumenShared";
import ModalKonfirmasiAjukan from "./ModalKonfirmasiAjukan";
import DetailTelaah from "./DetailTelaah";

/* ==================== Ikon ==================== */

const IconSearch = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="6.5" cy="6.5" r="4.5" />
    <path d="M10 10l3 3" strokeLinecap="round" />
  </svg>
);

const IconClose = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
  </svg>
);

const IconFilter = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M1.5 3.5h12M4 7.5h7M6.5 11.5h2" strokeLinecap="round" />
  </svg>
);

const IconCheck = () => (
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

const IconCheckBig = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
  >
    <path
      d="M4 11l4.5 4.5L18 6.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClock = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5v3.5l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPlus = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M7 2.5v9M2.5 7h9" strokeLinecap="round" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconBuilding = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M5 19V4a1 1 0 011-1h10a1 1 0 011 1v15" strokeLinecap="round" />
    <path
      d="M3 19h16M8 7h1.5M12.5 7H14M8 11h1.5M12.5 11H14M8 15h1.5M12.5 15H14"
      strokeLinecap="round"
    />
  </svg>
);

const IconHourglass = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M6 3h10M6 19h10M7 3v3c0 2 3 3.5 4 5 1-1.5 4-3 4-5V3M7 19v-3c0-2 3-3.5 4-5 1 1.5 4 3 4 5v3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconInbox = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M3 10l2-6h10l2 6v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 10h4l1 2h4l1-2h4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconArchive = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <rect x="2" y="3" width="16" height="4" rx="0.5" />
    <path
      d="M3 7v9a1 1 0 001 1h12a1 1 0 001-1V7M8 11h4"
      strokeLinecap="round"
    />
  </svg>
);

const IconLayers = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M10 2L2 6l8 4 8-4-8-4z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 10l8 4 8-4M2 14l8 4 8-4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ==================== Helper ==================== */

function formatDurasi(fromIso: string, toIso?: string | null): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  if (Number.isNaN(from) || Number.isNaN(to)) return "-";
  const detik = Math.max(0, Math.floor((to - from) / 1000));
  if (detik < 60) return `${detik} dtk`;
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} mnt`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam`;
  const hari = Math.floor(jam / 24);
  const sisaJam = jam % 24;
  if (hari < 30) return sisaJam > 0 ? `${hari}h ${sisaJam}j` : `${hari} hari`;
  return `${Math.floor(hari / 30)} bln`;
}

function labelPemegangTahap(tahap: TelaahTahap): string | null {
  if (tahap === "MENUNGGU_TELAAH_KASUBBID") return "Kasubbid";
  if (tahap === "MENUNGGU_TELAAH_KABID") return "Kabid";
  if (tahap === "MENUNGGU_TELAAH_SEKBAN") return "Sekban";
  return null;
}

function stepSelesai(tahap: TelaahTahap): number {
  if (tahap === "MENUNGGU_TELAAH_KASUBBID") return 0;
  if (tahap === "MENUNGGU_TELAAH_KABID") return 1;
  if (tahap === "MENUNGGU_TELAAH_SEKBAN") return 2;
  return 3;
}

type TabKey = "belum" | "proses" | "selesai";

/* ==================== Stat Card ==================== */

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel?: string;
  accentClass: string;
  bgClass: string;
  borderClass: string;
}> = ({ icon, label, value, sublabel, accentClass, bgClass, borderClass }) => (
  <div
    className={`flex min-w-0 items-center gap-3 rounded-sm border px-4 py-3 ${bgClass} ${borderClass}`}
  >
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-white ${accentClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[20px] leading-none font-bold text-[#1a1a2e]">
        {value}
      </div>
      <div className="mt-1 truncate text-[11.5px] font-semibold text-[#5a6474]">
        {label}
      </div>
      {sublabel && (
        <div className="mt-0.5 truncate text-[10.5px] text-[#7a8899]">
          {sublabel}
        </div>
      )}
    </div>
  </div>
);

/* ==================== Progress Bar (compact) ==================== */

const ProgressTelaah: React.FC<{ tahap: TelaahTahap }> = ({ tahap }) => {
  const selesai = stepSelesai(tahap);
  const steps = ["Kas", "Kab", "Sek"];

  return (
    <div className="inline-flex items-center gap-1">
      {steps.map((label, idx) => {
        const isDone = idx < selesai;
        const isActive = idx === selesai && tahap !== "SELESAI";
        return (
          <div key={label} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9.5px] font-bold ${
                isDone
                  ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]"
                  : isActive
                    ? "border-[#fbbf24] bg-[#fffbeb] text-[#b45309]"
                    : "border-[#e2e8f2] bg-white text-[#b0bac5]"
              }`}
            >
              {isDone && (
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M3 8l3.5 3.5L13 4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {isActive && (
                <span className="h-1 w-1 animate-pulse rounded-full bg-[#f59e0b]" />
              )}
              {label}
            </div>
            {idx < steps.length - 1 && (
              <span
                className={`h-px w-1.5 ${idx < selesai ? "bg-[#a7f3d0]" : "bg-[#e2e8f2]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ==================== Kartu: Belum Diajukan ==================== */
const KartuBelumDiajukan: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  onAjukan: () => void;
}> = ({ pengajuan, onAjukan }) => {
  const identitas = pengajuan.nomorRegistrasi || pengajuan.nomorPengajuan;

  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-[#dbe6f7] bg-white pl-3.5 transition-all duration-150 hover:border-[#1a4e8f]/40 hover:shadow-md sm:flex-row sm:items-start sm:gap-4 sm:p-3">
      {/* Accent bar kiri */}
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#1a4e8f]" />

      {/* ═══ Kolom 1: Icon (align top) ═══ */}
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#eff6ff] text-[#1a4e8f] sm:flex">
        <IconBuilding />
      </div>

      {/* ═══ Kolom 2: Nomor + OPD + PJ ═══ */}
      <div className="min-w-0 flex-1 p-3.5 sm:p-0">
        <div className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
          {identitas}
        </div>
        <div className="mt-1 truncate text-[13px] leading-tight font-bold text-[#1a1a2e]">
          {pengajuan.namaOPD}
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-[#7a8899]">
          {pengajuan.namaPenanggungJawab}
        </div>
      </div>

      {/* ═══ Kolom 3: Badge Siap Ditelaah + Jumlah Debitur (align top) ═══ */}
      <div className="shrink-0 border-t border-[#f1f5f9] p-3.5 sm:border-t-0 sm:p-0 sm:pt-0.5">
        <span className="inline-block rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#1a4e8f] uppercase">
          Siap Ditelaah
        </span>
        <div className="mt-1 text-[11px] text-[#7a8899]">
          <span className="font-semibold text-[#5a6474]">
            {pengajuan.jumlahDebitur}
          </span>{" "}
          debitur
        </div>
      </div>

      {/* ═══ Kolom 4: Nominal (align top) ═══ */}
      <div className="shrink-0 border-t border-[#f1f5f9] p-3.5 sm:min-w-32.5 sm:border-t-0 sm:p-0 sm:pt-0.5 sm:text-right">
        <div className="text-[10px] font-bold tracking-wider text-[#7a8899] uppercase sm:text-right">
          Nilai Piutang
        </div>
        <div className="mt-0.5 text-[13px] leading-tight font-bold text-[#1a4e8f]">
          {formatRupiah(pengajuan.totalNilaiPiutang)}
        </div>
      </div>

      {/* ═══ Kolom 5: Tombol Ajukan (align top) ═══ */}
      <div className="shrink-0 border-t border-[#f1f5f9] p-3.5 sm:border-t-0 sm:p-0 sm:pt-0.5">
        <button
          onClick={onAjukan}
          className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-[#1a4e8f] px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-[#2d63a8] hover:shadow-md sm:w-auto"
        >
          <IconPlus />
          Ajukan Telaah
          <IconArrowRight />
        </button>
      </div>
    </div>
  );
};

/* ==================== Kartu: Dalam Proses ==================== */

const KartuDalamProses: React.FC<{
  nomorRegistrasi: string;
  nomorPengajuan: string;
  namaOPD: string;
  namaPenanggungJawab: string;
  totalNilaiPiutang?: string;
  tahapSaatIni: TelaahTahap;
  diajukanPada: string;
  onLihat: () => void;
}> = ({
  nomorRegistrasi,
  nomorPengajuan,
  namaOPD,
  namaPenanggungJawab,
  totalNilaiPiutang,
  tahapSaatIni,
  diajukanPada,
  onLihat,
}) => {
  const identitas = nomorRegistrasi || nomorPengajuan;
  const pemegang = labelPemegangTahap(tahapSaatIni);
  const durasi = formatDurasi(diajukanPada);

  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-[#fde68a] bg-white pl-3.5 transition-all duration-150 hover:border-[#f59e0b]/50 hover:shadow-md sm:flex-row sm:items-start sm:gap-4 sm:p-3">
      {/* Accent bar kiri */}
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#f59e0b]" />

      {/* ═══ Kolom 1: Icon (align top) ═══ */}
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#fffbeb] text-[#b45309] sm:flex">
        <IconHourglass />
      </div>

      {/* ═══ Kolom 2: Nomor + OPD + PJ (align top) ═══ */}
      <div className="min-w-0 shrink-0 p-3.5 sm:max-w-60 sm:p-0">
        <div className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
          {identitas}
        </div>
        <div className="mt-1 truncate text-[13px] leading-tight font-bold text-[#1a1a2e]">
          {namaOPD}
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-[#7a8899]">
          {namaPenanggungJawab}
        </div>
      </div>

      {/* ═══ Kolom 3: Badge + Progress + Date/Duration (align top) ═══ */}
      <div className="-mt-1 min-w-0 flex-1 border-t border-[#f1f5f9] p-3.5 sm:border-t-0 sm:p-0">
        <span className="inline-block rounded-sm border border-[#fde68a] bg-[#fffbeb] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#b45309] uppercase">
          Dalam Proses
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <ProgressTelaah tahap={tahapSaatIni} />
          {pemegang && (
            <span className="inline-flex items-center gap-1 text-[10.5px] text-[#7a8899]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f59e0b]" />
              di <span className="font-bold text-[#b45309]">{pemegang}</span>
            </span>
          )}
        </div>
        {/* Date-time kiri · Duration kanan — sejajar satu baris */}
        <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-[#7a8899]">
          <span className="inline-flex items-center gap-1">
            <IconClock />
            {formatTanggalWaktu(diajukanPada)}
          </span>
          <span>
            Durasi{" "}
            <span className="font-semibold text-[#b45309]">{durasi}</span>
          </span>
        </div>
      </div>

      {/* ═══ Kolom 4: Nominal (align top, right) ═══ */}
      <div className="shrink-0 border-t border-[#f1f5f9] p-3.5 sm:min-w-32.5 sm:border-t-0 sm:p-0 sm:text-right">
        <div className="text-[10px] font-bold tracking-wider text-[#7a8899] uppercase sm:text-right">
          Nilai Piutang
        </div>
        <div className="mt-0.5 text-[13px] leading-tight font-bold text-[#1a4e8f]">
          {totalNilaiPiutang ? formatRupiah(totalNilaiPiutang) : "—"}
        </div>
      </div>

      {/* ═══ Kolom 5: Tombol (align top) ═══ */}
      <div className="shrink-0 border-t border-[#f1f5f9] p-3.5 sm:border-t-0 sm:p-0">
        <button
          onClick={onLihat}
          className="flex w-full items-center justify-center rounded-sm border border-[#fde68a] bg-white px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap text-[#b45309] transition hover:border-[#f59e0b] hover:bg-[#fffbeb] sm:w-auto"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
};

/* ==================== Kartu: Selesai ==================== */

const KartuSelesai: React.FC<{
  nomorRegistrasi: string;
  nomorPengajuan: string;
  namaOPD: string;
  namaPenanggungJawab: string;
  totalNilaiPiutang?: string;
  diajukanPada: string;
  selesaiPada: string | null;
  riwayatCount: number;
  onLihat: () => void;
}> = ({
  nomorRegistrasi,
  nomorPengajuan,
  namaOPD,
  namaPenanggungJawab,
  totalNilaiPiutang,
  diajukanPada,
  selesaiPada,
  riwayatCount,
  onLihat,
}) => {
  const identitas = nomorRegistrasi || nomorPengajuan;
  const durasi = selesaiPada ? formatDurasi(diajukanPada, selesaiPada) : "—";

  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-[#a7f3d0] bg-white pl-3.5 transition-all duration-150 hover:border-[#0f9b6e]/40 hover:shadow-md sm:flex-row sm:items-start sm:gap-4 sm:p-3">
      {/* Accent bar kiri */}
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#0f9b6e]" />

      {/* ═══ Kolom 1: Icon (align top) ═══ */}
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#ecfdf5] text-[#0f6e56] sm:flex">
        <IconCheckBig />
      </div>

      {/* ═══ Kolom 2: Nomor + OPD + PJ ═══ */}
      <div className="min-w-0 shrink-0 p-3.5 sm:max-w-60 sm:p-0 sm:pt-0.5">
        <div className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
          {identitas}
        </div>
        <div className="mt-1 truncate text-[13px] leading-tight font-bold text-[#1a1a2e]">
          {namaOPD}
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-[#7a8899]">
          {namaPenanggungJawab}
        </div>
      </div>

      {/* ═══ Kolom 3: Badge + Meta inline ═══ */}
      <div className="min-w-0 flex-1 border-t border-[#f1f5f9] p-3.5 sm:border-t-0 sm:p-0 sm:pt-0.5">
        <span className="inline-flex items-center gap-1 rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#065f46] uppercase">
          <IconCheck /> Selesai
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-[#7a8899]">
          <span className="inline-flex items-center gap-1">
            <IconClock />
            Selesai{" "}
            <span className="font-semibold text-[#0f6e56]">
              {selesaiPada ? formatTanggalWaktu(selesaiPada) : "—"}
            </span>
          </span>
          <span className="text-[#d0d7de]">·</span>
          <span>
            Durasi{" "}
            <span className="font-semibold text-[#0f6e56]">{durasi}</span>
          </span>
          <span className="text-[#d0d7de]">·</span>
          <span>{riwayatCount} langkah</span>
        </div>
      </div>

      {/* ═══ Kolom 4: Nominal ═══ */}
      <div className="shrink-0 border-t border-[#f1f5f9] p-3.5 sm:min-w-32.5 sm:border-t-0 sm:p-0 sm:pt-0.5 sm:text-right">
        <div className="text-[10px] font-bold tracking-wider text-[#7a8899] uppercase sm:text-right">
          Nilai Piutang
        </div>
        <div className="mt-0.5 text-[13px] leading-tight font-bold text-[#1a4e8f]">
          {totalNilaiPiutang ? formatRupiah(totalNilaiPiutang) : "—"}
        </div>
      </div>

      {/* ═══ Kolom 5: Tombol ═══ */}
      <div className="shrink-0 border-t border-[#f1f5f9] p-3.5 sm:border-t-0 sm:p-0 sm:pt-0.5">
        <button
          onClick={onLihat}
          className="flex w-full items-center justify-center rounded-sm border border-[#a7f3d0] bg-white px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap text-[#0f6e56] transition hover:bg-[#ecfdf5] sm:w-auto"
        >
          Lihat Detail
        </button>
      </div>
    </div>
  );
};

/* ==================== Empty state ==================== */

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-[#e2e8f2] bg-white p-[56px_24px] text-[#7a8899]">
    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-[#f0f4fb] text-[#1a4e8f] opacity-60">
      {icon}
    </div>
    <div className="text-center">
      <div className="text-sm font-semibold text-[#8a96a3]">{title}</div>
      <div className="mt-1 text-xs text-[#b0bac5]">{subtitle}</div>
    </div>
  </div>
);

/* ==================== Komponen utama ==================== */

export default function TelaahInternalAdmin() {
  const { user } = useAuth();
  const { data: semuaPengajuan, getPengajuanById } = usePengajuanStore();
  const { data: semuaTelaah, ajukanTelaah } = useTelaahInternalStore();

  const [tab, setTab] = useState<TabKey>("belum");
  const [search, setSearch] = useState("");
  const [filterOPD, setFilterOPD] = useState<string>("");
  const [selectedTelaahId, setSelectedTelaahId] = useState<string | null>(null);
  const [pendingAjukan, setPendingAjukan] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const daftarOPD = useMemo(() => {
    const set = new Set<string>();
    semuaPengajuan.forEach((p) => {
      if (p.namaOPD) set.add(p.namaOPD);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [semuaPengajuan]);

  const daftarBelum = useMemo(() => {
    const telaahIds = new Set(semuaTelaah.map((t) => t.pengajuanId));
    return semuaPengajuan
      .filter((p) => p.status === "teregistrasi" && !telaahIds.has(p.id))
      .sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
  }, [semuaPengajuan, semuaTelaah]);

  const daftarProses = useMemo(
    () =>
      semuaTelaah
        .filter((t) => !t.selesai)
        .sort(
          (a, b) =>
            new Date(a.diajukanPada).getTime() -
            new Date(b.diajukanPada).getTime(),
        ),
    [semuaTelaah],
  );

  const daftarSelesai = useMemo(
    () =>
      semuaTelaah
        .filter((t) => t.selesai)
        .sort(
          (a, b) =>
            new Date(b.selesaiPada ?? b.diajukanPada).getTime() -
            new Date(a.selesaiPada ?? a.diajukanPada).getTime(),
        ),
    [semuaTelaah],
  );

  const matchFilter = <
    T extends {
      namaOPD: string;
      nomorRegistrasi: string | null;
      nomorPengajuan: string;
      namaPenanggungJawab: string;
    },
  >(
    item: T,
  ): boolean => {
    if (filterOPD && item.namaOPD !== filterOPD) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (item.nomorRegistrasi ?? "").toLowerCase().includes(q) ||
        item.nomorPengajuan.toLowerCase().includes(q) ||
        item.namaOPD.toLowerCase().includes(q) ||
        item.namaPenanggungJawab.toLowerCase().includes(q)
      );
    }
    return true;
  };

  const belumFiltered = useMemo(
    () => daftarBelum.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarBelum, search, filterOPD],
  );
  const prosesFiltered = useMemo(
    () => daftarProses.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarProses, search, filterOPD],
  );
  const selesaiFiltered = useMemo(
    () => daftarSelesai.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarSelesai, search, filterOPD],
  );

  const stats = useMemo(() => {
    const belum = filterOPD
      ? daftarBelum.filter((p) => p.namaOPD === filterOPD).length
      : daftarBelum.length;
    const proses = filterOPD
      ? daftarProses.filter((t) => t.namaOPD === filterOPD).length
      : daftarProses.length;
    const selesai = filterOPD
      ? daftarSelesai.filter((t) => t.namaOPD === filterOPD).length
      : daftarSelesai.length;
    return { belum, proses, selesai, total: belum + proses + selesai };
  }, [daftarBelum, daftarProses, daftarSelesai, filterOPD]);

  const isFilterAktif = Boolean(search.trim() || filterOPD);

  const resetFilter = () => {
    setSearch("");
    setFilterOPD("");
  };

  const handleKonfirmasiAjukan = async () => {
    if (!pendingAjukan || !user?.username) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await ajukanTelaah(
        {
          id: pendingAjukan.id,
          nomorPengajuan: pendingAjukan.nomorPengajuan,
          nomorRegistrasi: pendingAjukan.nomorRegistrasi ?? null,
          namaOPD: pendingAjukan.namaOPD,
          namaPenanggungJawab: pendingAjukan.namaPenanggungJawab,
        },
        user.username,
      );
      setPendingAjukan(null);
      setTab("proses");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengajukan telaah.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedTelaahId) {
    return (
      <DetailTelaah
        telaahId={selectedTelaahId}
        onBack={() => setSelectedTelaahId(null)}
        mode="admin"
      />
    );
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "belum", label: "Belum Diajukan", count: stats.belum },
    { key: "proses", label: "Dalam Proses", count: stats.proses },
    { key: "selesai", label: "Selesai", count: stats.selesai },
  ];

  return (
    <div className="mx-auto w-full max-w-400">
      {pendingAjukan && (
        <ModalKonfirmasiAjukan
          nomorRegistrasi={pendingAjukan.nomorRegistrasi ?? ""}
          nomorPengajuan={pendingAjukan.nomorPengajuan}
          namaOPD={pendingAjukan.namaOPD}
          onConfirm={handleKonfirmasiAjukan}
          onClose={() => {
            if (!isSubmitting) {
              setPendingAjukan(null);
              setErrorMsg(null);
            }
          }}
          isSubmitting={isSubmitting}
          errorMessage={errorMsg}
        />
      )}

      {/* STAT CARDS */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<IconInbox />}
          label="Belum Diajukan"
          value={stats.belum}
          sublabel="Perlu tindakan"
          accentClass="bg-[#1a4e8f]"
          bgClass="bg-[#eef4fc]"
          borderClass="border-[#d0e0f5]"
        />
        <StatCard
          icon={<IconHourglass />}
          label="Dalam Proses"
          value={stats.proses}
          sublabel="Sedang ditelaah"
          accentClass="bg-[#f59e0b]"
          bgClass="bg-[#fffbeb]"
          borderClass="border-[#fde68a]"
        />
        <StatCard
          icon={<IconCheckBig />}
          label="Selesai"
          value={stats.selesai}
          sublabel="Final"
          accentClass="bg-[#0f9b6e]"
          bgClass="bg-[#e6f7f2]"
          borderClass="border-[#a7e8d4]"
        />
        <StatCard
          icon={<IconLayers />}
          label="Total Telaah"
          value={stats.total}
          sublabel="Seluruh siklus"
          accentClass="bg-[#5a6474]"
          bgClass="bg-[#f7f8fa]"
          borderClass="border-[#e2e8f2]"
        />
      </div>

      {/* TAB BAR */}
      <div className="mb-3.5 flex flex-wrap gap-1.5 border-b border-[#e2e8f2]">
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition ${
                isActive
                  ? "border-[#1a4e8f] text-[#1a4e8f]"
                  : "border-transparent text-[#7a8899] hover:text-[#1a1a2e]"
              }`}
            >
              {t.label}
              <span
                className={`rounded-sm px-1.5 py-px text-[10.5px] font-bold ${
                  isActive
                    ? "bg-[#eff6ff] text-[#1a4e8f]"
                    : "bg-[#f0f4fb] text-[#7a8899]"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* FILTER BAR */}
      <div className="mb-3.5 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[10px_14px] lg:flex-row lg:items-center">
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.5 lg:min-w-40 lg:flex-1">
          <span className="shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari nomor registrasi, nomor pengajuan, atau nama OPD…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-w-0 border-none bg-transparent text-[13px] text-[#1a1a2e] outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="flex shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#7a8899]"
            >
              <IconClose />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1.5">
          <span className="shrink-0 text-[#7a8899]">
            <IconFilter />
          </span>
          <select
            value={filterOPD}
            onChange={(e) => setFilterOPD(e.target.value)}
            className="cursor-pointer border-none bg-transparent text-[13px] text-[#1a1a2e] outline-none"
          >
            <option value="">Semua OPD</option>
            {daftarOPD.map((opd) => (
              <option key={opd} value={opd}>
                {opd}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={resetFilter}
          disabled={!isFilterAktif}
          className="shrink-0 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#7a8899] transition enabled:hover:border-[#a0bdec] enabled:hover:bg-[#e8f0fb] enabled:hover:text-[#1a4e8f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>

        <div className="shrink-0 text-xs text-[#7a8899]">
          {tab === "belum" && `${belumFiltered.length} pengajuan`}
          {tab === "proses" && `${prosesFiltered.length} dalam proses`}
          {tab === "selesai" && `${selesaiFiltered.length} selesai`}
        </div>
      </div>

      {/* KONTEN PER TAB */}
      {tab === "belum" && (
        <>
          {belumFiltered.length === 0 ? (
            <EmptyState
              icon={<IconCheckBig />}
              title={
                daftarBelum.length === 0
                  ? "Tidak ada pengajuan yang perlu diajukan"
                  : "Tidak ada yang cocok"
              }
              subtitle={
                daftarBelum.length === 0
                  ? "Semua pengajuan teregistrasi sudah masuk telaah, atau belum ada yang lolos verifikasi."
                  : "Coba ubah kata kunci pencarian atau filter OPD."
              }
            />
          ) : (
            <div className="space-y-2">
              {belumFiltered.map((p) => (
                <KartuBelumDiajukan
                  key={p.id}
                  pengajuan={p}
                  onAjukan={() => {
                    setPendingAjukan(p);
                    setErrorMsg(null);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "proses" && (
        <>
          {prosesFiltered.length === 0 ? (
            <EmptyState
              icon={<IconHourglass />}
              title={
                daftarProses.length === 0
                  ? "Tidak ada telaah dalam proses"
                  : "Tidak ada yang cocok"
              }
              subtitle={
                daftarProses.length === 0
                  ? "Semua telaah sudah selesai, atau belum ada yang diajukan."
                  : "Coba ubah kata kunci pencarian atau filter OPD."
              }
            />
          ) : (
            <div className="space-y-2">
              {prosesFiltered.map((t) => {
                const pengajuan = getPengajuanById(t.pengajuanId);
                return (
                  <KartuDalamProses
                    key={t.id}
                    nomorRegistrasi={t.nomorRegistrasi}
                    nomorPengajuan={t.nomorPengajuan}
                    namaOPD={t.namaOPD}
                    namaPenanggungJawab={t.namaPenanggungJawab}
                    totalNilaiPiutang={pengajuan?.totalNilaiPiutang}
                    tahapSaatIni={t.tahapSaatIni}
                    diajukanPada={t.diajukanPada}
                    onLihat={() => setSelectedTelaahId(t.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "selesai" && (
        <>
          {selesaiFiltered.length === 0 ? (
            <EmptyState
              icon={<IconArchive />}
              title={
                daftarSelesai.length === 0
                  ? "Belum ada telaah yang selesai"
                  : "Tidak ada yang cocok"
              }
              subtitle={
                daftarSelesai.length === 0
                  ? "Setelah Sekban approve, telaah akan muncul di sini."
                  : "Coba ubah kata kunci pencarian atau filter OPD."
              }
            />
          ) : (
            <div className="space-y-2">
              {selesaiFiltered.map((t) => {
                const pengajuan = getPengajuanById(t.pengajuanId);
                return (
                  <KartuSelesai
                    key={t.id}
                    nomorRegistrasi={t.nomorRegistrasi}
                    nomorPengajuan={t.nomorPengajuan}
                    namaOPD={t.namaOPD}
                    namaPenanggungJawab={t.namaPenanggungJawab}
                    totalNilaiPiutang={pengajuan?.totalNilaiPiutang}
                    diajukanPada={t.diajukanPada}
                    selesaiPada={t.selesaiPada}
                    riwayatCount={t.riwayat.length}
                    onLihat={() => setSelectedTelaahId(t.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
