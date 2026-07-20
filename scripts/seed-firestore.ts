/**
 * scripts/seed-firestore.ts
 * ------------------------------------------------------------------
 * Script untuk seed data dummy (MOCK_DATA) ke Firestore collection
 * "pengajuan", supaya dashboard-v2 (BPKAD/OPD) punya data untuk
 * di-preview tanpa perlu submit manual lewat form berkali-kali.
 *
 * ⚠️  CATATAN PENTING soal `id`:
 * Firestore document ID TIDAK BOLEH mengandung karakter "/" (dibaca
 * sebagai pemisah path collection/document). Field `id` di MOCK_DATA
 * sekarang berformat "001/PENGAJUAN/RSUD/01/2025" (pakai "/"), jadi
 * TIDAK BISA dipakai apa adanya sebagai document key. Script ini
 * otomatis meng-convert "/" -> "-" khusus untuk key Firestore, dan
 * field `id` di dalam dokumen ikut disamakan supaya tetap konsisten
 * dengan document key-nya (asumsi yang dipakai kode asli kamu di
 * updatePengajuan()/registrasiPengajuan(): data.id === docRef.id).
 *
 * PERSIAPAN:
 * 1. Ambil Service Account Key:
 *    Firebase Console -> Project Settings -> Service Accounts ->
 *    "Generate new private key" -> simpan sebagai serviceAccountKey.json
 *    di root project. JANGAN commit ke git — tambahkan ke .gitignore!
 *
 * 2. Install dependency (kalau belum ada):
 *      npm install -D firebase-admin tsx
 *
 * 3. Jalankan:
 *      npx tsx scripts/seed-firestore.ts
 *
 *    Opsi tambahan:
 *      npx tsx scripts/seed-firestore.ts --clear
 *        -> hapus semua dokumen lama di collection "pengajuan" dulu
 *           sebelum menulis data dummy (berguna kalau mau re-seed
 *           dari kondisi bersih).
 *
 * CATATAN LAIN:
 * - Semua field dokumen (UploadedFileRef, mis. fileSurat, dokumenDasarPiutang,
 *   dst) di-override `url`-nya jadi satu URL Cloudinary yang sama
 *   (lihat DUMMY_FILE_URL) — supaya tidak menyimpan data:base64 raksasa
 *   hasil generateDummyPdfDataUri() ke Firestore (data:base64 di
 *   dummyData.ts cuma cocok untuk preview langsung di browser, bukan
 *   untuk disimpan sebagai field Firestore).
 * - Script ini pakai firebase-admin (server-side, bypass Security
 *   Rules) karena ini operasi seeding one-off, bukan operasi user
 *   biasa dari browser seperti createPengajuan().
 * - Counter "counters/nomorPengajuan" & "counters/nomorRegistrasi"
 *   ikut di-set supaya pengajuan baru yang dibuat lewat createPengajuan()
 *   / registrasiPengajuan() (yang pakai nomor urut GLOBAL, bukan
 *   per-OPD seperti field `id`) tidak bentrok dengan nomor yang sudah
 *   dipakai data dummy ini.
 * ------------------------------------------------------------------
 */

import {
  initializeApp,
  cert,
  getApps,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Sesuaikan path import ini kalau lokasi dummyData.ts di project kamu beda.
import { MOCK_DATA } from "../src/app/dashboard-v2/contents/dummyData";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  UploadedFileRef,
} from "../src/types/types";

const DUMMY_FILE_URL =
  "https://res.cloudinary.com/ncoljm8y/image/upload/v1784470827/si-puspita/2oq4bZ5oz694wkxbT6bd/buktiTidakMampuKartuKeluargaMiskin.pdf";

const PENGAJUAN_COLLECTION = "pengajuan";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shouldClear = process.argv.includes("--clear");

/* ==================== Inisialisasi Firebase Admin ==================== */

function initFirebaseAdmin() {
  if (getApps().length) return;

  const serviceAccountPath = path.resolve(
    __dirname,
    "../serviceAccountKey.json",
  );

  if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(
      readFileSync(serviceAccountPath, "utf-8"),
    );
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }

  // Fallback: pakai GOOGLE_APPLICATION_CREDENTIALS env var kalau
  // serviceAccountKey.json tidak ditemukan di root project.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ credential: applicationDefault() });
    return;
  }

  throw new Error(
    "Kredensial Firebase Admin tidak ditemukan.\n" +
      "Simpan service account key sebagai 'serviceAccountKey.json' di root project,\n" +
      "atau set environment variable GOOGLE_APPLICATION_CREDENTIALS.",
  );
}

/* ==================== Helper ==================== */

/** Type guard sederhana: cek apakah value ini kemungkinan UploadedFileRef. */
function isUploadedFileRef(value: unknown): value is UploadedFileRef {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    "namaFile" in value &&
    "uploadedAt" in value
  );
}

/**
 * Kembalikan salinan record dengan SEMUA field bertipe UploadedFileRef
 * di-override url-nya jadi DUMMY_FILE_URL (field lain di UploadedFileRef
 * seperti namaFile/ukuranBytes/uploadedAt tetap dipertahankan apa adanya).
 */
function normalizeFileUrls(
  record: FormulirPenghapusanPiutangOPDRecord,
): FormulirPenghapusanPiutangOPDRecord {
  const clone = { ...record } as Record<string, unknown>;

  for (const [key, value] of Object.entries(clone)) {
    if (isUploadedFileRef(value)) {
      clone[key] = { ...value, url: DUMMY_FILE_URL };
    }
  }

  return clone as unknown as FormulirPenghapusanPiutangOPDRecord;
}

/** Ganti "/" -> "-" supaya aman dipakai sebagai Firestore document ID. */
function toSafeDocId(id: string): string {
  return id.replace(/\//g, "-");
}

/* ==================== Seed ==================== */

async function clearCollection(db: FirebaseFirestore.Firestore): Promise<void> {
  console.log(
    `🧹 Menghapus dokumen lama di collection "${PENGAJUAN_COLLECTION}"...`,
  );
  const snapshot = await db.collection(PENGAJUAN_COLLECTION).get();
  if (snapshot.empty) {
    console.log("   (collection sudah kosong)");
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`   ${snapshot.size} dokumen lama dihapus.`);
}

async function seed(): Promise<void> {
  initFirebaseAdmin();
  const db = getFirestore();

  if (shouldClear) {
    await clearCollection(db);
  }

  console.log(`📦 Menyiapkan ${MOCK_DATA.length} dokumen pengajuan...`);

  const batch = db.batch();
  let jumlahTeregistrasi = 0;

  for (const original of MOCK_DATA) {
    const docId = toSafeDocId(original.id);
    const normalized = normalizeFileUrls({ ...original, id: docId });

    if (normalized.status === "teregistrasi") jumlahTeregistrasi += 1;

    const ref = db.collection(PENGAJUAN_COLLECTION).doc(docId);
    batch.set(ref, normalized);
  }

  await batch.commit();
  console.log(
    `✅ Berhasil seed ${MOCK_DATA.length} dokumen ke collection "${PENGAJUAN_COLLECTION}".`,
  );

  // Selaraskan counter Firestore supaya nomorPengajuan/nomorRegistrasi
  // berikutnya (dari createPengajuan()/registrasiPengajuan() di app
  // asli — keduanya pakai counter GLOBAL, bukan per-OPD seperti `id`)
  // tidak bentrok dengan nomor yang sudah dipakai data dummy ini.
  await db
    .doc("counters/nomorPengajuan")
    .set({ urutanTerakhir: MOCK_DATA.length }, { merge: true });
  await db
    .doc("counters/nomorRegistrasi")
    .set({ urutanTerakhir: jumlahTeregistrasi }, { merge: true });

  console.log(
    `✅ Counter disesuaikan — nomorPengajuan: ${MOCK_DATA.length}, nomorRegistrasi: ${jumlahTeregistrasi}.`,
  );
}

seed()
  .then(() => {
    console.log("🎉 Selesai.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Gagal seed data:", err);
    process.exit(1);
  });
