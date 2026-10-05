"use client";

/* ------------------------------------------------------------------ */
/*  TelaahSayaInternal.tsx                                             */
/*  "Ruang Telaah" untuk user INTERNAL_STRUKTURAL                      */
/*  (Kasubbid / Kabid / Sekban).                                       */
/*                                                                      */
/*  2 tab:                                                             */
/*   - "Antrean Saya"  → telaah yang tahapSaatIni === tahap user.      */
/*   - "Riwayat Telaah" → telaah yang riwayat-nya mengandung entry      */
/*     dari user ini.                                                  */
/*                                                                      */
/*  Filter: Search + Filter OPD (dropdown) + Filter status chips       */
/*  (khusus tab Riwayat).                                              */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { useAuth } from "@/store/auth-store";
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import {
  TELAAH_TAHAP_BY_LEVEL,
  TELAAH_TAHAP_LABEL,
  TELAAH_LEVEL_LABEL,
  TELAAH_LEVEL_SUBTITLE,
  type TelaahInternalRecord,
} from "@/types/telaah-internal";
import { formatTanggalWaktu } from "./TelaahDokumenShared";
import DetailTelaah from "./DetailTelaah";

/* ==================== Ikon ==================== */

const IconSearch = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="6.5" cy="6.5" r="4.5" />
    <path d="M10 10l3 3" strokeLinecap="round" />
  </svg>
);

const IconClose = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
  </svg>
);

const IconFilter = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M1.5 3.5h12M4 7.5h7M6.5 11.5h2" strokeLinecap="round" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      d="M3 8l3.5 3.5L13 4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCheckBig = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
  >
    <path
      d="M4 11l4.5 4.5L18 6.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClock = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5v3.5l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrowDownRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M4 4l6 6M10 10H5M10 10V5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconBuilding = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M5 19V4a1 1 0 011-1h10a1 1 0 011 1v15" strokeLinecap="round" />
    <path
      d="M3 19h16M8 7h1.5M12.5 7H14M8 11h1.5M12.5 11H14M8 15h1.5M12.5 15H14"
      strokeLinecap="round"
    />
  </svg>
);

const IconHourglass = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M6 3h10M6 19h10M7 3v3c0 2 3 3.5 4 5 1-1.5 4-3 4-5V3M7 19v-3c0-2 3-3.5 4-5 1 1.5 4 3 4 5v3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconInbox = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M3 10l2-6h10l2 6v5a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 10h4l1 2h4l1-2h4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconHistory = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path d="M10 5v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 3.5v3h3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 6.5A7 7 0 1110 17a7 7 0 01-6.5-4.7" strokeLinecap="round" />
  </svg>
);

const IconSparkles = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M10 3v3M10 14v3M3 10h3M14 10h3M5.2 5.2l2.1 2.1M12.7 12.7l2.1 2.1M5.2 14.8l2.1-2.1M12.7 7.3l2.1-2.1"
      strokeLinecap="round"
    />
  </svg>
);

const IconBadge = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="8" cy="6" r="3.5" />
    <path
      d="M5 10.5V14l3-1.5L11 14v-3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ==================== Tipe ==================== */

type TabKey = "antrean" | "riwayat";
type FilterStatus = "semua" | "diproses" | "selesai";

/* ==================== Helper ==================== */

function ambilWaktuEntrySaya(
  t: TelaahInternalRecord,
  username: string,
): number {
  const entries = t.riwayat.filter((r) => r.olehUsername === username);
  if (entries.length === 0) return 0;
  return new Date(entries[entries.length - 1].timestamp).getTime();
}

function ambilEntryTerakhirSaya(
  t: TelaahInternalRecord,
  username: string,
): TelaahInternalRecord["riwayat"][number] | null {
  for (let i = t.riwayat.length - 1; i >= 0; i--) {
    if (t.riwayat[i].olehUsername === username) return t.riwayat[i];
  }
  return null;
}

/* ==================== Stat Card ==================== */

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel?: string;
  accentClass: string;
  bgClass: string;
  borderClass: string;
}> = ({ icon, label, value, sublabel, accentClass, bgClass, borderClass }) => (
  <div
    className={`flex min-w-0 items-center gap-3 rounded-sm border px-4 py-3.5 ${bgClass} ${borderClass}`}
  >
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-white ${accentClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[22px] leading-none font-bold text-[#1a1a2e]">
        {value}
      </div>
      <div className="mt-1 truncate text-[11.5px] font-semibold text-[#5a6474]">
        {label}
      </div>
      {sublabel && (
        <div className="mt-0.5 truncate text-[10.5px] text-[#7a8899]">
          {sublabel}
        </div>
      )}
    </div>
  </div>
);

/* ==================== Kartu: Antrean Saya ==================== */

const KartuAntrean: React.FC<{
  telaah: TelaahInternalRecord;
  onTelaah: () => void;
}> = ({ telaah, onTelaah }) => {
  const identitas = telaah.nomorRegistrasi || telaah.nomorPengajuan;

  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-[#dbe6f7] bg-white transition-all duration-150 hover:border-[#1a4e8f]/40 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#1a4e8f]" />

      <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#eff6ff] text-[#1a4e8f] sm:flex">
        <IconBuilding />
      </div>

      <div className="min-w-0 flex-1 p-4 sm:p-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
            {identitas}
          </span>
          <span className="rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#1a4e8f] uppercase">
            Menunggu Anda
          </span>
        </div>
        <div className="mt-1.5 truncate text-[15px] leading-tight font-bold text-[#1a1a2e]">
          {telaah.namaOPD}
        </div>
        <div className="mt-1 truncate text-[11.5px] text-[#7a8899]">
          {telaah.namaPenanggungJawab}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7a8899]">
          <span className="inline-flex items-center gap-1">
            <IconClock />
            Diajukan {formatTanggalWaktu(telaah.diajukanPada)}
          </span>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#f1f5f9] p-4 sm:border-t-0 sm:p-0">
        <button
          onClick={onTelaah}
          className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-[#1a4e8f] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-[#2d63a8] hover:shadow-md sm:w-auto"
        >
          Telaah Sekarang
          <IconArrowRight />
        </button>
      </div>
    </div>
  );
};

/* ==================== Kartu: Riwayat ==================== */

const KartuRiwayat: React.FC<{
  telaah: TelaahInternalRecord;
  username: string;
  onLihat: () => void;
}> = ({ telaah, username, onLihat }) => {
  const identitas = telaah.nomorRegistrasi || telaah.nomorPengajuan;
  const entrySaya = ambilEntryTerakhirSaya(telaah, username);
  const waktuSaya = entrySaya?.timestamp ?? telaah.diajukanPada;
  const catatanSaya = entrySaya?.catatan?.trim() ?? "";
  const selesai = telaah.selesai;

  return (
    <div
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-sm border bg-white transition-all duration-150 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${
        selesai
          ? "border-[#a7f3d0] hover:border-[#0f9b6e]/40"
          : "border-[#fde68a] hover:border-[#f59e0b]/50"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-0.75 ${
          selesai ? "bg-[#0f9b6e]" : "bg-[#f59e0b]"
        }`}
      />

      <div
        className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-sm sm:flex ${
          selesai
            ? "bg-[#ecfdf5] text-[#0f6e56]"
            : "bg-[#fffbeb] text-[#b45309]"
        }`}
      >
        {selesai ? <IconCheckBig /> : <IconHourglass />}
      </div>

      <div className="min-w-0 flex-1 p-4 sm:p-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
            {identitas}
          </span>
          {selesai ? (
            <span className="inline-flex items-center gap-1 rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#065f46] uppercase">
              <IconCheck /> Selesai
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-sm border border-[#fde68a] bg-[#fffbeb] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#b45309] uppercase">
              <IconHourglass /> Diproses
            </span>
          )}
        </div>
        <div className="mt-1.5 truncate text-[15px] leading-tight font-bold text-[#1a1a2e]">
          {telaah.namaOPD}
        </div>
        <div className="mt-1 truncate text-[11.5px] text-[#7a8899]">
          {telaah.namaPenanggungJawab}
        </div>

        {catatanSaya && (
          <div
            className={`mt-2 rounded-sm border-l-2 bg-[#f7f9fc] px-2.5 py-1.5 ${
              selesai ? "border-l-[#0f9b6e]" : "border-l-[#f59e0b]"
            }`}
          >
            <p className="line-clamp-2 text-[11.5px] leading-snug text-[#3a4454] italic">
              &ldquo;{catatanSaya}&rdquo;
            </p>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7a8899]">
          <span className="inline-flex items-center gap-1">
            <IconCheck />
            Anda telaah {formatTanggalWaktu(waktuSaya)}
          </span>
          {!selesai && (
            <>
              <span className="text-[#d0d7de]">·</span>
              <span className="text-[#b45309]">
                Menunggu: {TELAAH_TAHAP_LABEL[telaah.tahapSaatIni]}
              </span>
            </>
          )}
        </div>
      </div>

      <div
        className={`shrink-0 border-t p-4 sm:border-t-0 sm:p-0 ${
          selesai ? "border-[#d1fae5]" : "border-[#fef3c7]"
        }`}
      >
        <button
          onClick={onLihat}
          className={`flex w-full items-center justify-center gap-1 rounded-sm border bg-white px-4 py-2.5 text-[12.5px] font-semibold transition sm:w-auto ${
            selesai
              ? "border-[#a7f3d0] text-[#0f6e56] hover:bg-[#ecfdf5]"
              : "border-[#fde68a] text-[#b45309] hover:border-[#f59e0b] hover:bg-[#fffbeb]"
          }`}
        >
          Lihat
          <IconArrowDownRight />
        </button>
      </div>
    </div>
  );
};

/* ==================== Empty State ==================== */

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-[#e2e8f2] bg-white p-[56px_24px] text-[#7a8899]">
    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-[#f0f4fb] text-[#1a4e8f] opacity-60">
      {icon}
    </div>
    <div className="text-center">
      <div className="text-sm font-semibold text-[#8a96a3]">{title}</div>
      <div className="mt-1 text-xs text-[#b0bac5]">{subtitle}</div>
    </div>
  </div>
);

/* ==================== Komponen utama ==================== */

export default function TelaahSayaInternal() {
  const { user } = useAuth();
  const { data, isLoading, error } = useTelaahInternalStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOPD, setFilterOPD] = useState<string>("");
  const [tab, setTab] = useState<TabKey>("antrean");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");

  const level = user?.telaahLevel ?? null;
  const username = user?.username ?? null;

  /* ── Daftar OPD unik — dari semua telaah (bukan pengajuan) ──
     Karena user internal hanya punya akses ke telaahInternal,
     ambil namaOPD dari snapshot telaah. */
  const daftarOPD = useMemo(() => {
    const set = new Set<string>();
    data.forEach((t) => {
      if (t.namaOPD) set.add(t.namaOPD);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [data]);

  /* ── Data tab "Antrean Saya" ── */
  const daftarAntrean = useMemo(() => {
    if (!level) return [];
    const tahapTarget = TELAAH_TAHAP_BY_LEVEL[level];
    return data
      .filter((t) => !t.selesai && t.tahapSaatIni === tahapTarget)
      .sort(
        (a, b) =>
          new Date(a.diajukanPada).getTime() -
          new Date(b.diajukanPada).getTime(),
      );
  }, [data, level]);

  /* ── Data tab "Riwayat Telaah" ── */
  const daftarRiwayat = useMemo(() => {
    if (!username) return [];
    return data
      .filter((t) => t.riwayat.some((r) => r.olehUsername === username))
      .sort(
        (a, b) =>
          ambilWaktuEntrySaya(b, username) - ambilWaktuEntrySaya(a, username),
      );
  }, [data, username]);

  /* ── Filter chips untuk tab "Riwayat" ── */
  const daftarRiwayatFiltered = useMemo(() => {
    if (filterStatus === "semua") return daftarRiwayat;
    if (filterStatus === "selesai")
      return daftarRiwayat.filter((t) => t.selesai);
    return daftarRiwayat.filter((t) => !t.selesai);
  }, [daftarRiwayat, filterStatus]);

  /* ── Filter generic — search + OPD ── */
  const matchFilter = (t: TelaahInternalRecord): boolean => {
    // Filter OPD
    if (filterOPD && t.namaOPD !== filterOPD) return false;
    // Filter search
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.nomorRegistrasi.toLowerCase().includes(q) ||
        t.nomorPengajuan.toLowerCase().includes(q) ||
        t.namaOPD.toLowerCase().includes(q) ||
        t.namaPenanggungJawab.toLowerCase().includes(q)
      );
    }
    return true;
  };

  const antreanFiltered = useMemo(
    () => daftarAntrean.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarAntrean, search, filterOPD],
  );
  const riwayatFiltered = useMemo(
    () => daftarRiwayatFiltered.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarRiwayatFiltered, search, filterOPD],
  );

  /* ── Stats (menghormati filter OPD) ── */
  const stats = useMemo(() => {
    const menunggu = filterOPD
      ? daftarAntrean.filter((t) => t.namaOPD === filterOPD).length
      : daftarAntrean.length;
    const sudah = filterOPD
      ? daftarRiwayat.filter((t) => t.namaOPD === filterOPD).length
      : daftarRiwayat.length;
    const selesaiFinal = filterOPD
      ? daftarRiwayat.filter((t) => t.namaOPD === filterOPD && t.selesai).length
      : daftarRiwayat.filter((t) => t.selesai).length;
    return { menunggu, sudah, selesaiFinal };
  }, [daftarAntrean, daftarRiwayat, filterOPD]);

  const isFilterAktif = Boolean(search.trim() || filterOPD);

  const resetFilter = () => {
    setSearch("");
    setFilterOPD("");
  };

  /* ── Render: detail ── */
  if (selectedId) {
    return (
      <DetailTelaah telaahId={selectedId} onBack={() => setSelectedId(null)} />
    );
  }

  /* ── Guard: user tidak punya telaahLevel ── */
  if (!level) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-sm border border-[#fecaca] bg-[#fef2f2] p-6 text-center">
          <p className="text-[13px] font-medium text-[#c0392b]">
            Akun Anda tidak memiliki level telaah internal. Hubungi
            administrator.
          </p>
        </div>
      </div>
    );
  }

  /* ── Tab config ── */
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "antrean", label: "Antrean Saya", count: stats.menunggu },
    { key: "riwayat", label: "Riwayat Telaah", count: stats.sudah },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* ══════════ HEADER ══════════ */}
      <div className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-[#1a1a2e]">
              Ruang Telaah
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#7a8899]">
              <span className="font-semibold text-[#1a4e8f]">
                {TELAAH_LEVEL_LABEL[level]}
              </span>
              <span className="text-[#d0d7de]">·</span>
              <span>{TELAAH_LEVEL_SUBTITLE[level]}</span>
              <span className="text-[#d0d7de]">·</span>
              <span>BPKAD Kab. Kendal</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#1a4e8f] uppercase">
            <IconBadge />
            {TELAAH_LEVEL_LABEL[level]}
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-[12.5px] leading-relaxed text-[#5a6474]">
          Kelola pengajuan yang menunggu telaah Anda dan lihat riwayat telaah
          yang pernah Anda lakukan.
        </p>
      </div>

      {/* ══════════ STAT CARDS ══════════ */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<IconInbox />}
          label="Menunggu Telaah"
          value={stats.menunggu}
          sublabel={
            stats.menunggu > 0 ? "Perlu tindakan Anda" : "Antrean bersih"
          }
          accentClass="bg-[#1a4e8f]"
          bgClass="bg-[#eef4fc]"
          borderClass="border-[#d0e0f5]"
        />
        <StatCard
          icon={<IconHistory />}
          label="Sudah Ditelaah"
          value={stats.sudah}
          sublabel="Total riwayat Anda"
          accentClass="bg-[#5a6474]"
          bgClass="bg-[#f7f8fa]"
          borderClass="border-[#e2e8f2]"
        />
        <StatCard
          icon={<IconSparkles />}
          label="Selesai Final"
          value={stats.selesaiFinal}
          sublabel="Lolos seluruh tahap"
          accentClass="bg-[#0f9b6e]"
          bgClass="bg-[#e6f7f2]"
          borderClass="border-[#a7e8d4]"
        />
      </div>

      {/* ══════════ TAB BAR ══════════ */}
      <div className="mb-3.5 flex flex-wrap gap-1.5 border-b border-[#e2e8f2]">
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition ${
                isActive
                  ? "border-[#1a4e8f] text-[#1a4e8f]"
                  : "border-transparent text-[#7a8899] hover:text-[#1a1a2e]"
              }`}
            >
              {t.label}
              <span
                className={`rounded-sm px-1.5 py-px text-[10.5px] font-bold ${
                  isActive
                    ? "bg-[#eff6ff] text-[#1a4e8f]"
                    : "bg-[#f0f4fb] text-[#7a8899]"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══════════ FILTER BAR (Search + OPD + Reset + Counter) ══════════ */}
      <div className="mb-3.5 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[14px_16px] lg:flex-row lg:items-center">
        {/* Search */}
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.75 lg:min-w-40 lg:flex-1">
          <span className="shrink-0 text-[#7a8899]">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari nomor registrasi, nomor pengajuan, atau nama OPD…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-w-0 border-none bg-transparent text-[13px] text-[#1a1a2e] outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="flex shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#7a8899]"
            >
              <IconClose />
            </button>
          )}
        </div>

        {/* Filter OPD */}
        <div className="flex shrink-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1.75">
          <span className="shrink-0 text-[#7a8899]">
            <IconFilter />
          </span>
          <select
            value={filterOPD}
            onChange={(e) => setFilterOPD(e.target.value)}
            className="cursor-pointer border-none bg-transparent text-[13px] text-[#1a1a2e] outline-none"
          >
            <option value="">Semua OPD</option>
            {daftarOPD.map((opd) => (
              <option key={opd} value={opd}>
                {opd}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={resetFilter}
          disabled={!isFilterAktif}
          className="shrink-0 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.75 text-[12px] font-semibold text-[#7a8899] transition enabled:hover:border-[#a0bdec] enabled:hover:bg-[#e8f0fb] enabled:hover:text-[#1a4e8f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>

        {/* Counter */}
        <div className="shrink-0 text-xs text-[#7a8899]">
          {tab === "antrean"
            ? `${antreanFiltered.length} antrean`
            : `${riwayatFiltered.length} riwayat`}
        </div>
      </div>

      {/* ══════════ FILTER CHIPS (khusus "Riwayat Telaah") ══════════ */}
      {tab === "riwayat" && (
        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {(
            [
              { key: "semua", label: "Semua", count: daftarRiwayat.length },
              {
                key: "diproses",
                label: "Sedang Diproses",
                count: daftarRiwayat.filter((t) => !t.selesai).length,
              },
              {
                key: "selesai",
                label: "Selesai",
                count: daftarRiwayat.filter((t) => t.selesai).length,
              },
            ] as { key: FilterStatus; label: string; count: number }[]
          ).map((f) => {
            const isActive = filterStatus === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`rounded-sm border px-3 py-1 text-[11.5px] font-semibold transition ${
                  isActive
                    ? "border-[#1a4e8f] bg-[#1a4e8f] text-white"
                    : "border-[#e2e8f2] bg-white text-[#5a6474] hover:border-[#a0bdec] hover:bg-[#f0f4fb]"
                }`}
              >
                {f.label}{" "}
                <span className={isActive ? "text-white/70" : "text-[#b0bac5]"}>
                  ({f.count})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════ ERROR ══════════ */}
      {error && (
        <div className="mb-3.5 rounded-sm border border-[#fed7aa] bg-[#fff7ed] px-4 py-2.5 text-[13px] font-medium text-[#9a3412]">
          Gagal memuat data telaah: {error}
        </div>
      )}

      {/* ══════════ KONTEN PER TAB ══════════ */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-sm border border-dashed border-[#e2e8f2] bg-white py-16 text-sm text-[#7a8899]">
          Memuat data telaah…
        </div>
      ) : tab === "antrean" ? (
        /* ═══ Tab 1: Antrean Saya ═══ */
        daftarAntrean.length === 0 ? (
          <EmptyState
            icon={<IconCheckBig />}
            title="Antrean Anda kosong"
            subtitle="Tidak ada pengajuan yang menunggu telaah Anda saat ini. Antrean akan muncul otomatis setelah tahap sebelumnya selesai."
          />
        ) : antreanFiltered.length === 0 ? (
          <EmptyState
            icon={<IconSearch />}
            title="Tidak ada pengajuan yang cocok"
            subtitle="Coba ubah kata kunci pencarian atau filter OPD."
          />
        ) : (
          <div className="space-y-2.5">
            {antreanFiltered.map((t) => (
              <KartuAntrean
                key={t.id}
                telaah={t}
                onTelaah={() => setSelectedId(t.id)}
              />
            ))}
          </div>
        )
      ) : /* ═══ Tab 2: Riwayat Telaah ═══ */
      daftarRiwayat.length === 0 ? (
        <EmptyState
          icon={<IconHistory />}
          title="Belum ada riwayat telaah"
          subtitle="Setelah Anda melakukan approve pada suatu pengajuan, riwayat akan muncul di sini."
        />
      ) : riwayatFiltered.length === 0 ? (
        <EmptyState
          icon={<IconSearch />}
          title="Tidak ada pengajuan yang cocok"
          subtitle={
            search || filterOPD
              ? "Coba ubah kata kunci pencarian atau filter OPD."
              : "Coba ubah filter status."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {riwayatFiltered.map((t) => (
            <KartuRiwayat
              key={t.id}
              telaah={t}
              username={username ?? ""}
              onLihat={() => setSelectedId(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
