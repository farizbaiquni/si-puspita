"use client";

import React, { useState, useRef, useEffect } from "react";

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

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="10" y="1" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="1" y="10" width="7" height="7" rx="1.5" fill="currentColor" />
    <rect x="10" y="10" width="7" height="7" rx="1.5" fill="currentColor" />
  </svg>
);
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
    badge: 5,
  },
];

const BPKAD_MENUS: MenuItem[] = [
  {
    key: "verifikasi-pengajuan",
    icon: <IconChecklist />,
    label: "Verifikasi Pengajuan",
    badge: 8,
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
    title: "Ajukan Permohonan",
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

const DonezoLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-full border-2 border-[#1a4e8f] flex items-center justify-center">
      <div className="w-3.5 h-3.5 rounded-full border-2 border-[#1a4e8f] relative">
        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-[#1a4e8f] rounded-full" />
      </div>
    </div>
    <span className="text-[#1a1a1a] font-semibold text-lg tracking-tight">
      Donezo
    </span>
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
    className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
      active
        ? "bg-[#1a4e8f] text-white"
        : "text-[#7a8899] hover:bg-[#f0f4fb] hover:text-[#1a4e8f]"
    }`}
  >
    <span>{icon}</span>
    <span className="text-sm font-medium">{label}</span>
    {badge !== undefined && (
      <span
        className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
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
    <aside className="w-60 min-h-screen bg-white flex flex-col border-r border-[#f0f0f0] shrink-0">
      <div className="px-5 pt-7 pb-8">
        <DonezoLogo />
      </div>

      {/* Dynamic menu based on role */}
      <div className="px-3 mb-4 flex-1">
        <p className="text-[10px] font-semibold text-[#b0bac5] tracking-widest uppercase px-4 mb-2">
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
      <div className="px-3 border-t border-[#f0f0f0] pt-3 pb-3">
        <p className="text-[10px] font-semibold text-[#b0bac5] tracking-widest uppercase px-4 mb-2">
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
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#ebebeb] bg-white hover:bg-[#f7f8fa] text-[#1a1a1a] text-sm font-medium transition-colors"
      >
        <IconUsers />
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[role]}`}
        >
          {role}
        </span>
        <IconChevronDown />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-44 bg-white border border-[#ebebeb] rounded-xl shadow-lg z-50 overflow-hidden py-1">
          <p className="text-[10px] font-semibold text-[#b0bac5] tracking-widest uppercase px-4 py-2">
            Pilih User
          </p>
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                role === r
                  ? "bg-[#f0f4fb] text-[#1a4e8f] font-medium"
                  : "text-[#4a5568] hover:bg-[#f7f8fa]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
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

const Header: React.FC<HeaderProps> = ({ role, onRoleChange }) => (
  <header className="h-17 bg-white border-b border-[#f0f0f0] flex items-center px-8 gap-4 shrink-0">
    <div className="flex items-center gap-2.5 bg-[#f7f8fa] border border-[#ebebeb] rounded-xl px-4 py-2.5 flex-1 max-w-85">
      <IconSearch />
      <span className="text-[#b0bac5] text-sm flex-1">Search task</span>
      <div className="flex items-center gap-1 text-[#b0bac5] text-xs border border-[#e0e0e0] rounded-md px-1.5 py-0.5">
        <span>⌘</span>
        <span>F</span>
      </div>
    </div>
    <div className="flex-1" />

    {/* Role Dropdown */}
    <RoleDropdown role={role} onChange={onRoleChange} />

    <button className="w-9 h-9 flex items-center justify-center text-[#7a8899] hover:text-[#1a4e8f] hover:bg-[#f0f4fb] rounded-xl transition-colors">
      <IconMail />
    </button>
    <button className="w-9 h-9 flex items-center justify-center text-[#7a8899] hover:text-[#1a4e8f] hover:bg-[#f0f4fb] rounded-xl transition-colors">
      <IconBell />
    </button>
    <div className="w-px h-8 bg-[#ebebeb]" />
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#f4a07a] to-[#e07858] flex items-center justify-center text-white text-sm font-semibold">
        TM
      </div>
      <div className="flex flex-col">
        <span className="text-[#1a1a1a] text-sm font-semibold leading-tight">
          Totok Michael
        </span>
        <span className="text-[#b0bac5] text-xs">tmichael20@mail.com</span>
      </div>
    </div>
  </header>
);

// ── Empty content placeholder ─────────────────────────────────────────────────

const EmptyContent: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-[#d8e4f5] bg-white/60 gap-3">
    <div className="w-10 h-10 rounded-full bg-[#e8f0fb] flex items-center justify-center text-[#1a4e8f] opacity-60">
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
    <p className="text-[#b0bac5] text-sm font-medium">— konten {label} —</p>
  </div>
);

// ── Main content area ─────────────────────────────────────────────────────────

interface MainContentProps {
  activeMenu: MenuKey;
}

const MainContent: React.FC<MainContentProps> = ({ activeMenu }) => {
  const meta = PAGE_META[activeMenu];

  return (
    <main className="flex-1 bg-[#f7f8fa] p-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">
            {meta.title}
          </h1>
          <p className="text-[#9aa5b4] text-sm">{meta.subtitle}</p>
        </div>
        {meta.action && (
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-[#1a4e8f] hover:bg-[#153d7a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              <span className="text-lg leading-none">+</span>
              {meta.action.label}
            </button>
          </div>
        )}
      </div>
      <EmptyContent label={meta.title} />
    </main>
  );
};

// ── Page root ─────────────────────────────────────────────────────────────────

export default function DonezoPage() {
  const [role, setRole] = useState<UserRole>("OPD");
  const [activeMenu, setActiveMenu] = useState<MenuKey>("ajukan-permohonan");

  // Reset active menu when role changes
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setActiveMenu(
      newRole === "OPD" ? "ajukan-permohonan" : "verifikasi-pengajuan",
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f8fa] font-sans">
      <Sidebar role={role} active={activeMenu} onNavigate={setActiveMenu} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header role={role} onRoleChange={handleRoleChange} />
        <MainContent activeMenu={activeMenu} />
      </div>
    </div>
  );
}
