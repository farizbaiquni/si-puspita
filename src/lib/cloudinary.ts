import type { UploadedFileRef } from "@/types/types";

const CLOUD_NAME = "ncoljm8y";
const UPLOAD_PRESET = "si_puspita_unsigned";

/**
 * Upload satu File ke Cloudinary lewat unsigned upload preset (tidak
 * butuh backend/API route — aman dipanggil langsung dari browser karena
 * preset unsigned hanya mengizinkan upload, bukan delete/manage).
 *
 * resource_type "auto" dipakai supaya PDF, gambar, dan dokumen lain
 * sama-sama diterima (Cloudinary otomatis mendeteksi jenis file).
 *
 * pengajuanId & fieldName dipakai sebagai bagian dari `public_id` supaya
 * nama file di Cloudinary tetap terlacak asalnya dari pengajuan mana.
 */
export async function uploadDokumenKeCloudinary(
  file: File,
  pengajuanId: string,
  fieldName: string,
): Promise<UploadedFileRef> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary belum dikonfigurasi — cek NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME dan NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET di .env.local",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("public_id", `${pengajuanId}/${fieldName}`);
  formData.append("folder", "si-puspita");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Upload Cloudinary gagal (${fieldName}): ${detail}`);
  }

  const data = await res.json();

  return {
    id: `FILE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: data.secure_url,
    namaFile: file.name,
    ukuranBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/** Upload kalau file ada, kembalikan null kalau field-nya kosong. */
export async function uploadDokumenOrNull(
  file: File | null,
  pengajuanId: string,
  fieldName: string,
): Promise<UploadedFileRef | null> {
  return file ? uploadDokumenKeCloudinary(file, pengajuanId, fieldName) : null;
}
