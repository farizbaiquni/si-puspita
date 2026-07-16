"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AjukanPermohonanWizard from "./contents/opd/ajukan-permohonan/AjukanPermohonan";
import DaftarPengajuanOPDBaru from "./contents/opd/lihat-daftar-pengajuan/LihatDaftarPengajuan";
import VerifikasiPengajuan from "./contents/bpkad/verifikasi-pengajuan/VerifikasiPengajuan";
import LihatDaftarPengajuanAdmin from "./contents/bpkad/lihat-daftar-pengajuan-admin/lihat-daftar-pengajuan-admin";
import RegisterDigital from "./contents/bpkad/register-digital/register-digital";
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
import { usePengajuanStore } from "@/store/pengajuan-store";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  StatusFormulir,
} from "@/types/types-v2";

// ── Types ────────────────────────────────────────────────────────────────────

type UserRole = "OPD" | "BPKAD";

// Label tampilan di UI — value internal role tetap "BPKAD" (dipakai di
// URL param, logika menu, dll), tapi yang dilihat user cukup "Admin".
const ROLE_LABEL: Record<UserRole, string> = {
  OPD: "OPD",
  BPKAD: "Admin",
};

type OPDMenuKey = "ajukan-permohonan" | "lihat-daftar-pengajuan";

type BPKADMenuKey =
  | "verifikasi-pengajuan"
  | "lihat-daftar-pengajuan-admin"
  | "register-digital";

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
    key: "lihat-daftar-pengajuan-admin",
    icon: <IconEye />,
    label: "Lihat Pengajuan",
  },
  {
    key: "register-digital",
    icon: <IconList />,
    label: "Register Digital",
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
  role: UserRole;
  active: MenuKey;
  onNavigate: (key: MenuKey) => void;
  /** Status drawer terbuka di layar sempit (mobile/tablet). Diabaikan di lg+. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  role,
  active,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}) => {
  const menus = role === "OPD" ? OPD_MENUS : BPKAD_MENUS;

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

        <div className="border-t border-[#f0f0f0] px-3 pt-3 pb-3">
          <p className="mb-2 px-4 text-[10px] font-semibold tracking-widest text-[#b0bac5] uppercase">
            General
          </p>
          <NavItem
            icon={<IconSettings />}
            label="Settings"
            onClick={() => {}}
          />
          <NavItem icon={<IconHelp />} label="Help" onClick={() => {}} />
          <NavItem icon={<IconLogout />} label="Logout" onClick={() => {}} />
        </div>
      </aside>
    </>
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
          {ROLE_LABEL[role]}
        </span>
        <IconChevronDown />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-[#ebebeb] bg-white py-1 shadow-lg">
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
              {ROLE_LABEL[r]}
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
  onOpenMobileMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({
  role,
  onRoleChange,
  onOpenMobileMenu,
}) => {
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
      name: "Admin",
      subtitle: "Tim Admin",
      initials: "AD",
      avatarGradient: "from-[#1e8fd4] to-[#0e6ba8]",
    },
  };

  const currentUser = userData[role];

  return (
    <header className="flex h-auto min-h-17 shrink-0 flex-wrap items-center gap-3 border-b border-[#f0f0f0] bg-white px-4 py-2.5 sm:px-6 lg:px-8">
      {/* Tombol menu, hanya tampil di layar < lg (sidebar jadi drawer) */}
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

      {/* Kotak pencarian: disembunyikan di layar paling sempit, ringkas di tablet */}
      <div className="order-3 flex w-full items-center gap-2.5 rounded-xl border border-[#ebebeb] bg-[#f7f8fa] px-4 py-2.5 sm:order-0 sm:w-auto sm:max-w-85 sm:flex-1">
        <IconSearch />
        <span className="flex-1 text-sm text-[#b0bac5]">Search</span>
        <div className="hidden items-center gap-1 rounded-md border border-[#e0e0e0] px-1.5 py-0.5 text-xs text-[#b0bac5] md:flex">
          <span>⌘</span>
          <span>F</span>
        </div>
      </div>
      <div className="flex-1" />

      <RoleDropdown role={role} onChange={onRoleChange} />

      <button className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f] sm:flex">
        <IconMail />
      </button>
      <button className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#7a8899] transition-colors hover:bg-[#f0f4fb] hover:text-[#1a4e8f] sm:flex">
        <IconBell />
      </button>
      <div className="hidden h-8 w-px bg-[#ebebeb] sm:block" />
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${currentUser.avatarGradient} text-sm font-semibold text-white`}
        >
          {currentUser.initials}
        </div>
        <div className="hidden flex-col md:flex">
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
  onTambahPengajuan: (record: FormulirPenghapusanPiutangOPDRecord) => void;
  onStatusUpdate: (
    id: string,
    status: StatusFormulir,
    catatan?: string,
    nomorRegistrasi?: string,
  ) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  activeMenu,
  semuaPengajuan,
  onTambahPengajuan,
  onStatusUpdate,
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
        <AjukanPermohonanWizard onSubmitPengajuan={onTambahPengajuan} />
      ) : activeMenu === "lihat-daftar-pengajuan" ? (
        <DaftarPengajuanOPDBaru data={semuaPengajuan} />
      ) : activeMenu === "lihat-daftar-pengajuan-admin" ? (
        <LihatDaftarPengajuanAdmin semuaPengajuan={semuaPengajuan} />
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

  // Status drawer sidebar untuk layar < lg (mobile/tablet).
  // Ditutup langsung di tempat kejadian (handleRoleChange, blok penyesuaian
  // role di bawah, dan di dalam Sidebar saat navigasi menu) — bukan lewat
  // useEffect, supaya tidak memicu cascading render.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lacak role sebelumnya supaya bisa reset activeMenu saat role berubah
  // (mis. lewat URL back/forward, link luar), TANPA pakai useEffect.
  // Pola ini "adjusting state during render" — direkomendasikan React
  // untuk kasus reset state akibat perubahan prop/derived value, karena
  // tidak memicu render tambahan yang sempat ter-commit ke layar.
  const [prevRole, setPrevRole] = useState(role);
  if (role !== prevRole) {
    setPrevRole(role);
    setActiveMenu(DEFAULT_MENU_BY_ROLE[role]);
    setMobileMenuOpen(false);
  }

  // Sumber data tunggal (shared lewat PengajuanProvider di root layout) —
  // pengganti useState lokal + MOCK_DATA. Sekarang otomatis sinkron
  // dengan ModalLacak di homepage dan tab/route lain.
  const {
    data: semuaPengajuan,
    tambahPengajuan,
    updatePengajuan,
  } = usePengajuanStore();

  const handleRoleChange = (newRole: UserRole) => {
    setMobileMenuOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set(ROLE_QUERY_PARAM, newRole.toLowerCase());
    router.push(`${pathname}?${params.toString()}`);
  };

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
      // Jejak audit verifikasi — handler ini hanya dipanggil dari panel
      // verifikasi Admin, jadi selalu diisi.
      verifikatorId: "Admin",
      tanggalVerifikasi: new Date().toISOString(),
      catatanVerifikasi: catatan,
      // Hanya terisi saat keputusan "Lolos Verifikasi" (teregistrasi) —
      // digenerate di VerifikasiPengajuan dan diteruskan sampai sini
      // supaya tersimpan di store dan muncul di ModalLacak homepage.
      ...(nomorRegistrasi ? { nomorRegistrasi } : {}),
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f8fa] font-sans">
      <Sidebar
        role={role}
        active={activeMenu}
        onNavigate={setActiveMenu}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          role={role}
          onRoleChange={handleRoleChange}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <MainContent
          activeMenu={activeMenu}
          semuaPengajuan={semuaPengajuan}
          onTambahPengajuan={handleTambahPengajuan}
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
