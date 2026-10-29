/* ------------------------------------------------------------------ */
/*  buildBeritaAcara.ts                                                */
/*  Helper membangun data Berita Acara Penelaahan Internal dari data   */
/*  pengajuan (Firestore).                                             */
/*                                                                     */
/*  Dipakai oleh menu Reviu Inspektorat: saat admin membuka form BA    */
/*  untuk satu pengajuan, field dari database terisi otomatis.         */
/*  BA yang sudah pernah disimpan dibaca dari koleksi terpisah         */
/*  `beritaAcara/{pengajuanId}` (bukan dari dokumen pengajuan).        */
/* ------------------------------------------------------------------ */

import type {
  FormulirPenghapusanPiutangOPDRecord,
  UploadedFileRef,
} from "@/types/types";
import { labelJenisPiutang } from "../../telaah/TelaahDokumenShared";
import { DAFTAR_ASPEK_PENELAAHAN } from "./constants";
import { unformatAngka } from "./formatInput";
import { emptyBeritaAcaraData } from "./types";
import type {
  AspekPenelaahan,
  BeritaAcaraData,
  BeritaAcaraRecord,
} from "./types";

/* ==================== Default penelaah ==================== */

/**
 * Nama & NIP penelaah default (pejabat BPKAD saat ini).
 * Nilai awal saja — admin tetap bisa mengubahnya di form BA.
 */
export const PENELAAH_DEFAULT: BeritaAcaraData["penelaah"] = {
  kasubbid: { nama: "Nurchasannah, SE, M.Acc.", nip: "198007152005022015" },
  kabid: { nama: "Yuswad, SE., MM.", nip: "196811281990031006" },
  sekban: { nama: "", nip: "" },
};

/* ==================== Aspek penelaahan (10 baris) ==================== */

/** 10 aspek default — label dari constants, hasil/keterangan kosong. */
export function buildDefaultAspek(): AspekPenelaahan[] {
  return DAFTAR_ASPEK_PENELAAHAN.map((label, i) => ({
    nomor: i + 1,
    label,
    hasil: "",
    keterangan: "",
  }));
}

/**
 * Pastikan array aspek selalu berisi 10 baris sesuai DAFTAR_ASPEK_PENELAAHAN.
 * Hasil/keterangan yang sudah ada dipertahankan (dicocokkan per nomor);
 * label selalu diambil dari constants supaya ikut berubah kalau teksnya
 * diperbarui di kode.
 */
export function rapikanAspek(
  aspek?: AspekPenelaahan[] | null,
): AspekPenelaahan[] {
  return DAFTAR_ASPEK_PENELAAHAN.map((label, i) => {
    const nomor = i + 1;
    const lama = aspek?.find((a) => a.nomor === nomor);
    return {
      nomor,
      label,
      hasil: lama?.hasil ?? "",
      keterangan: lama?.keterangan ?? "",
    };
  });
}

/* ==================== Helper internal ==================== */

/** Tanggal hari ini format "YYYY-MM-DD" (waktu lokal, bukan UTC). */
function hariIniLokal(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Ambil file terunggah dari field record pengajuan (kalau ada). */
export function ambilFileRef(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
  key: keyof FormulirPenghapusanPiutangOPDRecord,
): UploadedFileRef | null {
  const value = pengajuan[key];
  return value && typeof value === "object" && "url" in value
    ? (value as UploadedFileRef)
    : null;
}

/**
 * Data BA default dari dokumen pengajuan — semua yang bisa diambil
 * dari database:
 *  - Perangkat Daerah       ← namaOPD
 *  - Nomor Registrasi       ← nomorRegistrasi
 *  - Tanggal Registrasi     ← tanggalVerifikasi (waktu registrasi BPKAD)
 *  - Jenis Piutang          ← jenisPiutang (dipetakan ke versi pendek)
 *  - Nama/Jumlah Debitur    ← jumlahDebitur
 *  - Nilai Piutang          ← totalNilaiPiutang (angka polos)
 *
 * Tahun Perolehan & Nilai Piutang (kesimpulan D) BELUM ada di DB —
 * diisi manual oleh admin di form BA.
 */
function dariPengajuan(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
): BeritaAcaraData {
  return {
    ...emptyBeritaAcaraData(),
    perangkatDaerah: pengajuan.namaOPD ?? "",
    nomorRegistrasi: pengajuan.nomorRegistrasi ?? "",
    tanggalRegistrasi: (
      pengajuan.tanggalVerifikasi ||
      pengajuan.createdAt ||
      ""
    ).slice(0, 10),
    jenisPiutang: pengajuan.jenisPiutang
      ? labelJenisPiutang(pengajuan.jenisPiutang)
      : "",
    namaJumlahDebitur: pengajuan.jumlahDebitur
      ? `${pengajuan.jumlahDebitur} debitur`
      : "",
    nilaiPiutang: unformatAngka(pengajuan.totalNilaiPiutang ?? ""),
    tahunPerolehan: "",
    aspekPenelaahan: buildDefaultAspek(),
    nilaiPiutangKesimpulan: "",
    tanggalBA: hariIniLokal(),
    penelaah: {
      kasubbid: { ...PENELAAH_DEFAULT.kasubbid },
      kabid: { ...PENELAAH_DEFAULT.kabid },
      sekban: { ...PENELAAH_DEFAULT.sekban },
    },
  };
}

/* ==================== Fungsi utama ==================== */

/**
 * Ambil murni field BA dari dokumen koleksi `beritaAcara`
 * (buang `id` & `pengajuanId` supaya tidak ikut masuk state form BA).
 */
export function ambilDataBA(record: BeritaAcaraRecord): BeritaAcaraData {
  return {
    nomorBA: record.nomorBA,
    perangkatDaerah: record.perangkatDaerah,
    nomorRegistrasi: record.nomorRegistrasi,
    tanggalRegistrasi: record.tanggalRegistrasi,
    jenisPiutang: record.jenisPiutang,
    namaJumlahDebitur: record.namaJumlahDebitur,
    nilaiPiutang: record.nilaiPiutang,
    tahunPerolehan: record.tahunPerolehan,
    aspekPenelaahan: record.aspekPenelaahan,
    nilaiPiutangKesimpulan: record.nilaiPiutangKesimpulan,
    tanggalBA: record.tanggalBA,
    penelaah: record.penelaah,
    dibuatPada: record.dibuatPada,
    diperbaruiPada: record.diperbaruiPada,
    dibuatOleh: record.dibuatOleh,
  };
}

/**
 * Data awal form BA untuk satu pengajuan:
 *  - Kalau BA sudah pernah disimpan (`beritaAcara/{pengajuanId}`)
 *    → pakai data tersimpan itu, dengan field identitas disinkronkan ulang
 *    dari data pengajuan terbaru.
 *  - Kalau belum pernah → susun otomatis dari data pengajuan + default.
 */
export function bangunBeritaAcara(
  pengajuan: FormulirPenghapusanPiutangOPDRecord,
  tersimpan?: BeritaAcaraRecord | null,
): BeritaAcaraData {
  const dasar = dariPengajuan(pengajuan);
  if (!tersimpan) return dasar;

  const ba = ambilDataBA(tersimpan);

  return {
    ...dasar,
    ...ba,
    // Field identitas (dikunci di form) selalu mengikuti data terbaru dari DB.
    nomorRegistrasi: dasar.nomorRegistrasi,
    tanggalRegistrasi: dasar.tanggalRegistrasi || ba.tanggalRegistrasi,
    jenisPiutang: dasar.jenisPiutang || ba.jenisPiutang,
    namaJumlahDebitur: dasar.namaJumlahDebitur || ba.namaJumlahDebitur,
    nilaiPiutang: dasar.nilaiPiutang || ba.nilaiPiutang,
    // Perangkat Daerah boleh diedit admin — pakai yang tersimpan,
    // fallback ke nama OPD dari DB.
    perangkatDaerah: ba.perangkatDaerah || dasar.perangkatDaerah,
    // Aspek: hasil/keterangan lama dipertahankan, jumlah & label disamakan
    // dengan constants (antisipasi data lama yang belum lengkap/berubah).
    aspekPenelaahan: rapikanAspek(ba.aspekPenelaahan),
    penelaah: ba.penelaah ?? dasar.penelaah,
  };
}
