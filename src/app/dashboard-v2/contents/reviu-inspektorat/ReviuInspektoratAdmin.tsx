"use client";

/* ------------------------------------------------------------------ */
/*  ReviuInspektoratAdmin.tsx                                          */
/*  Menu "Reviu Inspektorat" untuk admin OTHER_ADMIN.                  */
/*                                                                      */
/*  2 tab:                                                             */
/*   - "Siap Direviu"   → pengajuan yang telaah internal = SELESAI      */
/*                        & reviuInspektoratStatus belum di-set.        */
/*   - "Sudah Direviu"  → pengajuan yang reviuInspektoratStatus =        */
/*                        "MENUNGGU_REVIU".                             */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import type { FormulirPenghapusanPiutangOPDRecord } from "@/types/types";
import { useAuth } from "@/store/auth-store";
import { usePengajuanStore } from "@/store/pengajuan-store";
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import { ajukanReviuInspektorat } from "@/lib/reviu-inspektorat";
import { formatRupiah } from "../telaah/TelaahDokumenShared";
import ModalKonfirmasiAjukanReviu from "./ModalKonfirmasiAjukanReviu";

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

const IconCheckBig = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
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

const IconShield = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path
      d="M10 1.5L3.5 4v6c0 4.5 2.75 7.5 6.5 8.5 3.75-1 6.5-4 6.5-8.5V4L10 1.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
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

/* ==================== Tipe ==================== */

type TabKey = "siap" | "sudah";

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

/* ==================== Kartu: Siap Direviu ==================== */

const KartuSiapDireviu: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  onAjukan: () => void;
}> = ({ pengajuan, onAjukan }) => {
  const identitas = pengajuan.nomorRegistrasi || pengajuan.nomorPengajuan;
  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-[#ddd0fb] bg-white transition-all duration-150 hover:border-[#7c3aed]/40 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#7c3aed]" />
      <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#f3efff] text-[#7c3aed] sm:flex">
        <IconBuilding />
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
            {identitas}
          </span>
          <span className="rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#065f46] uppercase">
            ✓ Telaah Selesai
          </span>
        </div>
        <div className="mt-1.5 truncate text-[15px] leading-tight font-bold text-[#1a1a2e]">
          {pengajuan.namaOPD}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#7a8899]">
          <span className="truncate">{pengajuan.namaPenanggungJawab}</span>
          <span className="font-bold text-[#1a4e8f]">
            {formatRupiah(pengajuan.totalNilaiPiutang)}
          </span>
        </div>
      </div>
      <div className="shrink-0 border-t border-[#f1f5f9] p-4 sm:border-t-0 sm:p-0">
        <button
          onClick={onAjukan}
          className="flex w-full items-center justify-center gap-1.5 rounded-sm bg-[#7c3aed] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] hover:shadow-md sm:w-auto"
        >
          Ajukan Reviu Inspektorat
          <IconArrowRight />
        </button>
      </div>
    </div>
  );
};

/* ==================== Kartu: Sudah Direviu ==================== */

const KartuSudahDireviu: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
}> = ({ pengajuan }) => {
  const identitas = pengajuan.nomorRegistrasi || pengajuan.nomorPengajuan;
  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-[#c4b5fd] bg-white transition-all duration-150 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#7c3aed]" />
      <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-[#f3efff] text-[#7c3aed] sm:flex">
        <IconShield />
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
            {identitas}
          </span>
          <span className="inline-flex items-center gap-1 rounded-sm border border-[#ddd0fb] bg-[#f3efff] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#5b21b6] uppercase">
            Menunggu Reviu Inspektorat
          </span>
        </div>
        <div className="mt-1.5 truncate text-[15px] leading-tight font-bold text-[#1a1a2e]">
          {pengajuan.namaOPD}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#7a8899]">
          <span className="truncate">{pengajuan.namaPenanggungJawab}</span>
          <span className="font-bold text-[#1a4e8f]">
            {formatRupiah(pengajuan.totalNilaiPiutang)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ==================== Empty ==================== */

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-[#e2e8f2] bg-white p-[56px_24px] text-[#7a8899]">
    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-[#f3efff] text-[#7c3aed] opacity-60">
      {icon}
    </div>
    <div className="text-center">
      <div className="text-sm font-semibold text-[#8a96a3]">{title}</div>
      <div className="mt-1 text-xs text-[#b0bac5]">{subtitle}</div>
    </div>
  </div>
);

/* ==================== Komponen utama ==================== */

export default function ReviuInspektoratAdmin() {
  const { user } = useAuth();
  const { data: semuaPengajuan } = usePengajuanStore();
  const { data: semuaTelaah } = useTelaahInternalStore();

  const [tab, setTab] = useState<TabKey>("siap");
  const [search, setSearch] = useState("");
  const [filterOPD, setFilterOPD] = useState<string>("");
  const [pendingAjukan, setPendingAjukan] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ── Set pengajuan yang telaah internal-nya SELESAI ── */
  const setTelaahSelesai = useMemo(() => {
    const set = new Set<string>();
    semuaTelaah.forEach((t) => {
      if (t.selesai) set.add(t.pengajuanId);
    });
    return set;
  }, [semuaTelaah]);

  /* ── Tab "Siap Direviu" ── */
  const daftarSiap = useMemo(
    () =>
      semuaPengajuan
        .filter(
          (p) =>
            setTelaahSelesai.has(p.id) &&
            (!p.reviuInspektoratStatus ||
              p.reviuInspektoratStatus !== "MENUNGGU_REVIU"),
        )
        .sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
        ),
    [semuaPengajuan, setTelaahSelesai],
  );

  /* ── Tab "Sudah Direviu" ── */
  const daftarSudah = useMemo(
    () =>
      semuaPengajuan
        .filter((p) => p.reviuInspektoratStatus === "MENUNGGU_REVIU")
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [semuaPengajuan],
  );

  /* ── Daftar OPD unik ── */
  const daftarOPD = useMemo(() => {
    const set = new Set<string>();
    semuaPengajuan.forEach((p) => {
      if (p.namaOPD) set.add(p.namaOPD);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [semuaPengajuan]);

  /* ── Filter generic ── */
  const matchFilter = (p: FormulirPenghapusanPiutangOPDRecord): boolean => {
    if (filterOPD && p.namaOPD !== filterOPD) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (p.nomorRegistrasi ?? "").toLowerCase().includes(q) ||
        p.nomorPengajuan.toLowerCase().includes(q) ||
        p.namaOPD.toLowerCase().includes(q) ||
        p.namaPenanggungJawab.toLowerCase().includes(q)
      );
    }
    return true;
  };

  const siapFiltered = useMemo(
    () => daftarSiap.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarSiap, search, filterOPD],
  );
  const sudahFiltered = useMemo(
    () => daftarSudah.filter(matchFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daftarSudah, search, filterOPD],
  );

  const stats = useMemo(
    () => ({ siap: daftarSiap.length, sudah: daftarSudah.length }),
    [daftarSiap, daftarSudah],
  );

  const isFilterAktif = Boolean(search.trim() || filterOPD);
  const resetFilter = () => {
    setSearch("");
    setFilterOPD("");
  };

  const handleKonfirmasiAjukan = async () => {
    if (!pendingAjukan || !user?.username) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await ajukanReviuInspektorat(
        {
          id: pendingAjukan.id,
          opdId: pendingAjukan.opdId,
          nomorPengajuan: pendingAjukan.nomorPengajuan,
          nomorRegistrasi: pendingAjukan.nomorRegistrasi ?? null,
          namaOPD: pendingAjukan.namaOPD,
        },
        user.username,
      );
      setPendingAjukan(null);
      setTab("sudah");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengajukan reviu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "siap", label: "Siap Direviu", count: stats.siap },
    { key: "sudah", label: "Sudah Direviu", count: stats.sudah },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      {pendingAjukan && (
        <ModalKonfirmasiAjukanReviu
          nomorRegistrasi={pendingAjukan.nomorRegistrasi ?? ""}
          nomorPengajuan={pendingAjukan.nomorPengajuan}
          namaOPD={pendingAjukan.namaOPD}
          onConfirm={handleKonfirmasiAjukan}
          onClose={() => {
            if (!isSubmitting) {
              setPendingAjukan(null);
              setErrorMsg(null);
            }
          }}
          isSubmitting={isSubmitting}
          errorMessage={errorMsg}
        />
      )}

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={<IconInbox />}
          label="Siap Direviu"
          value={stats.siap}
          sublabel="Perlu tindakan"
          accentClass="bg-[#7c3aed]"
          bgClass="bg-[#f3efff]"
          borderClass="border-[#ddd0fb]"
        />
        <StatCard
          icon={<IconSparkles />}
          label="Sudah Direviu"
          value={stats.sudah}
          sublabel="Menunggu proses offline"
          accentClass="bg-[#0f9b6e]"
          bgClass="bg-[#e6f7f2]"
          borderClass="border-[#a7e8d4]"
        />
      </div>

      {/* Tab bar */}
      <div className="mb-3.5 flex flex-wrap gap-1.5 border-b border-[#e2e8f2]">
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition ${
                isActive
                  ? "border-[#7c3aed] text-[#7c3aed]"
                  : "border-transparent text-[#7a8899] hover:text-[#1a1a2e]"
              }`}
            >
              {t.label}
              <span
                className={`rounded-sm px-1.5 py-px text-[10.5px] font-bold ${
                  isActive
                    ? "bg-[#f3efff] text-[#7c3aed]"
                    : "bg-[#f0f4fb] text-[#7a8899]"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="mb-3.5 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[14px_16px] lg:flex-row lg:items-center">
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

        <button
          onClick={resetFilter}
          disabled={!isFilterAktif}
          className="shrink-0 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.75 text-[12px] font-semibold text-[#7a8899] transition enabled:hover:border-[#a0bdec] enabled:hover:bg-[#e8f0fb] enabled:hover:text-[#1a4e8f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>

        <div className="shrink-0 text-xs text-[#7a8899]">
          {tab === "siap"
            ? `${siapFiltered.length} pengajuan`
            : `${sudahFiltered.length} sudah direviu`}
        </div>
      </div>

      {/* Konten */}
      {tab === "siap" &&
        (siapFiltered.length === 0 ? (
          <EmptyState
            icon={<IconCheckBig />}
            title={
              daftarSiap.length === 0
                ? "Tidak ada pengajuan yang siap direviu"
                : "Tidak ada yang cocok"
            }
            subtitle={
              daftarSiap.length === 0
                ? "Pengajuan akan muncul di sini setelah Telaah Internal selesai."
                : "Coba ubah kata kunci pencarian atau filter OPD."
            }
          />
        ) : (
          <div className="space-y-2.5">
            {siapFiltered.map((p) => (
              <KartuSiapDireviu
                key={p.id}
                pengajuan={p}
                onAjukan={() => {
                  setPendingAjukan(p);
                  setErrorMsg(null);
                }}
              />
            ))}
          </div>
        ))}

      {tab === "sudah" &&
        (sudahFiltered.length === 0 ? (
          <EmptyState
            icon={<IconShield />}
            title={
              daftarSudah.length === 0
                ? "Belum ada pengajuan yang direviu"
                : "Tidak ada yang cocok"
            }
            subtitle={
              daftarSudah.length === 0
                ? "Setelah Anda mengajukan Reviu Inspektorat, pengajuan akan muncul di sini."
                : "Coba ubah kata kunci pencarian atau filter OPD."
            }
          />
        ) : (
          <div className="space-y-2.5">
            {sudahFiltered.map((p) => (
              <KartuSudahDireviu key={p.id} pengajuan={p} />
            ))}
          </div>
        ))}
    </div>
  );
}
