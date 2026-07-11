/* ------------------------------------------------------------------ */
/*  checklistPersyaratan.ts                                           */
/*  Definisi Checklist Persyaratan Substantif (mengacu PMK 137).      */
/*                                                                      */
/*  Satu sumber kebenaran dipakai bersama oleh:                       */
/*   - Panel Verifikasi BPKAD (VerifikasiPengajuan.tsx) — untuk        */
/*     menampilkan & mencentang checklist saat meninjau dokumen.       */
/*   - Daftar Pengajuan OPD (LihatDaftarPengajuan.tsx) — untuk         */
/*     menampilkan ke OPD poin mana yang belum terpenuhi saat status   */
/*     pengajuan "revisi".                                             */
/*                                                                      */
/*  PENTING: id di sini adalah key yang dipakai di                     */
/*  FormulirPenghapusanPiutangOPDRecord.checklistSubstantif (lihat     */
/*  types-v2.ts). Jangan ubah id tanpa menyesuaikan data yang sudah     */
/*  tersimpan.                                                          */
/* ------------------------------------------------------------------ */

export interface ChecklistItemDef {
  id: string;
  label: string;
  /** Opsi dokumen pendukung alternatif (cukup salah satu) */
  subItems?: string[];
}

export const CHECKLIST_STATUS_PIUTANG: ChecklistItemDef[] = [
  {
    id: "tidak_ada_jaminan",
    label: "Tidak ada barang jaminan / barang jaminan tidak bernilai ekonomis",
  },
  {
    id: "status_macet",
    label: "Piutang telah berstatus macet (SKRD / SK / Surat Perjanjian)",
  },
  {
    id: "usia_pencatatan",
    label:
      "Usia pencatatan piutang telah memenuhi ketentuan (neraca awal terjadinya piutang)",
  },
  {
    id: "tidak_ke_pupn",
    label: "Piutang tidak dapat diserahkan kepada PUPN (sesuai Ps. 4 ayat 2)",
  },
  {
    id: "nilai_sesuai",
    label:
      "Nilai piutang telah sesuai ketentuan (Daftar Nominatif Usulan Piutang SKPD)",
  },
  {
    id: "angsuran_minim",
    label:
      "Tidak terdapat angsuran / angsuran < 10% dari total kewajiban (Daftar Nominatif Usulan Piutang SKPD)",
  },
  {
    id: "tidak_mampu_bayar",
    label: "Tidak mempunyai kemampuan untuk menyelesaikan utang",
    subItems: [
      "Kartu keluarga miskin",
      "Putusan pailit",
      "Surat keterangan dari kelurahan/kepala desa/kepala lingkungan/instansi berwenang/PPKD yang menyatakan Penanggung Utang tidak mampu membayar atau tidak diketahui tempat tinggalnya",
      "Bukti penerimaan asuransi kesehatan bagi masyarakat miskin",
      "Bukti penerima manfaat bansos (BPNT, BST, PKH, atau program sejenis)",
      "Bukti kunjungan penagihan / berita acara petugas PPKD yang menyimpulkan Penanggung Utang tidak mampu membayar atau tidak diketahui tempat tinggalnya",
    ],
  },
];

export const CHECKLIST_UPAYA_PENAGIHAN: ChecklistItemDef[] = [
  { id: "surat_tagihan", label: "Surat tagihan telah diterbitkan (3x)" },
  {
    id: "upaya_optimal",
    label: "Telah dilakukan upaya optimal sesuai ketentuan (jika ada)",
  },
  { id: "hasil_gagal", label: "Hasil penagihan tidak berhasil" },
];

export const ALL_CHECKLIST_ITEMS: ChecklistItemDef[] = [
  ...CHECKLIST_STATUS_PIUTANG,
  ...CHECKLIST_UPAYA_PENAGIHAN,
];
