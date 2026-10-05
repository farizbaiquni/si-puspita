"use client";

/* ------------------------------------------------------------------ */
/*  ModalKonfirmasiAjukan.tsx                                          */
/*  Modal konfirmasi sebelum admin mengajukan pengajuan ke telaah      */
/*  internal.                                                          */
/*                                                                      */
/*  Design:                                                            */
/*   - Width: max-w-2xl (lebih lebar, body 2 kolom).                   */
/*   - Radius: rounded-sm (2px) — formal pemerintahan.                  */
/*   - Top accent bar navy.                                            */
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

interface ModalKonfirmasiAjukanProps {
  nomorRegistrasi: string;
  nomorPengajuan: string;
  namaOPD: string;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export default function ModalKonfirmasiAjukan({
  nomorRegistrasi,
  nomorPengajuan,
  namaOPD,
  onConfirm,
  onClose,
  isSubmitting,
  errorMessage,
}: ModalKonfirmasiAjukanProps) {
  const identitas = nomorRegistrasi || nomorPengajuan;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Konfirmasi Ajukan Telaah Internal"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-sm border border-[#d8dfe8] bg-white shadow-2xl">
        {/* ── Top accent bar ── */}
        <div className="h-1 w-full bg-[#1a4e8f]" />

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 border-b border-[#eef1f5] px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#eff6ff] text-[#1a4e8f]">
              <IconCheck />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] leading-snug font-bold text-[#1a1a2e]">
                Ajukan Telaah Internal?
              </h3>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#7a8899]">
                Konfirmasi sebelum pengajuan masuk ke tahap telaah substantif.
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

        {/* ── Body — 2 kolom ── */}
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
                  Status Pengajuan
                </span>
                <span className="inline-flex items-center rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-semibold text-[#065f46]">
                  Teregistrasi
                </span>
              </div>
            </div>
          </div>

          {/* Kanan (2/5): Alur telaah */}
          <div className="lg:col-span-2">
            <p className="mb-2 text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
              Alur Telaah
            </p>
            <div className="rounded-sm border border-[#dbe6f7] bg-[#f0f6fd] px-4 py-3">
              <div className="space-y-2.5">
                {["Kasubbid", "Kabid", "Sekban"].map((step, idx, arr) => (
                  <div key={step} className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#1a4e8f] text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#1a4e8f]">
                      {step}
                    </span>
                    {idx === arr.length - 1 && (
                      <span className="ml-auto inline-flex items-center rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-bold text-[#065f46]">
                        Selesai
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Error (kalau ada) ── */}
        {errorMessage && (
          <div className="mx-6 mb-3 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-[12px] text-[#c0392b]">
            {errorMessage}
          </div>
        )}

        {/* ── Footer ── */}
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
            className="w-full rounded-sm bg-[#1a4e8f] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#2d63a8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? "Mengajukan…" : "Ya, Ajukan Telaah"}
          </button>
        </div>
      </div>
    </div>
  );
}
