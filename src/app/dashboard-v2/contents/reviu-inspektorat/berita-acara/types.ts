/* ------------------------------------------------------------------ */
/*  types.ts                                                           */
/*  Tipe data Berita Acara Penelaahan Internal.                        */
/* ------------------------------------------------------------------ */

/** Info satu penelaah (nama + NIP) */
export interface PenelaahInfo {
  nama: string;
  nip: string;
}

/** Hasil penilaian satu aspek di tabel C */
export type HasilAspek = "Sesuai" | "Tidak Sesuai" | "";

/** Satu baris di tabel C — Hasil Penelaahan */
export interface AspekPenelaahan {
  /** Nomor urut (1-10) */
  nomor: number;
  /** Nama aspek — pre-filled dari kode (constants), user tidak bisa edit */
  label: string;
  /** Hasil — dipilih user (Sesuai / Tidak Sesuai) */
  hasil: HasilAspek;
  /** Keterangan — diisi manual user */
  keterangan: string;
}

/** Data lengkap Berita Acara Penelaahan Internal */
export interface BeritaAcaraData {
  // ─── Header ─────────────────────────────────────────────
  /** Nomor BA — user isi bebas, kalau kosong → "Nomor:" tanpa isi */
  nomorBA: string;

  // ─── Identitas Pengajuan (7 field) ──────────────────────
  perangkatDaerah: string;
  nomorRegistrasi: string;
  /** Format: ISO date string "2026-08-18" */
  tanggalRegistrasi: string;
  /** Versi pendek: "Retribusi Daerah" / "Lain-lain PAD yang Sah" / "Lainnya" */
  jenisPiutang: string;
  /** Format: "13 debitur" */
  namaJumlahDebitur: string;
  /** Angka polos (tanpa titik/koma), misal "9186900" */
  nilaiPiutang: string;
  /** 4 digit, misal "2009" */
  tahunPerolehan: string;

  // ─── Tabel C: Hasil Penelaahan (10 aspek) ───────────────
  aspekPenelaahan: AspekPenelaahan[];

  // ─── Kesimpulan (Bagian D) ──────────────────────────────
  /** Angka polos (tanpa titik/koma), misal "7027400" */
  nilaiPiutangKesimpulan: string;
  /** Format: ISO date string */
  tanggalBA: string;

  // ─── Penelaah ───────────────────────────────────────────
  penelaah: {
    kasubbid: PenelaahInfo;
    kabid: PenelaahInfo;
    sekban: PenelaahInfo;
  };

  // ─── Metadata (auto-generated) ──────────────────────────
  /** ISO timestamp saat pertama kali dibuat (tidak berubah saat cetak ulang) */
  dibuatPada: string;
  /** ISO timestamp update terakhir */
  diperbaruiPada: string;
  /** Username admin yang menyimpan */
  dibuatOleh: string;
}

/** Helper: bentuk kosong dari BeritaAcaraData (untuk inisialisasi form) */
export function emptyBeritaAcaraData(): BeritaAcaraData {
  return {
    nomorBA: "",
    perangkatDaerah: "",
    nomorRegistrasi: "",
    tanggalRegistrasi: "",
    jenisPiutang: "",
    namaJumlahDebitur: "",
    nilaiPiutang: "",
    tahunPerolehan: "",
    aspekPenelaahan: [],
    nilaiPiutangKesimpulan: "",
    tanggalBA: new Date().toISOString().slice(0, 10),
    penelaah: {
      kasubbid: { nama: "", nip: "" },
      kabid: { nama: "", nip: "" },
      sekban: { nama: "", nip: "" },
    },
    dibuatPada: "",
    diperbaruiPada: "",
    dibuatOleh: "",
  };
}

/* ─── Dokumen koleksi `beritaAcara` ────────────────────────────── */

/**
 * Satu dokumen di koleksi `beritaAcara` — 1 pengajuan = 1 BA.
 * Doc ID = pengajuanId (deterministik).
 *
 * Koleksi ini TERPISAH dari `pengajuan` & `telaahInternal` supaya
 * penyimpanan BA tidak mengubah dokumen alur lama.
 */
export interface BeritaAcaraRecord extends BeritaAcaraData {
  /** Doc ID di koleksi `beritaAcara` (= pengajuanId). */
  id: string;
  /** ID pengajuan pemilik BA ini (sama dengan doc ID). */
  pengajuanId: string;
}
