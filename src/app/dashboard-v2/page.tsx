"use client";

import React, { useState, useRef, useEffect } from "react";
import AjukanPermohonanWizard from "./contents/opd/ajukan-permohonan/AjukanPermohonan";
import LihatDaftarPengajuan, {
  MOCK_PENGAJUAN,
} from "./contents/opd/lihat-daftar-pengajuan/LihatDaftarPengajuan";

import VerifikasiPengajuan from "./contents/bpkad/verifikasi-pengajuan/VerifikasiPengajuan";
import Link from "next/link";
import type { Pengajuan } from "@/types/types";
import Image from "next/image";

// ── Types ────────────────────────────────────────────────────────────────────

type UserRole = "OPD" | "BPKAD";

type OPDMenuKey = "ajukan-permohonan" | "lihat-daftar-pengajuan";

type BPKADMenuKey =
  | "verifikasi-pengajuan"
  | "lihat-pengajuan"
  | "pengajuan-pupn"
  | "pengajuan-non-pupn";

type MenuKey = OPDMenuKey | BPKADMenuKey;

// ── Icons ────────────────────────────────────────────────────────────────────

const IconFilePlus = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M10.5 2H4.5A1.5 1.5 0 003 3.5v11A1.5 1.5 0 004.5 16h9A1.5 1.5 0 0015 14.5V6.5L10.5 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10.5 2v4.5H15M9 8.5v4M7 10.5h4" strokeLinecap="round" />
  </svg>
);
const IconList = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M3 5h12M3 9h12M3 13h8" strokeLinecap="round" />
  </svg>
);
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
const IconEye = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M1.5 9s3-5.5 7.5-5.5S16.5 9 16.5 9s-3 5.5-7.5 5.5S1.5 9 1.5 9z" />
    <circle cx="9" cy="9" r="2" />
  </svg>
);
const IconBank = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M2 7.5L9 2l7 5.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="2" y="7.5" width="14" height="1.5" />
    <path d="M4 9v5M7.5 9v5M10.5 9v5M14 9v5M2 14h14" strokeLinecap="round" />
  </svg>
);
const IconFileOff = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M10.5 2H4.5A1.5 1.5 0 003 3.5v11A1.5 1.5 0 004.5 16h9A1.5 1.5 0 0015 14.5V6.5L10.5 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10.5 2v4.5H15M7 10l4 2M11 10l-4 2" strokeLinecap="round" />
  </svg>
);
const IconSettings = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="9" cy="9" r="2.5" />
    <path
      d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.6 3.6l1.4 1.4M13 13l1.4 1.4M3.6 14.4l1.4-1.4M13 5l1.4-1.4"
      strokeLinecap="round"
    />
  </svg>
);
const IconHelp = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="9" cy="9" r="7.5" />
    <path
      d="M6.75 6.75a2.25 2.25 0 114.5 0c0 1.5-2.25 1.75-2.25 3.25"
      strokeLinecap="round"
    />
    <circle cx="9" cy="13" r=".75" fill="currentColor" stroke="none" />
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
const IconSearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="7" cy="7" r="5" />
    <path d="M11 11l3 3" strokeLinecap="round" />
  </svg>
);
const IconMail = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="4" width="16" height="12" rx="2" />
    <path d="M2 7l8 5 8-5" strokeLinecap="round" />
  </svg>
);
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
const IconUsers = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="6" cy="5" r="2.5" />
    <path d="M1 14c0-2.76 2.24-5 5-5" strokeLinecap="round" />
    <circle cx="11" cy="5" r="2.5" />
    <path d="M8.5 14c0-2.76 2.24-5 5-5" strokeLinecap="round" />
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

const BPKAD_MENUS: MenuItem[] = [
  {
    key: "verifikasi-pengajuan",
    icon: <IconChecklist />,
    label: "Verifikasi Pengajuan",
  },
  {
    key: "lihat-pengajuan",
    icon: <IconEye />,
    label: "Lihat Pengajuan",
  },
  {
    key: "pengajuan-pupn",
    icon: <IconBank />,
    label: "Pengajuan PUPN",
  },
  {
    key: "pengajuan-non-pupn",
    icon: <IconFileOff />,
    label: "Pengajuan Non-PUPN",
  },
];

const PAGE_META: Record<
  MenuKey,
  { title: string; subtitle: string; action?: { label: string } }
> = {
  "ajukan-permohonan": {
    title: "Ajukan Permohonan Penghapusan Piutang",
    subtitle: "Buat dan kirimkan permohonan baru kepada BPKAD.",
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
  "lihat-pengajuan": {
    title: "Lihat Pengajuan",
    subtitle: "Tampilkan semua pengajuan yang telah diproses.",
  },
  "pengajuan-pupn": {
    title: "Pengajuan PUPN",
    subtitle: "Kelola pengajuan yang masuk melalui jalur PUPN.",
    action: { label: "Tambah Pengajuan" },
  },
  "pengajuan-non-pupn": {
    title: "Pengajuan Non-PUPN",
    subtitle: "Kelola pengajuan yang masuk melalui jalur Non-PUPN.",
    action: { label: "Tambah Pengajuan" },
  },
};

// ── Logo ─────────────────────────────────────────────────────────────────────

const SiPuspitaLogo = () => (
  <div className="relative">
    {/* Logo */}
    <Link href="/homepage">
      <Image
        src="/Logo_Si-Puspita_v1.png"
        alt="Logo"
        width={640}
        height={640}
        quality={100}
        priority
        className="w-40 bg-white"
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
  role: UserRole;
  active: MenuKey;
  onNavigate: (key: MenuKey) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, active, onNavigate }) => {
  const menus = role === "OPD" ? OPD_MENUS : BPKAD_MENUS;

  return (
    <aside className="flex min-h-screen w-60 shrink-0 flex-col border-r border-[#f0f0f0] bg-white">
      <div className="px-5 pb-8">
        <SiPuspitaLogo />
      </div>

      {/* Dynamic menu based on role */}
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
            onClick={() => onNavigate(item.key)}
          />
        ))}
      </div>

      {/* General — always shown */}
      <div className="border-t border-[#f0f0f0] px-3 pt-3 pb-3">
        <p className="mb-2 px-4 text-[10px] font-semibold tracking-widest text-[#b0bac5] uppercase">
          General
        </p>
        <NavItem icon={<IconSettings />} label="Settings" onClick={() => {}} />
        <NavItem icon={<IconHelp />} label="Help" onClick={() => {}} />
        <NavItem icon={<IconLogout />} label="Logout" onClick={() => {}} />
      </div>
    </aside>
  );
};

// ── Role Dropdown ─────────────────────────────────────────────────────────────

interface RoleDropdownProps {
  role: UserRole;
  onChange: (role: UserRole) => void;
}

const RoleDropdown: React.FC<RoleDropdownProps> = ({ role, onChange }) => {
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

  const roles: UserRole[] = ["OPD", "BPKAD"];

  const roleColors: Record<UserRole, string> = {
    OPD: "bg-[#e8f0fb] text-[#1a4e8f]",
    BPKAD: "bg-[#e1f5ee] text-[#0f6e56]",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-[#ebebeb] bg-white px-3 py-2 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-[#f7f8fa]"
      >
        <IconUsers />
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roleColors[role]}`}
        >
          {role}
        </span>
        <IconChevronDown />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-[#ebebeb] bg-white py-1 shadow-lg">
          <p className="px-4 py-2 text-[10px] font-semibold tracking-widest text-[#b0bac5] uppercase">
            Pilih User
          </p>
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                role === r
                  ? "bg-[#f0f4fb] font-medium text-[#1a4e8f]"
                  : "text-[#4a5568] hover:bg-[#f7f8fa]"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  role === r ? "bg-[#1a4e8f]" : "bg-[#d1d8e0]"
                }`}
              />
              {r}
              {role === r && (
                <span className="ml-auto text-[10px] text-[#1a4e8f]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ role, onRoleChange }) => {
  // Data user berdasarkan role
  const userData: Record<
    UserRole,
    {
      name: string;
      subtitle: string;
      initials: string;
      avatarGradient: string;
    }
  > = {
    OPD: {
      name: "Disdagkop UKM",
      subtitle: "Dinas Perdagangan Koperasi dan UKM",
      initials: "D",
      avatarGradient: "from-[#e06a3e] to-[#c44d2a]",
    },
    BPKAD: {
      name: "BPKAD",
      subtitle: "Badan Pengelolaan Keuangan dan Aset Daerah",
      initials: "BK",
      avatarGradient: "from-[#1e8fd4] to-[#0e6ba8]",
    },
  };

  const currentUser = userData[role];

  return (
    <header className="flex h-17 shrink-0 items-center gap-4 border-b border-[#f0f0f0] bg-white px-8">
      <div className="flex max-w-85 flex-1 items-center gap-2.5 rounded-xl border border-[#ebebeb] bg-[#f7f8fa] px-4 py-2.5">
        <IconSearch />
        <span className="flex-1 text-sm text-[#b0bac5]">Search</span>
        <div className="flex items-center gap-1 rounded-md border border-[#e0e0e0] px-1.5 py-0.5 text-xs text-[#b0bac5]">
          <span>⌘</span>
          <span>F</span>
        </div>
      </div>
      <div className="flex-1" />

      {/* Role Dropdown */}
      <RoleDropdown role={role} onChange={onRoleChange} />

      <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f]">
        <IconMail />
      </button>
      <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f]">
        <IconBell />
      </button>
      <div className="h-8 w-px bg-[#ebebeb]" />
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${currentUser.avatarGradient} text-sm font-semibold text-white`}
        >
          {currentUser.initials}
        </div>
        <div className="flex flex-col">
          <span className="text-sm leading-tight font-semibold text-slate-800">
            {currentUser.name}
          </span>
          <span className="text-xs text-slate-500">{currentUser.subtitle}</span>
        </div>
      </div>
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
  semuaPengajuan: Pengajuan[];
  onPengajuanBaru: (p: Pengajuan) => void;
  onStatusUpdate: (
    id: string,
    status: Pengajuan["status"],
    catatan?: string,
  ) => void;
  onLihatDaftar: () => void;
}

const MainContent: React.FC<MainContentProps> = ({
  activeMenu,
  semuaPengajuan,
  onPengajuanBaru,
  onStatusUpdate,
  onLihatDaftar,
}) => {
  const meta = PAGE_META[activeMenu];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f7f8fa] px-8 py-4">
      <div className="mb-4 flex items-start justify-between leading-snug">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a] uppercase">
            {meta.title}
          </h1>
        </div>
      </div>
      {activeMenu === "ajukan-permohonan" ? (
        <AjukanPermohonanWizard />
      ) : activeMenu === "lihat-daftar-pengajuan" ? (
        <LihatDaftarPengajuan semuaPengajuan={semuaPengajuan} />
      ) : activeMenu === "verifikasi-pengajuan" ? (
        <VerifikasiPengajuan
          semuaPengajuan={semuaPengajuan}
          onStatusUpdate={onStatusUpdate}
        />
      ) : (
        <EmptyContent label={meta.title} />
      )}
    </main>
  );
};

// ── Page root ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [role, setRole] = useState<UserRole>("OPD");
  const [activeMenu, setActiveMenu] = useState<MenuKey>("ajukan-permohonan");

  // ── Single source of truth untuk semua pengajuan ──────────────────────────
  // Dimulai dari MOCK_PENGAJUAN yang di-import dari LihatDaftarPengajuan
  const [semuaPengajuan, setSemuaPengajuan] = useState<Pengajuan[]>(() => [
    ...MOCK_PENGAJUAN,
  ]);

  // Reset active menu when role changes
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setActiveMenu(
      newRole === "OPD" ? "ajukan-permohonan" : "verifikasi-pengajuan",
    );
  };

  // Tambah pengajuan baru dari wizard OPD — status DIAJUKAN langsung masuk antrean
  const handlePengajuanBaru = (p: Pengajuan) => {
    setSemuaPengajuan((prev) => [p, ...prev]);
  };

  // Update status setelah verifikasi BPKAD (DISETUJUI / DITOLAK)
  const handleStatusUpdate = (
    id: string,
    status: Pengajuan["status"],
    catatan?: string,
  ) => {
    setSemuaPengajuan((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status, catatanReviewer: catatan || p.catatanReviewer }
          : p,
      ),
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f8fa] font-sans">
      <Sidebar role={role} active={activeMenu} onNavigate={setActiveMenu} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header role={role} onRoleChange={handleRoleChange} />
        <MainContent
          activeMenu={activeMenu}
          semuaPengajuan={semuaPengajuan}
          onPengajuanBaru={handlePengajuanBaru}
          onStatusUpdate={handleStatusUpdate}
          onLihatDaftar={() => setActiveMenu("lihat-daftar-pengajuan")}
        />
      </div>
    </div>
  );
}
