"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import AjukanPermohonanWizard from "./contents/opd/ajukan-permohonan/AjukanPermohonan";
import DaftarPengajuanOPDBaru from "./contents/opd/lihat-daftar-pengajuan/LihatDaftarPengajuan";
import VerifikasiPengajuan from "./contents/bpkad/verifikasi-pengajuan/VerifikasiPengajuan";
import LihatDaftarPengajuanAdmin from "./contents/bpkad/lihat-daftar-pengajuan-admin/LihatDaftarPengajuanAdmin";
import RegisterDigital from "./contents/bpkad/register-digital/RegisterDigital";
import LihatDaftarPengajuanBPKAD from "./contents/userBPKAD/LihatDaftarPengajuanBPKAD/LihatDaftarPengajuanBPKAD";
import Link from "next/link";
import Image from "next/image";

// ── Modul Telaah Internal Struktural ──
import TelaahInternalAdmin from "./contents/telaah/TelaahInternalAdmin";
import TelaahSayaInternal from "./contents/telaah/TelaahSayaInternal";

// ── Modul Reviu Inspektorat (additive) ──
import ReviuInspektoratAdmin from "./contents/reviu-inspektorat/ReviuInspektoratAdmin";

import {
  IconFilePlus,
  IconList,
  IconChecklist,
  IconEye,
  IconLogout,
  IconSearch,
  IconMail,
  IconBell,
  IconChevronDown,
} from "./icons";
import { usePengajuanStore } from "@/store/pengajuan-store";
import {
  useNotifikasiOPD,
  kirimNotifikasiVerifikasi,
} from "@/store/notifikasi-store";
import { useNotifikasiInternal } from "@/store/notifikasi-internal-store";
import { useAuth } from "@/store/auth-store";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  NotifikasiOPD,
  StatusFormulir,
} from "@/types/types";
import { getOpdBySlug } from "@/types/types";
import type { NotifikasiInternalRecord } from "@/types/telaah-internal";

// ── Types ────────────────────────────────────────────────────────────────────

type UserRole = "OPD" | "ADMIN" | "INTERNAL_STRUKTURAL";

// Tampilan sidebar/menu dibagi 6:
//  - "OPD"            → role "OPD"
//  - "BPKAD_ADMIN"    → role "ADMIN" DAN opdSlug === "bpkad" (read-only)
//  - "OTHER_ADMIN"    → role "ADMIN" (admin generik, akses penuh)
//  - "TELAAH_KASUBBID" / "TELAAH_KABID" / "TELAAH_SEKBAN"
//                     → role "INTERNAL_STRUKTURAL", per sub-level
type TampilanRole =
  | "OPD"
  | "BPKAD_ADMIN"
  | "OTHER_ADMIN"
  | "TELAAH_KASUBBID"
  | "TELAAH_KABID"
  | "TELAAH_SEKBAN";

type OPDMenuKey = "ajukan-permohonan" | "lihat-daftar-pengajuan";

type AdminMenuKey =
  | "verifikasi-pengajuan"
  | "lihat-daftar-pengajuan-admin"
  | "register-digital"
  | "telaah-internal"
  | "reviu-inspektorat";

type BPKADAdminMenuKey = "lihat-daftar-pengajuan-bpkad";

type TelaahMenuKey = "telaah-saya";

type MenuKey = OPDMenuKey | AdminMenuKey | BPKADAdminMenuKey | TelaahMenuKey;

// ── Ikon lokal tambahan ──────────────────────────────────────────────────────

const IconShield = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M10 1.5L3.5 4v6c0 4.5 2.75 7.5 6.5 8.5 3.75-1 6.5-4 6.5-8.5V4L10 1.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Menu configs per role ─────────────────────────────────────────────────────

type MenuItem = {
  key: MenuKey;
  icon: React.ReactNode;
  label: string;
  badge?: number;
};

const OPD_MENUS: MenuItem[] = [
  {
    key: "ajukan-permohonan",
    icon: <IconFilePlus />,
    label: "Ajukan Permohonan",
  },
  {
    key: "lihat-daftar-pengajuan",
    icon: <IconList />,
    label: "Lihat Daftar Pengajuan",
  },
];

const ADMIN_MENUS: MenuItem[] = [
  {
    key: "verifikasi-pengajuan",
    icon: <IconChecklist />,
    label: "Verifikasi Pengajuan",
  },
  {
    key: "register-digital",
    icon: <IconList />,
    label: "Register Digital",
  },
  {
    key: "lihat-daftar-pengajuan-admin",
    icon: <IconEye />,
    label: "Lihat Pengajuan",
  },
  {
    key: "telaah-internal",
    icon: <IconChecklist />,
    label: "Telaah Internal",
  },
  {
    key: "reviu-inspektorat",
    icon: <IconShield />,
    label: "Reviu Inspektorat",
  },
];

const BPKAD_ADMIN_MENUS: MenuItem[] = [
  {
    key: "lihat-daftar-pengajuan-bpkad",
    icon: <IconEye />,
    label: "Lihat Daftar Pengajuan",
  },
];

const TELAAH_MENUS: MenuItem[] = [
  {
    key: "telaah-saya",
    icon: <IconChecklist />,
    label: "Ruang Telaah",
  },
];

const PAGE_META: Record<
  MenuKey,
  { title: string; subtitle: string; action?: { label: string } }
> = {
  "ajukan-permohonan": {
    title: "Ajukan Permohonan Penghapusan Piutang",
    subtitle: "Buat dan kirimkan permohonan baru kepada Admin.",
    action: { label: "Buat Permohonan" },
  },
  "lihat-daftar-pengajuan": {
    title: "Daftar Pengajuan",
    subtitle: "Pantau status seluruh pengajuan yang telah dikirimkan.",
  },
  "verifikasi-pengajuan": {
    title: "Verifikasi Pengajuan",
    subtitle: "Tinjau dan verifikasi pengajuan yang masuk dari OPD.",
    action: { label: "Verifikasi" },
  },
  "lihat-daftar-pengajuan-admin": {
    title: "Lihat Pengajuan",
    subtitle: "Tampilkan semua pengajuan yang telah diproses.",
  },
  "register-digital": {
    title: "Register Digital",
    subtitle:
      "Daftar nominatif piutang yang telah diusulkan, dikelompokkan per OPD.",
  },
  "lihat-daftar-pengajuan-bpkad": {
    title: "Lihat Daftar Pengajuan",
    subtitle:
      "Seluruh pengajuan penghapusan piutang dari semua OPD, beserta statusnya.",
  },
  "telaah-internal": {
    title: "Telaah Internal",
    subtitle:
      "Ajukan pengajuan teregistrasi ke telaah substantif berjenjang (Kasubbid → Kabid → Sekban).",
  },
  "telaah-saya": {
    title: "Ruang Telaah",
    subtitle: "Kelola pengajuan yang menunggu telaah Anda.",
  },
  "reviu-inspektorat": {
    title: "Reviu Inspektorat",
    subtitle:
      "Kelola pengajuan yang telah selesai ditelaah internal untuk diteruskan ke Reviu Inspektorat.",
  },
};

// Inisial pendek untuk avatar Header, per slug OPD.
const OPD_BADGE_BY_SLUG: Record<string, string> = {
  rsud: "RS",
  dishub: "DH",
  diskominfo: "DK",
  disdagkopukm: "UKM",
  setwan: "SW",
  dpmptsp: "DP",
};

// Singkatan resmi OPD (dipakai sebagai nama utama di Header/ProfileDropdown).
const OPD_SINGKATAN_BY_SLUG: Record<string, string> = {
  rsud: "RSUD",
  dishub: "Dishub",
  diskominfo: "Diskominfo",
  disdagkopukm: "Disdagkopukm",
  setwan: "Setwan",
  dpmptsp: "DPMPTSP",
};

// ── Logo ─────────────────────────────────────────────────────────────────────

const SiPuspitaLogo = () => (
  <div className="relative">
    <Link href="/homepage">
      <Image
        src="/logo-si-puspita-full-bg-removed.png"
        alt="Logo"
        width={640}
        height={640}
        quality={100}
        priority
        className="mt-3 w-40 bg-white"
      />
    </Link>
  </div>
);

// ── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active,
  badge,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`relative flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-150 ${
      active
        ? "bg-[#1a4e8f] text-white"
        : "text-[#7a8899] hover:bg-[#f0f4fb] hover:text-[#1a4e8f]"
    }`}
  >
    <span>{icon}</span>
    <span className="text-sm font-medium">{label}</span>
    {badge !== undefined && (
      <span
        className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
          active ? "bg-white/20 text-white" : "bg-[#e8f0fb] text-[#1a4e8f]"
        }`}
      >
        {badge}+
      </span>
    )}
  </div>
);

// ── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  tampilan: TampilanRole;
  active: MenuKey;
  onNavigate: (key: MenuKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  tampilan,
  active,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}) => {
  const menus =
    tampilan === "OPD"
      ? OPD_MENUS
      : tampilan === "BPKAD_ADMIN"
        ? BPKAD_ADMIN_MENUS
        : tampilan === "TELAAH_KASUBBID" ||
            tampilan === "TELAAH_KABID" ||
            tampilan === "TELAAH_SEKBAN"
          ? TELAAH_MENUS
          : ADMIN_MENUS;

  const handleNavigate = (key: MenuKey) => {
    onNavigate(key);
    onCloseMobile();
  };

  return (
    <>
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
        <div className="flex items-center justify-between px-5 pt-4 pb-8 lg:justify-start lg:pt-0">
          <SiPuspitaLogo />
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

        <div className="mb-4 flex-1 px-3">
          <p className="mb-2 px-4 text-[10px] font-semibold tracking-widest text-[#b0bac5] uppercase">
            Menu
          </p>
          {menus.map((item) => (
            <NavItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={active === item.key}
              onClick={() => handleNavigate(item.key)}
            />
          ))}
        </div>
      </aside>
    </>
  );
};

// ── Profile Dropdown ──────────────────────────────────────────────────────────

interface ProfileDropdownProps {
  name: string;
  subtitle: string;
  initials: string;
  avatarGradient: string;
  onLogout: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  name,
  subtitle,
  initials,
  avatarGradient,
  onLogout,
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

// ── Notifikasi ───────────────────────────────────────────────────────────────

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

const NOTIFIKASI_STATUS_COLOR: Record<string, string> = {
  teregistrasi: "bg-emerald-500",
  revisi: "bg-amber-500",
  diajukan: "bg-[#1a4e8f]",
};

interface NotificationDropdownProps {
  data: NotifikasiOPD[];
  unreadCount: number;
  isLoading: boolean;
  onTandaiDibaca: (id: string) => void;
  onTandaiSemuaDibaca: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
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
        className="relative hidden h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f] sm:flex"
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
                        : (NOTIFIKASI_STATUS_COLOR[n.status] ?? "bg-[#1a4e8f]")
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${n.dibaca ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}
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

// ── Dropdown notifikasi untuk user INTERNAL_STRUKTURAL & Admin ──

const MILESTONE_NOTIF_COLOR: Record<string, string> = {
  DIAJUKAN: "bg-[#1a4e8f]",
  SUDAH_TELAAH_KASUBBID: "bg-emerald-500",
  SUDAH_TELAAH_KABID: "bg-purple-500",
  SUDAH_TELAAH_SEKBAN: "bg-rose-500",
};

interface NotificationDropdownInternalProps {
  data: NotifikasiInternalRecord[];
  unreadCount: number;
  isLoading: boolean;
  onTandaiDibaca: (id: string) => void;
  onTandaiSemuaDibaca: () => void;
}

const NotificationDropdownInternal: React.FC<
  NotificationDropdownInternalProps
> = ({ data, unreadCount, isLoading, onTandaiDibaca, onTandaiSemuaDibaca }) => {
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
        className="relative hidden h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f] sm:flex"
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
                        : (MILESTONE_NOTIF_COLOR[n.milestone] ?? "bg-[#1a4e8f]")
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

// ── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  tampilan: TampilanRole;
  namaOPD: string | null;
  opdSlug: string | null;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
  notifikasi?: {
    data: NotifikasiOPD[];
    unreadCount: number;
    isLoading: boolean;
    onTandaiDibaca: (id: string) => void;
    onTandaiSemuaDibaca: () => void;
  };
  notifikasiInternal?: {
    data: NotifikasiInternalRecord[];
    unreadCount: number;
    isLoading: boolean;
    onTandaiDibaca: (id: string) => void;
    onTandaiSemuaDibaca: () => void;
  };
}

const Header: React.FC<HeaderProps> = ({
  tampilan,
  namaOPD,
  opdSlug,
  onOpenMobileMenu,
  onLogout,
  notifikasi,
  notifikasiInternal,
}) => {
  const currentUser =
    tampilan === "BPKAD_ADMIN"
      ? {
          name: "BPKAD",
          subtitle: "BPKAD Kab. Kendal",
          initials: "BP",
          avatarGradient: "from-[#1e8fd4] to-[#0e6ba8]",
        }
      : tampilan === "OTHER_ADMIN"
        ? {
            name: "Admin",
            subtitle: "Tim Admin",
            initials: "AD",
            avatarGradient: "from-[#1e8fd4] to-[#0e6ba8]",
          }
        : tampilan === "TELAAH_KASUBBID"
          ? {
              name: "Kasubbid",
              subtitle: "BPKAD Kab. Kendal",
              initials: "KS",
              avatarGradient: "from-[#1e8fd4] to-[#0e6ba8]",
            }
          : tampilan === "TELAAH_KABID"
            ? {
                name: "Kabid",
                subtitle: "BPKAD Kab. Kendal",
                initials: "KB",
                avatarGradient: "from-[#1e8fd4] to-[#0e6ba8]",
              }
            : tampilan === "TELAAH_SEKBAN"
              ? {
                  name: "Sekban",
                  subtitle: "BPKAD Kab. Kendal",
                  initials: "SB",
                  avatarGradient: "from-[#1e8fd4] to-[#0e6ba8]",
                }
              : {
                  name: (opdSlug && OPD_SINGKATAN_BY_SLUG[opdSlug]) || "OPD",
                  subtitle: namaOPD ?? "Operator OPD",
                  initials: (opdSlug && OPD_BADGE_BY_SLUG[opdSlug]) || "OP",
                  avatarGradient: "from-[#e06a3e] to-[#c44d2a]",
                };

  return (
    <header className="flex h-auto min-h-17 shrink-0 flex-wrap items-center gap-3 border-b border-[#f0f0f0] bg-white px-4 py-2.5 sm:px-6 lg:px-8">
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

      <div className="order-3 flex w-full items-center gap-2.5 rounded-xl border border-[#ebebeb] bg-[#f7f8fa] px-4 py-2.5 sm:order-0 sm:w-auto sm:max-w-85 sm:flex-1">
        <IconSearch />
        <span className="flex-1 text-sm text-[#b0bac5]">Search</span>
        <div className="hidden items-center gap-1 rounded-md border border-[#e0e0e0] px-1.5 py-0.5 text-xs text-[#b0bac5] md:flex">
          <span>⌘</span>
          <span>F</span>
        </div>
      </div>
      <div className="flex-1" />

      <button className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f] sm:flex">
        <IconMail />
      </button>

      {notifikasi ? (
        <NotificationDropdown
          data={notifikasi.data}
          unreadCount={notifikasi.unreadCount}
          isLoading={notifikasi.isLoading}
          onTandaiDibaca={notifikasi.onTandaiDibaca}
          onTandaiSemuaDibaca={notifikasi.onTandaiSemuaDibaca}
        />
      ) : notifikasiInternal ? (
        <NotificationDropdownInternal
          data={notifikasiInternal.data}
          unreadCount={notifikasiInternal.unreadCount}
          isLoading={notifikasiInternal.isLoading}
          onTandaiDibaca={notifikasiInternal.onTandaiDibaca}
          onTandaiSemuaDibaca={notifikasiInternal.onTandaiSemuaDibaca}
        />
      ) : (
        <button className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f] sm:flex">
          <IconBell />
        </button>
      )}
      <div className="hidden h-8 w-px bg-[#ebebeb] sm:block" />
      <ProfileDropdown
        name={currentUser.name}
        subtitle={currentUser.subtitle}
        initials={currentUser.initials}
        avatarGradient={currentUser.avatarGradient}
        onLogout={onLogout}
      />
    </header>
  );
};

// ── Empty content placeholder ─────────────────────────────────────────────────

const EmptyContent: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d8e4f5] bg-white/60">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fb] text-[#1a4e8f] opacity-60">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="2" width="16" height="16" rx="3" />
        <path d="M10 7v6M7 10h6" strokeLinecap="round" />
      </svg>
    </div>
    <p className="text-sm font-medium text-[#b0bac5]">— konten {label} —</p>
  </div>
);

// ── Main content area ─────────────────────────────────────────────────────────

interface MainContentProps {
  activeMenu: MenuKey;
  semuaPengajuan: FormulirPenghapusanPiutangOPDRecord[];
  onTambahPengajuan: (record: FormulirPenghapusanPiutangOPDRecord) => void;
  onStatusUpdate: (
    id: string,
    status: StatusFormulir,
    catatan?: string,
    nomorRegistrasi?: string,
  ) => void;
  defaultNamaOPD: string;
}

const MainContent: React.FC<MainContentProps> = ({
  activeMenu,
  semuaPengajuan,
  onTambahPengajuan,
  onStatusUpdate,
  defaultNamaOPD,
}) => {
  const meta = PAGE_META[activeMenu];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f8fa] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-start justify-between leading-snug">
        <div>
          <h1 className="text-lg font-bold text-[#1a1a1a] uppercase sm:text-xl">
            {meta.title}
          </h1>
        </div>
      </div>
      {activeMenu === "ajukan-permohonan" ? (
        <AjukanPermohonanWizard
          onSubmitPengajuan={onTambahPengajuan}
          defaultNamaOPD={defaultNamaOPD}
        />
      ) : activeMenu === "lihat-daftar-pengajuan" ? (
        <DaftarPengajuanOPDBaru
          data={semuaPengajuan}
          namaOPDAktif={defaultNamaOPD}
        />
      ) : activeMenu === "lihat-daftar-pengajuan-admin" ? (
        <LihatDaftarPengajuanAdmin semuaPengajuan={semuaPengajuan} />
      ) : activeMenu === "lihat-daftar-pengajuan-bpkad" ? (
        <LihatDaftarPengajuanBPKAD semuaPengajuan={semuaPengajuan} />
      ) : activeMenu === "register-digital" ? (
        <RegisterDigital semuaPengajuan={semuaPengajuan} />
      ) : activeMenu === "verifikasi-pengajuan" ? (
        <VerifikasiPengajuan
          semuaPengajuan={semuaPengajuan}
          verifikatorId="Admin"
          onStatusUpdate={(id, status, catatan, nomorRegistrasi) =>
            onStatusUpdate(id, status, catatan, nomorRegistrasi)
          }
        />
      ) : activeMenu === "telaah-internal" ? (
        <TelaahInternalAdmin />
      ) : activeMenu === "telaah-saya" ? (
        <TelaahSayaInternal />
      ) : activeMenu === "reviu-inspektorat" ? (
        <ReviuInspektoratAdmin />
      ) : (
        <EmptyContent label={meta.title} />
      )}
    </main>
  );
};

// ── Menu default per role ──────────────────────────────────────────────────────

const DEFAULT_MENU_BY_TAMPILAN: Record<TampilanRole, MenuKey> = {
  OPD: "ajukan-permohonan",
  OTHER_ADMIN: "verifikasi-pengajuan",
  BPKAD_ADMIN: "lihat-daftar-pengajuan-bpkad",
  TELAAH_KASUBBID: "telaah-saya",
  TELAAH_KABID: "telaah-saya",
  TELAAH_SEKBAN: "telaah-saya",
};

// ── Page root ─────────────────────────────────────────────────────────────────

const DashboardContent: React.FC = () => {
  const router = useRouter();

  const { user, isLoading: authLoading, logout } = useAuth();

  // Guard: tidak ada user → redirect ke homepage.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/homepage");
    }
  }, [authLoading, user, router]);

  // Auto-redirect user INTERNAL_STRUKTURAL ke /dashboard-v2/telaah.
  // Baca dari localStorage langsung untuk menghindari race condition
  // dengan useSyncExternalStore (user baru terisi setelah hydration).
  useEffect(() => {
    const raw = window.localStorage.getItem("si-puspita-session");
    if (!raw) return;
    try {
      const session = JSON.parse(raw) as { role?: string };
      if (session.role === "INTERNAL_STRUKTURAL") {
        router.replace("/dashboard-v2/telaah");
      }
    } catch {
      // session corrupt → biarkan guard utama yang handle
    }
  }, [router]);

  // Role dari sesi login.
  const role: UserRole =
    user?.role === "ADMIN"
      ? "ADMIN"
      : user?.role === "INTERNAL_STRUKTURAL"
        ? "INTERNAL_STRUKTURAL"
        : "OPD";

  const tampilan: TampilanRole =
    role === "INTERNAL_STRUKTURAL"
      ? user?.telaahLevel === "kabid"
        ? "TELAAH_KABID"
        : user?.telaahLevel === "sekban"
          ? "TELAAH_SEKBAN"
          : "TELAAH_KASUBBID"
      : role === "ADMIN"
        ? user?.opdSlug === "bpkad"
          ? "BPKAD_ADMIN"
          : "OTHER_ADMIN"
        : "OPD";

  const [activeMenu, setActiveMenu] = useState<MenuKey>(
    DEFAULT_MENU_BY_TAMPILAN[tampilan],
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Reset activeMenu saat tampilan berubah (login user lain di tab sama).
  const [prevTampilan, setPrevTampilan] = useState(tampilan);
  if (tampilan !== prevTampilan) {
    setPrevTampilan(tampilan);
    setActiveMenu(DEFAULT_MENU_BY_TAMPILAN[tampilan]);
    setMobileMenuOpen(false);
  }

  const {
    data: semuaPengajuan,
    tambahPengajuan,
    updatePengajuan,
    getPengajuanById,
  } = usePengajuanStore();

  // Notifikasi OPD (existing)
  const opdId =
    role === "OPD" && user?.opdSlug
      ? String(getOpdBySlug(user.opdSlug)?.id ?? "")
      : undefined;
  const notifikasiOpd = useNotifikasiOPD(opdId || undefined);

  // Notifikasi internal (untuk INTERNAL_STRUKTURAL + ADMIN)
  const notifikasiInternal = useNotifikasiInternal(
    role === "INTERNAL_STRUKTURAL" || role === "ADMIN"
      ? user?.username
      : undefined,
  );

  const handleTambahPengajuan = (
    record: FormulirPenghapusanPiutangOPDRecord,
  ) => {
    tambahPengajuan(record);
  };

  const handleStatusUpdate = (
    id: string,
    status: StatusFormulir,
    catatan?: string,
    nomorRegistrasi?: string,
  ) => {
    updatePengajuan(id, {
      status,
      verifikatorId: "Admin",
      tanggalVerifikasi: new Date().toISOString(),
      catatanVerifikasi: catatan,
      ...(nomorRegistrasi ? { nomorRegistrasi } : {}),
    });

    const pengajuan = getPengajuanById(id);
    if (pengajuan) {
      kirimNotifikasiVerifikasi(pengajuan, status, catatan);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/homepage");
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f7f8fa]">
        <p className="text-sm text-[#7a8899]">Memuat sesi…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f8fa] font-sans">
      <Sidebar
        tampilan={tampilan}
        active={activeMenu}
        onNavigate={setActiveMenu}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          tampilan={tampilan}
          namaOPD={user.namaOPD}
          opdSlug={user.opdSlug}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
          notifikasi={
            role === "OPD"
              ? {
                  data: notifikasiOpd.data,
                  unreadCount: notifikasiOpd.unreadCount,
                  isLoading: notifikasiOpd.isLoading,
                  onTandaiDibaca: notifikasiOpd.tandaiDibaca,
                  onTandaiSemuaDibaca: notifikasiOpd.tandaiSemuaDibaca,
                }
              : undefined
          }
          notifikasiInternal={
            role === "INTERNAL_STRUKTURAL" || role === "ADMIN"
              ? {
                  data: notifikasiInternal.data,
                  unreadCount: notifikasiInternal.unreadCount,
                  isLoading: notifikasiInternal.isLoading,
                  onTandaiDibaca: notifikasiInternal.tandaiDibaca,
                  onTandaiSemuaDibaca: notifikasiInternal.tandaiSemuaDibaca,
                }
              : undefined
          }
        />
        <MainContent
          activeMenu={activeMenu}
          semuaPengajuan={semuaPengajuan}
          onTambahPengajuan={handleTambahPengajuan}
          onStatusUpdate={handleStatusUpdate}
          defaultNamaOPD={user.namaOPD ?? ""}
        />
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
