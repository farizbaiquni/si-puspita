"use client";

/**
 * VerifikasiPengajuan.tsx
 * Halaman Verifikasi Pengajuan untuk user BPKAD.
 * Path: src/app/dashboard/contents/bpkad/verifikasi-pengajuan/VerifikasiPengajuan.tsx
 *
 * Menampilkan daftar pengajuan dengan status "DIAJUKAN" yang menunggu
 * verifikasi BPKAD. Setiap baris memiliki tombol "Verifikasi" yang membuka
 * panel detail berisi data pengajuan, dokumen pendukung (preview PDF), serta
 * form keputusan (Diterima / Ditolak) beserta catatan verifikator.
 *
 * Styling menggunakan Tailwind CSS (className), selaras dengan
 * LihatDaftarPengajuan.tsx & AjukanPermohonan.tsx.
 */

import React, { useMemo, useState } from "react";
import type {
  DokumenUpload,
  JalurPengajuan,
  JenisPiutang,
  Pengajuan,
  StatusPengajuan,
} from "@/types/types";

export const MOCK_PENGAJUAN: Pengajuan[] = [
  {
    id: "PGJ-2025-001",
    tanggalDibuat: "2025-01-08T09:23:00Z",
    status: "DISETUJUI",
    jalur: "PUPN",
    dataPenanggung: {
      namaWP: "Budi Santoso",
      alamatWP: "Jl. Mawar No. 12, Kendal",
      nik: "3317010101800001",
      pekerjaan: "Wiraswasta",
      jenisPiutang: "RETRIBUSI",
      nominalUtang: 12500000,
      nomorSKRD: "SKRD/2022/0412",
      nomorSTRD: "STRD/2023/0087",
      sebabPiutangMacet: "Usaha bangkrut, aset tidak mencukupi",
      adaBLUD: false,
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-002",
    tanggalDibuat: "2025-01-15T11:05:00Z",
    status: "DALAM_REVIEW",
    jalur: "NON_PUPN",
    dataPenanggung: {
      namaWP: "Siti Rahayu",
      alamatWP: "Jl. Kenanga No. 5, Weleri",
      nik: "3317015505750002",
      pekerjaan: "Pedagang",
      jenisPiutang: "LAINNYA",
      nominalUtang: 4200000,
      sebabPiutangMacet: "Meninggal dunia, ahli waris tidak mampu",
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-003",
    tanggalDibuat: "2025-02-03T08:44:00Z",
    status: "DIAJUKAN",
    jalur: "PUPN",
    dataPenanggung: {
      namaWP: "PT Karya Maju Sejahtera",
      alamatWP: "Jl. Industri Raya Km 7, Kaliwungu",
      nik: "3317000000000003",
      pekerjaan: "Perusahaan Manufaktur",
      jenisPiutang: "RETRIBUSI",
      nominalUtang: 87000000,
      nomorSKRD: "SKRD/2021/0188",
      nomorSTRD: "STRD/2022/0044",
      sebabPiutangMacet:
        "Perusahaan pailit, putusan PN No. 12/Pdt.Sus-Pailit/2023",
      adaBLUD: false,
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-004",
    tanggalDibuat: "2025-02-18T14:30:00Z",
    status: "PERLU_REVISI",
    jalur: "NON_PUPN",
    dataPenanggung: {
      namaWP: "Ahmad Fauzi",
      alamatWP: "Desa Tunjungsari RT 02/04, Patebon",
      nik: "3317012908820004",
      pekerjaan: "Buruh Tani",
      jenisPiutang: "TP",
      nominalUtang: 2750000,
      sebabPiutangMacet: "Tidak diketahui keberadaannya",
    },
    dokumen: [],
    catatanReviewer:
      "Dokumen Berita Acara Identifikasi belum dilampirkan. Mohon dilengkapi.",
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-005",
    tanggalDibuat: "2025-03-01T09:10:00Z",
    status: "DIAJUKAN",
    jalur: "NON_PUPN",
    dataPenanggung: {
      namaWP: "Dewi Kusumawati",
      alamatWP: "Jl. Cempaka No. 8, Kendal Kota",
      nik: "3317014404900005",
      pekerjaan: "Ibu Rumah Tangga",
      jenisPiutang: "TGR",
      nominalUtang: 5500000,
      sebabPiutangMacet: "Tidak mampu membayar",
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-006",
    tanggalDibuat: "2025-03-12T10:55:00Z",
    status: "DITOLAK",
    jalur: "PUPN",
    dataPenanggung: {
      namaWP: "CV Sumber Berkah",
      alamatWP: "Ruko Kaliwungu Baru Blok D No. 3",
      nik: "3317000000000006",
      pekerjaan: "Perdagangan Umum",
      jenisPiutang: "RETRIBUSI",
      nominalUtang: 145000000,
      nomorSKRD: "SKRD/2020/0092",
      nomorSTRD: "STRD/2021/0031",
      sebabPiutangMacet: "Aset tidak cukup menutupi kewajiban",
      adaBLUD: true,
    },
    dokumen: [],
    catatanReviewer:
      "Persyaratan PUPN tidak terpenuhi. Piutang belum berumur 5 tahun sejak STRD terakhir.",
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-007",
    tanggalDibuat: "2025-03-25T13:20:00Z",
    status: "DIAJUKAN",
    jalur: "NON_PUPN",
    dataPenanggung: {
      namaWP: "Mujiono",
      alamatWP: "Desa Gempolsewu Blok A, Rowosari",
      nik: "3317011205710007",
      pekerjaan: "Nelayan",
      jenisPiutang: "LAINNYA",
      nominalUtang: 3100000,
      sebabPiutangMacet: "Wafat, ahli waris tidak mampu membayar",
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-008",
    tanggalDibuat: "2025-04-07T08:00:00Z",
    status: "DALAM_REVIEW",
    jalur: "PUPN",
    dataPenanggung: {
      namaWP: "PT Sinar Harapan Bersama",
      alamatWP: "Kawasan Industri Kendal Blok G-12",
      nik: "3317000000000008",
      pekerjaan: "Industri Tekstil",
      jenisPiutang: "RETRIBUSI",
      nominalUtang: 320000000,
      nomorSKRD: "SKRD/2019/0041",
      nomorSTRD: "STRD/2020/0019",
      sebabPiutangMacet: "Kepailitan, proses likuidasi aset masih berjalan",
      adaBLUD: false,
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-009",
    tanggalDibuat: "2025-04-20T15:45:00Z",
    status: "DISETUJUI",
    jalur: "NON_PUPN",
    dataPenanggung: {
      namaWP: "Suharno",
      alamatWP: "Jl. Pahlawan No. 3, Sukorejo",
      nik: "3317013003680009",
      pekerjaan: "Pensiunan PNS",
      jenisPiutang: "TP",
      nominalUtang: 1800000,
      sebabPiutangMacet: "Sudah meninggal, tidak ada ahli waris yang mampu",
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-010",
    tanggalDibuat: "2025-05-05T10:15:00Z",
    status: "PERLU_REVISI",
    jalur: "NON_PUPN",
    dataPenanggung: {
      namaWP: "Rubiyah",
      alamatWP: "Desa Kalirejo Kidul, Brangsong",
      nik: "3317014006720010",
      pekerjaan: "Petani",
      jenisPiutang: "LAINNYA",
      nominalUtang: 950000,
      sebabPiutangMacet: "Tidak diketahui keberadaannya lebih dari 5 tahun",
    },
    dokumen: [],
    catatanReviewer:
      "Lampiran surat keterangan dari lurah belum ada. Harap dilengkapi dalam 7 hari kerja.",
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-011",
    tanggalDibuat: "2025-05-19T09:30:00Z",
    status: "DIAJUKAN",
    jalur: "PUPN",
    dataPenanggung: {
      namaWP: "UD Mitra Usaha Jaya",
      alamatWP: "Pasar Boja Kios 22, Boja",
      nik: "3317000000000011",
      pekerjaan: "Perdagangan Sembako",
      jenisPiutang: "RETRIBUSI",
      nominalUtang: 58000000,
      nomorSKRD: "SKRD/2020/0231",
      nomorSTRD: "STRD/2021/0118",
      sebabPiutangMacet: "Usaha gulung tikar, tidak ada aset tersisa",
      adaBLUD: false,
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
  {
    id: "PGJ-2025-012",
    tanggalDibuat: "2025-06-02T11:00:00Z",
    status: "DIAJUKAN",
    jalur: "PUPN",
    dataPenanggung: {
      namaWP: "Hendra Wijaya",
      alamatWP: "Perumahan Griya Asri Blok C5, Kendal",
      nik: "3317012107850012",
      pekerjaan: "Kontraktor",
      jenisPiutang: "TGR",
      nominalUtang: 22000000,
      sebabPiutangMacet: "Pekerjaan terbengkalai, aset tidak ada",
    },
    dokumen: [],
    unitPengaju: "Dinas Pendidikan dan Kebudayaan",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder dokumen PDF (mock)
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_PDF_BASE64 =
  "JVBERi0xLjEKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMzAwIDE1MF0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PmVuZG9iago1IDAgb2JqPDwvTGVuZ3RoIDc4Pj5zdHJlYW0KQlQgL0YxIDE0IFRmIDIwIDEwMCBUZCAoQ29udG9oIERva3VtZW4gUERGIC0gU0kgUFVTUElUQSkgVGogRVQKZW5kc3RyZWFtCmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+Cg==";

function placeholderDoc(id: string, namaFile: string): DokumenUpload {
  return {
    id,
    namaFile,
    ukuranBytes: 128_000,
    base64: PLACEHOLDER_PDF_BASE64,
    status: "valid",
  };
}

/**
 * Sebagian data MOCK_PENGAJUAN belum membawa dokumen (array kosong).
 * Untuk kebutuhan tampilan verifikasi, dokumen contoh dilampirkan
 * berdasarkan jalur pengajuan.
 */
function withMockDokumen(p: Pengajuan): Pengajuan {
  if (p.dokumen.length > 0) return p;

  const dokumen: DokumenUpload[] =
    p.jalur === "PUPN"
      ? [
          placeholderDoc(`${p.id}-skrd`, "SKRD.pdf"),
          placeholderDoc(`${p.id}-strd`, "STRD.pdf"),
          placeholderDoc(`${p.id}-ba`, "Berita_Acara_Identifikasi.pdf"),
        ]
      : [
          placeholderDoc(`${p.id}-tagih`, "Bukti_Penagihan_Optimal.pdf"),
          placeholderDoc(
            `${p.id}-mampu`,
            "Bukti_Ketidakmampuan_Penanggung.pdf",
          ),
        ];

  return { ...p, dokumen };
}

// ─────────────────────────────────────────────────────────────────────────────
// Label decoder — membaca keterangan yang di-encode saat buildPengajuan
// Format id: "keterangan||<label>||<originalId>"
// ─────────────────────────────────────────────────────────────────────────────

function parseDocLabel(dok: DokumenUpload): {
  keterangan: string;
  namaFile: string;
} {
  if (dok.id.startsWith("keterangan||")) {
    const parts = dok.id.split("||");
    return { keterangan: parts[1] ?? "", namaFile: dok.namaFile };
  }
  // Dokumen lama / mock — derive label dari namaFile
  const name = dok.namaFile.replace(/\.pdf$/i, "").replace(/_/g, " ");
  return { keterangan: name, namaFile: dok.namaFile };
}

/** Kelompokkan dokumen berdasarkan jenis keterangan */
function groupDokumen(
  dokumen: DokumenUpload[],
): { keterangan: string; dokList: DokumenUpload[] }[] {
  const map: Map<string, DokumenUpload[]> = new Map();
  dokumen.forEach((d) => {
    const { keterangan } = parseDocLabel(d);
    if (!map.has(keterangan)) map.set(keterangan, []);
    map.get(keterangan)!.push(d);
  });
  return Array.from(map.entries()).map(([keterangan, dokList]) => ({
    keterangan,
    dokList,
  }));
}

/** Ekstrak daftar checklist unik dari keterangan dokumen untuk ringkasan */
function extractChecklist(dokumen: DokumenUpload[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  dokumen.forEach((d) => {
    const { keterangan } = parseDocLabel(d);
    if (!seen.has(keterangan)) {
      seen.add(keterangan);
      result.push(keterangan);
    }
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRupiah(nominal: number): string {
  return "Rp " + nominal.toLocaleString("id-ID");
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
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

function labelJenisPiutang(j: JenisPiutang): string {
  const map: Record<NonNullable<JenisPiutang>, string> = {
    RETRIBUSI: "Retribusi",
    TP: "Tunt. Perbend.",
    TGR: "Tunt. Ganti Rugi",
    LAINNYA: "Lainnya",
    PAJAK: "Pajak",
  };
  return j ? map[j] : "-";
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  StatusPengajuan,
  { label: string; cls: string; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    cls: "bg-[#f1f3f5] text-[#6b7280] border-[#e5e7eb]",
    dot: "bg-[#9ca3af]",
  },
  DIAJUKAN: {
    label: "Diajukan",
    cls: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    dot: "bg-[#3b82f6]",
  },
  DALAM_REVIEW: {
    label: "Dalam Review",
    cls: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
    dot: "bg-[#f59e0b]",
  },
  DISETUJUI: {
    label: "Disetujui",
    cls: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
    dot: "bg-[#10b981]",
  },
  DITOLAK: {
    label: "Ditolak",
    cls: "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]",
    dot: "bg-[#ef4444]",
  },
  PERLU_REVISI: {
    label: "Perlu Revisi",
    cls: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dot: "bg-[#f97316]",
  },
};

const JALUR_BADGE: Record<
  NonNullable<JalurPengajuan>,
  { label: string; cls: string }
> = {
  PUPN: { label: "PUPN", cls: "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]" },
  NON_PUPN: {
    label: "Non-PUPN",
    cls: "bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe]",
  },
};

const StatusBadge: React.FC<{ status: StatusPengajuan }> = ({ status }) => {
  const cfg = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-full border px-[9px] py-[3px] text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const JalurBadge: React.FC<{ jalur: JalurPengajuan }> = ({ jalur }) => {
  if (!jalur) return <span className="text-xs text-[#7a8899]">—</span>;
  const cfg = JALUR_BADGE[jalur];
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${cfg.cls}`}
    >
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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-[rgba(10,20,40,0.55)] p-6 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-sm bg-white shadow-2xl">
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
  dok: DokumenUpload;
  onPreview: () => void;
}> = ({ dok, onPreview }) => {
  const { keterangan, namaFile } = parseDocLabel(dok);
  return (
    <div className="flex items-center gap-3 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-2.5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-[#fdecea]">
        <IconPdf />
      </div>
      <div className="min-w-0 flex-1">
        {keterangan && (
          <div className="mb-0.5 text-[11px] leading-snug font-semibold text-[#1a4e8f]">
            {keterangan}
          </div>
        )}
        <div className="truncate text-[13px] font-semibold text-[#1a1a2e]">
          {namaFile}
        </div>
        <div className="text-[11px] text-[#7a8899]">
          {formatUkuran(dok.ukuranBytes)}
        </div>
      </div>
      <button
        onClick={onPreview}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
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

type Keputusan = "DISETUJUI" | "DITOLAK";

const PanelVerifikasi: React.FC<{
  pengajuan: Pengajuan;
  onBack: () => void;
  onSubmit: (keputusan: Keputusan, catatan: string) => void;
}> = ({ pengajuan, onBack, onSubmit }) => {
  const dp = pengajuan.dataPenanggung;
  const [keputusan, setKeputusan] = useState<Keputusan | null>(null);
  const [catatan, setCatatan] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DokumenUpload | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!keputusan) {
      setError("Pilih hasil verifikasi: Diterima atau Ditolak.");
      return;
    }
    if (keputusan === "DITOLAK" && catatan.trim().length < 5) {
      setError(
        "Keterangan wajib diisi (minimal 5 karakter) untuk pengajuan yang ditolak.",
      );
      return;
    }
    setError("");
    onSubmit(keputusan, catatan.trim());
  };

  return (
    <div>
      {previewDoc && (
        <ModalPreviewPDF
          namaFile={previewDoc.namaFile}
          url={`data:application/pdf;base64,${previewDoc.base64}`}
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
          {/* Header card */}
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
                  Nomor Registrasi
                </div>
                <div className="text-lg font-bold text-[#1a1a2e]">
                  {pengajuan.id}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <JalurBadge jalur={pengajuan.jalur} />
                <StatusBadge status={pengajuan.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
              {[
                { label: "Unit Pengaju", value: pengajuan.unitPengaju },
                {
                  label: "Tanggal Diajukan",
                  value: formatTanggal(pengajuan.tanggalDibuat),
                },
                {
                  label: "Jenis Piutang",
                  value: labelJenisPiutang(dp.jenisPiutang),
                },
                {
                  label: "Nominal Utang",
                  value: (
                    <span className="font-bold text-[#1a4e8f]">
                      {formatRupiah(dp.nominalUtang)}
                    </span>
                  ),
                },
                ...(dp.nomorSKRD
                  ? [{ label: "Nomor SKRD", value: dp.nomorSKRD }]
                  : []),
                ...(dp.nomorSTRD
                  ? [{ label: "Nomor STRD", value: dp.nomorSTRD }]
                  : []),
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

          {/* Data Penanggung Utang */}
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
              Data Penanggung Utang
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              {[
                { label: "Nama", value: dp.namaWP },
                { label: "NIK", value: dp.nik },
                { label: "Pekerjaan", value: dp.pekerjaan || "-" },
                { label: "Alamat", value: dp.alamatWP, span: true },
                {
                  label: "Sebab Piutang Macet",
                  value: dp.sebabPiutangMacet,
                  span: true,
                },
              ].map(({ label, value, span }) => (
                <div key={label} className={span ? "col-span-2" : undefined}>
                  <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                    {label}
                  </div>
                  <div className="text-[13px] text-[#1a1a2e]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ringkasan Checklist */}
          {pengajuan.dokumen.length > 0 &&
            (() => {
              const checklist = extractChecklist(pengajuan.dokumen);
              return (
                <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
                  <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                    Checklist Dokumen yang Dipilih
                  </div>
                  <ul className="space-y-2">
                    {checklist.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#e6f7f2]">
                          <svg
                            width="9"
                            height="7"
                            viewBox="0 0 9 7"
                            fill="none"
                          >
                            <path
                              d="M1 3.5L3.5 6L8 1"
                              stroke="#0f9b6e"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="text-[13px] leading-snug text-[#1a1a2e]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

          {/* Dokumen pendukung */}
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
              Dokumen Pendukung ({pengajuan.dokumen.length})
            </div>
            {pengajuan.dokumen.length === 0 ? (
              <div className="rounded-sm border border-dashed border-[#e2e8f2] py-6 text-center text-[13px] text-[#7a8899]">
                Tidak ada dokumen yang dilampirkan.
              </div>
            ) : (
              <div className="space-y-2">
                {pengajuan.dokumen.map((dok) => (
                  <DokumenItem
                    key={dok.id}
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
          <div className="sticky top-4 rounded-sm border border-[#e2e8f2] bg-white p-5">
            <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
              Hasil Verifikasi
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setKeputusan("DISETUJUI")}
                className={`flex flex-col items-center gap-1.5 rounded-sm border-2 px-3 py-3 text-sm font-semibold transition ${
                  keputusan === "DISETUJUI"
                    ? "border-[#0f9b6e] bg-[#e6f7f2] text-[#0f9b6e]"
                    : "border-[#e2e8f2] bg-white text-[#7a8899] hover:border-[#a7e8d4] hover:bg-[#e6f7f2]"
                }`}
              >
                <IconCheck />
                Diterima
              </button>
              <button
                onClick={() => setKeputusan("DITOLAK")}
                className={`flex flex-col items-center gap-1.5 rounded-sm border-2 px-3 py-3 text-sm font-semibold transition ${
                  keputusan === "DITOLAK"
                    ? "border-[#c0392b] bg-[#fdecea] text-[#c0392b]"
                    : "border-[#e2e8f2] bg-white text-[#7a8899] hover:border-[#fecaca] hover:bg-[#fdecea]"
                }`}
              >
                <IconX />
                Ditolak
              </button>
            </div>

            <label className="mb-1.5 block text-[12px] font-semibold text-[#1a1a2e]">
              Keterangan / Catatan
              {keputusan === "DITOLAK" && (
                <span className="text-[#c0392b]"> *</span>
              )}
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={5}
              placeholder={
                keputusan === "DITOLAK"
                  ? "Jelaskan alasan penolakan / dokumen yang perlu dilengkapi…"
                  : "Catatan tambahan (opsional)…"
              }
              className="w-full resize-none rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] p-3 text-[13px] text-[#1a1a2e] outline-none focus:border-[#a0bdec]"
            />

            {error && (
              <div className="mt-2 text-[12px] font-medium text-[#c0392b]">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="mt-4 w-full rounded-sm bg-[#1a4e8f] py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d63a8]"
            >
              Simpan Hasil Verifikasi
            </button>
            <button
              onClick={onBack}
              className="mt-2 w-full rounded-sm border border-[#e2e8f2] bg-white py-2.5 text-sm font-semibold text-[#5a6474] transition hover:bg-[#f7f8fa]"
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
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface VerifikasiPengajuanProps {
  /** Seluruh pengajuan dari parent (single source of truth) */
  semuaPengajuan?: Pengajuan[];
  /** Dipanggil setelah BPKAD memutuskan verifikasi — parent yang update status */
  onStatusUpdate?: (
    id: string,
    status: "DISETUJUI" | "DITOLAK",
    catatan?: string,
  ) => void;
}

export default function VerifikasiPengajuan({
  semuaPengajuan,
  onStatusUpdate,
}: VerifikasiPengajuanProps = {}) {
  // Derive antrean langsung dari props — tidak perlu state lokal terpisah.
  // Parent (page.tsx) adalah single source of truth; saat onStatusUpdate
  // dipanggil, parent mengubah status di semuaPengajuan, dan useMemo
  // otomatis menyaring ulang sehingga pengajuan yang sudah diverifikasi
  // hilang dari antrean tanpa perlu setState di dalam effect.
  const antrean = useMemo(() => {
    const sumber = semuaPengajuan ?? MOCK_PENGAJUAN;
    return sumber.filter((p) => p.status === "DIAJUKAN").map(withMockDokumen);
  }, [semuaPengajuan]);

  const [riwayat, setRiwayat] = useState<
    { pengajuan: Pengajuan; keputusan: Keputusan; catatan: string }[]
  >([]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Pengajuan | null>(null);

  const filtered = useMemo(() => {
    if (!search) return antrean;
    const q = search.toLowerCase();
    return antrean.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.dataPenanggung.namaWP.toLowerCase().includes(q) ||
        p.unitPengaju.toLowerCase().includes(q),
    );
  }, [antrean, search]);

  const handleSubmitVerifikasi = (keputusan: Keputusan, catatan: string) => {
    if (!selected) return;

    const hasil: Pengajuan = {
      ...selected,
      status: keputusan,
      catatanReviewer: catatan || undefined,
    };

    // Catat di riwayat sesi ini
    setRiwayat((prev) => [{ pengajuan: hasil, keputusan, catatan }, ...prev]);
    // Beritahu parent — parent update status di shared state,
    // antrean otomatis reaktif karena di-derive via useMemo dari props.
    onStatusUpdate?.(selected.id, keputusan, catatan || undefined);
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
    <div className="font-inherit">
      {/* ── Summary ── */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-sm border border-[#c8d9f5] bg-[#e8f0fb] px-[18px] py-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-[#1a4e8f] text-white">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <circle cx="8" cy="8" r="6.5" />
              <path
                d="M8 5v3.5l2 1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-xl leading-tight font-bold text-[#1a1a2e]">
              {antrean.length}
            </div>
            <div className="mt-0.5 text-xs text-[#7a8899]">
              Menunggu Verifikasi
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-sm border border-[#a7e8d4] bg-[#e6f7f2] px-[18px] py-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-[#0f9b6e] text-white">
            <IconCheck />
          </div>
          <div>
            <div className="text-xl leading-tight font-bold text-[#1a1a2e]">
              {riwayat.filter((r) => r.keputusan === "DISETUJUI").length}
            </div>
            <div className="mt-0.5 text-xs text-[#7a8899]">
              Diterima (sesi ini)
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-[18px] py-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-[#c0392b] text-white">
            <IconX />
          </div>
          <div>
            <div className="text-xl leading-tight font-bold text-[#1a1a2e]">
              {riwayat.filter((r) => r.keputusan === "DITOLAK").length}
            </div>
            <div className="mt-0.5 text-xs text-[#7a8899]">
              Ditolak (sesi ini)
            </div>
          </div>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="mb-3.5 flex items-center gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[14px_16px]">
        <div className="flex min-w-[160px] flex-1 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-[7px]">
          <span className="flex-shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari Nomor Registrasi, nama pemohon, atau unit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none bg-transparent text-[13px] text-[#1a1a2e] outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="flex cursor-pointer border-none bg-transparent p-0 text-[#7a8899]"
            >
              <IconClose />
            </button>
          )}
        </div>
        <div className="flex-shrink-0 text-xs text-[#7a8899]">
          {filtered.length} dari {antrean.length} pengajuan
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
              {antrean.length === 0
                ? "Tidak ada pengajuan yang menunggu verifikasi"
                : "Tidak ada pengajuan yang cocok"}
            </div>
            <div className="text-xs text-[#b0bac5]">
              {antrean.length === 0
                ? "Semua pengajuan dengan status Diajukan telah diverifikasi."
                : "Coba ubah kata kunci pencarian."}
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e8f2] bg-[#263e6e]">
                {[
                  "No",
                  "Pengajuan",
                  "Piutang & Nominal",
                  "Tgl Diajukan",
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

                    {/* Kolom gabungan: No Reg + Unit + Penanggung */}
                    <td className="p-[12px_14px]">
                      <div className="font-mono text-xs font-bold whitespace-nowrap text-[#1a4e8f]">
                        {p.id}
                      </div>
                      <div className="mt-0.5 text-[13px] font-semibold whitespace-nowrap text-[#1a1a2e]">
                        {p.dataPenanggung.namaWP}
                      </div>
                      <div className="mt-px text-[11px] text-[#7a8899]">
                        {p.unitPengaju}
                      </div>
                    </td>

                    {/* Kolom gabungan: Jenis + Nominal + Jalur */}
                    <td className="p-[12px_14px] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#1a1a2e]">
                          {formatRupiah(p.dataPenanggung.nominalUtang)}
                        </span>
                        <JalurBadge jalur={p.jalur} />
                      </div>
                      <div className="mt-0.5 text-xs text-[#5a6474]">
                        {labelJenisPiutang(p.dataPenanggung.jenisPiutang)}
                      </div>
                    </td>

                    {/* Tgl Diajukan */}
                    <td className="p-[12px_14px] text-xs whitespace-nowrap text-[#7a8899]">
                      {formatTanggal(p.tanggalDibuat)}
                    </td>

                    {/* Tombol Verifikasi */}
                    <td className="p-[12px_14px] whitespace-nowrap">
                      <button
                        onClick={() => setSelected(p)}
                        className="rounded-sm bg-[#1a4e8f] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2d63a8]"
                      >
                        Verifikasi
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Riwayat verifikasi sesi ini ── */}
      {riwayat.length > 0 && (
        <div className="mt-6">
          <div className="mb-2.5 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
            Riwayat Verifikasi (Sesi Ini)
          </div>
          <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white">
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
                      {pengajuan.dataPenanggung.namaWP}
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
      )}
    </div>
  );
}
