"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PernyataanOPD {
  dataBenar: boolean;
  dokumenResmi: boolean;
  upayaPenagihan: boolean;
  bersediaPerbaiki: boolean;
}

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
  neracaAwalPencatatanPiutang: File | null;
  dokumenPendukungSuratTidakMampuBayar: File | null;
  rekapitulasiAngsuran: File | null;
  // Riwayat Penagihan
  riwayatPenagihan1: File | null;
  riwayatPenagihan2: File | null;
  riwayatPenagihan3: File | null;
  filePernyataanOPD: File | null;
  opsiRiwayatPenagihan: string;
  // Dokumen Dasar Piutang
  dokumenDasarPiutang: File | null;
  opsiDokumenDasarPiutang: string;
  // Langkah 3 – Pernyataan
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
        className={`pointer-events-none h-full w-full rounded-md border px-3 py-0 text-sm ${borderColor} ${bgColor}`}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Step Configuration (3 langkah)                                     */
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
        placeholder: "Nama OPD terisi otomatis",
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
        placeholder: "Contoh: Kepala Dinas Pendidikan",
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
        label: "Surat Pengantar Usulan",
        type: "file",
        accept: ".pdf",
        required: true,
        maxSizeText: "10 MB",
      },
      {
        name: "daftarNominatifPiutang",
        label: "Daftar Nominatif Usulan Piutang SKPD",
        type: "file",
        accept: ".pdf",
        required: true,
        maxSizeText: "10 MB",
      },
      {
        name: "rekapitulasiSaldoPiutang",
        label: "Rekapitulasi saldo piutang (Rp)",
        type: "file",
        accept: ".pdf",
        required: true,
        maxSizeText: "10 MB",
      },
    ],
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
  neracaAwalPencatatanPiutang: null,
  dokumenPendukungSuratTidakMampuBayar: null,
  rekapitulasiAngsuran: null,
  riwayatPenagihan1: null,
  riwayatPenagihan2: null,
  riwayatPenagihan3: null,
  filePernyataanOPD: null,
  opsiRiwayatPenagihan: "",
  dokumenDasarPiutang: null,
  opsiDokumenDasarPiutang: "",
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

  const openModal = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setModalOpen(true);
  };

  if (file) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-500"> *</span> : ""}
        </label>
        <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-linear-to-r from-gray-50 to-white px-4 py-3 shadow-sm">
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
              <p className="truncate text-sm font-medium text-gray-800">
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
              className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
            >
              Lihat
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </div>
        {touched && error && <p className="text-sm text-red-600">{error}</p>}

        {modalOpen && previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${file.name}`}
            ref={modalRef}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setModalOpen(false);
                previousFocusRef.current?.focus();
              }
            }}
          >
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-md bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="truncate text-sm font-medium text-gray-700">
                  {file.name}
                </span>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    previousFocusRef.current?.focus();
                  }}
                  className="text-xl leading-none text-gray-400 hover:text-gray-600"
                  aria-label="Close preview"
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={previewUrl}
                  className="h-full w-full"
                  style={{ border: "none" }}
                  title={`Preview ${file.name}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : ""}
      </label>
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
        <p className="mt-1 text-xs text-gray-500">PDF, maks {maxSizeText}</p>
      </div>
      {touched && error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Komponen Utama                                                     */
/* ------------------------------------------------------------------ */
export default function AjukanPermohonanWizard() {
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
  } = useFormWizard({ namaOPD: "Dinas Perdagangan Koperasi dan UKM" });

  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewSurat, setPreviewSurat] = useState<string | null>(null);
  const [previewPendukung, setPreviewPendukung] = useState<
    Record<string, string | null>
  >({});
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

    // Validasi tiga field dari konfigurasi langkah
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

    // Validasi tiga upload baru yang wajib
    const newFields: (keyof FormData)[] = [
      "neracaAwalPencatatanPiutang",
      "dokumenPendukungSuratTidakMampuBayar",
      "rekapitulasiAngsuran",
    ];
    newFields.forEach((fieldName) => {
      const file = form[fieldName] as File | null;
      const err = validateField(fieldName, file, true);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[fieldName] = err;
        else delete next[fieldName];
        return next;
      });
      markTouched(fieldName);
      if (err) valid = false;
    });

    // Opsi riwayat penagihan
    const opsi = form.opsiRiwayatPenagihan;
    markTouched("opsiRiwayatPenagihan");
    if (!opsi) {
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
      if (opsi === "riwayat") {
        ["riwayatPenagihan1", "riwayatPenagihan2", "riwayatPenagihan3"].forEach(
          (fieldName) => {
            const file = form[fieldName as keyof FormData] as File | null;
            const err = validateField(fieldName, file, true);
            setErrors((prev) => {
              const next = { ...prev };
              if (err) next[fieldName] = err;
              else delete next[fieldName];
              return next;
            });
            markTouched(fieldName);
            if (err) valid = false;
          },
        );
        setErrors((prev) => {
          const next = { ...prev };
          delete next.filePernyataanOPD;
          return next;
        });
      } else if (opsi === "pernyataan") {
        const file = form.filePernyataanOPD;
        const err = validateField("filePernyataanOPD", file, true);
        setErrors((prev) => {
          const next = { ...prev };
          if (err) next.filePernyataanOPD = err;
          else delete next.filePernyataanOPD;
          return next;
        });
        markTouched("filePernyataanOPD");
        if (err) valid = false;
        ["riwayatPenagihan1", "riwayatPenagihan2", "riwayatPenagihan3"].forEach(
          (fieldName) => {
            setErrors((prev) => {
              const next = { ...prev };
              delete next[fieldName];
              return next;
            });
          },
        );
      } else if (opsi === "tidak_ada") {
        [
          "riwayatPenagihan1",
          "riwayatPenagihan2",
          "riwayatPenagihan3",
          "filePernyataanOPD",
        ].forEach((fieldName) => {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
          });
        });
      }
    }

    // Opsi dokumen dasar piutang
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
      if (opsiDok === "ada") {
        const file = form.dokumenDasarPiutang;
        const err = validateField("dokumenDasarPiutang", file, true);
        setErrors((prev) => {
          const next = { ...prev };
          if (err) next.dokumenDasarPiutang = err;
          else delete next.dokumenDasarPiutang;
          return next;
        });
        markTouched("dokumenDasarPiutang");
        if (err) valid = false;
      } else if (opsiDok === "tidak_ada") {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.dokumenDasarPiutang;
          return next;
        });
      }
    }

    return valid;
  };

  const validateCurrentStep = (): boolean => {
    if (current.id === "dokumenPendukung") {
      return validateNominatifStep();
    }
    if (current.id === "pernyataan") {
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
    }
    if (current.fields) {
      let allValid = true;
      for (const field of current.fields) {
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

      if (current.id === "dataPengajuan") {
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
      }

      return allValid;
    }
    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < totalSteps - 1) setCurrentStep((prev) => prev + 1);
    else setShowConfirm(true);
  };
  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Data terkirim:", form);
      setSubmitted(true);
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
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
          className={`w-full rounded-md border px-3 py-2.5 text-sm transition outline-none ${
            field.disabled
              ? "cursor-not-allowed bg-gray-100 text-gray-600"
              : isTouched && error
                ? "border-red-400 bg-red-50"
                : "border-gray-300 focus:ring-1 focus:ring-[#1a4e8f]/30"
          }`}
        />
        {isTouched && error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  };

  // Step 2 rendering with the exact specified order
  const renderDokumenPendukungStep = () => {
    // Helper to create a field config for a file field by name
    const fieldConfig = (name: keyof FormData, label: string): FieldConfig => ({
      name,
      label,
      type: "file",
      accept: ".pdf",
      required: true,
      maxSizeText: "10 MB",
    });

    return (
      <div className="space-y-6">
        {/* 1. Surat Pengantar Usulan */}
        {renderField(
          fieldConfig("suratPengantarUsulan", "Surat Pengantar Usulan"),
        )}

        {/* 2. Daftar Nominatif Usulan Piutang SKPD */}
        {renderField(
          fieldConfig(
            "daftarNominatifPiutang",
            "Daftar Nominatif Usulan Piutang SKPD",
          ),
        )}

        {/* 3. Dokumen yang menjadi dasar timbulnya piutang (ada / tidak ada) */}
        <fieldset className="rounded-md border border-gray-200 p-4">
          <legend className="px-2 text-sm font-semibold text-gray-700">
            Dokumen yang menjadi dasar timbulnya piutang
          </legend>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Apakah terdapat dokumen dasar piutang?
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="opsiDokumenDasarPiutang"
                  value="ada"
                  checked={form.opsiDokumenDasarPiutang === "ada"}
                  onChange={() => updateField("opsiDokumenDasarPiutang", "ada")}
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm">Ada</span>
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
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm">Tidak ada</span>
              </label>
            </div>
            {touched.opsiDokumenDasarPiutang &&
              errors.opsiDokumenDasarPiutang && (
                <p className="text-sm text-red-600">
                  {errors.opsiDokumenDasarPiutang}
                </p>
              )}
            {form.opsiDokumenDasarPiutang === "ada" && (
              <div className="mt-4">
                <FileUploadCard
                  label="Dokumen Dasar Piutang (SKRD/SK/Perjanjian)"
                  file={form.dokumenDasarPiutang}
                  previewUrl={previewPendukung.dokumenDasarPiutang ?? null}
                  onFileChange={handleFilePendukung("dokumenDasarPiutang")}
                  onReset={() => resetFile("dokumenDasarPiutang")}
                  error={errors.dokumenDasarPiutang}
                  touched={touched.dokumenDasarPiutang}
                  required
                />
              </div>
            )}
            {form.opsiDokumenDasarPiutang === "tidak_ada" && (
              <p className="mt-2 text-sm text-gray-500">
                Tidak perlu unggah dokumen.
              </p>
            )}
          </div>
        </fieldset>

        {/* 4. Rekapitulasi saldo piutang (Rp) */}
        {renderField(
          fieldConfig(
            "rekapitulasiSaldoPiutang",
            "Rekapitulasi saldo piutang (Rp)",
          ),
        )}

        {/* 5. Riwayat penagihan (wajib 3 kali) */}
        <fieldset className="rounded-md border border-gray-200 p-4">
          <legend className="px-2 text-sm font-semibold text-gray-700">
            Riwayat Penagihan (wajib 3 kali)
          </legend>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Apakah terdapat bukti riwayat penagihan?
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="opsiRiwayatPenagihan"
                  value="riwayat"
                  checked={form.opsiRiwayatPenagihan === "riwayat"}
                  onChange={() =>
                    updateField("opsiRiwayatPenagihan", "riwayat")
                  }
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm">Ada bukti riwayat penagihan</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="opsiRiwayatPenagihan"
                  value="pernyataan"
                  checked={form.opsiRiwayatPenagihan === "pernyataan"}
                  onChange={() =>
                    updateField("opsiRiwayatPenagihan", "pernyataan")
                  }
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm">Ada bukti pernyataan dari OPD</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="opsiRiwayatPenagihan"
                  value="tidak_ada"
                  checked={form.opsiRiwayatPenagihan === "tidak_ada"}
                  onChange={() =>
                    updateField("opsiRiwayatPenagihan", "tidak_ada")
                  }
                  className="h-4 w-4 border-gray-300 text-blue-600"
                />
                <span className="text-sm">Tidak ada bukti</span>
              </label>
            </div>
            {touched.opsiRiwayatPenagihan && errors.opsiRiwayatPenagihan && (
              <p className="text-sm text-red-600">
                {errors.opsiRiwayatPenagihan}
              </p>
            )}
            {form.opsiRiwayatPenagihan === "riwayat" && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <FileUploadCard
                  label="Penagihan ke-1"
                  file={form.riwayatPenagihan1}
                  previewUrl={previewPendukung.riwayatPenagihan1 ?? null}
                  onFileChange={handleFilePendukung("riwayatPenagihan1")}
                  onReset={() => resetFile("riwayatPenagihan1")}
                  error={errors.riwayatPenagihan1}
                  touched={touched.riwayatPenagihan1}
                  required
                />
                <FileUploadCard
                  label="Penagihan ke-2"
                  file={form.riwayatPenagihan2}
                  previewUrl={previewPendukung.riwayatPenagihan2 ?? null}
                  onFileChange={handleFilePendukung("riwayatPenagihan2")}
                  onReset={() => resetFile("riwayatPenagihan2")}
                  error={errors.riwayatPenagihan2}
                  touched={touched.riwayatPenagihan2}
                  required
                />
                <FileUploadCard
                  label="Penagihan ke-3"
                  file={form.riwayatPenagihan3}
                  previewUrl={previewPendukung.riwayatPenagihan3 ?? null}
                  onFileChange={handleFilePendukung("riwayatPenagihan3")}
                  onReset={() => resetFile("riwayatPenagihan3")}
                  error={errors.riwayatPenagihan3}
                  touched={touched.riwayatPenagihan3}
                  required
                />
              </div>
            )}
            {form.opsiRiwayatPenagihan === "pernyataan" && (
              <div className="mt-4">
                <FileUploadCard
                  label="Dokumen Pernyataan OPD"
                  file={form.filePernyataanOPD}
                  previewUrl={previewPendukung.filePernyataanOPD ?? null}
                  onFileChange={handleFilePendukung("filePernyataanOPD")}
                  onReset={() => resetFile("filePernyataanOPD")}
                  error={errors.filePernyataanOPD}
                  touched={touched.filePernyataanOPD}
                  required
                />
              </div>
            )}
            {form.opsiRiwayatPenagihan === "tidak_ada" && (
              <p className="mt-2 text-sm text-gray-500">
                Tidak perlu unggah dokumen.
              </p>
            )}
          </div>
        </fieldset>

        {/* 6. Neraca awal pencatatan piutang */}
        <FileUploadCard
          label="Neraca awal pencatatan piutang"
          file={form.neracaAwalPencatatanPiutang}
          previewUrl={previewPendukung.neracaAwalPencatatanPiutang ?? null}
          onFileChange={handleFilePendukung("neracaAwalPencatatanPiutang")}
          onReset={() => resetFile("neracaAwalPencatatanPiutang")}
          error={errors.neracaAwalPencatatanPiutang}
          touched={touched.neracaAwalPencatatanPiutang}
          required
        />

        {/* 7. Rekapitulasi angsuran (Rp) */}
        <FileUploadCard
          label="Rekapitulasi angsuran (Rp)"
          file={form.rekapitulasiAngsuran}
          previewUrl={previewPendukung.rekapitulasiAngsuran ?? null}
          onFileChange={handleFilePendukung("rekapitulasiAngsuran")}
          onReset={() => resetFile("rekapitulasiAngsuran")}
          error={errors.rekapitulasiAngsuran}
          touched={touched.rekapitulasiAngsuran}
          required
        />

        {/* 8. Dokumen pendukung lainnya (Surat tidak mampu bayar) */}
        <FileUploadCard
          label="Dokumen pendukung lainnya (Surat tidak mampu bayar)"
          file={form.dokumenPendukungSuratTidakMampuBayar}
          previewUrl={
            previewPendukung.dokumenPendukungSuratTidakMampuBayar ?? null
          }
          onFileChange={handleFilePendukung(
            "dokumenPendukungSuratTidakMampuBayar",
          )}
          onReset={() => resetFile("dokumenPendukungSuratTidakMampuBayar")}
          error={errors.dokumenPendukungSuratTidakMampuBayar}
          touched={touched.dokumenPendukungSuratTidakMampuBayar}
          required
        />
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="w-full py-10">
        <div className="rounded-md border border-gray-200 bg-white p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-gray-800">
            ✅ Pengiriman Berhasil
          </p>
          <p className="mb-4 text-sm text-gray-600">
            Data dan dokumen telah terkirim.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              resetForm();
              setCurrentStep(0);
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
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Pengiriman"
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
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1 rounded-md bg-[#1a4e8f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0e3b6e]"
              >
                {isSubmitting ? "Mengirim..." : "Ya, Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          <div className="px-6 pt-4 pb-2">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>
                Langkah {currentStep + 1} dari {totalSteps}
              </span>
              <span>{current.label}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-gray-200">
              <div
                className="h-1 rounded-full bg-[#1a4e8f] transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <div className="px-6 py-6" ref={stepContentRef}>
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              {current.id === "dokumenPendukung" ? (
                <fieldset className="rounded-md border border-gray-300 p-4">
                  <legend className="px-2 text-xl font-bold text-gray-800">
                    Checklist Persyaratan Administrasi
                  </legend>
                  {renderDokumenPendukungStep()}
                </fieldset>
              ) : current.id === "pernyataan" ? (
                <fieldset className="rounded-md border border-gray-300 p-4">
                  <legend className="px-2 text-xl font-bold text-gray-800">
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
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
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
                <fieldset className="rounded-md border border-gray-300 p-4">
                  <legend className="px-2 text-xl font-bold text-gray-800">
                    Identitas Usulan
                  </legend>
                  <div className="space-y-4">
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
                        className={`w-full rounded-md border px-3 py-2.5 text-sm transition outline-none ${
                          touched.jumlahDebitur && errors.jumlahDebitur
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 focus:ring-1 focus:ring-[#1a4e8f]/30"
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
                        className={`w-full rounded-md border px-3 py-2.5 text-sm transition outline-none ${
                          touched.totalNilaiPiutang && errors.totalNilaiPiutang
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 focus:ring-1 focus:ring-[#1a4e8f]/30"
                        }`}
                      />
                      {touched.totalNilaiPiutang &&
                        errors.totalNilaiPiutang && (
                          <p className="text-sm text-red-600">
                            {errors.totalNilaiPiutang}
                          </p>
                        )}
                    </div>

                    {/* Jenis Piutang */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Jenis Piutang <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="jenisPiutang"
                            value="Piutang Retribusi Daerah"
                            checked={
                              form.jenisPiutang === "Piutang Retribusi Daerah"
                            }
                            onChange={() =>
                              updateField(
                                "jenisPiutang",
                                "Piutang Retribusi Daerah",
                              )
                            }
                            className="h-4 w-4 border-gray-300 text-blue-600"
                          />
                          <span className="text-sm">
                            Piutang Retribusi Daerah
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="jenisPiutang"
                            value="Piutang Lain-lain PAD yang Sah"
                            checked={
                              form.jenisPiutang ===
                              "Piutang Lain-lain PAD yang Sah"
                            }
                            onChange={() =>
                              updateField(
                                "jenisPiutang",
                                "Piutang Lain-lain PAD yang Sah",
                              )
                            }
                            className="h-4 w-4 border-gray-300 text-blue-600"
                          />
                          <span className="text-sm">
                            Piutang Lain-lain PAD yang Sah
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="jenisPiutang"
                            value="Piutang Lainnya"
                            checked={form.jenisPiutang === "Piutang Lainnya"}
                            onChange={() =>
                              updateField("jenisPiutang", "Piutang Lainnya")
                            }
                            className="h-4 w-4 border-gray-300 text-blue-600"
                          />
                          <span className="text-sm">Piutang Lainnya</span>
                        </label>
                      </div>
                      {touched.jenisPiutang && errors.jenisPiutang && (
                        <p className="text-sm text-red-600">
                          {errors.jenisPiutang}
                        </p>
                      )}
                    </div>

                    {/* Jenis Penghapusan */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Jenis Penghapusan{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="jenisPenghapusan"
                            value="Penghapusan Bersyarat"
                            checked={
                              form.jenisPenghapusan === "Penghapusan Bersyarat"
                            }
                            onChange={() =>
                              updateField(
                                "jenisPenghapusan",
                                "Penghapusan Bersyarat",
                              )
                            }
                            className="h-4 w-4 border-gray-300 text-blue-600"
                          />
                          <span className="text-sm">Penghapusan Bersyarat</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="jenisPenghapusan"
                            value="Penghapusan Mutlak"
                            checked={
                              form.jenisPenghapusan === "Penghapusan Mutlak"
                            }
                            onChange={() =>
                              updateField(
                                "jenisPenghapusan",
                                "Penghapusan Mutlak",
                              )
                            }
                            className="h-4 w-4 border-gray-300 text-blue-600"
                          />
                          <span className="text-sm">Penghapusan Mutlak</span>
                        </label>
                      </div>
                      {touched.jenisPenghapusan && errors.jenisPenghapusan && (
                        <p className="text-sm text-red-600">
                          {errors.jenisPenghapusan}
                        </p>
                      )}
                    </div>
                  </div>
                </fieldset>
              ) : (
                <div className="space-y-6">
                  {current.fields?.map((field) => renderField(field))}
                </div>
              )}

              <div className="mt-8 flex justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
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
                    disabled={!allChecked}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      allChecked
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
                    className="rounded-md bg-[#1a4e8f] px-4 py-2 text-sm font-medium text-white hover:bg-[#0e3b6e]"
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
