/* ------------------------------------------------------------------ */
/*  types.ts                                                           */
/*  Tipe data Formulir Pengajuan Penghapusan Piutang OPD               */
/* ------------------------------------------------------------------ */

/* ==================== 0. Daftar OPD ==================== */

export interface OpdInfo {
  id: number;
  slug: string;
  nama: string;
}

export const DAFTAR_OPD: readonly OpdInfo[] = [
  { id: 33, slug: "rsud", nama: "RSUD" },
  { id: 49, slug: "dishub", nama: "Dinas Perhubungan" },
  { id: 50, slug: "diskominfo", nama: "Dinas Komunikasi dan Informatika" },
  { id: 56, slug: "disdagkopukm", nama: "Dinas Perdagangan Koperasi dan UKM" },
  { id: 57, slug: "setwan", nama: "Sekretariat Dewan" },
  {
    id: 51,
    slug: "dpmptsp",
    nama: "Dinas Penanaman Modal dan Perizinan Terpadu Satu Pintu",
  },
  {
    id: 70,
    slug: "bpkad",
    nama: "Badan Pengelolaan Keuangan dan Aset Daerah",
  },
] as const;

export function getOpdBySlug(slug: string): OpdInfo | undefined {
  return DAFTAR_OPD.find((o) => o.slug === slug);
}
export function getOpdById(id: number): OpdInfo | undefined {
  return DAFTAR_OPD.find((o) => o.id === id);
}
export function getOpdByNama(nama: string): OpdInfo | undefined {
  return DAFTAR_OPD.find((o) => o.nama === nama);
}

/* ==================== 1. Enum / literal types ==================== */

export const JENIS_PIUTANG_OPTIONS = [
  "Piutang Retribusi Daerah",
  "Piutang Lain-lain PAD yang Sah",
  "Piutang Lainnya",
] as const;
export type JenisPiutang = (typeof JENIS_PIUTANG_OPTIONS)[number];

export const JENIS_PENGHAPUSAN_OPTIONS = [
  "Penghapusan Bersyarat",
  "Penghapusan Mutlak",
] as const;
export type JenisPenghapusan = (typeof JENIS_PENGHAPUSAN_OPTIONS)[number];

export type OpsiRiwayatPenagihan = "riwayat_tagihan" | "penyataan_opd";
export const OPSI_RIWAYAT_PENAGIHAN_LABEL: Record<
  OpsiRiwayatPenagihan,
  string
> = {
  riwayat_tagihan: "Riwayat Tagihan",
  penyataan_opd: "Pernyataan OPD",
};

export type OpsiDokumenDasarPiutang = "ada" | "tidak_ada";
export const OPSI_DOKUMEN_DASAR_PIUTANG_LABEL: Record<
  OpsiDokumenDasarPiutang,
  string
> = {
  ada: "Ada",
  tidak_ada: "Tidak Ada",
};

export type StatusFormulir = "diajukan" | "revisi" | "teregistrasi";
export const STATUS_FORMULIR_LABEL: Record<StatusFormulir, string> = {
  diajukan: "Diajukan",
  revisi: "Revisi",
  teregistrasi: "Teregistrasi",
};

export const OPSI_TIDAK_DAPAT_DISERAHKAN_PUPN_OPTIONS = [
  "dokumen_tidak_memadai",
  "jumlah_tidak_pasti",
  "sengketa_pengadilan",
  "ditolak_pupn",
] as const;
export type OpsiTidakDapatDiserahkanPUPN =
  (typeof OPSI_TIDAK_DAPAT_DISERAHKAN_PUPN_OPTIONS)[number];

export type OpsiYaTidak = "ya" | "tidak";
export type OpsiAdaTidak = "ada" | "tidak";

export interface PernyataanOPD {
  dataBenar: boolean;
  dokumenResmi: boolean;
  upayaPenagihan: boolean;
  bersediaPerbaiki: boolean;
}

/* ==================== 1b. Notifikasi OPD ==================== */

export interface NotifikasiOPD {
  id: string;
  opdId: string;
  pengajuanId: string;
  nomorPengajuan: string;
  status: StatusFormulir;
  judul: string;
  pesan: string;
  dibaca: boolean;
  createdAt: string;
  /**
   * Jenis notifikasi — untuk UI bedakan warna/ikon di dropdown.
   * Opsional untuk backward-compat: notif lama (dibuat sebelum fitur
   * revisi telaah internal) tidak punya field ini → di UI diperlakukan
   * sebagai "verifikasi" (default).
   */
  tipe?: "verifikasi" | "telaah_internal";
}

/* ==================== 1c. Riwayat Revisi (verifikasi BPKAD) ============ */

export interface RiwayatRevisiRecord {
  id: string;
  pengajuanId: string;
  revisiKe: number;
  catatanVerifikasi: string | null;
  dataSebelum: Partial<FormulirPenghapusanPiutangOPDRecord>;
  diajukanUlangOleh: string;
  createdAt: string;
}

/* ==================== 1d. Revisi Telaah Internal ==================== */

export type TelaahLevelSumberCatatan =
  "kasubbid" | "kabid" | "sekban" | "admin";

export interface CatatanRevisiTelaah {
  olehLevel: TelaahLevelSumberCatatan;
  olehUsername: string;
  catatan: string;
  timestamp: string;
}

/**
 * Catatan revisi PER-DOKUMEN dari level telaah tertentu.
 * Hanya menyimpan `docKey` (mis. "persyaratanPiutangMacet") — BUKAN label
 * panjang. Label di-lookup saat render dari buildDokumenTampilan() supaya
 * konsisten walau label berubah nanti.
 */
export interface CatatanDokumenRevisi {
  docKey: string;
  olehLevel: TelaahLevelSumberCatatan;
  olehUsername: string;
  catatan: string;
  timestamp: string;
}

export interface RevisiTelaahInternal {
  aktif: boolean;
  telaahId: string;
  dikirimOleh: string;
  dikirimPada: string;
  /** Catatan berjenjang per level, urut kronologis. */
  catatanPerLevel: CatatanRevisiTelaah[];
  /**
   * Catatan PER-DOKUMEN dari tiap level yang menandai "Belum Sesuai".
   * Opsional untuk backward-compat.
   */
  catatanPerDokumen?: CatatanDokumenRevisi[];
}

export const TELAAH_LEVEL_SUMBER_CATATAN_LABEL: Record<
  TelaahLevelSumberCatatan,
  string
> = {
  kasubbid: "Kasubbid",
  kabid: "Kabid",
  sekban: "Sekban",
  admin: "Admin BPKAD",
};

/* ==================== 2. Form types (client state) ==================== */

export interface FormulirPenghapusanPiutangOPD {
  namaOPD: string;
  namaPenanggungJawab: string;
  jabatan: string;
  nomorSurat: string;
  tanggalSurat: string;
  fileSurat: File | null;
  jumlahDebitur: string;
  totalNilaiPiutang: string;
  jenisPiutang: JenisPiutang | "";
  jenisPenghapusan: JenisPenghapusan | "";

  suratPengantarUsulan: File | null;
  daftarNominatifPiutang: File | null;
  rekapitulasiSaldoPiutang: File | null;
  nilaiRekapitulasiSaldoPiutang: string;
  neracaAwalPencatatanPiutang: File | null;
  dokumenPendukungSuratTidakMampuBayar: File | null;
  rekapitulasiAngsuran: File | null;
  nilaiRekapitulasiAngsuran: string;

  opsiRiwayatPenagihan: OpsiRiwayatPenagihan | "";
  riwayatPenagihan1: File | null;
  riwayatPenagihan2: File | null;
  riwayatPenagihan3: File | null;
  filePernyataanOPD: File | null;

  opsiDokumenDasarPiutang: OpsiDokumenDasarPiutang | "";
  dokumenDasarPiutang: File | null;

  persyaratanPiutangMacet: File | null;
  persyaratanUsiaPencatatan: File | null;
  opsiTidakDapatDiserahkanPUPN: OpsiTidakDapatDiserahkanPUPN | "";
  buktiTidakMampuKartuKeluargaMiskin: File | null;
  buktiTidakMampuPutusanPailit: File | null;
  buktiTidakMampuSuratKeteranganKelurahan: File | null;
  buktiTidakMampuBantuanSosial: File | null;
  buktiTidakMampuKunjunganPenagihan: File | null;
  opsiKerjaSamaPihakKetiga: OpsiYaTidak | "";
  buktiKerjaSamaPihakKetiga: File | null;
  opsiUpayaOptimal: OpsiAdaTidak | "";
  buktiUpayaOptimal: File | null;
  pernyataan: PernyataanOPD;
}

/* ==================== 3. Entity / record types ==================== */

export interface UploadedFileRef {
  id: string;
  url: string;
  namaFile: string;
  ukuranBytes: number;
  uploadedAt: string;
}

export interface FormulirPenghapusanPiutangOPDRecord {
  id: string;
  nomorPengajuan: string;
  opdId: string;
  createdBy: string;
  namaOPD: string;
  status: StatusFormulir;
  createdAt: string;
  updatedAt: string;
  nomorRegistrasi: string | null;

  namaPenanggungJawab: string;
  jabatan: string;
  nomorSurat: string;
  tanggalSurat: string;
  fileSurat: UploadedFileRef | null;
  jumlahDebitur: string;
  totalNilaiPiutang: string;
  jenisPiutang: JenisPiutang;
  jenisPenghapusan: JenisPenghapusan;

  suratPengantarUsulan: UploadedFileRef | null;
  daftarNominatifPiutang: UploadedFileRef | null;
  rekapitulasiSaldoPiutang: UploadedFileRef | null;
  nilaiRekapitulasiSaldoPiutang: string;
  neracaAwalPencatatanPiutang: UploadedFileRef | null;
  dokumenPendukungSuratTidakMampuBayar: UploadedFileRef | null;
  rekapitulasiAngsuran: UploadedFileRef | null;
  nilaiRekapitulasiAngsuran: string;

  opsiRiwayatPenagihan: OpsiRiwayatPenagihan;
  riwayatPenagihan1: UploadedFileRef | null;
  riwayatPenagihan2: UploadedFileRef | null;
  riwayatPenagihan3: UploadedFileRef | null;
  filePernyataanOPD: UploadedFileRef | null;

  opsiDokumenDasarPiutang: OpsiDokumenDasarPiutang;
  dokumenDasarPiutang: UploadedFileRef | null;

  persyaratanPiutangMacet: UploadedFileRef | null;
  persyaratanUsiaPencatatan: UploadedFileRef | null;
  opsiTidakDapatDiserahkanPUPN: OpsiTidakDapatDiserahkanPUPN;
  buktiTidakMampuKartuKeluargaMiskin: UploadedFileRef | null;
  buktiTidakMampuPutusanPailit: UploadedFileRef | null;
  buktiTidakMampuSuratKeteranganKelurahan: UploadedFileRef | null;
  buktiTidakMampuBantuanSosial: UploadedFileRef | null;
  buktiTidakMampuKunjunganPenagihan: UploadedFileRef | null;
  opsiKerjaSamaPihakKetiga: OpsiYaTidak;
  buktiKerjaSamaPihakKetiga: UploadedFileRef | null;
  opsiUpayaOptimal: OpsiAdaTidak;
  buktiUpayaOptimal: UploadedFileRef | null;

  pernyataan: PernyataanOPD;

  checklistSubstantif?: Record<string, boolean>;
  verifikatorId?: string;
  tanggalVerifikasi?: string | null;
  catatanVerifikasi?: string | null;

  reviuInspektoratStatus?: "MENUNGGU_REVIU" | null;

  jumlahRevisi?: number;

  /**
   * Info revisi telaah internal (BARU — non-destructive).
   * Di-set Admin saat klik "Kirim Revisi ke OPD".
   * Di-null-kan lagi setelah OPD submit perbaikan.
   * Status pengajuan TETAP "teregistrasi".
   */
  revisiTelaahInternal?: RevisiTelaahInternal | null;
}

export type FormulirPenghapusanPiutangOPDSubmitPayload = Omit<
  FormulirPenghapusanPiutangOPDRecord,
  | "id"
  | "nomorPengajuan"
  | "createdBy"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "nomorRegistrasi"
> & {
  opdId: string;
};

/* ==================== Nilai awal / default ==================== */

export const initialPernyataanOPD: PernyataanOPD = {
  dataBenar: false,
  dokumenResmi: false,
  upayaPenagihan: false,
  bersediaPerbaiki: false,
};

export const initialFormulirPenghapusanPiutangOPD: FormulirPenghapusanPiutangOPD =
  {
    namaOPD: "",
    namaPenanggungJawab: "",
    jabatan: "",
    nomorSurat: "",
    tanggalSurat: "",
    fileSurat: null,
    jumlahDebitur: "",
    totalNilaiPiutang: "",
    jenisPiutang: "",
    jenisPenghapusan: "",
    suratPengantarUsulan: null,
    daftarNominatifPiutang: null,
    rekapitulasiSaldoPiutang: null,
    nilaiRekapitulasiSaldoPiutang: "",
    neracaAwalPencatatanPiutang: null,
    dokumenPendukungSuratTidakMampuBayar: null,
    rekapitulasiAngsuran: null,
    nilaiRekapitulasiAngsuran: "",
    opsiRiwayatPenagihan: "",
    riwayatPenagihan1: null,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "",
    dokumenDasarPiutang: null,
    persyaratanPiutangMacet: null,
    persyaratanUsiaPencatatan: null,
    opsiTidakDapatDiserahkanPUPN: "",
    buktiTidakMampuKartuKeluargaMiskin: null,
    buktiTidakMampuPutusanPailit: null,
    buktiTidakMampuSuratKeteranganKelurahan: null,
    buktiTidakMampuBantuanSosial: null,
    buktiTidakMampuKunjunganPenagihan: null,
    opsiKerjaSamaPihakKetiga: "",
    buktiKerjaSamaPihakKetiga: null,
    opsiUpayaOptimal: "",
    buktiUpayaOptimal: null,
    pernyataan: { ...initialPernyataanOPD },
  };
