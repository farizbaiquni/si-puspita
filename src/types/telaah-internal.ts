/* ------------------------------------------------------------------ */
/*  telaah-internal.ts                                                 */
/*  Tipe data Modul Telaah Internal Struktural BPKAD                  */
/*  (Kasubbid → Kabid → Sekban, dengan alur revisi turun berjenjang)   */
/* ------------------------------------------------------------------ */

/* ==================== 1. Tahap & Milestone ==================== */

/**
 * 8 state (4 naik + 3 turun + 1 final).
 *
 * Naik:
 *   MENUNGGU_TELAAH_KASUBBID → MENUNGGU_TELAAH_KABID
 *   → MENUNGGU_TELAAH_SEKBAN → SELESAI
 *
 * Turun (Sekban reject):
 *   MENUNGGU_REVISI_KABID → MENUNGGU_REVISI_KASUBBID
 *   → MENUNGGU_ADMIN_KIRIM_REVISI → MENUNGGU_REVISI_OPD
 *
 * Turun (Kabid reject):
 *   MENUNGGU_REVISI_KASUBBID → MENUNGGU_ADMIN_KIRIM_REVISI
 *   → MENUNGGU_REVISI_OPD
 *
 * Turun (Kasubbid reject):
 *   MENUNGGU_ADMIN_KIRIM_REVISI → MENUNGGU_REVISI_OPD
 *
 * Setelah OPD submit perbaikan → Admin "Ajukan Telaah Ulang":
 *   MENUNGGU_REVISI_OPD → MENUNGGU_TELAAH_KASUBBID (siklus baru)
 */
export const TELAAH_TAHAP_OPTIONS = [
  "MENUNGGU_TELAAH_KASUBBID",
  "MENUNGGU_TELAAH_KABID",
  "MENUNGGU_TELAAH_SEKBAN",
  "MENUNGGU_REVISI_KABID",
  "MENUNGGU_REVISI_KASUBBID",
  "MENUNGGU_ADMIN_KIRIM_REVISI",
  "MENUNGGU_REVISI_OPD",
  "SELESAI",
] as const;
export type TelaahTahap = (typeof TELAAH_TAHAP_OPTIONS)[number];

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
 * 11 milestone historis untuk log riwayat[].
 */
export const TELAAH_MILESTONE_OPTIONS = [
  // Naik
  "DIAJUKAN",
  "SUDAH_TELAAH_KASUBBID",
  "SUDAH_TELAAH_KABID",
  "SUDAH_TELAAH_SEKBAN",
  // Reject (pemicu turun)
  "REVISI_DARI_KASUBBID",
  "REVISI_DARI_KABID",
  "REVISI_DARI_SEKBAN",
  // Teruskan (jenjang turun)
  "DITERUSKAN_KASUBBID",
  "DITERUSKAN_KABID",
  "DIKIRIM_KE_OPD",
  // Reset
  "SIKLUS_BARU_DIMULAI",
] as const;
export type TelaahMilestone = (typeof TELAAH_MILESTONE_OPTIONS)[number];

export const TELAAH_LEVEL_OPTIONS = ["kasubbid", "kabid", "sekban"] as const;
export type TelaahLevel = (typeof TELAAH_LEVEL_OPTIONS)[number];

/* ==================== 2. Label (untuk UI) ==================== */

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

export const TELAAH_LEVEL_LABEL: Record<TelaahLevel, string> = {
  kasubbid: "Kasubbid",
  kabid: "Kabid",
  sekban: "Sekban",
};

export const TELAAH_LEVEL_SUBTITLE: Record<TelaahLevel, string> = {
  kasubbid: "Akuntansi dan Pelaporan",
  kabid: "Perbendaharaan dan Akuntansi",
  sekban: "Sekretaris Badan BPKAD Kab. Kendal",
};

/* ==================== 3. Mapping helper ==================== */

export const TELAAH_NEXT_TAHAP: Record<TelaahTahap, TelaahTahap> = {
  MENUNGGU_TELAAH_KASUBBID: "MENUNGGU_TELAAH_KABID",
  MENUNGGU_TELAAH_KABID: "MENUNGGU_TELAAH_SEKBAN",
  MENUNGGU_TELAAH_SEKBAN: "SELESAI",
  MENUNGGU_REVISI_KABID: "MENUNGGU_REVISI_KASUBBID",
  MENUNGGU_REVISI_KASUBBID: "MENUNGGU_ADMIN_KIRIM_REVISI",
  MENUNGGU_ADMIN_KIRIM_REVISI: "MENUNGGU_REVISI_OPD",
  MENUNGGU_REVISI_OPD: "MENUNGGU_TELAAH_KASUBBID",
  SELESAI: "SELESAI",
};

export const TELAAH_TAHAP_BY_LEVEL: Record<TelaahLevel, TelaahTahap> = {
  kasubbid: "MENUNGGU_TELAAH_KASUBBID",
  kabid: "MENUNGGU_TELAAH_KABID",
  sekban: "MENUNGGU_TELAAH_SEKBAN",
};

export const TELAAH_TAHAP_REVISI_BY_LEVEL: Partial<
  Record<TelaahLevel, TelaahTahap>
> = {
  kasubbid: "MENUNGGU_REVISI_KASUBBID",
  kabid: "MENUNGGU_REVISI_KABID",
};

export const TELAAH_TAHAP_SETELAH_REJECT: Record<TelaahLevel, TelaahTahap> = {
  kasubbid: "MENUNGGU_ADMIN_KIRIM_REVISI",
  kabid: "MENUNGGU_REVISI_KASUBBID",
  sekban: "MENUNGGU_REVISI_KABID",
};

export const TELAAH_MILESTONE_BY_LEVEL: Record<TelaahLevel, TelaahMilestone> = {
  kasubbid: "SUDAH_TELAAH_KASUBBID",
  kabid: "SUDAH_TELAAH_KABID",
  sekban: "SUDAH_TELAAH_SEKBAN",
};

export const TELAAH_MILESTONE_REJECT_BY_LEVEL: Record<
  TelaahLevel,
  TelaahMilestone
> = {
  kasubbid: "REVISI_DARI_KASUBBID",
  kabid: "REVISI_DARI_KABID",
  sekban: "REVISI_DARI_SEKBAN",
};

export const TELAAH_MILESTONE_TERUSKAN_BY_LEVEL: Partial<
  Record<TelaahLevel, TelaahMilestone>
> = {
  kasubbid: "DITERUSKAN_KASUBBID",
  kabid: "DITERUSKAN_KABID",
};

export const TELAAH_NOTIF_TARGET_BY_NEXT_TAHAP: Record<TelaahTahap, string> = {
  MENUNGGU_TELAAH_KASUBBID: "kasubbid",
  MENUNGGU_TELAAH_KABID: "kabid",
  MENUNGGU_TELAAH_SEKBAN: "sekban",
  MENUNGGU_REVISI_KABID: "kabid",
  MENUNGGU_REVISI_KASUBBID: "kasubbid",
  MENUNGGU_ADMIN_KIRIM_REVISI: "admin",
  MENUNGGU_REVISI_OPD: "",
  SELESAI: "admin",
};

/* ==================== 4. Record types ==================== */

export type StatusDokumenTelaah = "sesuai" | "belum_sesuai" | null;

export interface TelaahChecklistItem {
  status: StatusDokumenTelaah;
  catatan: string;
}

export interface TelaahLogEntry {
  milestone: TelaahMilestone;
  olehUsername: string;
  olehTelaahLevel: TelaahLevel | "admin";
  catatan: string;
  timestamp: string;
  checklistDokumen?: Record<string, TelaahChecklistItem>;
}

export interface TelaahInternalRecord {
  id: string;
  pengajuanId: string;
  nomorPengajuan: string;
  nomorRegistrasi: string;
  namaOPD: string;
  namaPenanggungJawab: string;
  diajukanOleh: string;
  diajukanPada: string;
  tahapSaatIni: TelaahTahap;
  selesai: boolean;
  selesaiPada: string | null;
  riwayat: TelaahLogEntry[];
  siklusKe?: number;
}

export interface NotifikasiInternalRecord {
  id: string;
  targetUsername: string;
  targetLevel: TelaahLevel | "admin";
  telaahId: string;
  pengajuanId: string;
  nomorPengajuan: string;
  nomorRegistrasi: string;
  milestone: TelaahMilestone;
  judul: string;
  pesan: string;
  dibaca: boolean;
  createdAt: string;
}

/* ==================== 5. Utility ==================== */

export type TelaahAksiInternal = "telaah" | "teruskan" | "lihat_saja";

export function getAksiTelaah(
  tahapSaatIni: TelaahTahap,
  level: TelaahLevel,
): TelaahAksiInternal {
  if (tahapSaatIni === TELAAH_TAHAP_BY_LEVEL[level]) return "telaah";
  if (tahapSaatIni === TELAAH_TAHAP_REVISI_BY_LEVEL[level]) return "teruskan";
  return "lihat_saja";
}

export function bolehApprove(
  tahapSaatIni: TelaahTahap,
  level: TelaahLevel,
): boolean {
  return getAksiTelaah(tahapSaatIni, level) !== "lihat_saja";
}

export function isInternalStruktural(role: string | undefined): boolean {
  return role === "INTERNAL_STRUKTURAL";
}

export function labelMilestone(milestone: TelaahMilestone): string {
  return TELAAH_MILESTONE_LABEL[milestone] ?? milestone;
}

export function labelTahap(tahap: TelaahTahap): string {
  return TELAAH_TAHAP_LABEL[tahap] ?? tahap;
}
