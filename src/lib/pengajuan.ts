import {
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { uploadDokumenOrNull } from "./cloudinary";
import type {
  FormulirPenghapusanPiutangOPD,
  FormulirPenghapusanPiutangOPDRecord,
  RiwayatRevisiRecord,
  UploadedFileRef,
} from "@/types/types";
import { getOpdByNama } from "@/types/types";

const PENGAJUAN_COLLECTION = "pengajuan";
const COUNTER_NOMOR_PENGAJUAN_ID = "nomorPengajuan";

/**
 * Format nomor pengajuan resmi: XXX/PENGAJUAN/<KODE_OPD>/MM/YYYY
 * Contoh: 003/PENGAJUAN/DISHUB/07/2026
 *
 * kodeOpd sebelumnya hardcode "DISDAGKOPUKM" — sekarang wajib diisi
 * pemanggil (diturunkan dari slug OPD yang submit, lihat createPengajuan),
 * supaya nomor pengajuan OPD lain tidak ikut memakai kode Disdagkopukm.
 */
function formatNomorPengajuan(
  urutan: number,
  kodeOpd: string,
  tanggal: Date = new Date(),
): string {
  const xxx = String(urutan).padStart(3, "0");
  const mm = String(tanggal.getMonth() + 1).padStart(2, "0");
  const yyyy = tanggal.getFullYear();
  return `${xxx}/PENGAJUAN/${kodeOpd}/${mm}/${yyyy}`;
}

/**
 * Ambil nomor urut berikutnya dari "counters/nomorPengajuan" lewat
 * Firestore transaction (aman dari race condition kalau dua OPD submit
 * hampir bersamaan), lalu format jadi nomor pengajuan resmi.
 *
 * Dijalankan terpisah dari transaction lain (mis. registrasiPengajuan di
 * pengajuan-store.tsx) karena di sini belum ada dokumen "pengajuan" yang
 * bisa di-update dalam transaction yang sama — dokumennya baru ditulis
 * setelah upload dokumen ke Cloudinary selesai (lihat createPengajuan).
 */
async function generateNomorPengajuan(
  kodeOpd: string,
  tanggal: Date = new Date(),
): Promise<string> {
  const counterRef = doc(db, "counters", COUNTER_NOMOR_PENGAJUAN_ID);
  return runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const urutan = (counterSnap.data()?.urutanTerakhir ?? 0) + 1;
    tx.set(counterRef, { urutanTerakhir: urutan }, { merge: true });
    return formatNomorPengajuan(urutan, kodeOpd, tanggal);
  });
}

/**
 * Daftar semua field bertipe File di FormulirPenghapusanPiutangOPD.
 * Dipisah dari field non-file supaya proses upload bisa di-loop otomatis
 * tanpa menulis satu-satu (dan otomatis ikut kalau nanti ada field file
 * baru ditambahkan di types.ts).
 */
const FIELD_DOKUMEN = [
  "fileSurat",
  "suratPengantarUsulan",
  "daftarNominatifPiutang",
  "rekapitulasiSaldoPiutang",
  "neracaAwalPencatatanPiutang",
  "dokumenPendukungSuratTidakMampuBayar",
  "rekapitulasiAngsuran",
  "riwayatPenagihan1",
  "riwayatPenagihan2",
  "riwayatPenagihan3",
  "filePernyataanOPD",
  "dokumenDasarPiutang",
  "persyaratanPiutangMacet",
  "persyaratanUsiaPencatatan",
  "buktiTidakMampuKartuKeluargaMiskin",
  "buktiTidakMampuPutusanPailit",
  "buktiTidakMampuSuratKeteranganKelurahan",
  "buktiTidakMampuBantuanSosial",
  "buktiTidakMampuKunjunganPenagihan",
  "buktiKerjaSamaPihakKetiga",
  "buktiUpayaOptimal",
] as const satisfies readonly (keyof FormulirPenghapusanPiutangOPD)[];

/**
 * Submit pengajuan baru: upload semua dokumen ke Storage secara paralel,
 * generate nomor pengajuan resmi (format XXX/PENGAJUAN/<KODE_OPD>/MM/YYYY,
 * kode OPD mengikuti slug OPD yang submit — mis. DISHUB, RSUD, dst),
 * lalu tulis satu dokumen ke Firestore collection "pengajuan".
 *
 * @param form   State form wizard (field File masih mentah, belum diupload)
 * @param createdBy  uid user yang submit (dari Firebase Auth — sementara
 *                    isi manual dulu sampai Step autentikasi selesai)
 * @returns id dokumen Firestore dan nomorPengajuan yang baru dibuat
 */
export async function createPengajuan(
  form: FormulirPenghapusanPiutangOPD,
  createdBy: string,
): Promise<{ id: string; nomorPengajuan: string }> {
  // doc() tanpa path collection lengkap men-generate ID unik duluan,
  // supaya path Storage (yang butuh pengajuanId) bisa dipakai sebelum
  // dokumen Firestore-nya sendiri ditulis.
  const pengajuanRef = doc(collection(db, PENGAJUAN_COLLECTION));
  const pengajuanId = pengajuanRef.id;
  const now = Timestamp.now().toDate();
  const nowIso = now.toISOString();

  // Kode OPD dipakai untuk bagian <KODE_OPD> di nomor pengajuan (mis.
  // "DISHUB") — diturunkan dari slug OPD yang submit form, BUKAN
  // hardcode ke satu OPD tertentu. Fallback ke opdId kalau namaOPD tidak
  // cocok dengan DAFTAR_OPD (seharusnya tidak pernah terjadi selama form
  // diisi dari sesi login yang valid).
  const opd = getOpdByNama(form.namaOPD);
  const kodeOpd = (opd?.slug ?? form.namaOPD).toUpperCase();

  // Upload semua field dokumen ke Cloudinary DAN generate nomor pengajuan
  // resmi (lewat Firestore transaction) secara paralel — jauh lebih cepat
  // daripada berurutan, dan keduanya independen satu sama lain.
  const [hasilUpload, nomorPengajuan] = await Promise.all([
    Promise.all(
      FIELD_DOKUMEN.map((field) =>
        uploadDokumenOrNull(form[field] as File | null, pengajuanId, field),
      ),
    ),
    generateNomorPengajuan(kodeOpd, now),
  ]);
  const dokumen = Object.fromEntries(
    FIELD_DOKUMEN.map((field, i) => [field, hasilUpload[i]]),
  ) as Record<(typeof FIELD_DOKUMEN)[number], UploadedFileRef | null>;

  const record: FormulirPenghapusanPiutangOPDRecord = {
    id: pengajuanId,
    nomorPengajuan,
    opdId: opd ? String(opd.id) : "",
    createdBy,
    namaOPD: form.namaOPD,
    status: "diajukan",
    createdAt: nowIso,
    updatedAt: nowIso,
    nomorRegistrasi: null,

    namaPenanggungJawab: form.namaPenanggungJawab,
    jabatan: form.jabatan,
    nomorSurat: form.nomorSurat,
    tanggalSurat: form.tanggalSurat,
    fileSurat: dokumen.fileSurat,
    jumlahDebitur: form.jumlahDebitur,
    totalNilaiPiutang: form.totalNilaiPiutang,
    jenisPiutang:
      form.jenisPiutang as FormulirPenghapusanPiutangOPDRecord["jenisPiutang"],
    jenisPenghapusan:
      form.jenisPenghapusan as FormulirPenghapusanPiutangOPDRecord["jenisPenghapusan"],

    suratPengantarUsulan: dokumen.suratPengantarUsulan,
    daftarNominatifPiutang: dokumen.daftarNominatifPiutang,
    rekapitulasiSaldoPiutang: dokumen.rekapitulasiSaldoPiutang,
    nilaiRekapitulasiSaldoPiutang: form.nilaiRekapitulasiSaldoPiutang,
    neracaAwalPencatatanPiutang: dokumen.neracaAwalPencatatanPiutang,
    dokumenPendukungSuratTidakMampuBayar:
      dokumen.dokumenPendukungSuratTidakMampuBayar,
    rekapitulasiAngsuran: dokumen.rekapitulasiAngsuran,
    nilaiRekapitulasiAngsuran: form.nilaiRekapitulasiAngsuran,

    opsiRiwayatPenagihan:
      form.opsiRiwayatPenagihan as FormulirPenghapusanPiutangOPDRecord["opsiRiwayatPenagihan"],
    riwayatPenagihan1: dokumen.riwayatPenagihan1,
    riwayatPenagihan2: dokumen.riwayatPenagihan2,
    riwayatPenagihan3: dokumen.riwayatPenagihan3,
    filePernyataanOPD: dokumen.filePernyataanOPD,

    opsiDokumenDasarPiutang:
      form.opsiDokumenDasarPiutang as FormulirPenghapusanPiutangOPDRecord["opsiDokumenDasarPiutang"],
    dokumenDasarPiutang: dokumen.dokumenDasarPiutang,

    persyaratanPiutangMacet: dokumen.persyaratanPiutangMacet,
    persyaratanUsiaPencatatan: dokumen.persyaratanUsiaPencatatan,
    opsiTidakDapatDiserahkanPUPN:
      form.opsiTidakDapatDiserahkanPUPN as FormulirPenghapusanPiutangOPDRecord["opsiTidakDapatDiserahkanPUPN"],
    buktiTidakMampuKartuKeluargaMiskin:
      dokumen.buktiTidakMampuKartuKeluargaMiskin,
    buktiTidakMampuPutusanPailit: dokumen.buktiTidakMampuPutusanPailit,
    buktiTidakMampuSuratKeteranganKelurahan:
      dokumen.buktiTidakMampuSuratKeteranganKelurahan,
    buktiTidakMampuBantuanSosial: dokumen.buktiTidakMampuBantuanSosial,
    buktiTidakMampuKunjunganPenagihan:
      dokumen.buktiTidakMampuKunjunganPenagihan,
    opsiKerjaSamaPihakKetiga:
      form.opsiKerjaSamaPihakKetiga as FormulirPenghapusanPiutangOPDRecord["opsiKerjaSamaPihakKetiga"],
    buktiKerjaSamaPihakKetiga: dokumen.buktiKerjaSamaPihakKetiga,
    opsiUpayaOptimal:
      form.opsiUpayaOptimal as FormulirPenghapusanPiutangOPDRecord["opsiUpayaOptimal"],
    buktiUpayaOptimal: dokumen.buktiUpayaOptimal,

    pernyataan: form.pernyataan,
  };

  await setDoc(pengajuanRef, record);

  return { id: pengajuanId, nomorPengajuan };
}

/**
 * Field non-dokumen yang boleh OPD ubah lewat "Edit & Ajukan Ulang".
 * (Sengaja tidak termasuk field meta seperti id/status/opdId/dll — itu
 * dikelola sendiri oleh fungsi ini, bukan oleh form edit.)
 */
type FieldBisaDirevisi =
  | "namaPenanggungJawab"
  | "jabatan"
  | "nomorSurat"
  | "tanggalSurat"
  | "jumlahDebitur"
  | "totalNilaiPiutang"
  | "jenisPiutang"
  | "jenisPenghapusan"
  | "nilaiRekapitulasiSaldoPiutang"
  | "nilaiRekapitulasiAngsuran"
  | "opsiRiwayatPenagihan"
  | "opsiDokumenDasarPiutang"
  | "opsiTidakDapatDiserahkanPUPN"
  | "opsiKerjaSamaPihakKetiga"
  | "opsiUpayaOptimal"
  | "pernyataan";

/**
 * Ajukan ulang pengajuan yang statusnya "revisi" (dipanggil OPD dari
 * ModalEditRevisi di LihatDaftarPengajuan.tsx).
 *
 * Berbeda dari updatePengajuan biasa (pengajuan-store.tsx) yang cuma
 * updateDoc polos, fungsi ini:
 *  1. Meng-upload FILE BARU (kalau ada) ke Cloudinary sungguhan — bukan
 *     lagi blob URL lokal seperti versi lama ModalEditRevisi.
 *  2. Menyimpan SNAPSHOT nilai lama (sebelum ditimpa) sebagai satu
 *     dokumen baru di subcollection "pengajuan/{id}/riwayatRevisi" —
 *     supaya histori revisi tidak pernah hilang meski dokumen utama
 *     sudah ditimpa data terbaru.
 *  3. Menimpa dokumen utama dengan data baru, mengembalikan status jadi
 *     "diajukan", dan menaikkan jumlahRevisi.
 * Langkah 2 & 3 dibungkus satu Firestore transaction supaya konsisten:
 * kalau salah satu gagal, tidak ada yang tertulis sama sekali.
 *
 * @param id               id dokumen pengajuan (Firestore doc ID)
 * @param fieldBaru        field non-dokumen yang diubah OPD di form edit
 * @param fileBaru         map field dokumen -> File baru (diupload) |
 *                         null (dihapus, tidak diganti) | undefined
 *                         (tidak disentuh, dokumen lama dipakai terus)
 * @param diajukanUlangOleh  uid OPD yang menyimpan revisi ini
 */
export async function ajukanUlangPengajuan(
  id: string,
  fieldBaru: Partial<
    Pick<FormulirPenghapusanPiutangOPDRecord, FieldBisaDirevisi>
  >,
  fileBaru: Partial<Record<(typeof FIELD_DOKUMEN)[number], File | null>>,
  diajukanUlangOleh: string,
): Promise<void> {
  const pengajuanRef = doc(db, PENGAJUAN_COLLECTION, id);

  // Dibaca dulu di luar transaction karena upload ke Cloudinary adalah
  // network call yang tidak boleh dijalankan di dalam runTransaction
  // Firestore (transaction hanya boleh berisi baca/tulis Firestore).
  const snapshotAwal = await getDoc(pengajuanRef);
  if (!snapshotAwal.exists()) {
    throw new Error(`Pengajuan dengan id "${id}" tidak ditemukan.`);
  }
  const dataLama = snapshotAwal.data() as FormulirPenghapusanPiutangOPDRecord;

  // Upload hanya field dokumen yang benar-benar diganti (value instanceof
  // File). Field yang ditandai hapus (null) atau tidak disentuh
  // (undefined) tidak perlu upload.
  const entriesFileBaru = Object.entries(fileBaru).filter(
    (entry): entry is [(typeof FIELD_DOKUMEN)[number], File] =>
      entry[1] instanceof File,
  );
  const hasilUpload = await Promise.all(
    entriesFileBaru.map(([field, file]) =>
      uploadDokumenOrNull(file, id, field),
    ),
  );
  const refDokumenBaru = Object.fromEntries(
    entriesFileBaru.map(([field], i) => [field, hasilUpload[i]]),
  ) as Partial<Record<(typeof FIELD_DOKUMEN)[number], UploadedFileRef | null>>;

  // Field dokumen yang ditandai hapus (fileBaru[field] === null, dan
  // TIDAK ada file baru untuk field itu) -> jadi null di dokumen utama.
  const refDokumenDihapus = Object.fromEntries(
    Object.entries(fileBaru)
      .filter(([, v]) => v === null)
      .map(([field]) => [field, null]),
  ) as Partial<Record<(typeof FIELD_DOKUMEN)[number], null>>;

  const updates: Record<string, unknown> = {
    ...fieldBaru,
    ...refDokumenBaru,
    ...refDokumenDihapus,
  };

  // Snapshot nilai LAMA hanya untuk field yang benar-benar berubah pada
  // revisi ini — inilah yang membuat data lama "tidak hilang": tersimpan
  // permanen di riwayatRevisi walau dokumen utama sudah ditimpa.
  const dataSebelum: Partial<FormulirPenghapusanPiutangOPDRecord> = {};
  for (const key of Object.keys(updates)) {
    (dataSebelum as Record<string, unknown>)[key] =
      dataLama[key as keyof FormulirPenghapusanPiutangOPDRecord] ?? null;
  }
  // Ikut simpan status & catatan verifikasi BPKAD yang sedang direspon,
  // supaya riwayat tetap punya konteks "revisi ini menjawab catatan apa".
  dataSebelum.status = dataLama.status;
  dataSebelum.catatanVerifikasi = dataLama.catatanVerifikasi;
  dataSebelum.tanggalVerifikasi = dataLama.tanggalVerifikasi;
  dataSebelum.verifikatorId = dataLama.verifikatorId;

  const riwayatRef = doc(collection(pengajuanRef, "riwayatRevisi"));
  const nowIso = new Date().toISOString();
  const riwayat: RiwayatRevisiRecord = {
    id: riwayatRef.id,
    pengajuanId: id,
    revisiKe: (dataLama.jumlahRevisi ?? 0) + 1,
    catatanVerifikasi: dataLama.catatanVerifikasi ?? null,
    dataSebelum,
    diajukanUlangOleh,
    createdAt: nowIso,
  };

  await runTransaction(db, async (tx) => {
    // Baca ulang di dalam transaction (aturan Firestore: semua tx.get()
    // sebelum tx.set/tx.update) supaya aman dari race condition kalau ada
    // perubahan lain di antara getDoc() di atas dan transaction ini.
    const freshSnap = await tx.get(pengajuanRef);
    if (!freshSnap.exists()) {
      throw new Error(`Pengajuan dengan id "${id}" tidak ditemukan.`);
    }

    tx.set(riwayatRef, riwayat);
    tx.update(pengajuanRef, {
      ...updates,
      status: "diajukan",
      catatanVerifikasi: null,
      tanggalVerifikasi: null,
      jumlahRevisi: increment(1),
      updatedAt: nowIso,
    });
  });
}
