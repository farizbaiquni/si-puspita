// ============================================================
// SI PUSPITA — Shared Types & Constants
// src/types/types.ts
// ============================================================

// ─────────────────────────────────────────────────────────────────────────────
// Primitive literal types
// ─────────────────────────────────────────────────────────────────────────────

/** Role pengguna dalam sistem */
export type UserRole = "OPD" | "BPKAD" | "Inspektorat" | "Pimpinan";

/** Jalur pengurusan penghapusan piutang yang ditentukan sistem */
export type JalurPengajuan = "PUPN" | "NON_PUPN" | null;

/**
 * Jenis piutang daerah.
 * PAJAK dikecualikan — diatur Perbup tersendiri.
 */
export type JenisPiutang =
  | "RETRIBUSI" // Piutang Retribusi Daerah
  | "TP" // Tuntutan Perbendaharaan
  | "TGR" // Tuntutan Ganti Rugi
  | "LAINNYA" // Piutang Daerah Lainnya (perjanjian/perikatan)
  | "PAJAK" // Piutang Pajak — berhenti di wizard
  | null;

/** Status pengajuan dalam alur kerja */
export type StatusPengajuan =
  | "DRAFT"
  | "DIAJUKAN"
  | "DALAM_REVIEW"
  | "DISETUJUI"
  | "DITOLAK"
  | "PERLU_REVISI";

// ─────────────────────────────────────────────────────────────────────────────
// DokumenUpload
// ─────────────────────────────────────────────────────────────────────────────

/** Representasi satu file PDF yang diupload pengguna */
export interface DokumenUpload {
  /** ID unik, diisi Date.now().toString() saat upload */
  id: string;
  /** Nama asli file */
  namaFile: string;
  /** Ukuran file dalam byte */
  ukuranBytes: number;
  /** Base64 opsional — digunakan jika dikirim ke API */
  base64?: string;
  /** Hasil validasi PDF */
  status: "valid" | "invalid" | "uploading";
  /** Pesan error jika status "invalid" */
  errorMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wizard state — Jalur PUPN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kumpulan dokumen pendukung kondisi penanggung utang (PUPN Pertanyaan 3).
 * beritaAcaraIdentifikasi bersifat wajib; sisanya opsional (minimal satu).
 */
export interface DokumenPendukungPUPN {
  beritaAcaraIdentifikasi: DokumenUpload | null; // wajib
  suratKematian: DokumenUpload | null;
  suratUsahaTidakBeroperasi: DokumenUpload | null;
  suratJaminanTidakCukup: DokumenUpload | null;
  suratKeberadaanTidakDiketahui: DokumenUpload | null;
  suratTidakMampu: DokumenUpload | null;
  suratAhliWarisTidakMampu: DokumenUpload | null;
}

/** State wizard untuk jalur PUPN (PSBDT) */
export interface WizardStatePUPN {
  // P1 — umur piutang
  tanggalTerjadi: string; // ISO date string "YYYY-MM-DD"

  // P2 — bukti penagihan optimal
  nomorSKRD: string;
  dokumenSKRD: DokumenUpload | null;
  nomorSTRD: string;
  dokumenSTRD: DokumenUpload | null;

  // P3 — dokumen kondisi penanggung
  dokumenPendukung: DokumenPendukungPUPN;

  // P4 — form data penanggung utang
  namaWP: string;
  alamatWP: string;
  nik: string;
  pekerjaan: string;
  sebabPiutangMacet: string;
  adaBLUD: boolean | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wizard state — Jalur Non-PUPN
// ─────────────────────────────────────────────────────────────────────────────

/** State wizard untuk jalur Non-PUPN (PPDTO) */
export interface WizardStateNonPUPN {
  // P1 — usia pencatatan piutang
  tanggalTerjadi: string; // ISO date string "YYYY-MM-DD"

  // P2 — bukti penagihan optimal
  /** Kode opsi yang dipilih pengguna, mis. ["A", "C"] */
  upayaPenagihanDipilih: string[];
  /** Daftar dokumen bukti penagihan yang berhasil diupload */
  dokumenPenagihanOptimal: DokumenUpload[];

  // P3 — ketidakmampuan penanggung utang
  /** Kode opsi yang dipilih, mis. ["B", "D"] */
  opsiKetidakmampuanDipilih: string[];
  /**
   * Map kode opsi ke dokumen bukti.
   * Key adalah kode opsi ("A"–"F"); value null berarti belum diupload.
   */
  dokumenKetidakmampuan: Record<string, DokumenUpload | null>;

  // P4 — data penanggung utang
  namaWP: string;
  alamatWP: string;
  nik: string;
  sebabPiutangMacet: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// WizardState — root
// ─────────────────────────────────────────────────────────────────────────────

/** State utama wizard pengajuan penghapusan piutang */
export interface WizardState {
  // ── Pertanyaan Umum ──────────────────────────────────────
  jenisPiutang: JenisPiutang;
  /**
   * Nominal sisa utang disimpan sebagai string angka murni (tanpa format).
   * Contoh: "5000000" bukan "Rp 5.000.000".
   */
  nominalUtang: string;

  // ── Jalur & navigasi ─────────────────────────────────────
  /** Jalur yang ditentukan sistem berdasarkan nominal utang */
  jalur: JalurPengajuan;
  /** Index langkah aktif dalam jalur yang sedang berjalan (0-based) */
  currentStep: number;

  // ── Sub-state per jalur ──────────────────────────────────
  pupn: WizardStatePUPN;
  nonPupn: WizardStateNonPUPN;

  // ── Status wizard ────────────────────────────────────────
  /** true setelah form terakhir berhasil disubmit */
  selesai: boolean;
  /** true ketika pengajuan dihentikan karena tidak memenuhi syarat */
  berhenti: boolean;
  /** Pesan yang ditampilkan di ModalBerhenti */
  pesanBerhenti: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Batas waktu Non-PUPN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ketentuan batas usia piutang minimum untuk jalur Non-PUPN,
 * berdasarkan besaran sisa kewajiban (Lampiran II Perbup Kendal).
 */
export interface BatasWaktuNonPUPN {
  /** Batas bawah sisa utang (inklusif, dalam rupiah) */
  minSisa: number;
  /**
   * Batas atas sisa utang (inklusif, dalam rupiah).
   * undefined berarti tidak ada batas atas (nilai >= minSisa).
   */
  maxSisa?: number;
  /** Jumlah tahun minimum usia piutang — diakses via `.tahun` */
  tahun: number;
  /** Label tahun dalam teks Indonesia, mis. "5 (lima)" */
  label: string;
}

/**
 * Tabel batas waktu minimal per rentang sisa utang.
 * Digunakan oleh getBatasWaktu() di AjukanPermohonan.tsx.
 */
export const BATAS_WAKTU_NON_PUPN: BatasWaktuNonPUPN[] = [
  {
    minSisa: 0,
    maxSisa: 8_000_000,
    tahun: 5,
    label: "5 (lima)",
  },
  {
    minSisa: 8_000_001,
    maxSisa: 50_000_000,
    tahun: 7,
    label: "7 (tujuh)",
  },
  {
    minSisa: 50_000_001,
    maxSisa: 1_000_000_000,
    tahun: 10,
    label: "10 (sepuluh)",
  },
  {
    minSisa: 1_000_000_001,
    // maxSisa tidak diisi — tidak ada batas atas
    tahun: 10,
    label: "10 (sepuluh)",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Opsi penagihan optimal (Non-PUPN Pertanyaan 2)
// ─────────────────────────────────────────────────────────────────────────────

/** Satu pilihan upaya penagihan optimal */
export interface OpsiPenagihan {
  /** Huruf kode, mis. "A", "B", ... "H" */
  kode: string;
  /** Label singkat yang ditampilkan di CheckOption */
  label: string;
  /** Sub-label / deskripsi tambahan — ditampilkan sebagai sublabel */
  deskripsi?: string;
}

/** Daftar lengkap opsi upaya penagihan optimal (Lampiran II Pasal D.4) */
export const OPSI_PENAGIHAN_OPTIMAL: OpsiPenagihan[] = [
  {
    kode: "A",
    label: "Kerjasama penagihan dengan pihak ketiga",
    deskripsi:
      "Kejaksaan, Kantor Wilayah DJKN Jawa Tengah, dan/atau pihak ketiga lainnya sesuai peraturan perundang-undangan.",
  },
  {
    kode: "B",
    label: "Pelaksanaan parate eksekusi jaminan kebendaan",
  },
  {
    kode: "C",
    label: "Crash program penyelesaian Piutang Daerah",
  },
  {
    kode: "D",
    label: "Gugatan melalui lembaga peradilan",
  },
  {
    kode: "E",
    label: "Penghentian layanan kepada Penanggung Utang",
  },
  {
    kode: "F",
    label: "Konversi piutang menjadi penyertaan modal daerah",
  },
  {
    kode: "G",
    label: "Penjualan hak tagih / piutang",
  },
  {
    kode: "H",
    label: "Penyerahan aset untuk pembayaran utang (debt to asset swap)",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Opsi ketidakmampuan penanggung utang (Non-PUPN Pertanyaan 3)
// ─────────────────────────────────────────────────────────────────────────────

/** Satu pilihan bukti ketidakmampuan penanggung utang */
export interface OpsiKetidakmampuan {
  /** Huruf kode, mis. "A", "B", ... "F" */
  kode: string;
  /** Label yang ditampilkan di CheckOption */
  label: string;
  /**
   * Jika true, opsi ini wajib dipilih ketika nominal > Rp1 miliar.
   * Saat ini hanya berlaku untuk Opsi A.
   */
  wajibDiatasMilliar: boolean;
}

/** Daftar lengkap opsi bukti ketidakmampuan (Lampiran II Pasal E.1.c.d) */
export const OPSI_KETIDAKMAMPUAN: OpsiKetidakmampuan[] = [
  {
    kode: "A",
    label:
      "Telah dilakukan kerjasama penagihan dengan Kantor Wilayah DJKN Jawa Tengah",
    wajibDiatasMilliar: true,
  },
  {
    kode: "B",
    label: "Kartu Keluarga Miskin",
    wajibDiatasMilliar: false,
  },
  {
    kode: "C",
    label: "Putusan pailit",
    wajibDiatasMilliar: false,
  },
  {
    kode: "D",
    label:
      "Surat keterangan dari lurah — Penanggung Utang tidak mampu menyelesaikan atau tidak diketahui tempat tinggalnya",
    wajibDiatasMilliar: false,
  },
  {
    kode: "E",
    label:
      "Bukti penerimaan bantuan sosial (BPNT, BST, PKH) atau asuransi kesehatan bagi masyarakat miskin",
    wajibDiatasMilliar: false,
  },
  {
    kode: "F",
    label:
      "Bukti kunjungan penagihan oleh petugas PPKD (surat kunjungan / berita acara) yang menyimpulkan ketidakmampuan atau ketidaktahuan keberadaan Penanggung Utang",
    wajibDiatasMilliar: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Data Pengajuan (hasil submit / persistensi)
// ─────────────────────────────────────────────────────────────────────────────

/** Data identitas dan piutang penanggung utang setelah wizard selesai */
export interface DataPenanggungUtang {
  namaWP: string;
  alamatWP: string;
  nik: string;
  pekerjaan: string;
  jenisPiutang: JenisPiutang;
  nominalUtang: number;
  nomorSKRD?: string;
  nomorSTRD?: string;
  sebabPiutangMacet: string;
  adaBLUD?: boolean;
}

/** Rekaman lengkap satu pengajuan yang tersimpan / dikirim ke backend */
export interface Pengajuan {
  id: string;
  tanggalDibuat: string; // ISO datetime string
  status: StatusPengajuan;
  jalur: JalurPengajuan;
  dataPenanggung: DataPenanggungUtang;
  dokumen: DokumenUpload[];
  catatanReviewer?: string;
  unitPengaju: string; // Nama OPD pengusul
}
