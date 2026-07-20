/* ------------------------------------------------------------------ */
/*  auth-config.ts                                                     */
/*  Konfigurasi akun login SEMENTARA — hardcode, disediakan dev.       */
/*  Password plaintext & validasi di client: HANYA untuk demo/prototype,*/
/*  BUKAN untuk production sungguhan. Nanti kalau sudah siap, ganti ke  */
/*  Firebase Auth atau backend auth sungguhan.                          */
/*                                                                      */
/*  Taruh file ini di: src/lib/auth-config.ts                          */
/* ------------------------------------------------------------------ */

import { getOpdBySlug } from "@/types/types";

export type UserRole = "OPD" | "ADMIN";

export interface AkunLogin {
  username: string;
  password: string;
  role: UserRole;
  /** Slug OPD (lihat DAFTAR_OPD di types.ts) — hanya diisi untuk role "OPD". */
  opdSlug?: string;
}

export const DAFTAR_AKUN: readonly AkunLogin[] = [
  { username: "admin", password: "admin_si_puspita", role: "ADMIN" },
  {
    username: "rsud",
    password: "rsud_si_puspita",
    role: "OPD",
    opdSlug: "rsud",
  },
  {
    username: "dishub",
    password: "dishub_si_puspita",
    role: "OPD",
    opdSlug: "dishub",
  },
  {
    username: "diskominfo",
    password: "diskominfo_si_puspita",
    role: "OPD",
    opdSlug: "diskominfo",
  },
  {
    username: "disdagkopukm",
    password: "disdagkop_si_puspita",
    role: "OPD",
    opdSlug: "disdagkopukm",
  },
  {
    username: "setwan",
    password: "setwan_si_puspita",
    role: "OPD",
    opdSlug: "setwan",
  },
] as const;

/** Cocokkan username+password ke DAFTAR_AKUN (case-insensitive utk username). */
export function cariAkun(
  username: string,
  password: string,
): AkunLogin | undefined {
  return DAFTAR_AKUN.find(
    (akun) =>
      akun.username.toLowerCase() === username.trim().toLowerCase() &&
      akun.password === password,
  );
}

/** Nama resmi OPD dari slug akun (null kalau akun ADMIN atau slug tak dikenal). */
export function namaOpdDariAkun(akun: AkunLogin): string | null {
  if (akun.role !== "OPD" || !akun.opdSlug) return null;
  return getOpdBySlug(akun.opdSlug)?.nama ?? null;
}

/** Slug OPD dari akun (null kalau akun ADMIN). Dipakai untuk identifier
 * pendek (mis. badge inisial di UI), beda dari nama resmi yang panjang. */
export function opdSlugDariAkun(akun: AkunLogin): string | null {
  if (akun.role !== "OPD" || !akun.opdSlug) return null;
  return akun.opdSlug;
}

/** Id numerik OPD dari akun (null kalau akun ADMIN atau slug tak dikenal). */
export function opdIdDariAkun(akun: AkunLogin): number | null {
  if (akun.role !== "OPD" || !akun.opdSlug) return null;
  return getOpdBySlug(akun.opdSlug)?.id ?? null;
}
