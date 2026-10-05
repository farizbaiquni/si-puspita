"use client";

/* ------------------------------------------------------------------ */
/*  HeaderInternal.tsx                                                 */
/*  Header untuk user INTERNAL_STRUKTURAL. Berisi:                     */
/*   - Hamburger (mobile) untuk buka sidebar.                          */
/*   - Judul halaman.                                                  */
/*   - Bell notifikasi (dari useNotifikasiInternal di parent).         */
/*   - Profile dropdown dengan tombol Logout.                          */
/*                                                                      */
/*  Notification dropdown & Profile dropdown dibuat sebagai sub-       */
/*  komponen di file ini supaya tidak perlu buat file terpisah         */
/*  (kodenya kecil dan hanya dipakai di HeaderInternal).               */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/store/auth-store";
import {
  TELAAH_LEVEL_LABEL,
  TELAAH_LEVEL_SUBTITLE,
  type NotifikasiInternalRecord,
} from "@/types/telaah-internal";

/* ==================== Ikon ==================== */

const IconBell = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M10 2a6 6 0 016 6c0 3.5 1.5 5 1.5 5h-15S4 11.5 4 8a6 6 0 016-6z" />
    <path d="M8.5 16a1.5 1.5 0 003 0" strokeLinecap="round" />
  </svg>
);

const IconLogout = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M7.5 15.5H3a1.5 1.5 0 01-1.5-1.5V4A1.5 1.5 0 013 2.5h4.5"
      strokeLinecap="round"
    />
    <path
      d="M12 12.5l3.5-3.5L12 5.5M15.5 9H7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M3 5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ==================== Helper waktu relatif ==================== */

function formatWaktuRelatif(iso: string): string {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return "Baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ==================== Warna aksen notif per milestone ==================== */

const MILESTONE_COLOR: Record<string, string> = {
  DIAJUKAN: "bg-[#1a4e8f]",
  SUDAH_TELAAH_KASUBBID: "bg-emerald-500",
  SUDAH_TELAAH_KABID: "bg-purple-500",
  SUDAH_TELAAH_SEKBAN: "bg-rose-500",
};

/* ==================== Notification Dropdown ==================== */

const NotificationDropdownInternal: React.FC<{
  data: NotifikasiInternalRecord[];
  unreadCount: number;
  isLoading: boolean;
  onTandaiDibaca: (id: string) => void;
  onTandaiSemuaDibaca: () => void;
}> = ({
  data,
  unreadCount,
  isLoading,
  onTandaiDibaca,
  onTandaiSemuaDibaca,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f]"
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#ebebeb] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifikasi</p>
            {unreadCount > 0 && (
              <button
                onClick={onTandaiSemuaDibaca}
                className="text-xs font-medium text-[#1a4e8f] hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-[#b0bac5]">
                Memuat notifikasi…
              </p>
            ) : data.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[#b0bac5]">
                Belum ada notifikasi.
              </p>
            ) : (
              data.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.dibaca && onTandaiDibaca(n.id)}
                  className={`flex w-full items-start gap-2.5 border-b border-[#f5f5f5] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f7f8fa] ${
                    n.dibaca ? "" : "bg-[#f0f4fb]/60"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.dibaca
                        ? "bg-transparent"
                        : (MILESTONE_COLOR[n.milestone] ?? "bg-[#1a4e8f]")
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        n.dibaca
                          ? "font-medium text-slate-700"
                          : "font-semibold text-slate-900"
                      }`}
                    >
                      {n.judul}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {n.pesan}
                    </p>
                    <p className="mt-1 text-[11px] text-[#b0bac5]">
                      {formatWaktuRelatif(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ==================== Profile Dropdown ==================== */

const ProfileDropdownInternal: React.FC<{
  name: string;
  subtitle: string;
  initials: string;
  avatarGradient: string;
  onLogout: () => void;
}> = ({ name, subtitle, initials, avatarGradient, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-3 rounded-xl px-1.5 py-1 transition-colors hover:bg-[#f7f8fa]"
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${avatarGradient} text-sm font-semibold text-white`}
        >
          {initials}
        </div>
        <div className="hidden flex-col items-start md:flex">
          <span className="text-sm leading-tight font-semibold text-slate-800">
            {name}
          </span>
          <span className="text-xs text-slate-500">{subtitle}</span>
        </div>
        <span className="hidden text-[#b0bac5] md:block">
          <IconChevronDown />
        </span>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#ebebeb] bg-white py-1 shadow-lg">
          <div className="border-b border-[#f0f0f0] px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-800">
              {name}
            </p>
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <IconLogout />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

/* ==================== Header utama ==================== */

interface HeaderInternalProps {
  user: SessionUser;
  notifikasi: {
    data: NotifikasiInternalRecord[];
    unreadCount: number;
    isLoading: boolean;
    onTandaiDibaca: (id: string) => void;
    onTandaiSemuaDibaca: () => void;
  };
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export default function HeaderInternal({
  user,
  notifikasi,
  onOpenMobileMenu,
  onLogout,
}: HeaderInternalProps) {
  // Label & inisial dari telaahLevel — fallback ke username kalau kosong.
  const levelLabel = user.telaahLevel
    ? TELAAH_LEVEL_LABEL[user.telaahLevel]
    : "Internal";
  const initials = user.telaahLevel
    ? user.telaahLevel.slice(0, 2).toUpperCase()
    : "IN";

  return (
    <header className="flex h-auto min-h-17 shrink-0 flex-wrap items-center gap-3 border-b border-[#f0f0f0] bg-white px-4 py-2.5 sm:px-6 lg:px-8">
      {/* Hamburger (mobile) */}
      <button
        onClick={onOpenMobileMenu}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f] lg:hidden"
        aria-label="Buka menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
        </svg>
      </button>

      {/* Judul */}
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-[15px] font-semibold text-slate-800">
          Telaah Internal
        </h2>
        <span className="hidden shrink-0 rounded-md bg-[#f0f4fb] px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-[#1a4e8f] uppercase sm:inline-block">
          BPKAD
        </span>
      </div>

      <div className="flex-1" />

      {/* Bell notif */}
      <NotificationDropdownInternal
        data={notifikasi.data}
        unreadCount={notifikasi.unreadCount}
        isLoading={notifikasi.isLoading}
        onTandaiDibaca={notifikasi.onTandaiDibaca}
        onTandaiSemuaDibaca={notifikasi.onTandaiSemuaDibaca}
      />

      <div className="hidden h-8 w-px bg-[#ebebeb] sm:block" />

      {/* Profile */}
      <ProfileDropdownInternal
        name={levelLabel}
        subtitle={
          user.telaahLevel
            ? TELAAH_LEVEL_SUBTITLE[user.telaahLevel]
            : "BPKAD Kab. Kendal"
        }
        initials={initials}
        avatarGradient="from-[#1e8fd4] to-[#0e6ba8]"
        onLogout={onLogout}
      />
    </header>
  );
}
