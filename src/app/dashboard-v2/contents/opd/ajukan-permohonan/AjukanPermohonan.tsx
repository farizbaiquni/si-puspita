// contents/opd/ajukan-permohonan/AjukanPermohonan.tsx
"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Pembayaran {
  id: string;
  nilaiPembayaran: string;
  tanggalPembayaran: string;
  saldoUtang: string;
}

interface NominatifEntry {
  id: string;
  jenisPiutang: string;
  penagihan1: File | null;
  penagihan2: File | null;
  penagihan3: File | null;
  dokumenDasar: File | null;
  dokumenRekapSaldo: File | null;
  nama: string;
  alamat: string;
  tglPiutang: string;
  tglPiutangMacet: string;
  nilaiMataUang: string;
  nilaiPiutang: string;
  riwayatPembayaran: Pembayaran[];
}

interface PernyataanOPD {
  dataBenar: boolean;
  dokumenResmi: boolean;
  upayaPenagihan: boolean;
  bersediaPerbaiki: boolean;
}

interface FormData {
  namaPenanggungJawab: string;
  jabatan: string;
  nomorSurat: string;
  tanggalSurat: string;
  fileSurat: File | null;
  dokPendukungKKMiskin: File | null;
  dokPendukungPutusanPailit: File | null;
  dokPendukungSuratKeterangan: File | null;
  dokPendukungBuktiKunjungan: File | null;
  nominatifList: NominatifEntry[];
  pernyataan: PernyataanOPD;
}

/* ------------------------------------------------------------------ */
/*  Step Configuration (5 langkah)                                     */
/* ------------------------------------------------------------------ */
interface StepConfig {
  id: string;
  label: string;
  fields?: {
    name: keyof FormData;
    type: "text" | "date" | "file" | "checkbox";
    placeholder?: string;
    accept?: string;
    label: string;
    required?: boolean;
    maxSizeText?: string;
  }[];
}

const steps: StepConfig[] = [
  {
    id: "step1",
    label: "Data Penanggung Jawab",
    fields: [
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
    ],
  },
  {
    id: "step2",
    label: "Surat Pengantar",
    fields: [
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
      {
        name: "fileSurat",
        label: "Upload Surat Pengantar (PDF, maks 5 MB)",
        type: "file",
        accept: ".pdf",
        required: true,
        maxSizeText: "5 MB",
      },
    ],
  },
  {
    id: "nominatif",
    label: "Daftar Nominatif Penanggung Piutang",
  },
  {
    id: "step4",
    label: "Data Pendukung (Opsional)",
    fields: [
      {
        name: "dokPendukungKKMiskin",
        label: "Kartu Keluarga Miskin",
        type: "file",
        accept: ".pdf",
        required: false,
        maxSizeText: "10 MB",
      },
      {
        name: "dokPendukungPutusanPailit",
        label: "Putusan Pailit",
        type: "file",
        accept: ".pdf",
        required: false,
        maxSizeText: "10 MB",
      },
      {
        name: "dokPendukungSuratKeterangan",
        label:
          "Surat Keterangan dari Kelurahan/Kantor Kepala Desa/Kantor Kepala Lingkungan/Kantor Instansi yang Berwenang/Pejabat Pengelola Keuangan Daerah yang menyatakan Penanggung Utang tidak mempunyai kemampuan untuk menyelesaikan utang atau tidak diketahui tempat tinggalnya",
        type: "file",
        accept: ".pdf",
        required: false,
        maxSizeText: "10 MB",
      },
      {
        name: "dokPendukungBuktiKunjungan",
        label:
          "Bukti Kunjungan Penagihan oleh Petugas di Lingkungan Instansi Pejabat Pengelola Keuangan Daerah (surat kunjungan/berita acara)",
        type: "file",
        accept: ".pdf",
        required: false,
        maxSizeText: "10 MB",
      },
    ],
  },
  {
    id: "step5",
    label: "Pernyataan OPD",
  },
];

/* ------------------------------------------------------------------ */
/*  Form data & hook                                                   */
/* ------------------------------------------------------------------ */
const initialNominatif = (): NominatifEntry => ({
  id: Math.random().toString(36).substring(2, 9),
  jenisPiutang: "",
  penagihan1: null,
  penagihan2: null,
  penagihan3: null,
  dokumenDasar: null,
  dokumenRekapSaldo: null,
  nama: "",
  alamat: "",
  tglPiutang: "",
  tglPiutangMacet: "",
  nilaiMataUang: "",
  nilaiPiutang: "",
  riwayatPembayaran: [],
});

const initialForm: FormData = {
  namaPenanggungJawab: "",
  jabatan: "",
  nomorSurat: "",
  tanggalSurat: "",
  fileSurat: null,
  dokPendukungKKMiskin: null,
  dokPendukungPutusanPailit: null,
  dokPendukungSuratKeterangan: null,
  dokPendukungBuktiKunjungan: null,
  nominatifList: [],
  pernyataan: {
    dataBenar: false,
    dokumenResmi: false,
    upayaPenagihan: false,
    bersediaPerbaiki: false,
  },
};

function useFormWizard() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (
    name: string,
    value: string | File | null | boolean,
    required = true,
  ): string => {
    switch (name) {
      case "namaPenanggungJawab":
      case "jabatan":
      case "nomorSurat":
        return !(value as string).trim() && required ? "Wajib diisi" : "";
      case "tanggalSurat":
        return !value && required ? "Tanggal wajib diisi" : "";
      case "fileSurat": {
        if (!value && required) return "Dokumen wajib diunggah";
        if (value && value instanceof File) {
          if (value.type !== "application/pdf") return "Hanya PDF";
          if (value.size > 5 * 1024 * 1024) return "Maks 5 MB";
        }
        return "";
      }
      default: {
        if (value instanceof File) {
          if (value.type !== "application/pdf") return "Hanya PDF";
          if (value.size > 10 * 1024 * 1024) return "Maks 10 MB";
        }
        return "";
      }
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
    setForm(initialForm);
    setErrors({});
    setTouched({});
  };

  const updateNominatifList = (newList: NominatifEntry[]) =>
    setForm((prev) => ({ ...prev, nominatifList: newList }));
  const updateNominatifEntry = (index: number, entry: NominatifEntry) => {
    setForm((prev) => {
      const list = [...prev.nominatifList];
      list[index] = entry;
      return { ...prev, nominatifList: list };
    });
  };
  const removeNominatifEntry = (index: number) => {
    setForm((prev) => {
      const list = prev.nominatifList.filter((_, i) => i !== index);
      return { ...prev, nominatifList: list };
    });
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
    updateNominatifList,
    updateNominatifEntry,
    removeNominatifEntry,
    updatePernyataan,
  };
}

/* ------------------------------------------------------------------ */
/*  FileUploadCard (tetap)                                             */
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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
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
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
            >
              Lihat
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </div>
        {touched && error && <p className="text-sm text-red-600">{error}</p>}
        {modalOpen && previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
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
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${touched && error ? "border-red-400 bg-red-50" : "border-gray-300 bg-gray-50 hover:border-blue-400"}`}
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
/*  Tabel Nominatif – lebih lega, minimal border                        */
/* ------------------------------------------------------------------ */
interface NominatifTableProps {
  data: NominatifEntry[];
  onEdit: (entry: NominatifEntry) => void;
  onDelete: (index: number) => void;
}

const NominatifTable: React.FC<NominatifTableProps> = ({
  data,
  onEdit,
  onDelete,
}) => {
  if (data.length === 0)
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        Belum ada data nominatif. Silakan tambahkan melalui form di bawah.
      </p>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-base font-semibold text-gray-800">
          Daftar Penanggung Piutang
        </h3>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50/80 text-xs tracking-wider text-gray-600 uppercase">
            <th className="px-5 py-3 text-left font-medium">No</th>
            <th className="px-5 py-3 text-left font-medium">Nama</th>
            <th className="px-5 py-3 text-left font-medium">Jenis Piutang</th>
            <th className="px-5 py-3 text-left font-medium">Nilai Piutang</th>
            <th className="px-5 py-3 text-left font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((entry, idx) => (
            <tr
              key={entry.id}
              className="transition-colors hover:bg-blue-50/40"
            >
              <td className="px-5 py-3 font-medium text-gray-700">{idx + 1}</td>
              <td className="px-5 py-3 font-medium text-gray-800">
                {entry.nama || "-"}
              </td>
              <td className="px-5 py-3 text-gray-600 capitalize">
                {entry.jenisPiutang || "-"}
              </td>
              <td className="px-5 py-3 text-gray-700">
                {entry.nilaiPiutang || "-"}
              </td>
              <td className="flex items-center gap-3 px-5 py-3">
                <button
                  onClick={() => onEdit(entry)}
                  className="text-xs font-medium text-blue-600 transition hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(idx)}
                  className="text-xs font-medium text-red-500 transition hover:text-red-700"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Form Nominatif – dengan format rupiah                              */
/* ------------------------------------------------------------------ */
interface NominatifFormProps {
  initialData: NominatifEntry | null;
  onSave: (entry: NominatifEntry) => void;
  onCancel: () => void;
}

const formatRupiah = (angka: string) => {
  const numberString = angka.replace(/[^0-9]/g, "");
  if (!numberString) return "";
  const split = numberString.split("");
  const sisa = split.length % 3;
  let rupiah = split.slice(0, sisa).join("");
  const ribuan = split.slice(sisa).join("").match(/\d{3}/g);
  if (ribuan) {
    const separator = sisa ? "." : "";
    rupiah += separator + ribuan.join(".");
  }
  return rupiah;
};

const NominatifForm: React.FC<NominatifFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [jenisPiutang, setJenisPiutang] = useState(
    initialData?.jenisPiutang ?? "",
  );
  const [penagihan1, setPenagihan1] = useState<File | null>(
    initialData?.penagihan1 ?? null,
  );
  const [penagihan2, setPenagihan2] = useState<File | null>(
    initialData?.penagihan2 ?? null,
  );
  const [penagihan3, setPenagihan3] = useState<File | null>(
    initialData?.penagihan3 ?? null,
  );
  const [dokumenDasar, setDokumenDasar] = useState<File | null>(
    initialData?.dokumenDasar ?? null,
  );
  const [dokumenRekapSaldo, setDokumenRekapSaldo] = useState<File | null>(
    initialData?.dokumenRekapSaldo ?? null,
  );
  const [nama, setNama] = useState(initialData?.nama ?? "");
  const [alamat, setAlamat] = useState(initialData?.alamat ?? "");
  const [tglPiutang, setTglPiutang] = useState(initialData?.tglPiutang ?? "");
  const [tglPiutangMacet, setTglPiutangMacet] = useState(
    initialData?.tglPiutangMacet ?? "",
  );
  const [nilaiMataUang, setNilaiMataUang] = useState(
    initialData?.nilaiMataUang ?? "",
  );
  const [nilaiPiutang, setNilaiPiutang] = useState(
    initialData?.nilaiPiutang ?? "",
  );
  const [riwayat, setRiwayat] = useState<Pembayaran[]>(
    initialData?.riwayatPembayaran ?? [],
  );

  const [previewPen1, setPreviewPen1] = useState(() =>
    initialData?.penagihan1
      ? URL.createObjectURL(initialData.penagihan1)
      : null,
  );
  const [previewPen2, setPreviewPen2] = useState(() =>
    initialData?.penagihan2
      ? URL.createObjectURL(initialData.penagihan2)
      : null,
  );
  const [previewPen3, setPreviewPen3] = useState(() =>
    initialData?.penagihan3
      ? URL.createObjectURL(initialData.penagihan3)
      : null,
  );
  const [previewDasar, setPreviewDasar] = useState(() =>
    initialData?.dokumenDasar
      ? URL.createObjectURL(initialData.dokumenDasar)
      : null,
  );
  const [previewRekap, setPreviewRekap] = useState(() =>
    initialData?.dokumenRekapSaldo
      ? URL.createObjectURL(initialData.dokumenRekapSaldo)
      : null,
  );

  // Simpan referensi ke preview URL terbaru agar cleanup saat unmount
  // selalu me-revoke URL yang sedang aktif (bukan nilai awal saat mount).
  const previewsRef = useRef({
    previewPen1,
    previewPen2,
    previewPen3,
    previewDasar,
    previewRekap,
  });
  useEffect(() => {
    previewsRef.current = {
      previewPen1,
      previewPen2,
      previewPen3,
      previewDasar,
      previewRekap,
    };
  });

  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const hitungSaldo = (nilai: string, list: Pembayaran[]): Pembayaran[] => {
    const totalPiutang = parseFloat(nilai) || 0;
    let sisa = totalPiutang;
    return list.map((p) => {
      const bayar = parseFloat(p.nilaiPembayaran) || 0;
      sisa -= bayar;
      return { ...p, saldoUtang: sisa.toString() };
    });
  };

  const handleFile =
    (
      setter: (f: File | null) => void,
      setPreview: (
        url: string | null | ((prev: string | null) => string | null),
      ) => void,
    ) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setter(file);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file && file.type === "application/pdf"
          ? URL.createObjectURL(file)
          : null;
      });
    };

  const addPembayaran = () => {
    const newP: Pembayaran = {
      id: Math.random().toString(36).substring(2, 9),
      nilaiPembayaran: "",
      tanggalPembayaran: "",
      saldoUtang: "",
    };
    setRiwayat((prev) => hitungSaldo(nilaiPiutang, [...prev, newP]));
  };

  const removePembayaran = (id: string) => {
    setRiwayat((prev) =>
      hitungSaldo(
        nilaiPiutang,
        prev.filter((p) => p.id !== id),
      ),
    );
  };

  const updatePembayaran = (
    id: string,
    field: keyof Pembayaran,
    value: string,
  ) => {
    setRiwayat((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      );
      return hitungSaldo(nilaiPiutang, updated);
    });
  };

  const handleNilaiPiutangChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, "");
    setNilaiPiutang(raw);
    setRiwayat((prev) => hitungSaldo(raw, prev));
  };

  const handleSubmit = () => {
    const entry: NominatifEntry = {
      id: initialData?.id ?? Math.random().toString(36).substring(2, 9),
      jenisPiutang,
      penagihan1,
      penagihan2,
      penagihan3,
      dokumenDasar,
      dokumenRekapSaldo,
      nama,
      alamat,
      tglPiutang,
      tglPiutangMacet,
      nilaiMataUang,
      nilaiPiutang,
      riwayatPembayaran: riwayat,
    };
    onSave(entry);
  };

  const isEdit = !!initialData;

  return (
    <div className="space-y-7 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {isEdit
            ? "Edit Penanggung Piutang"
            : "Tambah Penanggung Piutang Baru"}
        </h3>
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Batal Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Jenis Piutang *
          </label>
          <select
            value={jenisPiutang}
            onChange={(e) => setJenisPiutang(e.target.value)}
            className="focus:ring-opacity-50 w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
          >
            <option value="">-- Pilih --</option>
            <option value="pajak">Pajak</option>
            <option value="retribusi">Retribusi</option>
            <option value="kerugian perbendaharaan">
              Kerugian Perbendaharaan
            </option>
          </select>
        </div>
      </div>

      <fieldset className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
        <legend className="rounded bg-gray-50/50 px-2 text-sm font-medium text-gray-700">
          Dokumen Riwayat Penagihan
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <FileUploadCard
            label="Penagihan ke-1"
            file={penagihan1}
            previewUrl={previewPen1}
            onFileChange={handleFile(setPenagihan1, setPreviewPen1)}
            onReset={() => {
              setPenagihan1(null);
              setPreviewPen1(null);
            }}
          />
          <FileUploadCard
            label="Penagihan ke-2"
            file={penagihan2}
            previewUrl={previewPen2}
            onFileChange={handleFile(setPenagihan2, setPreviewPen2)}
            onReset={() => {
              setPenagihan2(null);
              setPreviewPen2(null);
            }}
          />
          <FileUploadCard
            label="Penagihan ke-3"
            file={penagihan3}
            previewUrl={previewPen3}
            onFileChange={handleFile(setPenagihan3, setPreviewPen3)}
            onReset={() => {
              setPenagihan3(null);
              setPreviewPen3(null);
            }}
          />
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FileUploadCard
          label="Dokumen Dasar Piutang (SK/Neraca)"
          file={dokumenDasar}
          previewUrl={previewDasar}
          onFileChange={handleFile(setDokumenDasar, setPreviewDasar)}
          onReset={() => {
            setDokumenDasar(null);
            setPreviewDasar(null);
          }}
        />
        <FileUploadCard
          label="Rekapitulasi Saldo Piutang"
          file={dokumenRekapSaldo}
          previewUrl={previewRekap}
          onFileChange={handleFile(setDokumenRekapSaldo, setPreviewRekap)}
          onReset={() => {
            setDokumenRekapSaldo(null);
            setPreviewRekap(null);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Nama *
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama penanggung piutang"
            className="w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Alamat *
          </label>
          <input
            type="text"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Alamat lengkap"
            className="w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Tanggal Terjadinya Piutang *
          </label>
          <input
            type="date"
            value={tglPiutang}
            onChange={(e) => setTglPiutang(e.target.value)}
            className="w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Tanggal Piutang Macet *
          </label>
          <input
            type="date"
            value={tglPiutangMacet}
            onChange={(e) => setTglPiutangMacet(e.target.value)}
            className="w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Nilai Mata Uang Piutang Macet *
          </label>
          <input
            type="text"
            value={nilaiMataUang}
            onChange={(e) => setNilaiMataUang(e.target.value)}
            placeholder="Contoh: IDR"
            className="w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Nilai Piutang (Rp) *
          </label>
          <input
            type="text"
            value={nilaiPiutang ? formatRupiah(nilaiPiutang) : ""}
            onChange={(e) => handleNilaiPiutangChange(e.target.value)}
            placeholder="5000000"
            className="w-full rounded-lg border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-400 focus:ring focus:ring-blue-200"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Riwayat Pembayaran
          </label>
          <button
            type="button"
            onClick={addPembayaran}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
          >
            + Tambah Pembayaran
          </button>
        </div>
        {riwayat.length === 0 && (
          <p className="py-3 text-sm text-gray-400">
            Belum ada data pembayaran.
          </p>
        )}
        <div className="space-y-3">
          {riwayat.map((p, idx) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
            >
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Nilai Pembayaran *
                  </label>
                  <input
                    type="text"
                    value={p.nilaiPembayaran}
                    onChange={(e) =>
                      updatePembayaran(p.id, "nilaiPembayaran", e.target.value)
                    }
                    className="w-full rounded-md border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Tanggal Pembayaran *
                  </label>
                  <input
                    type="date"
                    value={p.tanggalPembayaran}
                    onChange={(e) =>
                      updatePembayaran(
                        p.id,
                        "tanggalPembayaran",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-md border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Saldo Utang (otomatis)
                  </label>
                  <input
                    type="text"
                    value={p.saldoUtang}
                    readOnly
                    className="w-full rounded-md border-gray-200 bg-gray-100 px-2 py-1.5 text-sm text-gray-700"
                  />
                </div>
              </div>
              <button
                onClick={() => removePembayaran(p.id)}
                className="mt-1 self-end text-xs text-red-500 hover:text-red-700 sm:mt-0 sm:self-center"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800"
        >
          {isEdit ? "Perbarui Data" : "Tambah ke Daftar"}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Komponen Utama                                                    */
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
    updateNominatifList,
    updateNominatifEntry,
    removeNominatifEntry,
    updatePernyataan,
  } = useFormWizard();

  const [currentStep, setCurrentStep] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewSurat, setPreviewSurat] = useState<string | null>(null);
  const [previewPendukung, setPreviewPendukung] = useState<
    Record<string, string | null>
  >({
    dokPendukungKKMiskin: null,
    dokPendukungPutusanPailit: null,
    dokPendukungSuratKeterangan: null,
    dokPendukungBuktiKunjungan: null,
  });
  const [editingEntry, setEditingEntry] = useState<NominatifEntry | null>(null);
  const [nominatifKey, setNominatifKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSteps = steps.length;
  const current = steps[currentStep];

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [currentStep]);

  const handleFileSurat = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    updateField("fileSurat", file);
    setPreviewSurat((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file && file.type === "application/pdf"
        ? URL.createObjectURL(file)
        : null;
    });
  };

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

  const validateNominatifList = (): boolean => {
    const newErrors: Record<string, string> = {};
    let valid = true;
    form.nominatifList.forEach((entry, i) => {
      const pre = (f: string) => `${i}_${f}`;
      if (!entry.jenisPiutang) {
        newErrors[pre("jenisPiutang")] = "Pilih jenis piutang";
        valid = false;
      } else if (entry.jenisPiutang === "pajak") {
        newErrors[pre("jenisPiutang")] = "Pajak tidak dapat diajukan";
        valid = false;
      }

      const validateFile = (file: File | null, fieldName: string) => {
        if (!file) {
          newErrors[pre(fieldName)] = "Wajib diunggah";
          valid = false;
        } else if (file.type !== "application/pdf") {
          newErrors[pre(fieldName)] = "Hanya PDF";
          valid = false;
        } else if (file.size > 10 * 1024 * 1024) {
          newErrors[pre(fieldName)] = "Maks 10 MB";
          valid = false;
        }
      };

      validateFile(entry.penagihan1, "penagihan1");
      validateFile(entry.penagihan2, "penagihan2");
      validateFile(entry.penagihan3, "penagihan3");
      if (!entry.dokumenDasar) {
        newErrors[pre("dokumenDasar")] = "Wajib diunggah";
        valid = false;
      } else if (entry.dokumenDasar.size > 10 * 1024 * 1024) {
        newErrors[pre("dokumenDasar")] = "Maks 10 MB";
        valid = false;
      }
      validateFile(entry.dokumenRekapSaldo, "dokumenRekapSaldo");

      if (!entry.nama.trim()) {
        newErrors[pre("nama")] = "Wajib diisi";
        valid = false;
      }
      if (!entry.alamat.trim()) {
        newErrors[pre("alamat")] = "Wajib diisi";
        valid = false;
      }
      if (!entry.tglPiutang) {
        newErrors[pre("tglPiutang")] = "Wajib diisi";
        valid = false;
      }
      if (!entry.tglPiutangMacet) {
        newErrors[pre("tglPiutangMacet")] = "Wajib diisi";
        valid = false;
      }
      if (!entry.nilaiMataUang.trim()) {
        newErrors[pre("nilaiMataUang")] = "Wajib diisi";
        valid = false;
      }
      if (!entry.nilaiPiutang.trim()) {
        newErrors[pre("nilaiPiutang")] = "Wajib diisi";
        valid = false;
      } else if (isNaN(Number(entry.nilaiPiutang))) {
        newErrors[pre("nilaiPiutang")] = "Harus berupa angka";
        valid = false;
      }

      entry.riwayatPembayaran.forEach((p, idx) => {
        if (!p.nilaiPembayaran.trim()) {
          newErrors[pre(`pembayaran_${idx}_nilai`)] = "Wajib diisi";
          valid = false;
        } else if (isNaN(Number(p.nilaiPembayaran))) {
          newErrors[pre(`pembayaran_${idx}_nilai`)] = "Harus angka";
          valid = false;
        }
        if (!p.tanggalPembayaran) {
          newErrors[pre(`pembayaran_${idx}_tanggal`)] = "Wajib diisi";
          valid = false;
        }
      });
    });
    setErrors((prev) => ({ ...prev, ...newErrors }));

    form.nominatifList.forEach((entry, i) => {
      const fields: (keyof NominatifEntry)[] = [
        "jenisPiutang",
        "penagihan1",
        "penagihan2",
        "penagihan3",
        "dokumenDasar",
        "dokumenRekapSaldo",
        "nama",
        "alamat",
        "tglPiutang",
        "tglPiutangMacet",
        "nilaiMataUang",
        "nilaiPiutang",
      ];
      fields.forEach((f) => markTouched(`${i}_${f}`));
      entry.riwayatPembayaran.forEach((_, idx) => {
        markTouched(`${i}_pembayaran_${idx}_nilai`);
        markTouched(`${i}_pembayaran_${idx}_tanggal`);
      });
    });
    return valid;
  };

  const validateCurrentStep = (): boolean => {
    if (current.id === "nominatif") {
      if (form.nominatifList.length === 0) {
        setErrors((prev) => ({
          ...prev,
          nominatifEmpty: "Tambahkan minimal 1 penanggung piutang",
        }));
        return false;
      }
      return validateNominatifList();
    }

    if (current.id === "step5") {
      const { pernyataan } = form;
      const allChecked =
        pernyataan.dataBenar &&
        pernyataan.dokumenResmi &&
        pernyataan.upayaPenagihan &&
        pernyataan.bersediaPerbaiki;
      if (!allChecked) {
        setErrors((prev) => ({
          ...prev,
          pernyataan: "Centang semua pernyataan sebelum melanjutkan",
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

  const handleSaveNominatif = (entry: NominatifEntry) => {
    if (editingEntry) {
      const index = form.nominatifList.findIndex(
        (e) => e.id === editingEntry.id,
      );
      if (index !== -1) updateNominatifEntry(index, entry);
    } else {
      updateNominatifList([...form.nominatifList, entry]);
    }
    setEditingEntry(null);
    setNominatifKey((prev) => prev + 1);
  };

  const renderNonNominatif = () => {
    if (!current.fields) return null;

    return (
      <div className="space-y-6">
        {current.fields.map((field) => {
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
              onFileChange = handleFileSurat;
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

          return (
            <div key={field.name} className="space-y-1.5">
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700"
              >
                {field.label}{" "}
                {isRequired && <span className="text-red-500">*</span>}
              </label>
              <input
                id={field.name}
                type={field.type}
                name={field.name}
                value={(value as string) || ""}
                onChange={(e) => updateField(field.name, e.target.value)}
                onBlur={() => markTouched(field.name)}
                placeholder={field.placeholder}
                ref={
                  field.name === "namaPenanggungJawab" ? inputRef : undefined
                }
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition outline-none ${
                  isTouched && error
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 focus:ring-1 focus:ring-[#1a4e8f]/30"
                }`}
              />
              {isTouched && error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="space-y-8">
      <NominatifTable
        data={form.nominatifList}
        onEdit={(entry) => setEditingEntry(entry)}
        onDelete={(index) => removeNominatifEntry(index)}
      />

      <NominatifForm
        key={nominatifKey}
        initialData={editingEntry}
        onSave={handleSaveNominatif}
        onCancel={() => {
          setEditingEntry(null);
          setNominatifKey((prev) => prev + 1);
        }}
      />

      {errors.nominatifEmpty && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {errors.nominatifEmpty}
        </p>
      )}
    </div>
  );

  if (submitted) {
    return (
      <div className="w-full py-10">
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
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
            className="rounded-lg bg-[#1a4e8f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0e3b6e]"
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
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-5 shadow-lg">
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
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1 rounded-lg bg-[#1a4e8f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0e3b6e]"
              >
                {isSubmitting ? "Mengirim..." : "Ya, Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
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
                renderStep6()
              ) : current.id === "step5" ? (
                <div className="space-y-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Kami menyatakan bahwa:
                  </p>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={form.pernyataan.dataBenar}
                      onChange={(e) =>
                        updatePernyataan("dataBenar", e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Seluruh data yang diinput adalah benar.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={form.pernyataan.dokumenResmi}
                      onChange={(e) =>
                        updatePernyataan("dokumenResmi", e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Seluruh dokumen merupakan dokumen resmi.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={form.pernyataan.upayaPenagihan}
                      onChange={(e) =>
                        updatePernyataan("upayaPenagihan", e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Seluruh upaya penagihan telah dilakukan secara optimal.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={form.pernyataan.bersediaPerbaiki}
                      onChange={(e) =>
                        updatePernyataan("bersediaPerbaiki", e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Bersedia memperbaiki apabila terdapat kekurangan.
                    </span>
                  </label>
                  {errors.pernyataan && (
                    <p className="text-sm text-red-600">{errors.pernyataan}</p>
                  )}
                </div>
              ) : (
                renderNonNominatif()
              )}

              <div className="mt-8 flex justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
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
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
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
                    className="rounded-lg bg-[#1a4e8f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0e3b6e]"
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
