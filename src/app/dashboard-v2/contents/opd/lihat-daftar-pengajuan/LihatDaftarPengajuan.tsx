"use client";

import React, { useState, useMemo } from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  StatusFormulir,
} from "@/types/types-v2";
import {
  CHECKLIST_STATUS_PIUTANG,
  CHECKLIST_UPAYA_PENAGIHAN,
} from "@/lib/checklistPersyaratan";
import { MOCK_DATA } from "../../dummyData";
import {
  IconSearch,
  IconFilter,
  IconClose,
  IconEye,
  IconUser,
  IconBriefcase,
  IconDocument,
  IconCalendar,
  IconTag,
  IconUsers,
  IconCash,
  IconTrash,
  IconFile,
} from "./icons";

// ────────────────────────────── HELPERS ─────────────────────────────────────
function formatRupiah(angka: string): string {
  const num = parseInt(angka, 10);
  return isNaN(num) ? "Rp 0" : "Rp " + num.toLocaleString("id-ID");
}

function formatTanggal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "T00:00:00Z"));
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTanggalWaktu(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB"
  );
}

// ────────────────────────────── STATUS CONFIG ───────────────────────────────
const STATUS_CONFIG: Record<
  StatusFormulir,
  { label: string; badgeClass: string; dotClass: string }
> = {
  diajukan: {
    label: "Diajukan",
    badgeClass: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    dotClass: "bg-[#3b82f6]",
  },
  revisi: {
    label: "Revisi",
    badgeClass: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dotClass: "bg-[#f97316]",
  },
  lolos_verifikasi: {
    label: "Lolos Verifikasi",
    badgeClass: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
    dotClass: "bg-[#10b981]",
  },
};

// ──────────────────────── SORT INDICATOR ────────────────────────────────────
const SortIndicator: React.FC<{
  sortKey: string;
  currentKey: string;
  currentDir: "asc" | "desc";
}> = ({ sortKey, currentKey, currentDir }) => {
  if (sortKey !== currentKey) return null;
  return currentDir === "asc" ? (
    <span className="ml-1 inline-block text-[10px]">▲</span>
  ) : (
    <span className="ml-1 inline-block text-[10px]">▼</span>
  );
};

// ──────────────────────────── STAT CARD ─────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: number | string;
  accentClass: string;
  cardClass: string;
  icon: React.ReactNode;
}> = ({ label, value, accentClass, cardClass, icon }) => (
  <div
    className={`flex min-w-0 items-center gap-2.5 rounded-md border px-3 py-3 sm:gap-3 sm:px-4.5 sm:py-3.5 ${cardClass}`}
  >
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white sm:h-9 sm:w-9 ${accentClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="truncate text-lg leading-tight font-bold text-[#1a1a2e] sm:text-xl">
        {value}
      </div>
      <div className="mt-0.5 truncate text-[11px] text-[#7a8899] sm:text-xs">
        {label}
      </div>
    </div>
  </div>
);

// ───────────────────────── STATUS BADGE ─────────────────────────────────────
const StatusBadge: React.FC<{ status: StatusFormulir }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.25 rounded-full border px-2.25 py-0.75 text-[11px] font-semibold tracking-wide whitespace-nowrap ${cfg.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
};

// ──────────────────── MODAL PREVIEW PDF (FULLSCREEN DENGAN PADDING KECIL) ────
const PdfPreviewModal: React.FC<{
  url: string;
  title: string;
  onClose: () => void;
}> = ({ url, title, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-full w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="truncate text-sm font-medium text-gray-700">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={url}
            className="h-full w-full"
            title={title}
            style={{ border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

// ──────────────── HASIL VERIFIKASI (beda tampilan revisi vs lolos) ──────────
const HasilVerifikasiSection: React.FC<{
  record: FormulirPenghapusanPiutangOPDRecord;
}> = ({ record }) => {
  const { status, checklistSubstantif, catatanVerifikasi, tanggalVerifikasi } =
    record;

  // Belum diverifikasi — tidak ada apa pun untuk ditampilkan di sini.
  if (status === "diajukan") return null;

  const isRevisi = status === "revisi";

  // Poin checklist yang BELUM terpenuhi, dikelompokkan sama seperti di panel
  // verifikasi BPKAD (Status Piutang & Upaya Penagihan) agar OPD mudah
  // mencocokkan dokumen mana yang perlu dilengkapi/diperbaiki.
  const belumStatusPiutang = CHECKLIST_STATUS_PIUTANG.filter(
    (item) => !checklistSubstantif?.[item.id],
  );
  const belumUpayaPenagihan = CHECKLIST_UPAYA_PENAGIHAN.filter(
    (item) => !checklistSubstantif?.[item.id],
  );
  const totalBelumTerpenuhi =
    belumStatusPiutang.length + belumUpayaPenagihan.length;

  return (
    <div className="mb-6">
      <h3
        className={`mb-3 text-xs font-bold tracking-widest uppercase ${
          isRevisi ? "text-[#c0392b]" : "text-[#0f6e56]"
        }`}
      >
        Hasil Verifikasi BPKAD
      </h3>

      {isRevisi ? (
        <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[#991b1b]">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M8 1.5L14.5 13H1.5L8 1.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8 6.5v3.5M8 11.5v.5" strokeLinecap="round" />
            </svg>
            Pengajuan perlu direvisi
          </div>
          {tanggalVerifikasi && (
            <p className="mb-3 text-[11px] text-[#b45454]">
              Ditinjau pada {formatTanggalWaktu(tanggalVerifikasi)}
            </p>
          )}

          {/* Keterangan / alasan revisi dari BPKAD */}
          <div className="mb-3 rounded border border-[#fecaca] bg-white p-3">
            <div className="mb-1 text-[11px] font-semibold tracking-wide text-[#7a1f1f] uppercase">
              Keterangan dari BPKAD
            </div>
            <p className="text-[13px] leading-snug whitespace-pre-line text-[#3f1d1d]">
              {catatanVerifikasi || "Tidak ada keterangan tambahan."}
            </p>
          </div>

          {/* Poin checklist yang belum terpenuhi, per grup */}
          {totalBelumTerpenuhi > 0 && (
            <div className="space-y-3">
              {belumStatusPiutang.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#7a1f1f] uppercase">
                    Status Piutang — belum terpenuhi (
                    {belumStatusPiutang.length})
                  </div>
                  <ul className="space-y-1.5">
                    {belumStatusPiutang.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 rounded border border-[#fecaca] bg-white px-3 py-2 text-[12.5px] text-[#3f1d1d]"
                      >
                        <svg
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c0392b]"
                          fill="none"
                          viewBox="0 0 14 14"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4l6 6M10 4l-6 6" strokeLinecap="round" />
                        </svg>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {belumUpayaPenagihan.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#7a1f1f] uppercase">
                    Upaya Penagihan — belum terpenuhi (
                    {belumUpayaPenagihan.length})
                  </div>
                  <ul className="space-y-1.5">
                    {belumUpayaPenagihan.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 rounded border border-[#fecaca] bg-white px-3 py-2 text-[12.5px] text-[#3f1d1d]"
                      >
                        <svg
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c0392b]"
                          fill="none"
                          viewBox="0 0 14 14"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M4 4l6 6M10 4l-6 6" strokeLinecap="round" />
                        </svg>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-[#a7f3d0] bg-[#ecfdf5] p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[#065f46]">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M3 8l3.5 3.5L13 4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Pengajuan lolos verifikasi
          </div>
          {tanggalVerifikasi && (
            <p className="mb-2 text-[11px] text-[#3a8f74]">
              Diverifikasi pada {formatTanggalWaktu(tanggalVerifikasi)}
            </p>
          )}
          <p className="text-[13px] leading-snug text-[#0f4c3c]">
            Seluruh poin Checklist Persyaratan Substantif (Status Piutang &
            Upaya Penagihan) telah dinyatakan terpenuhi oleh BPKAD.
          </p>
          {catatanVerifikasi && (
            <div className="mt-3 rounded border border-[#a7f3d0] bg-white p-3">
              <div className="mb-1 text-[11px] font-semibold tracking-wide text-[#0f6e56] uppercase">
                Catatan tambahan dari BPKAD
              </div>
              <p className="text-[13px] leading-snug whitespace-pre-line text-[#0f4c3c]">
                {catatanVerifikasi}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ──────────────────────── MODAL DETAIL ──────────────────────────
const ModalDetail: React.FC<{
  record: FormulirPenghapusanPiutangOPDRecord;
  onClose: () => void;
}> = ({ record, onClose }) => {
  const nom = record.nominatif;
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(
    null,
  );

  const identitasRows = [
    { icon: <IconUser />, uraian: "OPD Pengusul", value: record.namaOPD },
    {
      icon: <IconUser />,
      uraian: "Nama Penanggung Jawab",
      value: record.namaPenanggungJawab,
    },
    {
      icon: <IconBriefcase />,
      uraian: "Jabatan (Ka OPD)",
      value: record.jabatan,
    },
    {
      icon: <IconDocument />,
      uraian: "Nomor Surat Pengantar",
      value: record.nomorSurat,
    },
    {
      icon: <IconCalendar />,
      uraian: "Tanggal Surat",
      value: formatTanggal(record.tanggalSurat),
    },
    { icon: <IconTag />, uraian: "Jenis Piutang", value: record.jenisPiutang },
    {
      icon: <IconUsers />,
      uraian: "Jumlah Debitur",
      value: record.jumlahDebitur,
    },
    {
      icon: <IconCash />,
      uraian: "Total Nilai Piutang yang Diusulkan",
      value: formatRupiah(record.totalNilaiPiutang),
    },
    {
      icon: <IconTrash />,
      uraian: "Jenis Penghapusan",
      value: record.jenisPenghapusan,
    },
    {
      icon: <IconFile />,
      uraian: "File Surat Pengantar",
      value: record.fileSurat ? "Tersedia" : "Tidak ada",
    },
  ];

  const dokumenChecklist = [
    { label: "Surat Pengantar Usulan", file: nom.suratPengantarUsulan },
    {
      label: "Daftar Nominatif Usulan Piutang SKPD",
      file: nom.daftarNominatifPiutang,
    },
    {
      label: "Dokumen Dasar Piutang",
      file:
        nom.opsiDokumenDasarPiutang === "ada" ? nom.dokumenDasarPiutang : null,
      keterangan:
        nom.opsiDokumenDasarPiutang === "tidak_ada" ? "Tidak ada" : undefined,
    },
    {
      label: "Rekapitulasi saldo piutang (Rp)",
      file: nom.rekapitulasiSaldoPiutang,
    },
    {
      label: "Neraca awal pencatatan piutang",
      file: nom.neracaAwalPencatatanPiutang,
    },
    { label: "Rekapitulasi angsuran (Rp)", file: nom.rekapitulasiAngsuran },
    {
      label: "Dokumen pendukung lainnya (Surat tidak mampu bayar)",
      file: nom.dokumenPendukungSuratTidakMampuBayar,
    },
    // Riwayat penagihan (1) – muncul selalu, file hanya ada jika opsi "riwayat"
    {
      label: "Riwayat penagihan (1)",
      file:
        nom.opsiRiwayatPenagihan === "riwayat" ? nom.riwayatPenagihan1 : null,
    },
    // Riwayat penagihan (2)
    {
      label: "Riwayat penagihan (2)",
      file:
        nom.opsiRiwayatPenagihan === "riwayat" ? nom.riwayatPenagihan2 : null,
    },
    // Riwayat penagihan (3)
    {
      label: "Riwayat penagihan (3)",
      file:
        nom.opsiRiwayatPenagihan === "riwayat" ? nom.riwayatPenagihan3 : null,
    },
    // Surat Pernyataan OPD – muncul selalu, file hanya ada jika opsi "pernyataan"
    {
      label: "Surat Pernyataan OPD",
      file:
        nom.opsiRiwayatPenagihan === "pernyataan"
          ? nom.filePernyataanOPD
          : null,
    },
  ];

  return (
    <>
      {preview && (
        <PdfPreviewModal
          url={preview.url}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}

      <div
        className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,20,40,0.45)] p-0 backdrop-blur-sm sm:p-4 lg:p-6"
        onClick={onClose}
      >
        <div
          className="animate-scale-in flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header ringkas */}
          <div className="shrink-0 bg-linear-to-r from-[#1a4e8f] to-[#0e3b6e] px-4 py-3 text-white sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold">
                    {record.namaPenanggungJawab}
                  </h2>
                  <StatusBadge status={record.status} />
                </div>
                <p className="truncate text-sm text-blue-100">
                  {record.namaOPD}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                title="Tutup"
              >
                <IconClose />
              </button>
            </div>
          </div>

          {/* Body dengan scroll */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {/* Hasil Verifikasi BPKAD — tampil beda untuk revisi vs lolos */}
            <HasilVerifikasiSection record={record} />

            {/* Tabel 1: Identitas Usulan */}
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-bold tracking-widest text-[#1a4e8f] uppercase">
                Identitas Usulan
              </h3>
              <div className="overflow-x-auto rounded-md border border-[#e2e8f2] bg-white">
                <table className="w-full min-w-105 border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-[#475569]">
                      <th className="w-2/5 px-4 py-2.5 text-left font-semibold tracking-wider uppercase">
                        Uraian
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold tracking-wider uppercase">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f2]">
                    {identitasRows.map((item, i) => (
                      <tr
                        key={i}
                        className={`transition-colors hover:bg-[#f8fafc] ${i % 2 === 0 ? "bg-white" : "bg-[#fafbfc]"}`}
                      >
                        <td className="flex items-center gap-2 px-4 py-2.5 font-medium text-[#334155]">
                          {item.icon}
                          {item.uraian}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-[#0f172a]">
                          {item.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabel 2: Persyaratan Administrasi */}
            <div>
              <h3 className="mb-3 text-xs font-bold tracking-widest text-[#1a4e8f] uppercase">
                Persyaratan Administrasi
              </h3>
              <div className="overflow-x-auto rounded-md border border-[#e2e8f2] bg-white">
                <table className="w-full min-w-105 border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-[#475569]">
                      <th className="w-2/5 px-4 py-2.5 text-left font-semibold tracking-wider uppercase">
                        Nama Dokumen
                      </th>
                      <th className="w-1/5 px-4 py-2.5 text-center font-semibold tracking-wider uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-center font-semibold tracking-wider uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f2]">
                    {dokumenChecklist.map((doc, idx) => {
                      const tersedia = !!doc.file;
                      return (
                        <tr
                          key={idx}
                          className={`transition-colors hover:bg-[#f8fafc] ${idx % 2 === 0 ? "bg-white" : "bg-[#fafbfc]"}`}
                        >
                          <td className="px-4 py-2.5 font-medium text-[#0f172a]">
                            {doc.label}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {tersedia ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-semibold text-[#065f46]">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 14 14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M3 7l3 3 5-5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Tersedia
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#fef2f2] px-2 py-0.5 text-[11px] font-semibold text-[#991b1b]">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 14 14"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M4 4l6 6M10 4l-6 6"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                {doc.keterangan ?? "Tidak ada"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {tersedia ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreview({
                                    url: doc.file!.url,
                                    title: `${doc.label} (${doc.file!.namaFile})`,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-[11px] font-semibold text-[#1a4e8f] shadow-sm transition-all hover:bg-[#dbeafe] hover:shadow-md"
                              >
                                <IconEye />
                                Preview
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#cbd5e1]">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animasi */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.96);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

// ─────────────────── KARTU PENGAJUAN (TAMPILAN MOBILE, PENGGANTI TABEL) ─────
const RecordCardMobile: React.FC<{
  record: FormulirPenghapusanPiutangOPDRecord;
  nomor: number;
  onLihatDetail: () => void;
}> = ({ record, nomor, onLihatDetail }) => (
  <div className="rounded-md border border-[#e2e8f2] bg-white p-3.5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="text-[11px] font-semibold text-[#b0bac5]">
          #{nomor}
        </span>
        <div className="mt-1 truncate text-[13px] font-semibold text-[#1a1a2e]">
          {record.namaPenanggungJawab}
        </div>
        <div className="truncate text-[11px] text-[#7a8899]">
          {record.jabatan}
        </div>
      </div>
      <button
        onClick={onLihatDetail}
        title="Lihat Detail"
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[7px] border border-[#e2e8f2] bg-[#f7f8fa] text-[#7a8899] transition-colors duration-150 hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
      >
        <IconEye />
      </button>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#f1f5f9] pt-3 text-xs">
      <div>
        <div className="text-[10px] tracking-wide text-[#b0bac5] uppercase">
          Tanggal Surat
        </div>
        <div className="mt-0.5 text-[#5a6474]">
          {formatTanggal(record.tanggalSurat)}
        </div>
      </div>
      <div>
        <div className="text-[10px] tracking-wide text-[#b0bac5] uppercase">
          Debitur
        </div>
        <div className="mt-0.5 text-[#5a6474]">
          {record.jumlahDebitur} orang
        </div>
      </div>
      <div className="col-span-2">
        <div className="text-[10px] tracking-wide text-[#b0bac5] uppercase">
          Total Piutang
        </div>
        <div className="mt-0.5 font-bold text-[#1a4e8f]">
          {formatRupiah(record.totalNilaiPiutang)}
        </div>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f1f5f9] pt-3">
      <StatusBadge status={record.status} />
      {record.status === "revisi" && (
        <button
          onClick={onLihatDetail}
          className="cursor-pointer text-[11px] font-semibold text-[#c0392b] hover:underline"
        >
          Lihat catatan revisi →
        </button>
      )}
    </div>
  </div>
);

// ──────────────────────────── MAIN COMPONENT ─────────────────────────────────
export default function DaftarPengajuanOPDBaru({
  data: dataProp,
}: {
  data?: FormulirPenghapusanPiutangOPDRecord[];
}) {
  const data = useMemo(() => dataProp ?? MOCK_DATA, [dataProp]);

  const [filter, setFilter] = useState<{
    search: string;
    status: StatusFormulir | "SEMUA";
  }>({ search: "", status: "SEMUA" });

  const [sortKey, setSortKey] = useState<"tanggal" | "total">("tanggal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedRecord, setSelectedRecord] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);

  // ── Derived stats ──
  const stats = useMemo(() => {
    const total = data.length;
    const diajukan = data.filter((r) => r.status === "diajukan").length;
    const revisi = data.filter((r) => r.status === "revisi").length;
    const lolos = data.filter((r) => r.status === "lolos_verifikasi").length;
    return { total, diajukan, revisi, lolos };
  }, [data]);

  // ── Filtered + sorted ──
  const filtered = useMemo(() => {
    let result = [...data];

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.namaPenanggungJawab.toLowerCase().includes(q) ||
          r.nomorSurat.toLowerCase().includes(q),
      );
    }

    if (filter.status !== "SEMUA") {
      result = result.filter((r) => r.status === filter.status);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "tanggal") {
        cmp = a.tanggalSurat.localeCompare(b.tanggalSurat);
      } else {
        const totalA = parseInt(a.totalNilaiPiutang, 10) || 0;
        const totalB = parseInt(b.totalNilaiPiutang, 10) || 0;
        cmp = totalA - totalB;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [data, filter, sortKey, sortDir]);

  // ── Toggle sort key ──
  const toggleSortKey = (key: "tanggal" | "total") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // ── Render ──
  return (
    <div className="font-inherit">
      {selectedRecord && (
        <ModalDetail
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
          label="Diajukan"
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
          label="Revisi"
          value={stats.revisi}
          accentClass="bg-[#f97316]"
          cardClass="bg-[#fff7ed] border-[#fed7aa]"
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
        <StatCard
          label="Lolos Verifikasi"
          value={stats.lolos}
          accentClass="bg-[#10b981]"
          cardClass="bg-[#ecfdf5] border-[#a7f3d0]"
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
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5 rounded-md border border-[#e2e8f2] bg-white p-3 sm:p-[14px_16px]">
        <div className="flex min-w-0 flex-[1_1_100%] items-center gap-2 rounded-lg border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.75 sm:flex-[1_1_200px]">
          <span className="shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari nomor registrasi, nama, atau nomor surat…"
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
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[#7a8899]">
            <IconFilter />
          </span>
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                status: e.target.value as StatusFormulir | "SEMUA",
              }))
            }
            className="cursor-pointer rounded-[7px] border border-[#e2e8f2] bg-white px-2.5 py-1.5 text-xs text-[#1a1a2e] outline-none"
          >
            <option value="SEMUA">Semua Status</option>
            {(Object.keys(STATUS_CONFIG) as StatusFormulir[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto shrink-0 text-xs whitespace-nowrap text-[#7a8899]">
          {filtered.length} dari {data.length} pengajuan
        </div>
      </div>

      {/* Daftar pengajuan: kartu di layar sempit, tabel di tablet/desktop */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-[#e2e8f2] bg-white p-[56px_24px] text-[#7a8899]">
          <div className="text-[#1a4e8f] opacity-35">
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
          </div>
          <div className="text-sm font-semibold text-[#8a96a3]">
            Tidak ada pengajuan yang cocok
          </div>
          <div className="text-xs text-[#b0bac5]">
            Coba ubah filter atau kata kunci pencarian.
          </div>
        </div>
      ) : (
        <>
          {/* Tampilan kartu — layar sempit (HP/tablet kecil) */}
          <div className="space-y-3 md:hidden">
            {filtered.map((record, idx) => (
              <RecordCardMobile
                key={record.id}
                record={record}
                nomor={idx + 1}
                onLihatDetail={() => setSelectedRecord(record)}
              />
            ))}
          </div>

          {/* Tampilan tabel — tablet ke atas, dengan scroll horizontal sebagai jaring pengaman */}
          <div className="hidden overflow-x-auto rounded-md border border-[#e2e8f2] bg-white md:block">
            <table className="w-full min-w-180 border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#e2e8f2] bg-[#263e6e]">
                  <th className="w-8 p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    No
                  </th>
                  <th className="p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    Pengajuan
                  </th>
                  <th
                    className="w-30 cursor-pointer p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none"
                    onClick={() => toggleSortKey("tanggal")}
                  >
                    Tanggal Surat{" "}
                    <SortIndicator
                      sortKey={sortKey}
                      currentKey="tanggal"
                      currentDir={sortDir}
                    />
                  </th>
                  <th
                    className="w-45 cursor-pointer p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none"
                    onClick={() => toggleSortKey("total")}
                  >
                    Total Piutang{" "}
                    <SortIndicator
                      sortKey={sortKey}
                      currentKey="total"
                      currentDir={sortDir}
                    />
                  </th>
                  <th className="w-20 p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    Debitur
                  </th>
                  <th className="w-32.5 p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    Status
                  </th>
                  <th className="w-18 p-[10px_14px] text-left text-[11px] font-bold tracking-[0.06em] text-slate-100 uppercase select-none">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => (
                  <tr
                    key={record.id}
                    className={`transition-colors duration-150 hover:bg-[#fafbfc] ${idx === filtered.length - 1 ? "" : "border-b border-[#e2e8f2]"}`}
                  >
                    <td className="p-[12px_14px] text-xs font-semibold whitespace-nowrap text-[#7a8899]">
                      {idx + 1}
                    </td>
                    <td className="p-[12px_14px]">
                      <div className="text-[13px] font-semibold whitespace-nowrap text-[#1a1a2e]">
                        {record.namaPenanggungJawab}
                      </div>
                      <div className="mt-px text-[11px] text-[#7a8899]">
                        {record.jabatan}
                      </div>
                    </td>
                    <td className="p-[12px_14px] text-xs whitespace-nowrap text-[#5a6474]">
                      {formatTanggal(record.tanggalSurat)}
                    </td>
                    <td className="p-[12px_14px] font-bold whitespace-nowrap text-[#1a4e8f]">
                      {formatRupiah(record.totalNilaiPiutang)}
                    </td>
                    <td className="p-[12px_14px] text-xs whitespace-nowrap text-[#5a6474]">
                      {record.jumlahDebitur} orang
                    </td>
                    <td className="p-[12px_14px] whitespace-nowrap">
                      <StatusBadge status={record.status} />
                      {record.status === "revisi" && (
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="mt-1 block cursor-pointer text-[11px] font-semibold text-[#c0392b] hover:underline"
                        >
                          Lihat catatan revisi →
                        </button>
                      )}
                    </td>
                    <td className="p-[12px_14px] whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        title="Lihat Detail"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[#e2e8f2] bg-[#f7f8fa] text-[#7a8899] transition-colors duration-150 hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
                      >
                        <IconEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {filtered.length > 0 && (
        <div className="mt-2.5 text-right text-[11px] text-[#b0bac5]">
          Menampilkan {filtered.length} dari {data.length} pengajuan
        </div>
      )}
    </div>
  );
}
