"use client";

/* ------------------------------------------------------------------ */
/*  TelaahDokumenShared.tsx                                            */
/*  Komponen & helper yang DIPAKAI BERSAMA di modul telaah internal.   */
/*                                                                      */
/*  ⚠️ File ini adalah COPY dari VerifikasiPengajuan.tsx (bukan import!)*/
/*  Alasan copy, bukan import:                                          */
/*   1. Fungsi/komponen di VerifikasiPengajuan.tsx bersifat private     */
/*      (tidak di-export) — untuk pakai, kita harus MENGUBAH file       */
/*      existing, yang bertentangan dengan prinsip non-destructive.     */
/*   2. Kalau existing di-refactor, telaah tidak ikut rusak.            */
/*   3. Kalau nanti mau konsolidasi ke shared/, tinggal pindah 1 file.  */
/*                                                                      */
/*  Yang di-copy:                                                       */
/*   - buildDokumenTampilan() (checklist 1-8 sesuai SOP)                */
/*   - flattenDokumenTampilan()                                         */
/*   - Komponen <DokumenItem />                                          */
/*   - Komponen <ModalPreviewPDF />                                      */
/*   - Helper format (formatRupiah, formatTanggal, formatUkuran, dll)    */
/* ------------------------------------------------------------------ */

import React, { useMemo, useState } from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  JenisPiutang,
  UploadedFileRef,
} from "@/types/types";

/* ==================== Helper format ==================== */

export function formatRupiah(nominal: string | number): string {
  const n = typeof nominal === "string" ? Number(nominal) || 0 : nominal;
  return "Rp " + n.toLocaleString("id-ID");
}

export function formatTanggal(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTanggalWaktu(iso: string): string {
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

export function formatUkuran(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function labelJenisPiutang(j: JenisPiutang | ""): string {
  const map: Record<JenisPiutang, string> = {
    "Piutang Retribusi Daerah": "Retribusi Daerah",
    "Piutang Lain-lain PAD yang Sah": "Lain-lain PAD yang Sah",
    "Piutang Lainnya": "Lainnya",
  };
  return j ? map[j] : "-";
}

/* ==================== Ikon ==================== */

export const IconPdf = () => (
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

export const IconEye = () => (
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

export const IconClose = () => (
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

/* ==================== Tipe & konstanta dokumen ==================== */

export interface DokumenEntry {
  key: string;
  label: string;
  /** null = dokumen ini tidak/belum diupload OPD. */
  file: UploadedFileRef | null;
}

/**
 * Struktur tampilan daftar dokumen pendukung — mengatur URUTAN dan
 * PENGELOMPOKAN sesuai checklist persyaratan substantif resmi (1-8):
 *  - "single": item bernomor dengan satu file.
 *  - "group": item bernomor TANPA file sendiri (cuma judul syarat),
 *    dengan beberapa sub-dokumen di bawahnya (mis. 5, 6).
 */
export type DokumenTampilanEntry =
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

/* ==================== Helper internal ==================== */

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

/** Label tampilan untuk opsiRiwayatPenagihan. */
export function labelOpsiRiwayatPenagihanTampilan(
  opsi: FormulirPenghapusanPiutangOPDRecord["opsiRiwayatPenagihan"],
): string {
  if (opsi === "riwayat_tagihan") return "Riwayat Penagihan 1-3";
  if (opsi === "penyataan_opd") return "Pernyataan OPD";
  return "-";
}

/** 5 kemungkinan bukti "tidak mampu bayar" — OPD cukup upload SALAH SATU. */
export const BUKTI_TIDAK_MAMPU_LABELS: {
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

/** Cari mana dari 5 bukti "tidak mampu bayar" yang benar-benar diupload. */
export function labelBuktiTidakMampuTerupload(
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
export function buildDokumenTampilan(
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

/** Ratakan struktur tampilan jadi daftar file datar. */
export function flattenDokumenTampilan(
  tampilan: DokumenTampilanEntry[],
): DokumenEntry[] {
  return tampilan.flatMap((t) => (t.type === "single" ? [t.entry] : t.anak));
}

/* ==================== Komponen: ModalPreviewPDF ==================== */

export const ModalPreviewPDF: React.FC<{
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

/* ==================== Komponen: DokumenItem ==================== */

export const DokumenItem: React.FC<{
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
          className="flex shrink-0 items-center gap-1.5 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a4e8f] transition hover:cursor-pointer hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
        >
          <IconEye />
          Lihat PDF
        </button>
      )}
    </div>
  );
};

/* ==================== Komponen: DaftarDokumenLengkap ==================== */

/**
 * Komponen gabungan yang menampilkan SELURUH dokumen pendukung
 * (checklist 1-8) dengan sub-grup yang benar, plus state modal
 * preview PDF internal. Dipakai di DetailTelaah supaya tidak perlu
 * ulang menulis kode render + modal.
 *
 * Props:
 *  - pengajuan: record lengkap pengajuan (dari usePengajuanStore).
 *  - judul: judul section (mis. "Dokumen Pendukung").
 */
export const DaftarDokumenLengkap: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  judul?: string;
}> = ({ pengajuan, judul = "Dokumen Pendukung" }) => {
  const [previewDoc, setPreviewDoc] = useState<DokumenEntry | null>(null);

  const dokumenTampilan = useMemo(
    () => buildDokumenTampilan(pengajuan),
    [pengajuan],
  );
  const dokumen = useMemo(
    () => flattenDokumenTampilan(dokumenTampilan),
    [dokumenTampilan],
  );

  return (
    <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
      {previewDoc?.file && (
        <ModalPreviewPDF
          namaFile={previewDoc.file.namaFile}
          url={previewDoc.file.url}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
        {judul} ({dokumen.filter((d) => d.file).length}/{dokumen.length}{" "}
        terupload)
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
                {/* Judul syarat grup — tanpa file sendiri */}
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
                {/* Sub-dokumen menjorok ke kanan */}
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
  );
};
