"use client";

/* ------------------------------------------------------------------ */
/*  auth-store.tsx                                                     */
/*  Sumber sesi login tunggal — dipasang sekali di root layout, mirip   */
/*  pola PengajuanProvider. Sesi disimpan di localStorage supaya         */
/*  bertahan lewat refresh (bukan JWT/cookie sungguhan — cukup untuk     */
/*  demo "kelihatan jalan").                                            */
/*                                                                      */
/*  Taruh file ini di: src/store/auth-store.tsx                        */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  cariAkun,
  namaOpdDariAkun,
  opdIdDariAkun,
  type UserRole,
} from "@/lib/auth-config";

const SESSION_STORAGE_KEY = "si-puspita-session";

/* ------------------------------------------------------------------ */
/*  External-store plumbing untuk localStorage.                        */
/*                                                                      */
/*  Kenapa bukan useEffect + setUser seperti sebelumnya? Karena itu     */
/*  memicu warning "setState synchronously within an effect": render    */
/*  pertama selalu user=null, lalu effect jalan dan memaksa render      */
/*  kedua. localStorage adalah sumber data eksternal, jadi tempatnya    */
/*  memang di useSyncExternalStore — dibaca sinkron, tanpa render       */
/*  buang-buang, dan otomatis aman untuk SSR (getServerSnapshot).       */
/*                                                                      */
/*  Event "storage" bawaan browser HANYA terpicu di tab LAIN, bukan di  */
/*  tab yang memanggil setItem/removeItem sendiri. Makanya login() dan  */
/*  logout() di bawah memanggil emitChange() secara manual supaya tab   */
/*  yang sama juga ikut re-render.                                      */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

// Cache sederhana supaya getSnapshot mengembalikan referensi yang SAMA
// selama string mentah di localStorage belum berubah — wajib untuk
// useSyncExternalStore, kalau tidak bisa infinite loop render.
let cachedRaw: string | null = null;
let cachedUser: SessionUser | null = null;

function getSnapshot(): SessionUser | null {
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === cachedRaw) return cachedUser;

  cachedRaw = raw;
  try {
    cachedUser = raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

// Di server, localStorage tidak ada — anggap saja belum ada sesi.
function getServerSnapshot(): SessionUser | null {
  return null;
}

export interface SessionUser {
  username: string;
  role: UserRole;
  /** Nama resmi OPD — hanya terisi untuk user role "OPD". */
  namaOPD: string | null;
  /** Slug pendek OPD (mis. "dishub") — hanya terisi untuk role "OPD". */
  opdSlug: string | null;
  /** Id numerik OPD (lihat DAFTAR_OPD di types.ts) — hanya untuk role "OPD". */
  opdId: number | null;
}

interface AuthStoreValue {
  user: SessionUser | null;
  /**
   * Selalu false sekarang — useSyncExternalStore membaca localStorage
   * secara sinkron, jadi tidak ada lagi jeda "belum selesai dibaca".
   * Field ini dipertahankan supaya komponen yang sudah memakai
   * `isLoading` dari useAuth() tidak perlu diubah.
   */
  isLoading: boolean;
  login: (
    username: string,
    password: string,
  ) => { ok: boolean; pesan?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthStoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Dibaca sinkron dari localStorage lewat useSyncExternalStore — tidak
  // ada lagi render "kosong lalu diisi" seperti pola useEffect+setState.
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // isLoading kini hanya berarti "belum sempat hydrate di client sama
  // sekali". Selama getServerSnapshot() (null) dan getSnapshot() bisa
  // berbeda, React sendiri yang menjamin re-render itu terjadi sebelum
  // paint pertama di client, jadi tidak perlu state/efek terpisah.
  const isLoading = false;

  const login = (username: string, password: string) => {
    const akun = cariAkun(username, password);
    if (!akun) {
      return { ok: false, pesan: "Username atau password salah." };
    }

    const sessionUser: SessionUser = {
      username: akun.username,
      role: akun.role,
      namaOPD: namaOpdDariAkun(akun),
      // PENTING: ambil langsung dari akun.opdSlug, JANGAN lewat
      // opdSlugDariAkun() — fungsi itu sengaja mengembalikan null kalau
      // akun.role !== "OPD" (dipakai untuk badge/label khusus OPD), tapi
      // itu juga menghilangkan opdSlug untuk akun ADMIN yang justru perlu
      // dibedakan lewat opdSlug-nya sendiri (mis. akun "bpkad" vs "admin"
      // generik — lihat dashboard-v2/page.tsx: user.opdSlug === "bpkad").
      opdSlug: akun.opdSlug ?? null,
      opdId: opdIdDariAkun(akun),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    emitChange();
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    emitChange();
  };

  const value = useMemo<AuthStoreValue>(
    () => ({ user, isLoading, login, logout }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth() harus dipanggil di dalam <AuthProvider> (dipasang di src/app/layout.tsx).",
    );
  }
  return ctx;
}
