"use client";

import React, { useMemo, useState } from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  JenisPenghapusan,
  JenisPiutang,
  StatusFormulir,
  UploadedFileRef,
} from "@/types/types-v2";
import {
  OPSI_DOKUMEN_DASAR_PIUTANG_LABEL,
  OPSI_RIWAYAT_PENAGIHAN_LABEL,
} from "@/types/types-v2";

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

// ─────────────────────────────────────────────────────────────────────────────
// Nomor Registrasi — generator
// Format: reg-{no urut antrian}/{kode instansi}/{singkatan instansi}/{bulan romawi}/{tahun}
// ─────────────────────────────────────────────────────────────────────────────

const KODE_INSTANSI: { match: string; kode: string; singkatan: string }[] = [
  { match: "RSUD", kode: "22", singkatan: "RSUD" },
  { match: "Dinas Perhubungan", kode: "24", singkatan: "DISHUB" },
  {
    match: "Dinas Komunikasi dan Informatika",
    kode: "46",
    singkatan: "DISKOMINFO",
  },
  {
    match: "Dinas Perdagangan Koperasi dan UKM",
    kode: "51",
    singkatan: "DISPERINDAGKOP",
  },
  { match: "Setwan", kode: "59", singkatan: "SETWAN" },
];

function getKodeInstansi(namaOPD: string): { kode: string; singkatan: string } {
  const found = KODE_INSTANSI.find((k) =>
    namaOPD.toLowerCase().includes(k.match.toLowerCase()),
  );
  if (found) return { kode: found.kode, singkatan: found.singkatan };
  // Fallback untuk OPD yang belum terdaftar di mapping — tetap hasilkan
  // nomor registrasi yang valid alih-alih gagal.
  return {
    kode: "00",
    singkatan:
      namaOPD
        .replace(/[^a-zA-Z\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 10) || "OPD",
  };
}

const BULAN_ROMAWI = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

function generateNomorRegistrasi(
  namaOPD: string,
  noUrutAntrian: number,
  tanggal: Date = new Date(),
): string {
  const { kode, singkatan } = getKodeInstansi(namaOPD);
  const bulanRomawi = BULAN_ROMAWI[tanggal.getMonth()];
  const tahun = tanggal.getFullYear();
  return `reg-${noUrutAntrian}/${kode}/${singkatan}/${bulanRomawi}/${tahun}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Daftar dokumen — dibangun dari field dokumen flat FormulirPenghapusanPiutangOPDRecord + fileSurat
// ─────────────────────────────────────────────────────────────────────────────

interface DokumenEntry {
  key: string;
  label: string;
  file: UploadedFileRef;
}

const NOMINATIF_DOC_LABELS: {
  key: keyof FormulirPenghapusanPiutangOPDRecord;
  label: string;
}[] = [
  { key: "suratPengantarUsulan", label: "Surat Pengantar Usulan dari OPD" },
  {
    key: "daftarNominatifPiutang",
    label: "Daftar Nominatif Usulan Piutang SKPD",
  },
  {
    key: "dokumenDasarPiutang",
    label: "Dokumen yang menjadi dasar timbulnya piutang",
  },
  { key: "riwayatPenagihan1", label: "Riwayat Penagihan Ke-1" },
  { key: "riwayatPenagihan2", label: "Riwayat Penagihan Ke-2" },
  { key: "riwayatPenagihan3", label: "Riwayat Penagihan Ke-3" },
  {
    key: "filePernyataanOPD",
    label: "Surat Pernyataan OPD (Tanpa Riwayat Penagihan)",
  },
  { key: "rekapitulasiSaldoPiutang", label: "Rekapitulasi Saldo Piutang" },
  { key: "rekapitulasiAngsuran", label: "Rekapitulasi Angsuran" },
  {
    key: "neracaAwalPencatatanPiutang",
    label: "Neraca Awal Pencatatan Piutang",
  },
  {
    key: "dokumenPendukungSuratTidakMampuBayar",
    label: "Dokumen pendukung lainnya",
  },
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
  index: number;
  dok: DokumenEntry;
  onPreview: () => void;
}> = ({ index, dok, onPreview }) => {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-2.5">
      <div className="text-xs text-gray-500">{index + 1}</div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#fdecea]">
        <IconPdf />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[11px] leading-snug font-semibold text-[#1a4e8f]">
          {dok.label}
        </div>
        <div className="text-[11px] text-[#7a8899]">
          {formatUkuran(dok.file.ukuranBytes)}
        </div>
      </div>
      <button
        onClick={onPreview}
        className="flex shrink-0 items-center gap-1.5 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a4e8f] transition hover:cursor-pointer hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
      >
        <IconEye />
        Lihat PDF
      </button>
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
}> = ({ pengajuan, onBack, onSubmit }) => {
  const [keputusan, setKeputusan] = useState<Keputusan | null>(null);
  const [catatan, setCatatan] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DokumenEntry | null>(null);
  const [error, setError] = useState("");

  const dokumen = useMemo(() => buildDokumenList(pengajuan), [pengajuan]);

  const handleSubmit = () => {
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
      {previewDoc && (
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
          {/* Header card */}
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

          {/* Data Penanggung Jawab OPD */}
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

          {/* Dokumen pendukung */}
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
                {dokumen.map((dok, index) => (
                  <DokumenItem
                    index={index}
                    key={dok.key}
                    dok={dok}
                    onPreview={() => setPreviewDoc(dok)}
                  />
                ))}
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

            {error && (
              <div className="mt-2 text-[12px] font-medium text-[#c0392b]">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="mt-4 w-full rounded-sm bg-[#1a4e8f] py-2.5 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-[#2d63a8]"
            >
              Submit
            </button>
            <button
              onClick={onBack}
              className="mt-2 w-full rounded-sm border border-[#e2e8f2] bg-white py-2.5 text-sm font-semibold text-[#5a6474] transition hover:cursor-pointer hover:bg-[#f7f8fa]"
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
          #{no} · {p.id}
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
        {pengajuan.id}
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
  /** Seluruh pengajuan dari parent (single source of truth), mis. MOCK_DATA */
  semuaPengajuan?: FormulirPenghapusanPiutangOPDRecord[];
  /** Dipanggil setelah BPKAD memutuskan verifikasi — parent yang update status */
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
  // Derive daftar pengajuan langsung dari props — tidak perlu state lokal
  // terpisah. Parent (page.tsx) adalah single source of truth; saat
  // onStatusUpdate dipanggil, parent mengubah status di semuaPengajuan, dan
  // useMemo otomatis menyusun ulang urutan tanpa perlu setState di effect.
  const daftarPengajuan = useMemo(() => {
    const sumber = semuaPengajuan ?? [];
    // Panel verifikasi hanya menampilkan antrean yang masih perlu
    // ditindak — status "revisi" & "teregistrasi" sudah final/menunggu
    // OPD, jadi cukup dilihat di menu "Lihat Daftar Pengajuan".
    return sumber
      .filter((p) => p.status === "diajukan")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [semuaPengajuan]);

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

  const filtered = useMemo(() => {
    if (!search) return daftarPengajuan;
    const q = search.toLowerCase();
    return daftarPengajuan.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.namaOPD.toLowerCase().includes(q) ||
        p.namaPenanggungJawab.toLowerCase().includes(q),
    );
  }, [daftarPengajuan, search]);

  const handleSubmitVerifikasi = (keputusan: Keputusan, catatan: string) => {
    if (!selected) return;

    const tanggalVerifikasi = new Date().toISOString();

    // Jika lolos verifikasi ("teregistrasi"), generate Nomor Registrasi.
    // No urut antrian dihitung dari jumlah pengajuan yang sudah
    // berstatus "teregistrasi" di SELURUH data (semuaPengajuan) — bukan
    // dari daftarPengajuan, karena daftarPengajuan sudah difilter hanya
    // status "diajukan" untuk ditampilkan di panel ini.
    let nomorRegistrasi = selected.nomorRegistrasi;
    if (keputusan === "teregistrasi") {
      const jumlahSudahTeregistrasi = (semuaPengajuan ?? []).filter(
        (p) => p.status === "teregistrasi",
      ).length;
      const noUrutAntrian = jumlahSudahTeregistrasi + 1;
      nomorRegistrasi = generateNomorRegistrasi(
        selected.namaOPD,
        noUrutAntrian,
        new Date(tanggalVerifikasi),
      );
    }

    const hasil: FormulirPenghapusanPiutangOPDRecord = {
      ...selected,
      status: keputusan,
      verifikatorId,
      tanggalVerifikasi,
      nomorRegistrasi,
    };

    // Catat di riwayat sesi ini
    setRiwayat((prev) => [{ pengajuan: hasil, keputusan, catatan }, ...prev]);
    // Beritahu parent — parent update status (dan nomorRegistrasi bila ada)
    // di shared state; antrean otomatis reaktif karena di-derive via
    // useMemo dari props.
    onStatusUpdate?.(
      selected.id,
      keputusan,
      catatan || undefined,
      nomorRegistrasi || undefined,
    );
    setSelected(null);
  };

  // ── Render: panel verifikasi ──────────────────────────────────────────────
  if (selected) {
    return (
      <PanelVerifikasi
        pengajuan={selected}
        onBack={() => setSelected(null)}
        onSubmit={handleSubmitVerifikasi}
      />
    );
  }

  // ── Render: daftar antrean ────────────────────────────────────────────────
  return (
    <div className="font-inherit mx-auto w-full max-w-400">
      {/* ── Search bar ── */}
      <div className="mb-3.5 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[14px_16px] sm:flex-row sm:items-center">
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.75 sm:min-w-40 sm:flex-1">
          <span className="shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari Nomor Registrasi, nama OPD, atau penanggung jawab…"
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
                            {p.id}
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
                        {pengajuan.id}
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
