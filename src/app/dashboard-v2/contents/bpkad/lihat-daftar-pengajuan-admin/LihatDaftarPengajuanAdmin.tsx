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
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
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

// Nomor yang ditampilkan di baris paling atas: untuk status "teregistrasi"
// pakai Nomor Registrasi (identitas resmi setelah lolos verifikasi), untuk
// status lain ("diajukan"/"revisi") pakai Nomor Pengajuan (identitas resmi
// sejak awal submit, format XXX/PENGAJUAN/<KODE_OPD>/MM/YYYY) — BUKAN
// Nomor Surat Usulan dari OPD, karena itu nomor surat internal OPD sendiri,
// bukan identifier resmi SI PUSPITA.
function nomorTampilan(p: FormulirPenghapusanPiutangOPDRecord): string {
  if (p.status === "teregistrasi") {
    return p.nomorRegistrasi || p.nomorPengajuan || "-";
  }
  return p.nomorPengajuan || "-";
}

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
 * checklist persyaratan substantif resmi (1-8), SAMA PERSIS dengan
 * VerifikasiPengajuan.tsx supaya tampilan konsisten di kedua tempat:
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
 */
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
// Detail Pengajuan (panel) — read-only, tanpa form/tombol verifikasi
// ─────────────────────────────────────────────────────────────────────────────

const PanelDetail: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  onBack: () => void;
}> = ({ pengajuan, onBack }) => {
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

      {/* Back */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4e8f] hover:underline"
      >
        <IconArrowLeft />
        Kembali ke daftar
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Kolom kiri: info pengajuan & dokumen ── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Kartu info pengajuan — digabung jadi satu (identitas + field ringkas + penanggung jawab) */}
          <div className="rounded-sm border border-[#e2e8f2] bg-white">
            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
                    Nomor Surat
                  </div>
                  <div className="text-lg font-bold text-[#1a1a2e]">
                    {pengajuan.nomorSurat || "-"}
                  </div>
                  {pengajuan.nomorRegistrasi && (
                    <div className="mt-1.5">
                      <div className="mb-0.5 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
                        Nomor Registrasi
                      </div>
                      <div className="font-mono text-sm font-bold text-[#0f9b6e]">
                        {pengajuan.nomorRegistrasi}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <JenisPenghapusanBadge jenis={pengajuan.jenisPenghapusan} />
                  <StatusBadge status={pengajuan.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-3">
                {[
                  { label: "Nama OPD", value: pengajuan.namaOPD },
                  {
                    label: "Tanggal Surat",
                    value: formatTanggal(pengajuan.tanggalSurat),
                  },
                  {
                    label: "Jenis Piutang",
                    value: labelJenisPiutang(pengajuan.jenisPiutang),
                  },
                  {
                    label: "Jenis Penghapusan",
                    value: pengajuan.jenisPenghapusan || "-",
                  },
                  { label: "Jumlah Debitur", value: pengajuan.jumlahDebitur },
                  {
                    label: "Total Nilai Piutang",
                    value: (
                      <span className="font-bold text-[#1a4e8f]">
                        {formatRupiah(pengajuan.totalNilaiPiutang)}
                      </span>
                    ),
                  },
                  {
                    label: "Jumlah Angsuran",
                    value: formatRupiah(pengajuan.nilaiRekapitulasiAngsuran),
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                      {label}
                    </div>
                    <div className="text-[13px] text-[#1a1a2e]">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Penanggung Jawab OPD */}
            <div className="border-t border-[#eef1f5] p-5">
              <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                Penanggung Jawab OPD
              </div>
              <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                {[
                  { label: "Nama", value: pengajuan.namaPenanggungJawab },
                  { label: "Jabatan", value: pengajuan.jabatan },
                  {
                    label: "Opsi Riwayat Penagihan",
                    value: labelOpsiRiwayatPenagihanTampilan(
                      pengajuan.opsiRiwayatPenagihan,
                    ),
                  },
                  {
                    label: "Bukti Dokumen Tidak Mampu Melunasi Utang",
                    value: labelBuktiTidakMampuTerupload(pengajuan),
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                      {label}
                    </div>
                    <div className="text-[13px] text-[#1a1a2e]">{value}</div>
                  </div>
                ))}
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

        {/* ── Kolom kanan: info status (read-only, tanpa form keputusan) ── */}
        <div className="lg:col-span-1">
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5 lg:sticky lg:top-4">
            <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
              Status Verifikasi
            </div>

            {!sudahDiverifikasi ? (
              <div className="flex flex-col items-center gap-2 rounded-sm border border-dashed border-[#e2e8f2] py-8 text-center">
                <div className="text-[#b0bac5]">
                  <IconClock />
                </div>
                <div className="text-[13px] font-semibold text-[#7a8899]">
                  Belum diverifikasi
                </div>
                <div className="px-4 text-[11px] text-[#b0bac5]">
                  Pengajuan ini masih menunggu tindakan verifikator.
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                    Hasil Verifikasi
                  </div>
                  <StatusBadge status={pengajuan.status} />
                </div>
                <div>
                  <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                    Diverifikasi Oleh
                  </div>
                  <div className="text-[13px] text-[#1a1a2e]">
                    {pengajuan.verifikatorId || "-"}
                  </div>
                </div>
                <div>
                  <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                    Tanggal Verifikasi
                  </div>
                  <div className="text-[13px] text-[#1a1a2e]">
                    {pengajuan.tanggalVerifikasi
                      ? formatTanggalWaktu(pengajuan.tanggalVerifikasi)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                    Keterangan / Catatan
                  </div>
                  <div className="text-[13px] text-[#1a1a2e]">
                    {pengajuan.catatanVerifikasi || (
                      <span className="text-[#b0bac5] italic">
                        Tidak ada catatan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onBack}
              className="mt-4 w-full rounded-sm border border-[#e2e8f2] bg-white py-2.5 text-sm font-semibold text-[#5a6474] transition hover:bg-[#f7f8fa]"
            >
              Kembali
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
  onLihatDetail: () => void;
}> = ({ p, no, onLihatDetail }) => (
  <div className="space-y-2.5 p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="font-mono text-[11px] font-bold whitespace-nowrap text-[#1a4e8f]">
          #{no} · {nomorTampilan(p)}
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

    <button
      onClick={onLihatDetail}
      className="w-full rounded-sm border border-[#e2e8f2] bg-white py-2 text-xs font-semibold text-[#1a4e8f] transition hover:bg-[#f7f8fa]"
    >
      Lihat Detail
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface LihatDaftarPengajuanAdminProps {
  /**
   * Opsional — override sumber data (mis. untuk testing/storybook).
   * Kalau tidak diisi, komponen ambil langsung dari usePengajuanStore()
   * supaya selalu sinkron dengan data yang sama dipakai ModalLacak
   * (homepage) & panel VerifikasiPengajuan — bukan data acak/mock lokal.
   */
  semuaPengajuan?: FormulirPenghapusanPiutangOPDRecord[];
}

// Urutan grup status untuk tampilan grouping (collapse/expand): Teregistrasi
// paling atas, lalu Revisi, lalu Diajukan paling bawah. Di dalam grup yang
// sama, urutkan dari updatedAt paling baru ke paling lama.
const STATUS_GROUP_ORDER: StatusFormulir[] = [
  "teregistrasi",
  "revisi",
  "diajukan",
];

const STATUS_PRIORITY: Record<StatusFormulir, number> = Object.fromEntries(
  STATUS_GROUP_ORDER.map((status, idx) => [status, idx]),
) as Record<StatusFormulir, number>;

interface PengajuanGroup {
  status: StatusFormulir;
  items: FormulirPenghapusanPiutangOPDRecord[];
}

function LihatDaftarPengajuanAdmin({
  semuaPengajuan,
}: LihatDaftarPengajuanAdminProps = {}) {
  // Sumber data tunggal: pengajuan-store (localStorage + in-memory),
  // sama seperti yang dipakai VerifikasiPengajuan & ModalLacak. Prop
  // semuaPengajuan (kalau diisi) menang duluan sebagai override manual.
  const { data: dataStore } = usePengajuanStore();

  const daftarPengajuan = useMemo(() => {
    const sumber = semuaPengajuan ?? dataStore;
    return [...sumber].sort((a, b) => {
      const priorityDiff =
        STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [semuaPengajuan, dataStore]);

  // Ringkasan jumlah per status (seluruh data, bukan sesi)
  const jumlahDiajukan = useMemo(
    () => daftarPengajuan.filter((p) => p.status === "diajukan").length,
    [daftarPengajuan],
  );
  const jumlahTeregistrasi = useMemo(
    () => daftarPengajuan.filter((p) => p.status === "teregistrasi").length,
    [daftarPengajuan],
  );
  const jumlahRevisi = useMemo(
    () => daftarPengajuan.filter((p) => p.status === "revisi").length,
    [daftarPengajuan],
  );

  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);

  const filtered = useMemo(() => {
    if (!search) return daftarPengajuan;
    const q = search.toLowerCase();
    return daftarPengajuan.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.nomorPengajuan.toLowerCase().includes(q) ||
        p.nomorSurat.toLowerCase().includes(q) ||
        (p.nomorRegistrasi?.toLowerCase().includes(q) ?? false) ||
        p.namaOPD.toLowerCase().includes(q) ||
        p.namaPenanggungJawab.toLowerCase().includes(q),
    );
  }, [daftarPengajuan, search]);

  // Pengelompokan berdasarkan status, urutan tetap sesuai STATUS_GROUP_ORDER.
  // Saat sedang mencari (search aktif), grup yang kosong disembunyikan supaya
  // tidak menambah noise di hasil pencarian.
  const groupedPengajuan = useMemo<PengajuanGroup[]>(() => {
    return STATUS_GROUP_ORDER.map((status) => ({
      status,
      items: filtered.filter((p) => p.status === status),
    })).filter((group) => group.items.length > 0 || !search);
  }, [filtered, search]);

  // Status expand/collapse per grup — default semua grup terbuka.
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<StatusFormulir, boolean>
  >({
    teregistrasi: false,
    revisi: false,
    diajukan: false,
  });

  const toggleGroup = (status: StatusFormulir) => {
    setCollapsedGroups((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  // ── Render: panel detail (read-only) ──────────────────────────────────────
  if (selected) {
    return (
      <PanelDetail pengajuan={selected} onBack={() => setSelected(null)} />
    );
  }

  // ── Render: daftar pengajuan ───────────────────────────────────────────────
  return (
    <div className="font-inherit mx-auto w-full max-w-400">
      {/* ── Summary ── */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex min-w-0 items-center gap-3 rounded-sm border border-[#c8d9f5] bg-[#e8f0fb] px-4.5 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#1a4e8f] text-white">
            <IconClock />
          </div>
          <div>
            <div className="text-xl leading-tight font-bold text-[#1a1a2e]">
              {jumlahDiajukan}
            </div>
            <div className="mt-0.5 text-xs text-[#7a8899]">
              Menunggu Verifikasi
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-sm border border-[#a7e8d4] bg-[#e6f7f2] px-4.5 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#0f9b6e] text-white">
            <IconCheck />
          </div>
          <div>
            <div className="text-xl leading-tight font-bold text-[#1a1a2e]">
              {jumlahTeregistrasi}
            </div>
            <div className="mt-0.5 text-xs text-[#7a8899]">Teregistrasi</div>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-4.5 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#c0392b] text-white">
            <IconX />
          </div>
          <div>
            <div className="text-xl leading-tight font-bold text-[#1a1a2e]">
              {jumlahRevisi}
            </div>
            <div className="mt-0.5 text-xs text-[#7a8899]">Perlu Revisi</div>
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="mb-3.5 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[14px_16px] sm:flex-row sm:items-center">
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.75 sm:min-w-40 sm:flex-1">
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
            {/* Kartu — tampilan mobile (< sm), dikelompokkan per status */}
            <div className="sm:hidden">
              {groupedPengajuan.map((group) => {
                const isCollapsed = collapsedGroups[group.status];
                const cfg = STATUS_BADGE[group.status];
                return (
                  <div
                    key={group.status}
                    className="border-b border-[#e2e8f2] last:border-b-0"
                  >
                    <button
                      onClick={() => toggleGroup(group.status)}
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
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`}
                        />
                        <span className="text-[13px] font-bold text-[#1a1a2e]">
                          {cfg.label}
                        </span>
                      </span>
                      <span className="ml-auto text-xs font-semibold text-[#7a8899]">
                        {group.items.length}
                      </span>
                    </button>

                    {!isCollapsed &&
                      (group.items.length === 0 ? (
                        <div className="px-4 py-5 text-center text-xs text-[#b0bac5]">
                          Tidak ada pengajuan.
                        </div>
                      ) : (
                        <div className="divide-y divide-[#e2e8f2]">
                          {group.items.map((p, idx) => (
                            <PengajuanRowCardMobile
                              key={p.id}
                              p={p}
                              no={idx + 1}
                              onLihatDetail={() => setSelected(p)}
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>

            {/* Tabel — tampilan tablet & desktop (>= sm), dikelompokkan per status */}
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
                      "Tgl Input Pengajuan",
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
                {groupedPengajuan.map((group) => {
                  const isCollapsed = collapsedGroups[group.status];
                  const cfg = STATUS_BADGE[group.status];
                  return (
                    <tbody key={group.status}>
                      {/* Header grup — bisa diklik untuk collapse/expand */}
                      <tr className="border-b border-[#e2e8f2] bg-[#f0f4fb]">
                        <td colSpan={7} className="p-0">
                          <button
                            onClick={() => toggleGroup(group.status)}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[#e8f0fb]"
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
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`}
                              />
                              <span className="text-[13px] font-bold text-[#1a1a2e]">
                                {cfg.label}
                              </span>
                            </span>
                            <span className="text-xs font-semibold text-[#7a8899]">
                              {group.items.length} pengajuan
                            </span>
                          </button>
                        </td>
                      </tr>

                      {!isCollapsed &&
                        (group.items.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-5 text-center text-xs text-[#b0bac5]"
                            >
                              Tidak ada pengajuan.
                            </td>
                          </tr>
                        ) : (
                          group.items.map((p, idx) => {
                            const isLastInGroup =
                              idx === group.items.length - 1;
                            return (
                              <tr
                                key={p.id}
                                className={`transition-colors duration-150 hover:bg-[#fafbfc] ${
                                  isLastInGroup
                                    ? ""
                                    : "border-b border-[#e2e8f2]"
                                }`}
                              >
                                {/* No */}
                                <td className="w-8 p-[12px_14px] text-xs font-semibold whitespace-nowrap text-[#7a8899]">
                                  {idx + 1}
                                </td>

                                {/* Kolom gabungan: No Reg/No Pengajuan + OPD + Penanggung Jawab */}
                                <td className="p-[12px_14px]">
                                  <div className="font-mono text-xs font-bold whitespace-nowrap text-[#1a4e8f]">
                                    {nomorTampilan(p)}
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
                                    <JenisPenghapusanBadge
                                      jenis={p.jenisPenghapusan}
                                    />
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
                                <td className="p-[12px_14px] text-center text-xs whitespace-nowrap text-[#7a8899]">
                                  {formatTanggal(p.tanggalSurat)}
                                </td>

                                {/* Tgl Input Pengajuan — kapan pengajuan dibuat di sistem (createdAt), beda dari Tgl Surat yang diisi OPD manual */}
                                <td className="p-[12px_14px] text-center text-xs whitespace-nowrap text-[#7a8899]">
                                  {formatTanggal(p.createdAt)}
                                </td>

                                {/* Tombol Aksi — read-only, selalu "Lihat Detail" */}
                                <td className="p-[12px_14px] whitespace-nowrap">
                                  <button
                                    onClick={() => setSelected(p)}
                                    className="rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
                                  >
                                    Lihat Detail
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
