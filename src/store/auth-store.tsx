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
/*  (Bagian ini TIDAK BERUBAH sama sekali)                             */
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

function getServerSnapshot(): SessionUser | null {
  return null;
}

/* ==================================================================== */
/*  ── PERUBAHAN LANGKAH 1.3: SessionUser dapat field baru ──           */
/* ==================================================================== */

export interface SessionUser {
  username: string;
  role: UserRole;
  /** Nama resmi OPD — hanya terisi untuk user role "OPD". */
  namaOPD: string | null;
  /** Slug pendek OPD (mis. "dishub") — hanya terisi untuk role "OPD". */
  opdSlug: string | null;
  /** Id numerik OPD (lihat DAFTAR_OPD di types.ts) — hanya untuk role "OPD". */
  opdId: number | null;
  /**
   * Sub-level hierarki telaah internal — hanya terisi untuk user dengan
   * role "INTERNAL_STRUKTURAL". Nilainya menentukan menu mana yang tampil
   * dan tombol approve mana yang aktif di halaman /dashboard-v2/telaah.
   * `null` untuk semua role lain (OPD, ADMIN).
   */
  telaahLevel: "kasubbid" | "kabid" | "sekban" | null;
}

interface AuthStoreValue {
  user: SessionUser | null;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
  ) => { ok: boolean; pesan?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthStoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isLoading = false;

  const login = (username: string, password: string) => {
    const akun = cariAkun(username, password);
    if (!akun) {
      return { ok: false, pesan: "Username atau password salah." };
    }

    // ──────────────────────────────────────────────────────────────
    //  PERUBAHAN LANGKAH 1.3: tambah 1 baris `telaahLevel: ...`
    // ──────────────────────────────────────────────────────────────
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
      // BARU: sub-level telaah internal — hanya terisi untuk role
      // "INTERNAL_STRUKTURAL", null untuk semua role lain.
      telaahLevel: akun.telaahLevel ?? null,
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
