/* ------------------------------------------------------------------ */
/*  formatHelpers.ts                                                   */
/*  Helper format tanggal & rupiah untuk Berita Acara.                 */
/* ------------------------------------------------------------------ */

/**
 * Format ISO date → "17 September 2026" (untuk label tanggal BA).
 * Return "-" kalau input kosong / invalid.
 */
export function formatTanggalPanjang(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format ISO date → "Senin tanggal 17 bulan September tahun 2026"
 * untuk kalimat pembuka "Pada hari ini, ...".
 */
export function formatPembukaTanggal(iso: string): string {
  if (!iso) return ".....................";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return ".....................";

  const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal = d.getDate();
  const bulan = d.toLocaleDateString("id-ID", { month: "long" });
  const tahun = d.getFullYear();

  return `${hari} tanggal ${tanggal} bulan ${bulan} tahun ${tahun}`;
}

/**
 * Format nilai polos "9186900" → "Rp9.186.900,00".
 * Return "-" kalau kosong / invalid.
 */
export function formatRupiahNilai(value: string): string {
  if (!value) return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return (
    "Rp" +
    n.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
