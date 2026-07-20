"use client";

/* ------------------------------------------------------------------ */
/*  pengajuan-store.tsx                                                */
/*  Sumber data tunggal untuk seluruh pengajuan penghapusan piutang.   */
/*  Dipasang sekali di root layout supaya homepage (ModalLacak) dan     */
/*  dashboard-v2 (BPKAD/OPD) sama-sama baca & tulis dari data yang      */
/*  sama — sekarang dari Firestore collection "pengajuan", bukan lagi   */
/*  MOCK_DATA in-memory.                                                */
/*                                                                      */
/*  Migrasi dari versi in-memory (useSyncExternalStore + MOCK_DATA):    */
/*  - Sinkronisasi antar komponen sekarang otomatis dari onSnapshot      */
/*    Firestore, bukan dari listener manual — jadi tidak butuh          */
/*    useSyncExternalStore lagi, cukup useState + useEffect biasa.      */
/*  - tambahPengajuan/updatePengajuan/registrasiPengajuan sekarang       */
/*    async (baca/tulis Firestore sungguhan), bukan langsung sinkron.   */
/*  - Komponen pemakai (LihatDaftarPengajuan, dll) TIDAK perlu berubah   */
/*    signature pemanggilannya — interface context tetap sama,          */
/*    cuma implementasinya yang pindah ke Firestore.                    */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FormulirPenghapusanPiutangOPDRecord } from "@/types/types";

type Data = FormulirPenghapusanPiutangOPDRecord[];

const PENGAJUAN_COLLECTION = "pengajuan";

/**
 * Format nomor registrasi resmi: XXX/REG-PUSPITA/DISDAGKOPUKM/MM/YYYY
 * Contoh: 015/REG-PUSPITA/DISDAGKOPUKM/07/2026
 */
function formatNomorRegistrasi(
  urutan: number,
  tanggal: Date = new Date(),
): string {
  const xxx = String(urutan).padStart(3, "0");
  const mm = String(tanggal.getMonth() + 1).padStart(2, "0");
  const yyyy = tanggal.getFullYear();
  return `${xxx}/REG-PUSPITA/DISDAGKOPUKM/${mm}/${yyyy}`;
}

interface PengajuanStoreValue {
  /** Daftar seluruh pengajuan, ter-update otomatis real-time dari Firestore. */
  data: Data;
  /** True selama snapshot pertama belum diterima dari Firestore. */
  isLoading: boolean;
  /** Pesan error kalau listener/operasi Firestore gagal (mis. rules menolak). */
  error: string | null;
  /**
   * Untuk pemanggil lama yang sudah punya
   * FormulirPenghapusanPiutangOPDRecord jadi (bukan lewat form wizard) —
   * mis. ModalPengajuan di homepage. Menulis langsung ke Firestore;
   * AjukanPermohonan.tsx sendiri sekarang pakai createPengajuan()
   * (lib/pengajuan.ts) yang juga meng-upload dokumen ke Cloudinary,
   * jadi TIDAK memanggil fungsi ini.
   */
  tambahPengajuan: (
    record: FormulirPenghapusanPiutangOPDRecord,
  ) => Promise<void>;
  /** Dipanggil BPKAD saat verifikasi (ubah status, checklist, catatan, dll). */
  updatePengajuan: (
    id: string,
    updates: Partial<FormulirPenghapusanPiutangOPDRecord>,
  ) => Promise<void>;
  getPengajuanById: (
    id: string,
  ) => FormulirPenghapusanPiutangOPDRecord | undefined;
  /**
   * Dipanggil BPKAD saat klik "Registrasi": generate nomorRegistrasi via
   * Firestore transaction (aman dari race condition dua klik bersamaan)
   * dan set status jadi "teregistrasi". Mengembalikan nomor registrasi baru.
   *
   * ⚠️ Butuh Security Rules collection "counters" diizinkan tulis untuk
   * dipanggil dari client (rules sekarang menolak semua akses ke
   * "counters" — lihat firestore.rules). Sampai itu diperbarui, panggilan
   * ini akan gagal dengan permission-denied.
   */
  registrasiPengajuan: (
    id: string,
    extra?: Partial<
      Pick<
        FormulirPenghapusanPiutangOPDRecord,
        "verifikatorId" | "catatanVerifikasi" | "checklistSubstantif"
      >
    >,
  ) => Promise<string>;
}

const PengajuanContext = createContext<PengajuanStoreValue | null>(null);

export function PengajuanProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // orderBy("createdAt", "desc") -> pengajuan terbaru tampil paling atas,
    // menggantikan perilaku lama "[record, ...data]" saat tambahPengajuan.
    const q = query(
      collection(db, PENGAJUAN_COLLECTION),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(
          snapshot.docs.map(
            (docSnap) => docSnap.data() as FormulirPenghapusanPiutangOPDRecord,
          ),
        );
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Gagal membaca data pengajuan:", err);
        setError(err.message);
        setIsLoading(false);
      },
    );

    // Berhenti langganan saat provider unmount — mencegah memory leak.
    return unsubscribe;
  }, []);

  const tambahPengajuan = async (
    record: FormulirPenghapusanPiutangOPDRecord,
  ) => {
    await setDoc(doc(db, PENGAJUAN_COLLECTION, record.id), record);
    // Tidak perlu setData manual — onSnapshot di atas otomatis menangkap
    // dokumen baru ini dan me-render ulang semua komponen yang subscribe.
  };

  const updatePengajuan = async (
    id: string,
    updates: Partial<FormulirPenghapusanPiutangOPDRecord>,
  ) => {
    await updateDoc(doc(db, PENGAJUAN_COLLECTION, id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const getPengajuanById = (id: string) => data.find((d) => d.id === id);

  const registrasiPengajuan = async (
    id: string,
    extra?: Partial<
      Pick<
        FormulirPenghapusanPiutangOPDRecord,
        "verifikatorId" | "catatanVerifikasi" | "checklistSubstantif"
      >
    >,
  ) => {
    const counterRef = doc(db, "counters", "nomorRegistrasi");
    const pengajuanRef = doc(db, PENGAJUAN_COLLECTION, id);

    return runTransaction(db, async (tx) => {
      const counterSnap = await tx.get(counterRef);
      const urutan = (counterSnap.data()?.urutanTerakhir ?? 0) + 1;
      const sekarang = new Date();
      const nomorRegistrasi = formatNomorRegistrasi(urutan, sekarang);

      tx.set(counterRef, { urutanTerakhir: urutan }, { merge: true });
      tx.update(pengajuanRef, {
        ...extra,
        status: "teregistrasi",
        nomorRegistrasi,
        tanggalVerifikasi: sekarang.toISOString(),
        updatedAt: sekarang.toISOString(),
      });

      return nomorRegistrasi;
    });
  };

  const value = useMemo<PengajuanStoreValue>(
    () => ({
      data,
      isLoading,
      error,
      tambahPengajuan,
      updatePengajuan,
      getPengajuanById,
      registrasiPengajuan,
    }),
    [data, isLoading, error],
  );

  return (
    <PengajuanContext.Provider value={value}>
      {children}
    </PengajuanContext.Provider>
  );
}

export function usePengajuanStore() {
  const ctx = useContext(PengajuanContext);
  if (!ctx) {
    throw new Error(
      "usePengajuanStore() harus dipanggil di dalam <PengajuanProvider> (sudah dipasang di src/app/layout.tsx).",
    );
  }
  return ctx;
}
