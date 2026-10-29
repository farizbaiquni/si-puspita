"use client";

/* ------------------------------------------------------------------ */
/*  reviu-inspektorat-store.tsx                                        */
/*  Store untuk dokumen tahap Reviu Inspektorat (menu Reviu             */
/*  Inspektorat).                                                      */
/*                                                                     */
/*  Data tersimpan di koleksi TERPISAH dari alur lama:                 */
/*    reviuInspektorat/{pengajuanId}  →  1 pengajuan = 1 reviu         */
/*                                                                     */
/*  Provider sengaja TIDAK dipasang global di layout dashboard —       */
/*  hanya di-mount di dalam menu Reviu Inspektorat (satu-satunya       */
/*  pemakai), supaya halaman lain tidak menambah langganan.            */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ReviuInspektoratRecord } from "@/types/reviu-inspektorat";

const REVIU_COLLECTION = "reviuInspektorat";

/* ==================== Context value ==================== */

interface ReviuInspektoratStoreValue {
  data: ReviuInspektoratRecord[];
  isLoading: boolean;
  error: string | null;

  getReviubyPengajuanId: (
    pengajuanId: string,
  ) => ReviuInspektoratRecord | undefined;
}

const ReviuInspektoratContext =
  createContext<ReviuInspektoratStoreValue | null>(null);

/* ==================== Provider ==================== */

export function ReviuInspektoratProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<ReviuInspektoratRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Subscription real-time ──
  useEffect(() => {
    const q = query(collection(db, REVIU_COLLECTION));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => d.data() as ReviuInspektoratRecord));
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Gagal membaca dokumen reviu inspektorat:", err);
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  // ── Read helper ──
  const getReviubyPengajuanId = useCallback(
    (pengajuanId: string) => data.find((r) => r.pengajuanId === pengajuanId),
    [data],
  );

  const value = useMemo<ReviuInspektoratStoreValue>(
    () => ({ data, isLoading, error, getReviubyPengajuanId }),
    [data, isLoading, error, getReviubyPengajuanId],
  );

  return (
    <ReviuInspektoratContext.Provider value={value}>
      {children}
    </ReviuInspektoratContext.Provider>
  );
}

/* ==================== Hook ==================== */

export function useReviuInspektoratStore(): ReviuInspektoratStoreValue {
  const ctx = useContext(ReviuInspektoratContext);
  if (!ctx) {
    throw new Error(
      "useReviuInspektoratStore() harus dipanggil di dalam <ReviuInspektoratProvider> (dipasang di ReviuInspektoratAdmin).",
    );
  }
  return ctx;
}
