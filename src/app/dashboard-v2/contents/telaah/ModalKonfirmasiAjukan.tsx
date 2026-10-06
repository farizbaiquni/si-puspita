"use client";

/* ------------------------------------------------------------------ */
/*  ModalKonfirmasiAjukan.tsx                                          */
/*  Modal konfirmasi sebelum admin mengajukan pengajuan ke telaah      */
/*  internal. Sebelum user klik "Ya, Ajukan", belum ada dokumen telaah */
/*  yang dibuat — semua prep di sini read-only.                        */
/*                                                                      */
/*  Setelah konfirmasi, parent memanggil `onConfirm()` yang menjalankan */
/*  ajukanTelaah() dari store. Modal menampilkan loading state sampai  */
/*  parent selesai (prop isSubmitting dari parent).                    */
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
      <div className="w-full max-w-md rounded-xl border border-[#e2e8f2] bg-white p-6 shadow-2xl">
        {/* Ikon + judul */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#1a4e8f]">
            <IconCheck />
          </div>
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#1a1a2e]">
              Ajukan Telaah Internal?
            </h3>
            <p className="mt-0.5 text-[12.5px] text-[#7a8899]">
              Konfirmasi sebelum pengajuan masuk ke tahap telaah.
            </p>
          </div>
        </div>

        {/* Info pengajuan */}
        <div className="mb-4 space-y-2 rounded-lg border border-[#eef1f5] bg-[#f9fafc] p-4">
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
        </div>

        {/* Info alur */}
        <div className="mb-4 rounded-lg border border-[#dbe6f7] bg-[#eff6ff] px-3.5 py-3 text-[12px] text-[#1e40af]">
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

        {/* Peringatan */}
        <div className="mb-4 rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-2.5 text-[11.5px] text-[#9a3412]">
          <span className="font-semibold">⚠️ Perhatian:</span> Setelah diajukan,
          pengajuan ini{" "}
          <span className="font-semibold">tidak bisa diajukan telaah lagi</span>{" "}
          — satu pengajuan hanya boleh satu siklus telaah.
        </div>

        {/* Error dari parent */}
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[12px] text-[#c0392b]">
            {errorMessage}
          </div>
        )}

        {/* Tombol */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-[#e2e8f2] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#5a6474] transition hover:bg-[#f7f8fa] disabled:opacity-50 sm:w-auto"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#1a4e8f] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#2d63a8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? "Mengajukan…" : "Ya, Ajukan"}
          </button>
        </div>
      </div>
    </div>
  );
}
