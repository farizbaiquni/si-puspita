/* ------------------------------------------------------------------ */
/*  telaah-internal.ts                                                 */
/*  Tipe data Modul Telaah Internal Struktural BPKAD                  */
/*  (Kasubbid → Kabid → Sekban)                                        */
/*                                                                      */
/*  SEMUA tipe di file ini BARU dan TERPISAH dari types.ts existing —  */
/*  tidak mengubah / menambah nilai apapun di StatusFormulir,          */
/*  JenisPiutang, atau tipe existing lainnya.                          */
/*                                                                      */
/*  Struktur lengkap didokumentasikan di:                              */
/*  - Koleksi "telaahInternal" (doc ID = pengajuanId)                  */
/*  - Koleksi "notifikasiInternal" (doc ID auto)                       */
/* ------------------------------------------------------------------ */

/* ==================== 1. Tahap & Milestone ==================== */

/**
 * State aktif telaah internal — 4 nilai.
 *
 * `tahapSaatIni` di TelaahInternalRecord HANYA berisi salah satu dari
 * nilai ini. Setelah Sekban approve, state akhir adalah "SELESAI"
 * (tidak ada transisi lagi setelahnya).
 *
 * Urutan alami transisi:
 *   MENUNGGU_TELAAH_KASUBBID
 *     → MENUNGGU_TELAAH_KABID
 *     → MENUNGGU_TELAAH_SEKBAN
 *     → SELESAI
 */
export const TELAAH_TAHAP_OPTIONS = [
  "MENUNGGU_TELAAH_KASUBBID",
  "MENUNGGU_TELAAH_KABID",
  "MENUNGGU_TELAAH_SEKBAN",
  "SELESAI",
] as const;
export type TelaahTahap = (typeof TELAAH_TAHAP_OPTIONS)[number];

/**
 * Milestone historis untuk log `riwayat[]` — dipisah dari `tahapSaatIni`
 * supaya:
 *   - state machine tetap 4 nilai (mudah di-guard),
 *   - tiap langkah tetap tercatat dengan label eksplisit "SUDAH_TELAAH_X"
 *     di log (untuk keperluan audit & timeline di UI).
 *
 * Setiap kali user approve, satu entry baru dengan `milestone` yang sesuai
 * ditambahkan ke array `riwayat` — tidak pernah menghapus/mengedit entry lama.
 */
export const TELAAH_MILESTONE_OPTIONS = [
  "DIAJUKAN",
  "SUDAH_TELAAH_KASUBBID",
  "SUDAH_TELAAH_KABID",
  "SUDAH_TELAAH_SEKBAN",
] as const;
export type TelaahMilestone = (typeof TELAAH_MILESTONE_OPTIONS)[number];

/**
 * Level hierarki user internal. Disimpan di SessionUser.telaahLevel
 * (lihat auth-store.tsx) dan dipakai untuk menentukan menu apa yang
 * ditampilkan serta tombol approve mana yang aktif.
 */
export const TELAAH_LEVEL_OPTIONS = ["kasubbid", "kabid", "sekban"] as const;
export type TelaahLevel = (typeof TELAAH_LEVEL_OPTIONS)[number];

/* ==================== 2. Label (untuk UI) ==================== */

/** Label tampilan untuk tiap tahap — dipakai di badge / status text. */
export const TELAAH_TAHAP_LABEL: Record<TelaahTahap, string> = {
  MENUNGGU_TELAAH_KASUBBID: "Menunggu Telaah Kasubbid",
  MENUNGGU_TELAAH_KABID: "Menunggu Telaah Kabid",
  MENUNGGU_TELAAH_SEKBAN: "Menunggu Telaah Sekban",
  SELESAI: "Selesai",
};

/** Label tampilan untuk tiap milestone — dipakai di timeline riwayat. */
export const TELAAH_MILESTONE_LABEL: Record<TelaahMilestone, string> = {
  DIAJUKAN: "Diajukan ke Telaah Internal",
  SUDAH_TELAAH_KASUBBID: "Sudah Ditelaah Kasubbid",
  SUDAH_TELAAH_KABID: "Sudah Ditelaah Kabid",
  SUDAH_TELAAH_SEKBAN: "Sudah Ditelaah Sekban (Final)",
};

/** Label tampilan untuk tiap level — dipakai di header profil & UI. */
export const TELAAH_LEVEL_LABEL: Record<TelaahLevel, string> = {
  kasubbid: "Kasubbid",
  kabid: "Kabid",
  sekban: "Sekban",
};

/**
 * Subtitle jabatan lengkap per level — untuk ditampilkan di sidebar
 * (bottom box) dan profile dropdown di header. Konteksnya struktur
 * BPKAD Kab. Kendal.
 */
export const TELAAH_LEVEL_SUBTITLE: Record<TelaahLevel, string> = {
  kasubbid: "Akuntansi dan Pelaporan",
  kabid: "Perbendaharaan dan Akuntansi",
  sekban: "Sekretaris Badan BPKAD Kab. Kendal",
};

/* ==================== 3. Mapping helper ==================== */

/**
 * Transisi tahap: dari state ini → ke state berikutnya.
 *
 * `SELESAI → SELESAI` sengaja didefinisikan (idempotent) supaya tidak
 * perlu penanganan khusus — meski secara logika tidak akan pernah
 * dipanggil, karena validasi `!selesai` mencegah approve setelah final.
 */
export const TELAAH_NEXT_TAHAP: Record<TelaahTahap, TelaahTahap> = {
  MENUNGGU_TELAAH_KASUBBID: "MENUNGGU_TELAAH_KABID",
  MENUNGGU_TELAAH_KABID: "MENUNGGU_TELAAH_SEKBAN",
  MENUNGGU_TELAAH_SEKBAN: "SELESAI",
  SELESAI: "SELESAI",
};

/**
 * Tahap "menunggu" yang cocok dengan level user tertentu.
 * Dipakai untuk memfilter daftar di halaman "Telaah Saya" dan untuk
 * memvalidasi apakah user berhak approve pada tahap tertentu.
 */
export const TELAAH_TAHAP_BY_LEVEL: Record<TelaahLevel, TelaahTahap> = {
  kasubbid: "MENUNGGU_TELAAH_KASUBBID",
  kabid: "MENUNGGU_TELAAH_KABID",
  sekban: "MENUNGGU_TELAAH_SEKBAN",
};

/** Milestone yang dicatat di log ketika user level tertentu approve. */
export const TELAAH_MILESTONE_BY_LEVEL: Record<TelaahLevel, TelaahMilestone> = {
  kasubbid: "SUDAH_TELAAH_KASUBBID",
  kabid: "SUDAH_TELAAH_KABID",
  sekban: "SUDAH_TELAAH_SEKBAN",
};

/**
 * Target username penerima notifikasi setelah transisi ke tahap berikutnya.
 *
 *   - Setelah transisi ke MENUNGGU_TELAAH_KASUBBID → notif ke "kasubbid"
 *   - Setelah transisi ke MENUNGGU_TELAAH_KABID    → notif ke "kabid"
 *   - Setelah transisi ke MENUNGGU_TELAAH_SEKBAN   → notif ke "sekban"
 *   - Setelah transisi ke SELESAI                  → notif ke "admin"
 */
export const TELAAH_NOTIF_TARGET_BY_NEXT_TAHAP: Record<TelaahTahap, string> = {
  MENUNGGU_TELAAH_KASUBBID: "kasubbid",
  MENUNGGU_TELAAH_KABID: "kabid",
  MENUNGGU_TELAAH_SEKBAN: "sekban",
  SELESAI: "admin",
};

/* ==================== 4. Record types ==================== */

/**
 * Satu baris log telaah — append-only, tidak pernah diedit atau dihapus.
 *
 * Semua field wajib ada. `catatan` boleh string kosong ("") karena
 * tombol "Approve & Teruskan" tetap valid walau user tidak menulis catatan.
 */
export interface TelaahLogEntry {
  /** Milestone yang dicapai oleh entry ini. */
  milestone: TelaahMilestone;

  /** Username aktor yang melakukan aksi (mis. "admin", "kasubbid"). */
  olehUsername: string;

  /**
   * Level aktor. Pakai union dengan "admin" karena entry DIAJUKAN
   * dibuat oleh admin (bukan user internal).
   */
  olehTelaahLevel: TelaahLevel | "admin";

  /** Isi catatan dari aktor. Boleh "" (kosong) kalau user tidak mengisi. */
  catatan: string;

  /** Kapan entry ini dibuat — format ISO 8601. */
  timestamp: string;
}

/**
 * Dokumen utama koleksi `telaahInternal`.
 *
 * **Doc ID = pengajuanId** (deterministik) → satu pengajuan hanya bisa
 * punya satu siklus telaah. Percobaan `setDoc` ulang akan terdeteksi
 * lewat cek `getDoc` dulu di `ajukanTelaah()` (lihat telaah-internal-store).
 *
 * Field `pengajuanId` tetap disimpan walau nilainya sama dengan `id`
 * untuk:
 *   - kenyamanan query `where("pengajuanId", "==", ...)` bila di masa depan
 *     butuh query lintas-relasi,
 *   - konsistensi pola dengan record lain (mis. notifikasiInternal juga
 *     menyimpan `pengajuanId` walau `telaahId` juga tersedia).
 */
export interface TelaahInternalRecord {
  // ── Identitas (denormalized untuk tampilan cepat) ────────────────
  /** = doc ID = pengajuanId. */
  id: string;
  /** Foreign key ke pengajuan.id. */
  pengajuanId: string;
  /** Nomor pengajuan resmi — snapshot dari pengajuan. */
  nomorPengajuan: string;
  /** Nomor registrasi resmi — snapshot dari pengajuan. Boleh "" kalau kosong. */
  nomorRegistrasi: string;
  /** Nama OPD — snapshot dari pengajuan. */
  namaOPD: string;
  /** Nama penanggung jawab OPD — snapshot dari pengajuan. */
  namaPenanggungJawab: string;

  // ── Metadata siklus telaah ───────────────────────────────────────
  /** Username admin yang mengajukan telaah. */
  diajukanOleh: string;
  /** Kapan telaah diajukan — format ISO 8601. */
  diajukanPada: string;
  /** State machine aktif. */
  tahapSaatIni: TelaahTahap;
  /** Shortcut query — true hanya saat tahapSaatIni === "SELESAI". */
  selesai: boolean;
  /** Waktu Sekban approve — null sebelum selesai. Format ISO 8601. */
  selesaiPada: string | null;

  // ── Riwayat lengkap (append-only) ────────────────────────────────
  /**
   * Array log. Minimal 1 entry (DIAJUKAN) sejak dibuat.
   * Panjang maksimal 4 entries (satu siklus lengkap = 4 milestone).
   */
  riwayat: TelaahLogEntry[];
}

/**
 * Notifikasi untuk user internal + admin. Koleksi TERPISAH dari
 * `notifikasiOPD` (yang khusus untuk OPD) supaya skema masing-masing
 * bisa berkembang independen tanpa risiko saling mengganggu.
 *
 * Query utama: `where("targetUsername", "==", username)` + orderBy createdAt.
 */
export interface NotifikasiInternalRecord {
  /** Firestore doc ID (auto-generated). */
  id: string;
  /** Username penerima: "kasubbid" | "kabid" | "sekban" | "admin". */
  targetUsername: string;
  /** Level penerima — untuk badge/warna aksen di dropdown. */
  targetLevel: TelaahLevel | "admin";
  /** = pengajuanId = TelaahInternalRecord.id. */
  telaahId: string;
  /** Foreign key ke pengajuan.id (redundant dengan telaahId untuk navigasi). */
  pengajuanId: string;
  /** Nomor pengajuan resmi — untuk display cepat. */
  nomorPengajuan: string;
  /** Nomor registrasi resmi — untuk display cepat. Boleh "". */
  nomorRegistrasi: string;
  /** Milestone yang memicu notifikasi ini. */
  milestone: TelaahMilestone;
  /** Judul singkat untuk tampilan dropdown. */
  judul: string;
  /** Pesan lengkap. */
  pesan: string;
  /** Status sudah dibaca/belum. */
  dibaca: boolean;
  /** Waktu dibuat — format ISO 8601. */
  createdAt: string;
}

/* ==================== 5. Utility ==================== */

/**
 * Cek apakah user dengan `telaahLevel` tertentu boleh approve telaah
 * dengan `tahapSaatIni` tertentu.
 *
 * ⚠️ INI HANYA UNTUK GUARD UI — bukan enforcement sesungguhnya.
 * Enforcement wajib ada di dalam Firestore transaction `approveTelaah()`
 * (lihat telaah-internal-store.tsx), karena fungsi client bisa di-bypass
 * lewat DevTools.
 */
export function bolehApprove(
  tahapSaatIni: TelaahTahap,
  level: TelaahLevel,
): boolean {
  return tahapSaatIni === TELAAH_TAHAP_BY_LEVEL[level];
}

/**
 * Cek apakah role user termasuk user internal struktural.
 * Dipakai untuk guard route `/dashboard-v2/telaah`.
 */
export function isInternalStruktural(role: string | undefined): boolean {
  return role === "INTERNAL_STRUKTURAL";
}

/**
 * Ambil label milestone dari log entry untuk ditampilkan di timeline.
 * Fallback ke nilai mentah kalau tidak dikenal (defensive).
 */
export function labelMilestone(milestone: TelaahMilestone): string {
  return TELAAH_MILESTONE_LABEL[milestone] ?? milestone;
}

/**
 * Ambil label tahap dari state untuk ditampilkan di badge/status.
 * Fallback ke nilai mentah kalau tidak dikenal (defensive).
 */
export function labelTahap(tahap: TelaahTahap): string {
  return TELAAH_TAHAP_LABEL[tahap] ?? tahap;
}
