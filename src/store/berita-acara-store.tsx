"use client";

/* ------------------------------------------------------------------ */
/*  berita-acara-store.tsx                                             */
/*  Store untuk Berita Acara Penelaahan Internal (menu Reviu           */
/*  Inspektorat).                                                      */
/*                                                                     */
/*  Data tersimpan di koleksi TERPISAH dari alur lama:                 */
/*    beritaAcara/{pengajuanId}  →  1 pengajuan = 1 BA                 */
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
import type { BeritaAcaraRecord } from "@/app/dashboard-v2/contents/reviu-inspektorat/berita-acara/types";

const BERITA_ACARA_COLLECTION = "beritaAcara";

/* ==================== Context value ==================== */

interface BeritaAcaraStoreValue {
  data: BeritaAcaraRecord[];
  isLoading: boolean;
  error: string | null;

  getBAbyPengajuanId: (pengajuanId: string) => BeritaAcaraRecord | undefined;
}

const BeritaAcaraContext = createContext<BeritaAcaraStoreValue | null>(null);

/* ==================== Provider ==================== */

export function BeritaAcaraProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BeritaAcaraRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Subscription real-time ──
  useEffect(() => {
    const q = query(collection(db, BERITA_ACARA_COLLECTION));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => d.data() as BeritaAcaraRecord));
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Gagal membaca berita acara:", err);
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  // ── Read helper ──
  const getBAbyPengajuanId = useCallback(
    (pengajuanId: string) => data.find((b) => b.pengajuanId === pengajuanId),
    [data],
  );

  const value = useMemo<BeritaAcaraStoreValue>(
    () => ({ data, isLoading, error, getBAbyPengajuanId }),
    [data, isLoading, error, getBAbyPengajuanId],
  );

  return (
    <BeritaAcaraContext.Provider value={value}>
      {children}
    </BeritaAcaraContext.Provider>
  );
}

/* ==================== Hook ==================== */

export function useBeritaAcaraStore(): BeritaAcaraStoreValue {
  const ctx = useContext(BeritaAcaraContext);
  if (!ctx) {
    throw new Error(
      "useBeritaAcaraStore() harus dipanggil di dalam <BeritaAcaraProvider> (dipasang di ReviuInspektoratAdmin).",
    );
  }
  return ctx;
}
