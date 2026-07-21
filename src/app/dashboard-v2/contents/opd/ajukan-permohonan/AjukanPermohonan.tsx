"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { createPortal } from "react-dom";
import type {
  FormulirPenghapusanPiutangOPD,
  FormulirPenghapusanPiutangOPDRecord,
  PernyataanOPD,
} from "@/types/types";
import {
  JENIS_PENGHAPUSAN_OPTIONS,
  JENIS_PIUTANG_OPTIONS,
  OPSI_RIWAYAT_PENAGIHAN_LABEL,
  getOpdByNama,
} from "@/types/types";
import { createPengajuan } from "@/lib/pengajuan";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FormData {
  // Langkah 1 – Data Pengajuan
  namaOPD: string;
  namaPenanggungJawab: string;
  jabatan: string;
  nomorSurat: string;
  tanggalSurat: string;
  fileSurat: File | null;
  jumlahDebitur: string;
  totalNilaiPiutang: string;
  jenisPiutang: string;
  jenisPenghapusan: string;
  // Langkah 2 – Upload Dokumen
  suratPengantarUsulan: File | null;
  daftarNominatifPiutang: File | null;
  rekapitulasiSaldoPiutang: File | null;
  nilaiRekapitulasiSaldoPiutang: string;
  neracaAwalPencatatanPiutang: File | null;
  dokumenPendukungSuratTidakMampuBayar: File | null;
  rekapitulasiAngsuran: File | null;
  nilaiRekapitulasiAngsuran: string;
  // Riwayat Penagihan
  riwayatPenagihan1: File | null;
  riwayatPenagihan2: File | null;
  riwayatPenagihan3: File | null;
  filePernyataanOPD: File | null;
  opsiRiwayatPenagihan: string;
  // Dokumen Dasar Piutang
  dokumenDasarPiutang: File | null;
  opsiDokumenDasarPiutang: string;
  // Langkah 3 – Checklist Persyaratan Substantif
  persyaratanPiutangMacet: File | null;
  persyaratanUsiaPencatatan: File | null;
  opsiTidakDapatDiserahkanPUPN: string;
  buktiTidakMampuKartuKeluargaMiskin: File | null;
  buktiTidakMampuPutusanPailit: File | null;
  buktiTidakMampuSuratKeteranganKelurahan: File | null;
  buktiTidakMampuBantuanSosial: File | null;
  buktiTidakMampuKunjunganPenagihan: File | null;
  opsiKerjaSamaPihakKetiga: string;
  buktiKerjaSamaPihakKetiga: File | null;
  opsiUpayaOptimal: string;
  buktiUpayaOptimal: File | null;
  // Langkah 4 – Pernyataan
  pernyataan: PernyataanOPD;
}

/* ------------------------------------------------------------------ */
/*  Utility                                                           */
/* ------------------------------------------------------------------ */
const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatRupiah = (value: string): string => {
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
};

const parseRupiah = (value: string): string => {
  return value.replace(/[^0-9]/g, "");
};

/* ------------------------------------------------------------------ */
/*  DateInput                                                          */
/* ------------------------------------------------------------------ */
const DateInput = ({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  required = false,
  className = "",
  error,
  touched,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
  touched?: boolean;
}) => {
  const inputDateRef = useRef<HTMLInputElement>(null);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value);
  const handleContainerClick = () => {
    inputDateRef.current?.showPicker?.();
    inputDateRef.current?.focus();
  };

  const borderColor = touched && error ? "border-red-400" : "border-gray-300";
  const bgColor = touched && error ? "bg-red-50" : "bg-white";

  return (
    <div
      className={`relative w-full cursor-pointer ${className}`}
      onClick={handleContainerClick}
    >
      <input
        ref={inputDateRef}
        type="date"
        value={value}
        onChange={handleChange}
        required={required}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
      <input
        type="text"
        value={value ? formatDisplayDate(value) : ""}
        placeholder={placeholder}
        readOnly
        className={`pointer-events-none h-full w-full rounded-md border px-3 py-0 text-sm text-gray-900 scheme-light placeholder:text-gray-500 ${borderColor} ${bgColor}`}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Step Configuration (4 langkah)                                     */
/* ------------------------------------------------------------------ */
interface FieldConfig {
  name: keyof FormData;
  type: "text" | "date" | "file" | "checkbox";
  placeholder?: string;
  accept?: string;
  label: string;
  required?: boolean;
  maxSizeText?: string;
  disabled?: boolean;
  /** Jika true (khusus type "file"), area unggah baru muncul setelah user klik kotak centang */
  gated?: boolean;
}

interface StepConfig {
  id: string;
  label: string;
  fields?: FieldConfig[];
}

const steps: StepConfig[] = [
  {
    id: "dataPengajuan",
    label: "Data Pengajuan",
    fields: [
      {
        name: "namaOPD",
        label: "Nama OPD",
        type: "text",
        placeholder: "Dinas Perdagangan Koperasi dan UKM",
        required: true,
        disabled: true,
      },
      {
        name: "namaPenanggungJawab",
        label: "Nama Penanggung Jawab (Kepala OPD)",
        type: "text",
        placeholder: "Masukkan nama lengkap",
        required: true,
      },
      {
        name: "jabatan",
        label: "Jabatan (Kepala OPD)",
        type: "text",
        placeholder: "Contoh: Kepala Dinas...",
        required: true,
      },
      {
        name: "nomorSurat",
        label: "Nomor Surat Pengantar",
        type: "text",
        placeholder: "005/SP/III/2025",
        required: true,
      },
      {
        name: "tanggalSurat",
        label: "Tanggal Surat Pengantar",
        type: "date",
        required: true,
      },
    ],
  },
  {
    id: "dokumenPendukung",
    label: "Dokumen Pendukung",
    fields: [
      {
        name: "suratPengantarUsulan",
        label: "1. Surat Pengantar Usulan",
        type: "file",
        accept: ".pdf",
        required: true,
        maxSizeText: "10 MB",
      },
      {
        name: "daftarNominatifPiutang",
        label: "2. Daftar Nominatif Usulan Piutang SKPD",
        type: "file",
        accept: ".pdf",
        required: true,
        maxSizeText: "10 MB",
      },
    ],
  },
  {
    id: "persyaratanSubstantif",
    label: "Checklist Persyaratan Substantif",
  },
  {
    id: "pernyataan",
    label: "Pernyataan OPD",
  },
];

/* ------------------------------------------------------------------ */
/*  Form data & hook                                                   */
/* ------------------------------------------------------------------ */
const initialForm: FormData = {
  namaOPD: "",
  namaPenanggungJawab: "",
  jabatan: "",
  nomorSurat: "",
  tanggalSurat: "",
  fileSurat: null,
  jumlahDebitur: "",
  totalNilaiPiutang: "",
  jenisPiutang: "",
  jenisPenghapusan: "",
  suratPengantarUsulan: null,
  daftarNominatifPiutang: null,
  rekapitulasiSaldoPiutang: null,
  nilaiRekapitulasiSaldoPiutang: "",
  neracaAwalPencatatanPiutang: null,
  dokumenPendukungSuratTidakMampuBayar: null,
  rekapitulasiAngsuran: null,
  nilaiRekapitulasiAngsuran: "",
  riwayatPenagihan1: null,
  riwayatPenagihan2: null,
  riwayatPenagihan3: null,
  filePernyataanOPD: null,
  opsiRiwayatPenagihan: "",
  dokumenDasarPiutang: null,
  opsiDokumenDasarPiutang: "",
  persyaratanPiutangMacet: null,
  persyaratanUsiaPencatatan: null,
  opsiTidakDapatDiserahkanPUPN: "",
  buktiTidakMampuKartuKeluargaMiskin: null,
  buktiTidakMampuPutusanPailit: null,
  buktiTidakMampuSuratKeteranganKelurahan: null,
  buktiTidakMampuBantuanSosial: null,
  buktiTidakMampuKunjunganPenagihan: null,
  opsiKerjaSamaPihakKetiga: "",
  buktiKerjaSamaPihakKetiga: null,
  opsiUpayaOptimal: "",
  buktiUpayaOptimal: null,
  pernyataan: {
    dataBenar: false,
    dokumenResmi: false,
    upayaPenagihan: false,
    bersediaPerbaiki: false,
  },
};

function useFormWizard(initialOverrides?: Partial<FormData>) {
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    ...initialOverrides,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (
    name: string,
    value: string | File | null | boolean,
    required = true,
  ): string => {
    switch (name) {
      case "namaOPD":
      case "namaPenanggungJawab":
      case "jabatan":
      case "nomorSurat":
        return !(value as string).trim() && required ? "Wajib diisi" : "";
      case "tanggalSurat":
        return !value && required ? "Tanggal wajib diisi" : "";
      case "jumlahDebitur":
        if (required && !(value as string).trim()) return "Wajib diisi";
        if ((value as string).trim() && !/^\d+$/.test(value as string))
          return "Harus berupa angka";
        return "";
      case "totalNilaiPiutang":
        if (required && !(value as string).trim()) return "Wajib diisi";
        if ((value as string).trim() && !/^\d+$/.test(value as string))
          return "Harus berupa angka";
        return "";
      case "jenisPiutang":
        return !(value as string).trim() && required ? "Wajib dipilih" : "";
      case "jenisPenghapusan":
        return !(value as string).trim() && required ? "Wajib dipilih" : "";
      default:
        if (value instanceof File) {
          if (value.type !== "application/pdf") return "Hanya PDF";
          if (value.size > 10 * 1024 * 1024) return "Maks 10 MB";
        } else if (required && !value) {
          return "Wajib diunggah";
        }
        return "";
    }
  };

  const updateField = (name: string, value: string | File | null | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (value instanceof File || typeof value === "string" || value === null) {
      const err = validateField(name, value, true);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[name] = err;
        else delete next[name];
        return next;
      });
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const updatePernyataan = (key: keyof PernyataanOPD, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      pernyataan: { ...prev.pernyataan, [key]: value },
    }));
    setTouched((prev) => ({ ...prev, [`pernyataan_${key}`]: true }));
  };

  const markTouched = (name: string) =>
    setTouched((prev) => ({ ...prev, [name]: true }));
  const resetForm = () => {
    setForm({ ...initialForm, ...initialOverrides });
    setErrors({});
    setTouched({});
  };

  return {
    form,
    errors,
    touched,
    setErrors,
    updateField,
    markTouched,
    validateField,
    resetForm,
    updatePernyataan,
  };
}

/* ------------------------------------------------------------------ */
/*  FileUploadCard                                                     */
/* ------------------------------------------------------------------ */
const FileUploadCard = ({
  label,
  file,
  previewUrl,
  onFileChange,
  onReset,
  error,
  touched,
  accept = ".pdf",
  maxSizeText = "10 MB",
  required = true,
  gated = false,
  confirmed = false,
  onToggleConfirm,
}: {
  label: string;
  file: File | null;
  previewUrl: string | null;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  error?: string;
  touched?: boolean;
  accept?: string;
  maxSizeText?: string;
  required?: boolean;
  /** Jika true, area unggah baru muncul setelah kotak centang di klik */
  gated?: boolean;
  /** Status kotak centang (dipakai bila gated true) */
  confirmed?: boolean;
  /** Handler klik kotak centang (dipakai bila gated true) */
  onToggleConfirm?: () => void;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Drag‑and‑drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const syntheticEvent = {
        target: { files: e.dataTransfer.files },
      } as unknown as ChangeEvent<HTMLInputElement>;
      onFileChange(syntheticEvent);
    }
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        setModalOpen(false);
        previousFocusRef.current?.focus();
      }
    };
    if (modalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      modalRef.current?.focus();
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  // Kunci scroll halaman selama preview PDF terbuka. Modal ini dirender
  // lewat createPortal ke document.body dan bisa menumpuk di atas modal
  // form (ModalPengajuan) yang sudah mengunci scroll juga — kalau dua-duanya
  // cuma pakai `overflow: hidden`, di iOS Safari gesture scroll/zoom masih
  // bisa "bocor" dan membuat halaman terasa stuck / tidak bisa discroll
  // setelah preview ditutup, khususnya di layar mobile. Teknik
  // position:fixed + simpan posisi scroll jauh lebih aman.
  useEffect(() => {
    if (!modalOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    const prevOverflow = body.style.overflow;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [modalOpen]);

  const openModal = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setModalOpen(true);
  };

  // Status centang yang ditampilkan: otomatis tercentang jika file sudah ada
  const checkedDisplay = confirmed || !!file;

  // Catatan: dibuat sebagai *nilai JSX biasa* (bukan komponen `<ConfirmCheckbox />`)
  // supaya tidak didefinisikan ulang setiap render — mendefinisikan komponen di
  // dalam body komponen lain memicu warning "Cannot create components during render".
  const confirmCheckboxNode = gated ? (
    <button
      type="button"
      onClick={onToggleConfirm}
      aria-pressed={checkedDisplay}
      aria-label={
        checkedDisplay
          ? "Batalkan konfirmasi unggah dokumen"
          : "Konfirmasi akan mengunggah dokumen"
      }
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
        checkedDisplay
          ? "border-green-600 bg-green-500"
          : "border-gray-300 bg-white hover:border-blue-400"
      }`}
    >
      {checkedDisplay && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  ) : null;

  if (file) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required ? <span className="text-red-500"> *</span> : ""}
          </label>
          {confirmCheckboxNode}
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-linear-to-r from-gray-50 to-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium break-all text-gray-800"
                title={file.name}
              >
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openModal}
              className="flex-1 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 sm:flex-initial"
            >
              Lihat
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 sm:flex-initial"
            >
              Hapus
            </button>
          </div>
        </div>
        {touched && error && <p className="text-sm text-red-600">{error}</p>}

        {modalOpen &&
          previewUrl &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
              role="dialog"
              aria-modal="true"
              aria-label={`Preview ${file.name}`}
              ref={modalRef}
              tabIndex={-1}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setModalOpen(false);
                  previousFocusRef.current?.focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setModalOpen(false);
                  previousFocusRef.current?.focus();
                }
              }}
            >
              <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-md bg-white shadow-2xl">
                <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                  <span className="truncate text-sm font-medium text-gray-700">
                    {file.name}
                  </span>
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      previousFocusRef.current?.focus();
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close preview"
                  >
                    &times;
                  </button>
                </div>
                <div className="flex-1 overflow-hidden overscroll-contain">
                  <iframe
                    src={previewUrl}
                    className="h-full w-full"
                    style={{ border: "none" }}
                    title={`Preview ${file.name}`}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-500"> *</span> : ""}
        </label>
        {confirmCheckboxNode}
      </div>
      {gated && !checkedDisplay ? (
        touched && error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null
      ) : (
        <>
          <div
            ref={dropRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-md border-2 border-dashed p-4 text-center transition-colors ${
              touched && error
                ? "border-red-400 bg-red-50"
                : isDragOver
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-1 text-sm text-gray-600">
              <label
                htmlFor={label.replace(/\s+/g, "-")}
                className="relative cursor-pointer rounded font-medium text-blue-700 hover:text-blue-800"
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <span>Pilih file</span>
                <input
                  id={label.replace(/\s+/g, "-")}
                  type="file"
                  accept={accept}
                  onChange={onFileChange}
                  className="sr-only"
                  ref={fileInputRef}
                />
              </label>{" "}
              atau seret ke sini
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, maks {maxSizeText}
            </p>
          </div>
          {touched && error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Komponen Utama                                                     */
/* ------------------------------------------------------------------ */
export default function AjukanPermohonanWizard({
  onSubmitPengajuan: _onSubmitPengajuan,
  allowFreeNavigation = false,
  defaultNamaOPD = "",
  onRequireLogin,
}: {
  /**
   * @deprecated Sejak submit ditulis langsung ke Firestore lewat
   * createPengajuan() (lib/pengajuan.ts), callback ini tidak lagi
   * dipanggil — daftar pengajuan sekarang dibaca real-time dari Firestore
   * (lihat rencana onSnapshot di LihatDaftarPengajuan.tsx), bukan
   * diteruskan manual dari sini. Dibiarkan opsional di prop supaya
   * pemanggil lama tidak error kalau masih mengirim prop ini.
   */
  onSubmitPengajuan?: (record: FormulirPenghapusanPiutangOPDRecord) => void;
  /**
   * Default `false` (mode dashboard/OPD sudah login): tiap langkah wajib
   * lolos validasi dulu sebelum bisa "Berikutnya", dan submit langsung
   * mengirim data.
   *
   * `true` (dipakai di ModalPengajuan/landing page publik): user boleh
   * pindah langkah bebas tanpa harus mengisi semua field. Begitu formulir
   * lengkap dan user menekan "Kirim" di langkah terakhir, TIDAK langsung
   * mengirim data — karena sistem login belum diimplementasikan di sini,
   * yang muncul adalah alert bahwa OPD harus login dahulu (lihat
   * `showLoginRequiredAlert` / prop `onRequireLogin`).
   */
  allowFreeNavigation?: boolean;
  /**
   * Nilai awal field "Nama OPD". Default kosong (dipakai di ModalPengajuan
   * publik — belum tentu jelas OPD mana yang mengisi sebelum login). Di
   * dashboard (setelah login), parent bisa mengisi ini dengan nama OPD dari
   * sesi user yang sedang login.
   */
  defaultNamaOPD?: string;
  /**
   * Dipanggil saat user menekan "Login Sekarang" di alert "harus login
   * dahulu" (mode allowFreeNavigation). Opsional — kalau parent ingin,
   * misalnya, langsung membuka modal login. Kalau tidak diisi, tombol
   * hanya menutup alert ini.
   */
  onRequireLogin?: () => void;
} = {}) {
  const {
    form,
    errors,
    touched,
    setErrors,
    updateField,
    markTouched,
    validateField,
    resetForm,
    updatePernyataan,
  } = useFormWizard({ namaOPD: defaultNamaOPD });

  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  // Alert "formulir belum lengkap" — ditampilkan kalau user coba submit
  // (di mode allowFreeNavigation / ModalPengajuan publik) padahal masih
  // ada data/dokumen persyaratan yang belum diisi.
  const [showIncompleteAlert, setShowIncompleteAlert] = useState(false);
  // Alert "harus login dahulu" — ditampilkan di mode allowFreeNavigation
  // ketika formulir SUDAH lengkap tapi belum ada sesi login OPD. Submit
  // sesungguhnya baru diproses lewat dashboard setelah OPD login.
  const [showLoginRequiredAlert, setShowLoginRequiredAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Pesan error kalau upload dokumen / tulis ke Firestore gagal (mis.
  // koneksi putus, kuota Cloudinary habis, dsb) — ditampilkan di modal
  // konfirmasi supaya user tahu harus coba lagi, bukan cuma console.error.
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Nomor pengajuan resmi (format XXX/PENGAJUAN/DISDAGKOPUKM/MM/YYYY) hasil
  // createPengajuan() — ditampilkan di layar sukses supaya OPD punya
  // nomor referensi buat ditanyakan/dilacak.
  const [nomorPengajuanBerhasil, setNomorPengajuanBerhasil] = useState<
    string | null
  >(null);
  const [docPreview, setDocPreview] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [previewSurat, setPreviewSurat] = useState<string | null>(null);
  const [previewPendukung, setPreviewPendukung] = useState<
    Record<string, string | null>
  >({});
  const [confirmedDocs, setConfirmedDocs] = useState<Record<string, boolean>>(
    {},
  );
  // Tampilan saja di Langkah 2 (setelah "Rekapitulasi saldo piutang") — tidak
  // terhubung ke `form.opsiRiwayatPenagihan` (yang dipakai Langkah 3), jadi
  // pilihan di sini murni informatif dan tidak memengaruhi validasi/step lain.
  const [previewOpsiRiwayatPenagihan, setPreviewOpsiRiwayatPenagihan] =
    useState<string>("");
  const toggleConfirmedDoc = (fieldName: string) => {
    setConfirmedDocs((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };
  const stepContentRef = useRef<HTMLDivElement>(null);

  const objectUrlsRef = useRef<Set<string>>(new Set());

  const totalSteps = steps.length;
  const current = steps[currentStep];

  useEffect(() => {
    if (stepContentRef.current) {
      const firstFocusable = stepContentRef.current.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }
  }, [currentStep]);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach(URL.revokeObjectURL);
      urls.clear();
    };
  }, []);

  // Kunci scroll halaman selama preview dokumen (docPreview) terbuka.
  // Sama seperti preview di FileUploadCard — pakai position:fixed +
  // simpan posisi scroll, bukan cuma overflow:hidden, supaya tidak
  // meninggalkan halaman dalam kondisi stuck/tidak bisa discroll di
  // mobile setelah modal ini ditutup.
  useEffect(() => {
    if (!docPreview) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    const prevOverflow = body.style.overflow;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [docPreview]);

  const createAndTrackURL = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  };

  const revokeURL = (url: string) => {
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  };

  const handleFilePendukung =
    (fieldName: keyof FormData) => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      updateField(fieldName, file);

      setPreviewPendukung((prev) => {
        const next = { ...prev };
        if (next[fieldName]) {
          revokeURL(next[fieldName]!);
        }
        if (file && file.type === "application/pdf") {
          next[fieldName] = createAndTrackURL(file);
        } else {
          next[fieldName] = null;
        }
        return next;
      });
    };

  const resetFile = (fieldName: keyof FormData) => {
    updateField(fieldName, null);
    if (fieldName === "fileSurat") {
      if (previewSurat) revokeURL(previewSurat);
      setPreviewSurat(null);
    } else {
      setPreviewPendukung((prev) => {
        const next = { ...prev };
        if (next[fieldName]) {
          revokeURL(next[fieldName]!);
          next[fieldName] = null;
        }
        return next;
      });
    }
  };

  const validateNominatifStep = (): boolean => {
    let valid = true;

    // Validasi field upload (item 1 & 2 — masih berupa file PDF)
    current.fields?.forEach((field) => {
      const value = form[field.name];
      const isRequired = field.required !== false;
      const err = validateField(
        field.name,
        value as string | File | null,
        isRequired,
      );
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[field.name] = err;
        else delete next[field.name];
        return next;
      });
      markTouched(field.name);
      if (err) valid = false;
    });

    // Validasi pertanyaan checkbox (item 4, 6, 7, 8) — wajib dicentang
    const checkboxFields: (keyof FormData)[] = [
      "rekapitulasiSaldoPiutang",
      "neracaAwalPencatatanPiutang",
      "dokumenPendukungSuratTidakMampuBayar",
      "rekapitulasiAngsuran",
    ];
    checkboxFields.forEach((fieldName) => {
      const key = fieldName as string;
      markTouched(key);
      if (!confirmedDocs[key]) {
        setErrors((prev) => ({ ...prev, [key]: "Wajib dicentang" }));
        valid = false;
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });

        // Selain dicentang, dokumennya sendiri (file PDF) juga wajib
        // diunggah — sebelumnya tidak ada pengecekan ini sama sekali,
        // sehingga form bisa lolos ke langkah berikutnya (dan akhirnya
        // submit) walau field File-nya masih null.
        markTouched(key + "File");
        if (!form[fieldName]) {
          setErrors((prev) => ({
            ...prev,
            [key + "File"]: "Dokumen wajib diunggah",
          }));
          valid = false;
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[key + "File"];
            return next;
          });
        }
      }
    });

    // Nominal rekapitulasi saldo piutang (item 4) — wajib diisi jika checkbox dicentang
    if (confirmedDocs["rekapitulasiSaldoPiutang"]) {
      markTouched("nilaiRekapitulasiSaldoPiutang");
      const nominal = form.nilaiRekapitulasiSaldoPiutang;
      if (!nominal || parseInt(nominal, 10) <= 0) {
        setErrors((prev) => ({
          ...prev,
          nilaiRekapitulasiSaldoPiutang: "Nominal wajib diisi",
        }));
        valid = false;
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.nilaiRekapitulasiSaldoPiutang;
          return next;
        });
      }
    }

    // Nominal rekapitulasi angsuran (item 7) — wajib diisi jika checkbox dicentang
    if (confirmedDocs["rekapitulasiAngsuran"]) {
      markTouched("nilaiRekapitulasiAngsuran");
      const nominalAngsuran = form.nilaiRekapitulasiAngsuran;
      if (!nominalAngsuran || parseInt(nominalAngsuran, 10) <= 0) {
        setErrors((prev) => ({
          ...prev,
          nilaiRekapitulasiAngsuran: "Nominal wajib diisi",
        }));
        valid = false;
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.nilaiRekapitulasiAngsuran;
          return next;
        });
      }
    }

    // Catatan: validasi "opsiRiwayatPenagihan" SENGAJA tidak dilakukan di
    // langkah ini. Radio button pada item 5 di layar Langkah 2 hanya preview
    // (terhubung ke `previewOpsiRiwayatPenagihan`, bukan `form.opsiRiwayatPenagihan`),
    // sedangkan pilihan resminya baru diisi user di Langkah 3. Validasi yang
    // benar untuk field ini sudah ada di `validatePersyaratanSubstantifStep`.
    // (Bug lama: dulu ada pengecekan `form.opsiRiwayatPenagihan` di sini juga,
    // sehingga tombol "Berikutnya" selalu terblokir karena field itu memang
    // belum pernah terisi saat masih di Langkah 2.)

    // Opsi dokumen dasar piutang (item 3) — cukup pilih salah satu opsi
    const opsiDok = form.opsiDokumenDasarPiutang;
    markTouched("opsiDokumenDasarPiutang");
    if (!opsiDok) {
      setErrors((prev) => ({
        ...prev,
        opsiDokumenDasarPiutang: "Pilih salah satu opsi",
      }));
      valid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.opsiDokumenDasarPiutang;
        return next;
      });
    }

    return valid;
  };

  const validatePersyaratanSubstantifStep = (): boolean => {
    let valid = true;

    // 1. Tidak ada barang jaminan
    markTouched("persyaratanTidakAdaBarangJaminan");
    if (!confirmedDocs["persyaratanTidakAdaBarangJaminan"]) {
      setErrors((prev) => ({
        ...prev,
        persyaratanTidakAdaBarangJaminan: "Wajib dicentang",
      }));
      valid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.persyaratanTidakAdaBarangJaminan;
        return next;
      });
    }

    // 2 & 3. Upload wajib
    (["persyaratanPiutangMacet", "persyaratanUsiaPencatatan"] as const).forEach(
      (key) => {
        markTouched(key);
        if (!form[key]) {
          setErrors((prev) => ({ ...prev, [key]: "Dokumen wajib diunggah" }));
          valid = false;
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      },
    );

    // 4. Alasan tidak dapat diserahkan ke PUPN
    markTouched("opsiTidakDapatDiserahkanPUPN");
    if (!form.opsiTidakDapatDiserahkanPUPN) {
      setErrors((prev) => ({
        ...prev,
        opsiTidakDapatDiserahkanPUPN: "Pilih salah satu opsi",
      }));
      valid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.opsiTidakDapatDiserahkanPUPN;
        return next;
      });
    }

    // 5 & 6. Checklist konfirmasi data nominatif
    (
      ["persyaratanNilaiPiutangSesuai", "persyaratanTidakAdaAngsuran"] as const
    ).forEach((key) => {
      markTouched(key);
      if (!confirmedDocs[key]) {
        setErrors((prev) => ({ ...prev, [key]: "Wajib dicentang" }));
        valid = false;
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    });

    // 7. Minimal salah satu bukti ketidakmampuan diunggah
    const buktiTidakMampuKeys = [
      "buktiTidakMampuKartuKeluargaMiskin",
      "buktiTidakMampuPutusanPailit",
      "buktiTidakMampuSuratKeteranganKelurahan",
      "buktiTidakMampuBantuanSosial",
      "buktiTidakMampuKunjunganPenagihan",
    ] as const;
    markTouched("buktiTidakMampu");
    const adaBuktiTidakMampu = buktiTidakMampuKeys.some((key) => !!form[key]);
    if (!adaBuktiTidakMampu) {
      setErrors((prev) => ({
        ...prev,
        buktiTidakMampu: "Unggah minimal salah satu dokumen bukti",
      }));
      valid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.buktiTidakMampu;
        return next;
      });
    }

    // 8. Kerja sama penagihan dengan pihak ketiga (khusus nominal > Rp 1 Milyar)
    markTouched("opsiKerjaSamaPihakKetiga");
    if (!form.opsiKerjaSamaPihakKetiga) {
      setErrors((prev) => ({
        ...prev,
        opsiKerjaSamaPihakKetiga: "Pilih salah satu opsi",
      }));
      valid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.opsiKerjaSamaPihakKetiga;
        return next;
      });
      if (form.opsiKerjaSamaPihakKetiga === "ya") {
        markTouched("buktiKerjaSamaPihakKetiga");
        if (!form.buktiKerjaSamaPihakKetiga) {
          setErrors((prev) => ({
            ...prev,
            buktiKerjaSamaPihakKetiga: "Dokumen wajib diunggah",
          }));
          valid = false;
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.buktiKerjaSamaPihakKetiga;
            return next;
          });
        }
      }
    }

    // 9. Bukti riwayat penagihan — opsi dipilih langsung di langkah 3 (tidak lagi bergantung pada langkah 2)
    markTouched("opsiRiwayatPenagihan");
    if (!form.opsiRiwayatPenagihan) {
      setErrors((prev) => ({
        ...prev,
        opsiRiwayatPenagihan: "Pilih salah satu opsi",
      }));
      valid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.opsiRiwayatPenagihan;
        return next;
      });
      if (form.opsiRiwayatPenagihan === "penyataan_opd") {
        markTouched("filePernyataanOPD");
        if (!form.filePernyataanOPD) {
          setErrors((prev) => ({
            ...prev,
            filePernyataanOPD: "Dokumen wajib diunggah",
          }));
          valid = false;
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.filePernyataanOPD;
            return next;
          });
        }
      } else {
        (
          [
            "riwayatPenagihan1",
            "riwayatPenagihan2",
            "riwayatPenagihan3",
          ] as const
        ).forEach((key) => {
          markTouched(key);
          if (!form[key]) {
            setErrors((prev) => ({
              ...prev,
              [key]: "Dokumen wajib diunggah",
            }));
            valid = false;
          } else {
            setErrors((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }
        });
      }
    }

    // 10. Upaya optimal
    markTouched("opsiUpayaOptimal");
    if (!form.opsiUpayaOptimal) {
      setErrors((prev) => ({
        ...prev,
        opsiUpayaOptimal: "Pilih salah satu opsi",
      }));
      valid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.opsiUpayaOptimal;
        return next;
      });
      if (form.opsiUpayaOptimal === "ada") {
        markTouched("buktiUpayaOptimal");
        if (!form.buktiUpayaOptimal) {
          setErrors((prev) => ({
            ...prev,
            buktiUpayaOptimal: "Dokumen wajib diunggah",
          }));
          valid = false;
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.buktiUpayaOptimal;
            return next;
          });
        }
      }
    }

    // 11. Hasil penagihan tidak berhasil
    markTouched("persyaratanHasilPenagihanTidakBerhasil");
    if (!confirmedDocs["persyaratanHasilPenagihanTidakBerhasil"]) {
      setErrors((prev) => ({
        ...prev,
        persyaratanHasilPenagihanTidakBerhasil: "Wajib dicentang",
      }));
      valid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.persyaratanHasilPenagihanTidakBerhasil;
        return next;
      });
    }

    return valid;
  };

  // Validasi khusus Langkah 1 (Data Pengajuan) — diekstrak jadi fungsi
  // tersendiri (bukan cuma inline di validateCurrentStep) supaya bisa
  // dipanggil ulang dari validateAllSteps() tanpa bergantung pada step
  // mana yang sedang aktif di layar (dipakai mode allowFreeNavigation).
  const validateDataPengajuanStep = (): boolean => {
    const fields = steps[0].fields!;
    let allValid = true;
    for (const field of fields) {
      const value = form[field.name];
      const isRequired = field.required !== false;
      const err = validateField(
        field.name,
        value as string | File | null,
        isRequired,
      );
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[field.name] = err;
        else delete next[field.name];
        return next;
      });
      markTouched(field.name);
      if (err) allValid = false;
    }

    const jml = form.jumlahDebitur;
    const errJml = validateField("jumlahDebitur", jml, true);
    if (errJml) {
      setErrors((prev) => ({ ...prev, jumlahDebitur: errJml }));
      markTouched("jumlahDebitur");
      allValid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.jumlahDebitur;
        return next;
      });
    }

    const total = form.totalNilaiPiutang;
    const errTotal = validateField("totalNilaiPiutang", total, true);
    if (errTotal) {
      setErrors((prev) => ({ ...prev, totalNilaiPiutang: errTotal }));
      markTouched("totalNilaiPiutang");
      allValid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.totalNilaiPiutang;
        return next;
      });
    }

    if (!form.jenisPiutang) {
      setErrors((prev) => ({
        ...prev,
        jenisPiutang: "Pilih jenis piutang",
      }));
      markTouched("jenisPiutang");
      allValid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.jenisPiutang;
        return next;
      });
    }

    if (!form.jenisPenghapusan) {
      setErrors((prev) => ({
        ...prev,
        jenisPenghapusan: "Pilih jenis penghapusan",
      }));
      markTouched("jenisPenghapusan");
      allValid = false;
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.jenisPenghapusan;
        return next;
      });
    }

    return allValid;
  };

  // Validasi checklist "Pernyataan OPD" (Langkah 4) — juga diekstrak
  // sendiri dengan alasan yang sama seperti di atas.
  const validatePernyataanStep = (): boolean => {
    const { pernyataan } = form;
    const allChecked =
      pernyataan.dataBenar &&
      pernyataan.dokumenResmi &&
      pernyataan.upayaPenagihan &&
      pernyataan.bersediaPerbaiki;
    if (!allChecked) {
      setErrors((prev) => ({
        ...prev,
        pernyataan: "Centang semua pernyataan",
      }));
      return false;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.pernyataan;
      return next;
    });
    return true;
  };

  const validateCurrentStep = (): boolean => {
    if (current.id === "dokumenPendukung") {
      return validateNominatifStep();
    }
    if (current.id === "persyaratanSubstantif") {
      return validatePersyaratanSubstantifStep();
    }
    if (current.id === "pernyataan") {
      return validatePernyataanStep();
    }
    if (current.id === "dataPengajuan") {
      return validateDataPengajuanStep();
    }
    return true;
  };

  // Validasi SEMUA langkah sekaligus, dipakai khusus di mode
  // allowFreeNavigation (ModalPengajuan publik) — karena di mode ini user
  // boleh lompat-lompat antar langkah tanpa validasi per-langkah, jadi
  // saat submit di langkah terakhir kita perlu pastikan seluruh formulir
  // (bukan cuma langkah yang sedang tampil) benar-benar sudah lengkap
  // sebelum data ditulis ke storage.
  const validateAllSteps = (): {
    valid: boolean;
    firstInvalidStep: number | null;
  } => {
    const results = [
      validateDataPengajuanStep(),
      validateNominatifStep(),
      validatePersyaratanSubstantifStep(),
      validatePernyataanStep(),
    ];
    const firstInvalidStep = results.findIndex((r) => !r);
    return {
      valid: results.every(Boolean),
      firstInvalidStep: firstInvalidStep === -1 ? null : firstInvalidStep,
    };
  };

  const goNext = () => {
    if (!allowFreeNavigation && !validateCurrentStep()) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (allowFreeNavigation) {
      // Mode ModalPengajuan publik — user boleh lompat bebas antar langkah,
      // jadi di langkah terakhir ini kita validasi SELURUH formulir sekaligus.
      // Kalau ada yang belum lengkap, arahkan ke langkah pertama yang
      // bermasalah dan tampilkan alert. Kalau sudah lengkap, TETAP belum
      // benar-benar mengirim data — tampilkan alert "harus login dahulu",
      // karena pengajuan sesungguhnya hanya bisa dikirim lewat dashboard
      // OPD yang sudah login.
      const { valid, firstInvalidStep } = validateAllSteps();
      if (!valid) {
        if (firstInvalidStep !== null) setCurrentStep(firstInvalidStep);
        setShowIncompleteAlert(true);
        return;
      }
      setShowLoginRequiredAlert(true);
    } else {
      setSubmitError(null);
      setShowConfirm(true);
    }
  };
  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // createdBy sementara diturunkan dari nama OPD yang mengisi form
      // (belum ada sesi login sungguhan) — begitu autentikasi selesai,
      // ganti ke uid dari Firebase Auth di sini.
      const createdBy = getOpdByNama(form.namaOPD)?.slug ?? "";

      // Cast aman: FormData di file ini field-per-field sama persis
      // dengan FormulirPenghapusanPiutangOPD di types.ts (union type
      // seperti JenisPiutang di sini masih bertipe `string`, sudah
      // divalidasi oleh validateCurrentStep sebelum submit).
      const hasil = await createPengajuan(
        form as unknown as FormulirPenghapusanPiutangOPD,
        createdBy,
      );

      setNomorPengajuanBerhasil(hasil.nomorPengajuan);
      setSubmitted(true);
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Gagal mengirim pengajuan. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = form[field.name];
    const error = errors[field.name];
    const isTouched = touched[field.name];
    const isRequired = field.required !== false;

    if (field.type === "file") {
      let previewUrl: string | null = null;
      let onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
      let onReset: () => void;

      if (field.name === "fileSurat") {
        previewUrl = previewSurat;
        onFileChange = (e) => {
          const file = e.target.files?.[0] || null;
          updateField("fileSurat", file);
          if (previewSurat) revokeURL(previewSurat);
          setPreviewSurat(
            file && file.type === "application/pdf"
              ? createAndTrackURL(file)
              : null,
          );
        };
        onReset = () => resetFile("fileSurat");
      } else {
        previewUrl = previewPendukung[field.name] ?? null;
        onFileChange = handleFilePendukung(field.name);
        onReset = () => resetFile(field.name);
      }

      return (
        <FileUploadCard
          key={field.name}
          label={field.label}
          file={value as File | null}
          previewUrl={previewUrl}
          onFileChange={onFileChange}
          onReset={onReset}
          error={error}
          touched={isTouched}
          accept={field.accept}
          maxSizeText={field.maxSizeText || "10 MB"}
          required={isRequired}
          gated={field.gated}
          confirmed={confirmedDocs[field.name]}
          onToggleConfirm={() => toggleConfirmedDoc(field.name)}
        />
      );
    }

    if (field.type === "date") {
      return (
        <div key={field.name} className="space-y-1.5">
          <label
            htmlFor={field.name}
            className="block text-sm font-medium text-gray-700"
          >
            {field.label}{" "}
            {isRequired && <span className="text-red-500">*</span>}
          </label>
          <DateInput
            value={(value as string) || ""}
            onChange={(val) => updateField(field.name, val)}
            placeholder={field.placeholder || "DD/MM/YYYY"}
            className="h-10"
            error={error}
            touched={isTouched}
          />
          {isTouched && error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-1.5">
        <label
          htmlFor={field.name}
          className="block text-sm font-medium text-gray-700"
        >
          {field.label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          id={field.name}
          type={field.type}
          name={field.name}
          value={(value as string) || ""}
          onChange={(e) => updateField(field.name, e.target.value)}
          onBlur={() => markTouched(field.name)}
          placeholder={field.placeholder}
          disabled={field.disabled}
          className={`w-full rounded-md border px-3 py-2.5 text-sm scheme-light transition outline-none placeholder:text-gray-500 ${
            field.disabled
              ? "cursor-not-allowed bg-gray-100 text-gray-600"
              : isTouched && error
                ? "border-red-400 bg-red-50 text-gray-900"
                : "border-gray-300 bg-white text-gray-900 focus:ring-1 focus:ring-[#1a4e8f]/30"
          }`}
        />
        {isTouched && error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  };

  // Item pertanyaan sederhana: teks pertanyaan + kotak centang (tanpa menu upload).
  // - `amountField`: jika diisi, setelah dicentang akan muncul input nominal (Rupiah) yang wajib diisi OPD.
  // - `infoText`: jika diisi, akan ditampilkan sebagai keterangan tambahan (daftar poin) di bawah pertanyaan.
  // - `infoTitle`: judul untuk kotak keterangan tambahan (default sesuai konteks lama, bisa dioverride).
  // - `viewField`: jika diisi, menampilkan tombol "Lihat" yang membuka dokumen yang sudah diunggah pada field tsb.
  const renderCheckboxQuestion = (
    fieldName: string,
    label: string,
    amountField?: keyof FormData,
    infoText?: string[],
    infoTitle: string = "Usia pencatatan piutang telah memenuhi ketentuan:",
    viewField?: keyof FormData,
  ) => {
    const key = fieldName as string;
    const checked = !!confirmedDocs[key];
    const err = errors[key];
    const isTouched = touched[key];

    const amountKey = amountField as string | undefined;
    const amountValue = amountField ? (form[amountField] as string) : "";
    const amountErr = amountKey ? errors[amountKey] : undefined;
    const amountTouched = amountKey ? touched[amountKey] : false;

    // Dokumen pendukung pernyataan ini — `fieldName` dipakai ganda: sebagai
    // key confirmedDocs (status centang) SEKALIGUS sebagai nama field File
    // di FormData (mis. "rekapitulasiSaldoPiutang"), jadi bisa langsung
    // dipakai ke handleFilePendukung/resetFile seperti field file lainnya.
    const fileFieldKey = fieldName as keyof FormData;
    const fileValue = form[fileFieldKey] as File | null;
    const fileErr = errors[key + "File"];
    const fileTouched = touched[key + "File"];

    const viewUrl = viewField
      ? (previewPendukung[viewField as string] ?? null)
      : null;

    return (
      <div key={key} className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">
            {label} <span className="text-red-500">*</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {viewField && (
              <button
                type="button"
                onClick={() => {
                  if (viewUrl)
                    setDocPreview({
                      url: viewUrl,
                      title: "Daftar Nominatif Usulan Piutang SKPD",
                    });
                }}
                disabled={!viewUrl}
                className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Lihat
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const next = !checked;
                toggleConfirmedDoc(key);
                markTouched(key);
                if (next) {
                  setErrors((prev) => {
                    const nextErrors = { ...prev };
                    delete nextErrors[key];
                    return nextErrors;
                  });
                } else {
                  // Batal dicentang -> kosongkan nominal (jika ada) dan
                  // dokumen yang sudah diunggah untuk pernyataan ini.
                  if (amountField) {
                    updateField(amountField, "");
                    if (amountKey) {
                      setErrors((prev) => {
                        const nextErrors = { ...prev };
                        delete nextErrors[amountKey];
                        return nextErrors;
                      });
                    }
                  }
                  resetFile(fileFieldKey);
                  setErrors((prev) => {
                    const nextErrors = { ...prev };
                    delete nextErrors[key + "File"];
                    return nextErrors;
                  });
                }
              }}
              aria-pressed={checked}
              aria-label={checked ? "Batalkan konfirmasi" : "Konfirmasi"}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                checked
                  ? "border-green-600 bg-green-500"
                  : "border-gray-300 bg-white hover:border-blue-400"
              }`}
            >
              {checked && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        {isTouched && err && <p className="text-sm text-red-600">{err}</p>}

        {/* Keterangan tambahan / ketentuan terkait pertanyaan ini */}
        {infoText && infoText.length > 0 && (
          <div className="mt-2 rounded-md border border-orange-100 bg-orange-50/60 px-3 py-2">
            <p className="text-xs font-medium text-orange-800">{infoTitle}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-orange-700">
              {infoText.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Input nominal muncul setelah checkbox dicentang */}
        {checked && amountField && (
          <div className="mt-2 space-y-1.5 rounded-md border border-gray-200 bg-gray-50 p-3">
            <label
              htmlFor={amountKey}
              className="block text-sm font-medium text-gray-700"
            >
              Nominal {label.replace(/^\d+\.\s*/, "")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              id={amountKey}
              type="text"
              inputMode="numeric"
              name={amountKey}
              value={formatRupiah(amountValue)}
              onChange={(e) =>
                updateField(amountField, parseRupiah(e.target.value))
              }
              onBlur={() => markTouched(amountKey as string)}
              placeholder="Rp0"
              className={`w-full rounded-md border px-3 py-2.5 text-sm scheme-light transition outline-none placeholder:text-gray-500 ${
                amountTouched && amountErr
                  ? "border-red-400 bg-red-50 text-gray-900"
                  : "border-gray-300 bg-white text-gray-900 focus:ring-1 focus:ring-[#1a4e8f]/30"
              }`}
            />
            {amountTouched && amountErr && (
              <p className="text-sm text-red-600">{amountErr}</p>
            )}
          </div>
        )}

        {/* Unggah dokumen pendukung pernyataan ini — sebelumnya TIDAK ADA
            sama sekali, sehingga field File terkait (mis.
            rekapitulasiSaldoPiutang) selalu tetap null walau checkbox
            sudah dicentang dan nominal sudah diisi. Ini yang menyebabkan
            dokumen/nilai terkait tidak pernah benar-benar tersimpan
            sebagai file di database. */}
        {checked && (
          <div className="mt-2 space-y-1.5 rounded-md border border-gray-200 bg-gray-50 p-3">
            <label className="block text-sm font-medium text-gray-700">
              Unggah Dokumen {label.replace(/^\d+\.\s*/, "")}{" "}
              <span className="text-red-500">*</span>
            </label>
            {fileValue ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                <span className="min-w-0 truncate text-sm text-gray-800">
                  {fileValue.name}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <label className="cursor-pointer text-xs font-medium text-blue-700 hover:underline">
                    Ganti
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFilePendukung(fileFieldKey)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => resetFile(fileFieldKey)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <label
                className={`block w-full cursor-pointer rounded-md border border-dashed px-3 py-2.5 text-center text-sm transition-colors ${
                  fileTouched && fileErr
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-300 bg-white text-gray-500 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                Klik untuk pilih file PDF (maks. 10 MB)
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFilePendukung(fileFieldKey)}
                />
              </label>
            )}
            {fileTouched && fileErr && (
              <p className="text-sm text-red-600">{fileErr}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Step 2 rendering with the exact specified order
  const renderDokumenPendukungStep = () => {
    // Helper to create a field config for a file field by name
    const fieldConfig = (
      name: keyof FormData,
      label: string,
      gated = true,
    ): FieldConfig => ({
      name,
      label,
      type: "file",
      accept: ".pdf",
      required: true,
      maxSizeText: "10 MB",
      gated,
    });

    return (
      <div className="space-y-6">
        {/* 1. Surat Pengantar Usulan */}
        {renderField(
          fieldConfig("suratPengantarUsulan", "1. Surat Pengantar Usulan"),
        )}

        {/* 2. Daftar Nominatif Usulan Piutang SKPD */}
        {renderField(
          fieldConfig(
            "daftarNominatifPiutang",
            "2. Daftar Nominatif Usulan Piutang SKPD",
          ),
        )}

        {/* 3. Dokumen yang menjadi dasar timbulnya piutang (ada / tidak ada) */}
        <div>
          <p
            id="legendDokumenDasarPiutang"
            className="mb-2 text-sm font-semibold text-gray-700"
          >
            3. Dokumen yang menjadi dasar timbulnya piutang
          </p>
          <div
            role="group"
            aria-labelledby="legendDokumenDasarPiutang"
            className="rounded-md border border-gray-200 p-3 sm:p-4"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Apakah terdapat dokumen dasar piutang?
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="opsiDokumenDasarPiutang"
                    value="ada"
                    checked={form.opsiDokumenDasarPiutang === "ada"}
                    onChange={() =>
                      updateField("opsiDokumenDasarPiutang", "ada")
                    }
                    className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                  />
                  <span className="text-sm text-gray-800">Ada</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="opsiDokumenDasarPiutang"
                    value="tidak_ada"
                    checked={form.opsiDokumenDasarPiutang === "tidak_ada"}
                    onChange={() =>
                      updateField("opsiDokumenDasarPiutang", "tidak_ada")
                    }
                    className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                  />
                  <span className="text-sm text-gray-800">Tidak ada</span>
                </label>
              </div>
              {touched.opsiDokumenDasarPiutang &&
                errors.opsiDokumenDasarPiutang && (
                  <p className="text-sm text-red-600">
                    {errors.opsiDokumenDasarPiutang}
                  </p>
                )}
              {form.opsiDokumenDasarPiutang === "tidak_ada" && (
                <p className="mt-2 text-sm text-gray-500">
                  Tidak perlu unggah dokumen.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 4. Rekapitulasi saldo piutang (Rp) */}
        {renderCheckboxQuestion(
          "rekapitulasiSaldoPiutang",
          "4. Rekapitulasi saldo piutang (Rp)",
          "nilaiRekapitulasiSaldoPiutang",
        )}

        {/* Riwayat Penagihan / Pernyataan OPD — tampilan saja, dipilih ulang
            secara resmi (dan menentukan upload) di Langkah 3. */}
        <div>
          <p
            id="legendRiwayatPenagihanPreview"
            className="mb-2 text-sm font-semibold text-gray-700"
          >
            5. Riwayat Penagihan / Pernyataan OPD
          </p>
          <div
            role="group"
            aria-labelledby="legendRiwayatPenagihanPreview"
            className="rounded-md border border-gray-200 p-3 sm:p-4"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Apakah terdapat bukti dokumen riwayat penagihan ?
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="previewOpsiRiwayatPenagihan"
                    value="riwayat_tagihan"
                    checked={previewOpsiRiwayatPenagihan === "riwayat_tagihan"}
                    onChange={() =>
                      setPreviewOpsiRiwayatPenagihan("riwayat_tagihan")
                    }
                    className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                  />
                  <span className="text-sm text-gray-800">
                    Ada bukti{" "}
                    {OPSI_RIWAYAT_PENAGIHAN_LABEL.riwayat_tagihan.toLowerCase()}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="previewOpsiRiwayatPenagihan"
                    value="penyataan_opd"
                    checked={previewOpsiRiwayatPenagihan === "penyataan_opd"}
                    onChange={() =>
                      setPreviewOpsiRiwayatPenagihan("penyataan_opd")
                    }
                    className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                  />
                  <span className="text-sm text-gray-800">
                    Ada bukti{" "}
                    {OPSI_RIWAYAT_PENAGIHAN_LABEL.penyataan_opd.toLowerCase()}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Neraca awal pencatatan piutang */}
        {renderCheckboxQuestion(
          "neracaAwalPencatatanPiutang",
          "6. Neraca awal pencatatan piutang",
          undefined,
          [
            "Di atas 5 th untuk piutang nominal ≤ Rp 8 Jt per penanggung",
            "Di atas 7 th untuk nominal Rp 8 jt sd. 50 jt per penanggung",
            "Di atas 10 th untuk nominal > Rp 50 jt per penanggung",
          ],
        )}

        {/* 7. Rekapitulasi angsuran (Rp) */}
        {renderCheckboxQuestion(
          "rekapitulasiAngsuran",
          "7. Rekapitulasi angsuran (Rp)",
          "nilaiRekapitulasiAngsuran",
        )}

        {/* 8. Dokumen pendukung lainnya (Surat tidak mampu bayar) */}
        {renderCheckboxQuestion(
          "dokumenPendukungSuratTidakMampuBayar",
          "8. Dokumen pendukung lainnya (Surat tidak mampu bayar)",
          undefined,
          [
            "Kartu keluarga miskin",
            "Putusan pailit",
            "Surat keterangan dari kelurahan/kantor kepala desa/kantor kepala lingkungan/kantor instansi yang berwenang/Pejabat Pengelola Keuangan Daerah yang menyatakan Penanggung Utang tidak mempunyai kemampuan untuk menyelesaikan utang atau tidak diketahui tempat tinggalnya",
            "Bukti penerimaan asuransi kesehatan bagi masyarakat miskin, bukti penerima manfaat bantuan sosial berupa Bantuan Pangan Non Tunai (BPNT), Bantuan Sosial Tunai (BST), Program Keluarga Harapan (PKH) atau program lain yang sejenis",
            "Bukti kunjungan penagihan oleh petugas di lingkungan instansi Pejabat Pengelola Keuangan Daerah dalam bentuk surat kunjungan atau berita acara atau bukti lain yang menyimpulkan bahwa Penanggung Utang tidak mempunyai kemampuan untuk menyelesaikan utang atau tidak diketahui lagi tempat tinggalnya",
          ],
          "Dibuktikan dengan salah satu atau lebih dokumen berupa:",
        )}
      </div>
    );
  };

  // Step 3 (baru): Checklist Persyaratan Substantif
  const renderPersyaratanSubstantifStep = () => {
    const fieldConfig = (
      name: keyof FormData,
      label: string,
      gated = true,
      required = true,
    ): FieldConfig => ({
      name,
      label,
      type: "file",
      accept: ".pdf",
      required,
      maxSizeText: "10 MB",
      gated,
    });

    const pupnOptions: { value: string; label: string }[] = [
      {
        value: "dokumen_tidak_memadai",
        label:
          "Tidak memiliki dokumen pendukung yang memadai sehingga pihak yang bertanggung jawab tidak dapat dipastikan",
      },
      {
        value: "jumlah_tidak_pasti",
        label:
          "Jumlah piutangnya tidak dapat dipastikan karena dokumen sumber atau bukti pendukung tidak lengkap atau tidak jelas",
      },
      {
        value: "sengketa_pengadilan",
        label: "Masih dalam sengketa di pengadilan",
      },
      {
        value: "ditolak_pupn",
        label: "Telah diserahkan kepada PUPN tetapi dikembalikan atau ditolak",
      },
    ];

    // Opsi dokumen bukti "tidak mampu membayar" — cukup unggah salah satu/lebih
    const buktiTidakMampuItems: {
      name: keyof FormData;
      title: string;
      description: string;
    }[] = [
      {
        name: "buktiTidakMampuKartuKeluargaMiskin",
        title: "Kartu Keluarga Miskin",
        description:
          "Kartu keluarga miskin milik Penanggung Utang sebagai bukti kondisi ekonomi.",
      },
      {
        name: "buktiTidakMampuPutusanPailit",
        title: "Putusan Pailit",
        description:
          "Putusan pailit dari pengadilan yang menyatakan Penanggung Utang tidak mampu membayar.",
      },
      {
        name: "buktiTidakMampuSuratKeteranganKelurahan",
        title: "Surat Keterangan Kelurahan / Instansi Berwenang",
        description:
          "Surat keterangan dari kelurahan/kantor kepala desa/kantor kepala lingkungan/kantor instansi yang berwenang/Pejabat Pengelola Keuangan Daerah yang menyatakan Penanggung Utang tidak mempunyai kemampuan untuk menyelesaikan utang atau tidak diketahui tempat tinggalnya.",
      },
      {
        name: "buktiTidakMampuBantuanSosial",
        title: "Bukti Penerima Bantuan Sosial (BPNT / BST / PKH)",
        description:
          "Bukti penerimaan asuransi kesehatan bagi masyarakat miskin, atau bukti penerima manfaat bantuan sosial berupa BPNT, BST, PKH, atau program sejenis lainnya.",
      },
      {
        name: "buktiTidakMampuKunjunganPenagihan",
        title: "Bukti Kunjungan Penagihan",
        description:
          "Bukti kunjungan penagihan oleh petugas instansi Pejabat Pengelola Keuangan Daerah, berupa surat kunjungan, berita acara, atau bukti lain yang menyimpulkan Penanggung Utang tidak mampu menyelesaikan utang atau tidak diketahui tempat tinggalnya.",
      },
    ];
    const buktiTidakMampuCount = buktiTidakMampuItems.filter(
      (item) => !!form[item.name],
    ).length;

    return (
      <div className="space-y-6">
        {/* 1. Tidak ada barang jaminan */}
        {renderCheckboxQuestion(
          "persyaratanTidakAdaBarangJaminan",
          "1. Tidak ada barang jaminan/barang jaminan tidak bernilai ekonomis",
        )}

        {/* 2. Piutang telah berstatus macet */}
        {renderField(
          fieldConfig(
            "persyaratanPiutangMacet",
            "2. Piutang telah berstatus macet dengan usia piutang > 3 tahun (upload SKRD/SK/Surat Perjanjian)",
          ),
        )}

        {/* 3. Usia pencatatan piutang telah memenuhi ketentuan */}
        <div className="space-y-2">
          {renderField(
            fieldConfig(
              "persyaratanUsiaPencatatan",
              "3. Usia pencatatan piutang telah memenuhi ketentuan (upload neraca awal terjadinya piutang)",
            ),
          )}
          <div className="rounded-md border border-orange-100 bg-orange-50/60 px-3 py-2">
            <p className="text-xs font-medium text-orange-800">
              Usia pencatatan piutang telah memenuhi ketentuan:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-orange-700">
              <li>
                Di atas 5 th untuk piutang nominal ≤ Rp 8 Jt per penanggung
              </li>
              <li>
                Di atas 7 th untuk nominal Rp 8 jt sd. 50 jt per penanggung
              </li>
              <li>Di atas 10 th untuk nominal {">"} Rp 50 jt per penanggung</li>
            </ul>
          </div>
        </div>

        {/* 4. Piutang tidak dapat diserahkan kepada PUPN */}
        <div>
          <p
            id="legendPUPN"
            className="mb-2 text-sm font-semibold text-gray-700"
          >
            4. Piutang tidak dapat diserahkan kepada PUPN (sesuai ketentuan
            Pasal 4 ayat 2) <span className="text-red-500">*</span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby="legendPUPN"
            className="rounded-md border border-gray-200 p-3 sm:p-4"
          >
            <div className="space-y-2.5">
              {pupnOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-2"
                >
                  <input
                    type="radio"
                    name="opsiTidakDapatDiserahkanPUPN"
                    value={opt.value}
                    checked={form.opsiTidakDapatDiserahkanPUPN === opt.value}
                    onChange={() => {
                      updateField("opsiTidakDapatDiserahkanPUPN", opt.value);
                      markTouched("opsiTidakDapatDiserahkanPUPN");
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                  />
                  <span className="text-sm text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
            {touched.opsiTidakDapatDiserahkanPUPN &&
              errors.opsiTidakDapatDiserahkanPUPN && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.opsiTidakDapatDiserahkanPUPN}
                </p>
              )}
          </div>
        </div>

        {/* 5. Nilai piutang telah sesuai ketentuan */}
        {renderCheckboxQuestion(
          "persyaratanNilaiPiutangSesuai",
          "5. Nilai piutang telah sesuai ketentuan (data Daftar Nominatif Usulan Piutang SKPD)",
          undefined,
          undefined,
          undefined,
          "daftarNominatifPiutang",
        )}

        {/* 6. Tidak terdapat angsuran/angsuran < 10% dari total kewajiban */}
        {renderCheckboxQuestion(
          "persyaratanTidakAdaAngsuran",
          "6. Tidak terdapat angsuran/angsuran < 10% dari total kewajiban (data Daftar Nominatif Usulan Piutang SKPD)",
          undefined,
          undefined,
          undefined,
          "daftarNominatifPiutang",
        )}

        {/* 7. Tidak mempunyai kemampuan untuk menyelesaikan utang */}
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-700">
              7. Tidak mempunyai kemampuan untuk menyelesaikan utang{" "}
              <span className="text-red-500">*</span>
            </p>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                buktiTidakMampuCount > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {buktiTidakMampuCount > 0 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {buktiTidakMampuCount} dari {buktiTidakMampuItems.length} dokumen
              diunggah
            </span>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Pilih dan unggah minimal salah satu dokumen berikut sebagai bukti
            pendukung.
          </p>

          <div className="rounded-md border border-gray-200 bg-gray-50/40 p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              {buktiTidakMampuItems.map((item, idx) => {
                const isFilled = !!form[item.name];
                return (
                  <div
                    key={item.name}
                    className={`flex flex-col gap-2.5 rounded-lg border bg-white p-3 shadow-sm transition-colors ${
                      isFilled
                        ? "border-green-200"
                        : "border-gray-200 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isFilled
                            ? "bg-green-500 text-white"
                            : "bg-[#1a4e8f]/10 text-[#1a4e8f]"
                        }`}
                      >
                        {isFilled ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <p className="text-xs leading-relaxed text-gray-500">
                        {item.description}
                      </p>
                    </div>
                    {renderField(
                      fieldConfig(item.name, item.title, true, false),
                    )}
                  </div>
                );
              })}
            </div>
            {touched.buktiTidakMampu && errors.buktiTidakMampu && (
              <p className="mt-3 text-sm text-red-600">
                {errors.buktiTidakMampu}
              </p>
            )}
          </div>
        </div>

        {/* 8. Telah dilakukan kerja sama penagihan dengan melibatkan pihak ketiga */}
        <div>
          <p
            id="legendKerjaSamaPihakKetiga"
            className="mb-2 text-sm font-semibold text-gray-700"
          >
            8. Telah dilakukan kerja sama penagihan dengan melibatkan pihak
            ketiga (khusus untuk nominal di atas Rp 1 Milyar){" "}
            <span className="text-red-500">*</span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby="legendKerjaSamaPihakKetiga"
            className="rounded-md border border-gray-200 p-3 sm:p-4"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="opsiKerjaSamaPihakKetiga"
                  value="ya"
                  checked={form.opsiKerjaSamaPihakKetiga === "ya"}
                  onChange={() => {
                    updateField("opsiKerjaSamaPihakKetiga", "ya");
                    markTouched("opsiKerjaSamaPihakKetiga");
                  }}
                  className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                />
                <span className="text-sm text-gray-800">Ya</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="opsiKerjaSamaPihakKetiga"
                  value="tidak"
                  checked={form.opsiKerjaSamaPihakKetiga === "tidak"}
                  onChange={() => {
                    updateField("opsiKerjaSamaPihakKetiga", "tidak");
                    markTouched("opsiKerjaSamaPihakKetiga");
                    updateField("buktiKerjaSamaPihakKetiga", null);
                  }}
                  className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                />
                <span className="text-sm text-gray-800">Tidak</span>
              </label>
            </div>
            {touched.opsiKerjaSamaPihakKetiga &&
              errors.opsiKerjaSamaPihakKetiga && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.opsiKerjaSamaPihakKetiga}
                </p>
              )}
            {form.opsiKerjaSamaPihakKetiga === "ya" && (
              <div className="mt-3">
                {renderField(
                  fieldConfig(
                    "buktiKerjaSamaPihakKetiga",
                    "Upload bukti kerja sama penagihan dengan pihak ketiga",
                    false,
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grup: Upaya Penagihan (item 9 & 10) */}
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">
            Upaya Penagihan
          </p>
          <div className="space-y-6 rounded-md border border-gray-200 p-3 sm:p-4">
            {/* 9. Bukti riwayat penagihan — dipilih langsung di sini, tidak lagi mengikuti jawaban langkah 2 */}
            <div>
              <p
                id="legendRiwayatPenagihanStep3"
                className="mb-2 text-sm font-semibold text-gray-700"
              >
                9. Surat tagihan telah diterbitkan{" "}
                <span className="text-red-500">*</span>
              </p>
              <div
                role="radiogroup"
                aria-labelledby="legendRiwayatPenagihanStep3"
                className="rounded-md border border-gray-200 p-3 sm:p-4"
              >
                <p className="mb-2 text-sm text-gray-600">
                  Pilih bukti riwayat penagihan yang tersedia:
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="opsiRiwayatPenagihan"
                      value="riwayat_tagihan"
                      checked={form.opsiRiwayatPenagihan === "riwayat_tagihan"}
                      onChange={() => {
                        updateField("opsiRiwayatPenagihan", "riwayat_tagihan");
                        markTouched("opsiRiwayatPenagihan");
                        updateField("filePernyataanOPD", null);
                      }}
                      className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                    />
                    <span className="text-sm text-gray-800">
                      Ada bukti{" "}
                      {OPSI_RIWAYAT_PENAGIHAN_LABEL.riwayat_tagihan.toLowerCase()}
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="opsiRiwayatPenagihan"
                      value="penyataan_opd"
                      checked={form.opsiRiwayatPenagihan === "penyataan_opd"}
                      onChange={() => {
                        updateField("opsiRiwayatPenagihan", "penyataan_opd");
                        markTouched("opsiRiwayatPenagihan");
                        updateField("riwayatPenagihan1", null);
                        updateField("riwayatPenagihan2", null);
                        updateField("riwayatPenagihan3", null);
                      }}
                      className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                    />
                    <span className="text-sm text-gray-800">
                      Ada bukti{" "}
                      {OPSI_RIWAYAT_PENAGIHAN_LABEL.penyataan_opd.toLowerCase()}
                    </span>
                  </label>
                </div>
                {touched.opsiRiwayatPenagihan &&
                  errors.opsiRiwayatPenagihan && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.opsiRiwayatPenagihan}
                    </p>
                  )}

                {form.opsiRiwayatPenagihan === "penyataan_opd" && (
                  <div className="mt-3">
                    {renderField(
                      fieldConfig(
                        "filePernyataanOPD",
                        "Upload Pernyataan OPD",
                        false,
                      ),
                    )}
                  </div>
                )}
                {form.opsiRiwayatPenagihan === "riwayat_tagihan" && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {renderField(
                      fieldConfig("riwayatPenagihan1", "Penagihan ke-1", false),
                    )}
                    {renderField(
                      fieldConfig("riwayatPenagihan2", "Penagihan ke-2", false),
                    )}
                    {renderField(
                      fieldConfig("riwayatPenagihan3", "Penagihan ke-3", false),
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 10. Telah dilakukan upaya optimal sesuai ketentuan */}
            <div>
              <p
                id="legendUpayaOptimal"
                className="mb-2 text-sm font-semibold text-gray-700"
              >
                10. Telah dilakukan upaya optimal sesuai ketentuan{" "}
                <span className="text-red-500">*</span>
              </p>
              <div
                role="radiogroup"
                aria-labelledby="legendUpayaOptimal"
                className="rounded-md border border-gray-200 p-3 sm:p-4"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="opsiUpayaOptimal"
                      value="ada"
                      checked={form.opsiUpayaOptimal === "ada"}
                      onChange={() => {
                        updateField("opsiUpayaOptimal", "ada");
                        markTouched("opsiUpayaOptimal");
                      }}
                      className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                    />
                    <span className="text-sm text-gray-800">Ada</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="opsiUpayaOptimal"
                      value="tidak"
                      checked={form.opsiUpayaOptimal === "tidak"}
                      onChange={() => {
                        updateField("opsiUpayaOptimal", "tidak");
                        markTouched("opsiUpayaOptimal");
                        updateField("buktiUpayaOptimal", null);
                      }}
                      className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                    />
                    <span className="text-sm text-gray-800">Tidak</span>
                  </label>
                </div>
                {touched.opsiUpayaOptimal && errors.opsiUpayaOptimal && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.opsiUpayaOptimal}
                  </p>
                )}
                {form.opsiUpayaOptimal === "ada" && (
                  <div className="mt-3">
                    {renderField(
                      fieldConfig(
                        "buktiUpayaOptimal",
                        "Upload bukti upaya optimal",
                        false,
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 11. Hasil penagihan tidak berhasil */}
        {renderCheckboxQuestion(
          "persyaratanHasilPenagihanTidakBerhasil",
          "11. Hasil penagihan tidak berhasil",
        )}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <div className="rounded-md border border-gray-200 bg-white p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-gray-800">
            ✅ Pengiriman Berhasil
          </p>
          <p className="mb-4 text-sm text-gray-600">
            Data dan dokumen telah terkirim.
          </p>
          {nomorPengajuanBerhasil && (
            <div className="mx-auto mb-4 inline-block rounded-md border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-2">
              <p className="text-xs font-semibold tracking-wide text-[#065f46] uppercase">
                Nomor Pengajuan
              </p>
              <p className="font-mono text-base font-bold text-[#065f46]">
                {nomorPengajuanBerhasil}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              setSubmitted(false);
              setNomorPengajuanBerhasil(null);
              resetForm();
              setCurrentStep(0);
              setPreviewOpsiRiwayatPenagihan("");
            }}
            className="rounded-md bg-[#1a4e8f] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e3b6e]"
          >
            Kirim Usulan Baru
          </button>
        </div>
      </div>
    );
  }

  const allChecked =
    form.pernyataan.dataBenar &&
    form.pernyataan.dokumenResmi &&
    form.pernyataan.upayaPenagihan &&
    form.pernyataan.bersediaPerbaiki;

  return (
    <>
      {showIncompleteAlert &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Formulir Belum Lengkap"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowIncompleteAlert(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowIncompleteAlert(false);
            }}
          >
            <div className="w-full max-w-sm rounded-md border border-gray-200 bg-white p-5 shadow-lg">
              <h3 className="mb-2 font-semibold text-gray-800">
                Formulir Belum Lengkap
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Masih ada data atau dokumen persyaratan yang belum diisi.
                Silakan lengkapi formulir terlebih dahulu sebelum mengirim
                pengajuan.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowIncompleteAlert(false)}
                  className="w-full rounded-md bg-[#1a4e8f] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e3b6e] sm:w-auto sm:py-1.5"
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showLoginRequiredAlert &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Login Diperlukan"
            onClick={(e) => {
              if (e.target === e.currentTarget)
                setShowLoginRequiredAlert(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowLoginRequiredAlert(false);
            }}
          >
            <div className="w-full max-w-sm rounded-md border border-gray-200 bg-white p-5 shadow-lg">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-[#c2740f]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
                    <path
                      d="M7 9V6.5a3 3 0 016 0V9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800">
                  Login Diperlukan
                </h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Formulir Anda sudah lengkap. Namun, untuk mengirimkan pengajuan
                ini, OPD harus login terlebih dahulu. Silakan login lalu
                kirimkan kembali pengajuan Anda melalui dashboard OPD.
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowLoginRequiredAlert(false)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:w-auto sm:py-1.5"
                >
                  Nanti Saja
                </button>
                <button
                  onClick={() => {
                    setShowLoginRequiredAlert(false);
                    onRequireLogin?.();
                  }}
                  className="w-full rounded-md bg-[#1a4e8f] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e3b6e] sm:w-auto sm:py-1.5"
                >
                  Login Sekarang
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showConfirm &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Konfirmasi Pengiriman"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmitting) {
                setShowConfirm(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowConfirm(false);
            }}
          >
            <div className="w-full max-w-sm rounded-md border border-gray-200 bg-white p-5 shadow-lg">
              <h3 className="mb-2 font-semibold text-gray-800">
                Konfirmasi Pengiriman
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                Apakah data dan dokumen sudah benar?
              </p>
              {submitError && (
                <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:w-auto sm:py-1.5"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-1 rounded-md bg-[#1a4e8f] px-3 py-2 text-sm font-medium text-white hover:bg-[#0e3b6e] sm:w-auto sm:py-1.5"
                >
                  {isSubmitting ? "Mengirim..." : "Ya, Kirim"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {docPreview &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            style={{ overscrollBehavior: "contain", touchAction: "pan-y" }}
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${docPreview.title}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setDocPreview(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setDocPreview(null);
            }}
          >
            <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-md bg-white shadow-2xl">
              <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <span className="truncate text-sm font-medium text-gray-700">
                  {docPreview.title}
                </span>
                <button
                  onClick={() => setDocPreview(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Tutup preview"
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-hidden overscroll-contain">
                <iframe
                  src={docPreview.url}
                  className="h-full w-full"
                  style={{ border: "none" }}
                  title={docPreview.title}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      <div className="mx-auto w-full max-w-4xl">
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          <div className="px-4 pt-4 pb-2 sm:px-6">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>
                Langkah {currentStep + 1} dari {totalSteps}
              </span>
              <span className="font-medium text-gray-600">{current.label}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-gray-200">
              <div
                className="h-1 rounded-full bg-[#1a4e8f] transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <div className="px-4 py-5 sm:px-6 sm:py-6" ref={stepContentRef}>
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              {current.id === "dokumenPendukung" ? (
                <fieldset className="rounded-md border border-gray-300 p-3 sm:p-4">
                  <legend className="px-2 text-lg font-bold text-gray-800 sm:text-xl">
                    Checklist Persyaratan Administrasi
                  </legend>
                  {renderDokumenPendukungStep()}
                </fieldset>
              ) : current.id === "persyaratanSubstantif" ? (
                <fieldset className="rounded-md border border-gray-300 p-3 sm:p-4">
                  <legend className="px-2 text-lg font-bold text-gray-800 sm:text-xl">
                    Checklist Persyaratan Substantif
                  </legend>
                  {renderPersyaratanSubstantifStep()}
                </fieldset>
              ) : current.id === "pernyataan" ? (
                <fieldset className="rounded-md border border-gray-300 p-3 sm:p-4">
                  <legend className="px-2 text-lg font-bold text-gray-800 sm:text-xl">
                    Pernyataan OPD
                  </legend>
                  <div className="space-y-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      Kami menyatakan bahwa:
                    </p>
                    {(
                      [
                        "dataBenar",
                        "dokumenResmi",
                        "upayaPenagihan",
                        "bersediaPerbaiki",
                      ] as (keyof PernyataanOPD)[]
                    ).map((key) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-start gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={form.pernyataan[key]}
                          onChange={(e) =>
                            updatePernyataan(key, e.target.checked)
                          }
                          className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#1a4e8f] scheme-light"
                        />
                        <span className="text-sm text-gray-700">
                          {key === "dataBenar" &&
                            "Seluruh data yang diinput adalah benar."}
                          {key === "dokumenResmi" &&
                            "Seluruh dokumen merupakan dokumen resmi."}
                          {key === "upayaPenagihan" &&
                            "Seluruh upaya penagihan telah dilakukan secara optimal."}
                          {key === "bersediaPerbaiki" &&
                            "Bersedia memperbaiki apabila terdapat kekurangan."}
                        </span>
                      </label>
                    ))}
                    {errors.pernyataan && (
                      <p className="text-sm text-red-600">
                        {errors.pernyataan}
                      </p>
                    )}
                  </div>
                </fieldset>
              ) : current.id === "dataPengajuan" ? (
                <fieldset className="rounded-md border border-gray-300 p-3 sm:p-4">
                  <legend className="px-2 text-lg font-bold text-gray-800 sm:text-xl">
                    Identitas Usulan
                  </legend>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    {current.fields?.map((field) => renderField(field))}

                    <div className="space-y-1.5">
                      <label
                        htmlFor="jumlahDebitur"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Jumlah Debitur <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="jumlahDebitur"
                        type="text"
                        name="jumlahDebitur"
                        value={form.jumlahDebitur}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          updateField("jumlahDebitur", val);
                        }}
                        onBlur={() => markTouched("jumlahDebitur")}
                        placeholder="Masukkan jumlah debitur"
                        className={`w-full rounded-md border px-3 py-2.5 text-sm text-gray-900 scheme-light transition outline-none placeholder:text-gray-500 ${
                          touched.jumlahDebitur && errors.jumlahDebitur
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white focus:ring-1 focus:ring-[#1a4e8f]/30"
                        }`}
                      />
                      {touched.jumlahDebitur && errors.jumlahDebitur && (
                        <p className="text-sm text-red-600">
                          {errors.jumlahDebitur}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="totalNilaiPiutang"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Total Nilai Piutang yang Diusulkan{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="totalNilaiPiutang"
                        type="text"
                        name="totalNilaiPiutang"
                        value={formatRupiah(form.totalNilaiPiutang)}
                        onChange={(e) => {
                          const raw = parseRupiah(e.target.value);
                          updateField("totalNilaiPiutang", raw);
                        }}
                        onBlur={() => markTouched("totalNilaiPiutang")}
                        placeholder="Masukkan total nilai piutang"
                        className={`w-full rounded-md border px-3 py-2.5 text-sm text-gray-900 scheme-light transition outline-none placeholder:text-gray-500 ${
                          touched.totalNilaiPiutang && errors.totalNilaiPiutang
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white focus:ring-1 focus:ring-[#1a4e8f]/30"
                        }`}
                      />
                      {touched.totalNilaiPiutang &&
                        errors.totalNilaiPiutang && (
                          <p className="text-sm text-red-600">
                            {errors.totalNilaiPiutang}
                          </p>
                        )}
                    </div>

                    {/* Jenis Piutang & Jenis Penghapusan — dua fieldset terpisah, disejajarkan */}
                    <div className="sm:col-span-2">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <fieldset className="rounded-md border border-gray-200 p-3 sm:p-4">
                          <legend className="px-2 text-sm font-medium text-gray-700">
                            Jenis Piutang{" "}
                            <span className="text-red-500">*</span>
                          </legend>
                          <div className="flex flex-col gap-2">
                            {JENIS_PIUTANG_OPTIONS.map((opsi) => (
                              <label
                                key={opsi}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  name="jenisPiutang"
                                  value={opsi}
                                  checked={form.jenisPiutang === opsi}
                                  onChange={() =>
                                    updateField("jenisPiutang", opsi)
                                  }
                                  className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                                />
                                <span className="text-sm text-gray-800">
                                  {opsi}
                                </span>
                              </label>
                            ))}
                          </div>
                          {touched.jenisPiutang && errors.jenisPiutang && (
                            <p className="mt-2 text-sm text-red-600">
                              {errors.jenisPiutang}
                            </p>
                          )}
                        </fieldset>

                        <fieldset className="rounded-md border border-gray-200 p-3 sm:p-4">
                          <legend className="px-2 text-sm font-medium text-gray-700">
                            Jenis Penghapusan{" "}
                            <span className="text-red-500">*</span>
                          </legend>
                          <div className="flex flex-col gap-2">
                            {JENIS_PENGHAPUSAN_OPTIONS.map((opsi) => (
                              <label
                                key={opsi}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  name="jenisPenghapusan"
                                  value={opsi}
                                  checked={form.jenisPenghapusan === opsi}
                                  onChange={() =>
                                    updateField("jenisPenghapusan", opsi)
                                  }
                                  className="h-4 w-4 shrink-0 border-gray-300 accent-[#1a4e8f] scheme-light"
                                />
                                <span className="text-sm text-gray-800">
                                  {opsi}
                                </span>
                              </label>
                            ))}
                          </div>
                          {touched.jenisPenghapusan &&
                            errors.jenisPenghapusan && (
                              <p className="mt-2 text-sm text-red-600">
                                {errors.jenisPenghapusan}
                              </p>
                            )}
                        </fieldset>
                      </div>
                    </div>
                  </div>
                </fieldset>
              ) : (
                <div className="space-y-6">
                  {current.fields?.map((field) => renderField(field))}
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition sm:w-auto sm:py-2 ${
                    currentStep === 0
                      ? "cursor-not-allowed bg-gray-50 text-gray-400"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Sebelumnya
                </button>
                {currentStep === totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!allowFreeNavigation && !allChecked}
                    className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition sm:w-auto sm:py-2 ${
                      allowFreeNavigation || allChecked
                        ? "bg-[#1a4e8f] text-white hover:bg-[#0e3b6e]"
                        : "cursor-not-allowed bg-gray-300 text-gray-500"
                    }`}
                  >
                    Kirim
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    className="w-full rounded-md bg-[#1a4e8f] px-4 py-2.5 text-sm font-medium text-white hover:cursor-pointer hover:bg-[#0e3b6e] sm:w-auto sm:py-2"
                  >
                    Berikutnya
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
