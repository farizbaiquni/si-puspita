"use client";

import React, { useMemo, useState } from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  JenisPenghapusan,
  JenisPiutang,
  StatusFormulir,
  UploadedFileRef,
} from "@/types/types";
import { usePengajuanStore } from "@/store/pengajuan-store";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRupiah(nominal: string | number): string {
  const n = typeof nominal === "string" ? Number(nominal) || 0 : nominal;
  return "Rp " + n.toLocaleString("id-ID");
}

function formatTanggal(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatUkuran(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function labelJenisPiutang(j: JenisPiutang | ""): string {
  const map: Record<JenisPiutang, string> = {
    "Piutang Retribusi Daerah": "Retribusi Daerah",
    "Piutang Lain-lain PAD yang Sah": "Lain-lain PAD yang Sah",
    "Piutang Lainnya": "Lainnya",
  };
  return j ? map[j] : "-";
}

/** Inisial 1-2 huruf dari nama, untuk avatar bulat Penanggung Jawab OPD. */
function ambilInisial(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return "?";
  const inisial = kata
    .slice(0, 2)
    .map((k) => k.replace(/[^A-Za-z]/g, "")[0] ?? "")
    .join("");
  return (inisial || "?").toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Nomor Registrasi sekarang di-generate oleh registrasiPengajuan() di
// pengajuan-store.tsx (Firestore transaction, format
// XXX/REG-PUSPITA/DISDAGKOPUKM/MM/YYYY) — bukan lagi digenerate lokal di sini,
// supaya tidak ada dua sumber kebenaran & aman dari race condition saat
// dua verifikator klik "Registrasi" hampir bersamaan.
// ─────────────────────────────────────────────────────────────────────────────
// Daftar dokumen — dibangun dari field dokumen flat FormulirPenghapusanPiutangOPDRecord + fileSurat
// ─────────────────────────────────────────────────────────────────────────────

interface DokumenEntry {
  key: string;
  label: string;
  /** null = dokumen ini tidak/belum diupload OPD */
  file: UploadedFileRef | null;
}

/**
 * Struktur tampilan daftar dokumen pendukung — beda dari DokumenEntry
 * (yang cuma satu file), ini mengatur URUTAN dan PENGELOMPOKAN sesuai
 * checklist persyaratan substantif resmi (1-8):
 *  - "single": item bernomor dengan satu file (mis. 1, 2, 3, 4, 7, 8)
 *  - "group": item bernomor TANPA file sendiri (cuma judul syarat),
 *    dengan beberapa sub-dokumen di bawahnya (mis. 5, 6) — dirender
 *    menjorok ke kanan tanpa nomor sendiri per DokumenItem.tsx.
 */
type DokumenTampilanEntry =
  | {
      type: "single";
      nomor: number;
      wajib: boolean;
      keterangan?: string;
      entry: DokumenEntry;
    }
  | {
      type: "group";
      nomor: number;
      wajib: boolean;
      label: string;
      keterangan?: string;
      anak: DokumenEntry[];
    };

/** Ambil UploadedFileRef dari field record (atau null kalau belum diupload). */
function ambilFile(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
  key: keyof FormulirPenghapusanPiutangOPDRecord,
): UploadedFileRef | null {
  const value = pengajuan[key];
  return value && typeof value === "object" && "url" in value
    ? (value as UploadedFileRef)
    : null;
}

/** Label tampilan untuk opsiRiwayatPenagihan — lebih jelas dari label enum default. */
function labelOpsiRiwayatPenagihanTampilan(
  opsi: FormulirPenghapusanPiutangOPDRecord["opsiRiwayatPenagihan"],
): string {
  if (opsi === "riwayat_tagihan") return "Riwayat Penagihan 1-3";
  if (opsi === "penyataan_opd") return "Pernyataan OPD";
  return "-";
}

// 5 kemungkinan bukti "tidak mampu bayar" — OPD cuma upload SALAH SATU dari
// ini (bukan wajib kelima-limanya, lihat item 5 checklist substantif).
// Dipakai di dua tempat: daftar dokumen (buildDokumenTampilan) dan info
// ringkas "Bukti Dokumen Tidak Mampu Melunasi Utang" di bawah.
const BUKTI_TIDAK_MAMPU_LABELS: {
  key: keyof FormulirPenghapusanPiutangOPDRecord;
  label: string;
}[] = [
  {
    key: "buktiTidakMampuKartuKeluargaMiskin",
    label: "Kartu Keluarga Miskin",
  },
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

/** Cari mana dari 5 bukti "tidak mampu bayar" yang benar-benar diupload OPD. */
function labelBuktiTidakMampuTerupload(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
): string {
  const terupload = BUKTI_TIDAK_MAMPU_LABELS.find(
    ({ key }) => ambilFile(pengajuan, key) !== null,
  );
  return terupload ? terupload.label : "-";
}

/**
 * Bangun daftar tampilan dokumen pendukung sesuai urutan checklist
 * persyaratan substantif resmi:
 *  1. Surat Pengantar Usulan *
 *  2. Daftar Nominatif Usulan Piutang SKPD *
 *  3. Piutang telah berstatus macet dengan usia piutang > 3 tahun *
 *  4. Usia pencatatan piutang telah memenuhi ketentuan
 *  5. Tidak mempunyai kemampuan untuk menyelesaikan utang * (grup, min. 1)
 *  6. Surat tagihan telah diterbitkan * (grup)
 *  7. Telah dilakukan upaya optimal sesuai ketentuan (opsional)
 *  8. Telah dilakukan kerja sama penagihan pihak ketiga (> Rp 1 Milyar)
 * Dokumen lain di luar 8 item ini (surat formulir, rekapitulasi, dst)
 * ditambahkan sesudahnya sebagai lanjutan nomor, bukan disisipkan di
 * tengah — supaya urutan 1-8 di atas tidak berubah.
 */
function buildDokumenTampilan(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
): DokumenTampilanEntry[] {
  const tampilan: DokumenTampilanEntry[] = [
    {
      type: "single",
      nomor: 1,
      wajib: true,
      entry: {
        key: "suratPengantarUsulan",
        label: "Surat Pengantar Usulan",
        file: ambilFile(pengajuan, "suratPengantarUsulan"),
      },
    },
    {
      type: "single",
      nomor: 2,
      wajib: true,
      entry: {
        key: "daftarNominatifPiutang",
        label: "Daftar Nominatif Usulan Piutang SKPD",
        file: ambilFile(pengajuan, "daftarNominatifPiutang"),
      },
    },
    {
      type: "single",
      nomor: 3,
      wajib: true,
      keterangan: "upload SKRD/SK/Surat Perjanjian",
      entry: {
        key: "persyaratanPiutangMacet",
        label: "Piutang telah berstatus macet dengan usia piutang > 3 tahun",
        file: ambilFile(pengajuan, "persyaratanPiutangMacet"),
      },
    },
    {
      type: "single",
      nomor: 4,
      wajib: false,
      keterangan: "upload neraca awal terjadinya piutang",
      entry: {
        key: "persyaratanUsiaPencatatan",
        label: "Usia pencatatan piutang telah memenuhi ketentuan",
        file: ambilFile(pengajuan, "persyaratanUsiaPencatatan"),
      },
    },
    {
      type: "group",
      nomor: 5,
      wajib: true,
      label: "Tidak mempunyai kemampuan untuk menyelesaikan utang",
      keterangan: "minimal satu harus dipenuhi dibawah ini",
      anak: BUKTI_TIDAK_MAMPU_LABELS.map(({ key, label }) => ({
        key,
        label,
        file: ambilFile(pengajuan, key),
      })),
    },
    {
      type: "group",
      nomor: 6,
      wajib: true,
      label: "Surat tagihan telah diterbitkan",
      anak: [
        {
          key: "riwayatPenagihan1",
          label: "Bukti riwayat tagihan ke-1",
          file: ambilFile(pengajuan, "riwayatPenagihan1"),
        },
        {
          key: "riwayatPenagihan2",
          label: "Bukti riwayat tagihan ke-2",
          file: ambilFile(pengajuan, "riwayatPenagihan2"),
        },
        {
          key: "riwayatPenagihan3",
          label: "Bukti riwayat tagihan ke-3",
          file: ambilFile(pengajuan, "riwayatPenagihan3"),
        },
        {
          key: "filePernyataanOPD",
          label: "Bukti pernyataan OPD",
          file: ambilFile(pengajuan, "filePernyataanOPD"),
        },
      ],
    },
    {
      type: "single",
      nomor: 7,
      wajib: false,
      keterangan: "opsional",
      entry: {
        key: "buktiUpayaOptimal",
        label: "Telah dilakukan upaya optimal sesuai ketentuan",
        file: ambilFile(pengajuan, "buktiUpayaOptimal"),
      },
    },
    {
      type: "single",
      nomor: 8,
      wajib: false,
      keterangan: "khusus untuk nominal di atas Rp 1 Milyar",
      entry: {
        key: "buktiKerjaSamaPihakKetiga",
        label:
          "Telah dilakukan kerja sama penagihan dengan melibatkan pihak ketiga",
        file: ambilFile(pengajuan, "buktiKerjaSamaPihakKetiga"),
      },
    },
  ];

  return tampilan;
}

/** Ratakan struktur tampilan jadi daftar file datar — dipakai untuk hitung X/Y terupload dan state preview modal. */
function flattenDokumenTampilan(
  tampilan: DokumenTampilanEntry[],
): DokumenEntry[] {
  return tampilan.flatMap((t) => (t.type === "single" ? [t.entry] : t.anak));
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  StatusFormulir,
  { label: string; cls: string; dot: string }
> = {
  diajukan: {
    label: "Diajukan",
    cls: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    dot: "bg-[#3b82f6]",
  },
  revisi: {
    label: "Perlu Revisi",
    cls: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dot: "bg-[#f97316]",
  },
  teregistrasi: {
    label: "Teregistrasi",
    cls: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
    dot: "bg-[#10b981]",
  },
};

const StatusBadge: React.FC<{ status: StatusFormulir }> = ({ status }) => {
  const cfg = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.25 rounded-full border px-2.25 py-0.75 text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const JenisPenghapusanBadge: React.FC<{ jenis: JenisPenghapusan }> = ({
  jenis,
}) => {
  const isBersyarat = jenis === "Penghapusan Bersyarat";
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
        isBersyarat
          ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]"
          : "border-[#ddd6fe] bg-[#f5f3ff] text-[#5b21b6]"
      }`}
    >
      {isBersyarat ? "Bersyarat" : "Mutlak"}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

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

const IconFileText = () => (
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
);

const IconPdf = () => (
  <svg
    width="18"
    height="18"
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
);

const IconEye = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M1 7s2-4.5 6-4.5S13 7 13 7s-2 4.5-6 4.5S1 7 1 7z" />
    <circle cx="7" cy="7" r="1.5" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="16"
    height="16"
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

const IconX = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
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

const IconBuilding = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <path d="M3 12.5V2.5a1 1 0 011-1h6a1 1 0 011 1v10" strokeLinecap="round" />
    <path
      d="M1.5 12.5h11M5 5h1M8 5h1M5 7.5h1M8 7.5h1M5 10h1M8 10h1"
      strokeLinecap="round"
    />
  </svg>
);

const IconCalendar = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
    <path d="M1.5 5.5h11M4 1v2.5M10 1v2.5" strokeLinecap="round" />
  </svg>
);

const IconTag = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <path
      d="M7.5 1.5H3a1.5 1.5 0 00-1.5 1.5v4.5L7.5 13.5a1 1 0 001.4 0l4.1-4.1a1 1 0 000-1.4L7.5 1.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="4.75" cy="4.75" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconUsersGroup = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <circle cx="5.25" cy="4.25" r="2" />
    <path
      d="M1 12c0-2.35 1.9-4.25 4.25-4.25S9.5 9.65 9.5 12"
      strokeLinecap="round"
    />
    <path
      d="M9 4.25a2 2 0 110 4M11 7.75c1.4.5 2.5 1.9 2.5 4.25"
      strokeLinecap="round"
    />
  </svg>
);

const IconCoins = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <ellipse cx="5" cy="4" rx="3.5" ry="2" />
    <path
      d="M1.5 4v3c0 1.1 1.57 2 3.5 2s3.5-.9 3.5-2V4"
      strokeLinecap="round"
    />
    <path
      d="M1.5 7v3c0 1.1 1.57 2 3.5 2 1.4 0 2.62-.47 3.17-1.15"
      strokeLinecap="round"
    />
    <ellipse cx="9.5" cy="8" rx="3" ry="1.7" />
  </svg>
);

const IconLayers = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
  >
    <path
      d="M7 1.5L1 4.5l6 3 6-3-6-3z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1 7.5l6 3 6-3M1 10.5l6 3 6-3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconWallet = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <path
      d="M1.5 4a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0111.5 4v.5h-8A1.5 1.5 0 001 6v5.5A1.5 1.5 0 002.5 13h8a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9.5" cy="8.75" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

const IconCopy = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <rect x="5" y="5" width="8" height="8" rx="1.3" />
    <path
      d="M3.5 9H2.3A1.3 1.3 0 011 7.7V2.3A1.3 1.3 0 012.3 1h5.4A1.3 1.3 0 019 2.3v1.2"
      strokeLinecap="round"
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// CopyButton — tombol salin nomor (Nomor Pengajuan / Surat / Registrasi)
// dengan feedback singkat "Disalin" supaya verifikator gampang copy nomor
// tanpa harus select-drag manual.
// ─────────────────────────────────────────────────────────────────────────────

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API bisa gagal (mis. browser lama / non-HTTPS) — diamkan
      // saja, tombol cuma tidak kasih feedback "Disalin".
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Salin"
      title="Salin"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:cursor-pointer ${
        copied
          ? "text-[#0f9b6e]"
          : "text-[#b0bac5] hover:bg-[#f0f4fb] hover:text-[#1a4e8f]"
      }`}
    >
      {copied ? <IconCheck /> : <IconCopy />}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FieldItem — pasangan ikon + label + value, dipakai di header card & kartu
// Penanggung Jawab OPD supaya tiap field lebih gampang di-scan sekilas.
// ─────────────────────────────────────────────────────────────────────────────

const FieldItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f0f4fb] text-[#1a4e8f]">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
        {label}
      </div>
      <div className="truncate text-sm text-[#1a1a2e]">{value}</div>
    </div>
  </div>
);

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
      className="fixed inset-0 z-1100 flex items-center justify-center bg-[rgba(10,20,40,0.55)] p-0 backdrop-blur-[2px] sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:rounded-sm">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e2e8f2] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#fdecea]">
              <IconPdf />
            </div>
            <div className="min-w-0 leading-4">
              <p className="truncate text-[15px] font-semibold text-[#1a1a2e]">
                {namaFile}
              </p>
              <p className="text-[13px] text-[#7a8899]">Preview Dokumen PDF</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded bg-[#f1f3f5] px-2.5 py-1.5 text-[13px] font-medium text-[#1a1a2e] transition hover:bg-[#e5e7eb]"
              title="Buka di tab baru"
            >
              Tab baru
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#7a8899] transition hover:bg-[#f1f3f5] hover:text-[#1a1a2e]"
              title="Tutup (Esc)"
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 overflow-hidden bg-[#f1f3f5] p-2">
          <iframe
            src={url}
            className="h-full w-full rounded-sm border border-[#e2e8f2] bg-white"
            title={namaFile}
          />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Dokumen list item
// ─────────────────────────────────────────────────────────────────────────────

const DokumenItem: React.FC<{
  /** Nomor urut tampilan (1, 2, 3, ...). null untuk sub-item — tampil dash "-" alih-alih nomor. */
  nomor: number | null;
  dok: DokumenEntry;
  onPreview: () => void;
  wajib?: boolean;
  keterangan?: string;
}> = ({ nomor, dok, onPreview, wajib, keterangan }) => {
  const belumUpload = !dok.file;

  return (
    <div
      className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 ${
        belumUpload
          ? "border-dashed border-[#e2e8f2] bg-[#fbfbfc]"
          : "border-[#e2e8f2] bg-[#f7f8fa]"
      }`}
    >
      <div className="w-5 shrink-0 text-sm text-gray-500">
        {nomor !== null ? `${nomor}.` : "–"}
      </div>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
          belumUpload ? "bg-[#eef0f3]" : "bg-[#fdecea]"
        }`}
      >
        {belumUpload ? (
          <span className="text-[#b0bac5]">
            <IconPdf />
          </span>
        ) : (
          <IconPdf />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`mb-0.5 text-sm leading-snug font-semibold ${
            belumUpload ? "text-[#8a96a3]" : "text-[#1a4e8f]"
          }`}
        >
          {dok.label}
          {wajib && <span className="text-red-500"> *</span>}
          {keterangan && (
            <span className="ml-1 font-normal text-[#8a96a3]">
              (<span className="italic">{keterangan}</span>)
            </span>
          )}
        </div>
        <div
          className={`text-xs ${belumUpload ? "text-[#c0392b] italic" : "text-[#7a8899]"}`}
        >
          {belumUpload ? "Tidak diupload" : formatUkuran(dok.file!.ukuranBytes)}
        </div>
      </div>
      {!belumUpload && (
        <button
          onClick={onPreview}
          className="flex shrink-0 items-center gap-1.5 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a4e8f] transition hover:cursor-pointer hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
        >
          <IconEye />
          Lihat PDF
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Detail Verifikasi (panel)
// ─────────────────────────────────────────────────────────────────────────────

type Keputusan = Extract<StatusFormulir, "teregistrasi" | "revisi">;

const PanelVerifikasi: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  onBack: () => void;
  onSubmit: (keputusan: Keputusan, catatan: string) => void;
  /** True selagi handleSubmitVerifikasi di parent sedang menulis ke Firestore. */
  submitting: boolean;
  /** Pesan error dari operasi Firestore (registrasiPengajuan/updatePengajuan) di parent. */
  submitError: string;
}> = ({ pengajuan, onBack, onSubmit, submitting, submitError }) => {
  const [keputusan, setKeputusan] = useState<Keputusan | null>(null);
  const [catatan, setCatatan] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DokumenEntry | null>(null);
  const [error, setError] = useState("");

  const dokumenTampilan = useMemo(
    () => buildDokumenTampilan(pengajuan),
    [pengajuan],
  );
  const dokumen = useMemo(
    () => flattenDokumenTampilan(dokumenTampilan),
    [dokumenTampilan],
  );

  const handleSubmit = () => {
    if (submitting) return;
    if (!keputusan) {
      setError("Pilih hasil verifikasi: Lolos Verifikasi atau Perlu Revisi.");
      return;
    }
    if (keputusan === "revisi" && catatan.trim().length < 5) {
      setError(
        "Keterangan wajib diisi (minimal 5 karakter) untuk pengajuan yang perlu direvisi.",
      );
      return;
    }
    setError("");
    onSubmit(keputusan, catatan.trim());
  };

  return (
    <div className="mx-auto w-full max-w-400">
      {previewDoc?.file && (
        <ModalPreviewPDF
          namaFile={previewDoc.file.namaFile}
          url={previewDoc.file.url}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Back */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4e8f] hover:cursor-pointer hover:underline"
      >
        <IconArrowLeft />
        Kembali ke daftar
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Kolom kiri: info pengajuan & dokumen ── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Kartu info pengajuan — digabung jadi satu (identitas, ringkasan field, penanggung jawab) */}
          <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white">
            {/* Strip identitas: nomor pengajuan/surat/registrasi + badge status */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eef1f5] bg-[#f9fafc] px-5 py-4">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
                    Nomor Pengajuan
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[15px] font-bold text-[#1a4e8f]">
                      {pengajuan.nomorPengajuan}
                    </span>
                    <CopyButton value={pengajuan.nomorPengajuan} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
                    Nomor Surat
                  </div>
                  <div className="text-[15px] font-bold text-[#1a1a2e]">
                    {pengajuan.nomorSurat || "-"}
                  </div>
                </div>
                {pengajuan.nomorRegistrasi && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
                      Nomor Registrasi
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[15px] font-bold text-[#0f9b6e]">
                        {pengajuan.nomorRegistrasi}
                      </span>
                      <CopyButton value={pengajuan.nomorRegistrasi} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <JenisPenghapusanBadge jenis={pengajuan.jenisPenghapusan} />
                <StatusBadge status={pengajuan.status} />
              </div>
            </div>

            {/* Ringkasan field — ikon per item supaya lebih gampang di-scan */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-b border-[#eef1f5] px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldItem
                icon={<IconBuilding />}
                label="Nama OPD"
                value={pengajuan.namaOPD}
              />
              <FieldItem
                icon={<IconCalendar />}
                label="Tanggal Surat"
                value={formatTanggal(pengajuan.tanggalSurat)}
              />
              <FieldItem
                icon={<IconTag />}
                label="Jenis Piutang"
                value={labelJenisPiutang(pengajuan.jenisPiutang)}
              />
              <FieldItem
                icon={<IconLayers />}
                label="Jenis Penghapusan"
                value={pengajuan.jenisPenghapusan || "-"}
              />
              <FieldItem
                icon={<IconUsersGroup />}
                label="Jumlah Debitur"
                value={pengajuan.jumlahDebitur}
              />
              <FieldItem
                icon={<IconCoins />}
                label="Total Nilai Piutang"
                value={
                  <span className="font-bold text-[#1a4e8f]">
                    {formatRupiah(pengajuan.totalNilaiPiutang)}
                  </span>
                }
              />
              <FieldItem
                icon={<IconWallet />}
                label="Jumlah Angsuran"
                value={formatRupiah(pengajuan.nilaiRekapitulasiAngsuran)}
              />
            </div>

            {/* Penanggung Jawab OPD */}
            <div className="px-5 py-4">
              <div className="mb-4 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                Penanggung Jawab OPD
              </div>

              {/* Profil ringkas: avatar inisial + nama + jabatan */}
              <div className="mb-4 flex items-center gap-3 border-b border-[#f0f0f0] pb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#1a4e8f] to-[#123a6e] text-sm font-bold text-white">
                  {ambilInisial(pengajuan.namaPenanggungJawab)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold text-[#1a1a2e]">
                    {pengajuan.namaPenanggungJawab || "-"}
                  </div>
                  <div className="truncate text-[13px] text-[#7a8899]">
                    {pengajuan.jabatan || "-"}
                  </div>
                </div>
              </div>

              {/* Opsi yang dipilih OPD — pill supaya gampang dibedakan sekilas dari teks biasa */}
              <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                    Opsi Riwayat Penagihan
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[#dbe6f7] bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#1a4e8f]">
                    {labelOpsiRiwayatPenagihanTampilan(
                      pengajuan.opsiRiwayatPenagihan,
                    )}
                  </span>
                </div>
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                    Bukti Dokumen Tidak Mampu Melunasi Utang
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[#dbe6f7] bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#1a4e8f]">
                    {labelBuktiTidakMampuTerupload(pengajuan)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dokumen pendukung */}
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
              Dokumen Pendukung ({dokumen.filter((d) => d.file).length}/
              {dokumen.length} terupload)
            </div>
            {dokumen.length === 0 ? (
              <div className="rounded-sm border border-dashed border-[#e2e8f2] py-6 text-center text-[13px] text-[#7a8899]">
                Tidak ada dokumen yang dilampirkan.
              </div>
            ) : (
              <div className="space-y-2">
                {dokumenTampilan.map((d) =>
                  d.type === "single" ? (
                    <DokumenItem
                      key={d.entry.key}
                      nomor={d.nomor}
                      dok={d.entry}
                      wajib={d.wajib}
                      keterangan={d.keterangan}
                      onPreview={() => setPreviewDoc(d.entry)}
                    />
                  ) : (
                    <div key={`grup-${d.nomor}`} className="space-y-2">
                      {/* Judul syarat (item 5 & 6) — tanpa file sendiri, cuma label + sub-dokumen di bawahnya */}
                      <div className="flex items-baseline gap-2 px-1 pt-1">
                        <span className="text-sm font-normal text-gray-500">
                          {d.nomor}.
                        </span>
                        <div className="text-sm leading-snug font-normal text-[#1a1a2e]">
                          {d.label}
                          {d.wajib && <span className="text-red-500"> *</span>}
                          {d.keterangan && (
                            <span className="ml-1 text-xs font-normal text-[#7a8899]">
                              (<span className="italic">{d.keterangan}</span>)
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Sub-dokumen — menjorok ke kanan, tanpa nomor sendiri */}
                      <div className="ml-6 space-y-2 border-l-2 border-[#e2e8f2] pl-3">
                        {d.anak.map((entry) => (
                          <DokumenItem
                            key={entry.key}
                            nomor={null}
                            dok={entry}
                            onPreview={() => setPreviewDoc(entry)}
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Kolom kanan: form keputusan ── */}
        <div className="lg:col-span-1">
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5 lg:sticky lg:top-4">
            <div className="mb-3 text-[12px] font-bold tracking-[0.08em] text-gray-500">
              HASIL VERIFIKASI
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setKeputusan("teregistrasi")}
                className={`flex flex-col items-center gap-1.5 rounded-sm border-2 px-3 py-3 text-sm font-semibold transition hover:cursor-pointer ${
                  keputusan === "teregistrasi"
                    ? "border-[#0f9b6e] bg-[#e6f7f2] text-[#0f9b6e]"
                    : "border-[#e2e8f2] bg-white text-[#7a8899] hover:border-[#a7e8d4] hover:bg-[#e6f7f2]"
                }`}
              >
                <IconCheck />
                Lolos Verifikasi (Buat Nomor Registrasi)
              </button>
              <button
                onClick={() => setKeputusan("revisi")}
                className={`flex flex-col items-center gap-1.5 rounded-sm border-2 px-3 py-3 text-sm font-semibold transition hover:cursor-pointer ${
                  keputusan === "revisi"
                    ? "border-[#c0392b] bg-[#fdecea] text-[#c0392b]"
                    : "border-[#e2e8f2] bg-white text-[#7a8899] hover:border-[#fecaca] hover:bg-[#fdecea]"
                }`}
              >
                <IconX />
                Perlu Revisi
              </button>
            </div>

            <label className="mb-1.5 block text-[12px] font-bold text-gray-500">
              KETERANGAN / CATATAN
              {keputusan === "revisi" && (
                <span className="text-[#c0392b]"> *</span>
              )}
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={5}
              placeholder={
                keputusan === "revisi"
                  ? "Jelaskan alasan revisi / dokumen yang perlu dilengkapi…"
                  : "Catatan tambahan (opsional)…"
              }
              className="w-full resize-none rounded-sm border border-[#e2e8f2] bg-gray-100 p-3 text-[13px] text-[#1a1a2e] outline-none focus:border-[#a0bdec]"
            />

            {(error || submitError) && (
              <div className="mt-2 text-[12px] font-medium text-[#c0392b]">
                {error || submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 w-full rounded-sm bg-[#1a4e8f] py-2.5 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-[#2d63a8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Menyimpan…" : "Submit"}
            </button>
            <button
              onClick={onBack}
              disabled={submitting}
              className="mt-2 w-full rounded-sm border border-[#e2e8f2] bg-white py-2.5 text-sm font-semibold text-[#5a6474] transition hover:cursor-pointer hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Kartu baris — versi mobile (< sm) pengganti tabel yang kolomnya kebanyakan
// untuk layar sempit
// ─────────────────────────────────────────────────────────────────────────────

const PengajuanRowCardMobile: React.FC<{
  p: FormulirPenghapusanPiutangOPDRecord;
  no: number;
  onVerifikasi: () => void;
}> = ({ p, no, onVerifikasi }) => (
  <div className="space-y-2.5 p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="font-mono text-[11px] font-bold whitespace-nowrap text-[#1a4e8f]">
          #{no} · {p.nomorPengajuan}
        </div>
        <div className="mt-0.5 truncate text-[14px] font-semibold text-[#1a1a2e]">
          {p.namaOPD}
        </div>
        <div className="mt-px truncate text-[11px] text-[#7a8899]">
          {p.namaPenanggungJawab}
        </div>
      </div>
      <div className="shrink-0">
        <StatusBadge status={p.status} />
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-bold text-[#1a1a2e]">
        {formatRupiah(p.totalNilaiPiutang)}
      </span>
      <JenisPenghapusanBadge jenis={p.jenisPenghapusan} />
    </div>

    <div className="flex items-center justify-between gap-2 text-[11px] text-[#7a8899]">
      <span className="truncate">{labelJenisPiutang(p.jenisPiutang)}</span>
      <span className="shrink-0">{formatTanggal(p.tanggalSurat)}</span>
    </div>

    {p.status === "diajukan" && (
      <button
        onClick={onVerifikasi}
        className="w-full rounded-sm bg-[#1a4e8f] py-2 text-xs font-semibold text-white transition hover:bg-[#2d63a8]"
      >
        Verifikasi
      </button>
    )}
  </div>
);

const RiwayatRowCardMobile: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  keputusan: StatusFormulir;
  catatan: string;
}> = ({ pengajuan, keputusan, catatan }) => (
  <div className="space-y-1.5 p-4">
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[11px] font-bold whitespace-nowrap text-[#1a4e8f]">
        {pengajuan.nomorPengajuan}
      </span>
      <StatusBadge status={keputusan} />
    </div>
    <div className="truncate text-[13px] font-semibold text-[#1a1a2e]">
      {pengajuan.namaOPD}
    </div>
    <div className="text-[11px] text-[#5a6474]">
      {catatan || (
        <span className="text-[#b0bac5] italic">Tidak ada catatan</span>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface VerifikasiPengajuanProps {
  /**
   * Seluruh pengajuan — opsional. Kalau tidak diberikan (kasus normal di
   * production), diambil langsung dari usePengajuanStore() (Firestore
   * real-time). Prop ini tetap didukung untuk testing/storybook yang mau
   * mem-supply data manual.
   */
  semuaPengajuan?: FormulirPenghapusanPiutangOPDRecord[];
  /**
   * Opsional — dipanggil setelah BPKAD memutuskan verifikasi, di ATAS
   * proses tulis ke Firestore yang sudah dilakukan komponen ini sendiri
   * (lihat handleSubmitVerifikasi). Berguna kalau parent masih perlu tahu
   * hasil keputusan untuk keperluan lain (mis. notifikasi), TAPI parent
   * tidak perlu lagi mengubah status secara manual — itu sudah ditangani
   * lewat updatePengajuan()/registrasiPengajuan() dari store.
   */
  onStatusUpdate?: (
    id: string,
    status: Keputusan,
    catatan?: string,
    nomorRegistrasi?: string,
  ) => void;
  /** ID / nama akun verifikator BPKAD yang sedang login (untuk jejak audit) */
  verifikatorId?: string;
}

export default function VerifikasiPengajuan({
  semuaPengajuan,
  onStatusUpdate,
  verifikatorId,
}: VerifikasiPengajuanProps = {}) {
  // Sumber data utama sekarang Firestore (real-time via onSnapshot di
  // PengajuanProvider). `semuaPengajuan` tetap didukung sebagai override
  // manual untuk testing/storybook.
  const {
    data: dataStore,
    isLoading,
    error: storeError,
    updatePengajuan,
    registrasiPengajuan,
  } = usePengajuanStore();

  const daftarPengajuan = useMemo(() => {
    const sumber = semuaPengajuan ?? dataStore;
    // Panel verifikasi hanya menampilkan antrean yang masih perlu
    // ditindak — status "revisi" & "teregistrasi" sudah final/menunggu
    // OPD, jadi cukup dilihat di menu "Lihat Daftar Pengajuan".
    return sumber
      .filter((p) => p.status === "diajukan")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [semuaPengajuan, dataStore]);

  const [riwayat, setRiwayat] = useState<
    {
      pengajuan: FormulirPenghapusanPiutangOPDRecord;
      keputusan: Keputusan;
      catatan: string;
    }[]
  >([]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const filtered = useMemo(() => {
    if (!search) return daftarPengajuan;
    const q = search.toLowerCase();
    return daftarPengajuan.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.nomorPengajuan.toLowerCase().includes(q) ||
        p.namaOPD.toLowerCase().includes(q) ||
        p.namaPenanggungJawab.toLowerCase().includes(q),
    );
  }, [daftarPengajuan, search]);

  const handleSubmitVerifikasi = async (
    keputusan: Keputusan,
    catatan: string,
  ) => {
    if (!selected || submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      let nomorRegistrasi = selected.nomorRegistrasi;
      const tanggalVerifikasi = new Date().toISOString();

      // Firestore menolak field bernilai `undefined` (beda dengan `null`)
      // baik lewat updateDoc() maupun transaction.update() — jadi field
      // yang opsional/kosong wajib benar-benar TIDAK disertakan di objek,
      // bukan diisi `undefined`. Dibangun begini alih-alih spread langsung
      // supaya aman dipakai ulang di kedua cabang di bawah.
      const extraOpsional: Record<string, string> = {};
      if (verifikatorId) extraOpsional.verifikatorId = verifikatorId;
      if (catatan.trim()) extraOpsional.catatanVerifikasi = catatan.trim();

      if (keputusan === "teregistrasi") {
        // Lolos verifikasi → generate Nomor Registrasi lewat Firestore
        // transaction (registrasiPengajuan di pengajuan-store), supaya
        // nomor urut aman dari race condition kalau dua verifikator
        // klik "Registrasi" hampir bersamaan. Ini juga sekaligus yang
        // meng-update status jadi "teregistrasi" di Firestore.
        nomorRegistrasi = await registrasiPengajuan(selected.id, extraOpsional);
      } else {
        // Perlu revisi → cukup update status + catatan verifikasi biasa,
        // tidak perlu nomor registrasi.
        await updatePengajuan(selected.id, {
          status: "revisi",
          tanggalVerifikasi,
          ...extraOpsional,
        });
      }

      const hasil: FormulirPenghapusanPiutangOPDRecord = {
        ...selected,
        status: keputusan,
        tanggalVerifikasi,
        nomorRegistrasi,
        ...extraOpsional,
      };

      // Catat di riwayat sesi ini
      setRiwayat((prev) => [{ pengajuan: hasil, keputusan, catatan }, ...prev]);

      // Opsional — beri tahu parent (mis. untuk notifikasi tambahan).
      // Perubahan status sendiri sudah tersimpan di Firestore di atas,
      // dan akan otomatis muncul di seluruh komponen lain lewat
      // onSnapshot — parent TIDAK perlu lagi mengubah state manual.
      onStatusUpdate?.(
        selected.id,
        keputusan,
        catatan || undefined,
        nomorRegistrasi || undefined,
      );
      setSelected(null);
    } catch (err) {
      console.error("Gagal menyimpan hasil verifikasi:", err);
      setSubmitError(
        err instanceof Error
          ? `Gagal menyimpan hasil verifikasi: ${err.message}`
          : "Gagal menyimpan hasil verifikasi. Silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: panel verifikasi ──────────────────────────────────────────────
  if (selected) {
    return (
      <PanelVerifikasi
        pengajuan={selected}
        onBack={() => {
          if (submitting) return;
          setSubmitError("");
          setSelected(null);
        }}
        onSubmit={handleSubmitVerifikasi}
        submitting={submitting}
        submitError={submitError}
      />
    );
  }

  // ── Render: memuat data dari Firestore ───────────────────────────────────
  if (isLoading && !semuaPengajuan) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-[#7a8899]">
        Memuat antrean verifikasi…
      </div>
    );
  }

  // ── Render: daftar antrean ────────────────────────────────────────────────
  return (
    <div className="font-inherit mx-auto w-full max-w-400">
      {storeError && !semuaPengajuan && (
        <div className="mb-3.5 rounded-sm border border-[#fed7aa] bg-[#fff7ed] px-4 py-2.5 text-[13px] font-medium text-[#9a3412]">
          Gagal memuat data pengajuan: {storeError}
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="mb-3.5 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[14px_16px] sm:flex-row sm:items-center">
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.75 sm:min-w-40 sm:flex-1">
          <span className="shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari Nomor Pengajuan, nama OPD, atau penanggung jawab…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-w-0 border-none bg-transparent text-[13px] text-[#1a1a2e] outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="flex shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#7a8899]"
            >
              <IconClose />
            </button>
          )}
        </div>
        <div className="shrink-0 text-xs text-[#7a8899]">
          {filtered.length} dari {daftarPengajuan.length} pengajuan
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-[56px_24px] text-[#7a8899]">
            <div className="text-[#1a4e8f] opacity-35">
              <IconFileText />
            </div>
            <div className="text-sm font-semibold text-[#8a96a3]">
              {daftarPengajuan.length === 0
                ? "Belum ada pengajuan"
                : "Tidak ada pengajuan yang cocok"}
            </div>
            <div className="text-xs text-[#b0bac5]">
              {daftarPengajuan.length === 0
                ? "Belum ada formulir yang masuk dari OPD."
                : "Coba ubah kata kunci pencarian."}
            </div>
          </div>
        ) : (
          <>
            {/* Kartu — tampilan mobile (< sm) */}
            <div className="divide-y divide-[#e2e8f2] sm:hidden">
              {filtered.map((p, idx) => (
                <PengajuanRowCardMobile
                  key={p.id}
                  p={p}
                  no={idx + 1}
                  onVerifikasi={() => setSelected(p)}
                />
              ))}
            </div>

            {/* Tabel — tampilan tablet & desktop (>= sm) */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#e2e8f2] bg-[#263e6e]">
                    {[
                      "No",
                      "Pengajuan",
                      "Piutang & Nominal",
                      "Status",
                      "Tgl Surat",
                      "Aksi",
                    ].map((label, idx) => (
                      <th
                        key={idx}
                        className="p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const isLast = idx === filtered.length - 1;
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors duration-150 hover:bg-[#fafbfc] ${
                          isLast ? "" : "border-b border-[#e2e8f2]"
                        }`}
                      >
                        {/* No */}
                        <td className="w-8 p-[12px_14px] text-xs font-semibold whitespace-nowrap text-[#7a8899]">
                          {idx + 1}
                        </td>

                        {/* Kolom gabungan: No Reg + OPD + Penanggung Jawab */}
                        <td className="p-[12px_14px]">
                          <div className="font-mono text-xs font-bold whitespace-nowrap text-[#1a4e8f]">
                            {p.nomorPengajuan}
                          </div>
                          <div className="mt-0.5 text-[13px] font-semibold whitespace-nowrap text-[#1a1a2e]">
                            {p.namaOPD}
                          </div>
                          <div className="mt-px text-[11px] text-[#7a8899]">
                            {p.namaPenanggungJawab}
                          </div>
                        </td>

                        {/* Kolom gabungan: Jenis + Nominal + Jenis Penghapusan */}
                        <td className="p-[12px_14px] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-[#1a1a2e]">
                              {formatRupiah(p.totalNilaiPiutang)}
                            </span>
                            <JenisPenghapusanBadge jenis={p.jenisPenghapusan} />
                          </div>
                          <div className="mt-0.5 text-xs text-[#5a6474]">
                            {labelJenisPiutang(p.jenisPiutang)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-[12px_14px] whitespace-nowrap">
                          <StatusBadge status={p.status} />
                        </td>

                        {/* Tgl Surat */}
                        <td className="p-[12px_14px] text-xs whitespace-nowrap text-[#7a8899]">
                          {formatTanggal(p.tanggalSurat)}
                        </td>

                        {/* Tombol Aksi — hanya muncul untuk status "diajukan" */}
                        <td className="p-[12px_14px] whitespace-nowrap">
                          {p.status === "diajukan" ? (
                            <button
                              onClick={() => setSelected(p)}
                              className="rounded-sm bg-[#1a4e8f] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2d63a8]"
                            >
                              Verifikasi
                            </button>
                          ) : (
                            <span className="text-xs text-[#b0bac5]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Riwayat verifikasi sesi ini ── */}
      {riwayat.length > 0 && (
        <div className="mt-6">
          <div className="mb-2.5 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
            Riwayat Verifikasi (Sesi Ini)
          </div>
          <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white">
            {/* Kartu — tampilan mobile (< sm) */}
            <div className="divide-y divide-[#e2e8f2] sm:hidden">
              {riwayat.map(({ pengajuan, keputusan, catatan }) => (
                <RiwayatRowCardMobile
                  key={pengajuan.id}
                  pengajuan={pengajuan}
                  keputusan={keputusan}
                  catatan={catatan}
                />
              ))}
            </div>

            {/* Tabel — tampilan tablet & desktop (>= sm) */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-[13px]">
                <tbody>
                  {riwayat.map(({ pengajuan, keputusan, catatan }, idx) => (
                    <tr
                      key={pengajuan.id}
                      className={
                        idx === riwayat.length - 1
                          ? ""
                          : "border-b border-[#e2e8f2]"
                      }
                    >
                      <td className="p-[12px_14px] font-mono text-xs font-bold whitespace-nowrap text-[#1a4e8f]">
                        {pengajuan.nomorPengajuan}
                      </td>
                      <td className="p-[12px_14px] text-[13px] font-semibold whitespace-nowrap text-[#1a1a2e]">
                        {pengajuan.namaOPD}
                      </td>
                      <td className="p-[12px_14px] whitespace-nowrap">
                        <StatusBadge status={keputusan} />
                      </td>
                      <td className="p-[12px_14px] text-xs text-[#5a6474]">
                        {catatan || (
                          <span className="text-[#b0bac5] italic">
                            Tidak ada catatan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
