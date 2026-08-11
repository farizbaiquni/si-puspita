"use client";

/* ------------------------------------------------------------------ */
/*  notifikasi-store.tsx                                               */
/*  Notifikasi hasil verifikasi Admin, ditujukan ke OPD pemilik         */
/*  pengajuan. Beda dari pengajuan-store.tsx (Context, data global      */
/*  lintas semua OPD): notifikasi di sini SPESIFIK per akun yang login, */
/*  jadi cukup custom hook biasa (useNotifikasiOPD) yang dipasang       */
/*  langsung di Header — tidak perlu Provider di root layout.           */
/*                                                                      */
/*  Alur:                                                               */
/*  1. Admin ubah status pengajuan (VerifikasiPengajuan -> page.tsx     */
/*     handleStatusUpdate) -> panggil kirimNotifikasiVerifikasi().      */
/*  2. Dokumen baru masuk ke collection "notifikasiOPD".                */
/*  3. OPD terkait (yang sedang login / online) otomatis menerima       */
/*     update lewat onSnapshot di useNotifikasiOPD -> muncul di ikon    */
/*     lonceng Header, tanpa perlu refresh.                             */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  NotifikasiOPD,
  StatusFormulir,
} from "@/types/types";

const NOTIFIKASI_COLLECTION = "notifikasiOPD";

/**
 * Susun judul + isi pesan notifikasi berdasarkan status hasil verifikasi.
 * Dipisah dari kirimNotifikasiVerifikasi supaya gampang ditambah status
 * baru nanti tanpa mengubah logic pengiriman.
 */
function buatPesanVerifikasi(
  status: StatusFormulir,
  nomorPengajuan: string,
  catatan?: string,
): { judul: string; pesan: string } {
  if (status === "teregistrasi") {
    return {
      judul: "Pengajuan Anda telah teregistrasi",
      pesan: `Pengajuan ${nomorPengajuan} telah lolos verifikasi dan resmi teregistrasi.`,
    };
  }
  if (status === "revisi") {
    return {
      judul: "Pengajuan Anda perlu direvisi",
      pesan: catatan
        ? `Pengajuan ${nomorPengajuan} dikembalikan untuk revisi. Catatan verifikator: ${catatan}`
        : `Pengajuan ${nomorPengajuan} dikembalikan untuk revisi.`,
    };
  }
  return {
    judul: "Status pengajuan Anda diperbarui",
    pesan: `Pengajuan ${nomorPengajuan} sekarang berstatus "${status}".`,
  };
}

/**
 * Dipanggil dari sisi Admin setiap kali status sebuah pengajuan berubah
 * lewat proses verifikasi (lihat handleStatusUpdate di page.tsx). Cukup
 * kirim id/opdId/nomorPengajuan dari record yang sudah ada di store —
 * TIDAK perlu baca ulang dari Firestore.
 */
export async function kirimNotifikasiVerifikasi(
  pengajuan: Pick<
    FormulirPenghapusanPiutangOPDRecord,
    "id" | "opdId" | "nomorPengajuan"
  >,
  statusBaru: StatusFormulir,
  catatan?: string,
): Promise<void> {
  const { judul, pesan } = buatPesanVerifikasi(
    statusBaru,
    pengajuan.nomorPengajuan,
    catatan,
  );

  const notifikasiBaru: Omit<NotifikasiOPD, "id"> = {
    opdId: pengajuan.opdId,
    pengajuanId: pengajuan.id,
    nomorPengajuan: pengajuan.nomorPengajuan,
    status: statusBaru,
    judul,
    pesan,
    dibaca: false,
    createdAt: new Date().toISOString(),
  };

  await addDoc(collection(db, NOTIFIKASI_COLLECTION), notifikasiBaru);
}

interface UseNotifikasiOPDResult {
  data: NotifikasiOPD[];
  unreadCount: number;
  isLoading: boolean;
  tandaiDibaca: (id: string) => Promise<void>;
  tandaiSemuaDibaca: () => Promise<void>;
}

/**
 * Hook sisi OPD: subscribe real-time ke notifikasi milik OPD yang sedang
 * login. `opdId` diturunkan dari opdSlug sesi login (lihat page.tsx —
 * getOpdBySlug(user.opdSlug)?.id), SAMA dengan opdId yang tersimpan di
 * FormulirPenghapusanPiutangOPDRecord, supaya query where() cocok.
 *
 * opdId undefined (mis. Admin, atau OPD belum diketahui) -> tidak
 * subscribe apa pun; data/isLoading yang dikembalikan diturunkan
 * langsung dari opdId (lihat effectiveData/effectiveIsLoading di
 * bawah), BUKAN dengan mereset state lewat setState di effect —
 * memanggil setState secara sinkron di badan effect (di luar callback
 * onSnapshot) memicu peringatan React "cascading renders".
 */
export function useNotifikasiOPD(
  opdId: string | undefined,
): UseNotifikasiOPDResult {
  const [data, setData] = useState<NotifikasiOPD[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tanpa opdId, tidak ada yang perlu di-subscribe. State internal
    // (data/isLoading) sengaja TIDAK direset di sini — nilai yang
    // dikembalikan hook ini sudah diturunkan dari opdId langsung
    // (effectiveData/effectiveIsLoading), jadi state lama tidak pernah
    // ikut ter-render walau tidak direset.
    if (!opdId) return;

    const q = query(
      collection(db, NOTIFIKASI_COLLECTION),
      where("opdId", "==", opdId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(
          snapshot.docs.map(
            (docSnap) =>
              ({ id: docSnap.id, ...docSnap.data() }) as NotifikasiOPD,
          ),
        );
        setIsLoading(false);
      },
      (err) => {
        console.error("Gagal membaca notifikasi OPD:", err);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [opdId]);

  // Turunkan nilai akhir dari opdId, bukan dari reset state di effect —
  // supaya tidak ada sisa data OPD lain yang sempat ter-render saat
  // opdId belum/tidak ada.
  const effectiveData = opdId ? data : [];
  const effectiveIsLoading = opdId ? isLoading : false;

  const tandaiDibaca = async (id: string) => {
    await updateDoc(doc(db, NOTIFIKASI_COLLECTION, id), { dibaca: true });
    // Tidak perlu setData manual — onSnapshot di atas otomatis menangkap
    // perubahan ini dan me-render ulang.
  };

  const tandaiSemuaDibaca = async () => {
    const belumDibaca = effectiveData.filter((n) => !n.dibaca);
    if (belumDibaca.length === 0) return;
    const batch = writeBatch(db);
    belumDibaca.forEach((n) =>
      batch.update(doc(db, NOTIFIKASI_COLLECTION, n.id), { dibaca: true }),
    );
    await batch.commit();
  };

  const unreadCount = effectiveData.filter((n) => !n.dibaca).length;

  return {
    data: effectiveData,
    unreadCount,
    isLoading: effectiveIsLoading,
    tandaiDibaca,
    tandaiSemuaDibaca,
  };
}
