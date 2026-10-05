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

export type UserRole = "OPD" | "ADMIN" | "INTERNAL_STRUKTURAL";

export interface AkunLogin {
  username: string;
  password: string;
  role: UserRole;
  /** Slug OPD (lihat DAFTAR_OPD di types.ts) — hanya diisi untuk role "OPD". */
  opdSlug?: string;
  /**
   * Sub-level hierarki untuk role "INTERNAL_STRUKTURAL" — hanya diisi untuk
   * akun dengan role tersebut. Nilai menentukan tahap telaah mana yang bisa
   * di-approve oleh akun ini (lihat TELAAH_TAHAP_BY_LEVEL di
   * types/telaah-internal.ts).
   */
  telaahLevel?: "kasubbid" | "kabid" | "sekban";
}

export const DAFTAR_AKUN: readonly AkunLogin[] = [
  { username: "admin", password: "admin_si_puspita", role: "ADMIN" },
  {
    username: "rsud",
    password: "rsud_si_puspita#33",
    role: "OPD",
    opdSlug: "rsud",
  },
  {
    username: "dishub",
    password: "dishub_si_puspita#49",
    role: "OPD",
    opdSlug: "dishub",
  },
  {
    username: "diskominfo",
    password: "diskominfo_si_puspita#50",
    role: "OPD",
    opdSlug: "diskominfo",
  },
  {
    username: "disdagkopukm",
    password: "disdagkopukm_si_puspita#56",
    role: "OPD",
    opdSlug: "disdagkopukm",
  },
  {
    username: "setwan",
    password: "setwan_si_puspita#57",
    role: "OPD",
    opdSlug: "setwan",
  },
  {
    username: "dpmptsp",
    password: "dpmptsp_si_puspita#51",
    role: "OPD",
    opdSlug: "dpmptsp",
  },
  {
    username: "bpkad",
    password: "bpkad_si_puspita#70",
    role: "OPD",
    opdSlug: "bpkad",
  },
  {
    username: "bpkad",
    password: "bpkad_si_puspita#00",
    role: "ADMIN",
    opdSlug: "bpkad",
  },

  // ═══════════════════════════════════════════════════════════════
  //  MODUL TELAAH INTERNAL STRUKTURAL (BPKAD)
  //  Alur wajib: Kasubbid → Kabid → Sekban.
  //  Ketiga akun single-instance (1 user per level).
  // ═══════════════════════════════════════════════════════════════
  {
    username: "kasubbid",
    password: "kasubbid_si_puspita#01",
    role: "INTERNAL_STRUKTURAL",
    telaahLevel: "kasubbid",
  },
  {
    username: "kabid",
    password: "kabid_si_puspita#02",
    role: "INTERNAL_STRUKTURAL",
    telaahLevel: "kabid",
  },
  {
    username: "sekban",
    password: "sekban_si_puspita#03",
    role: "INTERNAL_STRUKTURAL",
    telaahLevel: "sekban",
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
