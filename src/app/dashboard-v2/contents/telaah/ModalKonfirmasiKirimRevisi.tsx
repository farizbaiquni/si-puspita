"use client";

/* ------------------------------------------------------------------ */
/*  ModalKonfirmasiKirimRevisi.tsx                                     */
/*  Modal admin konfirmasi kirim revisi telaah internal ke OPD.        */
/*  Menampilkan catatan berjenjang + textarea catatan tambahan admin.  */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import type { TelaahLogEntry } from "@/types/telaah-internal";
import {
  TELAAH_MILESTONE_LABEL,
  TELAAH_LEVEL_LABEL,
} from "@/types/telaah-internal";
import { formatTanggalWaktu } from "./TelaahDokumenShared";

interface ModalKonfirmasiKirimRevisiProps {
  nomorRegistrasi: string;
  nomorPengajuan: string;
  namaOPD: string;
  catatanBerjenjang: TelaahLogEntry[];
  onConfirm: (catatanTambahan: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

const IconSend = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M2.5 10L17.5 3l-7 7.5-2 6.5-2.5-4.5-3.5-2.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

const MILESTONE_COLOR: Record<string, string> = {
  REVISI_DARI_KASUBBID: "bg-orange-500",
  REVISI_DARI_KABID: "bg-orange-500",
  REVISI_DARI_SEKBAN: "bg-orange-500",
  DITERUSKAN_KASUBBID: "bg-amber-500",
  DITERUSKAN_KABID: "bg-amber-500",
};

export default function ModalKonfirmasiKirimRevisi({
  nomorRegistrasi,
  nomorPengajuan,
  namaOPD,
  catatanBerjenjang,
  onConfirm,
  onClose,
  isSubmitting,
  errorMessage,
}: ModalKonfirmasiKirimRevisiProps) {
  const identitas = nomorRegistrasi || nomorPengajuan;
  const [catatanTambahan, setCatatanTambahan] = useState("");

  const handleConfirm = () => {
    onConfirm(catatanTambahan.trim());
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Konfirmasi Kirim Revisi ke OPD"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-[#e2e8f2] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef1f5] px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-[#b45309]">
              <IconSend />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] leading-snug font-bold text-[#1a1a2e]">
                Kirim Revisi ke OPD?
              </h3>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#7a8899]">
                Revisi telaah internal akan dikirim ke OPD untuk diperbaiki.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-[#7a8899] transition hover:bg-[#f0f4fb] hover:text-[#1a1a2e] disabled:opacity-50"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="rounded-sm border border-[#eef1f5] bg-[#f9fafc] p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                  Nomor Registrasi
                </div>
                <div className="mt-0.5 font-mono text-[13px] font-bold text-[#0f9b6e]">
                  {identitas}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                  Nama OPD
                </div>
                <div className="mt-0.5 text-[13px] font-semibold text-[#1a1a2e]">
                  {namaOPD}
                </div>
              </div>
            </div>
          </div>

          {/* Catatan berjenjang */}
          <div>
            <p className="mb-2 text-[11px] font-bold tracking-wider text-[#7a8899] uppercase">
              Catatan Berjenjang dari Telaah ({catatanBerjenjang.length})
            </p>
            <div className="space-y-2 rounded-sm border border-[#eef1f5] bg-white p-3">
              {catatanBerjenjang.length === 0 ? (
                <p className="text-[12px] text-[#7a8899] italic">
                  Tidak ada catatan khusus — pengajuan ini dikembalikan untuk
                  revisi.
                </p>
              ) : (
                catatanBerjenjang.map((entry, idx) => {
                  const isRevisi = entry.milestone.startsWith("REVISI_DARI_");
                  const levelLabel =
                    entry.olehTelaahLevel === "admin"
                      ? "Admin"
                      : TELAAH_LEVEL_LABEL[entry.olehTelaahLevel];
                  const colorClass =
                    MILESTONE_COLOR[entry.milestone] ?? "bg-[#5a6474]";
                  return (
                    <div
                      key={idx}
                      className="rounded-sm border border-[#eef1f5] bg-[#f9fafc] p-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${colorClass}`}
                        />
                        <span
                          className={`text-[11.5px] font-bold ${
                            isRevisi ? "text-[#9a3412]" : "text-[#b45309]"
                          }`}
                        >
                          {levelLabel}
                        </span>
                        <span className="text-[10.5px] text-[#7a8899]">
                          · {TELAAH_MILESTONE_LABEL[entry.milestone]}
                        </span>
                        <span className="text-[10.5px] text-[#b0bac5]">
                          · {formatTanggalWaktu(entry.timestamp)}
                        </span>
                      </div>
                      {entry.catatan.trim() ? (
                        <p className="mt-1.5 text-[12.5px] leading-relaxed whitespace-pre-line text-[#3a4454]">
                          {entry.catatan}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11.5px] text-[#b0bac5] italic">
                          (tanpa catatan)
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Catatan tambahan Admin */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold tracking-wider text-[#7a8899] uppercase">
              Catatan Tambahan dari Admin (opsional)
            </label>
            <textarea
              value={catatanTambahan}
              onChange={(e) => setCatatanTambahan(e.target.value)}
              rows={3}
              placeholder="Tambah arahan/deadline/instruksi ke OPD… (boleh dikosongkan)"
              className="w-full resize-none rounded-sm border border-[#e2e8f2] bg-gray-50 p-3 text-[13px] text-[#1a1a2e] outline-none focus:border-[#a0bdec] focus:bg-white"
            />
          </div>

          {/* Info */}
          <div className="rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-3.5 py-2.5 text-[11.5px] text-[#1e40af]">
            <span className="font-semibold">ℹ️ Setelah dikirim:</span> OPD akan
            menerima notifikasi. Status pengajuan tetap{" "}
            <span className="font-bold">Teregistrasi</span>, dengan badge
            tambahan <span className="font-bold">Revisi Telaah Internal</span>.
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mx-6 mb-3 shrink-0 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-[12px] text-[#c0392b]">
            {errorMessage}
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#eef1f5] bg-[#f9fafc] px-6 py-3.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-sm border border-[#e2e8f2] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#5a6474] transition hover:bg-[#f0f4fb] disabled:opacity-50 sm:w-auto"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full rounded-sm bg-[#f59e0b] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#d97706] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? "Mengirim…" : "Ya, Kirim ke OPD"}
          </button>
        </div>
      </div>
    </div>
  );
}
