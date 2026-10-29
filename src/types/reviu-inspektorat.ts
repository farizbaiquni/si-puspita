/* ------------------------------------------------------------------ */
/*  reviu-inspektorat.ts                                               */
/*  Tipe data Modul Reviu Inspektorat                                  */
/*  (tahap lanjutan setelah Telaah Internal selesai).                  */
/*                                                                      */
/*  Semua tipe di file ini BARU — tidak mengubah tipe existing.        */
/* ------------------------------------------------------------------ */

import type { BadgeConfig, UploadedFileRef } from "@/types/types";

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

/* ==================== Badge config (satu sumber kebenaran) ============= */

/**
 * Badge "Menunggu Reviu Inspektorat" — warna AMBER, sengaja BEDA dari
 * hijau "Teregistrasi" (emerald) dan teal "Telaah Internal Selesai"
 * supaya saat ketiga badge tampil berurutan di Register Digital,
 * pengguna bisa langsung membedakan:
 *   - Emerald = terdaftar resmi
 *   - Teal    = sub-proses telaah internal selesai
 *   - Amber   = menunggu aksi pihak eksternal (Inspektorat)
 */
export const REVIU_STATUS_BADGE: Record<ReviuStatus, BadgeConfig> = {
  MENUNGGU_REVIU: {
    label: "Menunggu Reviu Inspektorat",
    cls: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
    dot: "bg-[#f59e0b]",
  },
};

/**
 * Dokumen koleksi `reviuInspektorat` — doc ID = pengajuanId (deterministik).
 *
 * Satu pengajuan hanya bisa punya satu dokumen reviu. Kalau sudah ada,
 * `ajukanReviuInspektorat()` akan menolak. Prasyarat lain: dokumen
 * `beritaAcara/{pengajuanId}` wajib sudah ada (BA dibuat lebih dulu).
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
  /**
   * Referensi file Surat Pengantar ke Inspektorat (di-upload ke
   * Cloudinary sebelum transaction ditulis — lihat
   * `uploadDokumenKeCloudinary()`).
   *
   * Wajib ada untuk dokumen baru: field ini ikut divalidasi di
   * Firestore rules (create `reviuInspektorat` wajib punya
   * `suratPengantar` bertipe map).
   */
  suratPengantar: UploadedFileRef;
}

/**
 * Draft Surat Pengantar ke Inspektorat — koleksi terpisah
 * `suratPengantarInspektorat/{pengajuanId}`.
 *
 * Dipakai supaya admin bisa mengunggah surat pengantar LANGSUNG dari
 * halaman detail (sebelum menekan "Ajukan Reviu"). Dokumen ini tidak
 * mengubah status pengajuan; saat admin menekan "Ajukan Reviu",
 * referensinya dipindahkan ke `reviuInspektorat/{pengajuanId}` lalu
 * draft ini dihapus dalam transaction yang sama.
 */
export interface SuratPengantarInspektoratRecord {
  /** = doc ID = pengajuanId. */
  id: string;
  /** Foreign key ke pengajuan.id. */
  pengajuanId: string;
  /** Referensi file PDF yang sudah di-upload ke Cloudinary. */
  suratPengantar: UploadedFileRef;
  /** Username admin yang pertama kali mengunggah. */
  diunggahOleh: string;
  /** Timestamp ISO unggahan pertama. */
  diunggahPada: string;
  /** Timestamp ISO perubahan terakhir (ganti file). */
  diperbaruiPada: string;
}
