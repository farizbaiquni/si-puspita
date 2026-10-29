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
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import type {
  TelaahInternalRecord,
  TelaahLogEntry,
  TelaahMilestone,
  TelaahTahap,
} from "@/types/telaah-internal";
import { TELAAH_MILESTONE_LABEL } from "@/types/telaah-internal";
import { REVIU_STATUS_BADGE } from "@/types/reviu-inspektorat";

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

function formatTanggalSingkat(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function formatTanggalWaktu(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB"
  );
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

function nomorTampilan(p: FormulirPenghapusanPiutangOPDRecord): string {
  if (p.status === "teregistrasi") {
    return p.nomorRegistrasi || p.nomorPengajuan || "-";
  }
  return p.nomorPengajuan || "-";
}

/** Label level pelaku telaah (menerima "admin" juga). */
function labelOlehLevel(level: TelaahLogEntry["olehTelaahLevel"]): string {
  if (level === "admin") return "Admin BPKAD";
  if (level === "kasubbid") return "Kasubbid";
  if (level === "kabid") return "Kabid";
  if (level === "sekban") return "Sekban";
  return level;
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
// Group key — KATEGORI grup tabel
//
// Kategori = StatusFormulir + "menunggu_reviu".
// Pengajuan dengan reviuInspektoratStatus === "MENUNGGU_REVIU" masuk grup
// "menunggu_reviu" (BUKAN "teregistrasi"), supaya satu pengajuan tidak
// muncul di dua grup. Statusnya di database tetap "teregistrasi", tapi
// secara visual/kategori sudah pindah ke grup tersendiri.
// ─────────────────────────────────────────────────────────────────────────────

type GroupKey = StatusFormulir | "menunggu_reviu";

const GROUP_ORDER: GroupKey[] = [
  "diajukan",
  "revisi",
  "teregistrasi",
  "menunggu_reviu",
];

function groupKeyOf(p: FormulirPenghapusanPiutangOPDRecord): GroupKey {
  if (p.reviuInspektoratStatus === "MENUNGGU_REVIU") return "menunggu_reviu";
  return p.status;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dokumen helpers
// ─────────────────────────────────────────────────────────────────────────────

interface DokumenEntry {
  key: string;
  label: string;
  file: UploadedFileRef | null;
}

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

function ambilFile(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
  key: keyof FormulirPenghapusanPiutangOPDRecord,
): UploadedFileRef | null {
  const value = pengajuan[key];
  return value && typeof value === "object" && "url" in value
    ? (value as UploadedFileRef)
    : null;
}

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

function buildDokumenTampilan(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
): DokumenTampilanEntry[] {
  return [
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
}

function flattenDokumenTampilan(
  tampilan: DokumenTampilanEntry[],
): DokumenEntry[] {
  return tampilan.flatMap((t) => (t.type === "single" ? [t.entry] : t.anak));
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge config — Status verifikasi
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
    label: "Revisi",
    cls: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dot: "bg-[#f97316]",
  },
  teregistrasi: {
    label: "Teregistrasi",
    cls: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
    dot: "bg-[#10b981]",
  },
};

/** Badge config per kategori grup — tambah "menunggu_reviu" di atas 3 status. */
const GROUP_BADGE: Record<
  GroupKey,
  { label: string; cls: string; dot: string }
> = {
  diajukan: STATUS_BADGE.diajukan,
  revisi: STATUS_BADGE.revisi,
  teregistrasi: STATUS_BADGE.teregistrasi,
  menunggu_reviu: REVIU_STATUS_BADGE.MENUNGGU_REVIU,
};

const StatusBadge: React.FC<{ status: StatusFormulir }> = ({ status }) => {
  const cfg = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.25 rounded-sm border px-2.25 py-0.75 text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const ReviuBadge: React.FC = () => {
  const cfg = REVIU_STATUS_BADGE.MENUNGGU_REVIU;
  return (
    <span
      className={`inline-flex items-center gap-1.25 rounded-sm border px-2.25 py-0.75 text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.cls}`}
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
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase ${
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
// Badge config — Tahap Telaah Internal
// ─────────────────────────────────────────────────────────────────────────────

const TAHAP_TELAAH_BADGE: Record<
  TelaahTahap,
  { label: string; cls: string; dot: string }
> = {
  MENUNGGU_TELAAH_KASUBBID: {
    label: "Menunggu Telaah Kasubbid",
    cls: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    dot: "bg-[#3b82f6]",
  },
  MENUNGGU_TELAAH_KABID: {
    label: "Menunggu Telaah Kabid",
    cls: "bg-[#f3efff] text-[#5b21b6] border-[#ddd0fb]",
    dot: "bg-[#7c3aed]",
  },
  MENUNGGU_TELAAH_SEKBAN: {
    label: "Menunggu Telaah Sekban",
    cls: "bg-[#fff1f2] text-[#9f1239] border-[#fecdd3]",
    dot: "bg-[#f43f5e]",
  },
  MENUNGGU_REVISI_KABID: {
    label: "Menunggu Diteruskan Kabid",
    cls: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dot: "bg-[#f97316]",
  },
  MENUNGGU_REVISI_KASUBBID: {
    label: "Menunggu Diteruskan Kasubbid",
    cls: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dot: "bg-[#f97316]",
  },
  MENUNGGU_ADMIN_KIRIM_REVISI: {
    label: "Menunggu Kirim ke OPD",
    cls: "bg-[#fff7ed] text-[#9a3412] border-[#fdba74]",
    dot: "bg-[#ea580c]",
  },
  MENUNGGU_REVISI_OPD: {
    label: "Revisi Telaah Internal",
    cls: "bg-[#fff7ed] text-[#9a3412] border-[#fdba74]",
    dot: "bg-[#ea580c]",
  },
  SELESAI: {
    label: "Telaah Internal Selesai",
    cls: "bg-[#eef2ff] text-[#3730a3] border-[#c7d2fe]",
    dot: "bg-[#6366f1]",
  },
};

const TahapTelaahBadge: React.FC<{ tahap: TelaahTahap }> = ({ tahap }) => {
  const cfg = TAHAP_TELAAH_BADGE[tahap];
  return (
    <span
      className={`inline-flex items-center gap-1.25 rounded-sm border px-2.25 py-0.75 text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
      {cfg.label}
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

const IconArrowRight = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
  >
    <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClock = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5v3.5l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconAlert = () => (
  <svg
    width="16"
    height="16"
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

const IconShield = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M8 1.5L2.5 3.5v5c0 4 2.5 6.5 5.5 7.5 3-1 5.5-3.5 5.5-7.5v-5L8 1.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5.5 8l2 2 3.5-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Ikon khusus panel Telaah Internal ──

const IconMilestoneCheck = () => (
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

const IconMilestoneX = () => (
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

const IconMilestoneArrow = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconMilestoneSend = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
  >
    <path
      d="M2 8L14 2l-5 12-2-4-5-2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconMilestoneFile = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
  >
    <path
      d="M9.5 2H4a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5V6L9.5 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9.5 2v4h4" strokeLinecap="round" />
  </svg>
);

const IconMilestoneRefresh = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
  >
    <path d="M3.5 8a4.5 4.5 0 117.5 3.5" strokeLinecap="round" />
    <path
      d="M13 3v3.5h-3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(-0.5 0)"
    />
  </svg>
);

const SortIndicator: React.FC<{ active: boolean; dir: "asc" | "desc" }> = ({
  active,
  dir,
}) => {
  if (!active) {
    return <span className="ml-1 inline-block text-[9px] opacity-40">⇅</span>;
  }
  return (
    <span className="ml-1 inline-block text-[9px] text-[#fbbf24]">
      {dir === "asc" ? "▲" : "▼"}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Modal Preview PDF
// ─────────────────────────────────────────────────────────────────────────────

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
  nomor: number | null;
  dok: DokumenEntry;
  onPreview: () => void;
  wajib?: boolean;
  keterangan?: string;
}> = ({ nomor, dok, onPreview, wajib, keterangan }) => {
  const belumUpload = !dok.file;

  return (
    <div
      className={`flex items-center gap-3 rounded-xs border px-3 py-2.5 ${
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
          className={`mb-0.5 text-xs leading-snug font-semibold ${
            belumUpload ? "text-[#565c62]" : "text-[#003e8a]"
          }`}
        >
          {dok.label}
          {wajib && <span className="text-red-500"> *</span>}
          {keterangan && (
            <span className="ml-1 font-normal text-[#6c747c]">
              (<span className="italic">{keterangan}</span>)
            </span>
          )}
        </div>
        <div
          className={`text-xs ${
            belumUpload ? "text-[#c0392b] italic" : "text-[#7a8899]"
          }`}
        >
          {belumUpload ? "Tidak diupload" : formatUkuran(dok.file!.ukuranBytes)}
        </div>
      </div>
      {!belumUpload && (
        <button
          onClick={onPreview}
          className="flex shrink-0 items-center gap-1.5 rounded-xs border border-[#e2e8f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a4e8f] transition hover:cursor-pointer hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
        >
          <IconEye />
          Lihat PDF
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PANEL: Telaah Internal
// ─────────────────────────────────────────────────────────────────────────────

const TAHAP_TELAAH_HERO: Record<
  TelaahTahap,
  {
    label: string;
    pemegang: string;
    bg: string;
    border: string;
    accentBg: string;
    textStrong: string;
  }
> = {
  MENUNGGU_TELAAH_KASUBBID: {
    label: "Menunggu Telaah Kasubbid",
    pemegang: "Kasubbid",
    bg: "bg-[#eff6ff]",
    border: "border-[#bfdbfe]",
    accentBg: "bg-[#3b82f6]",
    textStrong: "text-[#1d4ed8]",
  },
  MENUNGGU_TELAAH_KABID: {
    label: "Menunggu Telaah Kabid",
    pemegang: "Kabid",
    bg: "bg-[#f3efff]",
    border: "border-[#ddd0fb]",
    accentBg: "bg-[#7c3aed]",
    textStrong: "text-[#5b21b6]",
  },
  MENUNGGU_TELAAH_SEKBAN: {
    label: "Menunggu Telaah Sekban",
    pemegang: "Sekban",
    bg: "bg-[#fff1f2]",
    border: "border-[#fecdd3]",
    accentBg: "bg-[#f43f5e]",
    textStrong: "text-[#9f1239]",
  },
  MENUNGGU_REVISI_KABID: {
    label: "Menunggu Diteruskan Kabid",
    pemegang: "Kabid",
    bg: "bg-[#fff7ed]",
    border: "border-[#fed7aa]",
    accentBg: "bg-[#f97316]",
    textStrong: "text-[#9a3412]",
  },
  MENUNGGU_REVISI_KASUBBID: {
    label: "Menunggu Diteruskan Kasubbid",
    pemegang: "Kasubbid",
    bg: "bg-[#fff7ed]",
    border: "border-[#fed7aa]",
    accentBg: "bg-[#f97316]",
    textStrong: "text-[#9a3412]",
  },
  MENUNGGU_ADMIN_KIRIM_REVISI: {
    label: "Menunggu Kirim ke OPD",
    pemegang: "Admin BPKAD",
    bg: "bg-[#fff7ed]",
    border: "border-[#fdba74]",
    accentBg: "bg-[#ea580c]",
    textStrong: "text-[#9a3412]",
  },
  MENUNGGU_REVISI_OPD: {
    label: "Revisi Telaah Internal",
    pemegang: "OPD",
    bg: "bg-[#fff7ed]",
    border: "border-[#fdba74]",
    accentBg: "bg-[#ea580c]",
    textStrong: "text-[#9a3412]",
  },
  SELESAI: {
    label: "Telaah Internal Selesai",
    pemegang: "—",
    bg: "bg-[#ecfdf5]",
    border: "border-[#a7f3d0]",
    accentBg: "bg-[#10b981]",
    textStrong: "text-[#065f46]",
  },
};

const MILESTONE_VISUAL: Record<
  TelaahMilestone,
  { bg: string; icon: React.ReactNode }
> = {
  DIAJUKAN: { bg: "bg-[#1a4e8f]", icon: <IconMilestoneFile /> },
  SUDAH_TELAAH_KASUBBID: {
    bg: "bg-emerald-500",
    icon: <IconMilestoneCheck />,
  },
  SUDAH_TELAAH_KABID: { bg: "bg-purple-500", icon: <IconMilestoneCheck /> },
  SUDAH_TELAAH_SEKBAN: { bg: "bg-rose-500", icon: <IconMilestoneCheck /> },
  REVISI_DARI_KASUBBID: { bg: "bg-orange-500", icon: <IconMilestoneX /> },
  REVISI_DARI_KABID: { bg: "bg-orange-500", icon: <IconMilestoneX /> },
  REVISI_DARI_SEKBAN: { bg: "bg-orange-500", icon: <IconMilestoneX /> },
  DITERUSKAN_KASUBBID: {
    bg: "bg-amber-500",
    icon: <IconMilestoneArrow />,
  },
  DITERUSKAN_KABID: {
    bg: "bg-amber-500",
    icon: <IconMilestoneArrow />,
  },
  DIKIRIM_KE_OPD: { bg: "bg-amber-600", icon: <IconMilestoneSend /> },
  SIKLUS_BARU_DIMULAI: {
    bg: "bg-[#1a4e8f]",
    icon: <IconMilestoneRefresh />,
  },
};

const TelaahTimeline: React.FC<{ entries: TelaahLogEntry[] }> = ({
  entries,
}) => {
  return (
    <div>
      {entries.map((entry, idx) => {
        const visual = MILESTONE_VISUAL[entry.milestone];
        const isLast = idx === entries.length - 1;
        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${visual.bg}`}
              >
                {visual.icon}
              </div>
              {!isLast && (
                <div className="my-1 w-px flex-1 bg-[#e2e8f2]" aria-hidden />
              )}
            </div>

            <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-4"}`}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[12.5px] font-semibold text-[#1a1a2e]">
                  {TELAAH_MILESTONE_LABEL[entry.milestone]}
                </span>
                {isLast && (
                  <span className="rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-1.5 py-px text-[9px] font-bold tracking-wide text-[#1a4e8f] uppercase">
                    Terakhir
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[10.5px] text-[#7a8899]">
                {formatTanggalWaktu(entry.timestamp)} · oleh{" "}
                <span className="font-mono font-medium text-[#5a6474]">
                  {entry.olehUsername}
                </span>{" "}
                ({labelOlehLevel(entry.olehTelaahLevel)})
              </div>
              {entry.catatan && entry.catatan.trim() && (
                <div className="mt-1.5 rounded-sm border border-[#eef1f5] bg-[#f7f8fa] px-2.5 py-2 text-[11.5px] leading-relaxed whitespace-pre-line text-[#3a4454]">
                  {entry.catatan}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TelaahInternalPanel: React.FC<{ telaah: TelaahInternalRecord }> = ({
  telaah,
}) => {
  const hero = TAHAP_TELAAH_HERO[telaah.tahapSaatIni];

  if (!hero) return null;

  const entryTerakhir = telaah.riwayat[telaah.riwayat.length - 1];

  return (
    <div
      className={`overflow-hidden rounded-sm border bg-white ${hero.border}`}
    >
      <div className={`px-5 py-4 ${hero.bg}`}>
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-white shadow-sm ${hero.accentBg}`}
          >
            {telaah.selesai ? <IconCheck /> : <IconClock />}
          </span>
          <div className="min-w-0 flex-1">
            <div
              className={`text-[15px] leading-tight font-bold ${hero.textStrong}`}
            >
              {hero.label}
            </div>
            {!telaah.selesai && (
              <div className="mt-1 text-[12px] text-[#5a6474]">
                Sedang di:{" "}
                <span className="font-semibold">{hero.pemegang}</span>
              </div>
            )}
            {entryTerakhir && (
              <div className="mt-0.5 text-[11px] text-[#7a8899]">
                Sejak {formatTanggalWaktu(entryTerakhir.timestamp)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        <div>
          <div className="mb-3 text-[10.5px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
            Riwayat Telaah
          </div>
          {telaah.riwayat.length === 0 ? (
            <div className="rounded-sm border border-dashed border-[#e2e8f2] py-5 text-center text-[12px] text-[#b0bac5] italic">
              Belum ada riwayat.
            </div>
          ) : (
            <TelaahTimeline entries={telaah.riwayat} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Detail Pengajuan (panel)
// ─────────────────────────────────────────────────────────────────────────────

const PanelDetail: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  telaah?: TelaahInternalRecord;
  onBack: () => void;
}> = ({ pengajuan, telaah, onBack }) => {
  const [previewDoc, setPreviewDoc] = useState<DokumenEntry | null>(null);

  const dokumenTampilan = useMemo(
    () => buildDokumenTampilan(pengajuan),
    [pengajuan],
  );
  const dokumen = useMemo(
    () => flattenDokumenTampilan(dokumenTampilan),
    [dokumenTampilan],
  );
  const sudahDiverifikasi = pengajuan.status !== "diajukan";

  return (
    <div className="mx-auto w-full max-w-400">
      {previewDoc?.file && (
        <ModalPreviewPDF
          namaFile={previewDoc.file.namaFile}
          url={previewDoc.file.url}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      <button
        onClick={onBack}
        className="group mb-4 inline-flex cursor-pointer items-center gap-2 rounded-xs border border-[#e2e8f2] bg-white py-1.5 pr-3.5 pl-1.5 text-[12.5px] font-semibold text-[#5a6474] shadow-xs transition-all duration-150 hover:-translate-x-0.5 hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f] hover:shadow-sm active:translate-x-0"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-[#f0f4fb] text-[#1a4e8f] transition-colors duration-150 group-hover:bg-[#1a4e8f] group-hover:text-white">
          <IconArrowLeft />
        </span>
        Kembali ke daftar
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-xs border border-[#e2e8f2] bg-white shadow-sm">
            <div
              className="h-1 w-full bg-linear-to-r from-[#1a4e8f] via-[#c8a020] to-[#0f9b6e]"
              aria-hidden
            />

            <div className="relative bg-linear-to-br from-[#fafbfd] via-white to-[#fafbfd] px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#eff6ff] text-[#1a4e8f]">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="M9.5 2H4a1.5 1.5 0 00-1.5 1.5v9A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5V6L9.5 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9.5 2v4h4M5.5 8.5h5M5.5 11h3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-[#7a8899] uppercase">
                      Nomor Surat
                    </span>
                  </div>
                  <div className="font-mono text-[19px] leading-tight font-bold tracking-tight text-[#1a1a2e]">
                    {pengajuan.nomorSurat || "-"}
                  </div>
                  {pengajuan.nomorRegistrasi && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#a7f3d0] bg-[#ecfdf5] px-2.5 py-1.5 shadow-xs">
                      <span className="flex h-4 w-4 items-center justify-center rounded-xs bg-[#10b981] text-white">
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            d="M3 8l3.5 3.5L13 4.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="text-[9.5px] font-bold tracking-[0.08em] text-[#065f46] uppercase">
                        No. Registrasi
                      </span>
                      <span className="font-mono text-[12.5px] font-bold text-[#065f46]">
                        {pengajuan.nomorRegistrasi}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <JenisPenghapusanBadge jenis={pengajuan.jenisPenghapusan} />
                  <StatusBadge status={pengajuan.status} />
                  {telaah && <TahapTelaahBadge tahap={telaah.tahapSaatIni} />}
                  {pengajuan.reviuInspektoratStatus === "MENUNGGU_REVIU" && (
                    <ReviuBadge />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5 border-t border-[#eef1f5] px-5 py-5">
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Nama OPD",
                    value: pengajuan.namaOPD,
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M3.5 14.5V2.5a1 1 0 011-1h7a1 1 0 011 1v12"
                          strokeLinecap="round"
                        />
                        <path
                          d="M2 14.5h12M6 5.5h1M9 5.5h1M6 8.5h1M9 8.5h1M6 11.5h1M9 11.5h1"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Tanggal Surat",
                    value: formatTanggal(pengajuan.tanggalSurat),
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" />
                        <path
                          d="M2 6.5h12M5 1.5v3M11 1.5v3"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Jenis Piutang",
                    value: labelJenisPiutang(pengajuan.jenisPiutang),
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M8.5 2H3a1 1 0 00-1 1v5.5L9 15a1 1 0 001.4 0l4.1-4.1a1 1 0 000-1.4L8.5 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="5"
                          cy="5"
                          r="1"
                          fill="currentColor"
                          stroke="none"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Jenis Penghapusan",
                    value: pengajuan.jenisPenghapusan || "-",
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M8 2L1.5 5.5 8 9l6.5-3.5L8 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M1.5 8L8 11.5 14.5 8M1.5 11L8 14.5 14.5 11"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: "Jumlah Debitur",
                    value: pengajuan.jumlahDebitur,
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="6" cy="5.5" r="2.5" />
                        <path
                          d="M1.5 14c0-2.5 2-4.5 4.5-4.5S10.5 11.5 10.5 14"
                          strokeLinecap="round"
                        />
                        <path
                          d="M11 5.5a2.5 2.5 0 110 5M12 9.5c1.5.5 2.5 2 2.5 4.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                ].map(({ label, value, icon }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-md border border-transparent px-2.5 py-2 transition-all duration-150 hover:border-[#eef1f5] hover:bg-[#fafbfc]"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f0f4fb] text-[#1a4e8f]">
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 text-[10px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                        {label}
                      </div>
                      <div className="text-[13px] leading-snug font-medium text-[#1a1a2e]">
                        {value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-md border border-[#dbe6f7] bg-linear-to-br from-[#f4f8fd] via-white to-[#f4fbf8] p-4">
                <div
                  className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[#1a4e8f]/5"
                  aria-hidden
                />
                <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "Total Nilai Piutang",
                      value: formatRupiah(pengajuan.totalNilaiPiutang),
                      accent: "bg-[#eff6ff] text-[#1a4e8f]",
                      valueClass: "text-[#1a4e8f]",
                      icon: (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <ellipse cx="6" cy="4.5" rx="4" ry="2.3" />
                          <path
                            d="M2 4.5v3c0 1.3 1.8 2.3 4 2.3s4-1 4-2.3v-3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M2 7.5v3c0 1.3 1.8 2.3 4 2.3 1.5 0 2.8-.4 3.5-1.1"
                            strokeLinecap="round"
                          />
                          <ellipse cx="11" cy="9.5" rx="3" ry="1.8" />
                        </svg>
                      ),
                    },
                    {
                      label: "Jumlah Angsuran",
                      value: formatRupiah(pengajuan.nilaiRekapitulasiAngsuran),
                      accent: "bg-[#ecfdf5] text-[#0f6e56]",
                      valueClass: "text-[#0f6e56]",
                      icon: (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            d="M3 2h10v12l-2-1.2-2 1.2-2-1.2-2 1.2L3 14V2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6 6h4M6 8.5h4M6 11h2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      ),
                    },
                  ].map(({ label, value, accent, valueClass, icon }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md shadow-xs ${accent}`}
                      >
                        {icon}
                      </span>
                      <div className="min-w-0">
                        <div className="mb-0.5 text-[10px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                          {label}
                        </div>
                        <div
                          className={`text-[16px] leading-tight font-bold tracking-tight tabular-nums ${valueClass}`}
                        >
                          {value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-[#eef1f5] bg-[#fafbfc] px-5 py-4">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="text-[10px] font-bold tracking-widest text-[#7a8899] uppercase">
                  Penanggung Jawab OPD
                </span>
                <span className="h-px flex-1 bg-[#e8edf4]" aria-hidden />
              </div>

              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xs bg-linear-to-br from-[#1a4e8f] to-[#0e3b6e] text-[14px] font-bold tracking-wide text-white shadow-md ring-4 ring-white">
                  {ambilInisial(pengajuan.namaPenanggungJawab)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] leading-tight font-bold text-[#1a1a2e]">
                    {pengajuan.namaPenanggungJawab}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-[#7a8899]">
                    {pengajuan.jabatan}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {telaah && <TelaahInternalPanel telaah={telaah} />}

          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            <div className="mb-3 text-[13px] font-bold tracking-[0.08em] text-[#31363d] uppercase">
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

        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white shadow-sm lg:sticky lg:top-4">
            <div className="relative flex items-center gap-2.5 border-b border-[#eef1f5] bg-linear-to-br from-[#fafbfd] to-white px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-linear-to-br from-[#1a4e8f] to-[#0e3b6e] text-white shadow-sm">
                <IconShield />
              </span>
              <span className="text-[11px] font-bold tracking-[0.08em] text-[#1a4e8f] uppercase">
                Status Verifikasi
              </span>
            </div>

            <div className="space-y-4 px-4 py-4">
              {!sudahDiverifikasi ? (
                <div className="flex flex-col items-center gap-2.5 rounded-xs border border-dashed border-[#dbe6f7] bg-[#fafbfc] py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xs bg-[#eff6ff] text-[#1a4e8f] shadow-xs ring-1 ring-[#dbe6f7]">
                    <IconClock />
                  </span>
                  <div className="text-[13px] font-bold text-[#1a4e8f]">
                    Belum diverifikasi
                  </div>
                  <div className="max-w-52 px-4 text-[11px] leading-relaxed text-[#7a8899]">
                    Pengajuan ini masih menunggu tindakan verifikator.
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`relative overflow-hidden rounded-xs border p-3.5 ${
                      pengajuan.status === "teregistrasi"
                        ? "border-[#a7f3d0] bg-linear-to-br from-[#ecfdf5] to-white"
                        : "border-[#fed7aa] bg-linear-to-br from-[#fff7ed] to-white"
                    }`}
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 ${
                        pengajuan.status === "teregistrasi"
                          ? "bg-[#10b981]"
                          : "bg-[#f97316]"
                      }`}
                      aria-hidden
                    />

                    <div className="relative flex items-start gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xs text-white shadow-sm ${
                          pengajuan.status === "teregistrasi"
                            ? "bg-[#10b981]"
                            : "bg-[#f97316]"
                        }`}
                      >
                        {pengajuan.status === "teregistrasi" ? (
                          <IconCheck />
                        ) : (
                          <IconAlert />
                        )}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.25 rounded-sm border px-2.25 py-0.75 text-[11px] font-semibold tracking-wide whitespace-nowrap ${
                              pengajuan.status === "teregistrasi"
                                ? "border-[#a7f3d0] bg-[#ecfdf5] text-black"
                                : STATUS_BADGE[pengajuan.status].cls
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                STATUS_BADGE[pengajuan.status].dot
                              }`}
                            />
                            {STATUS_BADGE[pengajuan.status].label}
                          </span>

                          {telaah && (
                            <TahapTelaahBadge tahap={telaah.tahapSaatIni} />
                          )}

                          {pengajuan.reviuInspektoratStatus ===
                            "MENUNGGU_REVIU" && <ReviuBadge />}
                        </div>

                        <div
                          className={`mt-2 text-[11px] leading-relaxed ${
                            pengajuan.status === "teregistrasi"
                              ? "text-black"
                              : "text-[#9a3412]"
                          }`}
                        >
                          {pengajuan.status === "teregistrasi"
                            ? "Pengajuan telah lolos verifikasi dan resmi teregistrasi."
                            : "Pengajuan dikembalikan untuk diperbaiki oleh OPD."}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xs bg-[#f0f4fb] text-[#1a4e8f]">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="8" cy="5.5" r="2.5" />
                          <path
                            d="M2.5 14c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                          Diverifikasi Oleh
                        </div>
                        <div className="mt-0.5 text-[13px] leading-snug font-medium text-[#1a1a2e]">
                          {pengajuan.verifikatorId || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xs bg-[#f0f4fb] text-[#1a4e8f]">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect
                            x="2"
                            y="3.5"
                            width="12"
                            height="10.5"
                            rx="1.5"
                          />
                          <path
                            d="M2 6.5h12M5 1.5v3M11 1.5v3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                          Tanggal Verifikasi
                        </div>
                        <div className="mt-0.5 text-[13px] leading-snug font-medium text-[#1a1a2e]">
                          {pengajuan.tanggalVerifikasi
                            ? formatTanggalWaktu(pengajuan.tanggalVerifikasi)
                            : "-"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs bg-[#f0f4fb] text-[#1a4e8f]">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              d="M13.5 8a5 5 0 01-5 5H4L1.5 15v-3.5a5 5 0 015-5h2a5 5 0 015 5z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <div className="text-[10px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                          Keterangan / Catatan
                        </div>
                      </div>
                      {pengajuan.catatanVerifikasi ? (
                        <div
                          className={`ml-9.5 rounded-xs border-l-[3px] bg-[#f9fafc] px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-line text-[#3a4454] ${
                            pengajuan.status === "revisi"
                              ? "border-l-[#f97316]"
                              : "border-l-[#10b981]"
                          }`}
                        >
                          {pengajuan.catatanVerifikasi}
                        </div>
                      ) : (
                        <div className="ml-9.5 text-[12.5px] text-[#b0bac5] italic">
                          Tidak ada catatan
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-[#eef1f5] bg-[#fafbfc] px-4 py-3">
              <button
                onClick={onBack}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-[#e2e8f2] bg-white py-2.5 text-[13px] font-semibold text-[#5a6474] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
              >
                <IconArrowLeft />
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Kartu baris — versi mobile (< sm)
// ─────────────────────────────────────────────────────────────────────────────

const PengajuanRowCardMobile: React.FC<{
  p: FormulirPenghapusanPiutangOPDRecord;
  tahap?: TelaahTahap;
  no: number;
  onLihatDetail: () => void;
}> = ({ p, tahap, no, onLihatDetail }) => (
  <div className="space-y-2.5 p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="font-mono text-[11px] font-bold whitespace-nowrap text-[#1a4e8f]">
          #{no} · {nomorTampilan(p)}
        </div>
        <div className="mt-0.5 truncate text-[14px] font-bold text-[#1a1a2e]">
          {p.namaOPD}
        </div>
        <div className="mt-px truncate text-[11px] text-[#7a8899]">
          {p.namaPenanggungJawab}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={p.status} />
        {tahap && <TahapTelaahBadge tahap={tahap} />}
        {p.reviuInspektoratStatus === "MENUNGGU_REVIU" && <ReviuBadge />}
      </div>
    </div>

    <div>
      <div className="text-[13.5px] font-bold text-[#1a1a2e]">
        {formatRupiah(p.totalNilaiPiutang)}
      </div>
      <div className="mt-1">
        <JenisPenghapusanBadge jenis={p.jenisPenghapusan} />
      </div>
      <div className="mt-0.5 text-[11px] text-[#5a6474]">
        {labelJenisPiutang(p.jenisPiutang)}
      </div>
    </div>

    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="shrink-0 font-semibold text-[#3a4454]">
        📅 {formatTanggal(p.tanggalSurat)}
      </span>
      <span className="truncate font-medium text-[#7a8899]">
        Input: {formatTanggal(p.createdAt)}
      </span>
    </div>

    <button
      onClick={onLihatDetail}
      className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-[#1a4e8f] py-2 text-xs font-semibold text-white transition hover:bg-[#2d63a8]"
    >
      Lihat Detail
      <IconArrowRight />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface LihatDaftarPengajuanAdminProps {
  semuaPengajuan?: FormulirPenghapusanPiutangOPDRecord[];
}

const STATUS_PRIORITY: Record<StatusFormulir, number> = {
  diajukan: 0,
  revisi: 1,
  teregistrasi: 2,
};

interface PengajuanGroup {
  key: GroupKey;
  items: FormulirPenghapusanPiutangOPDRecord[];
}

type SortKey = "tanggalSurat" | "createdAt";

interface SortConfig {
  key: SortKey;
  dir: "asc" | "desc";
}

function LihatDaftarPengajuanAdmin({
  semuaPengajuan,
}: LihatDaftarPengajuanAdminProps = {}) {
  const { data: dataStore } = usePengajuanStore();
  const { data: telaahStore } = useTelaahInternalStore();

  const telaahByPengajuanId = useMemo(() => {
    const map = new Map<string, TelaahInternalRecord>();
    telaahStore.forEach((t) => {
      map.set(t.pengajuanId, t);
    });
    return map;
  }, [telaahStore]);

  // State filter — pakai GroupKey (bukan cuma StatusFormulir), karena
  // "menunggu_reviu" adalah kategori tambahan yang bukan status di DB.
  const [activeStatuses, setActiveStatuses] = useState<Set<GroupKey>>(
    new Set(GROUP_ORDER),
  );
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selected, setSelected] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);

  // Collapsed state per grup:
  //  - `undefined` = user belum pernah toggle → default collapse kalau kosong
  //  - `true`      = user collapse manual → tetap collapse
  //  - `false`     = user expand manual  → tetap expand
  const [collapsedGroups, setCollapsedGroups] = useState<
    Partial<Record<GroupKey, boolean>>
  >({});

  const isGroupCollapsed = (key: GroupKey, itemCount: number): boolean => {
    const explicit = collapsedGroups[key];
    if (explicit !== undefined) return explicit;
    return itemCount === 0; // kosong = collapse default
  };

  const toggleGroup = (key: GroupKey, itemCount: number) => {
    const current = isGroupCollapsed(key, itemCount);
    setCollapsedGroups((prev) => ({ ...prev, [key]: !current }));
  };

  const daftarPengajuan = useMemo(() => {
    const sumber = semuaPengajuan ?? dataStore;
    return [...sumber].sort((a, b) => {
      const priorityDiff =
        STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [semuaPengajuan, dataStore]);

  // Stats per-kategori (bukan per status DB) — cocok dengan chip filter
  // dan header grup.
  const countByGroup = useMemo(() => {
    const counts: Record<GroupKey, number> = {
      diajukan: 0,
      revisi: 0,
      teregistrasi: 0,
      menunggu_reviu: 0,
    };
    for (const p of daftarPengajuan) {
      counts[groupKeyOf(p)]++;
    }
    return counts;
  }, [daftarPengajuan]);

  const toggleStatus = (key: GroupKey) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (next.size === 0) return new Set(GROUP_ORDER);
      return next;
    });
  };

  const resetFilter = () => {
    setActiveStatuses(new Set(GROUP_ORDER));
    setSearch("");
    setSortConfig(null);
  };

  const isFilterAktif =
    activeStatuses.size < GROUP_ORDER.length ||
    search.trim().length > 0 ||
    sortConfig !== null;

  const filtered = useMemo(() => {
    return daftarPengajuan.filter((p) => {
      if (!activeStatuses.has(groupKeyOf(p))) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.nomorPengajuan.toLowerCase().includes(q) ||
          p.nomorSurat.toLowerCase().includes(q) ||
          (p.nomorRegistrasi?.toLowerCase().includes(q) ?? false) ||
          p.namaOPD.toLowerCase().includes(q) ||
          p.namaPenanggungJawab.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [daftarPengajuan, activeStatuses, search]);

  const groupedPengajuan = useMemo<PengajuanGroup[]>(() => {
    return GROUP_ORDER.map((key) => {
      const items = filtered.filter((p) => groupKeyOf(p) === key);
      if (sortConfig) {
        items.sort((a, b) => {
          const va = a[sortConfig.key] || "";
          const vb = b[sortConfig.key] || "";
          const cmp = String(va).localeCompare(String(vb));
          return sortConfig.dir === "asc" ? cmp : -cmp;
        });
      } else {
        items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }
      return { key, items };
    }).filter((group) => group.items.length > 0 || !search);
  }, [filtered, sortConfig, search]);

  const handleSortClick = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: "desc" };
    });
  };

  if (selected) {
    return (
      <PanelDetail
        pengajuan={selected}
        telaah={telaahByPengajuanId.get(selected.id)}
        onBack={() => setSelected(null)}
      />
    );
  }

  // Config kartu statis ringkasan (4 kartu — sesuai 4 kategori).
  const statusCards: {
    key: GroupKey;
    label: string;
    count: number;
    icon: React.ReactNode;
    accentClass: string;
    bgClass: string;
    borderClass: string;
    progressColor: string;
  }[] = [
    {
      key: "diajukan",
      label: "Menunggu Verifikasi",
      count: countByGroup.diajukan,
      icon: <IconClock />,
      accentClass: "bg-[#1a4e8f]",
      bgClass: "bg-[#e8f0fb]",
      borderClass: "border-[#c8d9f5]",
      progressColor: "bg-[#1a4e8f]",
    },
    {
      key: "revisi",
      label: "Perlu Revisi",
      count: countByGroup.revisi,
      icon: <IconAlert />,
      accentClass: "bg-[#c0392b]",
      bgClass: "bg-[#fef2f2]",
      borderClass: "border-[#fecaca]",
      progressColor: "bg-[#c0392b]",
    },
    {
      key: "teregistrasi",
      label: "Teregistrasi",
      count: countByGroup.teregistrasi,
      icon: <IconCheck />,
      accentClass: "bg-[#0f9b6e]",
      bgClass: "bg-[#e6f7f2]",
      borderClass: "border-[#a7e8d4]",
      progressColor: "bg-[#0f9b6e]",
    },
    {
      key: "menunggu_reviu",
      label: "Menunggu Reviu Inspektorat",
      count: countByGroup.menunggu_reviu,
      icon: <IconShield />,
      accentClass: "bg-[#f59e0b]",
      bgClass: "bg-[#fffbeb]",
      borderClass: "border-[#fde68a]",
      progressColor: "bg-[#f59e0b]",
    },
  ];

  return (
    <div className="font-inherit mx-auto w-full max-w-400">
      {/* ══════════ Summary Cards ══════════ */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => {
          const percent =
            daftarPengajuan.length === 0
              ? 0
              : Math.round((card.count / daftarPengajuan.length) * 100);

          return (
            <div
              key={card.key}
              className={`flex min-w-0 flex-col gap-3 rounded-sm border px-4 py-3.5 ${card.bgClass} ${card.borderClass}`}
            >
              <div className="flex w-full items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-white ${card.accentClass}`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xl leading-tight font-bold text-[#1a1a2e]">
                    {card.count}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[#7a8899]">
                    {card.label}
                  </div>
                </div>
              </div>

              <div className="w-full">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full transition-all duration-500 ${card.progressColor}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-end text-[10px] text-[#7a8899]">
                  <span className="font-bold">{percent}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════ Search bar ══════════ */}
      <div className="mb-3 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[10px_14px] sm:flex-row sm:items-center">
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.5 sm:min-w-40 sm:flex-1">
          <span className="shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari Nomor Registrasi, Nomor Surat, nama OPD, atau penanggung jawab…"
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
        <div className="flex shrink-0 items-center gap-2">
          {isFilterAktif && (
            <button
              onClick={resetFilter}
              className="rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7a8899] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
            >
              Reset Filter
            </button>
          )}
          <span className="text-xs text-[#7a8899]">
            {filtered.length} dari {daftarPengajuan.length}
          </span>
        </div>
      </div>

      {/* ══════════ Filter Chips ══════════ */}
      <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
          Filter:
        </span>
        {GROUP_ORDER.map((key) => {
          const isActive = activeStatuses.has(key);
          const cfg = GROUP_BADGE[key];
          const count = countByGroup[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleStatus(key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                isActive
                  ? cfg.cls
                  : "border-[#e2e8f2] bg-white text-[#b0bac5] hover:border-[#d0d7de]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot} ${
                  isActive ? "" : "opacity-40"
                }`}
              />
              {cfg.label}
              <span
                className={`rounded-full px-1.5 py-px text-[9.5px] font-bold ${
                  isActive
                    ? "bg-white/60 text-current"
                    : "bg-[#f0f4fb] text-[#b0bac5]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════ Tabel ══════════ */}
      <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-[56px_24px] text-[#7a8899]">
            <div className="text-[#1a4e8f] opacity-35">
              <IconFileText />
            </div>
            <div className="text-sm font-semibold text-[#8a96a3]">
              {daftarPengajuan.length === 0
                ? "Belum ada pengajuan"
                : search
                  ? "Tidak ada pengajuan yang cocok"
                  : "Tidak ada pengajuan untuk filter aktif"}
            </div>
            <div className="text-xs text-[#b0bac5]">
              {daftarPengajuan.length === 0
                ? "Belum ada formulir yang masuk dari OPD."
                : search
                  ? "Coba ubah kata kunci pencarian."
                  : "Coba aktifkan filter status di atas."}
            </div>
            {isFilterAktif && (
              <button
                onClick={resetFilter}
                className="mt-1 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#1a4e8f] transition hover:bg-[#e8f0fb]"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="sm:hidden">
              {groupedPengajuan.map((group) => {
                const isCollapsed = isGroupCollapsed(
                  group.key,
                  group.items.length,
                );
                const cfg = GROUP_BADGE[group.key];
                return (
                  <div
                    key={group.key}
                    className="border-b border-[#e2e8f2] last:border-b-0"
                  >
                    <button
                      onClick={() =>
                        toggleGroup(group.key, group.items.length)
                      }
                      className="flex w-full items-center gap-2.5 bg-[#f7f8fa] px-4 py-3 text-left"
                    >
                      <span
                        className={`shrink-0 text-[#7a8899] transition-transform duration-150 ${
                          isCollapsed ? "-rotate-90" : ""
                        }`}
                      >
                        <IconChevronDown />
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
                        />
                        <span className="text-[13px] font-bold text-[#1a1a2e]">
                          {cfg.label}
                        </span>
                      </span>
                      <span
                        className={`ml-auto rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${cfg.cls}`}
                      >
                        {group.items.length}
                      </span>
                    </button>

                    {!isCollapsed && group.items.length > 0 && (
                      <div className="divide-y divide-[#e2e8f2]">
                        {group.items.map((p, idx) => (
                          <PengajuanRowCardMobile
                            key={p.id}
                            p={p}
                            tahap={telaahByPengajuanId.get(p.id)?.tahapSaatIni}
                            no={idx + 1}
                            onLihatDetail={() => setSelected(p)}
                          />
                        ))}
                      </div>
                    )}
                    {!isCollapsed && group.items.length === 0 && (
                      <div className="px-4 py-5 text-center text-xs text-[#b0bac5] italic">
                        Tidak ada pengajuan pada kategori ini.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-[#e2e8f2] bg-[#263e6e]">
                    <th className="w-10 px-3 py-2 text-left text-[10px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase">
                      No
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase">
                      Pengajuan
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase">
                      Piutang & Nominal
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase">
                      Status
                    </th>
                    <th
                      onClick={() => handleSortClick("tanggalSurat")}
                      className="cursor-pointer px-3 py-2 text-left text-[10px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase transition hover:bg-[#2f4a80]"
                    >
                      Tgl Surat
                      <SortIndicator
                        active={sortConfig?.key === "tanggalSurat"}
                        dir={sortConfig?.dir ?? "desc"}
                      />
                    </th>
                    <th
                      onClick={() => handleSortClick("createdAt")}
                      className="cursor-pointer px-3 py-2 text-left text-[10px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase transition hover:bg-[#2f4a80]"
                    >
                      Tgl Input
                      <SortIndicator
                        active={sortConfig?.key === "createdAt"}
                        dir={sortConfig?.dir ?? "desc"}
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                {groupedPengajuan.map((group) => {
                  const isCollapsed = isGroupCollapsed(
                    group.key,
                    group.items.length,
                  );
                  const cfg = GROUP_BADGE[group.key];
                  return (
                    <tbody key={group.key}>
                      <tr className="border-b border-[#e2e8f2] bg-[#f0f4fb]">
                        <td colSpan={7} className="p-0">
                          <button
                            onClick={() =>
                              toggleGroup(group.key, group.items.length)
                            }
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-[#e8f0fb]"
                          >
                            <span
                              className={`shrink-0 text-[#7a8899] transition-transform duration-150 ${
                                isCollapsed ? "-rotate-90" : ""
                              }`}
                            >
                              <IconChevronDown />
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
                              />
                              <span className="text-[12.5px] font-bold text-[#1a1a2e]">
                                {cfg.label}
                              </span>
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${cfg.cls}`}
                            >
                              {group.items.length}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {!isCollapsed &&
                        (group.items.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-6 text-center text-xs text-[#b0bac5] italic"
                            >
                              Tidak ada pengajuan pada kategori ini.
                            </td>
                          </tr>
                        ) : (
                          group.items.map((p, idx) => {
                            const isLastInGroup =
                              idx === group.items.length - 1;
                            const tahap = telaahByPengajuanId.get(
                              p.id,
                            )?.tahapSaatIni;
                            return (
                              <tr
                                key={p.id}
                                className={`transition-colors duration-150 hover:bg-[#f7f9fc] ${
                                  isLastInGroup
                                    ? ""
                                    : "border-b border-[#eef1f5]"
                                }`}
                              >
                                <td className="px-3 py-2.5 align-top text-[12px] font-semibold text-[#7a8899]">
                                  {idx + 1}.
                                </td>

                                <td className="px-3 py-2.5 align-top">
                                  <div className="font-mono text-[11px] font-bold whitespace-nowrap text-[#1a4e8f]">
                                    {nomorTampilan(p)}
                                  </div>
                                  <div className="mt-0.5 text-[13px] font-bold whitespace-nowrap text-[#1a1a2e]">
                                    {p.namaOPD}
                                  </div>
                                  <div className="mt-px text-[10.5px] text-[#7a8899]">
                                    {p.namaPenanggungJawab}
                                  </div>
                                </td>

                                <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                  <div className="text-[12.5px] font-bold text-[#1a1a2e]">
                                    {formatRupiah(p.totalNilaiPiutang)}
                                  </div>
                                  <div className="mt-1">
                                    <JenisPenghapusanBadge
                                      jenis={p.jenisPenghapusan}
                                    />
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-[#5a6474]">
                                    {labelJenisPiutang(p.jenisPiutang)}
                                  </div>
                                </td>

                                <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                  <div className="flex flex-col items-start gap-1">
                                    <StatusBadge status={p.status} />
                                    {tahap && (
                                      <TahapTelaahBadge tahap={tahap} />
                                    )}
                                    {p.reviuInspektoratStatus ===
                                      "MENUNGGU_REVIU" && <ReviuBadge />}
                                  </div>
                                </td>

                                <td className="px-3 py-2.5 align-top text-[11.5px] font-semibold whitespace-nowrap text-[#3a4454]">
                                  {formatTanggalSingkat(p.tanggalSurat)}
                                </td>

                                <td className="px-3 py-2.5 align-top text-[11.5px] font-semibold whitespace-nowrap text-[#3a4454]">
                                  {formatTanggalSingkat(p.createdAt)}
                                </td>

                                <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                  <button
                                    onClick={() => setSelected(p)}
                                    className="inline-flex items-center gap-1 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
                                  >
                                    Lihat
                                    <IconArrowRight />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ))}
                    </tbody>
                  );
                })}
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LihatDaftarPengajuanAdmin;
