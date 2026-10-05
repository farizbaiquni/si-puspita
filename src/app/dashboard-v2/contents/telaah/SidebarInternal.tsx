"use client";

/* ------------------------------------------------------------------ */
/*  SidebarInternal.tsx                                                */
/*  Sidebar minimal untuk user INTERNAL_STRUKTURAL (Kasubbid/Kabid/    */
/*  Sekban). Hanya punya 1 menu: "Telaah Saya" (route aktif).           */
/*                                                                      */
/*  Responsive:                                                         */
/*   - Desktop (lg+): static di kiri, selalu terlihat.                  */
/*   - Mobile: drawer, buka/tutup via prop `mobileOpen`.                */
/* ------------------------------------------------------------------ */

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/store/auth-store";
import {
  TELAAH_LEVEL_LABEL,
  TELAAH_LEVEL_SUBTITLE,
} from "@/types/telaah-internal";

const IconChecklist = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M3 5l2 2 3-3M3 10l2 2 3-3M10 6h5M10 11h5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface SidebarInternalProps {
  /** Status drawer di layar sempit (mobile/tablet). Diabaikan di lg+. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function SidebarInternal({
  mobileOpen,
  onCloseMobile,
}: SidebarInternalProps) {
  const { user } = useAuth();
  const levelLabel = user?.telaahLevel
    ? TELAAH_LEVEL_LABEL[user.telaahLevel]
    : "Internal";

  return (
    <>
      {/* Overlay untuk mobile — klik untuk tutup drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] shrink-0 flex-col overflow-y-auto border-r border-[#f0f0f0] bg-white transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:w-60 lg:max-w-none lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo + tombol close (mobile) */}
        <div className="flex items-center justify-between px-5 pt-4 pb-8 lg:justify-start lg:pt-0">
          <Link href="/dashboard-v2/telaah">
            <Image
              src="/logo-si-puspita-full-bg-removed.png"
              alt="Logo SI PUSPITA"
              width={640}
              height={640}
              quality={100}
              priority
              className="mt-3 w-40 bg-white"
            />
          </Link>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-[#7a8899] hover:bg-[#f0f4fb] lg:hidden"
            aria-label="Tutup menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <div className="mb-4 flex-1 px-3">
          <p className="mb-2 px-4 text-[10px] font-semibold tracking-widest text-[#b0bac5] uppercase">
            Menu
          </p>

          {/* Satu-satunya menu — selalu aktif karena route ini hanya 1 */}
          <div className="relative flex cursor-default items-center gap-3 rounded-xl bg-[#1a4e8f] px-4 py-2.5 text-white">
            <span>
              <IconChecklist />
            </span>
            <span className="text-sm font-medium">Telaah Saya</span>
          </div>
        </div>

        {/* Info role di bawah */}
        <div className="border-t border-[#f0f0f0] px-5 py-4">
          <p className="text-[10px] font-semibold tracking-widest text-[#b0bac5] uppercase">
            Login sebagai
          </p>
          <p className="mt-1 text-[12.5px] font-semibold text-[#1a4e8f]">
            {levelLabel}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#7a8899]">
            {user?.telaahLevel
              ? TELAAH_LEVEL_SUBTITLE[user.telaahLevel]
              : "BPKAD Kab. Kendal"}
          </p>
        </div>
      </aside>
    </>
  );
}
