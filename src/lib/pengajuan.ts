import {
  collection,
  doc,
  getDoc,
  increment,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
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

/* ==================== Nomor Pengajuan ==================== */

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

/* ==================== Field dokumen (untuk upload otomatis) ====== */

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

/* ==================== createPengajuan ==================== */

export async function createPengajuan(
  form: FormulirPenghapusanPiutangOPD,
  createdBy: string,
): Promise<{ id: string; nomorPengajuan: string }> {
  const pengajuanRef = doc(collection(db, PENGAJUAN_COLLECTION));
  const pengajuanId = pengajuanRef.id;
  const now = Timestamp.now().toDate();
  const nowIso = now.toISOString();

  const opd = getOpdByNama(form.namaOPD);
  const kodeOpd = (opd?.slug ?? form.namaOPD).toUpperCase();

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

/* ==================== Ajukan Ulang (revisi verifikasi BPKAD) ====== */

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

export async function ajukanUlangPengajuan(
  id: string,
  fieldBaru: Partial<
    Pick<FormulirPenghapusanPiutangOPDRecord, FieldBisaDirevisi>
  >,
  fileBaru: Partial<Record<(typeof FIELD_DOKUMEN)[number], File | null>>,
  diajukanUlangOleh: string,
): Promise<void> {
  const pengajuanRef = doc(db, PENGAJUAN_COLLECTION, id);

  const snapshotAwal = await getDoc(pengajuanRef);
  if (!snapshotAwal.exists()) {
    throw new Error(`Pengajuan dengan id "${id}" tidak ditemukan.`);
  }
  const dataLama = snapshotAwal.data() as FormulirPenghapusanPiutangOPDRecord;

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

  const dataSebelum: Partial<FormulirPenghapusanPiutangOPDRecord> = {};
  for (const key of Object.keys(updates)) {
    (dataSebelum as Record<string, unknown>)[key] =
      dataLama[key as keyof FormulirPenghapusanPiutangOPDRecord] ?? null;
  }
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

/* ==================== Simpan Perbaikan Revisi Telaah Internal ==== */

/**
 * Simpan perbaikan OPD untuk revisi TELAAH INTERNAL (BEDA dari
 * ajukanUlangPengajuan yang untuk revisi verifikasi BPKAD):
 *  - Status pengajuan TETAP "teregistrasi"
 *  - jumlahRevisi TIDAK dinaikkan
 *  - TIDAK menulis ke subcollection riwayatRevisi
 *  - revisiTelaahInternal di-null-kan
 *
 * Riwayat telaah internal tetap utuh — siklus baru dimulai oleh Admin
 * lewat "Ajukan Telaah Ulang" (lihat ajukanTelaahUlang di store).
 */
export async function simpanPerbaikanRevisiTelaah(
  id: string,
  fieldBaru: Partial<
    Pick<FormulirPenghapusanPiutangOPDRecord, FieldBisaDirevisi>
  >,
  fileBaru: Partial<Record<(typeof FIELD_DOKUMEN)[number], File | null>>,
): Promise<void> {
  const pengajuanRef = doc(db, PENGAJUAN_COLLECTION, id);

  const snapshotAwal = await getDoc(pengajuanRef);
  if (!snapshotAwal.exists()) {
    throw new Error(`Pengajuan dengan id "${id}" tidak ditemukan.`);
  }

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

  const refDokumenDihapus = Object.fromEntries(
    Object.entries(fileBaru)
      .filter(([, v]) => v === null)
      .map(([field]) => [field, null]),
  ) as Partial<Record<(typeof FIELD_DOKUMEN)[number], null>>;

  const updates: Record<string, unknown> = {
    ...fieldBaru,
    ...refDokumenBaru,
    ...refDokumenDihapus,
    revisiTelaahInternal: null,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(pengajuanRef, updates);
}
