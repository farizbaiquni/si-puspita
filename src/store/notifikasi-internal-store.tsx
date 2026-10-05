"use client";

/* ------------------------------------------------------------------ */
/*  notifikasi-internal-store.tsx                                      */
/*  Notifikasi untuk user internal struktural BPKAD (Kasubbid/Kabid/   */
/*  Sekban) dan Admin.                                                  */
/*                                                                      */
/*  Pola SAMA PERSIS dengan notifikasi-store.tsx (useNotifikasiOPD):   */
/*  - Custom hook (bukan Context/Provider) — data spesifik per user,   */
/*    dipasang langsung di Header tempat notif ditampilkan.            */
/*  - Real-time via onSnapshot Firestore.                               */
/*  - `opdId` diganti `username` sebagai filter (`targetUsername`).    */
/*                                                                      */
/*  Koleksi TERPISAH dari `notifikasiOPD` supaya skema masing-masing   */
/*  bisa berkembang independen (mis. field targetLevel hanya relevan   */
/*  untuk notifikasi internal).                                        */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import {
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
import type { NotifikasiInternalRecord } from "@/types/telaah-internal";

const NOTIFIKASI_INTERNAL_COLLECTION = "notifikasiInternal";

/* ==================== Hook ==================== */

interface UseNotifikasiInternalResult {
  /** Semua notifikasi untuk username yang sedang login. */
  data: NotifikasiInternalRecord[];
  /** Jumlah notifikasi yang belum dibaca (untuk badge di bell). */
  unreadCount: number;
  /** True selama snapshot pertama belum diterima. */
  isLoading: boolean;
  /** Tandai satu notifikasi sebagai sudah dibaca. */
  tandaiDibaca: (id: string) => Promise<void>;
  /** Tandai SEMUA notifikasi milik user ini sebagai sudah dibaca. */
  tandaiSemuaDibaca: () => Promise<void>;
}

/**
 * Hook sisi user (internal struktural + admin): subscribe real-time ke
 * notifikasi yang targetnya `username` tertentu.
 *
 * `username` diambil dari sesi login (useAuth().user.username). Untuk
 * user yang bukan target notifikasi internal (mis. OPD), pemanggil
 * sebaiknya passing `undefined` → hook tidak subscribe apa pun.
 *
 * Pola sama dengan useNotifikasiOPD: nilai yang dikembalikan diturunkan
 * dari `username` (effectiveData/effectiveIsLoading), BUKAN dengan
 * mereset state lewat setState di dalam effect — itu memicu peringatan
 * React "cascading renders".
 */
export function useNotifikasiInternal(
  username: string | undefined,
): UseNotifikasiInternalResult {
  const [data, setData] = useState<NotifikasiInternalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tanpa username, tidak ada yang perlu di-subscribe.
    // State internal (data/isLoading) sengaja TIDAK direset di sini —
    // nilai yang dikembalikan hook ini sudah diturunkan dari `username`
    // langsung (effectiveData/effectiveIsLoading), jadi state lama
    // tidak pernah ikut ter-render walau tidak direset.
    if (!username) return;

    const q = query(
      collection(db, NOTIFIKASI_INTERNAL_COLLECTION),
      where("targetUsername", "==", username),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(
          snapshot.docs.map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...docSnap.data(),
              }) as NotifikasiInternalRecord,
          ),
        );
        setIsLoading(false);
      },
      (err) => {
        console.error("Gagal membaca notifikasi internal:", err);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [username]);

  // Turunkan nilai akhir dari `username`, bukan dari reset state di
  // effect — supaya tidak ada sisa data user lain yang sempat ter-render
  // saat username belum/tidak ada.
  const effectiveData = username ? data : [];
  const effectiveIsLoading = username ? isLoading : false;

  const tandaiDibaca = async (id: string) => {
    await updateDoc(doc(db, NOTIFIKASI_INTERNAL_COLLECTION, id), {
      dibaca: true,
    });
    // Tidak perlu setData manual — onSnapshot di atas otomatis menangkap
    // perubahan ini dan me-render ulang.
  };

  const tandaiSemuaDibaca = async () => {
    const belumDibaca = effectiveData.filter((n) => !n.dibaca);
    if (belumDibaca.length === 0) return;
    const batch = writeBatch(db);
    belumDibaca.forEach((n) =>
      batch.update(doc(db, NOTIFIKASI_INTERNAL_COLLECTION, n.id), {
        dibaca: true,
      }),
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
