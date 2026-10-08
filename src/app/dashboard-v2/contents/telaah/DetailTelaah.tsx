"use client";

/* ------------------------------------------------------------------ */
/*  DetailTelaah.tsx                                                   */
/*  Panel detail satu siklus telaah internal.                          */
/*                                                                      */
/*  LAYOUT:                                                            */
/*   - Kiri (2/3): identity card + dokumen checklist                   */
/*   - Kanan (1/3): form telaah + timeline riwayat                     */
/*                                                                      */
/*  Timeline pakai angka urut (bukan icon centang) untuk milestone.    */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import {
  TELAAH_LEVEL_LABEL,
  TELAAH_MILESTONE_LABEL,
  TELAAH_TAHAP_LABEL,
  TELAAH_TAHAP_BY_LEVEL,
  bolehApprove,
  type TelaahLevel,
} from "@/types/telaah-internal";
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import { usePengajuanStore } from "@/store/pengajuan-store";
import { useAuth } from "@/store/auth-store";
import {
  buildDokumenTampilan,
  flattenDokumenTampilan,
  formatRupiah,
  formatTanggal,
  formatTanggalWaktu,
  labelBuktiTidakMampuTerupload,
  labelJenisPiutang,
  labelOpsiRiwayatPenagihanTampilan,
} from "./TelaahDokumenShared";
import DaftarDokumenDenganChecklist, {
  type ChecklistMap,
  type ChecklistItem,
} from "./DaftarDokumenDenganChecklist";
import DaftarDokumenReadOnly from "./DaftarDokumenReadOnly";

/* ==================== Ikon ==================== */

const IconArrowLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M10 3L4 8l6 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="16"
    height="16"
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

const IconAlert = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
  >
    <path
      d="M8 2.5l6 11H2l6-11z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 6.5v3.5M8 12v.5" strokeLinecap="round" />
  </svg>
);

const IconBuilding = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M5 18V4a1 1 0 011-1h8a1 1 0 011 1v14" strokeLinecap="round" />
    <path
      d="M3 18h14M7 7h1.5M11.5 7H13M7 10.5h1.5M11.5 10.5H13M7 14h1.5M11.5 14H13"
      strokeLinecap="round"
    />
  </svg>
);

const IconCalendar = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <rect x="3" y="4.5" width="14" height="12" rx="2" />
    <path d="M3 8.5h14M7 2.5v4M13 2.5v4" strokeLinecap="round" />
  </svg>
);

const IconTag = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M10.5 2.5H5a2 2 0 00-2 2v5.5L11.5 18a1.4 1.4 0 002 0l4.5-4.5a1.4 1.4 0 000-2L10.5 2.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const IconLayers = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M10 2L2 6l8 4 8-4-8-4z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 10l8 4 8-4M2 14l8 4 8-4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconUsers = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="7" cy="6" r="3" />
    <path d="M1.5 17c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" strokeLinecap="round" />
    <path d="M13 6a3 3 0 110 6M15 11c2.2.7 4 2.9 4 6" strokeLinecap="round" />
  </svg>
);

const IconCoins = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <ellipse cx="7.5" cy="6" rx="5" ry="2.8" />
    <path
      d="M2.5 6v4.5c0 1.5 2.25 2.8 5 2.8s5-1.3 5-2.8V6"
      strokeLinecap="round"
    />
    <path
      d="M2.5 10.5V15c0 1.5 2.25 2.8 5 2.8 1.9 0 3.7-.6 4.5-1.5"
      strokeLinecap="round"
    />
    <ellipse cx="13.5" cy="12" rx="4" ry="2.3" />
  </svg>
);

const IconReceipt = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M4 2.5h12v15l-3-1.5-3 1.5-3-1.5-3 1.5v-15z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 7h6M7 10.5h6M7 14h4" strokeLinecap="round" />
  </svg>
);

const IconHistory = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M10 5v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 3.5v3h3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 6.5A7 7 0 1110 17a7 7 0 01-6.5-4.7" strokeLinecap="round" />
  </svg>
);

const IconFileBadge = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M11.5 2.5H5a1.5 1.5 0 00-1.5 1.5v12A1.5 1.5 0 005 17.5h10a1.5 1.5 0 001.5-1.5V7.5l-5-5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M11.5 2.5v5h5" strokeLinecap="round" />
  </svg>
);

const IconUser = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <circle cx="10" cy="7" r="3.5" />
    <path d="M3 17c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
  </svg>
);

/* ==================== Helper ==================== */

function labelTombolApprove(level: TelaahLevel): string {
  if (level === "kasubbid") return "Approve & Teruskan ke Kabid";
  if (level === "kabid") return "Approve & Teruskan ke Sekban";
  return "Approve Final";
}

/* ==================== Sub-komponen: Field dengan icon ==================== */

const Field: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5 rounded-sm border border-[#eef1f5] bg-white px-3 py-2.5">
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#eff6ff] text-[#1a4e8f]">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] leading-snug font-semibold text-[#1a1a2e]">
        {value}
      </div>
    </div>
  </div>
);

/* ==================== Timeline Riwayat (dengan angka urut) ==================== */

const TimelineRiwayat: React.FC<{
  riwayat: import("@/types/telaah-internal").TelaahLogEntry[];
}> = ({ riwayat }) => (
  <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
    <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
      Riwayat Telaah ({riwayat.length} langkah)
    </div>
    <div className="space-y-4">
      {riwayat.map((entry, idx) => {
        const isLast = idx === riwayat.length - 1;
        const isCurrent = isLast && entry.milestone !== "SUDAH_TELAAH_SEKBAN";
        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                  isCurrent
                    ? "bg-[#f59e0b] text-white"
                    : "bg-[#1a4e8f] text-white"
                }`}
              >
                {idx + 1}
              </div>
              {!isLast && (
                <div
                  className={`my-1 w-px flex-1 ${
                    isCurrent ? "bg-[#fde68a]" : "bg-[#e2e8f2]"
                  }`}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[13px] font-semibold text-[#1a1a2e]">
                  {TELAAH_MILESTONE_LABEL[entry.milestone]}
                </span>
                <span className="text-[11px] text-[#7a8899]">
                  · {formatTanggalWaktu(entry.timestamp)}
                </span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#7a8899]">
                oleh{" "}
                <span className="font-mono font-medium text-[#5a6474]">
                  {entry.olehUsername}
                </span>{" "}
                (
                {entry.olehTelaahLevel === "admin"
                  ? "Admin"
                  : TELAAH_LEVEL_LABEL[entry.olehTelaahLevel]}
                )
              </div>
              {entry.catatan && (
                <div className="mt-2 rounded-sm border border-[#eef1f5] bg-[#f7f8fa] px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-line text-[#3a4454]">
                  {entry.catatan}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ==================== Progress Checklist (sidebar) ==================== */

const ProgressChecklist: React.FC<{
  total: number;
  checked: number;
}> = ({ total, checked }) => {
  const isComplete = total > 0 && checked === total;
  const isEmpty = total === 0;
  const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

  return (
    <div
      className={`rounded-sm border px-3 py-2.5 ${
        isEmpty
          ? "border-[#e2e8f2] bg-[#f7f8fa]"
          : isComplete
            ? "border-[#a7f3d0] bg-[#ecfdf5]"
            : "border-[#fde68a] bg-[#fffbeb]"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className={`text-[11.5px] font-bold tracking-wide uppercase ${
            isEmpty
              ? "text-[#7a8899]"
              : isComplete
                ? "text-[#0f6e56]"
                : "text-[#b45309]"
          }`}
        >
          Checklist Dokumen
        </span>
        <span
          className={`text-[12.5px] font-bold ${
            isEmpty
              ? "text-[#7a8899]"
              : isComplete
                ? "text-[#0f6e56]"
                : "text-[#b45309]"
          }`}
        >
          {checked}/{total}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
        <div
          className={`h-full transition-all duration-300 ${
            isEmpty
              ? "bg-[#d0d7de]"
              : isComplete
                ? "bg-[#0f9b6e]"
                : "bg-[#f59e0b]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p
        className={`mt-1.5 text-[10.5px] ${
          isEmpty
            ? "text-[#7a8899]"
            : isComplete
              ? "text-[#0f6e56]"
              : "text-[#b45309]"
        }`}
      >
        {isEmpty
          ? "Tidak ada dokumen yang diupload — tidak perlu checklist."
          : isComplete
            ? "Semua dokumen sudah dicek. Siap approve."
            : `${total - checked} dokumen belum dicek.`}
      </p>
    </div>
  );
};

/* ==================== Komponen utama ==================== */

interface DetailTelaahProps {
  telaahId: string;
  onBack: () => void;
  mode?: "internal" | "admin";
}

export default function DetailTelaah({
  telaahId,
  onBack,
  mode = "internal",
}: DetailTelaahProps) {
  const { user } = useAuth();
  const { getTelaahByPengajuanId, approveTelaah } = useTelaahInternalStore();
  const { getPengajuanById } = usePengajuanStore();

  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklistDokumen, setChecklistDokumen] = useState<ChecklistMap>({});

  const telaah = getTelaahByPengajuanId(telaahId);
  const pengajuan = getPengajuanById(telaahId);

  /* ── Guard ── */
  if (!telaah) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4e8f] hover:underline"
        >
          <IconArrowLeft /> Kembali ke daftar
        </button>
        <div className="rounded-sm border border-dashed border-[#e2e8f2] bg-white py-12 text-center text-[13px] text-[#7a8899]">
          Data telaah tidak ditemukan.
        </div>
      </div>
    );
  }

  if (!pengajuan) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4e8f] hover:underline"
        >
          <IconArrowLeft /> Kembali ke daftar
        </button>
        <div className="rounded-sm border border-dashed border-[#e2e8f2] bg-white py-12 text-center text-[13px] text-[#7a8899]">
          Data pengajuan tidak ditemukan — mungkin sudah dihapus.
        </div>
      </div>
    );
  }

  const level = user?.telaahLevel ?? null;
  const bolehApproveIni =
    mode === "internal" &&
    level !== null &&
    !telaah.selesai &&
    bolehApprove(telaah.tahapSaatIni, level);

  const dokumenFlat = flattenDokumenTampilan(buildDokumenTampilan(pengajuan));
  const dokumenUploaded = dokumenFlat.filter((d) => d.file !== null);
  const checklistStats = (() => {
    let checked = 0;
    const missing: string[] = [];
    for (const d of dokumenUploaded) {
      const item = checklistDokumen[d.key];
      if (item?.checked) {
        checked++;
      } else {
        missing.push(d.label);
      }
    }
    return { total: dokumenUploaded.length, checked, missing };
  })();

  const handleChecklistChange = (
    docKey: string,
    value: Partial<ChecklistItem>,
  ) => {
    setChecklistDokumen((prev) => {
      const current: ChecklistItem = prev[docKey] ?? {
        checked: false,
        catatan: "",
      };
      return { ...prev, [docKey]: { ...current, ...value } };
    });
    if (error && error.startsWith("Dokumen belum dicek")) {
      setError(null);
    }
  };

  const handleApprove = async () => {
    if (!level || !user?.username) return;
    if (isSubmitting) return;

    if (checklistStats.missing.length > 0) {
      const list = checklistStats.missing.map((l) => `• ${l}`).join("\n");
      setError(
        `Dokumen belum dicek (${checklistStats.missing.length} dari ${checklistStats.total}):\n${list}`,
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const dokumenUploadedKeys = new Set(dokumenUploaded.map((d) => d.key));
    const checklistToSend: Record<
      string,
      { checked: boolean; catatan: string }
    > = {};
    for (const [key, value] of Object.entries(checklistDokumen)) {
      if (dokumenUploadedKeys.has(key)) {
        checklistToSend[key] = {
          checked: value.checked,
          catatan: value.catatan.trim(),
        };
      }
    }

    try {
      await approveTelaah(
        telaah.id,
        level,
        user.username,
        catatan,
        checklistToSend,
      );
      onBack();
    } catch (err) {
      console.error("Gagal approve telaah:", err);
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi.",
      );
      setIsSubmitting(false);
    }
  };

  const identitasUtama = telaah.nomorRegistrasi || telaah.nomorPengajuan;

  return (
    <div className="mx-auto w-full max-w-400">
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4e8f] hover:underline"
      >
        <IconArrowLeft /> Kembali ke daftar
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ══════════════════ KOLOM KIRI ══════════════════ */}
        <div className="space-y-4 lg:col-span-2">
          {/* ══════════════ CARD IDENTITAS ══════════════ */}
          <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white">
            {/* Top bar gradient navy */}
            <div className="bg-linear-to-r from-[#1a4e8f] to-[#2d63a8] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold tracking-widest text-[#a4c2ec] uppercase">
                    Nomor Registrasi
                  </div>
                  <div className="mt-1 font-mono text-[16px] leading-tight font-bold break-all text-white">
                    {identitasUtama}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    <span className="text-[10.5px] font-bold tracking-widest text-[#a4c2ec] uppercase">
                      Nomor Pengajuan
                    </span>
                    <span className="font-mono text-[#dbe6f7]">
                      {telaah.nomorPengajuan}
                    </span>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />
                  {TELAAH_TAHAP_LABEL[telaah.tahapSaatIni]}
                </span>
              </div>
            </div>

            {/* Grid field info */}
            <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2">
              <Field
                icon={<IconBuilding />}
                label="Nama OPD"
                value={pengajuan.namaOPD}
              />
              <Field
                icon={<IconCalendar />}
                label="Tanggal Surat"
                value={formatTanggal(pengajuan.tanggalSurat)}
              />
              <Field
                icon={<IconTag />}
                label="Jenis Piutang"
                value={labelJenisPiutang(pengajuan.jenisPiutang)}
              />
              <Field
                icon={<IconLayers />}
                label="Jenis Penghapusan"
                value={pengajuan.jenisPenghapusan || "-"}
              />
              <Field
                icon={<IconUsers />}
                label="Jumlah Debitur"
                value={`${pengajuan.jumlahDebitur || "-"} orang`}
              />
              <Field
                icon={<IconCoins />}
                label="Total Nilai Piutang"
                value={
                  <span className="text-[14px] font-bold text-[#1a4e8f]">
                    {formatRupiah(pengajuan.totalNilaiPiutang)}
                  </span>
                }
              />
              <Field
                icon={<IconReceipt />}
                label="Jumlah Angsuran"
                value={
                  <span className="text-[13px] font-semibold text-[#5a6474]">
                    {formatRupiah(pengajuan.nilaiRekapitulasiAngsuran)}
                  </span>
                }
              />
              <Field
                icon={<IconHistory />}
                label="Opsi Riwayat Penagihan"
                value={labelOpsiRiwayatPenagihanTampilan(
                  pengajuan.opsiRiwayatPenagihan,
                )}
              />
              <Field
                icon={<IconFileBadge />}
                label="Bukti Tidak Mampu Bayar"
                value={labelBuktiTidakMampuTerupload(pengajuan)}
              />
            </div>

            {/* Penanggung jawab OPD */}
            <div className="border-t border-[#eef1f5] bg-[#f9fafc] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#1a4e8f]">
                  <IconUser />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
                    Penanggung Jawab OPD
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="truncate text-[13.5px] font-bold text-[#1a1a2e]">
                      {pengajuan.namaPenanggungJawab || "-"}
                    </span>
                    <span className="text-[11.5px] text-[#7a8899]">
                      · {pengajuan.jabatan || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Dokumen + Checklist ── */}
          {mode === "internal" && bolehApproveIni && level ? (
            <DaftarDokumenDenganChecklist
              pengajuan={pengajuan}
              riwayat={telaah.riwayat}
              currentLevel={level}
              checklistDokumen={checklistDokumen}
              onChecklistChange={handleChecklistChange}
            />
          ) : (
            <DaftarDokumenReadOnly
              pengajuan={pengajuan}
              riwayat={telaah.riwayat}
            />
          )}

          {/* ⚡ TimelineRiwayat DIPINDAH ke kolom kanan (lihat di bawah) */}
        </div>

        {/* ══════════════════ KOLOM KANAN ══════════════════ */}
        <div className="space-y-4 lg:col-span-1">
          {/* ── Form Telaah / Status ── */}
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            {telaah.selesai ? (
              <div>
                <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                  Status Telaah
                </div>
                <div className="rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-[#0f6e56]">
                      <IconCheck />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#065f46]">
                        Telaah Selesai
                      </div>
                      {telaah.selesaiPada && (
                        <div className="mt-0.5 text-[11px] text-[#3a8f74]">
                          {formatTanggalWaktu(telaah.selesaiPada)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-[#7a8899]">
                  Telaah internal sudah selesai. Tidak ada aksi lanjutan yang
                  perlu dilakukan — seluruh tahapan (Kasubbid, Kabid, Sekban)
                  telah terlewati.
                </p>
              </div>
            ) : bolehApproveIni ? (
              <div>
                <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                  Form Telaah — {level ? TELAAH_LEVEL_LABEL[level] : ""}
                </div>

                <div className="mb-3 rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-3 py-2 text-[12px] text-[#1e40af]">
                  Tahap Anda:{" "}
                  <span className="font-semibold">
                    {TELAAH_TAHAP_LABEL[TELAAH_TAHAP_BY_LEVEL[level!]]}
                  </span>
                </div>

                <div className="mb-3">
                  <ProgressChecklist
                    total={checklistStats.total}
                    checked={checklistStats.checked}
                  />
                </div>

                <label className="mb-1.5 block text-[12px] font-bold text-gray-500">
                  CATATAN UMUM (opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={5}
                  placeholder="Kesimpulan telaah (boleh dikosongkan)..."
                  className="w-full resize-none rounded-sm border border-[#e2e8f2] bg-gray-50 p-3 text-[13px] text-[#1a1a2e] outline-none focus:border-[#a0bdec] focus:bg-white"
                />

                {error && (
                  <div className="mt-2 flex items-start gap-2 rounded-sm border border-[#fecaca] bg-[#fef2f2] p-2.5 text-[12px] font-medium text-[#c0392b]">
                    <span className="mt-0.5 shrink-0">
                      <IconAlert />
                    </span>
                    <span className="whitespace-pre-line">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-[#1a4e8f] py-2.5 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-[#2d63a8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <IconCheck />
                  {isSubmitting
                    ? "Menyimpan…"
                    : level
                      ? labelTombolApprove(level)
                      : "Approve"}
                </button>

                <button
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-sm border border-[#e2e8f2] bg-white py-2.5 text-sm font-semibold text-[#5a6474] transition hover:cursor-pointer hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
              </div>
            ) : mode === "admin" ? (
              <div>
                <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                  Status Telaah
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-0.5 text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                      Tahap Saat Ini
                    </div>
                    <div className="text-[13px] font-semibold text-[#1a4e8f]">
                      {TELAAH_TAHAP_LABEL[telaah.tahapSaatIni]}
                    </div>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                      Diajukan Oleh
                    </div>
                    <div className="font-mono text-[13px] text-[#1a1a2e]">
                      {telaah.diajukanOleh}
                    </div>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                      Diajukan Pada
                    </div>
                    <div className="text-[13px] text-[#1a1a2e]">
                      {formatTanggalWaktu(telaah.diajukanPada)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                      Jumlah Langkah
                    </div>
                    <div className="text-[13px] text-[#1a1a2e]">
                      {telaah.riwayat.length} dari 4
                    </div>
                  </div>
                </div>
                <p className="mt-4 rounded-sm border border-dashed border-[#e2e8f2] bg-[#f9fafc] p-3 text-[11.5px] leading-relaxed text-[#7a8899]">
                  Anda login sebagai Admin — hanya bisa melihat detail. Approve
                  dilakukan oleh Kasubbid, Kabid, atau Sekban.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                  Informasi Telaah
                </div>
                <div className="rounded-sm border border-dashed border-[#e2e8f2] bg-[#f9fafc] p-4 text-[12.5px] text-[#5a6474]">
                  <p className="mb-2">
                    Telaah ini{" "}
                    <span className="font-semibold">
                      tidak sedang di tahap Anda
                    </span>
                    .
                  </p>
                  <p>
                    Saat ini menunggu:{" "}
                    <span className="font-semibold text-[#1a4e8f]">
                      {TELAAH_TAHAP_LABEL[telaah.tahapSaatIni]}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ⚡ Timeline Riwayat — DIPINDAH dari kolom kiri ke sini */}
          <TimelineRiwayat riwayat={telaah.riwayat} />
        </div>
      </div>
    </div>
  );
}
