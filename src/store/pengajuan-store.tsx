"use client";

/* ------------------------------------------------------------------ */
/*  pengajuan-store.tsx                                                */
/*  Sumber data tunggal untuk seluruh pengajuan penghapusan piutang.   */
/*  Dipasang sekali di root layout supaya homepage (ModalLacak) dan     */
/*  dashboard-v2 (BPKAD/OPD) sama-sama baca & tulis dari state yang     */
/*  sama — bukan masing-masing import MOCK_DATA sendiri-sendiri.        */
/*                                                                      */
/*  Implementasi pakai useSyncExternalStore: localStorage diperlakukan  */
/*  sebagai "sistem eksternal" (persis rekomendasi React), bukan lewat  */
/*  useEffect + setState manual — supaya tidak memicu cascading         */
/*  render / warning "setState synchronously within an effect".         */
/*                                                                      */
/*  Kalau nanti sudah ada API beneran, cukup ganti isi                  */
/*  tambahPengajuan / updatePengajuan di class PengajuanStore supaya    */
/*  memanggil endpoint — komponen pemakai (ModalLacak, dashboard-v2,    */
/*  dll) tidak perlu berubah sama sekali.                               */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { MOCK_DATA } from "@/app/dashboard-v2/contents/dummyData";
import type { FormulirPenghapusanPiutangOPDRecord } from "@/types/types-v2";

const STORAGE_KEY = "sipuspita_pengajuan_data_v1";

type Listener = () => void;
type Data = FormulirPenghapusanPiutangOPDRecord[];

/** Store eksternal tunggal (di luar React) — dibaca lewat useSyncExternalStore. */
class PengajuanStore {
  private data: Data = MOCK_DATA;
  private listeners = new Set<Listener>();
  private storageListenerAttached = false;

  constructor() {
    // Modul ini di-evaluasi ulang setiap kali halaman benar-benar di-refresh
    // (full reload) — karena itu, constructor adalah tempat yang tepat untuk
    // membuang data lama di localStorage supaya store selalu mulai dari
    // MOCK_DATA lagi. Navigasi client-side (tanpa refresh) TIDAK memicu ini
    // karena instance `store` di bawah tidak dibuat ulang.
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // localStorage tidak tersedia (mis. mode private) — abaikan.
      }
    }
  }

  private writeToStorage(data: Data) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage penuh / tidak tersedia (mis. mode private) — abaikan,
      // data tetap jalan di memori untuk sesi ini.
    }
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private setData(next: Data) {
    this.data = next;
    this.writeToStorage(next);
    this.emit();
  }

  /** Dipanggil React lewat useSyncExternalStore — snapshot untuk render client. */
  getSnapshot = (): Data => this.data;

  /** Snapshot untuk render server / first paint — selalu MOCK_DATA supaya
   *  tidak ada hydration mismatch (localStorage tidak ada di server). */
  getServerSnapshot = (): Data => MOCK_DATA;

  /** Dipanggil React sekali per komponen yang subscribe. */
  subscribe = (listener: Listener) => {
    this.listeners.add(listener);

    // Catatan: TIDAK lagi membaca localStorage di sini seperti sebelumnya.
    // constructor sudah membuang data lama saat modul di-refresh, jadi
    // `this.data` yang dipakai selalu MOCK_DATA di awal sesi — perubahan
    // (tambah/verifikasi pengajuan) baru ditulis ke localStorage lewat
    // setData() dan hanya berlaku selama sesi/tab ini berjalan.
    if (typeof window !== "undefined" && !this.storageListenerAttached) {
      // Sinkron antar-tab DALAM sesi yang sama (belum refresh): kalau
      // dashboard BPKAD dibuka di tab lain lalu verifikasi sebuah
      // pengajuan, tab ini ikut update selama tab-tab tersebut belum
      // di-refresh ulang.
      this.storageListenerAttached = true;
      window.addEventListener("storage", (e: StorageEvent) => {
        if (e.key !== STORAGE_KEY || !e.newValue) return;
        try {
          const parsed = JSON.parse(e.newValue) as Data;
          if (Array.isArray(parsed)) {
            this.data = parsed;
            this.emit();
          }
        } catch {
          // payload rusak — abaikan
        }
      });
    }

    return () => {
      this.listeners.delete(listener);
    };
  };

  tambahPengajuan = (record: FormulirPenghapusanPiutangOPDRecord) => {
    this.setData([record, ...this.data]);
  };

  updatePengajuan = (
    id: string,
    updates: Partial<FormulirPenghapusanPiutangOPDRecord>,
  ) => {
    this.setData(
      this.data.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  };

  getPengajuanById = (id: string) => this.data.find((d) => d.id === id);

  resetKeData = () => this.setData(MOCK_DATA);
}

const store = new PengajuanStore();

interface PengajuanStoreValue {
  /** Daftar seluruh pengajuan — pengganti MOCK_DATA di semua tempat. */
  data: Data;
  /** Dipanggil OPD setelah submit wizard berhasil. */
  tambahPengajuan: (record: FormulirPenghapusanPiutangOPDRecord) => void;
  /** Dipanggil BPKAD saat verifikasi (ubah status, checklist, catatan, dll). */
  updatePengajuan: (
    id: string,
    updates: Partial<FormulirPenghapusanPiutangOPDRecord>,
  ) => void;
  getPengajuanById: (
    id: string,
  ) => FormulirPenghapusanPiutangOPDRecord | undefined;
  /** Reset paksa ke MOCK_DATA awal — berguna untuk testing/demo. */
  resetKeData: () => void;
}

const PengajuanContext = createContext<PengajuanStoreValue | null>(null);

export function PengajuanProvider({ children }: { children: ReactNode }) {
  const data = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const value = useMemo<PengajuanStoreValue>(
    () => ({
      data,
      tambahPengajuan: store.tambahPengajuan,
      updatePengajuan: store.updatePengajuan,
      getPengajuanById: store.getPengajuanById,
      resetKeData: store.resetKeData,
    }),
    [data],
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
