"use client";

/* ------------------------------------------------------------------ */
/*  Sections.tsx                                                       */
/*  Tiga section form Berita Acara digabung dalam satu file:           */
/*    1. SectionDataUmum  — Data Umum                                  */
/*    2. SectionTabelC    — Tabel Hasil Penelaahan                     */
/*    3. SectionPenelaah  — Data Penelaah                              */
/* ------------------------------------------------------------------ */

import React from "react";
import type { AspekPenelaahan, BeritaAcaraData, HasilAspek } from "./types";
import { formatAngkaRibuan, formatNip, unformatAngka } from "./formatInput";

/* ════════════════════════════════════════════════════════════════════ */
/*  1. DATA UMUM                                                       */
/* ════════════════════════════════════════════════════════════════════ */

interface SectionDataUmumProps {
  data: BeritaAcaraData;
  onChange: (field: keyof BeritaAcaraData, value: string) => void;
  errors: Record<string, string>;
  /**
   * Field yang nilainya diambil dari database.
   * Field yang masuk dalam daftar ini TIDAK AKAN DITAMPILKAN di form.
   */
  readOnlyFields?: (keyof BeritaAcaraData)[];
}

export function SectionDataUmum({
  data,
  onChange,
  errors,
  readOnlyFields = [],
}: SectionDataUmumProps) {
  // Helper untuk mengecek apakah field harus disembunyikan
  const isHidden = (field: keyof BeritaAcaraData) =>
    readOnlyFields.includes(field);

  return (
    <section className="space-y-4">
      <SectionTitle>Data Umum</SectionTitle>

      {/* ── Editable: Nomor BA (opsional) ── */}
      <Field
        label="Nomor BA"
        hint="Opsional — kalau dikosongkan, di dokumen akan tampil titik-titik."
        error={errors.nomorBA}
      >
        <input
          type="text"
          value={data.nomorBA}
          onChange={(e) => onChange("nomorBA", e.target.value)}
          placeholder="Contoh: 008/BA-PUSPITA/2026"
          className={inputClass(!!errors.nomorBA)}
        />
      </Field>

      {/* ── Editable: Perangkat Daerah ── */}
      <Field label="Perangkat Daerah" required error={errors.perangkatDaerah}>
        <input
          type="text"
          value={data.perangkatDaerah}
          onChange={(e) => onChange("perangkatDaerah", e.target.value)}
          placeholder="RSUD dr. H. Soewondo Kendal"
          className={inputClass(!!errors.perangkatDaerah)}
        />
      </Field>

      {/* ── Hidden: Nomor Registrasi SI-PUSPITA ── */}
      {!isHidden("nomorRegistrasi") && (
        <Field
          label="Nomor Registrasi SI-PUSPITA"
          required
          error={errors.nomorRegistrasi}
        >
          <input
            type="text"
            value={data.nomorRegistrasi}
            readOnly
            className={inputClass(!!errors.nomorRegistrasi)}
          />
        </Field>
      )}

      {/* ── Hidden: Tanggal Registrasi ── */}
      {!isHidden("tanggalRegistrasi") && (
        <Field
          label="Tanggal Registrasi"
          required
          error={errors.tanggalRegistrasi}
        >
          <input
            type="date"
            value={data.tanggalRegistrasi}
            readOnly
            className={inputClass(!!errors.tanggalRegistrasi)}
          />
        </Field>
      )}

      {/* ── Hidden: Jenis Piutang ── */}
      {!isHidden("jenisPiutang") && (
        <Field label="Jenis Piutang" required error={errors.jenisPiutang}>
          <input
            type="text"
            value={data.jenisPiutang}
            readOnly
            className={inputClass(!!errors.jenisPiutang)}
          />
        </Field>
      )}

      {/* ── Hidden: Nama/Jumlah Debitur ── */}
      {!isHidden("namaJumlahDebitur") && (
        <Field
          label="Nama/Jumlah Debitur"
          required
          error={errors.namaJumlahDebitur}
        >
          <input
            type="text"
            value={data.namaJumlahDebitur}
            readOnly
            className={inputClass(!!errors.namaJumlahDebitur)}
          />
        </Field>
      )}

      {/* ── Hidden: Nilai Piutang (tabel identitas) ── */}
      {!isHidden("nilaiPiutang") && (
        <Field
          label="Nilai Piutang (tabel identitas)"
          required
          error={errors.nilaiPiutang}
        >
          <input
            type="text"
            value={formatAngkaRibuan(data.nilaiPiutang)}
            readOnly
            className={inputClass(!!errors.nilaiPiutang)}
          />
        </Field>
      )}

      {/* ── Editable manual: Tahun Perolehan + Tanggal BA (berdampingan) ── */}
      <div className="grid grid-cols-2 gap-3">
        {!isHidden("tahunPerolehan") && (
          <Field
            label="Tahun Perolehan Piutang"
            required
            error={errors.tahunPerolehan}
          >
            <input
              type="text"
              inputMode="numeric"
              value={data.tahunPerolehan}
              onChange={(e) =>
                onChange(
                  "tahunPerolehan",
                  e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
                )
              }
              placeholder="Tahun piutang tercatat"
              maxLength={4}
              className={inputClass(!!errors.tahunPerolehan)}
            />
          </Field>
        )}

        <Field label="Tanggal Berita Acara" required error={errors.tanggalBA}>
          <input
            type="date"
            value={data.tanggalBA}
            onChange={(e) => onChange("tanggalBA", e.target.value)}
            className={inputClass(!!errors.tanggalBA)}
          />
        </Field>
      </div>

      {/* ── Editable: Nilai Piutang (kesimpulan D) ── */}
      <Field
        label="Nilai Piutang (kesimpulan D)"
        required
        error={errors.nilaiPiutangKesimpulan}
      >
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] font-medium text-slate-500">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={formatAngkaRibuan(data.nilaiPiutangKesimpulan)}
            onChange={(e) =>
              onChange("nilaiPiutangKesimpulan", unformatAngka(e.target.value))
            }
            placeholder="Nilai hasil penelaahan"
            className={`${inputClass(!!errors.nilaiPiutangKesimpulan)} pl-9`}
          />
        </div>
      </Field>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
/*  2. TABEL HASIL PENELAAHAN                                          */
/* ════════════════════════════════════════════════════════════════════ */

interface SectionTabelCProps {
  aspek: AspekPenelaahan[];
  onChange: (
    nomor: number,
    field: keyof AspekPenelaahan,
    value: string,
  ) => void;
  errors: Record<string, string>;
  onBulkUpdate: (hasil: HasilAspek) => void;
}

export function SectionTabelC({
  aspek,
  onChange,
  errors,
  onBulkUpdate,
}: SectionTabelCProps) {
  const jumlahTerpilih = aspek.filter((a) => a.hasil).length;

  return (
    <section className="space-y-4">
      <SectionTitle>Tabel Hasil Penelaahan</SectionTitle>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-xs px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
            jumlahTerpilih === aspek.length && aspek.length > 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {jumlahTerpilih}/{aspek.length} terpilih
        </span>
        <button
          type="button"
          onClick={() => onBulkUpdate("Sesuai")}
          className="flex shrink-0 items-center gap-1.5 rounded-xs border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M3 8l3.5 3.5L13 4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Semua Sesuai
        </button>
      </div>

      <div className="space-y-2.5">
        {aspek.map((item) => {
          const hasilError = errors[`aspek_${item.nomor}_hasil`];
          const ketError = errors[`aspek_${item.nomor}_keterangan`];

          const isSesuai = item.hasil === "Sesuai";
          const isTidakSesuai = item.hasil === "Tidak Sesuai";
          const sudahDipilih = isSesuai || isTidakSesuai;
          const hasError = !!hasilError || !!ketError;

          return (
            <div
              key={item.nomor}
              className={`rounded-xs border p-3 transition-colors ${
                hasError
                  ? "border-red-300 bg-red-50/40"
                  : isSesuai
                    ? "border-emerald-200 bg-emerald-50/30"
                    : isTidakSesuai
                      ? "border-orange-200 bg-orange-50/30"
                      : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {/* Nomor & Aspek */}
              <div className="mb-2.5 flex items-start gap-2.5">
                <span
                  className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-xs text-[10px] font-bold ${
                    isSesuai
                      ? "bg-emerald-500 text-white"
                      : isTidakSesuai
                        ? "bg-orange-500 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {item.nomor}
                </span>
                <span className="text-[12.5px] leading-snug font-semibold text-slate-800">
                  {item.label}
                </span>
              </div>

              {/* Segmented control Sesuai / Tidak Sesuai — selebar kartu */}
              <div
                className={`grid grid-cols-2 gap-1 rounded-xs p-0.5 ${
                  isSesuai
                    ? "bg-emerald-100/70"
                    : isTidakSesuai
                      ? "bg-orange-100/70"
                      : "bg-slate-100"
                } ${hasilError ? "ring-2 ring-red-300" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => onChange(item.nomor, "hasil", "Sesuai")}
                  className={`rounded-xs py-1.5 text-[11.5px] font-semibold transition-all ${
                    isSesuai
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                  }`}
                >
                  Sesuai
                </button>
                <button
                  type="button"
                  onClick={() => onChange(item.nomor, "hasil", "Tidak Sesuai")}
                  className={`rounded-xs py-1.5 text-[11.5px] font-semibold transition-all ${
                    isTidakSesuai
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
                  }`}
                >
                  Tidak Sesuai
                </button>
              </div>
              {hasilError && (
                <p className="mt-1 text-[10.5px] font-medium text-red-500">
                  {hasilError}
                </p>
              )}

              {/* Keterangan — tampil setelah hasil dipilih */}
              {sudahDipilih && (
                <div className="mt-2">
                  <textarea
                    rows={isTidakSesuai ? 2 : 1}
                    value={item.keterangan}
                    onChange={(e) =>
                      onChange(item.nomor, "keterangan", e.target.value)
                    }
                    placeholder={
                      isTidakSesuai
                        ? "Jelaskan kekurangannya (wajib diisi)…"
                        : "Keterangan tambahan (opsional)…"
                    }
                    className={`w-full resize-none rounded-xs border px-2.5 py-1.5 text-[11.5px] transition-all outline-none ${
                      ketError
                        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : isTidakSesuai
                          ? "border-orange-300 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          : "border-slate-200 bg-white text-slate-600 focus:border-[#1a4e8f] focus:ring-1 focus:ring-[#1a4e8f]"
                    }`}
                  />
                  {ketError && (
                    <p className="mt-1 text-[10.5px] font-medium text-red-500">
                      {ketError}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
/*  3. DATA PENELAAH                                                   */
/* ════════════════════════════════════════════════════════════════════ */

type Role = "kasubbid" | "kabid" | "sekban";

interface SectionPenelaahProps {
  penelaah: BeritaAcaraData["penelaah"];
  onChange: (role: Role, field: "nama" | "nip", value: string) => void;
  errors: Record<string, string>;
}

const ROLES: { role: Role; label: string }[] = [
  { role: "sekban", label: "Sekretaris BPKAD" },
  { role: "kabid", label: "Kepala Bidang Perbendaharaan dan Akuntansi" },
  { role: "kasubbid", label: "Kepala Subbid Akuntansi dan Pelaporan" },
];

export function SectionPenelaah({
  penelaah,
  onChange,
  errors,
}: SectionPenelaahProps) {
  return (
    <section className="space-y-4">
      <SectionTitle>Data Penelaah</SectionTitle>

      <div className="flex items-start gap-2 rounded-xs border border-[#e2e8f2] bg-[#f7f9fc] px-2.5 py-2">
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="mt-0.5 shrink-0 text-[#7a8899]"
        >
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7.2v4" strokeLinecap="round" />
          <circle cx="8" cy="4.54" r="0.85" fill="currentColor" stroke="none" />
        </svg>
        <p className="text-[10.5px] leading-relaxed text-[#5a6474]">
          Semua kolom boleh dikosongkan — bagian yang kosong akan tampil sebagai
          titik-titik di dokumen.
        </p>
      </div>

      <div className="divide-y divide-slate-100 overflow-hidden rounded-xs border border-slate-200 bg-white shadow-sm">
        {ROLES.map(({ role, label }) => {
          const namaError = errors[`penelaah_${role}_nama`];
          const nipError = errors[`penelaah_${role}_nip`];
          const info = penelaah[role];

          return (
            <div key={role} className="p-3.5">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#1a1a2e]">
                  {label}
                </span>
                <span className="rounded-xs bg-[#f0f4fb] px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide text-[#7a8899] uppercase">
                  Opsional
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="mb-1 block text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={info.nama}
                    onChange={(e) => onChange(role, "nama", e.target.value)}
                    placeholder="Nama lengkap dengan gelar"
                    className={inputClass(!!namaError)}
                  />
                  {namaError && (
                    <p className="mt-1 text-[10.5px] font-medium text-red-500">
                      {namaError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[10.5px] font-bold tracking-wider text-[#7a8899] uppercase">
                    NIP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={info.nip}
                    onChange={(e) =>
                      onChange(role, "nip", formatNip(e.target.value))
                    }
                    placeholder="18 digit NIP"
                    maxLength={18}
                    className={`${inputClass(!!nipError)} font-mono`}
                  />
                  {nipError && (
                    <p className="mt-1 text-[10.5px] font-medium text-red-500">
                      {nipError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Helper bersama (dipakai di atas)                                   */
/* ════════════════════════════════════════════════════════════════════ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3.5 w-[3px] rounded-[1px] bg-[#1a4e8f]" aria-hidden />
      <h3 className="text-[11.5px] font-bold tracking-[0.08em] text-[#1a4e8f] uppercase">
        {children}
      </h3>
      <span className="h-px flex-1 bg-[#e8edf4]" aria-hidden />
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11.5px] font-semibold text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {hint && <p className="text-[10.5px] leading-snug text-[#7a8899]">{hint}</p>}
      {children}
      {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-xs border px-3 py-2 text-[13px] text-[#1a1a2e] outline-none transition-colors ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-500"
      : "border-slate-300 bg-white hover:border-slate-400 focus:border-[#1a4e8f] focus:ring-2 focus:ring-[#1a4e8f]/20"
  }`;
}
