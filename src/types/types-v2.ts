/* ------------------------------------------------------------------ */
/*  types-v2.ts                                                       */
/*  Tipe data untuk Formulir Pengajuan Penghapusan Piutang OPD         */
/*                                                                      */
/*  Struktur file ini dibagi 3 bagian:                                 */
/*   1. Enum / literal types      -> dipakai di form maupun entity     */
/*   2. Form types (client state) -> File | null (objek File mentah)   */
/*   3. Entity / record types     -> UploadedFileRef | null (hasil     */
/*      upload, representasi row dari database / response API)        */
/*                                                                      */
/*  Alur konversi:                                                     */
/*    FormulirPenghapusanPiutangOPD (state form)                       */
/*      -> upload tiap File ke storage                                 */
/*      -> FormulirPenghapusanPiutangOPDRecord (payload API / DB)      */
/* ------------------------------------------------------------------ */

/* ==================================================================== */
/*  1. Enum / literal types                                             */
/* ==================================================================== */

export type JenisPiutang =
  | "Piutang Retribusi Daerah"
  | "Piutang Lain-lain PAD yang Sah"
  | "Piutang Lainnya";

export type JenisPenghapusan = "Penghapusan Bersyarat" | "Penghapusan Mutlak";

export type OpsiRiwayatPenagihan = "riwayat" | "pernyataan" | "tidak_ada";

export type OpsiDokumenDasarPiutang = "ada" | "tidak_ada";

export type StatusFormulir = "diajukan" | "revisi" | "lolos_verifikasi";

export interface PernyataanOPD {
  dataBenar: boolean;
  dokumenResmi: boolean;
  upayaPenagihan: boolean;
  bersediaPerbaiki: boolean;
}

export interface NominatifPiutang {
  id: string;

  // Dokumen wajib utama
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
}

/** Formulir OPD — top-level state form. */
export interface FormulirPenghapusanPiutangOPD {
  // Identitas Usulan / Data OPD (diisi sekali per formulir)
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

  // SATU nominatif (bukan array)
  nominatif: NominatifPiutang;

  // Pernyataan OPD (langkah akhir)
  pernyataan: PernyataanOPD;
}

/* -------------------- Nilai awal / default helpers -------------------- */

export const initialPernyataanOPD: PernyataanOPD = {
  dataBenar: false,
  dokumenResmi: false,
  upayaPenagihan: false,
  bersediaPerbaiki: false,
};

export const createEmptyNominatifPiutang = (id: string): NominatifPiutang => ({
  id,
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
});

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
    nominatif: createEmptyNominatifPiutang("NOM-001"), // satu objek default
    pernyataan: { ...initialPernyataanOPD },
  };

/* ==================================================================== */
/*  3. Entity / record types — representasi data setelah tersimpan      */
/*     di server (hasil query database / response API).                 */
/*     Field dokumen berubah dari `File | null` menjadi                 */
/*     `UploadedFileRef | null` karena file fisik sudah dipindah ke      */
/*     storage (S3 / Supabase Storage / disk) dan yang tersimpan di DB   */
/*     hanyalah referensinya.                                            */
/* ==================================================================== */

/** Referensi file yang sudah selesai diupload ke storage. */
export interface UploadedFileRef {
  id: string;
  url: string; // path/URL ke storage (S3, Supabase storage, dll)
  namaFile: string;
  ukuranBytes: number;
  uploadedAt: string; // ISO date
}

export interface NominatifPiutangRecord {
  id: string;
  formulirId: string; // FK -> FormulirPenghapusanPiutangOPDRecord.id

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
}

export interface FormulirPenghapusanPiutangOPDRecord {
  id: string;
  opdId: string; // FK -> tabel master OPD
  createdBy: string; // FK -> tabel user (akun yang submit)
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

  // SATU nominatif (bukan array)
  nominatif: NominatifPiutangRecord;

  pernyataan: PernyataanOPD;
}

/* ==================================================================== */
/*  Payload konversi File -> UploadedFileRef (dipakai saat proses        */
/*  upload sebelum data dikirim sebagai record/payload API)             */
/* ==================================================================== */

/** Bentuk payload saat submit: form yang field File-nya sudah          */
/*  dikonversi jadi UploadedFileRef, tapi belum lengkap metadata server  */
/*  (id, createdAt, dll — biasanya di-generate backend).                */
export type FormulirPenghapusanPiutangOPDSubmitPayload = Omit<
  FormulirPenghapusanPiutangOPDRecord,
  "id" | "createdBy" | "status" | "createdAt" | "updatedAt"
> & {
  opdId: string;
};
