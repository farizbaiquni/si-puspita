/* ------------------------------------------------------------------ */
/*  telaah-internal.ts                                                 */
/*  Tipe data Modul Telaah Internal Struktural BPKAD                  */
/*  (Kasubbid → Kabid → Sekban, dengan alur revisi turun berjenjang)   */
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
 * State aktif telaah internal — 8 nilai.
 *
 * Urutan natural:
 *  - Naik (semua dokumen "Sesuai"):
 *      MENUNGGU_TELAAH_KASUBBID → MENUNGGU_TELAAH_KABID
 *      → MENUNGGU_TELAAH_SEKBAN → SELESAI
 *  - Turun (ada ≥1 dokumen "Belum Sesuai"):
 *      Sekban reject   → MENUNGGU_REVISI_KABID → MENUNGGU_REVISI_KASUBBID
 *                      → MENUNGGU_ADMIN_KIRIM_REVISI → MENUNGGU_REVISI_OPD
 *      Kabid reject    → MENUNGGU_REVISI_KASUBBID
 *                      → MENUNGGU_ADMIN_KIRIM_REVISI → MENUNGGU_REVISI_OPD
 *      Kasubbid reject → MENUNGGU_ADMIN_KIRIM_REVISI → MENUNGGU_REVISI_OPD
 *  - Setelah OPD submit perbaikan (Admin klik "Ajukan Telaah Ulang"):
 *      MENUNGGU_REVISI_OPD → MENUNGGU_TELAAH_KASUBBID (siklus baru)
 */
export const TELAAH_TAHAP_OPTIONS = [
  // ── Naik (approve) ──
  "MENUNGGU_TELAAH_KASUBBID",
  "MENUNGGU_TELAAH_KABID",
  "MENUNGGU_TELAAH_SEKBAN",
  // ── Turun (revisi berjenjang) ──
  "MENUNGGU_REVISI_KABID",
  "MENUNGGU_REVISI_KASUBBID",
  "MENUNGGU_ADMIN_KIRIM_REVISI",
  "MENUNGGU_REVISI_OPD",
  // ── Final ──
  "SELESAI",
] as const;
export type TelaahTahap = (typeof TELAAH_TAHAP_OPTIONS)[number];

/** Subset state "naik" — approve/reject dilakukan di sini. */
export const TELAAH_TAHAP_NAIK: readonly TelaahTahap[] = [
  "MENUNGGU_TELAAH_KASUBBID",
  "MENUNGGU_TELAAH_KABID",
  "MENUNGGU_TELAAH_SEKBAN",
];

/** Subset state "turun" — aksi "Teruskan" dilakukan di sini. */
export const TELAAH_TAHAP_TURUN: readonly TelaahTahap[] = [
  "MENUNGGU_REVISI_KABID",
  "MENUNGGU_REVISI_KASUBBID",
  "MENUNGGU_ADMIN_KIRIM_REVISI",
  "MENUNGGU_REVISI_OPD",
];

export function isTahapNaik(t: TelaahTahap): boolean {
  return (
    t === "MENUNGGU_TELAAH_KASUBBID" ||
    t === "MENUNGGU_TELAAH_KABID" ||
    t === "MENUNGGU_TELAAH_SEKBAN"
  );
}

export function isTahapTurun(t: TelaahTahap): boolean {
  return (
    t === "MENUNGGU_REVISI_KABID" ||
    t === "MENUNGGU_REVISI_KASUBBID" ||
    t === "MENUNGGU_ADMIN_KIRIM_REVISI" ||
    t === "MENUNGGU_REVISI_OPD"
  );
}

/**
 * Milestone historis untuk log `riwayat[]` — 11 nilai.
 * Dikelompokkan: naik, reject (pemicu turun), teruskan (jenjang turun),
 * dan reset siklus baru.
 */
export const TELAAH_MILESTONE_OPTIONS = [
  // ── Naik ──
  "DIAJUKAN",
  "SUDAH_TELAAH_KASUBBID",
  "SUDAH_TELAAH_KABID",
  "SUDAH_TELAAH_SEKBAN",
  // ── Reject (pemicu turun) ──
  "REVISI_DARI_KASUBBID",
  "REVISI_DARI_KABID",
  "REVISI_DARI_SEKBAN",
  // ── Teruskan (jenjang turun) ──
  "DITERUSKAN_KASUBBID",
  "DITERUSKAN_KABID",
  "DIKIRIM_KE_OPD",
  // ── Reset ──
  "SIKLUS_BARU_DIMULAI",
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
  MENUNGGU_REVISI_KABID: "Menunggu Diteruskan Kabid",
  MENUNGGU_REVISI_KASUBBID: "Menunggu Diteruskan Kasubbid",
  MENUNGGU_ADMIN_KIRIM_REVISI: "Menunggu Admin Kirim ke OPD",
  MENUNGGU_REVISI_OPD: "Menunggu Revisi OPD",
  SELESAI: "Selesai",
};

/** Label tampilan untuk tiap milestone — dipakai di timeline riwayat. */
export const TELAAH_MILESTONE_LABEL: Record<TelaahMilestone, string> = {
  DIAJUKAN: "Diajukan ke Telaah Internal",
  SUDAH_TELAAH_KASUBBID: "Sudah Ditelaah Kasubbid",
  SUDAH_TELAAH_KABID: "Sudah Ditelaah Kabid",
  SUDAH_TELAAH_SEKBAN: "Sudah Ditelaah Sekban (Final)",
  REVISI_DARI_KASUBBID: "Revisi Dikembalikan oleh Kasubbid",
  REVISI_DARI_KABID: "Revisi Dikembalikan oleh Kabid",
  REVISI_DARI_SEKBAN: "Revisi Dikembalikan oleh Sekban",
  DITERUSKAN_KASUBBID: "Diteruskan oleh Kasubbid",
  DITERUSKAN_KABID: "Diteruskan oleh Kabid",
  DIKIRIM_KE_OPD: "Dikirim ke OPD untuk Direvisi",
  SIKLUS_BARU_DIMULAI: "Siklus Baru Dimulai",
};

/** Label tampilan untuk tiap level — dipakai di header profil & UI. */
export const TELAAH_LEVEL_LABEL: Record<TelaahLevel, string> = {
  kasubbid: "Kasubbid",
  kabid: "Kabid",
  sekban: "Sekban",
};

/**
 * Subtitle jabatan lengkap per level — untuk ditampilkan di sidebar
 * (bottom box) dan profile dropdown di header.
 */
export const TELAAH_LEVEL_SUBTITLE: Record<TelaahLevel, string> = {
  kasubbid: "Akuntansi dan Pelaporan",
  kabid: "Perbendaharaan dan Akuntansi",
  sekban: "Sekretaris Badan BPKAD Kab. Kendal",
};

/* ==================== 3. Mapping helper ==================== */

/**
 * Transisi tahap: dari state X → ke state berikutnya.
 * Untuk state "naik", ini artinya approve. Untuk state "turun", ini
 * artinya "Teruskan".
 *
 * `SELESAI → SELESAI` idempotent untuk kelengkapan tipe; secara logika
 * tidak akan pernah dipanggil karena validasi `!selesai` mencegah
 * approve setelah final.
 */
export const TELAAH_NEXT_TAHAP: Record<TelaahTahap, TelaahTahap> = {
  // Naik
  MENUNGGU_TELAAH_KASUBBID: "MENUNGGU_TELAAH_KABID",
  MENUNGGU_TELAAH_KABID: "MENUNGGU_TELAAH_SEKBAN",
  MENUNGGU_TELAAH_SEKBAN: "SELESAI",
  // Turun
  MENUNGGU_REVISI_KABID: "MENUNGGU_REVISI_KASUBBID",
  MENUNGGU_REVISI_KASUBBID: "MENUNGGU_ADMIN_KIRIM_REVISI",
  MENUNGGU_ADMIN_KIRIM_REVISI: "MENUNGGU_REVISI_OPD",
  MENUNGGU_REVISI_OPD: "MENUNGGU_TELAAH_KASUBBID",
  // Final
  SELESAI: "SELESAI",
};

/**
 * State "naik" yang cocok dengan level user — di sini user buka form
 * telaah & pilih status per-dokumen (approve atau reject).
 * Contoh: Kasubbid buka form telaah dari state MENUNGGU_TELAAH_KASUBBID.
 */
export const TELAAH_TAHAP_BY_LEVEL: Record<TelaahLevel, TelaahTahap> = {
  kasubbid: "MENUNGGU_TELAAH_KASUBBID",
  kabid: "MENUNGGU_TELAAH_KABID",
  sekban: "MENUNGGU_TELAAH_SEKBAN",
};

/**
 * State "turun" yang dipegang level user — di sini user hanya bisa
 * "Teruskan" (tidak bisa ubah status Sesuai/Belum Sesuai).
 *
 * Sekban tidak ada entry — dia level tertinggi, tidak ada jenjang turun
 * yang perlu dia teruskan (kalau ada masalah, dia yang klik Revisi
 * duluan, tidak meneruskan).
 */
export const TELAAH_TAHAP_REVISI_BY_LEVEL: Partial<
  Record<TelaahLevel, TelaahTahap>
> = {
  kasubbid: "MENUNGGU_REVISI_KASUBBID",
  kabid: "MENUNGGU_REVISI_KABID",
};

/**
 * State TUJUAN ketika user level tertentu klik "Revisi" (reject).
 *  - Kasubbid reject → langsung ke Admin (paling pendek, tanpa lewat
 *    jenjang lain karena dia sudah level terbawah).
 *  - Kabid reject   → turun ke Kasubbid dulu (Kasubbid teruskan ke Admin).
 *  - Sekban reject  → turun ke Kabid dulu (Kabid → Kasubbid → Admin).
 */
export const TELAAH_TAHAP_SETELAH_REJECT: Record<TelaahLevel, TelaahTahap> = {
  kasubbid: "MENUNGGU_ADMIN_KIRIM_REVISI",
  kabid: "MENUNGGU_REVISI_KASUBBID",
  sekban: "MENUNGGU_REVISI_KABID",
};

/** Milestone yang dicatat di log ketika user level tertentu approve. */
export const TELAAH_MILESTONE_BY_LEVEL: Record<TelaahLevel, TelaahMilestone> = {
  kasubbid: "SUDAH_TELAAH_KASUBBID",
  kabid: "SUDAH_TELAAH_KABID",
  sekban: "SUDAH_TELAAH_SEKBAN",
};

/** Milestone yang dicatat di log ketika user level tertentu klik "Revisi". */
export const TELAAH_MILESTONE_REJECT_BY_LEVEL: Record<
  TelaahLevel,
  TelaahMilestone
> = {
  kasubbid: "REVISI_DARI_KASUBBID",
  kabid: "REVISI_DARI_KABID",
  sekban: "REVISI_DARI_SEKBAN",
};

/**
 * Milestone yang dicatat di log ketika user level tertentu klik
 * "Teruskan" di jenjang turun.
 *
 * Sekban tidak ada — Sekban adalah level tertinggi, tidak ada jenjang
 * turun yang perlu diteruskan oleh Sekban.
 */
export const TELAAH_MILESTONE_TERUSKAN_BY_LEVEL: Partial<
  Record<TelaahLevel, TelaahMilestone>
> = {
  kasubbid: "DITERUSKAN_KASUBBID",
  kabid: "DITERUSKAN_KABID",
};

/**
 * Target username penerima notifikasi internal setelah transisi ke
 * tahap berikutnya.
 *
 * Untuk MENUNGGU_REVISI_OPD, value-nya string kosong — notif ke OPD
 * BUKAN notif internal, dihandle terpisah di notifikasi-store.tsx
 * (fungsi kirimNotifikasiTelaahKeOPD).
 */
export const TELAAH_NOTIF_TARGET_BY_NEXT_TAHAP: Record<TelaahTahap, string> = {
  MENUNGGU_TELAAH_KASUBBID: "kasubbid",
  MENUNGGU_TELAAH_KABID: "kabid",
  MENUNGGU_TELAAH_SEKBAN: "sekban",
  MENUNGGU_REVISI_KABID: "kabid",
  MENUNGGU_REVISI_KASUBBID: "kasubbid",
  MENUNGGU_ADMIN_KIRIM_REVISI: "admin",
  MENUNGGU_REVISI_OPD: "", // notif ke OPD — bukan user internal
  SELESAI: "admin",
};

/* ==================== 4. Record types ==================== */

/**
 * Status telaah per dokumen (shape BARU, ganti `checked: boolean`).
 *  - "sesuai"       : dokumen oke
 *  - "belum_sesuai" : dokumen bermasalah, catatan WAJIB diisi (min. 5 char)
 *  - null           : belum ditelaah
 */
export type StatusDokumenTelaah = "sesuai" | "belum_sesuai" | null;

/** Satu baris checklist per dokumen. */
export interface TelaahChecklistItem {
  status: StatusDokumenTelaah;
  catatan: string;
}

/**
 * Satu baris log telaah — append-only, tidak pernah diedit.
 *
 * ⚠️ PERUBAHAN BREAKING: field `checklistDokumen` sekarang memakai shape
 * `{ status, catatan }` — BUKAN lagi `{ checked, catatan }`. Data lama
 * yang sudah tersimpan di Firestore akan di-adaptasi di layer UI
 * (lihat fungsi adaptChecklistItem di komponen pembaca).
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

  /**
   * Checklist & catatan per dokumen untuk level telaah ini.
   *
   * Key   = field name di FormulirPenghapusanPiutangOPDRecord.
   * Value = { status, catatan }.
   *
   * Hanya diisi untuk milestone:
   *  - SUDAH_TELAAH_*  (approve) — semua item berstatus "sesuai"
   *  - REVISI_DARI_*   (reject)  — ada ≥1 item berstatus "belum_sesuai"
   * Untuk milestone turun (DITERUSKAN_*, DIKIRIM_KE_OPD, DIAJUKAN,
   * SIKLUS_BARU_DIMULAI), field ini TIDAK diisi.
   */
  checklistDokumen?: Record<string, TelaahChecklistItem>;
}

/**
 * Dokumen utama koleksi `telaahInternal`.
 *
 * **Doc ID = pengajuanId** (deterministik) → satu pengajuan hanya bisa
 * punya satu siklus telaah dokumen di Firestore. Kalau OPD revisi &
 * Admin ajukan ulang, dokumen yang SAMA di-reset (bukan dibuat baru),
 * dengan counter `siklusKe` naik + entry `SIKLUS_BARU_DIMULAI` di
 * riwayat.
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
  /** State machine aktif (8 nilai, lihat TELAAH_TAHAP_OPTIONS). */
  tahapSaatIni: TelaahTahap;
  /** Shortcut query — true hanya saat tahapSaatIni === "SELESAI". */
  selesai: boolean;
  /** Waktu Sekban approve final — null sebelum selesai. Format ISO 8601. */
  selesaiPada: string | null;

  // ── Riwayat lengkap (append-only) ────────────────────────────────
  /**
   * Array log. Minimal 1 entry (DIAJUKAN) sejak dibuat. Append-only,
   * tidak pernah dihapus walau siklus baru dimulai — jejak audit
   * lengkap semua siklus.
   */
  riwayat: TelaahLogEntry[];

  /**
   * Siklus telaah ke-N. Mulai dari 1, naik +1 setiap Admin klik
   * "Ajukan Telaah Ulang" setelah OPD submit perbaikan.
   *
   * Opsional untuk backward compat dengan dokumen lama yang dibuat
   * sebelum fitur ini (fallback ke 1 di UI: `telaah.siklusKe ?? 1`).
   */
  siklusKe?: number;
}

/**
 * Notifikasi untuk user internal + admin. Koleksi TERPISAH dari
 * `notifikasiOPD` (yang khusus untuk OPD) supaya skema masing-masing
 * bisa berkembang independen tanpa risiko saling mengganggu.
 *
 * (Struktur tidak berubah dari versi sebelumnya — `milestone` sekarang
 * bisa berisi 11 nilai, bukan cuma 4.)
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
 * Kategori aksi yang bisa dilakukan user di sebuah tahap.
 *  - "telaah"     : buka form telaah — pilih status per-dokumen,
 *                   hasilnya Approve (semua Sesuai) atau Revisi (ada
 *                   yang Belum Sesuai)
 *  - "teruskan"   : hanya bisa tambah catatan global (opsional) +
 *                   klik "Teruskan"
 *  - "lihat_saja" : tidak ada aksi, read-only
 */
export type TelaahAksiInternal = "telaah" | "teruskan" | "lihat_saja";

/**
 * Tentukan aksi apa yang bisa dilakukan user level X pada tahap Y.
 *
 * ⚠️ INI HANYA UNTUK GUARD UI — bukan enforcement sesungguhnya.
 * Enforcement wajib ada di dalam Firestore transaction (lihat
 * approveTelaah/revisiTelaah/teruskanRevisi di telaah-internal-store).
 */
export function getAksiTelaah(
  tahapSaatIni: TelaahTahap,
  level: TelaahLevel,
): TelaahAksiInternal {
  if (tahapSaatIni === TELAAH_TAHAP_BY_LEVEL[level]) return "telaah";
  if (tahapSaatIni === TELAAH_TAHAP_REVISI_BY_LEVEL[level]) return "teruskan";
  return "lihat_saja";
}

/**
 * Wrapper backward-compatible — return true kalau user punya aksi apa
 * pun di tahap ini (telaah, teruskan). Dipakai pemanggil lama yang cuma
 * butuh boolean "bisa buka form atau tidak".
 */
export function bolehApprove(
  tahapSaatIni: TelaahTahap,
  level: TelaahLevel,
): boolean {
  return getAksiTelaah(tahapSaatIni, level) !== "lihat_saja";
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
