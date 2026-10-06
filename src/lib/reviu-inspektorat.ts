/* ------------------------------------------------------------------ */
/*  reviu-inspektorat.ts (lib)                                         */
/*  Fungsi aksi untuk modul Reviu Inspektorat.                         */
/*                                                                      */
/*  Dipisah dari store karena:                                         */
/*   - Hanya ada 1 aksi (ajukanReviuInspektorat) — tidak perlu Provider. */
/*   - Fungsi ini dipanggil dari tombol admin, bukan dari subscription. */
/* ------------------------------------------------------------------ */

import { addDoc, collection, doc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

const PENGAJUAN_COLLECTION = "pengajuan";
const REVIU_COLLECTION = "reviuInspektorat";
const NOTIFIKASI_OPD_COLLECTION = "notifikasiOPD";

/** Data minimal pengajuan yang dibutuhkan untuk mengajukan reviu. */
export interface PengajuanRingkasReviu {
  id: string;
  opdId: string;
  nomorPengajuan: string;
  nomorRegistrasi: string | null;
  namaOPD: string;
}

/**
 * Ajukan pengajuan ke tahap Reviu Inspektorat.
 *
 * Dilakukan dalam 1 Firestore transaction:
 *  1. Cek `reviuInspektorat/{pengajuanId}` belum ada (tolak kalau duplikat).
 *  2. Update `pengajuan/{id}` → `reviuInspektoratStatus = "MENUNGGU_REVIU"`.
 *  3. Set `reviuInspektorat/{id}` → dokumen baru.
 *
 * Setelah commit, kirim notifikasi ke OPD.
 *
 * @throws Error kalau pengajuan sudah pernah diajukan reviu.
 */
export async function ajukanReviuInspektorat(
  pengajuan: PengajuanRingkasReviu,
  adminUsername: string,
): Promise<void> {
  const pengajuanRef = doc(db, PENGAJUAN_COLLECTION, pengajuan.id);
  const reviuRef = doc(db, REVIU_COLLECTION, pengajuan.id);
  const nowIso = new Date().toISOString();

  // ── Transaction: cek duplikat + tulis pengajuan + tulis reviu ──
  await runTransaction(db, async (tx) => {
    // 1. Baca reviu existing (doc ID deterministic = pengajuanId)
    const existing = await tx.get(reviuRef);
    if (existing.exists()) {
      throw new Error(
        "Pengajuan ini sudah pernah diajukan Reviu Inspektorat — satu pengajuan hanya boleh satu siklus reviu.",
      );
    }

    // 2. Update flag di pengajuan (status utama tetap "teregistrasi")
    tx.update(pengajuanRef, {
      reviuInspektoratStatus: "MENUNGGU_REVIU",
      updatedAt: nowIso,
    });

    // 3. Buat dokumen reviu
    tx.set(reviuRef, {
      id: pengajuan.id,
      pengajuanId: pengajuan.id,
      diajukanOleh: adminUsername,
      diajukanPada: nowIso,
      status: "MENUNGGU_REVIU",
    });
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
