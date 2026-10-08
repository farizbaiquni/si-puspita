"use client";

import React, { useMemo, useState } from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  JenisPenghapusan,
  JenisPiutang,
  StatusFormulir,
  UploadedFileRef,
} from "@/types/types";
import {
  OPSI_DOKUMEN_DASAR_PIUTANG_LABEL,
  OPSI_RIWAYAT_PENAGIHAN_LABEL,
} from "@/types/types";
import { usePengajuanStore } from "@/store/pengajuan-store";

/* ─── Helpers (TIDAK berubah) ─── */
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
  if (p.status === "teregistrasi")
    return p.nomorRegistrasi || p.nomorSurat || "-";
  return p.nomorSurat || "-";
}

/* ─── Dokumen helpers (TIDAK berubah) ─── */
interface DokumenEntry {
  key: string;
  label: string;
  file: UploadedFileRef;
}
const NOMINATIF_DOC_LABELS: {
  key: keyof FormulirPenghapusanPiutangOPDRecord;
  label: string;
}[] = [
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
  { key: "riwayatPenagihan1", label: "Riwayat Penagihan Ke-1" },
  { key: "riwayatPenagihan2", label: "Riwayat Penagihan Ke-2" },
  { key: "riwayatPenagihan3", label: "Riwayat Penagihan Ke-3" },
  {
    key: "filePernyataanOPD",
    label: "Surat Pernyataan OPD (Tanpa Riwayat Penagihan)",
  },
  { key: "dokumenDasarPiutang", label: "Dokumen Dasar Piutang" },
];
function buildDokumenList(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
): DokumenEntry[] {
  const list: DokumenEntry[] = [];
  if (pengajuan.fileSurat) {
    list.push({
      key: "fileSurat",
      label: "Surat Pengantar / Usulan (Formulir)",
      file: pengajuan.fileSurat,
    });
  }
  NOMINATIF_DOC_LABELS.forEach(({ key, label }) => {
    const value = pengajuan[key];
    if (value && typeof value === "object" && "url" in value) {
      list.push({ key, label, file: value as UploadedFileRef });
    }
  });
  return list;
}

/* ─── Badges (TIDAK berubah) ─── */
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
const REVIU_BADGE = {
  label: "Menunggu Reviu Inspektorat",
  cls: "bg-[#f3efff] text-[#5b21b6] border-[#ddd0fb]",
  dot: "bg-[#7c3aed]",
} as const;

const StatusBadge: React.FC<{
  status: StatusFormulir;
  reviuStatus?: "MENUNGGU_REVIU" | null;
  compact?: boolean;
}> = ({ status, reviuStatus, compact = false }) => {
  const cfg =
    reviuStatus === "MENUNGGU_REVIU" ? REVIU_BADGE : STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-wide whitespace-nowrap ${
        compact
          ? "gap-1 px-1.5 py-0.5 text-[10px]"
          : "gap-1.25 px-2.25 py-0.75 text-[11px]"
      } ${cfg.cls}`}
    >
      <span
        className={`shrink-0 rounded-full ${compact ? "h-1 w-1" : "h-1.5 w-1.5"} ${cfg.dot}`}
      />
      {cfg.label}
    </span>
  );
};

const JenisPenghapusanBadge: React.FC<{
  jenis: JenisPenghapusan;
  compact?: boolean;
}> = ({ jenis, compact = false }) => {
  const isBersyarat = jenis === "Penghapusan Bersyarat";
  return (
    <span
      className={`inline-flex items-center rounded border font-bold tracking-wide uppercase ${
        compact ? "px-1 py-px text-[9px]" : "px-2 py-0.5 text-[11px]"
      } ${
        isBersyarat
          ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]"
          : "border-[#ddd6fe] bg-[#f5f3ff] text-[#5b21b6]"
      }`}
    >
      {isBersyarat ? "Bersyarat" : "Mutlak"}
    </span>
  );
};

/* ─── Icons ─── */
const IconSearch = () => (
  <svg
    width="14"
    height="14"
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
    width="12"
    height="12"
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
    width="13"
    height="13"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M1 7s2-4.5 6-4.5S13 7 13 7s-2 4.5-6 4.5S1 7 1 7z" />
    <circle cx="7" cy="7" r="1.5" />
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
    width="13"
    height="13"
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
    width="15"
    height="15"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5v3.5l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Icons untuk SummaryHeader */
const IconStack = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M9 1.5L2 5l7 3.5L16 5 9 1.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 9l7 3.5L16 9M2 13l7 3.5L16 13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconBuilding = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
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
);
const IconWallet = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <path
      d="M1.5 4.5a1.5 1.5 0 011.5-1.5h8A1.5 1.5 0 0112.5 4.5v.5h-9A1.5 1.5 0 002 6.5v6A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V6.5A1.5 1.5 0 0012.5 5H3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="11" cy="10" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconFileStack = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
  >
    <path
      d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 5h5l3 3v6a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M11 5v3h3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─── Modal Preview PDF (TIDAK berubah) ─── */
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

/* ─── Dokumen list item (TIDAK berubah) ─── */
const DokumenItem: React.FC<{ dok: DokumenEntry; onPreview: () => void }> = ({
  dok,
  onPreview,
}) => (
  <div className="flex items-center gap-3 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-2.5">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#fdecea]">
      <IconPdf />
    </div>
    <div className="min-w-0 flex-1">
      <div className="mb-0.5 text-[11px] leading-snug font-semibold text-[#1a4e8f]">
        {dok.label}
      </div>
      <div className="truncate text-[13px] font-semibold text-[#1a1a2e]">
        {dok.file.namaFile}
      </div>
      <div className="text-[11px] text-[#7a8899]">
        {formatUkuran(dok.file.ukuranBytes)}
      </div>
    </div>
    <button
      onClick={onPreview}
      className="flex shrink-0 items-center gap-1.5 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
    >
      <IconEye /> Lihat PDF
    </button>
  </div>
);

/* ─── Panel Detail (TIDAK berubah) ─── */
const PanelDetail: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  onBack: () => void;
}> = ({ pengajuan, onBack }) => {
  const [previewDoc, setPreviewDoc] = useState<DokumenEntry | null>(null);
  const dokumen = useMemo(() => buildDokumenList(pengajuan), [pengajuan]);
  const sudahDiverifikasi = pengajuan.status !== "diajukan";
  return (
    <div className="mx-auto w-full max-w-400">
      {previewDoc && (
        <ModalPreviewPDF
          namaFile={previewDoc.file.namaFile}
          url={previewDoc.file.url}
          onClose={() => setPreviewDoc(null)}
        />
      )}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4e8f] hover:underline"
      >
        <IconArrowLeft /> Kembali ke daftar
      </button>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
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
                { label: "Jumlah Debitur", value: pengajuan.jumlahDebitur },
                {
                  label: "Total Nilai Piutang",
                  value: (
                    <span className="font-bold text-[#1a4e8f]">
                      {formatRupiah(pengajuan.totalNilaiPiutang)}
                    </span>
                  ),
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
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
              Penanggung Jawab OPD
            </div>
            <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
              {[
                { label: "Nama", value: pengajuan.namaPenanggungJawab },
                { label: "Jabatan", value: pengajuan.jabatan },
                {
                  label: "Opsi Riwayat Penagihan",
                  value: pengajuan.opsiRiwayatPenagihan
                    ? OPSI_RIWAYAT_PENAGIHAN_LABEL[
                        pengajuan.opsiRiwayatPenagihan
                      ]
                    : "-",
                },
                {
                  label: "Opsi Dokumen Dasar Piutang",
                  value: pengajuan.opsiDokumenDasarPiutang
                    ? OPSI_DOKUMEN_DASAR_PIUTANG_LABEL[
                        pengajuan.opsiDokumenDasarPiutang
                      ]
                    : "-",
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
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
              Dokumen Pendukung ({dokumen.length})
            </div>
            {dokumen.length === 0 ? (
              <div className="rounded-sm border border-dashed border-[#e2e8f2] py-6 text-center text-[13px] text-[#7a8899]">
                Tidak ada dokumen yang dilampirkan.
              </div>
            ) : (
              <div className="space-y-2">
                {dokumen.map((dok) => (
                  <DokumenItem
                    key={dok.key}
                    dok={dok}
                    onPreview={() => setPreviewDoc(dok)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
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
                      ? formatTanggal(pengajuan.tanggalVerifikasi)
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

/* ═══════════════════════════════════════════════════════════════════
   ✨ SUMMARY HEADER — Palette 3-hue harmonis (Navy · Sky · Slate · Gold)
   ═══════════════════════════════════════════════════════════════════ */
const SummaryHeader: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord[];
}> = ({ pengajuan }) => {
  const total = pengajuan.length;
  const totalNilai = pengajuan.reduce(
    (sum, p) => sum + (Number(p.totalNilaiPiutang) || 0),
    0,
  );
  const jumlahOPD = new Set(pengajuan.map((p) => p.namaOPD)).size;
  const perStatus = {
    teregistrasi: pengajuan.filter((p) => p.status === "teregistrasi").length,
    diajukan: pengajuan.filter((p) => p.status === "diajukan").length,
    revisi: pengajuan.filter((p) => p.status === "revisi").length,
  };
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div className="mb-3 overflow-hidden rounded-sm border border-[#e2e8f2] bg-white shadow-xs">
      {/* Top accent bar — navy → gold → navy (satu-satunya gradient di bar luar) */}
      <div className="h-0.75 w-full bg-linear-to-r from-[#1a4e8f] via-[#c8a020] to-[#1a4e8f]" />

      {/* ═══ ROW 1: Stat cards ═══ */}
      <div className="grid grid-cols-2 gap-2 p-2.5 lg:grid-cols-[1.4fr_1fr_1fr_2fr] lg:gap-3 lg:p-3">
        {/* ── Brand Block (Navy) ── */}
        <div className="relative col-span-2 flex items-center gap-3 overflow-hidden rounded-sm border border-[#dbe6f7] bg-[#f0f4fb] px-3 py-2.5 lg:col-span-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-linear-to-br from-[#1a4e8f] to-[#0e3b6e] text-white shadow-sm">
            <IconStack />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] leading-tight font-bold text-[#1a1a2e]">
              Register Digital
            </div>
            <div className="truncate text-[10.5px] text-[#7a8899]">
              Ringkasan seluruh pengajuan
            </div>
          </div>
        </div>

        {/* ── Card: Pengajuan (Sky blue) ── */}
        <div className="relative flex items-center gap-2.5 overflow-hidden rounded-sm border border-[#bae6fd] bg-[#f0f9ff] px-3 py-2.5 transition-shadow hover:shadow-sm">
          {/* Accent bar kiri */}
          <div className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-[#38bdf8] to-[#0284c7]" />
          <span className="ml-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-linear-to-br from-[#0ea5e9] to-[#0369a1] text-white shadow-xs">
            <IconFileStack />
          </span>
          <div className="min-w-0">
            <div className="text-[18px] leading-none font-bold text-[#1a1a2e]">
              {total}
            </div>
            <div className="mt-1 truncate text-[10px] font-semibold tracking-wider text-[#0369a1] uppercase">
              Pengajuan
            </div>
          </div>
        </div>

        {/* ── Card: OPD (Slate — netral, tidak berkompetisi) ── */}
        <div className="relative flex items-center gap-2.5 overflow-hidden rounded-sm border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 transition-shadow hover:shadow-sm">
          <div className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-[#94a3b8] to-[#475569]" />
          <span className="ml-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-linear-to-br from-[#64748b] to-[#475569] text-white shadow-xs">
            <IconBuilding />
          </span>
          <div className="min-w-0">
            <div className="text-[18px] leading-none font-bold text-[#1a1a2e]">
              {jumlahOPD}
            </div>
            <div className="mt-1 truncate text-[10px] font-semibold tracking-wider text-[#475569] uppercase">
              OPD
            </div>
          </div>
        </div>

        {/* ── Card: Total Nilai (Gold — highlight utama, kolom paling lebar) ── */}
        <div className="relative col-span-2 flex items-center gap-3 overflow-hidden rounded-sm border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 transition-shadow hover:shadow-sm lg:col-span-1">
          <div className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-[#eab308] to-[#a16207]" />
          <span className="ml-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-linear-to-br from-[#c8a020] to-[#92400e] text-white shadow-sm">
            <IconWallet />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold tracking-wider text-[#a16207] uppercase">
              Total Nilai
            </div>
            <div className="text-[15px] leading-tight font-bold whitespace-nowrap text-[#78350f] lg:text-[16px] xl:text-[17px]">
              {formatRupiah(totalNilai)}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ROW 2: Distribusi Status ═══ */}
      <div className="border-t border-[#eef1f5] bg-[#fafbfd] px-3 py-2.5 lg:px-4 lg:py-3">
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
          <span className="text-[#5a6474]">Distribusi Status</span>
          <span className="text-[#1a4e8f]">{total} total</span>
        </div>

        {/* Stacked progress bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-sm bg-[#e2e8f0]">
          {perStatus.teregistrasi > 0 && (
            <div
              className="bg-linear-to-r from-[#10b981] to-[#059669] transition-all"
              style={{ width: `${pct(perStatus.teregistrasi)}%` }}
              title={`Teregistrasi: ${perStatus.teregistrasi}`}
            />
          )}
          {perStatus.diajukan > 0 && (
            <div
              className="bg-linear-to-r from-[#3b82f6] to-[#2563eb] transition-all"
              style={{ width: `${pct(perStatus.diajukan)}%` }}
              title={`Diajukan: ${perStatus.diajukan}`}
            />
          )}
          {perStatus.revisi > 0 && (
            <div
              className="bg-linear-to-r from-[#f97316] to-[#ea580c] transition-all"
              style={{ width: `${pct(perStatus.revisi)}%` }}
              title={`Revisi: ${perStatus.revisi}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#059669]" />
            <span className="font-bold text-[#065f46]">
              {perStatus.teregistrasi}
            </span>
            <span className="text-[#7a8899]">Teregistrasi</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" />
            <span className="font-bold text-[#1d4ed8]">
              {perStatus.diajukan}
            </span>
            <span className="text-[#7a8899]">Diajukan</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#ea580c]" />
            <span className="font-bold text-[#9a3412]">{perStatus.revisi}</span>
            <span className="text-[#7a8899]">Revisi</span>
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─── Mobile Card (compact) ─── */
const PengajuanRowCardMobile: React.FC<{
  p: FormulirPenghapusanPiutangOPDRecord;
  no: number;
  onLihatNominatif: () => void;
}> = ({ p, no, onLihatNominatif }) => (
  <div className="space-y-2 p-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="font-mono text-[10.5px] font-bold whitespace-nowrap text-[#1a4e8f]">
          #{no} · {nomorTampilan(p)}
        </div>
        <div className="mt-0.5 truncate text-[13px] font-semibold text-[#1a1a2e]">
          {p.namaOPD}
        </div>
        <div className="truncate text-[10.5px] text-[#7a8899]">
          {p.namaPenanggungJawab}
        </div>
      </div>
      <div className="shrink-0">
        <StatusBadge
          status={p.status}
          reviuStatus={p.reviuInspektoratStatus}
          compact
        />
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12.5px] font-bold text-[#1a1a2e]">
        {formatRupiah(p.totalNilaiPiutang)}
      </span>
      <JenisPenghapusanBadge jenis={p.jenisPenghapusan} compact />
    </div>
    <div className="flex items-center justify-between gap-2 text-[10.5px] text-[#7a8899]">
      <span className="truncate">{labelJenisPiutang(p.jenisPiutang)}</span>
      <span className="shrink-0">{formatTanggalSingkat(p.tanggalSurat)}</span>
    </div>
    {p.daftarNominatifPiutang && (
      <button
        onClick={onLihatNominatif}
        className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-[#e2e8f2] bg-white py-1.5 text-[11px] font-semibold text-[#1a4e8f] transition hover:bg-[#f7f8fa]"
      >
        <IconEye /> Lihat Nominatif
      </button>
    )}
  </div>
);

/* ─── Main Component ─── */
interface RegisterDigitalProps {
  semuaPengajuan?: FormulirPenghapusanPiutangOPDRecord[];
}
const STATUS_SORT_ORDER: StatusFormulir[] = [
  "teregistrasi",
  "revisi",
  "diajukan",
];
const STATUS_PRIORITY: Record<StatusFormulir, number> = Object.fromEntries(
  STATUS_SORT_ORDER.map((status, idx) => [status, idx]),
) as Record<StatusFormulir, number>;

interface PengajuanGroup {
  opd: string;
  items: FormulirPenghapusanPiutangOPDRecord[];
}

function RegisterDigital({ semuaPengajuan }: RegisterDigitalProps = {}) {
  const { data: dataStore } = usePengajuanStore();

  const daftarPengajuan = useMemo(() => {
    const sumber = semuaPengajuan ?? dataStore;
    return [...sumber].sort((a, b) => {
      const opdDiff = a.namaOPD.localeCompare(b.namaOPD, "id");
      if (opdDiff !== 0) return opdDiff;
      const priorityDiff =
        STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [semuaPengajuan, dataStore]);

  const [search, setSearch] = useState("");
  const [filterOPD, setFilterOPD] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFormulir | "">("");
  const [selected, setSelected] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);
  const [previewNominatif, setPreviewNominatif] =
    useState<UploadedFileRef | null>(null);

  const daftarOPD = useMemo(() => {
    const set = new Set<string>();
    daftarPengajuan.forEach((p) => {
      if (p.namaOPD) set.add(p.namaOPD);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [daftarPengajuan]);

  const isFilterAktif = Boolean(search || filterOPD || filterStatus);
  const resetFilter = () => {
    setSearch("");
    setFilterOPD("");
    setFilterStatus("");
  };

  const filtered = useMemo(() => {
    let hasil = daftarPengajuan;
    if (filterOPD) hasil = hasil.filter((p) => p.namaOPD === filterOPD);
    if (filterStatus) hasil = hasil.filter((p) => p.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      hasil = hasil.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.nomorPengajuan.toLowerCase().includes(q) ||
          p.nomorSurat.toLowerCase().includes(q) ||
          (p.nomorRegistrasi?.toLowerCase().includes(q) ?? false) ||
          p.namaOPD.toLowerCase().includes(q) ||
          p.namaPenanggungJawab.toLowerCase().includes(q),
      );
    }
    return hasil;
  }, [daftarPengajuan, search, filterOPD, filterStatus]);

  const groupedPengajuan = useMemo<PengajuanGroup[]>(() => {
    const map = new Map<string, FormulirPenghapusanPiutangOPDRecord[]>();
    filtered.forEach((p) => {
      const key = p.namaOPD || "OPD Tidak Diketahui";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).map(([opd, items]) => ({ opd, items }));
  }, [filtered]);

  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const toggleGroup = (opd: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [opd]: !prev[opd] }));
  };

  if (selected) {
    return (
      <PanelDetail pengajuan={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div className="font-inherit mx-auto w-full max-w-400">
      {previewNominatif && (
        <ModalPreviewPDF
          namaFile={previewNominatif.namaFile}
          url={previewNominatif.url}
          onClose={() => setPreviewNominatif(null)}
        />
      )}

      {/* ✨ SUMMARY HEADER (ROMBAK) */}
      <SummaryHeader pengajuan={daftarPengajuan} />

      {/* ✨ FILTER BAR — status kembali ke dropdown */}
      <div className="mb-3 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-2.5 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-2.5 py-1.5 sm:min-w-40 sm:flex-1">
          <span className="shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari nomor registrasi, nomor surat, atau nama OPD…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-w-0 border-none bg-transparent text-[12.5px] text-[#1a1a2e] outline-none"
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

        {/* OPD Filter */}
        <select
          value={filterOPD}
          onChange={(e) => setFilterOPD(e.target.value)}
          className="w-full shrink-0 cursor-pointer rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-2.5 py-1.5 text-[12.5px] text-[#1a1a2e] outline-none sm:w-auto sm:min-w-36"
        >
          <option value="">Semua OPD</option>
          {daftarOPD.map((opd) => (
            <option key={opd} value={opd}>
              {opd}
            </option>
          ))}
        </select>

        {/* ✨ Status Filter — kembali ke dropdown */}
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as StatusFormulir | "")
          }
          className="w-full shrink-0 cursor-pointer rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-2.5 py-1.5 text-[12.5px] text-[#1a1a2e] outline-none sm:w-auto sm:min-w-32"
        >
          <option value="">Semua Status</option>
          <option value="teregistrasi">Teregistrasi</option>
          <option value="diajukan">Diajukan</option>
          <option value="revisi">Revisi</option>
        </select>

        {isFilterAktif && (
          <button
            onClick={resetFilter}
            className="shrink-0 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#7a8899] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
          >
            Reset
          </button>
        )}

        <div className="shrink-0 text-[11.5px] whitespace-nowrap text-[#7a8899]">
          {filtered.length} / {daftarPengajuan.length}
        </div>
      </div>

      {/* COMPACT TABLE */}
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
                : "Coba ubah kata kunci pencarian atau filter."}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="sm:hidden">
              {groupedPengajuan.map((group) => {
                const isCollapsed = collapsedGroups[group.opd];
                return (
                  <div
                    key={group.opd}
                    className="border-b border-[#e2e8f2] last:border-b-0"
                  >
                    <button
                      onClick={() => toggleGroup(group.opd)}
                      className="flex w-full items-center gap-2 bg-[#f7f8fa] px-3 py-2 text-left"
                    >
                      <span
                        className={`shrink-0 text-[#7a8899] transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                      >
                        <IconChevronDown />
                      </span>
                      <span className="min-w-0 truncate text-[12px] font-bold text-[#1a1a2e]">
                        {group.opd}
                      </span>
                    </button>
                    {!isCollapsed && (
                      <div className="divide-y divide-[#e2e8f2]">
                        {group.items.map((p, idx) => (
                          <PengajuanRowCardMobile
                            key={p.id}
                            p={p}
                            no={idx + 1}
                            onLihatNominatif={() =>
                              p.daftarNominatifPiutang &&
                              setPreviewNominatif(p.daftarNominatifPiutang)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop — compact, 6 kolom */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-[12px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[#e2e8f2] bg-[#263e6e]">
                    <th className="w-8 px-2.5 py-2 text-left text-[9.5px] font-bold tracking-wider text-slate-100 uppercase">
                      #
                    </th>
                    <th className="px-2.5 py-2 text-left text-[9.5px] font-bold tracking-wider text-slate-100 uppercase">
                      Pengajuan
                    </th>
                    <th className="w-44 px-2.5 py-2 text-left text-[9.5px] font-bold tracking-wider text-slate-100 uppercase">
                      Nilai Piutang
                    </th>
                    <th className="w-32 px-2.5 py-2 text-left text-[9.5px] font-bold tracking-wider text-slate-100 uppercase">
                      Status
                    </th>
                    <th className="w-48 px-2.5 py-2 text-left text-[9.5px] font-bold tracking-wider text-slate-100 uppercase">
                      No. Registrasi / Tgl
                    </th>
                    <th className="w-16 px-2.5 py-2 text-right text-[9.5px] font-bold tracking-wider text-slate-100 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                {groupedPengajuan.map((group) => {
                  const isCollapsed = collapsedGroups[group.opd];
                  return (
                    <tbody key={group.opd}>
                      {/* ✨ Group header — BERSIH: hanya chevron + nama OPD */}
                      <tr className="sticky top-[33px] z-9 border-y border-[#dbe6f7] bg-[#f0f4fb]">
                        <td colSpan={6} className="p-0">
                          <button
                            onClick={() => toggleGroup(group.opd)}
                            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-[#e8f0fb]"
                          >
                            <span
                              className={`shrink-0 text-[#7a8899] transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                            >
                              <IconChevronDown />
                            </span>
                            <span className="min-w-0 truncate text-[12px] font-bold text-[#1a4e8f]">
                              {group.opd}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {!isCollapsed &&
                        group.items.map((p, idx) => {
                          const isLastInGroup = idx === group.items.length - 1;
                          const isEven = idx % 2 === 0;
                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors duration-100 hover:bg-[#f0f6fd] ${
                                isEven ? "bg-white" : "bg-[#fafbfc]"
                              } ${isLastInGroup ? "" : "border-b border-[#eef1f5]"}`}
                            >
                              {/* No */}
                              <td className="px-2.5 py-2 align-top text-[11px] font-semibold text-[#7a8899]">
                                {idx + 1}
                              </td>

                              {/* Pengajuan */}
                              <td className="px-2.5 py-2 align-top">
                                <div className="font-mono text-[11px] font-bold text-[#1a4e8f]">
                                  {p.nomorPengajuan}
                                </div>
                                <div className="mt-0.5 truncate text-[11.5px] text-[#3a4454]">
                                  {p.namaPenanggungJawab}
                                  <span className="text-[#b0bac5]"> · </span>
                                  <span className="font-semibold text-[#7a8899]">
                                    {p.jumlahDebitur} debitur
                                  </span>
                                </div>
                              </td>

                              {/* Nilai Piutang */}
                              <td className="px-2.5 py-2 align-top whitespace-nowrap">
                                <div className="text-[12px] font-bold text-[#1a1a2e]">
                                  {formatRupiah(p.totalNilaiPiutang)}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                  <JenisPenghapusanBadge
                                    jenis={p.jenisPenghapusan}
                                    compact
                                  />
                                  <span className="truncate text-[10.5px] text-[#7a8899]">
                                    {labelJenisPiutang(p.jenisPiutang)}
                                  </span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-2.5 py-2 align-top whitespace-nowrap">
                                <StatusBadge
                                  status={p.status}
                                  reviuStatus={p.reviuInspektoratStatus}
                                  compact
                                />
                              </td>

                              {/* No. Registrasi / Tgl */}
                              <td className="px-2.5 py-2 align-top whitespace-nowrap">
                                {p.nomorRegistrasi ? (
                                  <div className="font-mono text-[11px] font-bold text-[#0f9b6e]">
                                    {p.nomorRegistrasi}
                                  </div>
                                ) : (
                                  <div className="text-[10.5px] text-[#b0bac5] italic">
                                    Belum terbit
                                  </div>
                                )}
                                <div className="mt-0.5 text-[10.5px] text-[#7a8899]">
                                  Surat: {formatTanggalSingkat(p.tanggalSurat)}
                                </div>
                              </td>

                              {/* Aksi */}
                              <td className="px-2.5 py-2 text-right align-top whitespace-nowrap">
                                {p.daftarNominatifPiutang ? (
                                  <button
                                    onClick={() =>
                                      setPreviewNominatif(
                                        p.daftarNominatifPiutang!,
                                      )
                                    }
                                    title="Lihat Daftar Nominatif Piutang"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-[#e2e8f2] bg-white text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
                                  >
                                    <IconEye />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-[#b0bac5] italic">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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

export default RegisterDigital;
