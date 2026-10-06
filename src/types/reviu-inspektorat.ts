/* ------------------------------------------------------------------ */
/*  reviu-inspektorat.ts                                               */
/*  Tipe data Modul Reviu Inspektorat                                  */
/*  (tahap lanjutan setelah Telaah Internal selesai).                  */
/*                                                                      */
/*  Semua tipe di file ini BARU — tidak mengubah tipe existing.        */
/* ------------------------------------------------------------------ */

/**
 * Status reviu inspektorat — sementara hanya 1 nilai. Dirancang sebagai
 * array (extensible) supaya kalau nanti perlu tambah "SELESAI_REVIU",
 * tinggal tambah nilai tanpa mengubah tipe.
 */
export const REVIU_STATUS_OPTIONS = ["MENUNGGU_REVIU"] as const;
export type ReviuStatus = (typeof REVIU_STATUS_OPTIONS)[number];

/** Label tampilan per status. */
export const REVIU_STATUS_LABEL: Record<ReviuStatus, string> = {
  MENUNGGU_REVIU: "Menunggu Reviu Inspektorat",
};

/**
 * Dokumen koleksi `reviuInspektorat` — doc ID = pengajuanId (deterministik).
 *
 * Satu pengajuan hanya bisa punya satu dokumen reviu. Kalau sudah ada,
 * `ajukanReviuInspektorat()` akan menolak.
 */
export interface ReviuInspektoratRecord {
  /** = doc ID = pengajuanId. */
  id: string;
  /** Foreign key ke pengajuan.id. */
  pengajuanId: string;
  /** Username admin yang mengajukan reviu. */
  diajukanOleh: string;
  /** Timestamp ISO kapan diajukan. */
  diajukanPada: string;
  /** Status reviu. */
  status: ReviuStatus;
}
