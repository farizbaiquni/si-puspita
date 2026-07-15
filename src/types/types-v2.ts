/* ------------------------------------------------------------------ */
/*  types-v2.ts                                                       */
/*  Tipe data Formulir Pengajuan Penghapusan Piutang OPD               */
/* ------------------------------------------------------------------ */

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

export interface PernyataanOPD {
  dataBenar: boolean;
  dokumenResmi: boolean;
  upayaPenagihan: boolean;
  bersediaPerbaiki: boolean;
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
  neracaAwalPencatatanPiutang: File | null;
  dokumenPendukungSuratTidakMampuBayar: File | null;
  rekapitulasiAngsuran: File | null;

  // Riwayat Penagihan
  opsiRiwayatPenagihan: OpsiRiwayatPenagihan | "";
  riwayatPenagihan1: File | null;
  riwayatPenagihan2: File | null;
  riwayatPenagihan3: File | null;
  filePernyataanOPD: File | null;

  // Dokumen Dasar Piutang
  opsiDokumenDasarPiutang: OpsiDokumenDasarPiutang | "";
  dokumenDasarPiutang: File | null;

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
  opdId: string;
  createdBy: string;
  namaOPD: string;
  status: StatusFormulir;
  createdAt: string;
  updatedAt: string;

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
  neracaAwalPencatatanPiutang: UploadedFileRef | null;
  dokumenPendukungSuratTidakMampuBayar: UploadedFileRef | null;
  rekapitulasiAngsuran: UploadedFileRef | null;

  opsiRiwayatPenagihan: OpsiRiwayatPenagihan;
  riwayatPenagihan1: UploadedFileRef | null;
  riwayatPenagihan2: UploadedFileRef | null;
  riwayatPenagihan3: UploadedFileRef | null;
  filePernyataanOPD: UploadedFileRef | null;

  opsiDokumenDasarPiutang: OpsiDokumenDasarPiutang;
  dokumenDasarPiutang: UploadedFileRef | null;

  pernyataan: PernyataanOPD;

  // Diisi BPKAD saat verifikasi, kosong selama status masih "diajukan".
  checklistSubstantif?: Record<string, boolean>;
  verifikatorId?: string;
  tanggalVerifikasi?: string;
  catatanVerifikasi?: string;
}

// Payload submit: field File sudah dikonversi ke UploadedFileRef,
// metadata server (id, status, dll) belum ada — akan digenerate backend.
export type FormulirPenghapusanPiutangOPDSubmitPayload = Omit<
  FormulirPenghapusanPiutangOPDRecord,
  "id" | "createdBy" | "status" | "createdAt" | "updatedAt"
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
    neracaAwalPencatatanPiutang: null,
    dokumenPendukungSuratTidakMampuBayar: null,
    rekapitulasiAngsuran: null,
    opsiRiwayatPenagihan: "",
    riwayatPenagihan1: null,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "",
    dokumenDasarPiutang: null,
    pernyataan: { ...initialPernyataanOPD },
  };
