/* ------------------------------------------------------------------ */
/*  types-v2.ts                                                       */
/*  Tipe data Formulir Pengajuan Penghapusan Piutang OPD               */
/* ------------------------------------------------------------------ */

/* ==================== 0. Daftar OPD (Organisasi Perangkat Daerah) ==================== */
/*  Daftar resmi 5 OPD yang menggunakan SI PUSPITA. `id` adalah id numerik   */
/*  instansi di Kabupaten Kendal, `slug` dipakai sebagai identifier pendek   */
/*  (mis. untuk createdBy/opdId sebelum ada sistem login sungguhan), `nama`  */
/*  adalah nama resmi yang ditampilkan di UI.                                */

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

// Istilah resmi (PMK 137/2022) — stabil, tidak perlu di-snake_case-kan.
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

// Kategori internal — identifier pendek, label tampilan terpisah di bawah.
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

// Alasan piutang tidak dapat diserahkan ke PUPN — Langkah 3 (Checklist
// Persyaratan Substantif). Nilai berasal dari opsi radio button di
// AjukanPermohonan.tsx (pupnOptions).
export const OPSI_TIDAK_DAPAT_DISERAHKAN_PUPN_OPTIONS = [
  "dokumen_tidak_memadai",
  "jumlah_tidak_pasti",
  "sengketa_pengadilan",
  "ditolak_pupn",
] as const;
export type OpsiTidakDapatDiserahkanPUPN =
  (typeof OPSI_TIDAK_DAPAT_DISERAHKAN_PUPN_OPTIONS)[number];

// Opsi ya/tidak generik — dipakai untuk opsiKerjaSamaPihakKetiga.
export type OpsiYaTidak = "ya" | "tidak";

// Opsi ada/tidak — dipakai untuk opsiUpayaOptimal (beda label dari
// OpsiDokumenDasarPiutang meski nilainya sama, supaya masing-masing
// bisa berkembang independen kalau labelnya nanti perlu beda).
export type OpsiAdaTidak = "ada" | "tidak";

export interface PernyataanOPD {
  dataBenar: boolean;
  dokumenResmi: boolean;
  upayaPenagihan: boolean;
  bersediaPerbaiki: boolean;
}

/* ==================== 1b. Notifikasi OPD ==================== */
/*  Satu dokumen = satu notifikasi hasil verifikasi Admin, ditujukan ke   */
/*  OPD pemilik pengajuan (opdId). Disimpan di collection Firestore       */
/*  terpisah ("notifikasiOPD") supaya:                                    */
/*   - tetap ada / persist walau OPD sedang offline saat diverifikasi,    */
/*   - status "dibaca" bisa dilacak per notifikasi,                       */
/*   - query-nya ringan (cukup where opdId == ..., tidak perlu baca       */
/*     seluruh collection "pengajuan").                                   */
export interface NotifikasiOPD {
  id: string;
  opdId: string;
  pengajuanId: string;
  nomorPengajuan: string;
  status: StatusFormulir;
  judul: string;
  pesan: string;
  dibaca: boolean;
  createdAt: string; // ISO date
}

/* ==================== 1c. Riwayat Revisi ==================== */
/*  Setiap kali OPD melakukan "Edit & Ajukan Ulang" atas pengajuan yang    */
/*  statusnya "revisi", snapshot data SEBELUM diubah disimpan sebagai satu */
/*  dokumen di subcollection Firestore "pengajuan/{id}/riwayatRevisi" —    */
/*  supaya data lama tidak pernah tertimpa/hilang dan bisa ditelusuri.     */
/*  `dataSebelum` sengaja Partial (bukan record penuh) karena hanya field  */
/*  yang berubah pada revisi ini yang perlu disimpan; field yang tidak     */
/*  disentuh cukup dilihat dari dokumen utama / riwayat sebelumnya.        */
export interface RiwayatRevisiRecord {
  id: string;
  pengajuanId: string;
  /** Ke berapa kali OPD mengajukan ulang (1 = revisi pertama, dst). */
  revisiKe: number;
  /** Catatan BPKAD yang sedang direspon lewat revisi ini (boleh kosong). */
  catatanVerifikasi: string | null;
  /** Snapshot field-field yang berubah, bernilai SEBELUM revisi ini disimpan. */
  dataSebelum: Partial<FormulirPenghapusanPiutangOPDRecord>;
  diajukanUlangOleh: string;
  createdAt: string; // ISO date — kapan revisi ini disimpan
}

/* ==================== 2. Form types (client state) ==================== */
/*  Field dokumen bertipe `File | null` — objek file mentah dari input.  */
/*  Dokumen nominatif (daftar penanggung piutang) ada di sini sebagai    */
/*  field datar: OPD hanya mengunggah satu PDF berisi banyak baris       */
/*  debitur, jadi tidak perlu array atau entity terpisah.                */

export interface FormulirPenghapusanPiutangOPD {
  // Data Pengajuan
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

  // Dokumen Nominatif
  suratPengantarUsulan: File | null;
  daftarNominatifPiutang: File | null;
  rekapitulasiSaldoPiutang: File | null;
  nilaiRekapitulasiSaldoPiutang: string;
  neracaAwalPencatatanPiutang: File | null;
  dokumenPendukungSuratTidakMampuBayar: File | null;
  rekapitulasiAngsuran: File | null;
  nilaiRekapitulasiAngsuran: string;

  // Riwayat Penagihan
  opsiRiwayatPenagihan: OpsiRiwayatPenagihan | "";
  riwayatPenagihan1: File | null;
  riwayatPenagihan2: File | null;
  riwayatPenagihan3: File | null;
  filePernyataanOPD: File | null;

  // Dokumen Dasar Piutang
  opsiDokumenDasarPiutang: OpsiDokumenDasarPiutang | "";
  dokumenDasarPiutang: File | null;

  // Checklist Persyaratan Substantif (Langkah 3)
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
/*  Representasi data setelah tersimpan di server. Field dokumen jadi   */
/*  `UploadedFileRef | null` karena file sudah dipindah ke storage.     */

export interface UploadedFileRef {
  id: string;
  url: string;
  namaFile: string;
  ukuranBytes: number;
  uploadedAt: string; // ISO date
}

export interface FormulirPenghapusanPiutangOPDRecord {
  id: string;
  /**
   * Nomor pengajuan resmi, format: XXX/PENGAJUAN/DISDAGKOPUKM/MM/YYYY
   * (mis. "003/PENGAJUAN/DISDAGKOPUKM/07/2026"). Digenerate sekali saat
   * createPengajuan() lewat Firestore transaction pada counter
   * "counters/nomorPengajuan" (lihat lib/pengajuan.ts) — beda dari `id`
   * (Firestore doc ID acak) dan dari `nomorRegistrasi` (baru terbit
   * setelah lolos verifikasi BPKAD).
   */
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

  // Checklist Persyaratan Substantif (Langkah 3)
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

  // Diisi BPKAD saat verifikasi, kosong selama status masih "diajukan".
  // Bertipe `| null` (bukan cuma opsional) karena ajukanUlangPengajuan()
  // di lib/pengajuan.ts sengaja meng-null-kan kedua field ini setiap kali
  // OPD ajukan ulang, supaya "Lihat catatan revisi →" tidak menampilkan
  // catatan lama yang sudah dijawab (catatan lamanya tetap ada, cuma
  // pindah ke riwayatRevisi lewat RiwayatRevisiRecord.catatanVerifikasi).
  checklistSubstantif?: Record<string, boolean>;
  verifikatorId?: string;
  tanggalVerifikasi?: string | null;
  catatanVerifikasi?: string | null;

  /**
   * Status Reviu Inspektorat — di-set admin setelah telaah internal selesai.
   * `null` / undefined = belum masuk tahap reviu.
   * `"MENUNGGU_REVIU"` = sudah diajukan ke Inspektorat (final, tidak ada
   *                     aksi lanjutan di aplikasi — proses offline).
   *
   * CATATAN: field ini TIDAK mengubah `status` (StatusFormulir) — status
   * tetap "teregistrasi". Field ini murni untuk menandai tahap reviu.
   */
  reviuInspektoratStatus?: "MENUNGGU_REVIU" | null;

  /**
   * Berapa kali OPD sudah mengajukan ulang (edit setelah status "revisi").
   * Naik setiap kali ajukanUlangPengajuan() berhasil; dipakai sebagai
   * `revisiKe` pada dokumen riwayat & badge "Revisi ke-N" di UI. 0 kalau
   * belum pernah direvisi sama sekali.
   */
  jumlahRevisi?: number;
}

// Payload submit: field File sudah dikonversi ke UploadedFileRef,
// metadata server (id, status, dll) belum ada — akan digenerate backend.
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
