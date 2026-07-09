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
  // Langkah 2 – Upload Dokumen
  suratPengantarUsulan: File | null;
  daftarNominatifPiutang: File | null;
  rekapitulasiSaldoPiutang: File | null;
  // Riwayat Penagihan
  riwayatPenagihan1: File | null;
  riwayatPenagihan2: File | null;
  riwayatPenagihan3: File | null;
  filePernyataanOPD: File | null;
  opsiRiwayatPenagihan: string;
  // Dokumen Dasar Piutang
  dokumenDasarPiutang: File | null;
  opsiDokumenDasarPiutang: string;
  // Dokumen pendukung lainnya
  dokumenPendukungLainnya: File | null;
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
    id: "step1",
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
    id: "nominatif",
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
        label: "Daftar Nominatif Piutang",
        type: "file",
        accept: ".pdf",
        required: true,
        maxSizeText: "10 MB",
      },
      {
        name: "rekapitulasiSaldoPiutang",
        label: "Rekapitulasi saldo piutang",
        type: "file",
        accept: ".pdf",
        required: true,
        maxSizeText: "10 MB",
      },
      {
        name: "dokumenPendukungLainnya",
        label: "Dokumen Pendukung Lainnya (opsional)",
        type: "file",
        accept: ".pdf",
        required: false,
        maxSizeText: "10 MB",
      },
    ],
  },
  {
    id: "step3",
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
  suratPengantarUsulan: null,
  daftarNominatifPiutang: null,
  rekapitulasiSaldoPiutang: null,
  riwayatPenagihan1: null,
  riwayatPenagihan2: null,
  riwayatPenagihan3: null,
  filePernyataanOPD: null,
  opsiRiwayatPenagihan: "",
  dokumenDasarPiutang: null,
  opsiDokumenDasarPiutang: "",
  dokumenPendukungLainnya: null,
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

  if (file) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-500"> *</span> : ""}
        </label>
        <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-red-50">
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
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-md bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="truncate text-sm font-medium text-gray-700">
                  {file.name}
                </span>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-xl leading-none text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <embed
                  src={previewUrl}
                  type="application/pdf"
                  className="w-full"
                  style={{ height: "calc(90vh - 57px)" }}
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
        className={`rounded-md border-2 border-dashed p-4 text-center transition-colors ${touched && error ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 hover:border-blue-400"}`}
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
          <label className="relative cursor-pointer rounded font-medium text-blue-700 hover:text-blue-800">
            <span>Pilih file</span>
            <input
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
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSteps = steps.length;
  const current = steps[currentStep];

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentStep]);

  const handleFilePendukung =
    (fieldName: keyof FormData) => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      updateField(fieldName, file);
      setPreviewPendukung((prev) => {
        const next = { ...prev };
        if (next[fieldName]) URL.revokeObjectURL(next[fieldName]!);
        next[fieldName] =
          file && file.type === "application/pdf"
            ? URL.createObjectURL(file)
            : null;
        return next;
      });
    };

  const resetFile = (fieldName: keyof FormData) => {
    updateField(fieldName, null);
    if (fieldName === "fileSurat") setPreviewSurat(null);
    else {
      setPreviewPendukung((prev) => {
        const next = { ...prev };
        if (next[fieldName]) {
          URL.revokeObjectURL(next[fieldName]!);
          next[fieldName] = null;
        }
        return next;
      });
    }
  };

  // Validasi step khusus untuk nominatif
  const validateNominatifStep = (): boolean => {
    let valid = true;

    // 1. Validasi field biasa
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

    // 2. Opsi riwayat penagihan
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

    // 3. Opsi dokumen dasar piutang
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
    if (current.id === "nominatif") {
      return validateNominatifStep();
    }
    if (current.id === "step3") {
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
          setPreviewSurat((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return file && file.type === "application/pdf"
              ? URL.createObjectURL(file)
              : null;
          });
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
          ref={field.name === "namaPenanggungJawab" ? inputRef : undefined}
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

  const renderNominatifStep = () => (
    <div className="space-y-6">
      {current.fields?.map((field) => renderField(field))}

      {/* Dokumen Dasar Piutang */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">
          Dokumen Dasar Piutang
        </legend>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apakah terdapat dokumen yang menjadi dasar timbulnya piutang?
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
              <span className="text-sm">Ada dokumen dasar</span>
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
              <span className="text-sm">Tidak ada dokumen dasar</span>
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
                label="Dokumen Dasar Piutang (SKRD, Perjanjian, dll)"
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

      {/* Riwayat Penagihan */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">
          Riwayat Penagihan
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
                onChange={() => updateField("opsiRiwayatPenagihan", "riwayat")}
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
    </div>
  );

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
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
          <div className="px-6 py-6">
            <form onSubmit={(e) => e.preventDefault()} noValidate>
              {current.id === "nominatif" ? (
                <fieldset className="rounded-md border border-gray-300 p-4">
                  <legend className="px-2 text-xl font-bold text-gray-800">
                    Checklist Persyaratan Administrasi
                  </legend>
                  {renderNominatifStep()}
                </fieldset>
              ) : current.id === "step3" ? (
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
                    <p className="text-sm text-red-600">{errors.pernyataan}</p>
                  )}
                </div>
              ) : current.id === "step1" ? (
                <fieldset className="rounded-md border border-gray-300 p-4">
                  <legend className="px-2 text-xl font-bold text-gray-800">
                    Identitas Usulan
                  </legend>
                  <div className="space-y-4">
                    {current.fields?.map((field) => renderField(field))}
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
