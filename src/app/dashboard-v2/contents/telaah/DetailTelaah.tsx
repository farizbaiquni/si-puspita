"use client";

/* ------------------------------------------------------------------ */
/*  DetailTelaah.tsx                                                   */
/*  Panel detail satu siklus telaah internal.                          */
/*                                                                      */
/*  Layout:                                                            */
/*   - Kiri (2/3): info pengajuan + semua dokumen                      */
/*   - Kanan (1/3): sidebar status/form approve + timeline riwayat     */
/*                                                                      */
/*  REVISI: Riwayat Telaah dipindah dari kolom kiri ke kolom kanan,    */
/*  di bawah div Status Telaah. `lg:sticky` di div status dihapus      */
/*  supaya tidak overlap dengan Timeline di bawahnya.                  */
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
  DaftarDokumenLengkap,
  formatRupiah,
  formatTanggal,
  formatTanggalWaktu,
  labelBuktiTidakMampuTerupload,
  labelJenisPiutang,
  labelOpsiRiwayatPenagihanTampilan,
} from "./TelaahDokumenShared";

/* ==================== Ikon kecil ==================== */

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

/* ==================== Helper label tombol ==================== */

/**
 * Label tombol approve berdasarkan level user. Konsisten dengan
 * tahapSaatIni yang diharapkan (TELAAH_TAHAP_BY_LEVEL).
 */
function labelTombolApprove(level: TelaahLevel): string {
  if (level === "kasubbid") return "Approve & Teruskan ke Kabid";
  if (level === "kabid") return "Approve & Teruskan ke Sekban";
  return "Approve Final";
}

/* ==================== Komponen kecil ==================== */

const FieldItem: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="min-w-0">
    <div className="mb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[#7a8899] uppercase">
      {label}
    </div>
    <div className="truncate text-[13px] text-[#1a1a2e]">{value}</div>
  </div>
);

/* ==================== Timeline Riwayat ==================== */

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
        return (
          <div key={idx} className="flex gap-3">
            {/* Garis vertikal + dot */}
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a4e8f] text-white">
                {entry.milestone === "DIAJUKAN" ? (
                  <span className="text-[11px] font-bold">📝</span>
                ) : (
                  <IconCheck />
                )}
              </div>
              {!isLast && <div className="my-1 w-px flex-1 bg-[#e2e8f2]" />}
            </div>

            {/* Konten */}
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

/* ==================== Komponen utama ==================== */

interface DetailTelaahProps {
  telaahId: string;
  onBack: () => void;
  /**
   * Mode tampilan sidebar kanan:
   *   - "internal" (default): tampil form approve kalau tahap user cocok.
   *   - "admin"             : read-only, tidak ada form approve.
   */
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

  const telaah = getTelaahByPengajuanId(telaahId);
  const pengajuan = getPengajuanById(telaahId);

  /* ── Guard: data tidak ditemukan ── */
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

  /* ── Hitung izin user untuk approve ──
     Hanya berlaku di mode "internal". Di mode "admin", tidak akan
     pernah true karena ada guard `mode === "internal"` di depan. */
  const level = user?.telaahLevel ?? null;
  const bolehApproveIni =
    mode === "internal" &&
    level !== null &&
    !telaah.selesai &&
    bolehApprove(telaah.tahapSaatIni, level);

  /* ── Handler approve ── */
  const handleApprove = async () => {
    if (!level || !user?.username) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await approveTelaah(telaah.id, level, user.username, catatan);
      // Setelah sukses, kembali ke daftar — onSnapshot akan auto-refresh.
      onBack();
    } catch (err) {
      console.error("Gagal approve telaah:", err);
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan. Coba lagi.",
      );
      setIsSubmitting(false);
    }
    // Tidak reset isSubmitting saat sukses — karena komponen akan unmount
    // saat onBack() dipanggil (parent mengubah state).
  };

  /* ── Identitas untuk header ── */
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
          {/* ── Kartu identitas ── */}
          <div className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eef1f5] bg-[#f9fafc] px-5 py-4">
              <div>
                <div className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
                  Nomor Registrasi
                </div>
                <div className="font-mono text-[15px] font-bold text-[#0f9b6e]">
                  {identitasUtama}
                </div>
                <div className="mt-1.5 text-[11px] font-semibold tracking-[0.08em] text-[#7a8899] uppercase">
                  Nomor Pengajuan
                </div>
                <div className="font-mono text-[12.5px] text-[#5a6474]">
                  {telaah.nomorPengajuan}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#1e40af] uppercase">
                  {TELAAH_TAHAP_LABEL[telaah.tahapSaatIni]}
                </span>
                {telaah.selesai && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-semibold text-[#065f46]">
                    <IconCheck /> Selesai
                  </span>
                )}
              </div>
            </div>

            {/* Info pengajuan */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-b border-[#eef1f5] px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldItem label="Nama OPD" value={pengajuan.namaOPD} />
              <FieldItem
                label="Tanggal Surat"
                value={formatTanggal(pengajuan.tanggalSurat)}
              />
              <FieldItem
                label="Jenis Piutang"
                value={labelJenisPiutang(pengajuan.jenisPiutang)}
              />
              <FieldItem
                label="Jenis Penghapusan"
                value={pengajuan.jenisPenghapusan || "-"}
              />
              <FieldItem
                label="Jumlah Debitur"
                value={`${pengajuan.jumlahDebitur || "-"} orang`}
              />
              <FieldItem
                label="Total Nilai Piutang"
                value={
                  <span className="font-bold text-[#1a4e8f]">
                    {formatRupiah(pengajuan.totalNilaiPiutang)}
                  </span>
                }
              />
              <FieldItem
                label="Jumlah Angsuran"
                value={formatRupiah(pengajuan.nilaiRekapitulasiAngsuran)}
              />
              <FieldItem
                label="Opsi Riwayat Penagihan"
                value={labelOpsiRiwayatPenagihanTampilan(
                  pengajuan.opsiRiwayatPenagihan,
                )}
              />
              <FieldItem
                label="Bukti Tidak Mampu Bayar"
                value={labelBuktiTidakMampuTerupload(pengajuan)}
              />
            </div>

            {/* Penanggung jawab OPD */}
            <div className="px-5 py-4">
              <div className="mb-3 text-[11px] font-bold tracking-[0.08em] text-[#7a8899] uppercase">
                Penanggung Jawab OPD
              </div>
              <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
                <FieldItem
                  label="Nama"
                  value={pengajuan.namaPenanggungJawab || "-"}
                />
                <FieldItem label="Jabatan" value={pengajuan.jabatan || "-"} />
              </div>
            </div>
          </div>

          {/* ── Dokumen pendukung (shortcut dari shared) ── */}
          <DaftarDokumenLengkap pengajuan={pengajuan} />

          {/* ⚡ TimelineRiwayat SEBELUMNYA DI SINI — DIPINDAH KE KOLOM KANAN */}
        </div>

        {/* ══════════════════ KOLOM KANAN ══════════════════ */}
        <div className="space-y-4 lg:col-span-1">
          {/* ── Status Telaah / Form Approve ──
             `lg:sticky lg:top-4` DIHAPUS karena sekarang ada Timeline
             di bawahnya — sticky akan overlap dengan Timeline saat scroll. */}
          <div className="rounded-sm border border-[#e2e8f2] bg-white p-5">
            {telaah.selesai ? (
              /* ═══ SKENARIO 1: Selesai (semua mode) ═══ */
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
              /* ═══ SKENARIO 2: User internal berhak approve di tahap ini ═══ */
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

                <label className="mb-1.5 block text-[12px] font-bold text-gray-500">
                  CATATAN / NOTES (opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={6}
                  placeholder="Tulis catatan telaah Anda (boleh dikosongkan)..."
                  className="w-full resize-none rounded-sm border border-[#e2e8f2] bg-gray-50 p-3 text-[13px] text-[#1a1a2e] outline-none focus:border-[#a0bdec] focus:bg-white"
                />

                {error && (
                  <div className="mt-2 rounded-sm border border-[#fecaca] bg-[#fef2f2] p-2.5 text-[12px] font-medium text-[#c0392b]">
                    {error}
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
              /* ═══ SKENARIO 3a: Mode admin, telaah belum selesai (read-only) ═══ */
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
              /* ═══ SKENARIO 3b: User internal, bukan pemilik tahap ini ═══ */
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

          {/* ⚡ BARU: Timeline Riwayat Telaah — dipindah dari kolom kiri */}
          <TimelineRiwayat riwayat={telaah.riwayat} />
        </div>
      </div>
    </div>
  );
}
