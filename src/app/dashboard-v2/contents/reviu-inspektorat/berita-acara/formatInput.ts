/* ------------------------------------------------------------------ */
/*  formatInput.ts                                                     */
/*  Helper untuk format input di form Berita Acara.                    */
/* ------------------------------------------------------------------ */

/**
 * Format angka polos "9186900" → "9.186.900" (titik ribuan) untuk
 * tampilan input. Nilai aslinya tetap angka polos di state.
 */
export function formatAngkaRibuan(value: string): string {
  if (!value) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("id-ID");
}

/** Hapus semua karakter non-digit (untuk simpan nilai polos) */
export function unformatAngka(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Batasi NIP hanya angka dan maksimal 18 digit.
 * Format NIP: 8 digit + 6 digit + 1 digit + 3 digit = 18 digit.
 */
export function formatNip(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 18);
}

/**
 * Format NIP dengan spasi standar: "19800715 200502 2 015"
 * Dipakai di preview saat menampilkan NIP.
 */
export function formatNipTampilan(nip: string): string {
  const clean = nip.replace(/[^0-9]/g, "");
  if (clean.length !== 18) return nip;
  return `${clean.slice(0, 8)} ${clean.slice(8, 14)} ${clean.slice(14, 15)} ${clean.slice(15, 18)}`;
}
