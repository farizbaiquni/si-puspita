"use client";

/* ------------------------------------------------------------------ */
/*  BeritaAcaraPreview.tsx                                             */
/*  Komponen preview Berita Acara ukuran F4/Folio (21.5 × 33 cm).      */
/* ------------------------------------------------------------------ */

import React from "react";
import type { BeritaAcaraData } from "./types";
import {
  KOP_SURAT,
  JUDUL_BA,
  SECTION_A_POIN,
  SECTION_B_PARAGRAF,
  SECTION_D_PEMBUKA,
  SECTION_D_KESIMPULAN_UTAMA,
  SECTION_D_PENUTUP,
  SECTION_D_DEMIKIAN,
  LABEL_PENELAAH,
  PEMBUKA_PARAGRAF_2,
  DAFTAR_PENELAAH_TUGAS,
  LABEL_IDENTITAS,
} from "./constants";
import {
  formatTanggalPanjang,
  formatPembukaTanggal,
  formatRupiahNilai,
} from "./formatHelpers";

export const F4_WIDTH_MM = 215;
export const F4_HEIGHT_MM = 330;
export const PRINT_AREA_ID = "berita-acara-print-area";

interface BeritaAcaraPreviewProps {
  data: BeritaAcaraData;
}

export default function BeritaAcaraPreview({ data }: BeritaAcaraPreviewProps) {
  const pembukaKalimat = formatPembukaTanggal(data.tanggalBA);
  const tanggalBAPanjang = formatTanggalPanjang(data.tanggalBA);
  const nilaiPiutangFmt = formatRupiahNilai(data.nilaiPiutang);
  const nilaiKesimpulanFmt = formatRupiahNilai(data.nilaiPiutangKesimpulan);

  const identitasValues: Record<string, string> = {
    perangkatDaerah: data.perangkatDaerah || "-",
    nomorRegistrasi: data.nomorRegistrasi || "-",
    tanggalRegistrasi: data.tanggalRegistrasi
      ? formatTanggalPanjang(data.tanggalRegistrasi)
      : "-",
    jenisPiutang: data.jenisPiutang || "-",
    namaJumlahDebitur: data.namaJumlahDebitur || "-",
    nilaiPiutang: nilaiPiutangFmt,
    tahunPerolehan: data.tahunPerolehan || "-",
  };

  return (
    <div
      id={PRINT_AREA_ID}
      style={{
        width: `${F4_WIDTH_MM}mm`,
        minHeight: `${F4_HEIGHT_MM}mm`,
        padding: "20mm 20mm 20mm 30mm",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "12pt",
        lineHeight: 1.5,
        color: "#000",
        backgroundColor: "#fff",
        boxSizing: "border-box",
      }}
    >
      {/* ═══════════════════════ KOP SURAT ═══════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "4px",
        }}
      >
        <div
          style={{
            width: "25mm",
            height: "25mm",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px dashed #bbb",
            fontSize: "8pt",
            color: "#999",
            fontFamily: "sans-serif",
          }}
        >
          LOGO
        </div>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "14pt", fontWeight: "bold" }}>
            {KOP_SURAT.pemerintah}
          </div>
          <div style={{ fontSize: "14pt", fontWeight: "bold" }}>
            {KOP_SURAT.instansi}
          </div>
          <div style={{ fontSize: "10pt" }}>{KOP_SURAT.alamat}</div>
          <div style={{ fontSize: "10pt" }}>{KOP_SURAT.kontak}</div>
        </div>
      </div>

      {/* Garis ganda */}
      <div
        style={{
          borderTop: "2px solid #000",
          borderBottom: "1px solid #000",
          height: "2px",
          marginBottom: "16px",
        }}
      />

      {/* ═══════════════════════ NOMOR BA ═══════════════════════ */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "16px",
          fontSize: "12pt",
        }}
      >
        Nomor: {data.nomorBA.trim() || "....................................."}
      </div>

      {/* ═══════════════════════ JUDUL ═══════════════════════ */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "12pt",
          marginBottom: "16px",
        }}
      >
        {JUDUL_BA}
      </div>

      {/* ═══════════════════════ PEMBUKA ═══════════════════════ */}
      <p style={{ textAlign: "justify", textIndent: "0", marginBottom: "8px" }}>
        Pada hari ini, {pembukaKalimat}, bertempat di Badan Pengelolaan Keuangan
        dan Aset Daerah Kabupaten Kendal, telah dilaksanakan penelaahan internal
        terhadap usulan penghapusan Piutang Daerah yang diajukan oleh:
      </p>

      {/* ═══════════════════════ TABEL IDENTITAS ═══════════════════════ */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "16px",
        }}
      >
        <tbody>
          {LABEL_IDENTITAS.map(({ key, label }) => (
            <tr key={key} style={{ verticalAlign: "top" }}>
              <td style={{ width: "55mm", padding: "2px 0" }}>{label}</td>
              <td style={{ width: "4mm", padding: "2px 0" }}>:</td>
              <td style={{ padding: "2px 0" }}>{identitasValues[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ═══════════════════════ DAFTAR PENELAAH ═══════════════════════ */}
      <p style={{ marginBottom: "8px" }}>{PEMBUKA_PARAGRAF_2}</p>

      <ol
        style={{
          paddingLeft: "20px",
          marginBottom: "16px",
          listStyleType: "decimal",
        }}
      >
        {DAFTAR_PENELAAH_TUGAS.map((tugas, i) => (
          <li key={i} style={{ marginBottom: "4px", textAlign: "justify" }}>
            {tugas}
          </li>
        ))}
      </ol>

      {/* ═══════════════════════ A. DASAR PENELAAHAN ═══════════════════════ */}
      <SectionHeading>{"A.\tDASAR PENELAAHAN"}</SectionHeading>
      <p style={{ marginBottom: "8px" }}>
        Penelaahan internal dilaksanakan berdasarkan:
      </p>
      <ol
        style={{
          paddingLeft: "20px",
          marginBottom: "16px",
          listStyleType: "decimal",
        }}
      >
        {SECTION_A_POIN.map((poin, i) => (
          <li key={i} style={{ marginBottom: "4px", textAlign: "justify" }}>
            {poin}
          </li>
        ))}
      </ol>

      {/* ═══════════════════════ B. MAKSUD DAN TUJUAN ═══════════════════════ */}
      <SectionHeading>{"B.\tMAKSUD DAN TUJUAN"}</SectionHeading>
      <p style={{ textAlign: "justify", marginBottom: "16px" }}>
        {SECTION_B_PARAGRAF}
      </p>

      {/* ═══════════════════════ C. HASIL PENELAAHAN ═══════════════════════ */}
      <SectionHeading>{"C.\tHASIL PENELAAHAN"}</SectionHeading>
      <p style={{ textAlign: "justify", marginBottom: "8px" }}>
        Berdasarkan hasil penelaahan terhadap dokumen dan informasi yang
        disampaikan oleh Perangkat Daerah melalui SI-PUSPITA, diperoleh hasil
        sebagai berikut:
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "16px",
          fontSize: "11pt",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle(8)}>No</th>
            <th style={thStyle(47)}>Aspek yang Ditelaah</th>
            <th style={thStyle(20)}>Hasil Penelaahan</th>
            <th style={thStyle(25)}>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {data.aspekPenelaahan.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  fontStyle: "italic",
                  color: "#888",
                }}
              >
                (Belum ada data aspek penelaahan)
              </td>
            </tr>
          ) : (
            data.aspekPenelaahan.map((aspek) => (
              <tr key={aspek.nomor} style={{ verticalAlign: "top" }}>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  {aspek.nomor}
                </td>
                <td style={tdStyle}>{aspek.label}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  {aspek.hasil || "-"}
                </td>
                <td style={tdStyle}>{aspek.keterangan || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ═══════════════════════ D. KESIMPULAN ═══════════════════════ */}
      <SectionHeading>{"D.\tKESIMPULAN DAN TINDAK LANJUT"}</SectionHeading>
      <p style={{ textAlign: "justify", marginBottom: "8px" }}>
        {SECTION_D_PEMBUKA} Nomor Registrasi SI-PUSPITA{" "}
        <strong>{data.nomorRegistrasi || "-"}</strong> dengan nilai piutang
        sebesar <strong>{nilaiKesimpulanFmt}</strong>, dinyatakan:
      </p>

      <table
        style={{
          marginBottom: "16px",
          borderCollapse: "collapse",
          fontSize: "12pt",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: "6mm",
                padding: "4px 8px 4px 20px",
                verticalAlign: "middle",
              }}
            >
              ☑
            </td>
            <td style={{ padding: "4px 0" }}>{SECTION_D_KESIMPULAN_UTAMA}</td>
          </tr>
          <tr>
            <td
              style={{
                width: "6mm",
                padding: "4px 8px 4px 20px",
                verticalAlign: "middle",
              }}
            >
              ☐
            </td>
            <td style={{ padding: "4px 0", color: "#888" }}>
              Belum dapat diajukan kepada Inspektorat sampai dengan dipenuhinya
              kekurangan/perbaikan sebagaimana dimaksud pada bagian C.
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ textAlign: "justify", marginBottom: "16px" }}>
        {SECTION_D_PENUTUP}
      </p>

      <p style={{ textAlign: "justify", marginBottom: "24px" }}>
        {SECTION_D_DEMIKIAN}
      </p>

      {/* ═══════════════════════ TANDA TANGAN ═══════════════════════ */}
      <div style={{ textAlign: "right", marginBottom: "20px" }}>
        Kendal, {tanggalBAPanjang}
      </div>

      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        PENELAAH INTERNAL:
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: "11pt",
        }}
      >
        <tbody>
          <tr style={{ verticalAlign: "top" }}>
            <td
              style={{
                width: "50%",
                padding: "0 10px",
                textAlign: "center",
                verticalAlign: "top",
              }}
            >
              <SignBlock
                label={LABEL_PENELAAH.sekban}
                nama={data.penelaah.sekban.nama}
                nip={data.penelaah.sekban.nip}
              />
            </td>
            <td
              style={{
                width: "50%",
                padding: "0 10px",
                textAlign: "center",
                verticalAlign: "top",
              }}
            >
              <SignBlock
                label={LABEL_PENELAAH.kasubbid}
                nama={data.penelaah.kasubbid.nama}
                nip={data.penelaah.kasubbid.nip}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "24px",
        }}
      >
        <div
          style={{
            width: "50%",
            padding: "0 10px",
            textAlign: "center",
          }}
        >
          <SignBlock
            label={LABEL_PENELAAH.kabid}
            nama={data.penelaah.kabid.nama}
            nip={data.penelaah.kabid.nip}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Helper styles ─── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontWeight: "bold",
        marginTop: "16px",
        marginBottom: "8px",
        whiteSpace: "pre",
      }}
    >
      {children}
    </div>
  );
}

function thStyle(widthPct: number): React.CSSProperties {
  return {
    width: `${widthPct}%`,
    border: "1px solid #000",
    padding: "6px 8px",
    backgroundColor: "#f0f0f0",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "11pt",
  };
}

const tdStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "6px 8px",
  verticalAlign: "top",
};

function SignBlock({
  label,
  nama,
  nip,
}: {
  label: string;
  nama: string;
  nip: string;
}) {
  return (
    <>
      <div
        style={{
          fontSize: "11pt",
          lineHeight: 1.3,
          minHeight: "48px",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <div style={{ height: "18mm" }} />

      <div
        style={{
          fontWeight: "bold",
          textDecoration: nama.trim() ? "underline" : "none",
          marginBottom: "2px",
          fontSize: "11pt",
          lineHeight: 1.3,
        }}
      >
        {nama.trim() || "....................."}
      </div>

      <div style={{ fontSize: "11pt", lineHeight: 1.3 }}>
        NIP. {nip.trim() || "....................."}
      </div>
    </>
  );
}
