"use client";

/* ------------------------------------------------------------------ */
/*  ModalKonfirmasiAjukanReviu.tsx                                     */
/*  Modal konfirmasi sebelum admin mengajukan pengajuan ke Reviu        */
/*  Inspektorat.                                                       */
/* ------------------------------------------------------------------ */

const IconCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
  >
    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
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

interface ModalKonfirmasiAjukanReviuProps {
  nomorRegistrasi: string;
  nomorPengajuan: string;
  namaOPD: string;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export default function ModalKonfirmasiAjukanReviu({
  nomorRegistrasi,
  nomorPengajuan,
  namaOPD,
  onConfirm,
  onClose,
  isSubmitting,
  errorMessage,
}: ModalKonfirmasiAjukanReviuProps) {
  const identitas = nomorRegistrasi || nomorPengajuan;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Konfirmasi Ajukan Reviu Inspektorat"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-sm border border-[#d8dfe8] bg-white shadow-2xl">
        <div className="h-1 w-full bg-[#7c3aed]" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#eef1f5] px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#f3efff] text-[#7c3aed]">
              <IconCheck />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] leading-snug font-bold text-[#1a1a2e]">
                Ajukan Reviu Inspektorat?
              </h3>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#7a8899]">
                Konfirmasi sebelum pengajuan masuk ke tahap Reviu Inspektorat.
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

        {/* Body — 2 kolom */}
        <div className="grid grid-cols-1 gap-4 px-6 py-5 lg:grid-cols-5">
          {/* Kiri (3/5): Info pengajuan */}
          <div className="lg:col-span-3">
            <p className="mb-2 text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
              Detail Pengajuan
            </p>
            <div className="rounded-sm border border-[#e2e8f2] bg-[#f9fafc]">
              <div className="flex items-start gap-3 border-b border-[#eef1f5] px-4 py-3">
                <span className="w-28 shrink-0 text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
                  No. Registrasi
                </span>
                <span className="min-w-0 flex-1 font-mono text-[13px] font-bold break-all text-[#0f9b6e]">
                  {identitas}
                </span>
              </div>
              <div className="flex items-start gap-3 border-b border-[#eef1f5] px-4 py-3">
                <span className="w-28 shrink-0 text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
                  Nama OPD
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#1a1a2e]">
                  {namaOPD}
                </span>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="w-28 shrink-0 text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
                  Telaah Internal
                </span>
                <span className="inline-flex items-center rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-semibold text-[#065f46]">
                  ✓ Selesai
                </span>
              </div>
            </div>
          </div>

          {/* Kanan (2/5): Info reviu */}
          <div className="lg:col-span-2">
            <p className="mb-2 text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
              Info Reviu
            </p>
            <div className="rounded-sm border border-[#ddd0fb] bg-[#f3efff] px-4 py-3">
              <p className="text-[11.5px] leading-relaxed text-[#5b21b6]">
                Setelah diajukan:
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-[#5b21b6]">
                <li className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7c3aed]" />
                  Status pengajuan berubah menjadi{" "}
                  <span className="font-bold">Menunggu Reviu Inspektorat</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7c3aed]" />
                  Proses reviu dilakukan oleh Inspektorat{" "}
                  <span className="font-bold">di luar sistem</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7c3aed]" />
                  OPD akan menerima notifikasi
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mx-6 mb-3 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-[12px] text-[#c0392b]">
            {errorMessage}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-[#eef1f5] bg-[#f9fafc] px-6 py-3.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-sm border border-[#e2e8f2] bg-white px-4 py-2 text-[13px] font-semibold text-[#5a6474] transition hover:bg-[#f0f4fb] disabled:opacity-50 sm:w-auto"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full rounded-sm bg-[#7c3aed] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? "Mengajukan…" : "Ya, Ajukan Reviu"}
          </button>
        </div>
      </div>
    </div>
  );
}
