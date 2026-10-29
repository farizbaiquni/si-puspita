"use client";

import { useMemo, useState } from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  StatusFormulir,
} from "@/types/types";
import { STATUS_FORMULIR_BADGE } from "@/types/types";
import { usePengajuanStore } from "@/store/pengajuan-store";
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import {
  TELAAH_MILESTONE_LABEL,
  TELAAH_TAHAP_BADGE,
  type TelaahInternalRecord,
  type TelaahTahap,
} from "@/types/telaah-internal";
import { REVIU_STATUS_BADGE } from "@/types/reviu-inspektorat";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Eye,
  FileText,
  Search,
  X,
} from "lucide-react";

/* ══════════ Types & constants ══════════ */
type GroupKey = StatusFormulir | "menunggu_reviu";
const ORDER: GroupKey[] = [
  "diajukan",
  "revisi",
  "teregistrasi",
  "menunggu_reviu",
];
const LABEL: Record<GroupKey, string> = {
  diajukan: "Diajukan",
  revisi: "Revisi",
  teregistrasi: "Teregistrasi",
  menunggu_reviu: "Menunggu Reviu",
};
const keyOf = (p: FormulirPenghapusanPiutangOPDRecord): GroupKey =>
  p.reviuInspektoratStatus === "MENUNGGU_REVIU" ? "menunggu_reviu" : p.status;
const CFG: Record<GroupKey, { label: string; cls: string; dot: string }> = {
  diajukan: STATUS_FORMULIR_BADGE.diajukan,
  revisi: STATUS_FORMULIR_BADGE.revisi,
  teregistrasi: STATUS_FORMULIR_BADGE.teregistrasi,
  menunggu_reviu: REVIU_STATUS_BADGE.MENUNGGU_REVIU,
};

/* ══════════ Format ══════════ */
const rp = (n: string | number) =>
  "Rp " + (Number(n) || 0).toLocaleString("id-ID");
const tgl = (s: string) =>
  !s
    ? "-"
    : new Date(s).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

/* ══════════ Badge ══════════ */
const Badge = ({
  cfg,
  compact,
}: {
  cfg: { label: string; cls: string; dot: string };
  compact?: boolean;
}) => (
  <span
    className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${
      compact
        ? "gap-1 px-1.5 py-0.5 text-[10px]"
        : "gap-1.5 px-2 py-0.5 text-[11px]"
    } ${cfg.cls}`}
  >
    <span
      className={`shrink-0 rounded-full ${
        compact ? "h-1 w-1" : "h-1.5 w-1.5"
      } ${cfg.dot}`}
    />
    {cfg.label}
  </span>
);

const StatusStack = ({
  p,
  t,
}: {
  p: FormulirPenghapusanPiutangOPDRecord;
  t?: TelaahTahap;
}) => (
  <div className="flex flex-col gap-1">
    <Badge cfg={STATUS_FORMULIR_BADGE[p.status]} compact />
    {t && <Badge cfg={TELAAH_TAHAP_BADGE[t]} compact />}
    {p.reviuInspektoratStatus === "MENUNGGU_REVIU" && (
      <Badge cfg={REVIU_STATUS_BADGE.MENUNGGU_REVIU} compact />
    )}
  </div>
);

/* ══════════ Panel Detail ══════════ */
const PanelDetail = ({
  p,
  telaah,
  onBack,
}: {
  p: FormulirPenghapusanPiutangOPDRecord;
  telaah?: TelaahInternalRecord;
  onBack: () => void;
}) => {
  const inisial = p.namaOPD
    .split(/\s+/)
    .filter((k) => k.length > 2)
    .slice(0, 2)
    .map((k) => k[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f2] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#5a6474] shadow-xs transition hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      {/* Hero header */}
      <div className="mb-4 overflow-hidden rounded-lg border border-[#e2e8f2] bg-white shadow-sm">
        <div className="h-1 bg-linear-to-r from-[#1a4e8f] via-[#c8a020] to-[#0f9b6e]" />
        <div className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#1a4e8f] to-[#0e3b6e] text-lg font-bold text-white shadow-md ring-4 ring-[#e8f0fb]">
              {inisial || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-[#1a1a2e]">{p.namaOPD}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                <span className="font-mono font-semibold text-[#1a4e8f]">
                  {p.nomorPengajuan}
                </span>
                {p.nomorRegistrasi && (
                  <>
                    <span className="text-[#b0bac5]">·</span>
                    <span className="font-mono font-semibold text-[#0f9b6e]">
                      {p.nomorRegistrasi}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Badge cfg={STATUS_FORMULIR_BADGE[p.status]} />
                {telaah && (
                  <Badge cfg={TELAAH_TAHAP_BADGE[telaah.tahapSaatIni]} />
                )}
                {p.reviuInspektoratStatus === "MENUNGGU_REVIU" && (
                  <Badge cfg={REVIU_STATUS_BADGE.MENUNGGU_REVIU} />
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                Total Nilai
              </div>
              <div className="mt-1 text-[18px] font-bold text-[#1a4e8f] tabular-nums">
                {rp(p.totalNilaiPiutang)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Identitas */}
          <div className="rounded-lg border border-[#e2e8f2] bg-white p-5">
            <div className="mb-3 text-[11px] font-bold tracking-wider text-[#7a8899] uppercase">
              Identitas Pengajuan
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ["Nomor Surat", p.nomorSurat || "-"],
                ["Tanggal Surat", tgl(p.tanggalSurat)],
                ["Jenis Piutang", p.jenisPiutang],
                ["Jenis Penghapusan", p.jenisPenghapusan],
                ["Jumlah Debitur", `${p.jumlahDebitur} orang`],
                ["Opsi Riwayat Penagihan", p.opsiRiwayatPenagihan || "-"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="mb-0.5 text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                    {k}
                  </div>
                  <div className="text-[13px] leading-snug text-[#1a1a2e]">
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-[#eef1f5] pt-4">
              <div className="mb-1 text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                Penanggung Jawab
              </div>
              <div className="text-[13px] font-semibold text-[#1a1a2e]">
                {p.namaPenanggungJawab}
              </div>
              <div className="text-[12px] text-[#7a8899]">{p.jabatan}</div>
            </div>
          </div>

          {/* Telaah timeline */}
          {telaah && (
            <div className="rounded-lg border border-[#e2e8f2] bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-bold tracking-wider text-[#7a8899] uppercase">
                  Riwayat Telaah Internal
                </div>
                <Badge cfg={TELAAH_TAHAP_BADGE[telaah.tahapSaatIni]} compact />
              </div>
              {telaah.riwayat.length === 0 ? (
                <div className="rounded border border-dashed border-[#e2e8f2] py-5 text-center text-xs text-[#b0bac5] italic">
                  Belum ada riwayat
                </div>
              ) : (
                <div className="space-y-3">
                  {telaah.riwayat.map((e, i) => {
                    const isRev = e.milestone.startsWith("REVISI_DARI_");
                    const clr = isRev
                      ? "bg-orange-500"
                      : e.milestone === "DIAJUKAN"
                        ? "bg-[#1a4e8f]"
                        : "bg-emerald-500";
                    return (
                      <div key={i} className="flex gap-3">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ${clr}`}
                        >
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-semibold text-[#1a1a2e]">
                            {TELAAH_MILESTONE_LABEL[e.milestone]}
                          </div>
                          <div className="mt-0.5 text-[10.5px] text-[#7a8899]">
                            {e.olehUsername} · {e.olehTelaahLevel} ·{" "}
                            {tgl(e.timestamp)}
                          </div>
                          {e.catatan && (
                            <div className="mt-1.5 rounded border border-[#eef1f5] bg-[#f7f8fa] px-2.5 py-1.5 text-[11.5px] whitespace-pre-line text-[#3a4454]">
                              {e.catatan}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Status Verifikasi */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-[#e2e8f2] bg-white p-5 lg:sticky lg:top-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[#e8f0fb] text-[#1a4e8f]">
                <Building2 size={13} />
              </span>
              <div className="text-[11px] font-bold tracking-wider text-[#1a4e8f] uppercase">
                Status Verifikasi
              </div>
            </div>
            {p.status === "diajukan" ? (
              <div className="rounded border border-dashed border-[#e2e8f2] py-6 text-center text-[12px] text-[#7a8899] italic">
                Belum diverifikasi
              </div>
            ) : (
              <div className="space-y-3 text-[13px]">
                <div>
                  <div className="mb-1 text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                    Hasil
                  </div>
                  <StatusStack p={p} t={telaah?.tahapSaatIni} />
                </div>
                <div className="border-t border-[#eef1f5] pt-3">
                  <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                    Verifikator
                  </div>
                  <div className="text-[#1a1a2e]">{p.verifikatorId || "-"}</div>
                </div>
                <div>
                  <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                    Tanggal
                  </div>
                  <div className="text-[#1a1a2e]">
                    {p.tanggalVerifikasi ? tgl(p.tanggalVerifikasi) : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                    Catatan
                  </div>
                  <div className="text-[#1a1a2e]">
                    {p.catatanVerifikasi || (
                      <span className="text-[#b0bac5] italic">Tidak ada</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={onBack}
              className="mt-4 w-full rounded-md border border-[#e2e8f2] bg-white py-2 text-sm font-semibold text-[#5a6474] transition hover:bg-[#f7f8fa]"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════ Main ══════════ */
const PRIORITY: Record<StatusFormulir, number> = {
  diajukan: 0,
  revisi: 1,
  teregistrasi: 2,
};

interface Props {
  semuaPengajuan?: FormulirPenghapusanPiutangOPDRecord[];
}

export default function RegisterDigital({ semuaPengajuan }: Props = {}) {
  const { data: dataStore, isLoading } = usePengajuanStore();
  const { data: telaahStore } = useTelaahInternalStore();

  const telaahMap = useMemo(() => {
    const m = new Map<string, TelaahInternalRecord>();
    telaahStore.forEach((t) => m.set(t.pengajuanId, t));
    return m;
  }, [telaahStore]);

  const daftar = useMemo(() => {
    const s = semuaPengajuan ?? dataStore;
    return [...s].sort((a, b) => {
      const o = a.namaOPD.localeCompare(b.namaOPD, "id");
      if (o !== 0) return o;
      const pr = PRIORITY[a.status] - PRIORITY[b.status];
      if (pr !== 0) return pr;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [semuaPengajuan, dataStore]);

  const [search, setSearch] = useState("");
  const [filterOPD, setFilterOPD] = useState("");
  const [filterStatus, setFilterStatus] = useState<GroupKey | "">("");
  const [selected, setSelected] =
    useState<FormulirPenghapusanPiutangOPDRecord | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const daftarOPD = useMemo(() => {
    const s = new Set<string>();
    daftar.forEach((p) => p.namaOPD && s.add(p.namaOPD));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "id"));
  }, [daftar]);

  const counts = useMemo(() => {
    const c: Record<GroupKey, number> = {
      diajukan: 0,
      revisi: 0,
      teregistrasi: 0,
      menunggu_reviu: 0,
    };
    daftar.forEach((p) => c[keyOf(p)]++);
    return c;
  }, [daftar]);

  const filtered = useMemo(() => {
    let h = daftar;
    if (filterOPD) h = h.filter((p) => p.namaOPD === filterOPD);
    if (filterStatus) h = h.filter((p) => keyOf(p) === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      h = h.filter(
        (p) =>
          p.nomorPengajuan.toLowerCase().includes(q) ||
          p.nomorSurat.toLowerCase().includes(q) ||
          (p.nomorRegistrasi?.toLowerCase().includes(q) ?? false) ||
          p.namaOPD.toLowerCase().includes(q) ||
          p.namaPenanggungJawab.toLowerCase().includes(q),
      );
    }
    return h;
  }, [daftar, filterOPD, filterStatus, search]);

  const grouped = useMemo(() => {
    const m = new Map<string, FormulirPenghapusanPiutangOPDRecord[]>();
    filtered.forEach((p) => {
      const k = p.namaOPD || "-";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    });
    return Array.from(m.entries()).map(([opd, items]) => ({
      opd,
      items,
      subtotal: items.reduce(
        (s, p) => s + (Number(p.totalNilaiPiutang) || 0),
        0,
      ),
    }));
  }, [filtered]);

  const isAktif = Boolean(search || filterOPD || filterStatus);
  const reset = () => {
    setSearch("");
    setFilterOPD("");
    setFilterStatus("");
  };
  const toggleFilter = (k: GroupKey) =>
    setFilterStatus((cur) => (cur === k ? "" : k));

  if (selected) {
    return (
      <PanelDetail
        p={selected}
        telaah={telaahMap.get(selected.id)}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-400">
      {/* ── Summary grid 4-kategori (klik = filter) ── */}
      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {ORDER.map((k) => {
          const cfg = CFG[k];
          const c = counts[k];
          const pct =
            daftar.length === 0 ? 0 : Math.round((c / daftar.length) * 100);
          const active = filterStatus === k;
          return (
            <button
              key={k}
              onClick={() => toggleFilter(k)}
              className={`group relative overflow-hidden rounded-lg border px-3.5 py-3 text-left transition-all ${cfg.cls} ${
                active
                  ? "ring-2 ring-current ring-offset-1"
                  : "opacity-90 hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span className="text-[10.5px] font-bold tracking-wider uppercase">
                  {LABEL[k]}
                </span>
              </div>
              <div className="mt-1.5 text-2xl leading-none font-bold tabular-nums">
                {c}
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className={`h-full rounded-full ${cfg.dot} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-3 flex flex-col gap-2 rounded-md border border-[#e2e8f2] bg-white p-2.5 sm:flex-row sm:items-center">
        <div className="flex w-full flex-1 items-center gap-2 rounded-md border border-[#e2e8f2] bg-[#f7f8fa] px-2.5 py-1.5 transition focus-within:border-[#a0bdec] focus-within:bg-white">
          <Search size={14} className="shrink-0 text-[#7a8899]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor, surat, OPD, PJ…"
            className="w-full border-none bg-transparent text-[12.5px] outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="shrink-0 text-[#7a8899] hover:text-[#1a1a2e]"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <select
          value={filterOPD}
          onChange={(e) => setFilterOPD(e.target.value)}
          className="w-full shrink-0 cursor-pointer rounded-md border border-[#e2e8f2] bg-white px-2.5 py-1.5 text-[12.5px] outline-none sm:w-auto sm:min-w-40"
        >
          <option value="">Semua OPD</option>
          {daftarOPD.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <div className="shrink-0 text-[11.5px] whitespace-nowrap text-[#7a8899]">
          {filtered.length} / {daftar.length}
        </div>
      </div>

      {/* ── List ── */}
      <div className="overflow-hidden rounded-lg border border-[#e2e8f2] bg-white">
        {isLoading && !semuaPengajuan ? (
          <div className="divide-y divide-[#eef1f5]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-3 w-8 animate-pulse rounded bg-[#e8f0fb]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-[#e8f0fb]" />
                  <div className="h-2 w-1/4 animate-pulse rounded bg-[#f0f4fb]" />
                </div>
                <div className="h-3 w-24 animate-pulse rounded bg-[#e8f0fb]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0fb] text-[#1a4e8f]">
              <FileText size={26} />
            </span>
            <div>
              <div className="text-sm font-semibold text-[#8a96a3]">
                {daftar.length === 0
                  ? "Belum ada pengajuan"
                  : "Tidak ada pengajuan cocok"}
              </div>
              <div className="mt-1 text-xs text-[#b0bac5]">
                {daftar.length === 0
                  ? "Belum ada formulir yang masuk dari OPD."
                  : "Coba ubah kata kunci atau filter."}
              </div>
            </div>
            {isAktif && (
              <button
                onClick={reset}
                className="rounded-md border border-[#e2e8f2] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[#1a4e8f] hover:bg-[#e8f0fb]"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile card */}
            <div className="divide-y divide-[#eef1f5] md:hidden">
              {grouped.map((g) => (
                <div key={g.opd}>
                  <button
                    onClick={() =>
                      setCollapsed((p) => ({ ...p, [g.opd]: !p[g.opd] }))
                    }
                    className="flex w-full items-center gap-2 bg-[#f0f4fb] px-3.5 py-2.5 text-left hover:bg-[#e8f0fb]"
                  >
                    <ChevronDown
                      size={13}
                      className={`shrink-0 text-[#7a8899] transition-transform ${collapsed[g.opd] ? "-rotate-90" : ""}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-[#1a4e8f]">
                      {g.opd}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-[#1a4e8f]">
                      {g.items.length}
                    </span>
                  </button>
                  {!collapsed[g.opd] &&
                    g.items.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelected(p)}
                        className="w-full px-3.5 py-3 text-left transition hover:bg-[#fafbfc]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-mono text-[11px] font-bold text-[#1a4e8f]">
                              {p.nomorPengajuan}
                            </div>
                            <div className="mt-0.5 truncate text-[13px] font-semibold text-[#1a1a2e]">
                              {p.namaPenanggungJawab}
                            </div>
                            <div className="text-[11px] text-[#7a8899]">
                              {tgl(p.tanggalSurat)} · {p.jumlahDebitur} debitur
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[13px] font-bold text-[#1a4e8f]">
                              {rp(p.totalNilaiPiutang)}
                            </div>
                            <div className="mt-1.5 flex flex-col items-end gap-1">
                              <StatusStack
                                p={p}
                                t={telaahMap.get(p.id)?.tahapSaatIni}
                              />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-[12px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[#e2e8f2] bg-[#263e6e]">
                    {[
                      { l: "#", w: "w-10" },
                      { l: "Pengajuan", w: "" },
                      { l: "Nilai Piutang", w: "w-44" },
                      { l: "Status", w: "w-56" },
                      { l: "No. Registrasi", w: "w-44" },
                      { l: "", w: "w-14" },
                    ].map(({ l, w }, i) => (
                      <th
                        key={i}
                        className={`${w} px-3 py-2.5 text-left text-[9.5px] font-bold tracking-wider whitespace-nowrap text-slate-100 uppercase`}
                      >
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                {grouped.map((g) => {
                  const isCol = collapsed[g.opd];
                  return (
                    <tbody key={g.opd}>
                      <tr className="border-y border-[#dbe6f7] bg-[#f0f4fb]">
                        <td colSpan={6} className="p-0">
                          <button
                            onClick={() =>
                              setCollapsed((p) => ({
                                ...p,
                                [g.opd]: !p[g.opd],
                              }))
                            }
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-[#e8f0fb]"
                          >
                            <ChevronDown
                              size={13}
                              className={`shrink-0 text-[#7a8899] transition-transform ${isCol ? "-rotate-90" : ""}`}
                            />
                            <Building2
                              size={13}
                              className="shrink-0 text-[#1a4e8f]"
                            />
                            <span className="min-w-0 truncate text-[12px] font-bold text-[#1a4e8f]">
                              {g.opd}
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#1a4e8f]">
                              {g.items.length}
                            </span>
                            <span className="ml-auto text-[10.5px] font-medium text-[#7a8899]">
                              Subtotal:{" "}
                              <span className="font-bold text-[#1a4e8f]">
                                {rp(g.subtotal)}
                              </span>
                            </span>
                          </button>
                        </td>
                      </tr>
                      {!isCol &&
                        g.items.map((p, idx) => {
                          const t = telaahMap.get(p.id)?.tahapSaatIni;
                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors hover:bg-[#f0f6fd] ${
                                idx % 2 === 0 ? "bg-white" : "bg-[#fafbfc]"
                              } ${
                                idx < g.items.length - 1
                                  ? "border-b border-[#eef1f5]"
                                  : ""
                              }`}
                            >
                              <td className="px-3 py-2.5 align-top text-[11px] font-semibold text-[#7a8899]">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2.5 align-top">
                                <div className="font-mono text-[11px] font-bold text-[#1a4e8f]">
                                  {p.nomorPengajuan}
                                </div>
                                <div className="mt-0.5 truncate text-[12px] font-semibold text-[#1a1a2e]">
                                  {p.namaPenanggungJawab}
                                </div>
                                <div className="text-[10.5px] text-[#7a8899]">
                                  {p.jenisPenghapusan}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                <div className="text-[12.5px] font-bold text-[#1a1a2e] tabular-nums">
                                  {rp(p.totalNilaiPiutang)}
                                </div>
                                <div className="mt-0.5 text-[10.5px] text-[#7a8899]">
                                  {p.jumlahDebitur} debitur
                                </div>
                              </td>
                              <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                <StatusStack p={p} t={t} />
                              </td>
                              <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                {p.nomorRegistrasi ? (
                                  <div className="font-mono text-[11px] font-bold text-[#0f9b6e]">
                                    {p.nomorRegistrasi}
                                  </div>
                                ) : (
                                  <div className="text-[10.5px] text-[#b0bac5] italic">
                                    Belum terbit
                                  </div>
                                )}
                                <div className="mt-0.5 text-[10.5px] text-[#7a8899]">
                                  {tgl(p.tanggalSurat)}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right align-top">
                                <button
                                  onClick={() => setSelected(p)}
                                  title="Lihat Detail"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#e2e8f2] bg-white text-[#1a4e8f] transition hover:border-[#a0bdec] hover:bg-[#e8f0fb]"
                                >
                                  <Eye size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  );
                })}
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
