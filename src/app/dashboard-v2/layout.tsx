"use client";

/* ------------------------------------------------------------------ */
/*  layout.tsx (dashboard-v2)                                          */
/*  Wrapper untuk SEMUA route di bawah /dashboard-v2/**.               */
/*                                                                      */
/*  Menyediakan TelaahInternalProvider supaya:                         */
/*   - Admin (menu "Telaah Internal" di /dashboard-v2) bisa akses      */
/*     store telaah (list, ajukan telaah),                              */
/*   - User internal (kasubbid/kabid/sekban) di /dashboard-v2/telaah   */
/*     juga dapat store yang SAMA (real-time via onSnapshot).           */
/*                                                                      */
/*  Sengaja di layout (bukan di page) supaya tidak duplikasi provider   */
/*  di 2 tempat, dan otomatis berlaku untuk semua sub-route baru yang   */
/*  ditambah nanti (mis. /dashboard-v2/telaah/detail).                  */
/*                                                                      */
/*  File ini baru (BARU) — tidak mengubah / menghapus apapun. Existing  */
/*  dashboard-v2/page.tsx tidak perlu disentuh, Next.js otomatis pakai   */
/*  layout terdekat untuk route di bawahnya.                            */
/* ------------------------------------------------------------------ */

import type { ReactNode } from "react";
import { TelaahInternalProvider } from "@/store/telaah-internal-store";

export default function DashboardV2Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <TelaahInternalProvider>{children}</TelaahInternalProvider>;
}
