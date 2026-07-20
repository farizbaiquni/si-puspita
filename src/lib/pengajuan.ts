import {
  collection,
  doc,
  runTransaction,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { uploadDokumenOrNull } from "./cloudinary";
import type {
  FormulirPenghapusanPiutangOPD,
  FormulirPenghapusanPiutangOPDRecord,
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
