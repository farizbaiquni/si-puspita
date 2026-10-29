"use client";

/* ------------------------------------------------------------------ */
/*  ReviuInspektoratAdmin.tsx                                          */
/*  Menu "Reviu Inspektorat" untuk admin BPKAD.                        */
/*                                                                      */
/*  2 tab:                                                             */
/*   - "Siap Direviu"   → pengajuan yang telaah internal = SELESAI      */
/*                        & reviuInspektoratStatus belum di-set.        */
/*   - "Sudah Direviu"  → pengajuan yang reviuInspektoratStatus =        */
/*                        "MENUNGGU_REVIU".                             */
/*                                                                      */
/*  Alur halaman (state internal, tanpa route baru):                   */
/*   1. Daftar  → klik kartu pengajuan                                 */
/*   2. Detail  → info pengajuan + dokumen + tombol                    */
/*                "Cetak Berita Acara" & "Ajukan Reviu Inspektorat"    */
/*                (tombol ajukan terkunci sampai BA tersimpan)          */
/*   3. BA      → form + pratinjau Berita Acara (PembuatanBeritaAcara) */
/*                                                                      */
/*  Data BA diambil dari database (pengajuan) dan disimpan ke koleksi   */
/*  terpisah `beritaAcara/{pengajuanId}` — dokumen pengajuan & telaah   */
/*  internal tidak pernah diubah oleh modul ini.                        */
/* ------------------------------------------------------------------ */

import { useMemo, useRef, useState } from "react";
import {
  STATUS_FORMULIR_LABEL,
  type FormulirPenghapusanPiutangOPDRecord,
  type UploadedFileRef,
} from "@/types/types";
import type { TelaahInternalRecord } from "@/types/telaah-internal";
import type {
  ReviuInspektoratRecord,
  SuratPengantarInspektoratRecord,
} from "@/types/reviu-inspektorat";
import { useAuth } from "@/store/auth-store";
import {
  BeritaAcaraProvider,
  useBeritaAcaraStore,
} from "@/store/berita-acara-store";
import {
  ReviuInspektoratProvider,
  useReviuInspektoratStore,
} from "@/store/reviu-inspektorat-store";
import {
  SuratPengantarInspektoratProvider,
  useSuratPengantarInspektoratStore,
} from "@/store/surat-pengantar-inspektorat-store";
import { usePengajuanStore } from "@/store/pengajuan-store";
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import { uploadDokumenKeCloudinary } from "@/lib/cloudinary";
import {
  ajukanReviuInspektorat,
  hapusSuratPengantarInspektorat,
  simpanBeritaAcaraData,
  simpanSuratPengantarInspektorat,
} from "@/lib/reviu-inspektorat";
import {
  DokumenItem,
  ModalPreviewPDF,
  formatRupiah,
  formatTanggal,
  formatTanggalWaktu,
  labelJenisPiutang,
  type DokumenEntry,
} from "../telaah/TelaahDokumenShared";
import ModalKonfirmasiAjukanReviu from "./ModalKonfirmasiAjukanReviu";
import PembuatanBeritaAcara from "./berita-acara/PembuatanBeritaAcara";
import {
  ambilFileRef,
  bangunBeritaAcara,
} from "./berita-acara/buildBeritaAcara";
import type { BeritaAcaraData, BeritaAcaraRecord } from "./berita-acara/types";
import {
  formatUkuranFile,
  validasiFileSuratPengantar,
} from "./suratPengantarUtils";

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

const IconCheckBig = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
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

const IconShield = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M10 1.5L3.5 4v6c0 4.5 2.75 7.5 6.5 8.5 3.75-1 6.5-4 6.5-8.5V4L10 1.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconBuilding = () => (
  <svg
    width="22"
    height="22"
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

const IconArrowRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrowLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M10 3L4 8l6 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSparkles = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M10 3v3M10 14v3M3 10h3M14 10h3M5.2 5.2l2.1 2.1M12.7 12.7l2.1 2.1M5.2 14.8l2.1-2.1M12.7 7.3l2.1-2.1"
      strokeLinecap="round"
    />
  </svg>
);

const IconDoc = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M12 2H6.5A1.5 1.5 0 0 0 5 3.5v13A1.5 1.5 0 0 0 6.5 18h7a1.5 1.5 0 0 0 1.5-1.5V6l-4-4Z"
      strokeLinejoin="round"
    />
    <path d="M12 2v4h4" strokeLinejoin="round" />
  </svg>
);

const IconAlert = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5v4M8 11.2v.1" strokeLinecap="round" />
  </svg>
);

/* ==================== Tipe ==================== */

type TabKey = "siap" | "sudah";

/** Halaman internal di dalam menu Reviu Inspektorat. */
type Halaman = "list" | "detail" | "ba";

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
    className={`flex min-w-0 items-center gap-3 rounded-sm border px-4 py-3.5 ${bgClass} ${borderClass}`}
  >
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-white ${accentClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[22px] leading-none font-bold text-[#1a1a2e]">
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

/* ==================== Kartu: Siap Direviu ==================== */

const KartuSiapDireviu: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  /** True kalau BA pengajuan ini sudah pernah disimpan ke database. */
  adaBA: boolean;
  /** True kalau surat pengantar sudah diunggah sebagai draft. */
  adaSuratPengantar: boolean;
  onBuka: () => void;
}> = ({ pengajuan, adaBA, adaSuratPengantar, onBuka }) => {
  const identitas = pengajuan.nomorRegistrasi || pengajuan.nomorPengajuan;
  return (
    <div
      role="button"
      tabIndex={0}
      title="Klik untuk membuka detail pengajuan"
      onClick={onBuka}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBuka();
        }
      }}
      className="group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-sm border border-[#ddd0fb] bg-white transition-all duration-150 hover:border-[#7c3aed]/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/40 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
    >
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#7c3aed]" />
      <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#f3efff] text-[#7c3aed] sm:flex">
        <IconBuilding />
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
            {identitas}
          </span>
          <span className="rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#065f46] uppercase">
            ✓ Telaah Selesai
          </span>
          {adaBA ? (
            <span className="rounded-sm border border-[#bae6fd] bg-[#f0f9ff] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#075985] uppercase">
              ✓ BA Tersimpan
            </span>
          ) : (
            <span className="rounded-sm border border-[#fde68a] bg-[#fffbeb] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#92400e] uppercase">
              BA Belum Dibuat
            </span>
          )}
          {adaSuratPengantar ? (
            <span className="rounded-sm border border-[#ddd0fb] bg-[#f3efff] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#5b21b6] uppercase">
              ✓ Surat Pengantar
            </span>
          ) : (
            <span className="rounded-sm border border-[#fde68a] bg-[#fffbeb] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#92400e] uppercase">
              Surat Belum Ada
            </span>
          )}
        </div>
        <div className="mt-1.5 truncate text-[15px] leading-tight font-bold text-[#1a1a2e]">
          {pengajuan.namaOPD}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#7a8899]">
          <span className="truncate">{pengajuan.namaPenanggungJawab}</span>
          <span className="font-bold text-[#1a4e8f]">
            {formatRupiah(pengajuan.totalNilaiPiutang)}
          </span>
        </div>
      </div>
      <div className="shrink-0 border-t border-[#f1f5f9] p-4 sm:border-t-0 sm:p-0">
        <div className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-[#e2e8f2] bg-[#f9fafc] px-4 py-2.5 text-[12.5px] font-semibold text-[#5a6474] transition group-hover:border-[#a0bdec] group-hover:bg-[#e8f0fb] group-hover:text-[#1a4e8f] sm:w-auto">
          Lihat Detail
          <IconArrowRight />
        </div>
      </div>
    </div>
  );
};

/* ==================== Kartu: Sudah Direviu ==================== */

const KartuSudahDireviu: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  reviu: ReviuInspektoratRecord | null;
  onPreviewDokumen: (namaFile: string, url: string) => void;
}> = ({ pengajuan, reviu, onPreviewDokumen }) => {
  const identitas = pengajuan.nomorRegistrasi || pengajuan.nomorPengajuan;
  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-[#c4b5fd] bg-white transition-all duration-150 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#7c3aed]" />
      <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#f3efff] text-[#7c3aed] sm:flex">
        <IconShield />
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
            {identitas}
          </span>
          <span className="inline-flex items-center gap-1 rounded-sm border border-[#ddd0fb] bg-[#f3efff] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#5b21b6] uppercase">
            Menunggu Reviu Inspektorat
          </span>
        </div>
        <div className="mt-1.5 truncate text-[15px] leading-tight font-bold text-[#1a1a2e]">
          {pengajuan.namaOPD}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#7a8899]">
          <span className="truncate">{pengajuan.namaPenanggungJawab}</span>
          <span className="font-bold text-[#1a4e8f]">
            {formatRupiah(pengajuan.totalNilaiPiutang)}
          </span>
        </div>
      </div>
      {reviu?.suratPengantar && (
        <div className="shrink-0 px-4 pb-4 sm:px-0 sm:pr-4 sm:pb-0">
          <button
            type="button"
            onClick={() =>
              onPreviewDokumen(
                reviu.suratPengantar.namaFile || "Surat Pengantar",
                reviu.suratPengantar.url,
              )
            }
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-[#a0bdec] bg-[#e8f0fb] px-3 py-2 text-[12px] font-semibold text-[#1a4e8f] transition hover:bg-[#d9e7fa] sm:w-auto"
          >
            <IconDoc />
            Lihat Surat Pengantar
          </button>
        </div>
      )}
    </div>
  );
};

/* ==================== Empty ==================== */

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-[#e2e8f2] bg-white p-[56px_24px] text-[#7a8899]">
    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-[#f3efff] text-[#7c3aed] opacity-60">
      {icon}
    </div>
    <div className="text-center">
      <div className="text-sm font-semibold text-[#8a96a3]">{title}</div>
      <div className="mt-1 text-xs text-[#b0bac5]">{subtitle}</div>
    </div>
  </div>
);

/* ==================== Detail pengajuan ==================== */

/** Daftar dokumen pengajuan yang ditampilkan di halaman detail. */
const DOKUMEN_PENGAJUAN: {
  key: keyof FormulirPenghapusanPiutangOPDRecord;
  label: string;
}[] = [
  { key: "fileSurat", label: "Formulir Permohonan OPD" },
  { key: "suratPengantarUsulan", label: "Surat Pengantar Usulan" },
  { key: "daftarNominatifPiutang", label: "Daftar Nominatif Piutang" },
  { key: "rekapitulasiSaldoPiutang", label: "Rekapitulasi Saldo Piutang" },
  {
    key: "neracaAwalPencatatanPiutang",
    label: "Neraca Awal Pencatatan Piutang",
  },
  {
    key: "dokumenPendukungSuratTidakMampuBayar",
    label: "Surat Pernyataan Tidak Mampu Bayar",
  },
  { key: "rekapitulasiAngsuran", label: "Rekapitulasi Angsuran" },
  {
    key: "persyaratanPiutangMacet",
    label: "SKRD / SK / Surat Perjanjian (Piutang Macet)",
  },
  {
    key: "persyaratanUsiaPencatatan",
    label: "Neraca Awal Usia Pencatatan Piutang",
  },
  {
    key: "buktiTidakMampuKartuKeluargaMiskin",
    label: "Bukti Tidak Mampu — Kartu Keluarga Miskin",
  },
  {
    key: "buktiTidakMampuPutusanPailit",
    label: "Bukti Tidak Mampu — Putusan Pailit",
  },
  {
    key: "buktiTidakMampuSuratKeteranganKelurahan",
    label: "Bukti Tidak Mampu — Surat Keterangan Kelurahan",
  },
  {
    key: "buktiTidakMampuBantuanSosial",
    label: "Bukti Tidak Mampu — Bantuan Sosial",
  },
  {
    key: "buktiTidakMampuKunjunganPenagihan",
    label: "Bukti Tidak Mampu — Kunjungan Penagihan",
  },
  { key: "riwayatPenagihan1", label: "Bukti Riwayat Penagihan Ke-1" },
  { key: "riwayatPenagihan2", label: "Bukti Riwayat Penagihan Ke-2" },
  { key: "riwayatPenagihan3", label: "Bukti Riwayat Penagihan Ke-3" },
  { key: "filePernyataanOPD", label: "Surat Pernyataan OPD" },
  {
    key: "buktiKerjaSamaPihakKetiga",
    label: "Bukti Kerja Sama Pihak Ketiga",
  },
  { key: "buktiUpayaOptimal", label: "Bukti Upaya Optimal" },
  { key: "dokumenDasarPiutang", label: "Dokumen Dasar Piutang" },
];

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="rounded-sm border border-[#e2e8f2] bg-white p-4 shadow-sm">
    <p className="mb-2.5 text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
      {title}
    </p>
    {children}
  </section>
);

const InfoRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
}> = ({ label, value, mono, strong }) => (
  <div className="flex items-start justify-between gap-3 border-b border-[#f4f6f9] py-2 last:border-b-0">
    <span className="shrink-0 text-[11.5px] text-[#7a8899]">{label}</span>
    <span
      className={`min-w-0 text-right text-[12px] font-semibold break-words ${
        mono ? "font-mono" : ""
      } ${strong ? "text-[#1a4e8f]" : "text-[#1a1a2e]"}`}
    >
      {value || "-"}
    </span>
  </div>
);

const DetailPengajuan: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  telaah?: TelaahInternalRecord | null;
  ba: BeritaAcaraRecord | null;
  suratPengantar: SuratPengantarInspektoratRecord | null;
  onBack: () => void;
  onBukaBA: () => void;
  onUploadSuratPengantar: (file: File) => Promise<void>;
  onHapusSuratPengantar: () => Promise<void>;
  isUploadingSurat: boolean;
  errorSurat: string | null;
  onAjukan: () => void;
  onPreviewDokumen: (namaFile: string, url: string) => void;
}> = ({
  pengajuan,
  telaah,
  ba,
  suratPengantar,
  onBack,
  onBukaBA,
  onUploadSuratPengantar,
  onHapusSuratPengantar,
  isUploadingSurat,
  errorSurat,
  onAjukan,
  onPreviewDokumen,
}) => {
  const identitas = pengajuan.nomorRegistrasi || pengajuan.nomorPengajuan;
  /** BA & surat pengantar wajib ada sebelum pengajuan boleh diajukan reviu. */
  const baSudahDibuat = Boolean(ba);
  const suratSudahAda = Boolean(suratPengantar);
  const bisaAjukan =
    baSudahDibuat && suratSudahAda && !isUploadingSurat;

  const inputSuratRef = useRef<HTMLInputElement | null>(null);
  const [errorFileSurat, setErrorFileSurat] = useState<string | null>(null);

  const pilihFileSurat = () => {
    if (!isUploadingSurat) inputSuratRef.current?.click();
  };

  const prosesFileSurat = async (file: File | null) => {
    if (!file) return;
    const err = validasiFileSuratPengantar(file);
    setErrorFileSurat(err);
    if (err) return;
    await onUploadSuratPengantar(file);
  };

  const hapusSurat = async () => {
    setErrorFileSurat(null);
    await onHapusSuratPengantar();
  };

  const dokumenTerunggah: DokumenEntry[] = DOKUMEN_PENGAJUAN.map(
    ({ key, label }) => ({
      key,
      label,
      file: ambilFileRef(pengajuan, key),
    }),
  ).filter((d) => d.file !== null) as DokumenEntry[];

  const bukaPreview = (ref: UploadedFileRef) =>
    onPreviewDokumen(ref.namaFile, ref.url);

  return (
    <div>
      {/* Header: tombol kembali */}
      <button
        onClick={onBack}
        className="group inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[#e2e8f2] bg-white py-1.5 pr-3.5 pl-1.5 text-[12.5px] font-semibold text-[#5a6474] shadow-xs transition-all hover:-translate-x-0.5 hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-[#f0f4fb] text-[#1a4e8f] transition-colors group-hover:bg-[#1a4e8f] group-hover:text-white">
          <IconArrowLeft />
        </span>
        Kembali ke Daftar
      </button>

      {/* Judul + badge status */}
      <div className="mt-4 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] leading-snug font-bold text-[#1a1a2e]">
            {pengajuan.namaOPD}
          </h2>
          <p className="mt-0.5 font-mono text-[12px] font-bold tracking-tight text-[#1a4e8f]">
            {identitas}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-1 text-[10.5px] font-bold tracking-wide text-[#065f46] uppercase">
            ✓ Telaah Selesai
          </span>
          {ba && (
            <span className="rounded-sm border border-[#bae6fd] bg-[#f0f9ff] px-2 py-1 text-[10.5px] font-bold tracking-wide text-[#075985] uppercase">
              ✓ BA Tersimpan
            </span>
          )}
          {suratPengantar && (
            <span className="rounded-sm border border-[#ddd0fb] bg-[#f3efff] px-2 py-1 text-[10.5px] font-bold tracking-wide text-[#5b21b6] uppercase">
              ✓ Surat Pengantar
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Kolom kiri (2/3): identitas + dokumen ── */}
        <div className="space-y-4 lg:col-span-2">
          <Card title="Identitas Pengajuan">
            <InfoRow label="Nomor Pengajuan" value={pengajuan.nomorPengajuan} mono />
            <InfoRow
              label="Nomor Registrasi"
              value={pengajuan.nomorRegistrasi || "-"}
              mono
            />
            <InfoRow label="Perangkat Daerah" value={pengajuan.namaOPD} />
            <InfoRow
              label="Penanggung Jawab"
              value={`${pengajuan.namaPenanggungJawab}${
                pengajuan.jabatan ? ` — ${pengajuan.jabatan}` : ""
              }`}
            />
            <InfoRow
              label="Nomor & Tanggal Surat"
              value={`${pengajuan.nomorSurat || "-"} · ${formatTanggal(
                pengajuan.tanggalSurat,
              )}`}
            />
            <InfoRow
              label="Status Pengajuan"
              value={
                STATUS_FORMULIR_LABEL[pengajuan.status] ?? pengajuan.status
              }
            />
            <InfoRow
              label="Tanggal Registrasi"
              value={
                pengajuan.tanggalVerifikasi
                  ? formatTanggalWaktu(pengajuan.tanggalVerifikasi)
                  : "-"
              }
            />
          </Card>

          <Card title={`Dokumen Terunggah (${dokumenTerunggah.length})`}>
            {dokumenTerunggah.length === 0 ? (
              <p className="text-[12px] text-[#7a8899]">
                Belum ada dokumen yang terunggah.
              </p>
            ) : (
              <div className="space-y-2">
                {dokumenTerunggah.map((dok, i) => (
                  <DokumenItem
                    key={dok.key}
                    nomor={i + 1}
                    dok={dok}
                    onPreview={() => bukaPreview(dok.file!)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Kolom kanan (1/3): nilai, telaah, aksi ── */}
        <div className="space-y-4">
          <Card title="Nilai & Debitur">
            <InfoRow
              label="Jenis Piutang"
              value={
                pengajuan.jenisPiutang
                  ? labelJenisPiutang(pengajuan.jenisPiutang)
                  : "-"
              }
            />
            <InfoRow
              label="Jenis Penghapusan"
              value={pengajuan.jenisPenghapusan || "-"}
            />
            <InfoRow
              label="Jumlah Debitur"
              value={
                pengajuan.jumlahDebitur
                  ? `${pengajuan.jumlahDebitur} debitur`
                  : "-"
              }
            />
            <InfoRow
              label="Total Nilai Piutang"
              value={formatRupiah(pengajuan.totalNilaiPiutang)}
              strong
            />
            <InfoRow
              label="Rekap. Saldo Piutang"
              value={
                pengajuan.nilaiRekapitulasiSaldoPiutang
                  ? formatRupiah(pengajuan.nilaiRekapitulasiSaldoPiutang)
                  : "-"
              }
            />
            <InfoRow
              label="Rekap. Angsuran"
              value={
                pengajuan.nilaiRekapitulasiAngsuran
                  ? formatRupiah(pengajuan.nilaiRekapitulasiAngsuran)
                  : "-"
              }
            />
          </Card>

          <Card title="Telaah Internal">
            <InfoRow label="Status" value="✓ Selesai" />
            <InfoRow
              label="Selesai Pada"
              value={
                telaah?.selesaiPada
                  ? formatTanggalWaktu(telaah.selesaiPada)
                  : "-"
              }
            />
            <InfoRow label="Siklus Ke" value={String(telaah?.siklusKe ?? 1)} />
            <InfoRow
              label="Diajukan Telaah"
              value={
                telaah?.diajukanPada
                  ? formatTanggalWaktu(telaah.diajukanPada)
                  : "-"
              }
            />
          </Card>

          <Card title="Berita Acara">
            {ba ? (
              <>
                <p className="text-[12.5px] font-semibold text-[#0f9b6e]">
                  ✓ Berita Acara sudah dibuat
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[#7a8899]">
                  Terakhir diperbarui {formatTanggalWaktu(ba.diperbaruiPada)}
                  {ba.dibuatOleh ? ` oleh ${ba.dibuatOleh}` : ""}.
                </p>
                <button
                  onClick={onBukaBA}
                  className="mt-3 w-full cursor-pointer rounded-sm border border-[#a0bdec] bg-[#e8f0fb] px-4 py-2.5 text-[12.5px] font-semibold text-[#1a4e8f] transition hover:bg-[#d9e7fa]"
                >
                  Buka Berita Acara
                </button>
              </>
            ) : (
              <>
                <p className="text-[12px] leading-relaxed text-[#7a8899]">
                  Berita Acara belum dibuat. Isi dan simpan BA terlebih dahulu
                  sebelum pengajuan diajukan reviu.
                </p>
                <button
                  onClick={onBukaBA}
                  className="mt-3 w-full cursor-pointer rounded-sm bg-[#1a4e8f] px-4 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-[#2d63a8]"
                >
                  Cetak Berita Acara
                </button>
              </>
            )}
          </Card>

          <Card title="Surat Pengantar ke Inspektorat">
            {suratPengantar ? (
              <>
                <div className="flex items-center gap-3 rounded-sm border border-[#a7e8d4] bg-[#f0fdf9] px-3 py-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#e6f7f2] text-[#0f9b6e]">
                    <IconDoc />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[#1a1a2e]">
                      {suratPengantar.suratPengantar.namaFile}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7a8899]">
                      {formatUkuranFile(
                        suratPengantar.suratPengantar.ukuranBytes,
                      )}{" "}
                      · PDF
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewDokumen(
                        suratPengantar.suratPengantar.namaFile,
                        suratPengantar.suratPengantar.url,
                      )
                    }
                    disabled={isUploadingSurat}
                    className="flex-1 rounded-sm border border-[#a0bdec] bg-[#e8f0fb] px-2.5 py-2 text-[11.5px] font-semibold text-[#1a4e8f] transition hover:bg-[#d9e7fa] disabled:opacity-50"
                  >
                    Lihat
                  </button>
                  <button
                    type="button"
                    onClick={pilihFileSurat}
                    disabled={isUploadingSurat}
                    className="flex-1 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-2 text-[11.5px] font-semibold text-[#5a6474] transition hover:bg-[#f0f4fb] disabled:opacity-50"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={hapusSurat}
                    disabled={isUploadingSurat}
                    className="flex-1 rounded-sm border border-[#f3c9c9] bg-white px-2.5 py-2 text-[11.5px] font-semibold text-[#c0392b] transition hover:bg-[#fef2f2] disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </div>
                <p className="mt-2 text-[10.5px] leading-relaxed text-[#7a8899]">
                  Tersimpan {formatTanggalWaktu(suratPengantar.diperbaruiPada)}
                  {suratPengantar.diunggahOleh
                    ? ` oleh ${suratPengantar.diunggahOleh}`
                    : ""}
                  .
                </p>
              </>
            ) : (
              <>
                <p className="text-[12px] leading-relaxed text-[#7a8899]">
                  Surat Pengantar ke Inspektorat belum diunggah. Unggah file PDF
                  di sini — file akan langsung tersimpan.
                </p>
                <button
                  type="button"
                  onClick={pilihFileSurat}
                  disabled={isUploadingSurat}
                  className="mt-3 w-full cursor-pointer rounded-sm border border-dashed border-[#c9d4e2] bg-[#f9fafc] px-4 py-3 text-[12px] font-semibold text-[#1a4e8f] transition hover:border-[#7c3aed]/50 hover:bg-[#f7f3ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploadingSurat
                    ? "Mengunggah surat pengantar…"
                    : "Unggah Surat Pengantar (PDF)"}
                </button>
              </>
            )}

            <input
              ref={inputSuratRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void prosesFileSurat(file);
                // Reset supaya file yang sama tetap bisa dipilih ulang.
                e.target.value = "";
              }}
            />

            {isUploadingSurat && suratPengantar && (
              <p className="mt-2 text-[10.5px] font-medium text-[#1a4e8f]">
                Mengunggah surat pengantar…
              </p>
            )}

            {(errorFileSurat || errorSurat) && (
              <p className="mt-2 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] leading-relaxed text-[#c0392b]">
                {errorFileSurat || errorSurat}
              </p>
            )}

            <p className="mt-2 text-[10.5px] text-[#7a8899]">
              Format PDF · maksimal 10 MB.
            </p>
          </Card>

          <div className="rounded-sm border border-[#ddd0fb] bg-[#f3efff] p-4">
            {!baSudahDibuat && (
              <div className="mb-2.5 flex items-start gap-2 rounded-sm border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[11px] leading-relaxed text-[#92400e]">
                <span className="mt-0.5 shrink-0 text-[#b45309]">
                  <IconAlert />
                </span>
                <p>
                  <span className="font-bold">
                    Berita Acara wajib dibuat lebih dahulu.
                  </span>{" "}
                  Isi dan simpan BA lewat tombol{" "}
                  <span className="font-semibold">Cetak Berita Acara</span> di
                  atas sebelum mengajukan reviu.
                </p>
              </div>
            )}
            {!suratSudahAda && (
              <div className="mb-2.5 flex items-start gap-2 rounded-sm border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-[11px] leading-relaxed text-[#92400e]">
                <span className="mt-0.5 shrink-0 text-[#b45309]">
                  <IconAlert />
                </span>
                <p>
                  <span className="font-bold">
                    Surat Pengantar ke Inspektorat wajib diunggah.
                  </span>{" "}
                  Unggah file PDF lewat kartu{" "}
                  <span className="font-semibold">
                    Surat Pengantar ke Inspektorat
                  </span>{" "}
                  di atas.
                </p>
              </div>
            )}
            <button
              onClick={onAjukan}
              disabled={!bisaAjukan}
              title={
                !baSudahDibuat
                  ? "Buat dan simpan Berita Acara terlebih dahulu"
                  : !suratSudahAda
                    ? "Unggah Surat Pengantar ke Inspektorat terlebih dahulu"
                    : isUploadingSurat
                      ? "Tunggu proses surat pengantar selesai"
                      : undefined
              }
              className="w-full rounded-sm bg-[#7c3aed] px-4 py-2.5 text-[13px] font-semibold text-white transition enabled:cursor-pointer enabled:hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ajukan Reviu Inspektorat
            </button>
            {bisaAjukan ? (
              <p className="mt-2 text-[11px] leading-relaxed text-[#5b21b6]">
                Setelah diajukan, status berubah menjadi{" "}
                <span className="font-bold">Menunggu Reviu Inspektorat</span>{" "}
                dan OPD menerima notifikasi.
              </p>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-[#92400e]">
                Tombol aktif setelah Berita Acara tersimpan dan Surat Pengantar
                diunggah.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================== Komponen utama ==================== */

/**
 * Halaman admin Reviu Inspektorat.
 *
 * Provider dipasang lokal di sini (bukan global di layout) supaya
 * langganan real-time koleksi `beritaAcara` & `reviuInspektorat` hanya
 * aktif saat menu ini dibuka — halaman lain tidak ikut terdampak.
 */
export default function ReviuInspektoratAdmin() {
  return (
    <ReviuInspektoratProvider>
      <BeritaAcaraProvider>
        <SuratPengantarInspektoratProvider>
          <IsiReviuInspektorat />
        </SuratPengantarInspektoratProvider>
      </BeritaAcaraProvider>
    </ReviuInspektoratProvider>
  );
}

function IsiReviuInspektorat() {
  const { user } = useAuth();
  const { data: semuaPengajuan } = usePengajuanStore();
  const { data: semuaTelaah } = useTelaahInternalStore();
  const { data: semuaBA } = useBeritaAcaraStore();
  const { data: semuaReviu } = useReviuInspektoratStore();
  const { data: semuaSuratPengantar } = useSuratPengantarInspektoratStore();

  const [tab, setTab] = useState<TabKey>("siap");
  const [search, setSearch] = useState("");
  const [filterOPD, setFilterOPD] = useState<string>("");
  const [pendingAjukan, setPendingAjukan] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [isUploadingSurat, setIsUploadingSurat] = useState(false);
  const [errorSurat, setErrorSurat] = useState<string | null>(null);

  /* ── Navigasi halaman internal: list → detail → BA ── */
  const [halaman, setHalaman] = useState<Halaman>("list");
  const [pengajuanIdDipilih, setPengajuanIdDipilih] = useState<string | null>(
    null,
  );
  const [previewDokumen, setPreviewDokumen] = useState<{
    namaFile: string;
    url: string;
  } | null>(null);

  /* ── Peta telaah per pengajuan ── */
  const telaahByPengajuanId = useMemo(() => {
    const map = new Map<string, TelaahInternalRecord>();
    semuaTelaah.forEach((t) => map.set(t.pengajuanId, t));
    return map;
  }, [semuaTelaah]);

  /* ── Set pengajuan yang telaah internal-nya SELESAI ── */
  const setTelaahSelesai = useMemo(() => {
    const set = new Set<string>();
    telaahByPengajuanId.forEach((t) => {
      if (t.selesai) set.add(t.pengajuanId);
    });
    return set;
  }, [telaahByPengajuanId]);

  /* ── Peta Berita Acara per pengajuan (koleksi `beritaAcara`) ── */
  const baByPengajuanId = useMemo(() => {
    const map = new Map<string, BeritaAcaraRecord>();
    semuaBA.forEach((b) => map.set(b.pengajuanId, b));
    return map;
  }, [semuaBA]);

  /* ── Peta dokumen reviu per pengajuan (koleksi `reviuInspektorat`) ── */
  const reviuByPengajuanId = useMemo(() => {
    const map = new Map<string, ReviuInspektoratRecord>();
    semuaReviu.forEach((r) => map.set(r.pengajuanId, r));
    return map;
  }, [semuaReviu]);

  /* ── Peta draft surat pengantar per pengajuan ── */
  const suratPengantarByPengajuanId = useMemo(() => {
    const map = new Map<string, SuratPengantarInspektoratRecord>();
    semuaSuratPengantar.forEach((s) => map.set(s.pengajuanId, s));
    return map;
  }, [semuaSuratPengantar]);

  /* ── Data pengajuan yang sedang dibuka (detail/BA) ── */
  const pengajuanDipilih = useMemo(
    () => semuaPengajuan.find((p) => p.id === pengajuanIdDipilih) ?? null,
    [semuaPengajuan, pengajuanIdDipilih],
  );
  const telaahDipilih = pengajuanIdDipilih
    ? (telaahByPengajuanId.get(pengajuanIdDipilih) ?? null)
    : null;
  const baDipilih = pengajuanIdDipilih
    ? (baByPengajuanId.get(pengajuanIdDipilih) ?? null)
    : null;
  const suratPengantarDipilih = pengajuanIdDipilih
    ? (suratPengantarByPengajuanId.get(pengajuanIdDipilih) ?? null)
    : null;

  /* ── Data awal BA dari database (pengajuan + BA tersimpan) ── */
  const dataAwalBA: BeritaAcaraData | null = useMemo(
    () =>
      pengajuanDipilih ? bangunBeritaAcara(pengajuanDipilih, baDipilih) : null,
    [pengajuanDipilih, baDipilih],
  );

  /* ── Tab "Siap Direviu" ── */
  const daftarSiap = useMemo(
    () =>
      semuaPengajuan
        .filter(
          (p) =>
            setTelaahSelesai.has(p.id) &&
            (!p.reviuInspektoratStatus ||
              p.reviuInspektoratStatus !== "MENUNGGU_REVIU"),
        )
        .sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
        ),
    [semuaPengajuan, setTelaahSelesai],
  );

  /* ── Tab "Sudah Direviu" ── */
  const daftarSudah = useMemo(
    () =>
      semuaPengajuan
        .filter((p) => p.reviuInspektoratStatus === "MENUNGGU_REVIU")
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [semuaPengajuan],
  );

  /* ── Daftar OPD unik ── */
  const daftarOPD = useMemo(() => {
    const set = new Set<string>();
    semuaPengajuan.forEach((p) => {
      if (p.namaOPD) set.add(p.namaOPD);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [semuaPengajuan]);

  /* ── Filter generic ── */
  const matchFilter = (p: FormulirPenghapusanPiutangOPDRecord): boolean => {
    if (filterOPD && p.namaOPD !== filterOPD) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (p.nomorRegistrasi ?? "").toLowerCase().includes(q) ||
        p.nomorPengajuan.toLowerCase().includes(q) ||
        p.namaOPD.toLowerCase().includes(q) ||
        p.namaPenanggungJawab.toLowerCase().includes(q)
      );
    }
    return true;
  };

  const siapFiltered = useMemo(
    () => daftarSiap.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarSiap, search, filterOPD],
  );
  const sudahFiltered = useMemo(
    () => daftarSudah.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarSudah, search, filterOPD],
  );

  const stats = useMemo(
    () => ({ siap: daftarSiap.length, sudah: daftarSudah.length }),
    [daftarSiap, daftarSudah],
  );

  const isFilterAktif = Boolean(search.trim() || filterOPD);
  const resetFilter = () => {
    setSearch("");
    setFilterOPD("");
  };

  /* ── Navigasi ── */
  const bukaDetail = (p: FormulirPenghapusanPiutangOPDRecord) => {
    setPengajuanIdDipilih(p.id);
    setHalaman("detail");
    setErrorMsg(null);
    setErrorSurat(null);
  };

  const kembaliKeDaftar = () => {
    setHalaman("list");
    setPengajuanIdDipilih(null);
    setPreviewDokumen(null);
    setErrorSurat(null);
  };

  /* ── Aksi: unggah / ganti surat pengantar (langsung dari detail) ── */
  const handleUploadSuratPengantar = async (file: File) => {
    if (!pengajuanIdDipilih || !user?.username) return;

    setIsUploadingSurat(true);
    setErrorSurat(null);
    try {
      // Upload ke Cloudinary dulu; kalau gagal, draft di Firestore tidak berubah.
      const suratPengantar = await uploadDokumenKeCloudinary(
        file,
        pengajuanIdDipilih,
        "suratPengantarInspektorat",
      );
      await simpanSuratPengantarInspektorat(
        pengajuanIdDipilih,
        suratPengantar,
        user.username,
      );
    } catch (err) {
      setErrorSurat(
        err instanceof Error ? err.message : "Gagal mengunggah surat pengantar.",
      );
    } finally {
      setIsUploadingSurat(false);
    }
  };

  /* ── Aksi: hapus draft surat pengantar ── */
  const handleHapusSuratPengantar = async () => {
    if (!pengajuanIdDipilih) return;
    if (
      !window.confirm(
        "Hapus surat pengantar yang sudah diunggah? Anda harus mengunggahnya lagi sebelum bisa mengajukan reviu.",
      )
    ) {
      return;
    }

    setIsUploadingSurat(true);
    setErrorSurat(null);
    try {
      await hapusSuratPengantarInspektorat(pengajuanIdDipilih);
    } catch (err) {
      setErrorSurat(
        err instanceof Error ? err.message : "Gagal menghapus surat pengantar.",
      );
    } finally {
      setIsUploadingSurat(false);
    }
  };

  /* ── Aksi: ajukan reviu (BA + surat pengantar wajib sudah ada) ── */
  const handleKonfirmasiAjukan = async () => {
    if (!pendingAjukan || !user?.username) return;

    // Lapisan UI sudah mengunci tombol; ini pengaman kalau state berubah.
    if (!baByPengajuanId.has(pendingAjukan.id)) {
      setErrorMsg(
        "Berita Acara wajib dibuat dan disimpan terlebih dahulu sebelum mengajukan Reviu Inspektorat.",
      );
      return;
    }
    if (!suratPengantarByPengajuanId.has(pendingAjukan.id)) {
      setErrorMsg(
        "Surat Pengantar ke Inspektorat wajib diunggah terlebih dahulu sebelum mengajukan Reviu Inspektorat.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      setProgressLabel("Mengajukan reviu…");
      await ajukanReviuInspektorat(
        {
          id: pendingAjukan.id,
          opdId: pendingAjukan.opdId,
          nomorPengajuan: pendingAjukan.nomorPengajuan,
          nomorRegistrasi: pendingAjukan.nomorRegistrasi ?? null,
          namaOPD: pendingAjukan.namaOPD,
        },
        user.username,
      );
      setPendingAjukan(null);
      setTab("sudah");
      kembaliKeDaftar();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengajukan reviu.",
      );
    } finally {
      setIsSubmitting(false);
      setProgressLabel(null);
    }
  };

  /* ── Aksi: simpan BA ke database, lalu kembali ke detail ── */
  const handleSimpanBA = async (data: BeritaAcaraData) => {
    if (!pengajuanIdDipilih) return;
    if (!user?.username) {
      throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
    }
    await simpanBeritaAcaraData(pengajuanIdDipilih, data, user.username);
    // Setelah BA tersimpan, langsung kembali ke halaman detail "Siap Direviu".
    setErrorSurat(null);
    setHalaman("detail");
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "siap", label: "Siap Direviu", count: stats.siap },
    { key: "sudah", label: "Sudah Direviu", count: stats.sudah },
  ];

  /* ── Modal yang dipakai di semua halaman ── */
  const suratPengantarPending = pendingAjukan
    ? (suratPengantarByPengajuanId.get(pendingAjukan.id) ?? null)
    : null;

  const modalAjukan =
    pendingAjukan && suratPengantarPending ? (
      <ModalKonfirmasiAjukanReviu
        nomorRegistrasi={pendingAjukan.nomorRegistrasi ?? ""}
        nomorPengajuan={pendingAjukan.nomorPengajuan}
        namaOPD={pendingAjukan.namaOPD}
        suratPengantar={suratPengantarPending.suratPengantar}
        onConfirm={handleKonfirmasiAjukan}
        onClose={() => {
          if (!isSubmitting) {
            setPendingAjukan(null);
            setErrorMsg(null);
          }
        }}
        onPreviewSurat={() =>
          setPreviewDokumen({
            namaFile: suratPengantarPending.suratPengantar.namaFile,
            url: suratPengantarPending.suratPengantar.url,
          })
        }
        isSubmitting={isSubmitting}
        errorMessage={errorMsg}
        submitLabel={progressLabel}
      />
    ) : null;

  const modalPreviewDokumen = previewDokumen ? (
    <ModalPreviewPDF
      namaFile={previewDokumen.namaFile}
      url={previewDokumen.url}
      onClose={() => setPreviewDokumen(null)}
    />
  ) : null;

  /* ==================== Halaman: BA ==================== */

  if (halaman === "ba" && pengajuanDipilih && dataAwalBA) {
    return (
      <>
        {modalPreviewDokumen}
        <PembuatanBeritaAcara
          key={pengajuanDipilih.id}
          initialData={dataAwalBA}
          onBack={() => setHalaman("detail")}
          onSave={handleSimpanBA}
        />
      </>
    );
  }

  /* ==================== Halaman: Detail ==================== */

  if (halaman === "detail" && pengajuanDipilih) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {modalAjukan}
        {modalPreviewDokumen}
        <DetailPengajuan
          pengajuan={pengajuanDipilih}
          telaah={telaahDipilih}
          ba={baDipilih}
          suratPengantar={suratPengantarDipilih}
          onBack={kembaliKeDaftar}
          onBukaBA={() => {
            setErrorSurat(null);
            setHalaman("ba");
          }}
          onUploadSuratPengantar={handleUploadSuratPengantar}
          onHapusSuratPengantar={handleHapusSuratPengantar}
          isUploadingSurat={isUploadingSurat}
          errorSurat={errorSurat}
          onAjukan={() => {
            // Jangan buka modal kalau BA / surat pengantar belum ada.
            if (!baDipilih || !suratPengantarDipilih) return;
            setPendingAjukan(pengajuanDipilih);
            setErrorMsg(null);
          }}
          onPreviewDokumen={(namaFile, url) =>
            setPreviewDokumen({ namaFile, url })
          }
        />
      </div>
    );
  }

  /* ==================== Halaman: Daftar ==================== */

  return (
    <div className="mx-auto w-full max-w-5xl">
      {modalAjukan}
      {modalPreviewDokumen}

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={<IconInbox />}
          label="Siap Direviu"
          value={stats.siap}
          sublabel="Perlu tindakan"
          accentClass="bg-[#7c3aed]"
          bgClass="bg-[#f3efff]"
          borderClass="border-[#ddd0fb]"
        />
        <StatCard
          icon={<IconSparkles />}
          label="Sudah Direviu"
          value={stats.sudah}
          sublabel="Menunggu proses offline"
          accentClass="bg-[#0f9b6e]"
          bgClass="bg-[#e6f7f2]"
          borderClass="border-[#a7e8d4]"
        />
      </div>

      {/* Tab bar */}
      <div className="mb-3.5 flex flex-wrap gap-1.5 border-b border-[#e2e8f2]">
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition ${
                isActive
                  ? "border-[#7c3aed] text-[#7c3aed]"
                  : "border-transparent text-[#7a8899] hover:text-[#1a1a2e]"
              }`}
            >
              {t.label}
              <span
                className={`rounded-sm px-1.5 py-px text-[10.5px] font-bold ${
                  isActive
                    ? "bg-[#f3efff] text-[#7c3aed]"
                    : "bg-[#f0f4fb] text-[#7a8899]"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="mb-3.5 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[14px_16px] lg:flex-row lg:items-center">
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.75 lg:min-w-40 lg:flex-1">
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

        <div className="flex shrink-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1.75">
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
          className="shrink-0 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.75 text-[12px] font-semibold text-[#7a8899] transition enabled:hover:border-[#a0bdec] enabled:hover:bg-[#e8f0fb] enabled:hover:text-[#1a4e8f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>

        <div className="shrink-0 text-xs text-[#7a8899]">
          {tab === "siap"
            ? `${siapFiltered.length} pengajuan`
            : `${sudahFiltered.length} sudah direviu`}
        </div>
      </div>

      {/* Konten */}
      {tab === "siap" &&
        (siapFiltered.length === 0 ? (
          <EmptyState
            icon={<IconCheckBig />}
            title={
              daftarSiap.length === 0
                ? "Tidak ada pengajuan yang siap direviu"
                : "Tidak ada yang cocok"
            }
            subtitle={
              daftarSiap.length === 0
                ? "Pengajuan akan muncul di sini setelah Telaah Internal selesai."
                : "Coba ubah kata kunci pencarian atau filter OPD."
            }
          />
        ) : (
          <div className="space-y-2.5">
            {siapFiltered.map((p) => (
              <KartuSiapDireviu
                key={p.id}
                pengajuan={p}
                adaBA={baByPengajuanId.has(p.id)}
                adaSuratPengantar={suratPengantarByPengajuanId.has(p.id)}
                onBuka={() => bukaDetail(p)}
              />
            ))}
          </div>
        ))}

      {tab === "sudah" &&
        (sudahFiltered.length === 0 ? (
          <EmptyState
            icon={<IconShield />}
            title={
              daftarSudah.length === 0
                ? "Belum ada pengajuan yang direviu"
                : "Tidak ada yang cocok"
            }
            subtitle={
              daftarSudah.length === 0
                ? "Setelah Anda mengajukan Reviu Inspektorat, pengajuan akan muncul di sini."
                : "Coba ubah kata kunci pencarian atau filter OPD."
            }
          />
        ) : (
          <div className="space-y-2.5">
            {sudahFiltered.map((p) => (
              <KartuSudahDireviu
                key={p.id}
                pengajuan={p}
                reviu={reviuByPengajuanId.get(p.id) ?? null}
                onPreviewDokumen={(namaFile, url) =>
                  setPreviewDokumen({ namaFile, url })
                }
              />
            ))}
          </div>
        ))}
    </div>
  );
}
