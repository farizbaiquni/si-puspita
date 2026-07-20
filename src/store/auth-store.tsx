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
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cariAkun,
  namaOpdDariAkun,
  opdSlugDariAkun,
  opdIdDariAkun,
  type UserRole,
} from "@/lib/auth-config";

const SESSION_STORAGE_KEY = "si-puspita-session";

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
  /** True selama sesi tersimpan belum selesai dibaca saat mount pertama. */
  isLoading: boolean;
  login: (
    username: string,
    password: string,
  ) => { ok: boolean; pesan?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthStoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Baca sesi tersimpan sekali saat provider mount. Dibungkus try/catch
  // karena localStorage bisa saja tidak tersedia (mis. mode privat ketat)
  // atau isinya korup/format lama.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as SessionUser);
    } catch {
      // Anggap saja belum login.
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string) => {
    const akun = cariAkun(username, password);
    if (!akun) {
      return { ok: false, pesan: "Username atau password salah." };
    }

    const sessionUser: SessionUser = {
      username: akun.username,
      role: akun.role,
      namaOPD: namaOpdDariAkun(akun),
      opdSlug: opdSlugDariAkun(akun),
      opdId: opdIdDariAkun(akun),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo<AuthStoreValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading],
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
