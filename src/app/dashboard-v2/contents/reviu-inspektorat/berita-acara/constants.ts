/* ------------------------------------------------------------------ */
/*  constants.ts                                                       */
/*  Konstanta untuk Berita Acara Penelaahan Internal.                  */
/*  Semua teks tetap (hardcoded) — bukan dari database.                */
/* ------------------------------------------------------------------ */

/* ─── Kop Surat ─────────────────────────────────────────────────────── */

export const KOP_SURAT = {
  /** Nama instansi baris 1 (huruf besar) */
  pemerintah: "PEMERINTAH KABUPATEN KENDAL",
  /** Nama instansi baris 2 (huruf besar) */
  instansi: "BADAN PENGELOLAAN KEUANGAN DAN ASET DAERAH",
  /** Alamat lengkap */
  alamat:
    "Jl. Notomudigdo, Karanggeneng, Pegulon, Kec. Kendal, Jawa Tengah 51313",
  /** Telepon & email */
  kontak: "Telp. (0294) 381301-381801 · Email: bpkad.kendal@gmail.com",
  /** Path logo (placeholder — ganti dengan logo asli) */
  logoSrc: "/logo-kendal.png",
} as const;

/* ─── Judul Berita Acara ────────────────────────────────────────────── */

export const JUDUL_BA =
  "HASIL PENELAAHAN INTERNAL ATAS USULAN PENGHAPUSAN PIUTANG DAERAH";

/* ─── Tabel C: 10 Aspek yang Ditelaah (pre-filled dari kode) ────────── */

export const DAFTAR_ASPEK_PENELAAHAN: string[] = [
  "Identitas dan kewenangan OPD pengusul",
  "Identitas dan data debitur",
  "Dasar timbulnya Piutang Daerah",
  "Nilai dan rincian Piutang Daerah",
  "Dokumen sumber/penerbitan piutang",
  "Dokumen penagihan dan upaya penagihan",
  "Riwayat pembayaran/angsuran, apabila ada",
  "Bukti/informasi mengenai kondisi debitur",
  "Penatausahaan dan pencatatan Piutang Daerah",
  "Dokumen pendukung lainnya",
];

/* ─── Bagian A: Dasar Penelaahan ────────────────────────────────────── */

export const SECTION_A_POIN: string[] = [
  "Peraturan Menteri Keuangan Republik Indonesia Nomor 137/PMK.06/2022 tentang Penghapusan Piutang Daerah yang Tidak Dapat Diserahkan Pengurusannya kepada Panitia Urusan Piutang Negara (PUPN);",
  "Ketentuan peraturan perundang-undangan lainnya yang berkaitan dengan pengelolaan dan penghapusan Piutang Daerah;",
  "Dokumen usulan penghapusan Piutang Daerah yang disampaikan oleh Perangkat Daerah melalui SI-PUSPITA; dan",
  "Hasil verifikasi dan dokumen pendukung yang telah diunggah/disampaikan melalui SI-PUSPITA.",
];

/* ─── Bagian B: Maksud dan Tujuan ───────────────────────────────────── */

export const SECTION_B_PARAGRAF =
  "Penelaahan internal dimaksudkan untuk memastikan bahwa usulan penghapusan Piutang Daerah yang telah teregistrasi melalui SI-PUSPITA telah memenuhi kelengkapan administrasi dan memiliki informasi yang memadai sebagai bahan untuk diajukan kepada Inspektorat guna dilakukan reviu sesuai dengan ketentuan yang berlaku.";

/* ─── Bagian C: Hasil Penelaahan (header tabel) ─────────────────────── */

export const SECTION_C_HEADER = [
  { key: "no", label: "No", width: "8%" },
  { key: "aspek", label: "Aspek yang Ditelaah", width: "50%" },
  { key: "hasil", label: "Hasil Penelaahan", width: "17%" },
  { key: "keterangan", label: "Keterangan", width: "25%" },
] as const;

/* ─── Bagian D: Kesimpulan ──────────────────────────────────────────── */

export const SECTION_D_PEMBUKA =
  "Berdasarkan hasil penelaahan internal sebagaimana tersebut di atas, terhadap usulan penghapusan Piutang Daerah dengan";

export const SECTION_D_KESIMPULAN_UTAMA =
  "Dapat diajukan kepada Inspektorat untuk dilakukan reviu.";

export const SECTION_D_KESIMPULAN_ALTERNATIF =
  "Belum dapat diajukan kepada Inspektorat sampai dengan dipenuhinya kekurangan/perbaikan sebagaimana dimaksud pada bagian C.";

export const SECTION_D_PENUTUP =
  "Dalam hal usulan dinyatakan dapat diajukan, dokumen hasil penelaahan internal ini menjadi salah satu dokumen pendukung dalam penyampaian usulan kepada Inspektorat untuk dilakukan reviu atas kelayakan Piutang Daerah untuk dihapuskan sesuai dengan ketentuan yang berlaku.";

export const SECTION_D_DEMIKIAN =
  "Demikian Berita Acara Hasil Penelaahan Internal ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.";

/* ─── Label Penelaah ────────────────────────────────────────────────── */

export const LABEL_PENELAAH = {
  kasubbid: "Kepala Subbid Akuntansi dan Pelaporan BPKAD Kabupaten Kendal",
  kabid: "Kepala Bidang Perbendaharaan dan Akuntansi BPKAD Kabupaten Kendal",
  sekban: "Sekretaris BPKAD Kabupaten Kendal",
} as const;

/* ─── Kalimat Pembuka ───────────────────────────────────────────────── */

export const PEMBUKA_PARAGRAF_1 =
  "Pada hari ini, ... tanggal .... bulan ... tahun .... , bertempat di Badan Pengelolaan Keuangan dan Aset Daerah Kabupaten Kendal, telah dilaksanakan pencatatan internal terhadap usulan penghapusan Piutang Daerah yang diajukan oleh:";

export const PEMBUKA_PARAGRAF_2 = "Penelaahan internal dilaksanakan oleh:";

export const DAFTAR_PENELAAH_TUGAS: string[] = [
  "Kepala Subbid Akuntansi dan Pelaporan, selaku penelaah dari aspek administrasi dan kelengkapan dokumen;",
  "Kepala Bidang Perbendaharaan dan Akuntansi, selaku penelaah dan koordinator aspek pengelolaan serta penatausahaan Piutang Daerah; dan",
  "Sekretaris BPKAD, selaku penelaah akhir internal pada tingkat BPKAD.",
];

/* ─── Label Field Identitas (untuk form & preview) ──────────────────── */

export const LABEL_IDENTITAS: {
  key: string;
  label: string;
}[] = [
  { key: "perangkatDaerah", label: "Perangkat Daerah" },
  { key: "nomorRegistrasi", label: "Nomor Registrasi SI-PUSPITA" },
  { key: "tanggalRegistrasi", label: "Tanggal Registrasi" },
  { key: "jenisPiutang", label: "Jenis Piutang" },
  { key: "namaJumlahDebitur", label: "Nama/Jumlah Debitur" },
  { key: "nilaiPiutang", label: "Nilai Piutang" },
  { key: "tahunPerolehan", label: "Tahun Perolehan Piutang" },
];
