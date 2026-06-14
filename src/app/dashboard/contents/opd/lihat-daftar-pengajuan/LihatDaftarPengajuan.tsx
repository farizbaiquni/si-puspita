"use client";

/**
 * LihatDaftarPengajuan.tsx
 * Halaman daftar pengajuan penghapusan piutang untuk user OPD.
 * Path: src/app/dashboard/contents/opd/lihat-daftar-pengajuan/LihatDaftarPengajuan.tsx
 *
 * Styling menggunakan Tailwind CSS (className). Warna khusus yang belum
 * tersedia di palet default Tailwind ditulis dengan arbitrary value,
 * mis. bg-[#1a4e8f], agar tetap selaras dengan AjukanPermohonan.tsx.
 */

import React, { useState, useMemo } from "react";
import type {
  Pengajuan,
  StatusPengajuan,
  JalurPengajuan,
  JenisPiutang,
} from "@/types/types";

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — 12 pengajuan sample
// ─────────────────────────────────────────────────────────────────────────────

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
    status: "DRAFT",
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
    status: "DRAFT",
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
// Status badge config
// ─────────────────────────────────────────────────────────────────────────────

type StatusConfig = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

const STATUS_CONFIG: Record<StatusPengajuan, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-[#f1f3f5] text-[#6b7280] border-[#e5e7eb]",
    dotClass: "bg-[#9ca3af]",
  },
  DIAJUKAN: {
    label: "Diajukan",
    badgeClass: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    dotClass: "bg-[#3b82f6]",
  },
  DALAM_REVIEW: {
    label: "Dalam Review",
    badgeClass: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
    dotClass: "bg-[#f59e0b]",
  },
  DISETUJUI: {
    label: "Disetujui",
    badgeClass: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
    dotClass: "bg-[#10b981]",
  },
  DITOLAK: {
    label: "Ditolak",
    badgeClass: "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]",
    dotClass: "bg-[#ef4444]",
  },
  PERLU_REVISI: {
    label: "Perlu Revisi",
    badgeClass: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dotClass: "bg-[#f97316]",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Jalur badge config
// ─────────────────────────────────────────────────────────────────────────────

const JALUR_CONFIG: Record<
  NonNullable<JalurPengajuan>,
  { label: string; badgeClass: string }
> = {
  PUPN: {
    label: "PUPN",
    badgeClass: "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]",
  },
  NON_PUPN: {
    label: "Non-PUPN",
    badgeClass: "bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe]",
  },
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

const IconEdit = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconChevronUp = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M2 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
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

const IconWarning = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M7 1L13 12H1L7 1z" strokeLinejoin="round" />
    <path d="M7 5.5v3M7 10h.01" strokeLinecap="round" />
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

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: StatusPengajuan }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-full border px-[9px] py-[3px] text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.badgeClass}`}
    >
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${cfg.dotClass}`}
      />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// JalurBadge
// ─────────────────────────────────────────────────────────────────────────────

const JalurBadge: React.FC<{ jalur: JalurPengajuan }> = ({ jalur }) => {
  if (!jalur) {
    return <span className="text-xs text-[#7a8899]">—</span>;
  }
  const cfg = JALUR_CONFIG[jalur];
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${cfg.badgeClass}`}
    >
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Summary stats cards
// ─────────────────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: number | string;
  accentClass: string;
  cardClass: string;
  icon: React.ReactNode;
}> = ({ label, value, accentClass, cardClass, icon }) => (
  <div
    className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-[18px] py-3.5 ${cardClass}`}
  >
    <div
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white ${accentClass}`}
    >
      {icon}
    </div>
    <div>
      <div className="text-xl leading-tight font-bold text-[#1a1a2e]">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-[#7a8899]">{label}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────────────────────────────────────

const ModalDetail: React.FC<{
  pengajuan: Pengajuan;
  onClose: () => void;
}> = ({ pengajuan, onClose }) => {
  const dp = pengajuan.dataPenanggung;
  const isDitolak = pengajuan.status === "DITOLAK";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(10,20,40,0.45)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sticky top-0 z-[1] flex items-start justify-between gap-3 rounded-t-2xl border-b border-[#e2e8f2] bg-white px-6 pt-5 pb-4">
          <div>
            <div className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
              Nomor Registrasi
            </div>
            <div className="text-[17px] font-bold text-[#1a1a2e]">
              {pengajuan.id}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <StatusBadge status={pengajuan.status} />
            <button
              onClick={onClose}
              className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-[#e2e8f2] bg-[#f7f8fa] text-[#7a8899]"
            >
              <IconClose />
            </button>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6">
          {/* Catatan reviewer jika ada */}
          {pengajuan.catatanReviewer && (
            <div
              className={`mb-[18px] flex gap-2.5 rounded-[10px] border p-[12px_14px] ${
                isDitolak
                  ? "border-[#f5c2c7] bg-[#fdecea]"
                  : "border-[#fcd9a4] bg-[#fff3e6]"
              }`}
            >
              <span
                className={`mt-0.5 flex-shrink-0 ${
                  isDitolak ? "text-[#c0392b]" : "text-[#e07020]"
                }`}
              >
                <IconWarning />
              </span>
              <div>
                <div
                  className={`mb-[3px] text-[11px] font-bold tracking-[0.06em] uppercase ${
                    isDitolak ? "text-[#c0392b]" : "text-[#e07020]"
                  }`}
                >
                  Catatan Reviewer
                </div>
                <div
                  className={`text-[13px] leading-[1.55] ${
                    isDitolak ? "text-[#7b1a1a]" : "text-[#7a4010]"
                  }`}
                >
                  {pengajuan.catatanReviewer}
                </div>
              </div>
            </div>
          )}

          {/* Info row */}
          <div className="mb-[18px] grid grid-cols-2 gap-x-5 gap-y-2.5">
            {[
              {
                label: "Tanggal Dibuat",
                value: formatTanggal(pengajuan.tanggalDibuat),
              },
              {
                label: "Jalur",
                value: <JalurBadge jalur={pengajuan.jalur} />,
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
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                  {label}
                </div>
                <div className="text-[13px] text-[#1a1a2e]">{value}</div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 h-px bg-[#e2e8f2]" />

          {/* Data penanggung */}
          <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
            Data Penanggung Utang
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {[
              { label: "Nama", value: dp.namaWP },
              { label: "NIK", value: dp.nik },
              { label: "Pekerjaan", value: dp.pekerjaan },
              { label: "Alamat", value: dp.alamatWP },
              ...(dp.nomorSKRD
                ? [{ label: "Nomor SKRD", value: dp.nomorSKRD }]
                : []),
              ...(dp.nomorSTRD
                ? [{ label: "Nomor STRD", value: dp.nomorSTRD }]
                : []),
              { label: "Sebab Piutang Macet", value: dp.sebabPiutangMacet },
            ].map(({ label, value }) => (
              <div
                key={label}
                className={
                  label === "Alamat" || label === "Sebab Piutang Macet"
                    ? "col-span-2"
                    : undefined
                }
              >
                <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
                  {label}
                </div>
                <div className="text-[13px] text-[#1a1a2e]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter / Search bar
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = "tanggal" | "nominal" | "status";
type SortDir = "asc" | "desc";

interface FilterState {
  search: string;
  status: StatusPengajuan | "SEMUA";
  jalur: JalurPengajuan | "SEMUA";
}

// ─────────────────────────────────────────────────────────────────────────────
// Table column definitions
// ─────────────────────────────────────────────────────────────────────────────

const COLUMNS: { label: string; key: SortKey | null; widthClass: string }[] = [
  { label: "No", key: null, widthClass: "w-8" },
  { label: "Pengajuan", key: null, widthClass: "" },
  { label: "Piutang & Nominal", key: "nominal", widthClass: "w-[200px]" },
  { label: "Status", key: "status", widthClass: "w-[130px]" },
  { label: "Aksi", key: null, widthClass: "w-[72px]" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function LihatDaftarPengajuan({
  semuaPengajuan,
}: {
  semuaPengajuan?: Pengajuan[];
} = {}) {
  // Gunakan data dari parent (single source of truth).
  // Fallback ke MOCK_PENGAJUAN jika dipanggil tanpa props (standalone).
  const dataPengajuan = useMemo(
    () => semuaPengajuan ?? MOCK_PENGAJUAN,
    [semuaPengajuan],
  );

  const [filter, setFilter] = useState<FilterState>({
    search: "",
    status: "SEMUA",
    jalur: "SEMUA",
  });
  const [sortKey, setSortKey] = useState<SortKey>("tanggal");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detailPengajuan, setDetailPengajuan] = useState<Pengajuan | null>(
    null,
  );

  // ── Derived stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = dataPengajuan.length;
    const diajukan = dataPengajuan.filter(
      (p) => p.status === "DIAJUKAN" || p.status === "DALAM_REVIEW",
    ).length;
    const disetujui = dataPengajuan.filter(
      (p) => p.status === "DISETUJUI",
    ).length;
    const perluRevisi = dataPengajuan.filter(
      (p) => p.status === "PERLU_REVISI" || p.status === "DITOLAK",
    ).length;
    const totalNominal = dataPengajuan.reduce(
      (s, p) => s + p.dataPenanggung.nominalUtang,
      0,
    );
    return { total, diajukan, disetujui, perluRevisi, totalNominal };
  }, [dataPengajuan]);

  // ── Filtered + sorted data ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    let data = [...dataPengajuan];

    if (filter.search) {
      const q = filter.search.toLowerCase();
      data = data.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.dataPenanggung.namaWP.toLowerCase().includes(q) ||
          p.dataPenanggung.nik.includes(q),
      );
    }

    if (filter.status !== "SEMUA") {
      data = data.filter((p) => p.status === filter.status);
    }

    if (filter.jalur !== "SEMUA") {
      data = data.filter((p) => p.jalur === filter.jalur);
    }

    data.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "tanggal") {
        cmp = a.tanggalDibuat.localeCompare(b.tanggalDibuat);
      } else if (sortKey === "nominal") {
        cmp = a.dataPenanggung.nominalUtang - b.dataPenanggung.nominalUtang;
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [dataPengajuan, filter, sortKey, sortDir]);

  // ── Sort toggle ──────────────────────────────────────────────────────────

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
    if (sortKey !== col)
      return (
        <span className="inline-flex flex-col gap-px text-slate-100">
          <IconChevronUp />
          <IconChevronDown />
        </span>
      );
    return sortDir === "asc" ? (
      <span className="text-slate-100">
        <IconChevronUp />
      </span>
    ) : (
      <span className="text-slate-100">
        <IconChevronDown />
      </span>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="font-inherit">
      {detailPengajuan && (
        <ModalDetail
          pengajuan={detailPengajuan}
          onClose={() => setDetailPengajuan(null)}
        />
      )}

      {/* ── Summary Stats ── */}
      <div className="mb-5 flex flex-wrap gap-3">
        <StatCard
          label="Total Pengajuan"
          value={stats.total}
          accentClass="bg-[#1a4e8f]"
          cardClass="bg-[#e8f0fb] border-[#c8d9f5]"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <path
                d="M9 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V7L9 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 2v5h5" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Dalam Proses"
          value={stats.diajukan}
          accentClass="bg-[#2563eb]"
          cardClass="bg-[#eff6ff] border-[#bfdbfe]"
          icon={
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
          }
        />
        <StatCard
          label="Disetujui"
          value={stats.disetujui}
          accentClass="bg-[#0f9b6e]"
          cardClass="bg-[#e6f7f2] border-[#a7e8d4]"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <path
                d="M3 8l3.5 3.5L13 4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <StatCard
          label="Perlu Tindakan"
          value={stats.perluRevisi}
          accentClass="bg-[#e07020]"
          cardClass="bg-[#fff3e6] border-[#f5c97a]"
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
            >
              <path
                d="M8 1.5L14.5 13H1.5L8 1.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8 6.5v3.5M8 11.5v.5" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5 rounded-xl border border-[#e2e8f2] bg-white p-[14px_16px]">
        {/* Search */}
        <div className="flex min-w-[160px] flex-[1_1_200px] items-center gap-2 rounded-lg border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-[7px]">
          <span className="flex-shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari Nomor Registrasi, nama, atau NIK…"
            value={filter.search}
            onChange={(e) =>
              setFilter((f) => ({ ...f, search: e.target.value }))
            }
            className="w-full border-none bg-transparent text-[13px] text-[#1a1a2e] outline-none"
          />
          {filter.search && (
            <button
              onClick={() => setFilter((f) => ({ ...f, search: "" }))}
              className="flex cursor-pointer border-none bg-transparent p-0 text-[#7a8899]"
            >
              <IconClose />
            </button>
          )}
        </div>

        {/* Filter status */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span className="text-[#7a8899]">
            <IconFilter />
          </span>
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                status: e.target.value as StatusPengajuan | "SEMUA",
              }))
            }
            className="cursor-pointer rounded-[7px] border border-[#e2e8f2] bg-white px-2.5 py-1.5 text-xs text-[#1a1a2e] outline-none"
          >
            <option value="SEMUA">Semua Status</option>
            {(Object.keys(STATUS_CONFIG) as StatusPengajuan[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter jalur */}
        <select
          value={filter.jalur ?? "SEMUA"}
          onChange={(e) => {
            const val = e.target.value;
            setFilter((f) => ({
              ...f,
              jalur: (val === "SEMUA" ? "SEMUA" : val) as
                | JalurPengajuan
                | "SEMUA",
            }));
          }}
          className="flex-shrink-0 cursor-pointer rounded-[7px] border border-[#e2e8f2] bg-white px-2.5 py-1.5 text-xs text-[#1a1a2e] outline-none"
        >
          <option value="SEMUA">Semua Jalur</option>
          <option value="PUPN">PUPN</option>
          <option value="NON_PUPN">Non-PUPN</option>
        </select>

        <div className="ml-auto flex-shrink-0 text-xs text-[#7a8899]">
          {filtered.length} dari {dataPengajuan.length} pengajuan
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#e2e8f2] bg-white">
        {filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 p-[56px_24px] text-[#7a8899]">
            <div className="text-[#1a4e8f] opacity-35">
              <IconFileText />
            </div>
            <div className="text-sm font-semibold text-[#8a96a3]">
              Tidak ada pengajuan yang cocok
            </div>
            <div className="text-xs text-[#b0bac5]">
              Coba ubah filter atau kata kunci pencarian.
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#e2e8f2] bg-[#263e6e]">
                {COLUMNS.map(({ label, key, widthClass }, idx) => (
                  <th
                    key={idx}
                    onClick={key ? () => handleSort(key) : undefined}
                    className={`p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] whitespace-nowrap text-slate-100 uppercase select-none ${
                      key ? "cursor-pointer" : "cursor-default"
                    } ${widthClass}`}
                  >
                    <span
                      className={`inline-flex items-center gap-1 ${
                        key && sortKey === key ? "text-slate-100" : ""
                      }`}
                    >
                      {label}
                      {key && <SortIcon col={key} />}
                    </span>
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
                    <td className="p-[12px_14px] text-xs font-semibold whitespace-nowrap text-[#7a8899]">
                      {idx + 1}
                    </td>

                    {/* Kolom gabungan: No Reg + Nama + Tgl */}
                    <td className="p-[12px_14px]">
                      <div className="font-mono text-xs font-bold whitespace-nowrap text-[#1a4e8f]">
                        {p.id}
                      </div>
                      <div className="mt-0.5 text-[13px] font-semibold whitespace-nowrap text-[#1a1a2e]">
                        {p.dataPenanggung.namaWP}
                      </div>
                      <div className="mt-px text-[11px] text-[#7a8899]">
                        {formatTanggal(p.tanggalDibuat)}
                      </div>
                    </td>

                    {/* Kolom gabungan: Nominal + Jalur + Jenis */}
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

                    {/* Status */}
                    <td className="p-[12px_14px] whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Aksi */}
                    <td className="p-[12px_14px] whitespace-nowrap">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setDetailPengajuan(p)}
                          title="Lihat Detail"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[#e2e8f2] bg-[#f7f8fa] text-[#7a8899] transition-colors duration-150 hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
                        >
                          <IconEye />
                        </button>
                        {(p.status === "DRAFT" ||
                          p.status === "PERLU_REVISI") && (
                          <button
                            title="Edit / Revisi"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[#e2e8f2] bg-[#f7f8fa] text-[#7a8899] transition-colors duration-150 hover:border-[#f5c97a] hover:bg-[#fff3e6] hover:text-[#e07020]"
                          >
                            <IconEdit />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer info ── */}
      {filtered.length > 0 && (
        <div className="mt-2.5 text-right text-[11px] text-[#b0bac5]">
          Menampilkan {filtered.length} dari {dataPengajuan.length} pengajuan
          &nbsp;·&nbsp; Unit:{" "}
          <span className="font-semibold">{dataPengajuan[0].unitPengaju}</span>
        </div>
      )}
    </div>
  );
}
