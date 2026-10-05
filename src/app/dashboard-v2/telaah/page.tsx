"use client";

/* ------------------------------------------------------------------ */
/*  dashboard-v2/telaah/page.tsx                                       */
/*  Route khusus untuk user INTERNAL_STRUKTURAL (Kasubbid/Kabid/Sekban).*/
/*                                                                      */
/*  Komposisi:                                                          */
/*   - Guard: baca localStorage langsung (hindari race condition).      */
/*   - Shell: <SidebarInternal /> + <HeaderInternal /> + konten.        */
/*   - Konten: <TelaahSayaInternal /> dari folder contents/telaah.      */
/*                                                                      */
/*  Notifikasi internal di-HOOK di sini (bukan di Header) supaya        */
/*  parent yang mengontrol data — Header hanya menerima props.          */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth-store";
import { useNotifikasiInternal } from "@/store/notifikasi-internal-store";
import TelaahSayaInternal from "../contents/telaah/TelaahSayaInternal";
import SidebarInternal from "../contents/telaah/SidebarInternal";
import HeaderInternal from "../contents/telaah/HeaderInternal";

const SESSION_STORAGE_KEY = "si-puspita-session";

export default function TelaahPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Guard: baca session langsung dari localStorage ──
  useEffect(() => {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!raw) {
      router.replace("/dashboard-v2");
      return;
    }

    try {
      const session = JSON.parse(raw) as { role?: string };
      if (session.role !== "INTERNAL_STRUKTURAL") {
        router.replace("/dashboard-v2");
      }
    } catch {
      router.replace("/dashboard-v2");
    }
  }, [router]);

  // ── Notifikasi internal (hanya untuk user internal) ──
  // Hook tetap dipanggil walau user null (dengan argumen undefined)
  // supaya tidak melanggar Rules of Hooks.
  const notifikasi = useNotifikasiInternal(user?.username);

  // ── Handler logout ──
  const handleLogout = () => {
    logout();
    router.push("/homepage");
  };

  // ── Render: sebelum hydration selesai / user null ──
  if (!user || user.role !== "INTERNAL_STRUKTURAL") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f7f8fa]">
        <p className="text-sm text-[#7a8899]">Memuat sesi…</p>
      </div>
    );
  }

  // ── Render: shell lengkap ──
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f8fa] font-sans">
      <SidebarInternal
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderInternal
          user={user}
          notifikasi={{
            data: notifikasi.data,
            unreadCount: notifikasi.unreadCount,
            isLoading: notifikasi.isLoading,
            onTandaiDibaca: notifikasi.tandaiDibaca,
            onTandaiSemuaDibaca: notifikasi.tandaiSemuaDibaca,
          }}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <TelaahSayaInternal />
        </main>
      </div>
    </div>
  );
}
