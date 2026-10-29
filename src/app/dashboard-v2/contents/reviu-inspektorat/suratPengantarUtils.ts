/* ------------------------------------------------------------------ */
/*  suratPengantarUtils.ts                                             */
/*  Validasi & format file Surat Pengantar ke Inspektorat.             */
/*  Dipakai di halaman detail Reviu Inspektorat (upload langsung).     */
/* ------------------------------------------------------------------ */

/** Batas ukuran file surat pengantar (10 MB). */
export const MAKS_UKURAN_SURAT_PENGANTAR = 10 * 1024 * 1024;

/** Format ukuran file untuk tampilan (KB/MB). */
export function formatUkuranFile(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Validasi file surat pengantar.
 * Kembalikan pesan error, atau null kalau file valid.
 */
export function validasiFileSuratPengantar(f: File): string | null {
  const berPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
  if (!berPdf) {
    return "File harus berformat PDF.";
  }
  if (f.size === 0) {
    return "File kosong atau rusak — silakan pilih file lain.";
  }
  if (f.size > MAKS_UKURAN_SURAT_PENGANTAR) {
    return `Ukuran file ${formatUkuranFile(f.size)} melebihi batas 10 MB.`;
  }
  return null;
}
