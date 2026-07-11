"use client";

import type { FormEvent } from "react";
import {
  ArrowRight,
  Phone,
  Menu,
  X,
  LogIn,
  Eye,
  EyeOff,
  MapPin,
  Mail,
  Clock,
  FileText,
  ExternalLink,
  Download,
  Smartphone,
  Link2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AjukanPermohonanWizard from "@/app/dashboard-v2/contents/opd/ajukan-permohonan/AjukanPermohonan";
import { MOCK_DATA } from "../dashboard-v2/contents/dummyData";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  StatusFormulir,
} from "@/types/types-v2";

// ─── Bunga Menu — Data & Types ────────────────────────────────────────────────

type KelopakId =
  | "sop&flowchart"
  | "upload-dokumen"
  | "pengajuan"
  | "lacak"
  | "informasi"
  | "daftar";

interface KelopakItem {
  id: KelopakId;
  label: string;
  icon: string;
  tooltip: string;
  modalTitle: string;
  modalContent: React.ReactNode;
}

const DASAR_HUKUM_BUNGA = [
  "Undang-Undang Nomor 17 Tahun 2003 tentang Keuangan Negara",
  "Peraturan Menteri Dalam Negeri Nomor 77 Tahun 2020 tentang Pedoman Teknis Pengelolaan Keuangan Daerah",
  "Undang-Undang Nomor 1 Tahun 2022 tentang Hubungan Keuangan antara Pemerintah Pusat dan Pemerintahan Daerah (HKPD)",
  "PMK Nomor 137/PMK.06/2022 tentang Penghapusan Piutang Daerah yang Tidak Dapat Diserahkan Pengurusannya kepada Panitia Urusan Piutang Negara",
  "Peraturan Pemerintah Nomor 14 Tahun 2005 tentang Tata Cara Penghapusan Piutang Negara/Daerah",
  "Peraturan Pemerintah Nomor 35 Tahun 2017 tentang Perubahan Kedua atas Peraturan Pemerintah Nomor 14 Tahun 2005 tentang Tata Cara Penghapusan Piutang Negara/Daerah",
  "Peraturan Bupati Kendal No. 49 Tahun 2025 tentang Perubahan Atas Peraturan Bupati Nomor 66 Tahun 2021 tentang Kebijakan Akuntansi Pemerintah Daerah Kabupaten Kendal",
];

const MAKNA_LOGO_BUNGA = [
  {
    judul: "Bunga (Puspita)",
    isi: "Melambangkan pelayanan yang bertumbuh, tertata, dan memberi manfaat.",
  },
  {
    judul: "5 Kelopak",
    isi: "Mewakili 5 fitur utama layanan: informasi, SOP & Flowchart, formulir pengajuan, unggah dokumen, dan tracking status usulan.",
  },
  {
    judul: "Dokumen di Tengah",
    isi: "Melambangkan inti pelayanan, yaitu pengajuan penghapusan piutang.",
  },
  {
    judul: "Lingkaran Penghubung",
    isi: "Melambangkan integrasi antar proses, informasi, layanan digital, dan dokumentasi.",
  },
  {
    judul: "Warna Oranye/Emas",
    isi: "Melambangkan nilai aset dan keuangan daerah.",
  },
];

const FORMULIR_LIST = [
  {
    id: "penetapan-mutlak",
    file: "penetapan_penghapusan_secara_mutlak_piutang_daerah_yang_tidak_dapat_diserahkan_pengurusannya_kepada_pupn.pdf",
    judul: "Penetapan Penghapusan Secara Mutlak",
    sub: "Piutang daerah yang tidak dapat diserahkan pengurusannya kepada PUPN",
  },
  {
    id: "penetapan-bersyarat",
    file: "penetapan_penghapusan_secara_bersyarat_piutang_daerah_yang_tidak_dapat_diserahkan_pengurusannya_kepada_pupn.pdf",
    judul: "Penetapan Penghapusan Secara Bersyarat",
    sub: "Piutang daerah yang tidak dapat diserahkan pengurusannya kepada PUPN",
  },
  {
    id: "daftar-nominatif",
    file: "daftar_nominatif_penanggung_utang.pdf",
    judul: "Daftar Nominatif Penanggung Utang",
    sub: "Rekapitulasi pihak yang memiliki kewajiban piutang",
  },
  {
    id: "surat-pernyataan-optimal",
    file: "surat_pernyataan_piutang_daerah_telah_optimal.pdf",
    judul: "Surat Pernyataan Piutang Telah Optimal",
    sub: "Pernyataan bahwa penagihan piutang telah dilakukan optimal",
  },
  {
    id: "daftar-usulan-pengurusan",
    file: "daftar_usulan_pengurusan_piutang_daerah_dalam_rangka_penghapusan_piutang.pdf",
    judul: "Daftar Usulan Pengurusan Piutang",
    sub: "Dalam rangka penghapusan piutang daerah",
  },
  {
    id: "permohonan-bersyarat",
    file: "surat_permohonan_usulan_penghapusan_bersyarat_piutang_daerah.pdf",
    judul: "Surat Permohonan Usulan Penghapusan Bersyarat",
    sub: "Permohonan usulan penghapusan bersyarat piutang daerah",
  },
];

const SOP_STEPS_BUNGA = [
  {
    no: "01",
    judul: "Mengidentifikasi Piutang dan Menyiapkan Dokumen Usulan",
    pelaksana: "OPD",
    waktu: "5 hari",
    output: "Daftar piutang yang memenuhi kriteria",
    isi: "OPD mengidentifikasi piutang macet dan menyiapkan data piutang beserta dokumen pendukung.",
  },
  {
    no: "02",
    judul:
      "Menyusun dan Menyampaikan Usulan Penghapusan kepada PPKD melalui BPKAD",
    pelaksana: "OPD → Admin",
    waktu: "2 hari",
    output: "Usulan penghapusan diterima",
    isi: "Surat usulan beserta lampiran disampaikan OPD kepada PPKD melalui BPKAD.",
  },
  {
    no: "03",
    judul: "Meregister dan Memverifikasi Kelengkapan Usulan",
    pelaksana: "Admin → Kasubbid Aklap",
    waktu: "2 hari",
    output: "Usulan memenuhi persyaratan administrasi",
    isi: "Verifikasi administratif kelengkapan berkas usulan penghapusan piutang.",
  },
  {
    no: "04",
    judul: "Mereviu Kelayakan Penghapusan Piutang",
    pelaksana: "Inspektorat",
    waktu: "7 hari",
    output: "Laporan Hasil Reviu",
    isi: "Reviu substantif oleh Inspektorat sebagai mekanisme pengendalian intern sebelum penetapan PPDTO oleh PPKD.",
  },
  {
    no: "05",
    judul: "Menyusun, Menelaah, dan Menetapkan PPDTO",
    pelaksana: "Kasubbid Aklap → Kabid Perben & Akun → Sekban",
    waktu: "3 hari",
    output: "PPDTO",
    isi: "Penyusunan dan penetapan Pernyataan Piutang Daerah Tidak Optimal (PPDTO) berdasarkan laporan hasil reviu.",
  },
  {
    no: "06",
    judul:
      "Mengajukan Usulan Penghapusan kepada Bupati melalui Sekretaris Daerah",
    pelaksana: "Ka BPKAD/PPKD → Sekda",
    waktu: "2 hari",
    output: "Usulan penghapusan",
    isi: "PPDTO beserta dokumen usulan diajukan ke Bupati melalui Sekretaris Daerah.",
  },
  {
    no: "07",
    judul: "Mengkaji Usulan melalui TPUPPD dan Menyusun Rekomendasi",
    pelaksana: "TPUPPD",
    waktu: "5 hari",
    output: "BA Penelitian",
    isi: "TPUPPD mengkaji usulan penghapusan beserta PPDTO dan menyusun Berita Acara penelitian.",
  },
  {
    no: "08",
    judul: "Menyampaikan Hasil Rekomendasi TPUPPD kepada Bupati",
    pelaksana: "TPUPPD → Bupati",
    waktu: "2 hari",
    output: "Berita Acara/Rekomendasi TPUPPD",
    isi: "Hasil rekomendasi TPUPPD disampaikan kepada Bupati sebagai dasar penetapan keputusan.",
  },
  {
    no: "09",
    judul: "Menetapkan Keputusan Penghapusan Piutang",
    pelaksana: "Bupati",
    waktu: "5 hari",
    output: "Keputusan Bupati",
    isi: "Bupati menetapkan Keputusan Penghapusan Piutang berdasarkan usulan dan rekomendasi TPUPPD.",
  },
  {
    no: "10",
    judul: "Menatausahakan dan Membukukan Penghapusan Piutang",
    pelaksana: "OPD → Admin",
    waktu: "1 hari",
    output: "Penyesuaian administrasi dan akuntansi",
    isi: "Pencatatan dan pembukuan penghapusan piutang berdasarkan Keputusan Bupati.",
  },
  {
    no: "11",
    judul: "Mengarsipkan Dokumen Penghapusan Piutang",
    pelaksana: "Kasubbid Aklap",
    waktu: "1 hari",
    output: "Arsip lengkap",
    isi: "Seluruh dokumen usulan, hasil penelitian, PPDTO, Berita Acara TPUPPD, dan Keputusan Kepala Daerah diadministrasikan dan diarsipkan.",
  },
];

const SOP_DASAR_HUKUM_BUNGA = [
  "PP No. 35 Tahun 2017 tentang Perubahan Kedua atas PP No. 14 Tahun 2005 tentang Tata Cara Penghapusan Piutang Negara/Daerah",
  "Permendagri No. 52 Tahun 2011 tentang SOP di Lingkungan Pemerintah Kabupaten/Kota",
  "PP No. 12 Tahun 2019 tentang Pengelolaan Keuangan Daerah",
  "PermenPAN-RB No. 52 Tahun 2011 tentang Pedoman Penyusunan SOP Administrasi Pemerintah",
  "Permendagri No. 77 Tahun 2020 tentang Pedoman Teknis Pengelolaan Keuangan Daerah",
  "PMK No. 137/PMK.06/2022 tentang Penghapusan Piutang Daerah yang Tidak Dapat Diserahkan Pengurusannya kepada PUPN",
  "Perbup Kendal No. 49 Tahun 2025 tentang Perubahan atas Perbup No. 66 Tahun 2021 tentang Kebijakan Akuntansi Pemerintah Daerah Kabupaten Kendal",
];

// Aksen warna per tahap SOP, disesuaikan dengan pihak yang berwenang pada tahap tersebut
function getSopAccent(pelaksana: string) {
  if (pelaksana.includes("Inspektorat")) {
    return {
      badge: "bg-blue-500",
      card: "border-blue-100 bg-blue-50/50",
      pelaksanaChip: "border-blue-200 bg-blue-50 text-blue-700",
      line: "bg-blue-200",
    };
  }
  if (pelaksana.includes("TPUPPD")) {
    return {
      badge: "bg-purple-500",
      card: "border-purple-100 bg-purple-50/50",
      pelaksanaChip: "border-purple-200 bg-purple-50 text-purple-700",
      line: "bg-purple-200",
    };
  }
  if (pelaksana.includes("Bupati")) {
    return {
      badge: "bg-rose-500",
      card: "border-rose-100 bg-rose-50/50",
      pelaksanaChip: "border-rose-200 bg-rose-50 text-rose-700",
      line: "bg-rose-200",
    };
  }
  if (pelaksana.includes("Sekda")) {
    return {
      badge: "bg-slate-500",
      card: "border-slate-200 bg-slate-50/60",
      pelaksanaChip: "border-slate-200 bg-slate-100 text-slate-700",
      line: "bg-slate-200",
    };
  }
  return {
    badge: "bg-amber-500",
    card: "border-orange-100 bg-orange-50/60",
    pelaksanaChip: "border-orange-200 bg-orange-50 text-orange-700",
    line: "bg-orange-200",
  };
}

// Konfigurasi label & warna status — disamakan dengan STATUS_CONFIG pada
// LihatDaftarPengajuan.tsx / VerifikasiPengajuan.tsx supaya konsisten di
// seluruh aplikasi (landing page & dashboard).
const STATUS_CONFIG_LACAK: Record<
  StatusFormulir,
  { label: string; badgeClass: string; dotClass: string }
> = {
  diajukan: {
    label: "Diajukan",
    badgeClass: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    dotClass: "bg-[#3b82f6]",
  },
  revisi: {
    label: "Revisi",
    badgeClass: "bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]",
    dotClass: "bg-[#f97316]",
  },
  lolos_verifikasi: {
    label: "Lolos Verifikasi",
    badgeClass: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
    dotClass: "bg-[#10b981]",
  },
};

function formatRupiahLacak(angka: string): string {
  const num = parseInt(angka, 10);
  return isNaN(num) ? "Rp 0" : "Rp " + num.toLocaleString("id-ID");
}

function formatTanggalLacak(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "T00:00:00Z"));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const WARNA_KELOPAK = ["#e85d04", "#f97316", "#fbbf24", "#f59e0b", "#f97316"];
const SUDUT_KELOPAK = [0, 72, 144, 216, 288];

// ─── Bunga Modal — Content Components ────────────────────────────────────────

function SiPuspitaHeading({
  showSlogan = true,
  size = "lg",
  className = "mb-5",
}: {
  showSlogan?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const s = {
    xs: { h: "text-[17px] lg:text-[19px]", sl: "text-[11px] lg:text-[12px]" },
    sm: { h: "text-[32px] lg:text-[40px]", sl: "text-[18px] lg:text-[22px]" },
    md: { h: "text-[36px] lg:text-[46px]", sl: "text-[20px] lg:text-[24px]" },
    lg: {
      h: "text-[28px] sm:text-[36px] lg:text-[52px]",
      sl: "text-[14px] sm:text-[18px] lg:text-[26px]",
    },
    xl: { h: "text-[48px] lg:text-[60px]", sl: "text-[24px] lg:text-[30px]" },
  }[size];

  return (
    <h1
      className={`leading-[1.1] font-extrabold tracking-tight ${s.h} ${className}`}
    >
      <span className="text-orange-400">SI </span>
      <span className="text-purple-400">PUS</span>
      <span className="text-green-400">PI</span>
      <span className="text-orange-600">TA</span>

      {showSlogan && (
        <span className={`mt-1 block font-normal text-slate-500 ${s.sl}`}>
          <span className="text-orange-400">Si</span>stem Pengajuan Pengha
          <span className="text-purple-400">pus</span>an{" "}
          <span className="text-green-400">Pi</span>utang{" "}
          <span className="text-orange-600">T</span>erintegr
          <span className="text-orange-600">a</span>si
        </span>
      )}
    </h1>
  );
}

function ModalSOP() {
  const [showPdf, setShowPdf] = useState(false);

  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-gray-700">
        Standar Operasional Prosedur{" "}
        <span className="font-semibold text-gray-900">
          Penghapusan Piutang Daerah
        </span>{" "}
        yang Tidak Dapat Diserahkan Pengurusannya kepada Panitia Urusan Piutang
        Negara (PUPN), berdasarkan{" "}
        <span className="font-semibold text-amber-700">
          PMK No. 137/PMK.06/2022
        </span>
        .
      </p>

      {/* CTA — Toggle PDF SOP: beda struktur dari kartu langkah, tapi tenang secara warna */}
      <div>
        <p className="mb-2 text-[11.5px] font-bold tracking-widest text-gray-500 uppercase">
          Dokumen Resmi
        </p>
        <button
          type="button"
          onClick={() => setShowPdf((v) => !v)}
          className={`group flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors ${
            showPdf
              ? "border-gray-300 bg-gray-50"
              : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/40"
          }`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              showPdf ? "bg-gray-700 text-white" : "bg-amber-500 text-white"
            }`}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] font-bold text-gray-900">
              {showPdf ? "Sembunyikan Dokumen PDF" : "Buka Dokumen SOP Lengkap"}
            </p>
            <p className="text-[12.5px] text-gray-600">
              {showPdf
                ? "Klik untuk menutup pratinjau di bawah"
                : "PDF resmi · tampil langsung di halaman ini"}
            </p>
          </div>
          {showPdf ? (
            <X className="h-5 w-5 shrink-0 text-gray-600" />
          ) : (
            <ExternalLink className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </div>

      {/* Viewer PDF inline — tampil di dalam modal yang sama */}
      {showPdf && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-700">
              <FileText className="h-4 w-4" />
              SOP-Penghapusan-Piutang-Daerah.pdf
            </p>
            <div className="flex items-center gap-1.5">
              <a
                href="/dokumen/SOP-Penghapusan-Piutang-Daerah.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Buka Tab Baru
              </a>
              <button
                type="button"
                onClick={() => setShowPdf(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-200"
                aria-label="Tutup pratinjau PDF"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <iframe
            src="/dokumen/SOP-Penghapusan-Piutang-Daerah.pdf"
            title="SOP Penghapusan Piutang Daerah"
            className="h-[65vh] w-full"
          />
        </div>
      )}

      {/* Pemisah section — memisahkan dokumen dari daftar langkah */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-px flex-1 bg-gray-200" />
        <p className="shrink-0 text-[11.5px] font-bold tracking-widest text-gray-500 uppercase">
          Tahapan Proses
        </p>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Legenda pihak berwenang */}
      <div className="flex flex-wrap gap-3 text-[12px] font-medium">
        <span className="flex items-center gap-1.5 text-gray-700">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> OPD / BPKAD
        </span>
        <span className="flex items-center gap-1.5 text-gray-700">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Inspektorat
        </span>
        <span className="flex items-center gap-1.5 text-gray-700">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> TPUPPD
        </span>
        <span className="flex items-center gap-1.5 text-gray-700">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Sekda
        </span>
        <span className="flex items-center gap-1.5 text-gray-700">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Bupati
        </span>
      </div>

      <div className="relative">
        {SOP_STEPS_BUNGA.map((s, i) => {
          const accent = getSopAccent(s.pelaksana);
          return (
            <div key={s.no} className="relative">
              <div
                className={`flex gap-3.5 rounded-xl border p-4 ${accent.card}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold text-white shadow-sm ${accent.badge}`}
                >
                  {s.no}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug font-bold text-gray-900">
                    {s.judul}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-700">
                    {s.isi}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${accent.pelaksanaChip}`}
                    >
                      👤 {s.pelaksana}
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11.5px] font-semibold text-sky-700">
                      ⏱ {s.waktu}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700">
                      📄 {s.output}
                    </span>
                  </div>
                </div>
              </div>
              {i < SOP_STEPS_BUNGA.length - 1 && (
                <div className={`ml-7 h-2.5 w-0.5 ${accent.line}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4.5">
        <p className="mb-3 text-[13px] font-bold tracking-wide text-amber-700 uppercase">
          📌 Dasar Hukum
        </p>
        <div className="space-y-2.5">
          {SOP_DASAR_HUKUM_BUNGA.map((d, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10.5px] font-bold text-amber-700 ring-1 ring-amber-200">
                {i + 1}
              </span>
              <p className="text-[13px] leading-relaxed text-gray-700">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalUploadDokumen() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = FORMULIR_LIST.find((f) => f.id === activeId) ?? null;

  // ── Mode fokus: satu formulir sedang dipratinjau, ambil seluruh lebar modal
  if (active) {
    return (
      <div className="space-y-4">
        {/* Bar navigasi kembali */}
        <button
          type="button"
          onClick={() => setActiveId(null)}
          className="group flex items-center gap-2 text-[13px] font-semibold text-gray-600 transition-colors hover:text-amber-700"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-amber-100">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          </span>
          Kembali ke daftar formulir
        </button>

        {/* Header dokumen aktif */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] leading-snug font-bold text-gray-900">
                {active.judul}
              </p>
              <p className="text-[12.5px] leading-snug text-gray-600">
                {active.sub}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`/dokumen/formulir/${active.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              <ExternalLink className="h-4 w-4" />
              Tab Baru
            </a>
            <a
              href={`/dokumen/formulir/${active.file}`}
              download
              className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-amber-600"
            >
              <Download className="h-4 w-4" />
              Unduh
            </a>
          </div>
        </div>

        {/* Viewer PDF — full width, tinggi maksimal untuk keterbacaan */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner">
          <iframe
            src={`/dokumen/formulir/${active.file}`}
            title={active.judul}
            className="h-[62vh] w-full sm:h-[68vh]"
          />
        </div>
      </div>
    );
  }

  // ── Mode daftar: grid formulir, belum ada yang dipilih
  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-gray-700">
        Unduh atau lihat langsung{" "}
        <span className="font-semibold text-gray-900">
          template formulir resmi
        </span>{" "}
        yang dibutuhkan dalam proses pengajuan penghapusan piutang daerah.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {FORMULIR_LIST.map((f) => (
          <div
            key={f.id}
            className="flex items-start gap-3.5 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-amber-200 hover:bg-amber-50/40"
          >
            <button
              type="button"
              onClick={() => setActiveId(f.id)}
              className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] leading-snug font-bold text-gray-900">
                  {f.judul}
                </p>
                <p className="mt-1 text-[12.5px] leading-snug text-gray-600">
                  {f.sub}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-amber-700">
                  Lihat dokumen
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </button>
            <a
              href={`/dokumen/formulir/${f.file}`}
              download
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
              aria-label={`Unduh ${f.judul}`}
            >
              <Download className="h-4.5 w-4.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalPengajuan() {
  return <AjukanPermohonanWizard />;
}

// Badge status kecil untuk kartu hasil pencarian & daftar pengajuan terbaru.
function StatusBadgeLacak({ status }: { status: StatusFormulir }) {
  const cfg = STATUS_CONFIG_LACAK[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.25 rounded-full border px-2.25 py-0.75 text-[10.5px] font-semibold whitespace-nowrap ${cfg.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

// Kartu ringkas satu pengajuan pada daftar hasil pencarian.
function KartuPengajuanLacak({
  data,
  onClick,
}: {
  data: FormulirPenghapusanPiutangOPDRecord;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3.5 py-3 text-left transition hover:border-amber-200 hover:bg-amber-50/40"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-gray-800">
          {data.nomorSurat}
        </p>
        <p className="truncate text-xs text-gray-400">{data.namaOPD}</p>
      </div>
      <StatusBadgeLacak status={data.status} />
    </button>
  );
}

// Detail lengkap satu pengajuan, ditampilkan setelah kartu di klik / hasil
// pencarian persis 1 nomor surat.
function DetailPengajuanLacak({
  data,
  onKembali,
}: {
  data: FormulirPenghapusanPiutangOPDRecord;
  onKembali: () => void;
}) {
  return (
    <div className="space-y-3.5 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">
            {data.nomorSurat}
          </p>
          <p className="truncate text-xs text-gray-400">{data.namaOPD}</p>
        </div>
        <StatusBadgeLacak status={data.status} />
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-3">
        {[
          ["Jenis Piutang", data.jenisPiutang],
          ["Jenis Penghapusan", data.jenisPenghapusan],
          ["Jumlah Debitur", `${data.jumlahDebitur} orang`],
          ["Total Nilai Piutang", formatRupiahLacak(data.totalNilaiPiutang)],
          ["Tanggal Surat", formatTanggalLacak(data.tanggalSurat)],
          ["Penanggung Jawab", `${data.namaPenanggungJawab} (${data.jabatan})`],
        ].map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <span className="shrink-0 text-xs text-gray-400">{k}</span>
            <span className="text-right text-[13px] text-gray-700">{v}</span>
          </div>
        ))}
      </div>

      {/* Catatan verifikasi BPKAD — tampil beda untuk revisi vs lolos */}
      {data.status === "revisi" && data.catatanVerifikasi && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs leading-relaxed text-orange-700">
          <p className="mb-1 font-semibold">Perlu Revisi</p>
          {data.catatanVerifikasi}
        </div>
      )}
      {data.status === "lolos_verifikasi" && data.catatanVerifikasi && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700">
          <p className="mb-1 font-semibold">Lolos Verifikasi BPKAD</p>
          {data.catatanVerifikasi}
        </div>
      )}
      {data.status === "diajukan" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-700">
          Berkas sedang menunggu proses verifikasi administratif oleh BPKAD.
        </div>
      )}

      <button
        onClick={onKembali}
        className="text-xs font-semibold text-amber-600 hover:text-amber-700"
      >
        ← Kembali ke daftar pencarian
      </button>
    </div>
  );
}

function ModalLacak() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFormulir | "SEMUA">(
    "SEMUA",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filtering: cocok berdasarkan No. Surat, nama OPD, atau ID pengajuan —
  // sekaligus disaring per status jika chip status dipilih.
  const hasilFilter = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_DATA.filter((d) => {
      const cocokQuery =
        q === "" ||
        d.nomorSurat.toLowerCase().includes(q) ||
        d.namaOPD.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q);
      const cocokStatus = statusFilter === "SEMUA" || d.status === statusFilter;
      return cocokQuery && cocokStatus;
    }).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [query, statusFilter]);

  const selected = selectedId
    ? (MOCK_DATA.find((d) => d.id === selectedId) ?? null)
    : null;

  const jumlahPerStatus = useMemo(
    () => ({
      SEMUA: MOCK_DATA.length,
      diajukan: MOCK_DATA.filter((d) => d.status === "diajukan").length,
      revisi: MOCK_DATA.filter((d) => d.status === "revisi").length,
      lolos_verifikasi: MOCK_DATA.filter((d) => d.status === "lolos_verifikasi")
        .length,
    }),
    [],
  );

  const CHIP_STATUS: { key: StatusFormulir | "SEMUA"; label: string }[] = [
    { key: "SEMUA", label: "Semua" },
    { key: "diajukan", label: "Diajukan" },
    { key: "revisi", label: "Revisi" },
    { key: "lolos_verifikasi", label: "Lolos Verifikasi" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-500">
        Masukkan nomor surat atau nama OPD untuk memantau status berkas
        pengajuan penghapusan piutang.
      </p>

      {/* Input pencarian */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Contoh: 001/RSUD/I/2025 atau nama OPD"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId(null);
          }}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
        />
      </div>

      {/* Filter status */}
      <div className="flex flex-wrap gap-1.5">
        {CHIP_STATUS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setStatusFilter(c.key);
              setSelectedId(null);
            }}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
              statusFilter === c.key
                ? "border-amber-400 bg-amber-500 text-[#0b1f3a]"
                : "border-gray-200 bg-white text-gray-500 hover:border-amber-200 hover:text-amber-600"
            }`}
          >
            {c.label}{" "}
            <span
              className={
                statusFilter === c.key ? "text-[#0b1f3a]/70" : "text-gray-300"
              }
            >
              ({jumlahPerStatus[c.key]})
            </span>
          </button>
        ))}
      </div>

      {/* Hasil: detail (jika sudah pilih satu) atau daftar kartu */}
      {selected ? (
        <DetailPengajuanLacak
          data={selected}
          onKembali={() => setSelectedId(null)}
        />
      ) : (
        <div className="space-y-2">
          {hasilFilter.length === 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              ❌ Tidak ada pengajuan yang cocok. Periksa kembali nomor surat
              atau nama OPD yang Anda masukkan.
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-400">
                {hasilFilter.length} pengajuan ditemukan
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
                {hasilFilter.map((d) => (
                  <KartuPengajuanLacak
                    key={d.id}
                    data={d}
                    onClick={() => setSelectedId(d.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ModalInformasiUmum() {
  return (
    <div className="space-y-5">
      {/* Deskripsi umum */}
      <div className="rounded-xl border border-gray-100 bg-orange-50/60 p-4.5">
        <p className="mb-1.5 text-[12.5px] font-bold tracking-widest text-amber-700 uppercase">
          Apa itu SI PUSPITA?
        </p>
        <p className="text-[15.5px] leading-relaxed text-gray-700">
          <span className="font-semibold text-gray-900">
            SI PUSPITA (Sistem Pengajuan Penghapusan Piutang Terintegrasi)
          </span>{" "}
          adalah sebuah sistem layanan digital sederhana yang dirancang untuk:
        </p>
        <div className="mt-3.5 space-y-2.5">
          {[
            <>
              Memfasilitasi pengajuan penghapusan piutang oleh OPD secara{" "}
              <em>online</em>
            </>,
            <>
              Mengintegrasikan SOP, <em>flowchart</em>, dan alur persetujuan
              antar-stakeholder terkait
            </>,
            <>
              Menyediakan akses pelacakan status pengajuan secara{" "}
              <em>real-time</em>
            </>,
            <>
              Menyederhanakan dokumentasi dan validasi pada proses penghapusan
              piutang daerah
            </>,
          ].map((t, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[12.5px] font-bold text-white">
                {i + 1}
              </span>
              <p className="text-[14.5px] leading-relaxed text-gray-700">{t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Latar belakang singkat */}
      <div>
        <p className="mb-2.5 text-[17px] font-bold text-gray-900">
          Latar Belakang
        </p>
        <div className="space-y-3">
          <p className="text-[14.5px] leading-relaxed text-gray-700">
            Pengelolaan keuangan daerah merupakan salah satu aspek krusial dalam
            mewujudkan tata kelola pemerintah yang baik (
            <em>good governance</em>). Salah satu komponen penting dalam
            pengelolaan keuangan daerah adalah pengelolaan piutang daerah.
            Permasalahan utama dalam pengelolaan piutang daerah di Kabupaten
            Kendal adalah tingginya jumlah piutang yang tidak tertagih atau
            macet. Pengelolaan piutang yang tidak optimal berpotensi menimbulkan
            ketidakwajaran penyajian nilai piutang dalam neraca pemerintah
            daerah. Oleh karena itu, diperlukan upaya pengelolaan piutang yang
            tidak hanya berorientasi pada peningkatan penagihan, tetapi juga
            mencakup penatausahaan, evaluasi, dan penyelesaian terhadap piutang
            yang telah memenuhi kriteria untuk dilakukan penghapusan sesuai
            ketentuan peraturan perundang-undangan.
          </p>
          <p className="text-[14.5px] leading-relaxed text-gray-700">
            Hal tersebut selaras dengan Asta Cita ke 7 (tujuh) Presiden yakni
            penguatan reformasi birokrasi dan transformasi digital pemerintahan
            melalui inovasi tata kelola keuangan dan digitalisasi pengelolaan
            piutang macet.
          </p>
        </div>
      </div>

      {/* Tujuan */}
      <div>
        <p className="mb-2.5 text-[17px] font-bold text-gray-900">
          Tujuan Utama
        </p>
        <p className="text-[14.5px] leading-relaxed text-gray-700">
          Mewujudkan tata kelola pengajuan penghapusan piutang daerah yang{" "}
          <span className="font-semibold text-gray-900">
            efektif, terstandar, transparan, dan akuntabel
          </span>
          , guna mendukung optimalisasi pengelolaan piutang serta kualitas
          laporan keuangan Pemerintah Kabupaten Kendal.
        </p>
      </div>

      {/* Dasar hukum */}
      <div>
        <p className="mb-2.5 text-[17px] font-bold text-gray-900">
          Dasar Hukum
        </p>
        <div className="space-y-2.5">
          {DASAR_HUKUM_BUNGA.map((item, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3.5"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[12.5px] font-bold text-amber-700">
                {i + 1}
              </div>
              <p className="text-[14px] leading-relaxed text-gray-700">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Makna logo */}
      <div>
        <p className="mb-2.5 text-[17px] font-bold text-gray-900">
          Makna Logo SI PUSPITA
        </p>
        <div className="space-y-2.5">
          {MAKNA_LOGO_BUNGA.map((m) => (
            <div
              key={m.judul}
              className="rounded-xl border border-gray-100 bg-orange-50/60 p-3.5"
            >
              <p className="text-[14.5px] font-bold text-gray-900">{m.judul}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-gray-700">
                {m.isi}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bunga Menu — Kelopak Config ──────────────────────────────────────────────

const KELOPAK_LIST: KelopakItem[] = [
  {
    id: "sop&flowchart",
    label: "SOP & Flowchart",
    icon: "📄",
    tooltip: "Standar Operasional Prosedur & Flowchart",
    modalTitle: "Standar Operasional Prosedur & Flowchart",
    modalContent: <ModalSOP />,
  },
  {
    id: "upload-dokumen",
    label: "Upload Dokumen",
    icon: "🗂️",
    tooltip: "Upload Dokumen",
    modalTitle: "Upload Dokumen",
    modalContent: <ModalUploadDokumen />,
  },
  {
    id: "pengajuan",
    label: "Pengajuan",
    icon: "📝",
    tooltip: "Formulir Pengajuan Online",
    modalTitle: "Formulir Pengajuan Baru",
    modalContent: <ModalPengajuan />,
  },
  {
    id: "lacak",
    label: "Lacak",
    icon: "🔍",
    tooltip: "Lacak Status Berkas",
    modalTitle: "Lacak Status Berkas",
    modalContent: <ModalLacak />,
  },
  {
    id: "informasi",
    label: "Informasi",
    icon: "❓",
    tooltip: "Informasi Umum SI PUSPITA",
    modalTitle: "Informasi Umum SI PUSPITA",
    modalContent: <ModalInformasiUmum />,
  },
];

// ─── Bunga Modal ──────────────────────────────────────────────────────────────
function ModalBunga({
  item,
  onClose,
  isClosing,
}: {
  item: KelopakItem;
  onClose: () => void;
  isClosing: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [displayedItem, setDisplayedItem] = useState(item);
  const [contentVisible, setContentVisible] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    // Kunci scroll halaman di belakang modal selama modal terbuka
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (isClosing) {
      const t = setTimeout(() => setVisible(false), 10);
      return () => clearTimeout(t);
    }
  }, [isClosing]);

  // Animasi ganti konten saat item berubah
  useEffect(() => {
    if (item.id === displayedItem.id) return;
    const t1 = setTimeout(() => setContentVisible(false), 0);
    const t2 = setTimeout(() => {
      setDisplayedItem(item);
      setContentVisible(true);
      bodyRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }, 180); // turunkan dari 200 → 180
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [item, displayedItem.id]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center p-3 sm:items-center sm:p-8"
      style={{
        backgroundColor: visible ? "rgba(8,20,50,0.82)" : "rgba(8,20,50,0)",
        backdropFilter: visible ? "blur(3px)" : "blur(0px)",
        transition: "background-color 0.5s ease, backdrop-filter 0.5s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className={`flex w-full overflow-hidden rounded-sm border border-white/10 bg-white shadow-2xl lg:mr-95 ${
          displayedItem.id === "informasi" ||
          displayedItem.id === "sop&flowchart" ||
          displayedItem.id === "upload-dokumen" ||
          displayedItem.id === "pengajuan"
            ? "max-w-260"
            : "max-w-160"
        }`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.96)",
          transition:
            "opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Sidebar aksen warna kiri */}
        <div className="w-1 shrink-0 bg-linear-to-b from-orange-400 via-amber-400 to-yellow-400" />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <div className="relative flex items-center justify-between gap-3 overflow-hidden border-b border-gray-100 bg-white px-4 py-3.5 sm:px-6 sm:py-4">
            {/* Aksen garis emas bawah */}
            <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-linear-to-r from-transparent via-[#e8c84a] to-transparent" />

            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-lg sm:h-10 sm:w-10 sm:text-xl">
                {displayedItem.icon}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[13.5px] font-semibold text-gray-900 sm:text-[15px]">
                  {displayedItem.modalTitle}
                </h2>
                <p className="hidden text-[11px] text-gray-400 sm:block">
                  SI PUSPITA · BPKAD Kab. Kendal
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 sm:h-8 sm:w-8"
              aria-label="Tutup"
            >
              <X className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Body — lebih tinggi, padding lebih lapang */}
          {/* Body */}
          <div
            ref={bodyRef}
            className="max-h-[75vh] overflow-y-auto px-4 py-4 sm:max-h-[72vh] sm:px-6 sm:py-5"
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? "translateY(0)" : "translateY(10px)",
              transition:
                "opacity 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {displayedItem.modalContent}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bunga SVG Component ──────────────────────────────────────────────────────

function BungaSVG({
  activeId,
  centerActive,
  onKelopakClick,
  onCenterClick,
}: {
  activeId: KelopakId | null;
  centerActive: boolean;
  onKelopakClick: (id: KelopakId) => void;
  onCenterClick: () => void;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-145 -145 290 290"
      className="h-full w-full"
    >
      <defs>
        {/* Glow effect untuk kelopak aktif */}
        <filter id="glowActive" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Shadow halus untuk semua kelopak */}
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1.5"
            floodColor="#000"
            floodOpacity="0.3"
          />
        </filter>

        {/* Shadow lebih kuat untuk kelopak aktif (efek terangkat) */}
        <filter id="liftedShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="5"
            floodColor="#000"
            floodOpacity="0.5"
          />
        </filter>

        <linearGradient id="textGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>

        {/* Gradient khusus label aktif — lebih terang/mencolok */}
        <linearGradient id="textGradientActive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>

      <g>
        {KELOPAK_LIST.map((item, index) => {
          const isActive = activeId === item.id;
          const angle = SUDUT_KELOPAK[index];
          const flip = angle >= 90 && angle <= 270 ? 180 : 0;

          // Kelopak aktif didorong lebih jauh dari pusat
          const translateOffset = isActive ? 80 : 52;
          // Label ikut geser supaya tidak menabrak kelopak
          // (ujung kelopak aktif = translateOffset + ry = 80 + 44 = 124, beri jarak aman)
          const labelY = isActive ? -136 : -108;

          return (
            <g key={item.id}>
              {/* Layer glow — hanya tampil saat aktif, di belakang kelopak */}
              {isActive && (
                <ellipse
                  rx="22"
                  ry="46"
                  fill={WARNA_KELOPAK[index]}
                  opacity="0.55"
                  filter="url(#glowActive)"
                  transform={`rotate(${angle}) translate(0,-${translateOffset})`}
                  style={{ pointerEvents: "none" }}
                />
              )}

              {/* Kelopak utama */}
              <ellipse
                rx="20"
                ry="44"
                fill={WARNA_KELOPAK[index]}
                stroke={isActive ? "#ffffff" : "rgba(255,255,255,0.3)"}
                strokeWidth={isActive ? 2.5 : 1.5}
                opacity={isActive ? 1 : 0.8}
                filter="url(#softShadow)"
                transform={`rotate(${angle}) translate(0,-${translateOffset})`}
                style={{
                  cursor: "pointer",
                  transition:
                    "opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onClick={() => onKelopakClick(item.id)}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.opacity = isActive ? "1" : "0.8")
                }
              >
                <title>{item.tooltip}</title>
              </ellipse>

              {/* Garis putih kecil di ujung kelopak aktif sebagai aksen */}
              {isActive && (
                <ellipse
                  rx="8"
                  ry="3"
                  fill="rgba(255,255,255,0.35)"
                  transform={`rotate(${angle}) translate(0,-${translateOffset + 36})`}
                  style={{ pointerEvents: "none" }}
                />
              )}

              {/* Label teks */}
              <text
                x="0"
                y={labelY}
                transform={`rotate(${angle}) rotate(${flip}, 0, ${labelY})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Segoe UI, system-ui, sans-serif"
                fontSize={isActive ? "13.5" : "13"}
                fontWeight={isActive ? "600" : "500"}
                letterSpacing="0.5"
                fill={
                  isActive ? "url(#textGradientActive)" : "url(#textGradient)"
                }
                filter="url(#softShadow)"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={isActive ? "0.8" : "0.6"}
                paintOrder="stroke fill"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Pusat bunga */}
        <circle
          r="20"
          fill="#1f2937"
          stroke={centerActive ? "#f59e0b" : "rgba(255,255,255,0.25)"}
          strokeWidth={centerActive ? 2.5 : 2}
          filter={centerActive ? "url(#glowActive)" : undefined}
          style={{ cursor: "pointer", transition: "stroke 0.2s, filter 0.2s" }}
          onClick={onCenterClick}
        >
          <title>Daftar Pengajuan</title>
        </circle>
        <g
          style={{ cursor: "pointer", pointerEvents: "none" }}
          fill="none"
          stroke={centerActive ? "#f59e0b" : "#d1d5db"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Body dokumen */}
          <rect x="-7" y="-10" width="14" height="17" rx="2" />
          {/* Pojok lipatan */}
          <polyline points="-7,-5 -3,-5 -3,-10" />
          {/* Garis teks */}
          <line x1="-4" y1="0" x2="4" y2="0" />
          <line x1="-4" y1="3.5" x2="4" y2="3.5" />
          <line x1="-4" y1="7" x2="1" y2="7" />
        </g>
        {/* Invisible click target */}
        <circle
          r="20"
          fill="transparent"
          style={{ cursor: "pointer" }}
          onClick={onCenterClick}
        />
      </g>
    </svg>
  );
}

export default function SiPuspitaLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [lastModalItem, setLastModalItem] = useState<KelopakItem | null>(null);

  // Bunga menu state
  const [bungaActiveId, setBungaActiveId] = useState<KelopakId | null>(null);
  const [bungaCenterActive, setBungaCenterActive] = useState(false);
  const [modalItem, setModalItem] = useState<KelopakItem | null>(null);
  const isModalOpen = modalItem !== null;

  // Backsound klik kelopak — soft pop + sentuhan chime tipis, di-generate
  // langsung via Web Audio API (tidak perlu file audio eksternal)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playKelopakSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;

      // Nada utama — soft pop, sedikit naik nadanya (± 100ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);

      // Lapisan oktaf tipis di atas untuk sentuhan chime halus
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1240, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.09);
      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.exponentialRampToValueAtTime(0.05, now + 0.012);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.16);
    } catch {
      // Abaikan bila Web Audio API tidak tersedia di browser
    }
  };

  const handleKelopakClick = (id: KelopakId) => {
    playKelopakSound();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setBungaCenterActive(false);
    setBungaActiveId(id);
    const found = KELOPAK_LIST.find((k) => k.id === id) ?? null;
    setModalItem(found);
    setLastModalItem(found); // ← ganti dari ref
  };

  const handleCenterClick = () => {
    playKelopakSound();
    setBungaActiveId(null);
    setBungaCenterActive(true);
  };

  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setModalItem(null);
      setBungaActiveId(null);
      setBungaCenterActive(false);
      setIsModalClosing(false);
    }, 600); // perpanjang agar animasi selesai dulu
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    if (!loginForm.username || !loginForm.password) {
      setLoginError("Username dan password wajib diisi.");
      return;
    }
    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      setLoginError("Username atau password salah. Silakan coba lagi.");
    }, 1200);
  };
  useEffect(() => {
    if (isModalOpen || isModalClosing) {
      document.body.style.overflow = "hidden";
    } else {
      setTimeout(() => {
        document.body.style.overflow = "";
      }, 600);
    }
  }, [isModalOpen, isModalClosing]);

  return (
    <div className="overflow-x-hidden bg-white font-sans text-gray-900">
      {/* ══════════════════ NAVBAR ══════════════════ */}
      <header className="sticky top-0 z-50">
        <nav className="border-b border-white/20 bg-white/80 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
            {/* Logo — ikon bunga + tulisan SI PUSPITA */}
            <div className="flex shrink-0 items-center gap-2.5">
              <Image
                src="/Logo_Si-Puspita_icon.png"
                alt="Logo SI PUSPITA"
                width={824}
                height={824}
                quality={100}
                priority
                className="h-11 w-11 shrink-0 rounded-full bg-white object-contain"
              />
              <SiPuspitaHeading showSlogan={false} size="xs" className="" />
            </div>

            {/* Desktop links */}
            <div className="hidden items-center gap-1 lg:flex"></div>

            {/* CTA */}
            <div className="hidden items-center gap-3 lg:flex">
              <button
                onClick={() => setLoginOpen(true)}
                className="group relative flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-200 hover:cursor-pointer hover:text-slate-700"
              >
                <LogIn className="h-3.5 w-3.5" /> Login
                <span className="absolute inset-x-4 bottom-1.5 h-[1.5px] origin-left scale-x-0 rounded-full bg-[#1a4e8f] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>
              <Link href={"/dashboard-v2"}>
                <button className="rounded-lg bg-yellow-400 px-5 py-2 text-[13px] font-semibold text-[#0f2d5e] shadow-sm transition-all duration-200 hover:cursor-pointer hover:bg-yellow-300 hover:text-[#0a2342] hover:shadow-md">
                  Ajukan Sekarang
                </button>
              </Link>
            </div>

            {/* Mobile toggler */}
            <button
              className="rounded-lg p-2 text-gray-600 transition-colors hover:text-[#1a4e8f] lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile menu */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
              mobileOpen ? "max-h-125 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-white/90 px-6 py-5 backdrop-blur-md">
              <hr className="my-1 border-gray-200" />
              <Link href={"/dashboard-v2"} onClick={() => setMobileOpen(false)}>
                <button className="w-fit rounded-lg bg-yellow-400 px-6 py-2.5 text-[14px] font-semibold text-[#0f2d5e] shadow-sm transition-all hover:cursor-pointer hover:bg-yellow-300 hover:text-[#0a2342]">
                  Ajukan Sekarang
                </button>
              </Link>
              <button
                onClick={() => {
                  setLoginOpen(true);
                  setMobileOpen(false);
                }}
                className="group relative w-fit rounded-lg px-4 py-2 text-[14px] font-medium text-gray-600 transition-colors hover:text-[#1a4e8f]"
              >
                Masuk
                <span className="absolute inset-x-4 bottom-1.5 h-[1.5px] origin-left scale-x-0 rounded-full bg-[#1a4e8f] transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ══════════════════ HERO ══════════════════ */}
      <section
        id="beranda"
        className="relative flex flex-col justify-center overflow-hidden bg-white text-[#0f2d5e]"
      >
        {/* Background glows — versi lembut untuk latar putih */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-150 w-150 rounded-full bg-[#0f2d5e]/4.5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-100 w-100 rounded-full bg-[#e8c84a]/10 blur-3xl" />
        </div>

        {/* Left accent bar */}
        <div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-[#c8a020]/0 via-[#c8a020] to-[#c8a020]/0" />

        {/* Content wrapper (no duplication) */}
        {/* ── Hero root ── */}
        <div className="relative overflow-hidden bg-white">
          {/* Garis emas atas — pembatas resmi */}
          <div className="h-1 w-full bg-linear-to-r from-transparent via-[#c8a020] to-transparent" />

          {/* Ornamen diagonal subtle — motif garis halus ala kertas berharga/dokumen resmi */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(15,45,94,0.03) 40px, rgba(15,45,94,0.03) 41px)",
            }}
          />

          {/* Sorot cahaya kanan */}
          <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-[radial-gradient(ellipse_600px_300px_at_80%_50%,rgba(200,160,60,0.09),transparent)]" />

          {/* ── Content wrapper ── */}
          <div className="relative mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-18 lg:px-10 lg:py-24">
            <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-12">
              {/* ── Kiri: teks utama ── */}
              <div className="min-w-0 flex-1">
                {/* Heading — warna SiPuspita TIDAK diubah */}
                <div className="mb-7">
                  <SiPuspitaHeading showSlogan={true} />
                </div>

                <div>
                  <p className="max-w-2xl text-[14px] leading-relaxed text-slate-600 sm:text-[15px] lg:text-[16px]">
                    <span className="font-semibold text-[#0f2d5e]">
                      SI PUSPITA (Sistem Pengajuan Penghapusan Piutang
                      Terintegrasi)
                    </span>{" "}
                    adalah sebuah sistem layanan digital sederhana yang
                    dirancang untuk:
                  </p>
                  <div className="mt-4 grid max-w-2xl grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 sm:gap-y-3.5">
                    {[
                      <>
                        Memfasilitasi pengajuan penghapusan piutang oleh OPD
                        secara <em>online</em>
                      </>,
                      <>
                        Mengintegrasikan SOP, <em>flowchart</em>, dan alur
                        persetujuan antar-stakeholder
                      </>,
                      <>
                        Menyediakan akses pelacakan status pengajuan secara{" "}
                        <em>real-time</em>
                      </>,
                      <>
                        Menyederhanakan dokumentasi dan validasi proses
                        penghapusan piutang
                      </>,
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0f2d5e] text-[11px] font-bold text-white sm:h-6 sm:w-6 sm:text-[12.5px]">
                          {i + 1}
                        </span>
                        <p className="text-[13.5px] leading-snug text-slate-600 sm:text-[15px]">
                          {t}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA utama */}
                <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href="/dashboard-v2"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#0f2d5e] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-lg shadow-[#0f2d5e]/20 transition-all hover:bg-[#153a75] active:scale-[0.98] sm:px-6 sm:py-3 sm:text-[14px]"
                  >
                    Ajukan Permohonan
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/dashboard-v2?user-role=bpkad"
                    className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#0f2d5e]/15 bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[#0f2d5e] transition-all hover:border-[#0f2d5e]/30 hover:bg-[#0f2d5e]/3 sm:px-6 sm:py-3 sm:text-[14px]"
                  >
                    Verifikasi oleh PPKD
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>

                {/* Tagline chip */}
                <div className="mt-8 flex flex-wrap items-center gap-2.5 border-t border-[#0f2d5e]/10 pt-6 sm:gap-3">
                  {[
                    {
                      label: "Digital",
                      icon: Smartphone,
                      border: "border-blue-200",
                      iconBg: "from-blue-500 to-blue-700",
                      text: "text-blue-700",
                    },
                    {
                      label: "Terintegrasi",
                      icon: Link2,
                      border: "border-amber-200",
                      iconBg: "from-amber-500 to-amber-600",
                      text: "text-amber-700",
                    },
                    {
                      label: "Real Time",
                      icon: Zap,
                      border: "border-emerald-200",
                      iconBg: "from-emerald-500 to-emerald-600",
                      text: "text-emerald-700",
                    },
                  ].map(({ label, icon: Icon, border, iconBg, text }) => (
                    <div
                      key={label}
                      className={`group flex items-center gap-1.5 rounded-full border bg-white py-1 pr-3.5 pl-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:gap-2 sm:py-1.5 sm:pr-4 sm:pl-1.5 ${border}`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-white shadow-sm transition-transform duration-200 group-hover:scale-105 sm:h-7 sm:w-7 ${iconBg}`}
                      >
                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </span>
                      <span
                        className={`text-[12.5px] font-semibold sm:text-[13.5px] ${text}`}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Kanan: bunga interaktif ── */}
              {/* Spacer placeholder — menjaga ukuran layout saat bunga jadi fixed */}
              <div
                className="flex shrink-0 flex-col items-center"
                style={{
                  opacity: isModalOpen && !isModalClosing ? 0 : 1,
                  transform:
                    isModalOpen && !isModalClosing ? "scale(0.9)" : "scale(1)",
                  pointerEvents: isModalOpen ? "none" : "auto",
                  transition: isModalClosing
                    ? "opacity 0.5s 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.5s 0.2s cubic-bezier(0.4,0,0.2,1)"
                    : "opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {/* Piringan navy — panggung untuk bunga interaktif di atas latar putih */}
                <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72 md:h-76 md:w-76 lg:h-80 lg:w-80">
                  <div className="absolute inset-0 rounded-full bg-[#0f2d5e] shadow-[0_25px_70px_-20px_rgba(15,45,94,0.5)]" />
                  <div className="pointer-events-none absolute inset-6 rounded-full border border-white/10 sm:inset-7.5" />
                  <span className="absolute top-0 left-0 h-4 w-4 border-t-[1.5px] border-l-[1.5px] border-[#e8c84a]/60 sm:h-5 sm:w-5" />
                  <span className="absolute top-0 right-0 h-4 w-4 border-t-[1.5px] border-r-[1.5px] border-[#e8c84a]/60 sm:h-5 sm:w-5" />
                  <span className="absolute bottom-0 left-0 h-4 w-4 border-b-[1.5px] border-l-[1.5px] border-[#e8c84a]/60 sm:h-5 sm:w-5" />
                  <span className="absolute right-0 bottom-0 h-4 w-4 border-r-[1.5px] border-b-[1.5px] border-[#e8c84a]/60 sm:h-5 sm:w-5" />
                  <div className="relative z-10 h-58 w-58 sm:h-65 sm:w-65 md:h-68 md:w-68 lg:h-72 lg:w-72">
                    {!isModalOpen && (
                      <BungaSVG
                        activeId={bungaActiveId}
                        centerActive={bungaCenterActive}
                        onKelopakClick={handleKelopakClick}
                        onCenterClick={handleCenterClick}
                      />
                    )}
                  </div>
                </div>
                <p className="mt-3 text-[9.5px] tracking-[0.12em] text-[#0f2d5e]/40 uppercase sm:mt-3.5 sm:text-[10.5px]">
                  Menu Layanan Interaktif
                </p>
              </div>
            </div>
          </div>

          {/* Garis bawah subtle */}
          <div className="absolute right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent via-[#c8a020]/40 to-transparent" />
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="relative overflow-hidden bg-[#0a1b38] text-slate-300">
        {/* Garis emas atas — konsisten dengan hero */}
        <div className="h-0.75 w-full bg-linear-to-r from-transparent via-[#e8c84a] to-transparent" />

        {/* Tekstur & glow latar */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.012) 40px, rgba(255,255,255,0.012) 41px)",
            }}
          />
          <div className="absolute -top-40 right-0 h-100 w-100 rounded-full bg-[#1a4e8f]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[#c8a020]/6 blur-3xl" />
        </div>

        {/* ── Konten utama — dipadatkan jadi satu grid, tanpa strip terpisah ── */}
        <div className="relative mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            {/* Brand + deskripsi singkat */}
            <div className="max-w-80 shrink-0">
              <Image
                src="/Logo_Si-Puspita_v2.png"
                alt="Logo SI PUSPITA"
                width={640}
                height={640}
                quality={100}
                priority
                className="mb-3.5 w-28 rounded-lg bg-white p-1.5"
              />
              <p className="text-[14px] leading-relaxed text-slate-400">
                Sistem Pengajuan Penghapusan Piutang Terintegrasi — layanan
                digital BPKAD Kabupaten Kendal.
              </p>
            </div>

            {/* Grid info: Kontak · Jam Layanan · Hubungi Kami */}
            <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3 lg:w-full lg:max-w-160">
              {/* Kontak */}
              <div>
                <h4 className="mb-3 text-[12px] font-bold tracking-[0.15em] text-[#e8c84a] uppercase">
                  Kontak
                </h4>
                <div className="flex flex-col gap-2.5 text-[14px] text-slate-400">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e8c84a]/70" />
                    <span className="leading-snug">
                      Jl. Notomudigdo, Karanggeneng, Pegulon, Kec. Kendal, Jawa
                      Tengah 51313
                    </span>
                  </div>
                  <a
                    href="tel:0294381301"
                    className="flex items-center gap-2.5 transition-colors hover:text-white"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#e8c84a]/70" />
                    (0294) 381301-381801
                  </a>
                  <a
                    href="mailto:bpkad.kendal@gmail.com"
                    className="flex items-center gap-2.5 transition-colors hover:text-white"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-[#e8c84a]/70" />
                    bpkad.kendal@gmail.com
                  </a>
                  <a
                    href="https://bpkad.kendalkab.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 transition-colors hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#e8c84a]/70" />
                    bpkad.kendalkab.go.id
                  </a>
                </div>
              </div>

              {/* Jam Layanan — ringkas tanpa card besar */}
              <div>
                <h4 className="mb-3 flex items-center gap-1.5 text-[12px] font-bold tracking-[0.15em] text-[#e8c84a] uppercase">
                  <Clock className="h-3.5 w-3.5" />
                  Jam Layanan
                  <span className="font-normal tracking-normal text-slate-500 normal-case">
                    (WIB)
                  </span>
                </h4>
                <div className="flex flex-col gap-2 text-[13.5px]">
                  {[
                    { hari: "Senin–Kamis", jam: "08.00–15.30" },
                    { hari: "Jumat", jam: "08.00–10.30" },
                    { hari: "Sabtu–Minggu", jam: "Tutup" },
                  ].map(({ hari, jam }) => (
                    <div
                      key={hari}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="shrink-0 whitespace-nowrap text-slate-400">
                        {hari}
                      </span>
                      <span
                        className={`shrink-0 font-semibold whitespace-nowrap ${jam === "Tutup" ? "text-red-400" : "text-white"}`}
                      >
                        {jam}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Hubungi Kami — padat, gabungan dari strip lama */}
              <div>
                <h4 className="mb-3 text-[12px] font-bold tracking-[0.15em] text-[#e8c84a] uppercase">
                  Butuh Bantuan?
                </h4>
                <p className="mb-3 text-[14px] leading-snug text-slate-400">
                  Tim BPKAD siap membantu OPD pada jam layanan.
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="tel:0294381301"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/5"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Telepon Kami
                  </a>
                  <a
                    href="mailto:bpkad.kendal@gmail.com"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e8c84a] px-4 py-2 text-[13.5px] font-semibold text-[#0a1b38] transition-colors hover:bg-[#f3d668]"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email Kami
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative border-t border-white/8 bg-[#071429]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row sm:px-8 lg:px-10">
            <p className="text-[13px] text-slate-500">
              © {new Date().getFullYear()} BPKAD Kabupaten Kendal. Hak cipta
              dilindungi.
            </p>
            <div className="flex items-center gap-2 text-[13px] text-slate-500">
              <span className="hidden sm:inline">Dikembangkan oleh</span>
              <span className="font-medium text-[#e8c84a]/90">
                Sub Bidang Akuntansi dan Pelaporan
              </span>
            </div>
          </div>
        </div>
      </footer>
      {/* ══════════════════ MODAL BUNGA ══════════════════ */}
      {(modalItem || isModalClosing) && (
        <>
          <ModalBunga
            item={modalItem ?? lastModalItem!}
            onClose={handleCloseModal}
            isClosing={isModalClosing}
          />
          {/* BungaSVG — fixed sejajar modal, tidak terpengaruh scroll */}
          {/* Modal pakai sm:mr-[340px] → digeser 340px ke kiri dari center.
              Bunga kita taruh di kanan modal: right = 50% - 340px - 288px/2 */}
          <div
            className="pointer-events-none fixed top-1/2 z-105 hidden sm:block"
            style={{
              left: "calc(50% + 240px)",
              opacity: isModalOpen && !isModalClosing ? 1 : 0,
              transform:
                isModalOpen && !isModalClosing
                  ? "translateY(-50%) scale(1)"
                  : "translateY(-50%) scale(0.85)",
              transition:
                "opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}
            aria-hidden="true"
          >
            <div className="pointer-events-auto flex shrink-0 flex-col items-center">
              <div className="relative flex h-80 w-80 items-center justify-center">
                <div className="pointer-events-none absolute inset-7.5 rounded-full border border-slate-200/25" />
                <span className="absolute top-0 left-0 h-5 w-5 border-t-[1.5px] border-l-[1.5px] border-[#c8a020]/50" />
                <span className="absolute top-0 right-0 h-5 w-5 border-t-[1.5px] border-r-[1.5px] border-[#c8a020]/50" />
                <span className="absolute bottom-0 left-0 h-5 w-5 border-b-[1.5px] border-l-[1.5px] border-[#c8a020]/50" />
                <span className="absolute right-0 bottom-0 h-5 w-5 border-r-[1.5px] border-b-[1.5px] border-[#c8a020]/50" />
                <div className="relative z-10 h-72 w-72">
                  <BungaSVG
                    activeId={bungaActiveId}
                    centerActive={bungaCenterActive}
                    onKelopakClick={handleKelopakClick}
                    onCenterClick={handleCenterClick}
                  />
                </div>
              </div>
              <p className="mt-3.5 text-[10.5px] tracking-[0.12em] text-white/35 uppercase">
                Menu Layanan Interaktif
              </p>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════ MODAL LOGIN ══════════════════ */}
      {loginOpen && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center sm:items-center"
          style={{
            backgroundColor: "rgba(8,13,28,0.7)",
            backdropFilter: "blur(8px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLoginOpen(false);
              setLoginError("");
              setLoginForm({ username: "", password: "" });
            }
          }}
        >
          <div className="w-full overflow-hidden rounded-md bg-white shadow-2xl sm:max-w-105">
            {/* Top accent line */}
            <div className="hlinear from-yellow-500 via-yellow-400 to-yellow-500" />

            {/* Content */}
            <div className="px-8 pt-8 pb-9">
              {/* Header row */}
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <Image
                    src="/Logo_Si-Puspita_v1.png"
                    alt="Logo"
                    width={640}
                    height={640}
                    quality={100}
                    priority
                    className="w-40 bg-white"
                  />
                  <h2 className="text-[24px] leading-tight font-bold tracking-tight text-gray-900">
                    Selamat datang
                  </h2>
                  <p className="mt-1 text-[13px] text-gray-400">
                    Masuk untuk mengakses sistem
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLoginOpen(false);
                    setLoginError("");
                    setLoginForm({ username: "", password: "" });
                  }}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {/* Username field */}
                <div>
                  <label className="mb-2 block text-[12px] font-semibold tracking-wider text-gray-500 uppercase">
                    Username
                  </label>
                  <input
                    type="text"
                    autoComplete="username"
                    placeholder="Masukkan username Anda"
                    value={loginForm.username}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, username: e.target.value });
                      setLoginError("");
                    }}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[14px] text-gray-900 placeholder-gray-300 transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:outline-none"
                  />
                </div>

                {/* Password field */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[12px] font-semibold tracking-wider text-gray-500 uppercase">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-[12px] font-medium text-blue-500 transition-colors hover:text-blue-700"
                    >
                      Lupa password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => {
                        setLoginForm({
                          ...loginForm,
                          password: e.target.value,
                        });
                        setLoginError("");
                      }}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-[14px] text-gray-900 placeholder-gray-300 transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-300 transition-colors hover:text-gray-500"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {loginError && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-500">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    {loginError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-600 py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:cursor-pointer hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {loginLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Masuk <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider + note */}
              <div className="mt-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <p className="shrink-0 text-[11px] font-medium text-gray-300">
                  BPKAD Kabupaten Kendal
                </p>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
