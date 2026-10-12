"use client";

/* ------------------------------------------------------------------ */
/*  ModalKonfirmasiAjukan.tsx                                          */
/*  Modal konfirmasi admin sebelum ajukan pengajuan ke telaah internal.*/
/*  Mendukung 2 varian:                                                 */
/*   - "baru"  : siklus pertama kali (siklusKe = 1)                    */
/*   - "ulang" : siklus baru setelah OPD revisi (siklusKe >= 2)        */
/* ------------------------------------------------------------------ */

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

interface ModalKonfirmasiAjukanProps {
  nomorRegistrasi: string;
  nomorPengajuan: string;
  namaOPD: string;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
  variant?: "baru" | "ulang";
  siklusBerikutnya?: number;
}

export default function ModalKonfirmasiAjukan({
  nomorRegistrasi,
  nomorPengajuan,
  namaOPD,
  onConfirm,
  onClose,
  isSubmitting,
  errorMessage,
  variant = "baru",
  siklusBerikutnya,
}: ModalKonfirmasiAjukanProps) {
  const identitas = nomorRegistrasi || nomorPengajuan;
  const isUlang = variant === "ulang";

  const judul = isUlang ? "Ajukan Telaah Ulang?" : "Ajukan Telaah Internal?";
  const deskripsi = isUlang
    ? `Memulai siklus telaah ke-${siklusBerikutnya ?? "?"} dari Kasubbid.`
    : "Konfirmasi sebelum pengajuan masuk ke tahap telaah.";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={judul}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-sm border border-[#e2e8f2] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isUlang
                ? "bg-[#fff7ed] text-[#b45309]"
                : "bg-[#eff6ff] text-[#1a4e8f]"
            }`}
          >
            <IconCheck />
          </div>
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#1a1a2e]">{judul}</h3>
            <p className="mt-0.5 text-[12.5px] text-[#7a8899]">{deskripsi}</p>
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded-sm border border-[#eef1f5] bg-[#f9fafc] p-4">
          <div>
            <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
              Nomor Registrasi
            </div>
            <div className="font-mono text-[13px] font-bold text-[#0f9b6e]">
              {identitas}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
              Nama OPD
            </div>
            <div className="text-[13px] text-[#1a1a2e]">{namaOPD}</div>
          </div>
          {isUlang && siklusBerikutnya && (
            <div>
              <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                Siklus Ke-
              </div>
              <div className="text-[13px] font-bold text-[#b45309]">
                {siklusBerikutnya}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-3.5 py-3 text-[12px] text-[#1e40af]">
          <p className="mb-1 font-semibold">Alur telaah internal:</p>
          <ol className="list-inside list-decimal space-y-0.5 text-[11.5px]">
            <li>
              <span className="font-semibold">Kasubbid</span> — telaah tahap 1
            </li>
            <li>
              <span className="font-semibold">Kabid</span> — telaah tahap 2
            </li>
            <li>
              <span className="font-semibold">Sekban</span> — telaah tahap 3
              (final)
            </li>
          </ol>
        </div>

        {isUlang && (
          <div className="mb-4 rounded-sm border border-[#fde68a] bg-[#fffbeb] px-3.5 py-2.5 text-[11.5px] text-[#b45309]">
            <span className="font-semibold">ℹ️ Info:</span> OPD sudah
            memperbaiki pengajuan berdasarkan catatan revisi sebelumnya. Siklus
            baru akan dimulai dari Kasubbid, dan riwayat telaah sebelumnya tetap
            tersimpan.
          </div>
        )}

        {!isUlang && (
          <div className="mb-4 rounded-sm border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-2.5 text-[11.5px] text-[#9a3412]">
            <span className="font-semibold">⚠️ Perhatian:</span> Setelah
            diajukan, pengajuan ini{" "}
            <span className="font-semibold">
              tidak bisa diajukan telaah lagi
            </span>{" "}
            — satu pengajuan hanya boleh satu siklus telaah (kecuali kalau
            dikembalikan untuk revisi).
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-sm border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[12px] text-[#c0392b]">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-sm border border-[#e2e8f2] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#5a6474] transition hover:bg-[#f7f8fa] disabled:opacity-50 sm:w-auto"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`w-full rounded-sm px-4 py-2.5 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
              isUlang
                ? "bg-[#f59e0b] hover:bg-[#d97706]"
                : "bg-[#1a4e8f] hover:bg-[#2d63a8]"
            }`}
          >
            {isSubmitting
              ? "Mengajukan…"
              : isUlang
                ? "Ya, Ajukan Telaah Ulang"
                : "Ya, Ajukan"}
          </button>
        </div>
      </div>
    </div>
  );
}
