"use client";

/* ------------------------------------------------------------------ */
/*  KirimRevisiTelaahInternal.tsx                                      */
/*  Menu Admin untuk kirim revisi telaah internal ke OPD.              */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import { usePengajuanStore } from "@/store/pengajuan-store";
import { useAuth } from "@/store/auth-store";
import type {
  TelaahInternalRecord,
  TelaahLogEntry,
} from "@/types/telaah-internal";
import { formatRupiah } from "./TelaahDokumenShared";
import ModalKonfirmasiKirimRevisi from "./ModalKonfirmasiKirimRevisi";
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

const IconSend = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M3 11L20 3l-8 8.5-2 7-3-5-4-2.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
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

/* ==================== Helper ==================== */

function ambilCatatanRevisiSaatIni(
  riwayat: TelaahLogEntry[],
): TelaahLogEntry[] {
  let siklusAwalIdx = 0;
  for (let i = riwayat.length - 1; i >= 0; i--) {
    if (
      riwayat[i].milestone === "DIAJUKAN" ||
      riwayat[i].milestone === "SIKLUS_BARU_DIMULAI"
    ) {
      siklusAwalIdx = i;
      break;
    }
  }
  return riwayat.slice(siklusAwalIdx).filter((r) => {
    return (
      r.milestone.startsWith("REVISI_DARI_") ||
      r.milestone.startsWith("DITERUSKAN_")
    );
  });
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
    className={`flex min-w-0 items-center gap-3 rounded-sm border px-4 py-3 ${bgClass} ${borderClass}`}
  >
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-white ${accentClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[20px] leading-none font-bold text-[#1a1a2e]">
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

/* ==================== Kartu ==================== */

const KartuRevisi: React.FC<{
  telaah: TelaahInternalRecord;
  totalNilaiPiutang?: string;
  onLihat: () => void;
  onKirim: () => void;
}> = ({ telaah, totalNilaiPiutang, onLihat, onKirim }) => {
  const identitas = telaah.nomorRegistrasi || telaah.nomorPengajuan;
  const catatanBerjenjang = ambilCatatanRevisiSaatIni(telaah.riwayat);

  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-sm border border-[#fde68a] bg-white pl-3.5 transition-all duration-150 hover:border-[#f59e0b]/50 hover:shadow-md sm:flex-row sm:items-start sm:gap-4 sm:p-3">
      <div className="absolute inset-y-0 left-0 w-0.75 bg-[#f59e0b]" />

      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#fffbeb] text-[#b45309] sm:flex">
        <IconBuilding />
      </div>

      <div className="min-w-0 flex-1 p-3.5 sm:p-0 sm:pt-0.5">
        <div className="font-mono text-[11.5px] font-bold tracking-tight text-[#1a4e8f]">
          {identitas}
        </div>
        <div className="mt-1 truncate text-[13px] leading-tight font-bold text-[#1a1a2e]">
          {telaah.namaOPD}
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-[#7a8899]">
          {telaah.namaPenanggungJawab}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-sm border border-[#fde68a] bg-[#fffbeb] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#b45309] uppercase">
            <IconSend /> Siap Dikirim ke OPD
          </span>
          <span className="text-[10.5px] text-[#7a8899]">
            {catatanBerjenjang.length} catatan berjenjang
          </span>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#f1f5f9] p-3.5 sm:min-w-32.5 sm:border-t-0 sm:p-0 sm:pt-0.5 sm:text-right">
        <div className="text-[10px] font-bold tracking-wider text-[#7a8899] uppercase sm:text-right">
          Nilai Piutang
        </div>
        <div className="mt-0.5 text-[13px] leading-tight font-bold text-[#1a4e8f]">
          {totalNilaiPiutang ? formatRupiah(totalNilaiPiutang) : "—"}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5 border-t border-[#f1f5f9] p-3.5 sm:border-t-0 sm:p-0 sm:pt-0.5">
        <button
          onClick={onLihat}
          className="flex w-full items-center justify-center rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-[#5a6474] transition hover:bg-[#f7f8fa] sm:w-auto"
        >
          Lihat Detail
        </button>
        <button
          onClick={onKirim}
          className="flex w-full items-center justify-center gap-1 rounded-sm bg-[#f59e0b] px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-white transition hover:bg-[#d97706] sm:w-auto"
        >
          Kirim ke OPD
          <IconArrowRight />
        </button>
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
    <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-[#fffbeb] text-[#b45309] opacity-60">
      {icon}
    </div>
    <div className="text-center">
      <div className="text-sm font-semibold text-[#8a96a3]">{title}</div>
      <div className="mt-1 text-xs text-[#b0bac5]">{subtitle}</div>
    </div>
  </div>
);

/* ==================== Komponen utama ==================== */

export default function KirimRevisiTelaahInternal() {
  const { user } = useAuth();
  const { data: semuaTelaah, kirimKeOPD } = useTelaahInternalStore();
  const { data: semuaPengajuan, getPengajuanById } = usePengajuanStore();

  const [search, setSearch] = useState("");
  const [filterOPD, setFilterOPD] = useState("");
  const [selectedTelaahId, setSelectedTelaahId] = useState<string | null>(null);
  const [pendingKirim, setPendingKirim] = useState<TelaahInternalRecord | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const daftarOPD = useMemo(() => {
    const set = new Set<string>();
    semuaPengajuan.forEach((p) => {
      if (p.namaOPD) set.add(p.namaOPD);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [semuaPengajuan]);

  const daftarRevisi = useMemo(
    () =>
      semuaTelaah
        .filter((t) => t.tahapSaatIni === "MENUNGGU_ADMIN_KIRIM_REVISI")
        .sort(
          (a, b) =>
            new Date(a.diajukanPada).getTime() -
            new Date(b.diajukanPada).getTime(),
        ),
    [semuaTelaah],
  );

  const filtered = useMemo(() => {
    return daftarRevisi.filter((t) => {
      if (filterOPD && t.namaOPD !== filterOPD) return false;
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
    });
  }, [daftarRevisi, search, filterOPD]);

  const isFilterAktif = Boolean(search.trim() || filterOPD);
  const resetFilter = () => {
    setSearch("");
    setFilterOPD("");
  };

  const handleKonfirmasiKirim = async (catatanTambahan: string) => {
    if (!pendingKirim || !user?.username) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await kirimKeOPD(pendingKirim.id, user.username, catatanTambahan);
      setPendingKirim(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengirim revisi ke OPD.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedTelaahId) {
    return (
      <DetailTelaah
        telaahId={selectedTelaahId}
        onBack={() => setSelectedTelaahId(null)}
        mode="admin"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-400">
      {pendingKirim && (
        <ModalKonfirmasiKirimRevisi
          nomorRegistrasi={pendingKirim.nomorRegistrasi}
          nomorPengajuan={pendingKirim.nomorPengajuan}
          namaOPD={pendingKirim.namaOPD}
          catatanBerjenjang={ambilCatatanRevisiSaatIni(pendingKirim.riwayat)}
          onConfirm={handleKonfirmasiKirim}
          onClose={() => {
            if (!isSubmitting) {
              setPendingKirim(null);
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
          icon={<IconSend />}
          label="Siap Dikirim ke OPD"
          value={daftarRevisi.length}
          sublabel="Perlu tindakan"
          accentClass="bg-[#f59e0b]"
          bgClass="bg-[#fffbeb]"
          borderClass="border-[#fde68a]"
        />
        <StatCard
          icon={<IconCheckBig />}
          label="Total Pengajuan"
          value={semuaPengajuan.length}
          sublabel="Seluruh OPD"
          accentClass="bg-[#5a6474]"
          bgClass="bg-[#f7f8fa]"
          borderClass="border-[#e2e8f2]"
        />
      </div>

      {/* Filter bar */}
      <div className="mb-3.5 flex flex-col gap-2 rounded-sm border border-[#e2e8f2] bg-white p-[10px_14px] lg:flex-row lg:items-center">
        <div className="flex w-full min-w-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-3 py-1.5 lg:min-w-40 lg:flex-1">
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

        <div className="flex shrink-0 items-center gap-2 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1.5">
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
          className="shrink-0 rounded-sm border border-[#e2e8f2] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#7a8899] transition enabled:hover:border-[#a0bdec] enabled:hover:bg-[#e8f0fb] enabled:hover:text-[#1a4e8f] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>

        <div className="shrink-0 text-xs text-[#7a8899]">
          {filtered.length} dari {daftarRevisi.length} pengajuan
        </div>
      </div>

      {/* Konten */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconCheckBig />}
          title={
            daftarRevisi.length === 0
              ? "Tidak ada revisi yang perlu dikirim"
              : "Tidak ada yang cocok"
          }
          subtitle={
            daftarRevisi.length === 0
              ? "Pengajuan akan muncul di sini setelah telaah internal mengembalikan revisi dan sudah diteruskan oleh Kasubbid/Kabid."
              : "Coba ubah kata kunci pencarian atau filter OPD."
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const pengajuan = getPengajuanById(t.pengajuanId);
            return (
              <KartuRevisi
                key={t.id}
                telaah={t}
                totalNilaiPiutang={pengajuan?.totalNilaiPiutang}
                onLihat={() => setSelectedTelaahId(t.id)}
                onKirim={() => {
                  setPendingKirim(t);
                  setErrorMsg(null);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
