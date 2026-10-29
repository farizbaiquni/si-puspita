"use client";

/* ------------------------------------------------------------------ */
/*  surat-pengantar-inspektorat-store.tsx                              */
/*  Store untuk draft Surat Pengantar ke Inspektorat (menu Reviu       */
/*  Inspektorat).                                                      */
/*                                                                     */
/*  Data tersimpan di koleksi TERPISAH dari alur lama:                 */
/*    suratPengantarInspektorat/{pengajuanId}                          */
/*      → 1 pengajuan = 1 draft surat pengantar                        */
/*                                                                     */
/*  Draft ini memungkinkan admin mengunggah surat pengantar langsung   */
/*  dari halaman detail, sebelum menekan "Ajukan Reviu".               */
/*  Provider hanya di-mount di dalam menu Reviu Inspektorat.           */
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
import type { SuratPengantarInspektoratRecord } from "@/types/reviu-inspektorat";

const SURAT_PENGANTAR_COLLECTION = "suratPengantarInspektorat";

/* ==================== Context value ==================== */

interface SuratPengantarInspektoratStoreValue {
  data: SuratPengantarInspektoratRecord[];
  isLoading: boolean;
  error: string | null;

  getSuratPengantarByPengajuanId: (
    pengajuanId: string,
  ) => SuratPengantarInspektoratRecord | undefined;
}

const SuratPengantarInspektoratContext =
  createContext<SuratPengantarInspektoratStoreValue | null>(null);

/* ==================== Provider ==================== */

export function SuratPengantarInspektoratProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<SuratPengantarInspektoratRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Subscription real-time ──
  useEffect(() => {
    const q = query(collection(db, SURAT_PENGANTAR_COLLECTION));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setData(
          snap.docs.map(
            (d) => d.data() as SuratPengantarInspektoratRecord,
          ),
        );
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Gagal membaca draft surat pengantar:", err);
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  // ── Read helper ──
  const getSuratPengantarByPengajuanId = useCallback(
    (pengajuanId: string) => data.find((s) => s.pengajuanId === pengajuanId),
    [data],
  );

  const value = useMemo<SuratPengantarInspektoratStoreValue>(
    () => ({ data, isLoading, error, getSuratPengantarByPengajuanId }),
    [data, isLoading, error, getSuratPengantarByPengajuanId],
  );

  return (
    <SuratPengantarInspektoratContext.Provider value={value}>
      {children}
    </SuratPengantarInspektoratContext.Provider>
  );
}

/* ==================== Hook ==================== */

export function useSuratPengantarInspektoratStore(): SuratPengantarInspektoratStoreValue {
  const ctx = useContext(SuratPengantarInspektoratContext);
  if (!ctx) {
    throw new Error(
      "useSuratPengantarInspektoratStore() harus dipanggil di dalam <SuratPengantarInspektoratProvider> (dipasang di ReviuInspektoratAdmin).",
    );
  }
  return ctx;
}
