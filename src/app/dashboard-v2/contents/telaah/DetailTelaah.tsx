"use client";

/* ------------------------------------------------------------------ */
/*  DetailTelaah.tsx                                                   */
/*  Panel detail satu siklus telaah internal.                          */
/*                                                                      */
/*  Aksi dinamis sesuai state:                                          */
/*   - Naik  : Approve (semua Sesuai) atau Revisi (ada Belum Sesuai)   */
/*   - Turun : Teruskan                                                 */
/*   - Lain  : Lihat saja                                               */
/*                                                                      */
/*  Validasi Revisi:                                                    */
/*   - Tombol TIDAK di-disable — user tetap bisa klik                   */
/*   - Validasi muncul sebagai ERROR di bawah tombol saat diklik        */
/*   - Card status pakai warna biru kalem (bukan merah) supaya user     */
/*     tidak panik; tombol Revisi tetap merah                           */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import {
  TELAAH_LEVEL_LABEL,
  TELAAH_MILESTONE_LABEL,
  TELAAH_TAHAP_LABEL,
  TELAAH_TAHAP_BY_LEVEL,
  getAksiTelaah,
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

const IconX = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
  </svg>
);

const IconArrowRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
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

function labelTombolTeruskan(level: TelaahLevel): string {
  if (level === "kasubbid") return "Teruskan ke Admin";
  if (level === "kabid") return "Teruskan ke Kasubbid";
  return "Teruskan";
}

/* ==================== Sub-komponen: Field ==================== */

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

/* ==================== Timeline ==================== */

const TimelineRiwayat: React.FC<{
  riwayat: import("@/types/telaah-internal").TelaahLogEntry[];
}> = ({ riwayat }) => {
  const MILESTONE_COLOR: Record<string, string> = {
    DIAJUKAN: "bg-[#1a4e8f]",
    SUDAH_TELAAH_KASUBBID: "bg-emerald-500",
    SUDAH_TELAAH_KABID: "bg-purple-500",
    SUDAH_TELAAH_SEKBAN: "bg-rose-500",
    REVISI_DARI_KASUBBID: "bg-orange-500",
    REVISI_DARI_KABID: "bg-orange-500",
    REVISI_DARI_SEKBAN: "bg-orange-500",
    DITERUSKAN_KASUBBID: "bg-amber-500",
    DITERUSKAN_KABID: "bg-amber-500",
    DIKIRIM_KE_OPD: "bg-amber-600",
    SIKLUS_BARU_DIMULAI: "bg-[#1a4e8f]",
  };

  return (
    <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
      <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
        Riwayat Telaah ({riwayat.length} langkah)
      </div>
      <div className="space-y-4">
        {riwayat.map((entry, idx) => {
          const isLast = idx === riwayat.length - 1;
          const colorClass = MILESTONE_COLOR[entry.milestone] ?? "bg-[#1a4e8f]";
          return (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${colorClass}`}
                >
                  {idx + 1}
                </div>
                {!isLast && <div className="my-1 w-px flex-1 bg-[#e2e8f2]" />}
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
};

/* ==================== Progress Checklist (sidebar) ==================== */

const ProgressChecklist: React.FC<{
  total: number;
  sesuai: number;
  belumSesuai: number;
}> = ({ total, sesuai, belumSesuai }) => {
  const belumDitelaah = total - sesuai - belumSesuai;
  const adaBelumSesuai = belumSesuai > 0;
  const isComplete = total > 0 && belumDitelaah === 0 && !adaBelumSesuai;
  const isEmpty = total === 0;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  // Warna card: biru kalem (bukan merah) saat ada Belum Sesuai.
  const cardClass = isEmpty
    ? "border-[#e2e8f2] bg-[#f7f8fa]"
    : adaBelumSesuai
      ? "border-[#dbe6f7] bg-[#eff6ff]"
      : isComplete
        ? "border-[#a7f3d0] bg-[#ecfdf5]"
        : "border-[#fde68a] bg-[#fffbeb]";

  const textClass = isEmpty
    ? "text-[#7a8899]"
    : adaBelumSesuai
      ? "text-[#1e40af]"
      : isComplete
        ? "text-[#0f6e56]"
        : "text-[#b45309]";

  const message = isEmpty
    ? "Tidak ada dokumen yang diupload."
    : adaBelumSesuai
      ? `${belumSesuai} dokumen Belum Sesuai — klik Revisi.`
      : isComplete
        ? "Semua dokumen Sesuai. Siap approve."
        : `${belumDitelaah} dokumen belum ditelaah.`;

  return (
    <div className={`rounded-sm border px-3 py-2.5 ${cardClass}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className={`text-[11.5px] font-bold tracking-wide uppercase ${textClass}`}
        >
          Checklist Dokumen
        </span>
        <span className={`text-[12.5px] font-bold ${textClass}`}>
          {sesuai + belumSesuai}/{total}
        </span>
      </div>

      <div className="flex h-1.5 w-full overflow-hidden rounded-sm bg-white">
        {sesuai > 0 && (
          <div
            className="h-full bg-[#0f9b6e] transition-all duration-300"
            style={{ width: `${pct(sesuai)}%` }}
          />
        )}
        {belumSesuai > 0 && (
          <div
            className="h-full bg-[#c0392b] transition-all duration-300"
            style={{ width: `${pct(belumSesuai)}%` }}
          />
        )}
      </div>

      <p className={`mt-1.5 text-[10.5px] ${textClass}`}>{message}</p>
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
  const {
    getTelaahByPengajuanId,
    approveTelaah,
    revisiTelaah,
    teruskanRevisi,
  } = useTelaahInternalStore();
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
  const aksi = level ? getAksiTelaah(telaah.tahapSaatIni, level) : "lihat_saja";

  const bisaAksi =
    mode === "internal" &&
    level !== null &&
    !telaah.selesai &&
    (aksi === "telaah" || aksi === "teruskan");

  const dokumenFlat = flattenDokumenTampilan(buildDokumenTampilan(pengajuan));
  const dokumenUploaded = dokumenFlat.filter((d) => d.file !== null);

  const stats = (() => {
    let sesuai = 0;
    let belumSesuai = 0;
    for (const d of dokumenUploaded) {
      const item = checklistDokumen[d.key];
      if (item?.status === "sesuai") sesuai++;
      else if (item?.status === "belum_sesuai") belumSesuai++;
    }
    return { total: dokumenUploaded.length, sesuai, belumSesuai };
  })();

  const handleChecklistChange = (
    docKey: string,
    value: Partial<ChecklistItem>,
  ) => {
    setChecklistDokumen((prev) => {
      const current: ChecklistItem = prev[docKey] ?? {
        status: null,
        catatan: "",
      };
      return { ...prev, [docKey]: { ...current, ...value } };
    });
    if (error) setError(null);
  };

  // Submit approve/revisi
  const handleSubmitTelaah = async () => {
    if (!level || !user?.username || isSubmitting) return;

    const missing: string[] = [];
    const missingCatatan: string[] = [];

    for (const d of dokumenUploaded) {
      const item = checklistDokumen[d.key];
      if (!item || item.status === null) {
        missing.push(d.label);
      } else if (
        item.status === "belum_sesuai" &&
        item.catatan.trim().length < 5
      ) {
        missingCatatan.push(d.label);
      }
    }

    if (missing.length > 0) {
      setError(
        `Masih ada dokumen yang belum ditelaah (${missing.length}):\n${missing
          .map((l) => `• ${l}`)
          .join("\n")}`,
      );
      return;
    }

    if (missingCatatan.length > 0) {
      setError(
        `Dokumen "Belum Sesuai" wajib diberi catatan (min. 5 karakter):\n${missingCatatan
          .map((l) => `• ${l}`)
          .join("\n")}`,
      );
      return;
    }

    const akanRevisi = stats.belumSesuai > 0;
    if (akanRevisi && catatan.trim().length < 5) {
      setError(
        "Catatan Umum wajib diisi (minimal 5 karakter) ketika mengembalikan pengajuan untuk revisi.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const uploadedKeys = new Set(dokumenUploaded.map((d) => d.key));
    const checklistToSend: ChecklistMap = {};
    for (const [key, value] of Object.entries(checklistDokumen)) {
      if (uploadedKeys.has(key)) {
        checklistToSend[key] = {
          status: value.status,
          catatan: value.catatan.trim(),
        };
      }
    }

    try {
      if (akanRevisi) {
        await revisiTelaah(
          telaah.id,
          level,
          user.username,
          catatan,
          checklistToSend,
        );
      } else {
        await approveTelaah(
          telaah.id,
          level,
          user.username,
          catatan,
          checklistToSend,
        );
      }
      onBack();
    } catch (err) {
      console.error("Gagal submit telaah:", err);
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi.",
      );
      setIsSubmitting(false);
    }
  };

  // Submit teruskan
  const handleTeruskan = async () => {
    if (!level || !user?.username || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await teruskanRevisi(telaah.id, level, user.username, catatan);
      onBack();
    } catch (err) {
      console.error("Gagal meneruskan revisi:", err);
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi.",
      );
      setIsSubmitting(false);
    }
  };

  const identitasUtama = telaah.nomorRegistrasi || telaah.nomorPengajuan;
  const siklusKe = telaah.siklusKe ?? 1;

  const belumDitelaah = stats.total - stats.sesuai - stats.belumSesuai;
  const semuaSesuai = stats.total > 0 && stats.sesuai === stats.total;
  const adaBelumSesuai = stats.belumSesuai > 0;

  const isCatatanUmumValid = catatan.trim().length >= 5;

  return (
    <div className="mx-auto w-full max-w-400">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#1a4e8f] hover:underline"
      >
        <IconArrowLeft /> Kembali ke daftar
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* KOLOM KIRI */}
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white">
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

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#fbbf24]" />
                    {TELAAH_TAHAP_LABEL[telaah.tahapSaatIni]}
                  </span>
                  {siklusKe > 1 && (
                    <span className="inline-flex items-center gap-1 rounded-sm border border-[#fbbf24]/40 bg-[#fbbf24]/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#fbbf24] uppercase">
                      Siklus ke-{siklusKe}
                    </span>
                  )}
                </div>
              </div>
            </div>

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

          {bisaAksi && aksi === "telaah" && level ? (
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
        </div>

        {/* KOLOM KANAN */}
        <div className="space-y-4 lg:col-span-1">
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
              </div>
            ) : telaah.tahapSaatIni === "MENUNGGU_REVISI_OPD" ? (
              <div>
                <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                  Status Telaah
                </div>
                <div className="rounded-sm border border-[#fed7aa] bg-[#fff7ed] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ffedd5] text-[#b45309]">
                      <IconAlert />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#9a3412]">
                        Menunggu Revisi OPD
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#b45309]">
                        Revisi sudah dikirim ke OPD. Menunggu OPD submit
                        perbaikan.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : bisaAksi && aksi === "teruskan" && level ? (
              <div>
                <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                  Teruskan Revisi — {TELAAH_LEVEL_LABEL[level]}
                </div>

                <div className="mb-3 rounded-sm border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-[12px] text-[#9a3412]">
                  Anda menerima <span className="font-semibold">revisi</span>{" "}
                  dari level atas. Silakan tambah catatan (opsional) lalu
                  teruskan ke jenjang berikutnya.
                </div>

                <label className="mb-1.5 block text-[12px] font-bold text-gray-500">
                  CATATAN (opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={4}
                  placeholder="Tambahkan catatan bila perlu…"
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
                  onClick={handleTeruskan}
                  disabled={isSubmitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-[#f59e0b] py-2.5 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-[#d97706] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <IconArrowRight />
                  {isSubmitting ? "Menyimpan…" : labelTombolTeruskan(level)}
                </button>
                <button
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-sm border border-[#e2e8f2] bg-white py-2.5 text-sm font-semibold text-[#5a6474] transition hover:cursor-pointer hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
              </div>
            ) : bisaAksi && aksi === "telaah" && level ? (
              <div>
                <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                  Form Telaah — {TELAAH_LEVEL_LABEL[level]}
                </div>

                <div className="mb-3 rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-3 py-2 text-[12px] text-[#1e40af]">
                  Tahap Anda:{" "}
                  <span className="font-semibold">
                    {TELAAH_TAHAP_LABEL[TELAAH_TAHAP_BY_LEVEL[level]]}
                  </span>
                </div>

                <div className="mb-3">
                  <ProgressChecklist
                    total={stats.total}
                    sesuai={stats.sesuai}
                    belumSesuai={stats.belumSesuai}
                  />
                </div>

                <label className="mb-1.5 block text-[12px] font-bold text-gray-500">
                  CATATAN UMUM{" "}
                  {adaBelumSesuai ? (
                    <span className="text-[#b45309]">
                      (wajib — min. 5 karakter)
                    </span>
                  ) : (
                    <span className="text-[#7a8899]">(opsional)</span>
                  )}
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => {
                    setCatatan(e.target.value);
                    if (error) setError(null);
                  }}
                  rows={4}
                  placeholder={
                    adaBelumSesuai
                      ? "Jelaskan kesimpulan revisi (min. 5 karakter)…"
                      : "Kesimpulan telaah (boleh dikosongkan)…"
                  }
                  className={`w-full resize-none rounded-sm border p-3 text-[13px] text-[#1a1a2e] outline-none focus:bg-white ${
                    adaBelumSesuai && !isCatatanUmumValid
                      ? "border-amber-300 bg-amber-50 focus:border-amber-400"
                      : "border-[#e2e8f2] bg-gray-50 focus:border-[#a0bdec]"
                  }`}
                />
                {adaBelumSesuai && !isCatatanUmumValid && (
                  <p className="mt-1 text-[11px] font-medium text-amber-700">
                    Catatan Umum wajib diisi minimal 5 karakter untuk Revisi.
                  </p>
                )}

                {error && (
                  <div className="mt-2 flex items-start gap-2 rounded-sm border border-[#fecaca] bg-[#fef2f2] p-2.5 text-[12px] font-medium text-[#c0392b]">
                    <span className="mt-0.5 shrink-0">
                      <IconAlert />
                    </span>
                    <span className="whitespace-pre-line">{error}</span>
                  </div>
                )}

                {belumDitelaah > 0 ? (
                  <div className="mt-3 rounded-sm border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[11.5px] text-[#b45309]">
                    Masih ada {belumDitelaah} dokumen yang belum ditelaah.
                  </div>
                ) : adaBelumSesuai ? (
                  <div className="mt-3 rounded-sm border border-[#dbe6f7] bg-[#eff6ff] px-3 py-2 text-[11.5px] text-[#1e40af]">
                    Ada {stats.belumSesuai} dokumen{" "}
                    <span className="font-semibold">Belum Sesuai</span>. Klik{" "}
                    <span className="font-semibold">Revisi</span> untuk
                    mengembalikan ke jenjang bawah.
                  </div>
                ) : semuaSesuai ? (
                  <div className="mt-3 rounded-sm border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-2 text-[11.5px] text-[#065f46]">
                    Semua dokumen <span className="font-semibold">Sesuai</span>.
                    Siap approve.
                  </div>
                ) : null}

                {/* Tombol TIDAK di-disable — hanya isSubmitting yang blok.
                    Validasi muncul sebagai error di bawah saat diklik. */}
                <button
                  onClick={handleSubmitTelaah}
                  disabled={isSubmitting}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-sm py-2.5 text-sm font-semibold text-white transition hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    adaBelumSesuai
                      ? "bg-[#c0392b] hover:bg-[#a63225]"
                      : "bg-[#1a4e8f] hover:bg-[#2d63a8]"
                  }`}
                >
                  {adaBelumSesuai ? <IconX /> : <IconCheck />}
                  {isSubmitting
                    ? "Menyimpan…"
                    : adaBelumSesuai
                      ? "Revisi"
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
                      {telaah.riwayat.length} langkah
                    </div>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[10.5px] font-semibold tracking-wider text-[#7a8899] uppercase">
                      Siklus ke-
                    </div>
                    <div className="text-[13px] text-[#1a1a2e]">{siklusKe}</div>
                  </div>
                </div>
                <p className="mt-4 rounded-sm border border-dashed border-[#e2e8f2] bg-[#f9fafc] p-3 text-[11.5px] leading-relaxed text-[#7a8899]">
                  Anda login sebagai Admin — hanya bisa melihat detail.
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

          <TimelineRiwayat riwayat={telaah.riwayat} />
        </div>
      </div>
    </div>
  );
}
