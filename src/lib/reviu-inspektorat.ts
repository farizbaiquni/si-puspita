/* ------------------------------------------------------------------ */
/*  reviu-inspektorat.ts (lib)                                         */
/*  Fungsi aksi untuk modul Reviu Inspektorat.                         */
/*                                                                      */
/*  Dipisah dari store karena:                                         */
/*   - Hanya berisi aksi (bukan subscription) — tidak perlu Provider.  */
/*   - Fungsi-fungsi ini dipanggil dari tombol admin, bukan dari       */
/*     subscription real-time.                                         */
/*                                                                      */
/*  Aksi tersedia:                                                     */
/*   - simpanSuratPengantarInspektorat : simpan draft surat pengantar  */
/*                              langsung dari halaman detail            */
/*   - hapusSuratPengantarInspektorat  : hapus draft surat pengantar    */
/*   - ajukanReviuInspektorat : pindahkan draft surat pengantar ke      */
/*                              `reviuInspektorat` + ubah status         */
/*                              pengajuan (BA wajib sudah tersimpan)    */
/*   - simpanBeritaAcaraData  : simpan isian Berita Acara ke koleksi   */
/*                              terpisah `beritaAcara`                 */
/* ------------------------------------------------------------------ */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import type { BadgeConfig, UploadedFileRef } from "@/types/types";
import type {
  BeritaAcaraData,
  BeritaAcaraRecord,
} from "@/app/dashboard-v2/contents/reviu-inspektorat/berita-acara/types";
import type {
  ReviuInspektoratRecord,
  SuratPengantarInspektoratRecord,
} from "@/types/reviu-inspektorat";

const PENGAJUAN_COLLECTION = "pengajuan";
const REVIU_COLLECTION = "reviuInspektorat";
const SURAT_PENGANTAR_COLLECTION = "suratPengantarInspektorat";
const NOTIFIKASI_OPD_COLLECTION = "notifikasiOPD";
const BERITA_ACARA_COLLECTION = "beritaAcara";

/** Data minimal pengajuan yang dibutuhkan untuk mengajukan reviu. */
export interface PengajuanRingkasReviu {
  id: string;
  opdId: string;
  nomorPengajuan: string;
  nomorRegistrasi: string | null;
  namaOPD: string;
}

/* ==================== Surat Pengantar (draft) ==================== */

/**
 * Simpan / ganti draft Surat Pengantar ke Inspektorat.
 *
 * File sudah di-upload ke Cloudinary oleh pemanggil; fungsi ini hanya
 * menyimpan referensinya supaya unggahan tetap ada saat halaman
 * di-refresh. Draft TIDAK mengubah status pengajuan — status baru
 * berubah ketika `ajukanReviuInspektorat()` dipanggil.
 */
export async function simpanSuratPengantarInspektorat(
  pengajuanId: string,
  suratPengantar: UploadedFileRef,
  adminUsername: string,
): Promise<void> {
  const ref = doc(db, SURAT_PENGANTAR_COLLECTION, pengajuanId);
  const nowIso = new Date().toISOString();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const sebelum = snap.exists()
      ? (snap.data() as SuratPengantarInspektoratRecord)
      : null;

    const payload: SuratPengantarInspektoratRecord = {
      id: pengajuanId,
      pengajuanId,
      suratPengantar,
      diunggahOleh: sebelum?.diunggahOleh || adminUsername,
      diunggahPada: sebelum?.diunggahPada || nowIso,
      diperbaruiPada: nowIso,
    };

    tx.set(ref, payload);
  });
}

/** Hapus draft surat pengantar (mis. admin mengganti/membatalkan unggahan). */
export async function hapusSuratPengantarInspektorat(
  pengajuanId: string,
): Promise<void> {
  await deleteDoc(doc(db, SURAT_PENGANTAR_COLLECTION, pengajuanId));
}

/**
 * Ajukan pengajuan ke tahap Reviu Inspektorat.
 *
 * Surat pengantar TIDAK lagi di-upload di sini — admin mengunggahnya
 * lebih dulu dari halaman detail, lalu referensinya tersimpan sebagai
 * draft di `suratPengantarInspektorat/{pengajuanId}`.
 *
 * Dilakukan dalam 1 Firestore transaction:
 *  1. Cek `reviuInspektorat/{pengajuanId}` belum ada (tolak kalau duplikat).
 *  2. Cek `beritaAcara/{pengajuanId}` sudah ada (BA wajib dibuat dulu).
 *  3. Cek draft `suratPengantarInspektorat/{pengajuanId}` ada & valid.
 *  4. Update `pengajuan/{id}` → `reviuInspektoratStatus = "MENUNGGU_REVIU"`.
 *  5. Buat `reviuInspektorat/{id}` dengan referensi surat pengantar draft.
 *  6. Hapus draft surat pengantar.
 *
 * Semua langkah 4–6 commit bersama — kalau salah satu gagal, tidak ada
 * perubahan status, dokumen reviu, maupun draft yang hilang.
 *
 * Setelah commit, kirim notifikasi ke OPD.
 *
 * @throws Error kalau BA/surat pengantar belum ada atau sudah pernah direviu.
 */
export async function ajukanReviuInspektorat(
  pengajuan: PengajuanRingkasReviu,
  adminUsername: string,
): Promise<void> {
  const pengajuanRef = doc(db, PENGAJUAN_COLLECTION, pengajuan.id);
  const reviuRef = doc(db, REVIU_COLLECTION, pengajuan.id);
  const baRef = doc(db, BERITA_ACARA_COLLECTION, pengajuan.id);
  const suratRef = doc(db, SURAT_PENGANTAR_COLLECTION, pengajuan.id);
  const nowIso = new Date().toISOString();

  // ── Transaction: cek prasyarat + tulis pengajuan + reviu + hapus draft ──
  await runTransaction(db, async (tx) => {
    // 1. Baca reviu existing (doc ID deterministic = pengajuanId)
    const existing = await tx.get(reviuRef);
    if (existing.exists()) {
      throw new Error(
        "Pengajuan ini sudah pernah diajukan Reviu Inspektorat — satu pengajuan hanya boleh satu siklus reviu.",
      );
    }

    // 2. Berita Acara wajib sudah dibuat & disimpan.
    const ba = await tx.get(baRef);
    if (!ba.exists()) {
      throw new Error(
        "Berita Acara wajib dibuat dan disimpan terlebih dahulu sebelum mengajukan Reviu Inspektorat.",
      );
    }

    // 3. Surat pengantar wajib sudah diunggah dari halaman detail.
    const surat = await tx.get(suratRef);
    if (!surat.exists()) {
      throw new Error(
        "Surat Pengantar ke Inspektorat wajib diunggah terlebih dahulu sebelum mengajukan Reviu Inspektorat.",
      );
    }
    const draft = surat.data() as SuratPengantarInspektoratRecord;
    if (!draft.suratPengantar?.url) {
      throw new Error(
        "Data Surat Pengantar tidak valid — silakan unggah ulang surat pengantar.",
      );
    }

    // 4. Update flag di pengajuan (status utama tetap "teregistrasi")
    tx.update(pengajuanRef, {
      reviuInspektoratStatus: "MENUNGGU_REVIU",
      updatedAt: nowIso,
    });

    // 5. Buat dokumen reviu (+ referensi surat pengantar dari draft)
    const reviu: ReviuInspektoratRecord = {
      id: pengajuan.id,
      pengajuanId: pengajuan.id,
      diajukanOleh: adminUsername,
      diajukanPada: nowIso,
      status: "MENUNGGU_REVIU",
      suratPengantar: draft.suratPengantar,
    };
    tx.set(reviuRef, reviu);

    // 6. Draft sudah dipindahkan ke dokumen reviu — hapus.
    tx.delete(suratRef);
  });

  // ── Kirim notifikasi ke OPD (setelah transaction commit) ──
  // `status` di notifikasi tetap "teregistrasi" karena `pengajuan.status`
  // memang tidak berubah — field `status` di notifikasi hanya dipakai
  // untuk warna aksen di dropdown; yang berubah adalah judul & pesan.
  const notifRef = collection(db, NOTIFIKASI_OPD_COLLECTION);
  await addDoc(notifRef, {
    opdId: pengajuan.opdId,
    pengajuanId: pengajuan.id,
    nomorPengajuan: pengajuan.nomorPengajuan,
    status: "teregistrasi",
    judul: "Pengajuan masuk tahap Reviu Inspektorat",
    pesan: `Pengajuan ${
      pengajuan.nomorRegistrasi ?? pengajuan.nomorPengajuan
    } dari ${pengajuan.namaOPD} kini berstatus "Menunggu Reviu Inspektorat". Proses reviu dilakukan oleh Inspektorat di luar sistem.`,
    dibaca: false,
    createdAt: nowIso,
  });
}

/* ==================== Berita Acara ==================== */

/**
 * Simpan isian Berita Acara ke koleksi TERPISAH
 * (`beritaAcara/{pengajuanId}`).
 *
 * Koleksi ini sengaja tidak menempel di dokumen `pengajuan` maupun
 * `telaahInternal` supaya alur lama TIDAK ikut berubah saat BA
 * disimpan/diubah (dokumen pengajuan sama sekali tidak disentuh).
 *
 * Satu pengajuan = satu BA (doc ID deterministik = pengajuanId).
 * Metadata `dibuatPada`/`dibuatOleh` hanya diisi saat penyimpanan
 * pertama; `diperbaruiPada` selalu ikut berubah.
 */
export async function simpanBeritaAcaraData(
  pengajuanId: string,
  data: BeritaAcaraData,
  adminUsername: string,
): Promise<void> {
  const baRef = doc(db, BERITA_ACARA_COLLECTION, pengajuanId);
  const nowIso = new Date().toISOString();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(baRef);
    const sebelum = snap.exists() ? (snap.data() as BeritaAcaraRecord) : null;

    const payload: BeritaAcaraRecord = {
      ...data,
      id: pengajuanId,
      pengajuanId,
      dibuatPada: sebelum?.dibuatPada || nowIso,
      diperbaruiPada: nowIso,
      dibuatOleh: sebelum?.dibuatOleh || adminUsername,
    };

    // set() = create kalau belum ada, replace kalau sudah ada.
    tx.set(baRef, payload);
  });
}
