"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AjukanPermohonanWizard from "./contents/opd/ajukan-permohonan/AjukanPermohonan";
import DaftarPengajuanOPDBaru from "./contents/opd/lihat-daftar-pengajuan/LihatDaftarPengajuan";
import VerifikasiPengajuan from "./contents/bpkad/verifikasi-pengajuan/VerifikasiPengajuan";
import Link from "next/link";
import Image from "next/image";

import {
  IconFilePlus,
  IconList,
  IconChecklist,
  IconEye,
  IconSettings,
  IconHelp,
  IconLogout,
  IconSearch,
  IconMail,
  IconBell,
  IconChevronDown,
  IconUsers,
} from "./icons";
import { MOCK_DATA } from "./contents/dummyData";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  StatusFormulir,
} from "@/types/types-v2";

// ── Types ────────────────────────────────────────────────────────────────────

type UserRole = "OPD" | "BPKAD";

type OPDMenuKey = "ajukan-permohonan" | "lihat-daftar-pengajuan";

type BPKADMenuKey = "verifikasi-pengajuan" | "lihat-pengajuan";

type MenuKey = OPDMenuKey | BPKADMenuKey;

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
};

// ── Logo ─────────────────────────────────────────────────────────────────────

const SiPuspitaLogo = () => (
  <div className="relative">
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
  semuaPengajuan: FormulirPenghapusanPiutangOPDRecord[];
  onStatusUpdate: (
    id: string,
    status: StatusFormulir,
    catatan?: string,
    checklistSubstantif?: Record<string, boolean>,
  ) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  activeMenu,
  semuaPengajuan,
  onStatusUpdate,
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
        <DaftarPengajuanOPDBaru data={semuaPengajuan} />
      ) : activeMenu === "verifikasi-pengajuan" ? (
        <VerifikasiPengajuan
          semuaPengajuan={semuaPengajuan}
          verifikatorId="BPKAD"
          onStatusUpdate={(id, status, catatan, checklistSubstantif) =>
            onStatusUpdate(id, status, catatan, checklistSubstantif)
          }
        />
      ) : (
        <EmptyContent label={meta.title} />
      )}
    </main>
  );
};

// ── URL <-> Role helpers ───────────────────────────────────────────────────────

const ROLE_QUERY_PARAM = "user-role";

const DEFAULT_MENU_BY_ROLE: Record<UserRole, MenuKey> = {
  OPD: "ajukan-permohonan",
  BPKAD: "verifikasi-pengajuan",
};

/** Parse role dari query param, fallback ke "OPD" bila tidak ada / tidak valid. */
const parseRoleFromParam = (value: string | null): UserRole => {
  if (value?.toLowerCase() === "bpkad") return "BPKAD";
  return "OPD";
};

// ── Page root ─────────────────────────────────────────────────────────────────

const DashboardContent: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Role dijadikan derived state dari URL (?user-role=opd | bpkad), bukan
  // state internal, supaya URL selalu jadi single source of truth.
  const role = parseRoleFromParam(searchParams.get(ROLE_QUERY_PARAM));

  const [activeMenu, setActiveMenu] = useState<MenuKey>(
    DEFAULT_MENU_BY_ROLE[role],
  );

  // Lacak role sebelumnya supaya bisa reset activeMenu saat role berubah
  // (mis. lewat URL back/forward, link luar), TANPA pakai useEffect.
  // Pola ini "adjusting state during render" — direkomendasikan React
  // untuk kasus reset state akibat perubahan prop/derived value, karena
  // tidak memicu render tambahan yang sempat ter-commit ke layar.
  const [prevRole, setPrevRole] = useState(role);
  if (role !== prevRole) {
    setPrevRole(role);
    setActiveMenu(DEFAULT_MENU_BY_ROLE[role]);
  }

  const [semuaPengajuan, setSemuaPengajuan] = useState<
    FormulirPenghapusanPiutangOPDRecord[]
  >(() => [...MOCK_DATA]);

  const handleRoleChange = (newRole: UserRole) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(ROLE_QUERY_PARAM, newRole.toLowerCase());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusUpdate = (
    id: string,
    status: StatusFormulir,
    _catatan?: string,
    checklistSubstantif?: Record<string, boolean>,
  ) => {
    setSemuaPengajuan((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              // Jejak audit verifikasi — hanya diisi saat keputusan berasal
              // dari panel verifikasi (checklistSubstantif ada isinya).
              ...(checklistSubstantif
                ? {
                    checklistSubstantif,
                    verifikatorId: "BPKAD",
                    tanggalVerifikasi: new Date().toISOString(),
                  }
                : {}),
            }
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
          onStatusUpdate={handleStatusUpdate}
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
