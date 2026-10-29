"use client";

import React, { useCallback, useState } from "react";
import type { BeritaAcaraData, AspekPenelaahan, HasilAspek } from "./types";
import { emptyBeritaAcaraData } from "./types";
import { buildDefaultAspek, rapikanAspek } from "./buildBeritaAcara";
import ScaledBeritaAcaraPreview from "./ScaledBeritaAcaraPreview";
import { SectionDataUmum, SectionPenelaah, SectionTabelC } from "./Sections";
import { downloadBeritaAcaraPdf } from "./generatePdf";
import { formatTanggalWaktu } from "../../telaah/TelaahDokumenShared";

interface PembuatanBeritaAcaraProps {
  initialData?: BeritaAcaraData | null;
  onBack: () => void;
  /**
   * Dipanggil saat admin klik "Simpan Berita Acara".
   * Parent yang menulis ke database (parent bisa melempar error);
   * kalau tidak diberikan, tombol Simpan tidak ditampilkan.
   */
  onSave?: (data: BeritaAcaraData) => Promise<void>;
}

type TabKey = "form" | "preview";

/**
 * Data awal form: gabungkan default + initialData.
 * Tidak lagi men-drop initialData saat aspekPenelaahan kosong —
 * aspek dirapikan supaya selalu 10 baris sesuai constants.
 */
function buildInitialData(initial?: BeritaAcaraData | null): BeritaAcaraData {
  if (!initial) {
    return {
      ...emptyBeritaAcaraData(),
      aspekPenelaahan: buildDefaultAspek(),
    };
  }
  return {
    ...emptyBeritaAcaraData(),
    ...initial,
    aspekPenelaahan: rapikanAspek(initial.aspekPenelaahan),
  };
}

export default function PembuatanBeritaAcara({
  initialData,
  onBack,
  onSave,
}: PembuatanBeritaAcaraProps) {
  const [data, setData] = useState<BeritaAcaraData>(() =>
    buildInitialData(initialData),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("form");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [infoSimpan, setInfoSimpan] = useState<string | null>(
    initialData?.diperbaruiPada
      ? `Terakhir disimpan ${formatTanggalWaktu(initialData.diperbaruiPada)}${
          initialData.dibuatOleh ? ` oleh ${initialData.dibuatOleh}` : ""
        }`
      : null,
  );

  const updateField = useCallback(
    (field: keyof BeritaAcaraData, value: string) => {
      setData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const updateAspek = useCallback(
    (nomor: number, field: keyof AspekPenelaahan, value: string) => {
      setData((prev) => ({
        ...prev,
        aspekPenelaahan: prev.aspekPenelaahan.map((a) =>
          a.nomor === nomor ? { ...a, [field]: value } : a,
        ),
      }));
      setErrors((prev) => {
        const key = `aspek_${nomor}_${field}`;
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const bulkUpdateAspek = useCallback((hasil: HasilAspek) => {
    setData((prev) => ({
      ...prev,
      aspekPenelaahan: prev.aspekPenelaahan.map((a) => ({
        ...a,
        hasil,
        keterangan: hasil === "Sesuai" ? "" : a.keterangan,
      })),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith("aspek_")) delete next[key];
      });
      return next;
    });
  }, []);

  const updatePenelaah = useCallback(
    (
      role: "kasubbid" | "kabid" | "sekban",
      field: "nama" | "nip",
      value: string,
    ) => {
      setData((prev) => ({
        ...prev,
        penelaah: {
          ...prev.penelaah,
          [role]: { ...prev.penelaah[role], [field]: value },
        },
      }));
      setErrors((prev) => {
        const key = `penelaah_${role}_${field}`;
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const handleReset = () => {
    if (
      !window.confirm(
        "Reset semua isian ke default? Data yang sudah Anda ketik akan hilang.",
      )
    ) {
      return;
    }
    setData(buildInitialData(initialData));
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Semua isian WAJIB terisi — spasi kosong dianggap belum diisi.
    // Kekecualian: Nomor BA dan Data Penelaah (boleh kosong, di dokumen
    // akan tampil sebagai titik-titik).
    if (!data.perangkatDaerah.trim()) errs.perangkatDaerah = "Wajib diisi";
    if (!data.nomorRegistrasi.trim()) errs.nomorRegistrasi = "Wajib diisi";
    if (!data.tanggalRegistrasi.trim())
      errs.tanggalRegistrasi = "Wajib diisi";
    if (!data.jenisPiutang.trim()) errs.jenisPiutang = "Wajib dipilih";
    if (!data.namaJumlahDebitur.trim()) errs.namaJumlahDebitur = "Wajib diisi";
    if (!data.nilaiPiutang.trim()) errs.nilaiPiutang = "Wajib diisi";
    if (!data.tahunPerolehan.trim() || data.tahunPerolehan.trim().length !== 4)
      errs.tahunPerolehan = "Wajib 4 digit tahun";
    if (!data.nilaiPiutangKesimpulan.trim())
      errs.nilaiPiutangKesimpulan = "Wajib diisi";
    if (!data.tanggalBA.trim()) errs.tanggalBA = "Wajib diisi";

    // Tabel Hasil Penelaahan: kesepuluh aspek wajib dipilih semua.
    data.aspekPenelaahan.forEach((a) => {
      if (!a.hasil) {
        errs[`aspek_${a.nomor}_hasil`] = "Wajib dipilih";
      } else if (a.hasil === "Tidak Sesuai" && a.keterangan.trim().length < 5) {
        errs[`aspek_${a.nomor}_keterangan`] =
          "Keterangan wajib (min. 5 karakter) untuk Tidak Sesuai";
      }
    });

    // Data Penelaah: boleh kosong semua (di dokumen tampil titik-titik).
    // Kalau diisi sebagian, pasangannya wajib dilengkapi.
    (["kasubbid", "kabid", "sekban"] as const).forEach((role) => {
      const info = data.penelaah[role];
      const adaNama = info.nama.trim().length > 0;
      const adaNip = info.nip.trim().length > 0;

      if (!adaNama && !adaNip) return;

      if (!adaNama) {
        errs[`penelaah_${role}_nama`] = "Isi nama atau kosongkan keduanya";
      } else if (!adaNip) {
        errs[`penelaah_${role}_nip`] = "Isi NIP atau kosongkan keduanya";
      } else if (info.nip.trim().length !== 18) {
        errs[`penelaah_${role}_nip`] = "NIP harus 18 digit";
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDownload = async () => {
    setDownloadError(null);
    if (!validate()) {
      setDownloadError(
        "Isian belum lengkap — periksa pesan merah pada formulir.",
      );
      setActiveTab("form");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsDownloading(true);
    try {
      // Di layar < lg, saat tab "Form" aktif area preview berstatus
      // `display:none` sehingga html2canvas tidak bisa menangkapnya.
      // Paksa tampilkan tab Preview dulu, tunggu 2 frame render.
      if (
        activeTab !== "preview" &&
        !window.matchMedia("(min-width: 1024px)").matches
      ) {
        setActiveTab("preview");
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });
      }

      const filename = `Berita-Acara-${data.nomorRegistrasi.replace(/\//g, "-") || "Draft"}`;
      await downloadBeritaAcaraPdf({
        elementId: "berita-acara-print-area",
        filename,
      });
    } catch (err) {
      console.error(err);
      setDownloadError(
        err instanceof Error ? err.message : "Gagal membuat PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!onSave || isSaving) return;
    setSaveError(null);
    if (!validate()) {
      setSaveError("Isian belum lengkap — periksa pesan merah pada formulir.");
      setActiveTab("form");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsSaving(true);
    try {
      await onSave(data);
      setInfoSimpan(
        `Tersimpan ${formatTanggalWaktu(new Date().toISOString())}`,
      );
    } catch (err) {
      console.error(err);
      setSaveError(
        err instanceof Error ? err.message : "Gagal menyimpan Berita Acara.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1800px] overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="group inline-flex cursor-pointer items-center gap-2 rounded-xs border border-[#e2e8f2] bg-white py-1.5 pr-3.5 pl-1.5 text-[12.5px] font-semibold text-[#5a6474] shadow-xs transition-all hover:-translate-x-0.5 hover:border-[#a0bdec] hover:bg-[#e8f0fb] hover:text-[#1a4e8f]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-[#f0f4fb] text-[#1a4e8f] transition-colors group-hover:bg-[#1a4e8f] group-hover:text-white">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M10 3L4 8l6 5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Kembali
        </button>

        <div className="text-right">
          <h1 className="text-[15px] font-bold text-[#1a1a2e]">
            Berita Acara Penelaahan Internal
          </h1>
          <p className="text-[11.5px] text-[#7a8899]">
            {data.nomorRegistrasi || "Nomor registrasi belum diisi"}
          </p>
        </div>
      </div>

      {/* Tab bar — mobile only */}
      <div className="mb-3 flex rounded-xs border border-[#e2e8f2] bg-[#f7f8fa] p-1 lg:hidden">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex-1 rounded-xs py-2 text-[12.5px] font-semibold transition ${
            activeTab === "form"
              ? "bg-white text-[#1a4e8f] shadow-sm"
              : "text-[#7a8899]"
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 rounded-xs py-2 text-[12.5px] font-semibold transition ${
            activeTab === "preview"
              ? "bg-white text-[#1a4e8f] shadow-sm"
              : "text-[#7a8899]"
          }`}
        >
          Preview
        </button>
      </div>

      {/* 
        Layout 2 kolom (flex): form punya lebar tetap yang lega supaya
        isian tidak berdesakan; pratinjau F4 mengambil sisa lebar dan
        menyesuaikan skala sendiri (auto-fit).
      */}
      <div className="flex flex-col items-start gap-5 lg:flex-row">
        {/* ─── KOLOM KIRI: Form ─── */}
        <div
          className={`w-full lg:w-[360px] lg:shrink-0 xl:w-[420px] 2xl:w-[460px] ${activeTab === "form" ? "block" : "hidden"} lg:block`}
        >
          <div className="space-y-7 rounded-xs border border-[#e2e8f2] bg-white p-4 shadow-sm lg:p-5">
            <SectionDataUmum
              data={data}
              onChange={updateField}
              errors={errors}
              readOnlyFields={[
                "nomorRegistrasi",
                "tanggalRegistrasi",
                "jenisPiutang",
                "namaJumlahDebitur",
                "nilaiPiutang",
              ]}
            />
            <SectionTabelC
              aspek={data.aspekPenelaahan}
              onChange={updateAspek}
              errors={errors}
              onBulkUpdate={bulkUpdateAspek}
            />
            <SectionPenelaah
              penelaah={data.penelaah}
              onChange={updatePenelaah}
              errors={errors}
            />
          </div>
        </div>

        {/* ─── KOLOM KANAN: Preview (sisa lebar) ─── */}
        <div
          className={`w-full min-w-0 lg:flex-1 ${activeTab === "preview" ? "block" : "hidden"} lg:block`}
        >
          <div className="lg:sticky lg:top-4">
            <div className="flex flex-col overflow-hidden rounded-xs border border-[#e2e8f2] bg-slate-100 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Pratinjau F4
                </span>
                <span className="text-[10px] text-slate-400">21.5 × 33 cm</span>
              </div>

              {/* 
                Wrapper auto-fit: skala mengikuti lebar kolom yang tersedia
                dan tinggi preview mengikuti tinggi dokumen sebenarnya —
                jadi dokumen yang lebih dari 1 halaman F4 TIDAK terpotong.
              */}
              <div className="p-4 sm:p-6">
                <ScaledBeritaAcaraPreview data={data} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        Footer: 
        Tidak ada sticky bottom. Menempel alami dengan mt-6.
      */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xs border border-[#e2e8f2] bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xs border border-[#e2e8f2] bg-white px-3 py-2 text-[12px] font-semibold text-[#5a6474] transition hover:bg-[#f7f8fa]"
        >
          Reset ke Default
        </button>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          {downloadError && (
            <p className="text-[11.5px] text-red-500">{downloadError}</p>
          )}
          {saveError && (
            <p className="text-[11.5px] text-red-500">{saveError}</p>
          )}
          {!saveError && infoSimpan && (
            <p className="text-[11.5px] font-medium text-[#0f9b6e]">
              ✓ {infoSimpan}
            </p>
          )}
          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xs bg-[#0f9b6e] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#0c855d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M3 2h8l2 2v10H3V2zM5 2v4h6V2M5 9h6v5H5V9z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Simpan Berita Acara
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xs bg-[#1a4e8f] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#2d63a8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Memproses…
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M8 2v9M8 11l-3-3M8 11l3-3M2 13h12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
