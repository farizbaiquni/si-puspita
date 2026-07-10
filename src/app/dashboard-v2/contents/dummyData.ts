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

// ─────────────────────────────── DATA MOCK ──────────────────────────────────
export const MOCK_DATA: FormulirPenghapusanPiutangOPDRecord[] = [
  // 1. Semua riwayat penagihan lengkap (3 file)
  {
    id: "FP-2025-001",
    opdId: "OPD-RSUD",
    namaOPD: "RSUD",
    createdBy: "user-rsud",
    status: "lolos_verifikasi",
    createdAt: "2025-01-08T09:23:00Z",
    updatedAt: "2025-01-10T11:00:00Z",
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
    nominatif: {
      id: "NOM-001",
      formulirId: "FP-2025-001",
      suratPengantarUsulan: fileSuratPengantar,
      daftarNominatifPiutang: fileNominatif,
      rekapitulasiSaldoPiutang: fileRekapSaldo,
      neracaAwalPencatatanPiutang: fileNeraca,
      dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu, // opsional
      rekapitulasiAngsuran: fileAngsuran,
      opsiRiwayatPenagihan: "riwayat",
      riwayatPenagihan1: fileTagihan1,
      riwayatPenagihan2: fileTagihan2,
      riwayatPenagihan3: fileTagihan3,
      filePernyataanOPD: null, // harus null karena pakai riwayat
      opsiDokumenDasarPiutang: "ada",
      dokumenDasarPiutang: fileDasarPiutang,
    },
  },
  // 2. Hanya 1 riwayat penagihan (tagihan ke-1)
  {
    id: "FP-2025-002",
    opdId: "OPD-DISHUB",
    namaOPD: "Dinas Perhubungan",
    createdBy: "user-dishub",
    status: "revisi",
    createdAt: "2025-02-15T11:05:00Z",
    updatedAt: "2025-02-15T11:05:00Z",
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
    nominatif: {
      id: "NOM-002",
      formulirId: "FP-2025-002",
      suratPengantarUsulan: fileSuratPengantar,
      daftarNominatifPiutang: null,
      rekapitulasiSaldoPiutang: fileRekapSaldo,
      neracaAwalPencatatanPiutang: null,
      dokumenPendukungSuratTidakMampuBayar: null,
      rekapitulasiAngsuran: null,
      opsiRiwayatPenagihan: "riwayat",
      riwayatPenagihan1: fileTagihan1,
      riwayatPenagihan2: null,
      riwayatPenagihan3: null,
      filePernyataanOPD: null,
      opsiDokumenDasarPiutang: "tidak_ada",
      dokumenDasarPiutang: null,
    },
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
    nominatif: {
      id: "NOM-003",
      formulirId: "FP-2025-003",
      suratPengantarUsulan: fileSuratPengantar,
      daftarNominatifPiutang: fileNominatif,
      rekapitulasiSaldoPiutang: fileRekapSaldo,
      neracaAwalPencatatanPiutang: fileNeraca,
      dokumenPendukungSuratTidakMampuBayar: fileSuratTidakMampu,
      rekapitulasiAngsuran: fileAngsuran,
      opsiRiwayatPenagihan: "riwayat",
      riwayatPenagihan1: fileTagihan1,
      riwayatPenagihan2: fileTagihan2,
      riwayatPenagihan3: null,
      filePernyataanOPD: null,
      opsiDokumenDasarPiutang: "tidak_ada",
      dokumenDasarPiutang: null,
    },
  },
  // 4. Tidak ada riwayat penagihan, menggunakan Surat Pernyataan OPD
  {
    id: "FP-2025-004",
    opdId: "OPD-DAGKOPUKM",
    namaOPD: "Dinas Perdagangan Koperasi dan UKM",
    createdBy: "user-dagkopukm",
    status: "lolos_verifikasi",
    createdAt: "2025-04-20T15:45:00Z",
    updatedAt: "2025-04-22T09:30:00Z",
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
    nominatif: {
      id: "NOM-004",
      formulirId: "FP-2025-004",
      suratPengantarUsulan: fileSuratPengantar,
      daftarNominatifPiutang: fileNominatif,
      rekapitulasiSaldoPiutang: fileRekapSaldo,
      neracaAwalPencatatanPiutang: fileNeraca,
      dokumenPendukungSuratTidakMampuBayar: null,
      rekapitulasiAngsuran: fileAngsuran,
      opsiRiwayatPenagihan: "pernyataan",
      riwayatPenagihan1: null,
      riwayatPenagihan2: null,
      riwayatPenagihan3: null,
      filePernyataanOPD: filePernyataanOPD, // ada
      opsiDokumenDasarPiutang: "ada",
      dokumenDasarPiutang: fileDasarPiutang,
    },
  },
  // 5. Tidak ada bukti penagihan sama sekali
  {
    id: "FP-2025-005",
    opdId: "OPD-SETWAN",
    namaOPD: "Sekretariat Dewan",
    createdBy: "user-setwan",
    status: "revisi",
    createdAt: "2025-05-10T10:15:00Z",
    updatedAt: "2025-05-10T10:15:00Z",
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
    nominatif: {
      id: "NOM-005",
      formulirId: "FP-2025-005",
      suratPengantarUsulan: fileSuratPengantar,
      daftarNominatifPiutang: null,
      rekapitulasiSaldoPiutang: null,
      neracaAwalPencatatanPiutang: null,
      dokumenPendukungSuratTidakMampuBayar: null,
      rekapitulasiAngsuran: null,
      opsiRiwayatPenagihan: "tidak_ada",
      riwayatPenagihan1: null,
      riwayatPenagihan2: null,
      riwayatPenagihan3: null,
      filePernyataanOPD: null,
      opsiDokumenDasarPiutang: "tidak_ada",
      dokumenDasarPiutang: null,
    },
  },
];
