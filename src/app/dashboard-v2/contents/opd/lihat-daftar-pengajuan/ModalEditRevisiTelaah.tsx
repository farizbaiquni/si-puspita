"use client";

/* ------------------------------------------------------------------ */
/*  ModalEditRevisiTelaah.tsx                                          */
/*  Modal OPD untuk perbaiki revisi TELAAH INTERNAL.                   */
/*                                                                      */
/*  Improvement:                                                       */
/*   - Catatan telaah ditampilkan LANGSUNG di bawah label dokumen      */
/*     yang bermasalah (bukan cuma badge "Perlu diperbaiki")           */
/*   - Anti-duplikasi: catatan umum per level di-skip kalau level +    */
/*     timestamp sama sudah tampil di catatan per-dokumen              */
/* ------------------------------------------------------------------ */

import React, { useState, useRef, useMemo, type ChangeEvent } from "react";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  UploadedFileRef,
  CatatanDokumenRevisi,
  CatatanRevisiTelaah,
  TelaahLevelSumberCatatan,
} from "@/types/types";
import {
  JENIS_PENGHAPUSAN_OPTIONS,
  JENIS_PIUTANG_OPTIONS,
  TELAAH_LEVEL_SUMBER_CATATAN_LABEL,
} from "@/types/types";
import type { TelaahLogEntry } from "@/types/telaah-internal";
import { useTelaahInternalStore } from "@/store/telaah-internal-store";
import { simpanPerbaikanRevisiTelaah } from "@/lib/pengajuan";
import {
  buildDokumenTampilan,
  flattenDokumenTampilan,
} from "../../telaah/TelaahDokumenShared";

/* ==================== Ikon ==================== */

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

const IconPencil = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M11.5 2.5a1.5 1.5 0 012.12 2.12L5 13.25l-3 .75.75-3 8.75-8.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconUpload = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M8 10.5V2M8 2L5 5M8 2l3 3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 10.5v2a1.5 1.5 0 001.5 1.5h8a1.5 1.5 0 001.5-1.5v-2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconFile = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      d="M9 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L9 1z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 1v4h4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconAlert = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M8 2.5l6 11H2l6-11z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 6.5v3.5M8 12v.5" strokeLinecap="round" />
  </svg>
);

const IconFileBadge = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5l-4-3z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 2v3h3M6 8.5h4M6 11h3" strokeLinecap="round" />
  </svg>
);

const IconChat = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M14 8a5.5 5.5 0 01-5.5 5.5H4L1.5 15v-3.4A5.5 5.5 0 017 5.5h1.5A5.5 5.5 0 0114 8z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ==================== Helper ==================== */

function formatRupiahInput(value: string): string {
  if (!value) return "";
  const num = parseFloat(value.replace(/,/g, ""));
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace(/\s/g, "");
}

const parseRupiahInput = (value: string): string =>
  value.replace(/[^0-9]/g, "");

function formatTanggalWaktuSingkat(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return (
    d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

function hitungCatatanPerDokumenDariRiwayat(
  riwayat: TelaahLogEntry[],
): CatatanDokumenRevisi[] {
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
  const riwayatSiklusIni = riwayat.slice(siklusAwalIdx);

  const hasil: CatatanDokumenRevisi[] = [];
  for (const entry of riwayatSiklusIni) {
    if (!entry.checklistDokumen) continue;
    if (entry.olehTelaahLevel === "admin") continue;

    for (const [docKey, item] of Object.entries(entry.checklistDokumen)) {
      if (item.status === "belum_sesuai" && item.catatan.trim()) {
        hasil.push({
          docKey,
          olehLevel: entry.olehTelaahLevel as TelaahLevelSumberCatatan,
          olehUsername: entry.olehUsername,
          catatan: item.catatan,
          timestamp: entry.timestamp,
        });
      }
    }
  }
  return hasil;
}

function hitungCatatanPerLevelDariRiwayat(
  riwayat: TelaahLogEntry[],
): CatatanRevisiTelaah[] {
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
  const hasilTerbalik: CatatanRevisiTelaah[] = [];
  for (let i = riwayat.length - 1; i >= siklusAwalIdx; i--) {
    const entry = riwayat[i];
    const isRevisi = entry.milestone.startsWith("REVISI_DARI_");
    const isTeruskan = entry.milestone.startsWith("DITERUSKAN_");
    const isKirimKeOPD = entry.milestone === "DIKIRIM_KE_OPD";
    if (isRevisi || isTeruskan || isKirimKeOPD) {
      hasilTerbalik.push({
        olehLevel: entry.olehTelaahLevel as TelaahLevelSumberCatatan,
        olehUsername: entry.olehUsername,
        catatan: entry.catatan,
        timestamp: entry.timestamp,
      });
    }
  }
  return hasilTerbalik.reverse();
}

/* ==================== Section wrapper ==================== */

const EditSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3 className="mb-3 text-xs font-bold tracking-widest text-[#ea580c] uppercase">
      {title}
    </h3>
    <div className="space-y-3.5">{children}</div>
  </div>
);

/* ==================== Catatan Inline (di bawah file slot) ========== */

const CatatanInlineDokumen: React.FC<{
  catatanList: CatatanDokumenRevisi[];
}> = ({ catatanList }) => {
  if (catatanList.length === 0) return null;

  return (
    <div className="mt-2 overflow-hidden rounded-sm border border-[#fdba74] bg-[#fff7ed]/60">
      {/* Header kecil */}
      <div className="flex items-center gap-1.5 border-b border-[#fdba74]/50 bg-[#ffedd5] px-2.5 py-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-[#ea580c] text-white">
          <IconAlert />
        </span>
        <span className="text-[10.5px] font-bold tracking-wide text-[#9a3412] uppercase">
          Catatan dari Telaah Internal ({catatanList.length})
        </span>
      </div>

      {/* Daftar catatan per level */}
      <div className="divide-y divide-[#fdba74]/40">
        {catatanList.map((c, idx) => (
          <div key={idx} className="flex items-start gap-2 px-2.5 py-2">
            <span className="mt-0.5 inline-flex shrink-0 items-center rounded-sm border border-[#fdba74] bg-white px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#9a3412] uppercase">
              {TELAAH_LEVEL_SUMBER_CATATAN_LABEL[c.olehLevel]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-relaxed whitespace-pre-line text-[#1a1a2e]">
                {c.catatan}
              </p>
              <p className="mt-0.5 text-[10px] text-[#b0bac5]">
                {formatTanggalWaktuSingkat(c.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== File Slot ==================== */

const EditFileSlot: React.FC<{
  label: string;
  existingFile: UploadedFileRef | null;
  newFile: File | null;
  dihapus?: boolean;
  onChangeFile: (file: File | null) => void;
  onHapus?: () => void;
  onBatalkanHapus?: () => void;
  required?: boolean;
  catatanList?: CatatanDokumenRevisi[];
}> = ({
  label,
  existingFile,
  newFile,
  dihapus = false,
  onChangeFile,
  onHapus,
  onBatalkanHapus,
  required = true,
  catatanList = [],
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCatatan = catatanList.length > 0;

  const handlePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChangeFile(file);
    e.target.value = "";
  };

  const tampilanNama = newFile ? newFile.name : existingFile?.namaFile;
  const adaFileLama = Boolean(existingFile);
  const adaFile = Boolean(newFile) || (adaFileLama && !dihapus);

  return (
    <div className="space-y-1">
      <label className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-[#3a4454]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div
        className={`flex items-center justify-between gap-2 rounded-sm border px-3 py-2 ${
          newFile
            ? "border-[#fdba74] bg-[#fff7ed]"
            : dihapus
              ? "border-red-200 bg-red-50"
              : adaFile
                ? hasCatatan
                  ? "border-[#fdba74] bg-[#fff7ed]/40"
                  : "border-[#e2e8f2] bg-[#f7f8fa]"
                : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[#7a8899]">
            <IconFile />
          </span>
          <div className="min-w-0">
            <p
              className={`truncate text-[12.5px] font-medium ${
                dihapus ? "text-red-500 line-through" : "text-[#1a1a2e]"
              }`}
            >
              {dihapus
                ? existingFile?.namaFile
                : tampilanNama || "Belum ada file"}
            </p>
            {newFile && (
              <p className="text-[10.5px] font-semibold text-[#ea580c]">
                File baru — akan menggantikan file lama
              </p>
            )}
            {dihapus && (
              <p className="text-[10.5px] font-semibold text-red-500">
                Akan dihapus, tidak digantikan file baru
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePick}
          />
          {!dihapus && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#1a4e8f] hover:bg-[#e8f0fb]"
            >
              <IconUpload />
              {adaFile ? "Ganti" : "Unggah"}
            </button>
          )}
          {newFile && (
            <button
              type="button"
              onClick={() => onChangeFile(null)}
              className="rounded-sm border border-red-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-red-600 hover:bg-red-50"
            >
              Batal
            </button>
          )}
          {!required && adaFileLama && !newFile && !dihapus && onHapus && (
            <button
              type="button"
              onClick={onHapus}
              className="rounded-sm border border-red-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          )}
          {dihapus && onBatalkanHapus && (
            <button
              type="button"
              onClick={onBatalkanHapus}
              className="rounded-sm border border-[#e2e8f2] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#5a6474] hover:bg-[#f7f8fa]"
            >
              Batalkan Hapus
            </button>
          )}
        </div>
      </div>

      {/* Catatan dari telaah — di bawah file slot */}
      <CatatanInlineDokumen catatanList={catatanList} />
    </div>
  );
};

/* ==================== Daftar dokumen ==================== */

const BUKTI_TIDAK_MAMPU_ITEMS: {
  key: keyof FormulirPenghapusanPiutangOPDRecord;
  label: string;
}[] = [
  { key: "buktiTidakMampuKartuKeluargaMiskin", label: "Kartu Keluarga Miskin" },
  { key: "buktiTidakMampuPutusanPailit", label: "Putusan Pailit" },
  {
    key: "buktiTidakMampuSuratKeteranganKelurahan",
    label: "Surat Keterangan Kelurahan / Instansi Berwenang",
  },
  {
    key: "buktiTidakMampuBantuanSosial",
    label: "Bukti Penerima Bantuan Sosial (BPNT / BST / PKH)",
  },
  {
    key: "buktiTidakMampuKunjunganPenagihan",
    label: "Bukti Kunjungan Penagihan",
  },
];

const SURAT_TAGIHAN_ITEMS: {
  key: keyof FormulirPenghapusanPiutangOPDRecord;
  label: string;
}[] = [
  { key: "riwayatPenagihan1", label: "Bukti riwayat tagihan ke-1" },
  { key: "riwayatPenagihan2", label: "Bukti riwayat tagihan ke-2" },
  { key: "riwayatPenagihan3", label: "Bukti riwayat tagihan ke-3" },
  { key: "filePernyataanOPD", label: "Bukti pernyataan OPD" },
];

/* ==================== Banner: Dokumen yang Perlu Diperbaiki ============ */

const BannerDokumenPerluDiperbaiki: React.FC<{
  pengajuan: FormulirPenghapusanPiutangOPDRecord;
  catatanPerDokumen: CatatanDokumenRevisi[];
}> = ({ pengajuan, catatanPerDokumen }) => {
  const grouped = useMemo(() => {
    const dokumenFlat = flattenDokumenTampilan(buildDokumenTampilan(pengajuan));
    const map = new Map<
      string,
      { label: string; items: CatatanDokumenRevisi[] }
    >();

    for (const c of catatanPerDokumen) {
      if (!map.has(c.docKey)) {
        const entry = dokumenFlat.find((d) => d.key === c.docKey);
        map.set(c.docKey, {
          label: entry?.label ?? c.docKey,
          items: [],
        });
      }
      map.get(c.docKey)!.items.push(c);
    }
    return Array.from(map.entries()).map(([docKey, v]) => ({
      docKey,
      label: v.label,
      items: v.items,
    }));
  }, [pengajuan, catatanPerDokumen]);

  if (grouped.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold tracking-widest text-[#1a1a2e] uppercase">
        <IconFileBadge />
        Dokumen yang Perlu Diperbaiki ({grouped.length})
      </h3>

      <div className="space-y-3">
        {grouped.map((g) => (
          <div
            key={g.docKey}
            className="overflow-hidden rounded-sm border border-[#e2e8f2] bg-white"
          >
            <div className="flex items-start gap-2 border-b border-[#eef1f5] bg-[#fafbfc] px-3 py-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#ea580c] text-white">
                <IconAlert />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] leading-snug font-bold text-[#1a1a2e]">
                  {g.label}
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#eef1f5] bg-white">
              {g.items.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2 px-3 py-2.5">
                  <span className="mt-0.5 inline-flex shrink-0 items-center rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#3a4454] uppercase">
                    {TELAAH_LEVEL_SUMBER_CATATAN_LABEL[c.olehLevel]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-relaxed whitespace-pre-line text-[#1a1a2e]">
                      {c.catatan}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-[#b0bac5]">
                      {formatTanggalWaktuSingkat(c.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== Banner: Catatan Berjenjang Umum ============ */

const BannerCatatanBerjenjang: React.FC<{
  catatanPerLevel: CatatanRevisiTelaah[];
  catatanPerDokumen: CatatanDokumenRevisi[];
}> = ({ catatanPerLevel, catatanPerDokumen }) => {
  const filtered = useMemo(() => {
    return catatanPerLevel.filter((c) => {
      const sudahAdaPerDokumen = catatanPerDokumen.some(
        (pd) => pd.olehLevel === c.olehLevel && pd.timestamp === c.timestamp,
      );
      return !sudahAdaPerDokumen;
    });
  }, [catatanPerLevel, catatanPerDokumen]);

  if (filtered.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold tracking-widest text-[#1a1a2e] uppercase">
        <IconChat />
        Catatan Berjenjang dari Telaah ({filtered.length})
      </h3>

      <div className="space-y-2 rounded-sm border border-[#e2e8f2] bg-[#fafbfc] p-3">
        {filtered.map((c, idx) => (
          <div
            key={idx}
            className="rounded-sm border border-[#eef1f5] bg-white p-3"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#3a4454] uppercase">
                {TELAAH_LEVEL_SUMBER_CATATAN_LABEL[c.olehLevel]}
              </span>
              <span className="text-[10.5px] text-[#7a8899]">
                {formatTanggalWaktuSingkat(c.timestamp)}
              </span>
            </div>
            {c.catatan.trim() ? (
              <p className="mt-1.5 text-[12.5px] leading-relaxed whitespace-pre-line text-[#1a1a2e]">
                {c.catatan}
              </p>
            ) : (
              <p className="mt-1 text-[11.5px] text-[#b0bac5] italic">
                (tanpa catatan)
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==================== Komponen utama ==================== */

interface ModalEditRevisiTelaahProps {
  record: FormulirPenghapusanPiutangOPDRecord;
  onClose: () => void;
  onSimpan?: () => void;
}

export default function ModalEditRevisiTelaah({
  record,
  onClose,
  onSimpan,
}: ModalEditRevisiTelaahProps) {
  const { getTelaahByPengajuanId } = useTelaahInternalStore();
  const telaah = getTelaahByPengajuanId(record.id);

  // ── Data Pengajuan ──
  const [namaPenanggungJawab, setNamaPenanggungJawab] = useState(
    record.namaPenanggungJawab,
  );
  const [jabatan, setJabatan] = useState(record.jabatan);
  const [nomorSurat, setNomorSurat] = useState(record.nomorSurat);
  const [tanggalSurat, setTanggalSurat] = useState(record.tanggalSurat);
  const [jumlahDebitur, setJumlahDebitur] = useState(record.jumlahDebitur);
  const [totalNilaiPiutang, setTotalNilaiPiutang] = useState(
    record.totalNilaiPiutang,
  );
  const [jenisPiutang, setJenisPiutang] = useState(record.jenisPiutang);
  const [jenisPenghapusan, setJenisPenghapusan] = useState(
    record.jenisPenghapusan,
  );

  // ── File baru & hapus ──
  const [fileBaru, setFileBaru] = useState<
    Partial<Record<string, File | null>>
  >({});
  const [fileDihapus, setFileDihapus] = useState<Record<string, boolean>>({});

  const setFile = (key: string, file: File | null) => {
    setFileBaru((prev) => ({ ...prev, [key]: file }));
    if (file) {
      setFileDihapus((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };
  const hapusFile = (key: string) => {
    setFileDihapus((prev) => ({ ...prev, [key]: true }));
    setFileBaru((prev) => ({ ...prev, [key]: null }));
  };
  const batalkanHapusFile = (key: string) => {
    setFileDihapus((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSimpan = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const fieldBaru = {
        namaPenanggungJawab,
        jabatan,
        nomorSurat,
        tanggalSurat,
        jumlahDebitur,
        totalNilaiPiutang,
        jenisPiutang,
        jenisPenghapusan,
      };

      const fileUpdates: Partial<Record<string, File | null>> = {};
      (Object.keys(fileBaru) as string[]).forEach((key) => {
        if (fileBaru[key]) fileUpdates[key] = fileBaru[key];
      });
      (Object.keys(fileDihapus) as string[]).forEach((key) => {
        if (fileDihapus[key] && !fileBaru[key]) fileUpdates[key] = null;
      });

      await simpanPerbaikanRevisiTelaah(record.id, fieldBaru, fileUpdates);

      onSimpan?.();
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan perbaikan revisi telaah:", err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan. Coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Catatan per-dokumen: pakai dari pengajuan dulu, fallback hitung ulang ── */
  const catatanPerDokumen = useMemo<CatatanDokumenRevisi[]>(() => {
    const saved = record.revisiTelaahInternal?.catatanPerDokumen ?? [];
    if (saved.length > 0) return saved;
    if (!telaah) return [];
    return hitungCatatanPerDokumenDariRiwayat(telaah.riwayat);
  }, [record.revisiTelaahInternal, telaah]);

  /* ── Catatan per-level: fallback hitung ulang ── */
  const catatanPerLevel = useMemo<CatatanRevisiTelaah[]>(() => {
    const saved = record.revisiTelaahInternal?.catatanPerLevel ?? [];
    if (saved.length > 0) return saved;
    if (!telaah) return [];
    return hitungCatatanPerLevelDariRiwayat(telaah.riwayat);
  }, [record.revisiTelaahInternal, telaah]);

  /* ── Map docKey → list catatan, dipakai di EditFileSlot ── */
  const catatanPerDokumenMap = useMemo(() => {
    const map = new Map<string, CatatanDokumenRevisi[]>();
    catatanPerDokumen.forEach((c) => {
      if (!map.has(c.docKey)) map.set(c.docKey, []);
      map.get(c.docKey)!.push(c);
    });
    return map;
  }, [catatanPerDokumen]);

  const renderSlot = (
    key: keyof FormulirPenghapusanPiutangOPDRecord,
    label: string,
    required = true,
    keterangan?: string,
  ) => (
    <div className="space-y-1">
      <EditFileSlot
        label={label}
        existingFile={record[key] as unknown as UploadedFileRef | null}
        newFile={(fileBaru[key as string] as File | null) ?? null}
        dihapus={Boolean(fileDihapus[key as string])}
        onChangeFile={(f) => setFile(key as string, f)}
        onHapus={() => hapusFile(key as string)}
        onBatalkanHapus={() => batalkanHapusFile(key as string)}
        required={required}
        catatanList={catatanPerDokumenMap.get(key as string) ?? []}
      />
      {keterangan && (
        <p className="pl-1 text-[11px] text-[#7a8899]">{keterangan}</p>
      )}
    </div>
  );

  const jumlahBuktiTidakMampu = BUKTI_TIDAK_MAMPU_ITEMS.filter(({ key }) => {
    if (fileDihapus[key as string]) return false;
    return Boolean(fileBaru[key as string] ?? record[key]);
  }).length;

  const jumlahSuratTagihan = SURAT_TAGIHAN_ITEMS.filter(({ key }) => {
    if (fileDihapus[key as string]) return false;
    return Boolean(fileBaru[key as string] ?? record[key]);
  }).length;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,20,40,0.45)] p-0 backdrop-blur-sm sm:p-4 lg:p-6"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 bg-linear-to-r from-[#ea580c] to-[#c2410c] px-4 py-3 text-white sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <IconPencil />
              <h2 className="text-base font-bold">
                Perbaiki Revisi Telaah Internal
              </h2>
            </div>
            <p className="truncate text-sm text-orange-100">
              {record.nomorRegistrasi || record.nomorPengajuan}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            title="Tutup"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
          <BannerDokumenPerluDiperbaiki
            pengajuan={record}
            catatanPerDokumen={catatanPerDokumen}
          />

          <BannerCatatanBerjenjang
            catatanPerLevel={catatanPerLevel}
            catatanPerDokumen={catatanPerDokumen}
          />

          {/* Data Pengajuan */}
          <EditSection title="Data Pengajuan">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Nama Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={namaPenanggungJawab}
                  onChange={(e) => setNamaPenanggungJawab(e.target.value)}
                  className="w-full rounded-sm border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#ea580c]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full rounded-sm border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#ea580c]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Nomor Surat Pengantar
                </label>
                <input
                  type="text"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  className="w-full rounded-sm border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#ea580c]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Tanggal Surat
                </label>
                <input
                  type="date"
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  className="w-full rounded-sm border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] scheme-light outline-none focus:ring-1 focus:ring-[#ea580c]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Jumlah Debitur
                </label>
                <input
                  type="text"
                  value={jumlahDebitur}
                  onChange={(e) =>
                    setJumlahDebitur(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full rounded-sm border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#ea580c]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Total Nilai Piutang
                </label>
                <input
                  type="text"
                  value={formatRupiahInput(totalNilaiPiutang)}
                  onChange={(e) =>
                    setTotalNilaiPiutang(parseRupiahInput(e.target.value))
                  }
                  className="w-full rounded-sm border border-[#e2e8f2] px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#ea580c]/30"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Jenis Piutang
                </label>
                <select
                  value={jenisPiutang}
                  onChange={(e) =>
                    setJenisPiutang(e.target.value as typeof jenisPiutang)
                  }
                  className="w-full cursor-pointer rounded-sm border border-[#e2e8f2] bg-white px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#ea580c]/30"
                >
                  {JENIS_PIUTANG_OPTIONS.map((opsi) => (
                    <option key={opsi} value={opsi}>
                      {opsi}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[12.5px] font-semibold text-[#3a4454]">
                  Jenis Penghapusan
                </label>
                <select
                  value={jenisPenghapusan}
                  onChange={(e) =>
                    setJenisPenghapusan(
                      e.target.value as typeof jenisPenghapusan,
                    )
                  }
                  className="w-full cursor-pointer rounded-sm border border-[#e2e8f2] bg-white px-3 py-2 text-[13px] text-[#1a1a2e] outline-none focus:ring-1 focus:ring-[#ea580c]/30"
                >
                  {JENIS_PENGHAPUSAN_OPTIONS.map((opsi) => (
                    <option key={opsi} value={opsi}>
                      {opsi}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {renderSlot("fileSurat", "Surat Pengantar (Surat Utama)")}
          </EditSection>

          {/* Dokumen Pendukung */}
          <EditSection title="Dokumen Pendukung">
            {renderSlot("suratPengantarUsulan", "1. Surat Pengantar Usulan")}
            {renderSlot(
              "daftarNominatifPiutang",
              "2. Daftar Nominatif Usulan Piutang SKPD",
            )}
            {renderSlot(
              "persyaratanPiutangMacet",
              "3. Piutang telah berstatus macet dengan usia piutang > 3 tahun",
              true,
              "Upload SKRD/SK/Surat Perjanjian",
            )}
            {renderSlot(
              "persyaratanUsiaPencatatan",
              "4. Usia pencatatan piutang telah memenuhi ketentuan",
              false,
              "Upload neraca awal terjadinya piutang",
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-[#3a4454]">
                  5. Tidak mempunyai kemampuan untuk menyelesaikan utang{" "}
                  <span className="text-red-500">*</span>
                </p>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold ${
                    jumlahBuktiTidakMampu > 0
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {jumlahBuktiTidakMampu} dari {BUKTI_TIDAK_MAMPU_ITEMS.length}{" "}
                  diunggah
                </span>
              </div>
              <p className="text-[11px] text-[#7a8899]">
                Minimal satu harus dipenuhi dibawah ini.
              </p>
              <div className="space-y-3 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] p-3">
                {BUKTI_TIDAK_MAMPU_ITEMS.map((item) => (
                  <EditFileSlot
                    key={item.key as string}
                    label={item.label}
                    existingFile={
                      record[item.key] as unknown as UploadedFileRef | null
                    }
                    newFile={
                      (fileBaru[item.key as string] as File | null) ?? null
                    }
                    dihapus={Boolean(fileDihapus[item.key as string])}
                    onChangeFile={(f) => setFile(item.key as string, f)}
                    onHapus={() => hapusFile(item.key as string)}
                    onBatalkanHapus={() =>
                      batalkanHapusFile(item.key as string)
                    }
                    required={false}
                    catatanList={
                      catatanPerDokumenMap.get(item.key as string) ?? []
                    }
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12.5px] font-semibold text-[#3a4454]">
                  6. Surat tagihan telah diterbitkan{" "}
                  <span className="text-red-500">*</span>
                </p>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold ${
                    jumlahSuratTagihan > 0
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {jumlahSuratTagihan} dari {SURAT_TAGIHAN_ITEMS.length}{" "}
                  diunggah
                </span>
              </div>
              <p className="text-[11px] text-[#7a8899]">
                Minimal satu harus dipenuhi dibawah ini.
              </p>
              <div className="space-y-3 rounded-sm border border-[#e2e8f2] bg-[#f7f8fa] p-3">
                {SURAT_TAGIHAN_ITEMS.map((item) => (
                  <EditFileSlot
                    key={item.key as string}
                    label={item.label}
                    existingFile={
                      record[item.key] as unknown as UploadedFileRef | null
                    }
                    newFile={
                      (fileBaru[item.key as string] as File | null) ?? null
                    }
                    dihapus={Boolean(fileDihapus[item.key as string])}
                    onChangeFile={(f) => setFile(item.key as string, f)}
                    onHapus={() => hapusFile(item.key as string)}
                    onBatalkanHapus={() =>
                      batalkanHapusFile(item.key as string)
                    }
                    required={false}
                    catatanList={
                      catatanPerDokumenMap.get(item.key as string) ?? []
                    }
                  />
                ))}
              </div>
            </div>

            {renderSlot(
              "buktiUpayaOptimal",
              "7. Telah dilakukan upaya optimal sesuai ketentuan",
              false,
              "Opsional",
            )}
            {renderSlot(
              "buktiKerjaSamaPihakKetiga",
              "8. Telah dilakukan kerja sama penagihan dengan melibatkan pihak ketiga",
              false,
              "Khusus untuk nominal di atas Rp 1 Milyar",
            )}
          </EditSection>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#e2e8f2] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {saveError && (
            <p className="w-full text-left text-[12px] font-medium text-[#c0392b] sm:mr-auto sm:w-auto">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-full rounded-sm border border-[#e2e8f2] bg-white px-4 py-2.5 text-sm font-medium text-[#5a6474] transition hover:bg-[#f7f8fa] disabled:opacity-50 sm:w-auto"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSimpan}
            disabled={isSaving}
            className="w-full rounded-sm bg-[#ea580c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#c2410c] disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Menyimpan…" : "Simpan Perbaikan"}
          </button>
        </div>
      </div>
    </div>
  );
}
