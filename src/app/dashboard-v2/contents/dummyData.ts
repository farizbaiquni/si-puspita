// src/app/dashboard-v2/contents/opd/dummyData.ts
import {
  FormulirPenghapusanPiutangOPDRecord,
  UploadedFileRef,
} from "@/types/types-v2";

// ──────────────────────────────── DUMMY PDF ────────────────────────────────
function generateDummyPdfDataUri(): string {
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(Dummy PDF - Preview) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000360 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
430
%%EOF`;
  return "data:application/pdf;base64," + btoa(pdf);
}

// File dummy dengan nama berbeda
const fileSuratPengantar: UploadedFileRef = {
  id: "file-surat-pengantar",
  url: generateDummyPdfDataUri(),
  namaFile: "surat-pengantar.pdf",
  ukuranBytes: 152400,
  uploadedAt: "2025-01-07T08:00:00Z",
};

const fileNominatif: UploadedFileRef = {
  id: "file-nominatif",
  url: generateDummyPdfDataUri(),
  namaFile: "daftar-nominatif-piutang.pdf",
  ukuranBytes: 204800,
  uploadedAt: "2025-01-07T08:05:00Z",
};

const fileDasarPiutang: UploadedFileRef = {
  id: "file-dasar-piutang",
  url: generateDummyPdfDataUri(),
  namaFile: "skrd-perjanjian.pdf",
  ukuranBytes: 98304,
  uploadedAt: "2025-01-07T08:10:00Z",
};

const fileRekapSaldo: UploadedFileRef = {
  id: "file-rekap-saldo",
  url: generateDummyPdfDataUri(),
  namaFile: "rekapitulasi-saldo-piutang.pdf",
  ukuranBytes: 77824,
  uploadedAt: "2025-01-07T08:15:00Z",
};

const fileTagihan1: UploadedFileRef = {
  id: "file-tagihan-1",
  url: generateDummyPdfDataUri(),
  namaFile: "penagihan-pertama.pdf",
  ukuranBytes: 66560,
  uploadedAt: "2025-01-07T08:20:00Z",
};

const fileTagihan2: UploadedFileRef = {
  id: "file-tagihan-2",
  url: generateDummyPdfDataUri(),
  namaFile: "penagihan-kedua.pdf",
  ukuranBytes: 71680,
  uploadedAt: "2025-01-07T08:25:00Z",
};

const fileTagihan3: UploadedFileRef = {
  id: "file-tagihan-3",
  url: generateDummyPdfDataUri(),
  namaFile: "penagihan-ketiga.pdf",
  ukuranBytes: 72704,
  uploadedAt: "2025-01-07T08:30:00Z",
};

const fileNeraca: UploadedFileRef = {
  id: "file-neraca",
  url: generateDummyPdfDataUri(),
  namaFile: "neraca-awal-piutang.pdf",
  ukuranBytes: 81920,
  uploadedAt: "2025-01-07T08:35:00Z",
};

const fileAngsuran: UploadedFileRef = {
  id: "file-angsuran",
  url: generateDummyPdfDataUri(),
  namaFile: "rekapitulasi-angsuran.pdf",
  ukuranBytes: 93184,
  uploadedAt: "2025-01-07T08:40:00Z",
};

const fileSuratTidakMampu: UploadedFileRef = {
  id: "file-surat-tidak-mampu",
  url: generateDummyPdfDataUri(),
  namaFile: "surat-tidak-mampu-bayar.pdf",
  ukuranBytes: 56320,
  uploadedAt: "2025-01-07T08:45:00Z",
};

const filePernyataanOPD: UploadedFileRef = {
  id: "file-pernyataan-opd",
  url: generateDummyPdfDataUri(),
  namaFile: "pernyataan-opd.pdf",
  ukuranBytes: 60416,
  uploadedAt: "2025-01-07T08:50:00Z",
};

// ────────────────────────── NOMOR REGISTRASI ───────────────────────────────
// Format: reg-{no urut antrian}/{kode instansi}/{singkatan instansi}/{bulan romawi}/{tahun}
// Kode & singkatan instansi mengikuti daftar resmi BPKAD.
const BULAN_ROMAWI = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

const KODE_INSTANSI: Record<string, { kode: number; singkatan: string }> = {
  RSUD: { kode: 22, singkatan: "RSUD" },
  "Dinas Perhubungan": { kode: 24, singkatan: "DISHUB" },
  "Dinas Komunikasi dan Informatika": { kode: 46, singkatan: "DISKOMINFO" },
  "Dinas Perdagangan Koperasi dan UKM": { kode: 51, singkatan: "DAGKOP" },
  "Sekretariat Dewan": { kode: 59, singkatan: "SETWAN" },
  "Disdagkop UKM": { kode: 63, singkatan: "DISDAGKOPUKM" },
};

function buildNomorRegistrasi(
  noUrut: number,
  namaOPD: string,
  tanggalVerifikasi: string,
): string {
  const instansi = KODE_INSTANSI[namaOPD];
  const bulanIndex = new Date(tanggalVerifikasi).getMonth(); // 0-based
  const tahun = new Date(tanggalVerifikasi).getFullYear();
  return `reg-${noUrut}/${instansi.kode}/${instansi.singkatan}/${BULAN_ROMAWI[bulanIndex]}/${tahun}`;
}

// ─────────────────────────────── DATA MOCK ──────────────────────────────────
export const MOCK_DATA: FormulirPenghapusanPiutangOPDRecord[] = [
  // 1. Semua riwayat penagihan lengkap (3 file)
  {
    id: "FP-2025-001",
    opdId: "OPD-RSUD",
    namaOPD: "RSUD",
    createdBy: "user-rsud",
    status: "teregistrasi",
    createdAt: "2025-01-08T09:23:00Z",
    updatedAt: "2025-01-10T11:00:00Z",
    nomorRegistrasi: buildNomorRegistrasi(1, "RSUD", "2025-01-10T11:00:00Z"),
    // Jejak audit verifikasi BPKAD — seluruh poin checklist terpenuhi,
    // sehingga pengajuan dinyatakan lolos.
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: true,
      usia_pencatatan: true,
      tidak_ke_pupn: true,
      nilai_sesuai: true,
      angsuran_minim: true,
      tidak_mampu_bayar: true,
      surat_tagihan: true,
      upaya_optimal: true,
      hasil_gagal: true,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-01-10T11:00:00Z",
    catatanVerifikasi:
      "Seluruh dokumen dan riwayat penagihan lengkap. Pengajuan dinyatakan lolos verifikasi.",
    namaPenanggungJawab: "Dr. Andi Pratama",
    jabatan: "Direktur RSUD",
    nomorSurat: "001/RSUD/I/2025",
    tanggalSurat: "2025-01-07",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "2",
    totalNilaiPiutang: "18500000",
    jenisPiutang: "Piutang Retribusi Daerah",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu, // opsional
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: fileTagihan3,
    filePernyataanOPD: null, // harus null karena pakai riwayat tagihan
    opsiDokumenDasarPiutang: "ada",
    dokumenDasarPiutang: fileDasarPiutang,
  },
  // 2. Hanya 1 riwayat penagihan (tagihan ke-1)
  {
    id: "FP-2025-002",
    opdId: "OPD-DISHUB",
    namaOPD: "Dinas Perhubungan",
    createdBy: "user-dishub",
    status: "revisi",
    createdAt: "2025-02-15T11:05:00Z",
    updatedAt: "2025-02-16T09:00:00Z",
    nomorRegistrasi: null,
    // Jejak audit verifikasi BPKAD — poin yang false sengaja dicocokkan
    // dengan dokumen yang memang null di bawah (daftar nominatif, neraca
    // awal, rekap angsuran belum dilampirkan; riwayat penagihan baru
    // 1 dari 3 kali).
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: true,
      usia_pencatatan: false,
      tidak_ke_pupn: true,
      nilai_sesuai: false,
      angsuran_minim: false,
      tidak_mampu_bayar: true,
      surat_tagihan: true,
      upaya_optimal: true,
      hasil_gagal: true,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-02-16T09:00:00Z",
    catatanVerifikasi:
      "Daftar Nominatif Usulan Piutang SKPD, Neraca Awal Pencatatan Piutang, dan Rekapitulasi Angsuran belum dilampirkan. Mohon lengkapi dokumen tersebut sebelum mengajukan kembali.",
    namaPenanggungJawab: "Ir. Bambang Hermawan",
    jabatan: "Kepala Dinas Perhubungan",
    nomorSurat: "020/DISHUB/II/2025",
    tanggalSurat: "2025-02-12",
    fileSurat: null,
    jumlahDebitur: "1",
    totalNilaiPiutang: "4200000",
    jenisPiutang: "Piutang Lainnya",
    jenisPenghapusan: "Penghapusan Mutlak",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: null,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: null,
    dokumenPendukungSuratTidakMampuBayar: null,
    rekapitulasiAngsuran: null,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "tidak_ada",
    dokumenDasarPiutang: null,
  },
  // 3. Dua riwayat penagihan (1 dan 2)
  {
    id: "FP-2025-003",
    opdId: "OPD-DISKOMINFO",
    namaOPD: "Dinas Komunikasi dan Informatika",
    createdBy: "user-diskominfo",
    status: "diajukan",
    createdAt: "2025-03-03T08:44:00Z",
    updatedAt: "2025-03-04T10:00:00Z",
    nomorRegistrasi: null,
    namaPenanggungJawab: "Rina Anggraini, S.Kom, M.M.",
    jabatan: "Kepala Dinas Komunikasi dan Informatika",
    nomorSurat: "035/DISKOMINFO/III/2025",
    tanggalSurat: "2025-03-01",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "3",
    totalNilaiPiutang: "27500000",
    jenisPiutang: "Piutang Lain-lain PAD yang Sah",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: null,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "tidak_ada",
    dokumenDasarPiutang: null,
  },
  // 4. Tidak ada riwayat penagihan, menggunakan Surat Pernyataan OPD
  {
    id: "FP-2025-004",
    opdId: "OPD-DAGKOPUKM",
    namaOPD: "Dinas Perdagangan Koperasi dan UKM",
    createdBy: "user-dagkopukm",
    status: "teregistrasi",
    createdAt: "2025-04-20T15:45:00Z",
    updatedAt: "2025-04-22T09:30:00Z",
    nomorRegistrasi: buildNomorRegistrasi(
      2,
      "Dinas Perdagangan Koperasi dan UKM",
      "2025-04-22T09:30:00Z",
    ),
    // Jejak audit verifikasi BPKAD — seluruh poin checklist terpenuhi
    // (Surat Pernyataan OPD dipakai sebagai pengganti riwayat penagihan).
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: true,
      usia_pencatatan: true,
      tidak_ke_pupn: true,
      nilai_sesuai: true,
      angsuran_minim: true,
      tidak_mampu_bayar: true,
      surat_tagihan: true,
      upaya_optimal: true,
      hasil_gagal: true,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-04-22T09:30:00Z",
    catatanVerifikasi:
      "Dokumen lengkap dan Surat Pernyataan OPD telah sesuai ketentuan. Pengajuan dinyatakan lolos verifikasi.",
    namaPenanggungJawab: "Drs. Haryono, M.Si.",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "050/DAGKOP/IV/2025",
    tanggalSurat: "2025-04-18",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "1",
    totalNilaiPiutang: "6800000",
    jenisPiutang: "Piutang Retribusi Daerah",
    jenisPenghapusan: "Penghapusan Mutlak",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: null,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "penyataan_opd",
    riwayatPenagihan1: null,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: filePernyataanOPD, // ada
    opsiDokumenDasarPiutang: "ada",
    dokumenDasarPiutang: fileDasarPiutang,
  },
  // 5. Tidak ada bukti penagihan sama sekali
  {
    id: "FP-2025-005",
    opdId: "OPD-SETWAN",
    namaOPD: "Sekretariat Dewan",
    createdBy: "user-setwan",
    status: "revisi",
    createdAt: "2025-05-10T10:15:00Z",
    updatedAt: "2025-05-11T13:20:00Z",
    nomorRegistrasi: null,
    // Jejak audit verifikasi BPKAD — hampir seluruh dokumen pendukung
    // dan bukti penagihan belum dilampirkan, sehingga sebagian besar
    // poin checklist belum bisa dinyatakan terpenuhi.
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: false,
      usia_pencatatan: false,
      tidak_ke_pupn: true,
      nilai_sesuai: false,
      angsuran_minim: false,
      tidak_mampu_bayar: false,
      surat_tagihan: false,
      upaya_optimal: false,
      hasil_gagal: false,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-05-11T13:20:00Z",
    catatanVerifikasi:
      "Belum ada bukti/riwayat penagihan sama sekali (surat tagihan, upaya penagihan, maupun Surat Pernyataan OPD). Daftar Nominatif, Neraca Awal, Rekapitulasi Angsuran, dan dokumen dasar piutang juga belum dilampirkan. Selain itu, seluruh Pernyataan OPD pada Langkah 3 belum dicentang. Mohon lengkapi ulang dari awal sebelum mengajukan kembali.",
    namaPenanggungJawab: "Drs. Suhartono",
    jabatan: "Sekretaris Dewan",
    nomorSurat: "007/SETWAN/V/2025",
    tanggalSurat: "2025-05-08",
    fileSurat: null,
    jumlahDebitur: "2",
    totalNilaiPiutang: "11200000",
    jenisPiutang: "Piutang Lainnya",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: false,
      dokumenResmi: false,
      upayaPenagihan: false,
      bersediaPerbaiki: false,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: null,
    rekapitulasiSaldoPiutang: null,
    neracaAwalPencatatanPiutang: null,
    dokumenPendukungSuratTidakMampuBayar: null,
    rekapitulasiAngsuran: null,
    // Catatan: OPD belum benar-benar memilih opsi ini (semua file
    // riwayat/pernyataan masih null) — "riwayat_tagihan" dipakai di
    // sini hanya sebagai nilai default yang valid secara tipe, bukan
    // pilihan yang sungguh-sungguh sudah dibuat OPD.
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: null,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "tidak_ada",
    dokumenDasarPiutang: null,
  },
  // 6. Disdagkop UKM — pengajuan baru, belum diverifikasi (status "diajukan")
  {
    id: "FP-2025-006",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "diajukan",
    createdAt: "2025-06-05T09:10:00Z",
    updatedAt: "2025-06-05T09:10:00Z",
    nomorRegistrasi: null,
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "062/DISDAGKOPUKM/VI/2025",
    tanggalSurat: "2025-06-03",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "2",
    totalNilaiPiutang: "9450000",
    jenisPiutang: "Piutang Retribusi Daerah",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: fileTagihan3,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "ada",
    dokumenDasarPiutang: fileDasarPiutang,
  },
  // 7. Disdagkop UKM — diajukan, dokumen lengkap (riwayat tagihan 3x + dasar piutang ada)
  {
    id: "FP-2025-007",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "diajukan",
    createdAt: "2025-07-02T08:30:00Z",
    updatedAt: "2025-07-02T08:30:00Z",
    nomorRegistrasi: null,
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M.",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "071/DISDAGKOPUKM/VII/2025",
    tanggalSurat: "2025-06-30",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "3",
    totalNilaiPiutang: "15750000",
    jenisPiutang: "Piutang Retribusi Daerah",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: fileTagihan3,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "ada",
    dokumenDasarPiutang: fileDasarPiutang,
  },
  // 8. Disdagkop UKM — revisi, Neraca Awal & Rekapitulasi Angsuran belum dilampirkan
  {
    id: "FP-2025-008",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "revisi",
    createdAt: "2025-08-04T10:12:00Z",
    updatedAt: "2025-08-06T09:40:00Z",
    nomorRegistrasi: null,
    // Jejak audit verifikasi BPKAD — usia_pencatatan & angsuran_minim
    // belum bisa dinyatakan terpenuhi karena dokumen pendukungnya
    // (neraca awal, rekapitulasi angsuran) memang belum dilampirkan.
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: true,
      usia_pencatatan: false,
      tidak_ke_pupn: true,
      nilai_sesuai: true,
      angsuran_minim: false,
      tidak_mampu_bayar: true,
      surat_tagihan: true,
      upaya_optimal: true,
      hasil_gagal: true,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-08-06T09:40:00Z",
    catatanVerifikasi:
      "Neraca Awal Pencatatan Piutang dan Rekapitulasi Angsuran belum dilampirkan. Mohon lengkapi dokumen tersebut sebelum mengajukan kembali.",
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "082/DISDAGKOPUKM/VIII/2025",
    tanggalSurat: "2025-08-01",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "1",
    totalNilaiPiutang: "3600000",
    jenisPiutang: "Piutang Lain-lain PAD yang Sah",
    jenisPenghapusan: "Penghapusan Mutlak",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: null,
    dokumenPendukungSuratTidakMampuBayar: null,
    rekapitulasiAngsuran: null,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "tidak_ada",
    dokumenDasarPiutang: null,
  },
  // 9. Disdagkop UKM — teregistrasi, pakai Surat Pernyataan OPD (bukan riwayat tagihan)
  {
    id: "FP-2025-009",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "teregistrasi",
    createdAt: "2025-09-01T13:00:00Z",
    updatedAt: "2025-09-03T11:15:00Z",
    nomorRegistrasi: buildNomorRegistrasi(
      3,
      "Disdagkop UKM",
      "2025-09-03T11:15:00Z",
    ),
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: true,
      usia_pencatatan: true,
      tidak_ke_pupn: true,
      nilai_sesuai: true,
      angsuran_minim: true,
      tidak_mampu_bayar: true,
      surat_tagihan: true,
      upaya_optimal: true,
      hasil_gagal: true,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-09-03T11:15:00Z",
    catatanVerifikasi:
      "Seluruh dokumen dan Surat Pernyataan OPD telah sesuai ketentuan. Pengajuan dinyatakan lolos verifikasi.",
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M.",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "093/DISDAGKOPUKM/IX/2025",
    tanggalSurat: "2025-08-28",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "1",
    totalNilaiPiutang: "5300000",
    jenisPiutang: "Piutang Lainnya",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "penyataan_opd",
    riwayatPenagihan1: null,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: filePernyataanOPD,
    opsiDokumenDasarPiutang: "ada",
    dokumenDasarPiutang: fileDasarPiutang,
  },
  // 10. Disdagkop UKM — diajukan, baru 2 dari 3 riwayat penagihan & dasar piutang tidak ada
  {
    id: "FP-2025-010",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "diajukan",
    createdAt: "2025-09-20T09:05:00Z",
    updatedAt: "2025-09-20T09:05:00Z",
    nomorRegistrasi: null,
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M.",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "104/DISDAGKOPUKM/IX/2025",
    tanggalSurat: "2025-09-18",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "2",
    totalNilaiPiutang: "7150000",
    jenisPiutang: "Piutang Retribusi Daerah",
    jenisPenghapusan: "Penghapusan Mutlak",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: null,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: null,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "tidak_ada",
    dokumenDasarPiutang: null,
  },
  // 11. Disdagkop UKM — revisi, dasar piutang dipilih "ada" tapi file belum diunggah
  {
    id: "FP-2025-011",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "revisi",
    createdAt: "2025-10-06T14:20:00Z",
    updatedAt: "2025-10-08T10:00:00Z",
    nomorRegistrasi: null,
    // Jejak audit verifikasi BPKAD — nilai_sesuai belum terpenuhi karena
    // Daftar Nominatif Piutang belum dilampirkan, dan opsi dokumen dasar
    // piutang dipilih "ada" namun file-nya belum diunggah.
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: true,
      usia_pencatatan: true,
      tidak_ke_pupn: true,
      nilai_sesuai: false,
      angsuran_minim: true,
      tidak_mampu_bayar: true,
      surat_tagihan: true,
      upaya_optimal: true,
      hasil_gagal: true,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-10-08T10:00:00Z",
    catatanVerifikasi:
      'Daftar Nominatif Usulan Piutang SKPD belum dilampirkan. Opsi dokumen dasar piutang dipilih "ada" namun berkasnya belum diunggah. Mohon lengkapi keduanya sebelum mengajukan kembali.',
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "115/DISDAGKOPUKM/X/2025",
    tanggalSurat: "2025-10-03",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "4",
    totalNilaiPiutang: "21400000",
    jenisPiutang: "Piutang Lain-lain PAD yang Sah",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: null,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: fileTagihan3,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "ada",
    dokumenDasarPiutang: null,
  },
  // 12. Disdagkop UKM — teregistrasi, dasar piutang tidak ada (tidak wajib)
  {
    id: "FP-2025-012",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "teregistrasi",
    createdAt: "2025-10-15T08:40:00Z",
    updatedAt: "2025-10-17T14:30:00Z",
    nomorRegistrasi: buildNomorRegistrasi(
      4,
      "Disdagkop UKM",
      "2025-10-17T14:30:00Z",
    ),
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: true,
      usia_pencatatan: true,
      tidak_ke_pupn: true,
      nilai_sesuai: true,
      angsuran_minim: true,
      tidak_mampu_bayar: true,
      surat_tagihan: true,
      upaya_optimal: true,
      hasil_gagal: true,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-10-17T14:30:00Z",
    catatanVerifikasi:
      "Seluruh dokumen dan riwayat penagihan lengkap. Pengajuan dinyatakan lolos verifikasi.",
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M.",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "126/DISDAGKOPUKM/X/2025",
    tanggalSurat: "2025-10-10",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "5",
    totalNilaiPiutang: "32100000",
    jenisPiutang: "Piutang Lain-lain PAD yang Sah",
    jenisPenghapusan: "Penghapusan Mutlak",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: fileTagihan3,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "tidak_ada",
    dokumenDasarPiutang: null,
  },
  // 13. Disdagkop UKM — diajukan, pakai Surat Pernyataan OPD
  {
    id: "FP-2025-013",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "diajukan",
    createdAt: "2025-11-04T10:50:00Z",
    updatedAt: "2025-11-04T10:50:00Z",
    nomorRegistrasi: null,
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "137/DISDAGKOPUKM/XI/2025",
    tanggalSurat: "2025-11-01",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "2",
    totalNilaiPiutang: "8200000",
    jenisPiutang: "Piutang Lainnya",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "penyataan_opd",
    riwayatPenagihan1: null,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: filePernyataanOPD,
    opsiDokumenDasarPiutang: "ada",
    dokumenDasarPiutang: fileDasarPiutang,
  },
  // 14. Disdagkop UKM — revisi, pengajuan sangat tidak lengkap (mirip kasus SETWAN)
  {
    id: "FP-2025-014",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "revisi",
    createdAt: "2025-11-18T09:00:00Z",
    updatedAt: "2025-11-19T15:45:00Z",
    nomorRegistrasi: null,
    // Jejak audit verifikasi BPKAD — hampir seluruh dokumen pendukung dan
    // bukti penagihan belum dilampirkan, dan Pernyataan OPD (Langkah 4)
    // belum dicentang seluruhnya.
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: false,
      usia_pencatatan: false,
      tidak_ke_pupn: true,
      nilai_sesuai: false,
      angsuran_minim: false,
      tidak_mampu_bayar: false,
      surat_tagihan: false,
      upaya_optimal: false,
      hasil_gagal: false,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-11-19T15:45:00Z",
    catatanVerifikasi:
      "Belum ada bukti/riwayat penagihan sama sekali (surat tagihan, upaya penagihan, maupun Surat Pernyataan OPD). Rekapitulasi Saldo Piutang, Neraca Awal, Rekapitulasi Angsuran, dan dokumen dasar piutang juga belum dilampirkan. Seluruh Pernyataan OPD pada Langkah 4 belum dicentang. Mohon lengkapi ulang dari awal sebelum mengajukan kembali.",
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "148/DISDAGKOPUKM/XI/2025",
    tanggalSurat: "2025-11-15",
    fileSurat: null,
    jumlahDebitur: "1",
    totalNilaiPiutang: "2450000",
    jenisPiutang: "Piutang Retribusi Daerah",
    jenisPenghapusan: "Penghapusan Mutlak",
    pernyataan: {
      dataBenar: false,
      dokumenResmi: false,
      upayaPenagihan: false,
      bersediaPerbaiki: false,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: null,
    neracaAwalPencatatanPiutang: null,
    dokumenPendukungSuratTidakMampuBayar: null,
    rekapitulasiAngsuran: null,
    // Catatan: OPD belum benar-benar memilih opsi ini (semua file
    // riwayat/pernyataan masih null) — "riwayat_tagihan" dipakai di sini
    // hanya sebagai nilai default yang valid secara tipe.
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: null,
    riwayatPenagihan2: null,
    riwayatPenagihan3: null,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "tidak_ada",
    dokumenDasarPiutang: null,
  },
  // 15. Disdagkop UKM — teregistrasi, pengajuan terbesar (7 debitur)
  {
    id: "FP-2025-015",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "teregistrasi",
    createdAt: "2025-12-01T11:20:00Z",
    updatedAt: "2025-12-03T09:50:00Z",
    nomorRegistrasi: buildNomorRegistrasi(
      5,
      "Disdagkop UKM",
      "2025-12-03T09:50:00Z",
    ),
    checklistSubstantif: {
      tidak_ada_jaminan: true,
      status_macet: true,
      usia_pencatatan: true,
      tidak_ke_pupn: true,
      nilai_sesuai: true,
      angsuran_minim: true,
      tidak_mampu_bayar: true,
      surat_tagihan: true,
      upaya_optimal: true,
      hasil_gagal: true,
    },
    verifikatorId: "BPKAD",
    tanggalVerifikasi: "2025-12-03T09:50:00Z",
    catatanVerifikasi:
      "Seluruh dokumen dan riwayat penagihan lengkap. Pengajuan dinyatakan lolos verifikasi.",
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M.",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "159/DISDAGKOPUKM/XII/2025",
    tanggalSurat: "2025-11-27",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "7",
    totalNilaiPiutang: "45600000",
    jenisPiutang: "Piutang Lain-lain PAD yang Sah",
    jenisPenghapusan: "Penghapusan Bersyarat",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: fileTagihan3,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "ada",
    dokumenDasarPiutang: fileDasarPiutang,
  },
  // 16. Disdagkop UKM — diajukan, pengajuan baru & lengkap, dasar piutang tidak ada
  {
    id: "FP-2025-016",
    opdId: "OPD-DISDAGKOPUKM",
    namaOPD: "Disdagkop UKM",
    createdBy: "user-disdagkopukm",
    status: "diajukan",
    createdAt: "2025-12-10T13:35:00Z",
    updatedAt: "2025-12-10T13:35:00Z",
    nomorRegistrasi: null,
    namaPenanggungJawab: "Rudi Setiawan, S.E., M.M",
    jabatan: "Kepala Dinas Perdagangan Koperasi dan UKM",
    nomorSurat: "170/DISDAGKOPUKM/XII/2025",
    tanggalSurat: "2025-12-08",
    fileSurat: fileSuratPengantar,
    jumlahDebitur: "3",
    totalNilaiPiutang: "13900000",
    jenisPiutang: "Piutang Retribusi Daerah",
    jenisPenghapusan: "Penghapusan Mutlak",
    pernyataan: {
      dataBenar: true,
      dokumenResmi: true,
      upayaPenagihan: true,
      bersediaPerbaiki: true,
    },
    suratPengantarUsulan: fileSuratPengantar,
    daftarNominatifPiutang: fileNominatif,
    rekapitulasiSaldoPiutang: fileRekapSaldo,
    neracaAwalPencatatanPiutang: fileNeraca,
    dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
    rekapitulasiAngsuran: fileAngsuran,
    opsiRiwayatPenagihan: "riwayat_tagihan",
    riwayatPenagihan1: fileTagihan1,
    riwayatPenagihan2: fileTagihan2,
    riwayatPenagihan3: fileTagihan3,
    filePernyataanOPD: null,
    opsiDokumenDasarPiutang: "tidak_ada",
    dokumenDasarPiutang: null,
  },
];
