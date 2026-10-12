"use client";

/* ------------------------------------------------------------------ */
/*  telaah-internal-store.tsx                                          */
/*  Store untuk modul Telaah Internal Struktural BPKAD                */
/*  (Kasubbid → Kabid → Sekban, dengan alur revisi turun berjenjang).  */
/*                                                                      */
/*  Pola mengikuti pengajuan-store.tsx:                                */
/*  - Provider tunggal di dashboard-v2/layout.tsx                      */
/*  - onSnapshot real-time ke collection "telaahInternal"              */
/*  - Aksi tulis via runTransaction untuk validasi urutan tahap        */
/*                                                                      */
/*  Aksi tersedia:                                                      */
/*   - ajukanTelaah       : Admin mulai siklus (siklusKe = 1)          */
/*   - approveTelaah      : Approve di jenjang naik (semua Sesuai)     */
/*   - revisiTelaah       : Reject (ada ≥1 Belum Sesuai)               */
/*   - teruskanRevisi     : Teruskan di jenjang turun                  */
/*   - kirimKeOPD         : Admin kirim revisi ke OPD                  */
/*   - ajukanTelaahUlang  : Admin mulai siklus baru (siklusKe++)       */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  CatatanRevisiTelaah,
  RevisiTelaahInternal,
} from "@/types/types";
import { kirimNotifikasiTelaahKeOPD } from "@/store/notifikasi-store";
import type {
  NotifikasiInternalRecord,
  TelaahInternalRecord,
  TelaahLevel,
  TelaahLogEntry,
  TelaahMilestone,
  TelaahChecklistItem,
} from "@/types/telaah-internal";
import {
  TELAAH_MILESTONE_BY_LEVEL,
  TELAAH_MILESTONE_REJECT_BY_LEVEL,
  TELAAH_MILESTONE_TERUSKAN_BY_LEVEL,
  TELAAH_NEXT_TAHAP,
  TELAAH_NOTIF_TARGET_BY_NEXT_TAHAP,
  TELAAH_TAHAP_BY_LEVEL,
  TELAAH_TAHAP_REVISI_BY_LEVEL,
  TELAAH_TAHAP_SETELAH_REJECT,
  getAksiTelaah,
} from "@/types/telaah-internal";

const TELAAH_COLLECTION = "telaahInternal";
const NOTIFIKASI_INTERNAL_COLLECTION = "notifikasiInternal";
const PENGAJUAN_COLLECTION = "pengajuan";

/* ==================== Helper — kirim notifikasi internal ==================== */

/**
 * Tulis satu dokumen ke `notifikasiInternal` lewat `addDoc` (doc ID
 * auto-generated oleh Firestore).
 */
async function kirimNotifikasiInternal(
  payload: Omit<NotifikasiInternalRecord, "id" | "dibaca" | "createdAt">,
): Promise<void> {
  const notifRef = collection(db, NOTIFIKASI_INTERNAL_COLLECTION);
  const record: Omit<NotifikasiInternalRecord, "id"> = {
    ...payload,
    dibaca: false,
    createdAt: new Date().toISOString(),
  };
  await addDoc(notifRef, record);
}

/* ==================== Helper — bangun catatan berjenjang ==================== */

/**
 * Kumpulkan SEMUA catatan revisi berjenjang dari siklus telaah SAAT INI
 * (mulai dari entry REVISI_DARI_* pertama sampai yang terakhir).
 *
 * Cara: scan riwayat[] dari BELAKANG, kumpulkan sampai ketemu
 * milestone "DIAJUKAN" atau "SIKLUS_BARU_DIMULAI" — itu penanda awal
 * siklus. Hasilnya di-reverse supaya urutan kronologis (paling lama
 * di depan).
 *
 * Dipakai untuk membangun `pengajuan.revisiTelaahInternal.catatanPerLevel`
 * supaya OPD bisa lihat siapa bilang apa.
 */
function ambilCatatanPerLevelSaatIni(
  riwayat: TelaahLogEntry[],
): CatatanRevisiTelaah[] {
  // Kumpulkan dari belakang sampai ketemu penanda awal siklus.
  const hasilTerbalik: CatatanRevisiTelaah[] = [];
  for (let i = riwayat.length - 1; i >= 0; i--) {
    const entry = riwayat[i];
    if (
      entry.milestone === "DIAJUKAN" ||
      entry.milestone === "SIKLUS_BARU_DIMULAI"
    ) {
      break; // awal siklus ini
    }
    // Ambil milestone "revisi" dan "teruskan" — abaikan approve (yang naik).
    const isRevisi = entry.milestone.startsWith("REVISI_DARI_");
    const isTeruskan = entry.milestone.startsWith("DITERUSKAN_");
    const isKirimKeOPD = entry.milestone === "DIKIRIM_KE_OPD";
    if (isRevisi || isTeruskan || isKirimKeOPD) {
      hasilTerbalik.push({
        olehLevel: entry.olehTelaahLevel as CatatanRevisiTelaah["olehLevel"],
        olehUsername: entry.olehUsername,
        catatan: entry.catatan,
        timestamp: entry.timestamp,
      });
    }
  }
  return hasilTerbalik.reverse();
}

/* ==================== Tipe input fungsi aksi ==================== */

interface PengajuanRingkas {
  id: string;
  nomorPengajuan: string;
  nomorRegistrasi: string | null;
  namaOPD: string;
  namaPenanggungJawab: string;
}

type ChecklistDokumen = Record<string, TelaahChecklistItem>;

/* ==================== Context value ==================== */

interface TelaahInternalStoreValue {
  data: TelaahInternalRecord[];
  isLoading: boolean;
  error: string | null;

  getTelaahByPengajuanId: (
    pengajuanId: string,
  ) => TelaahInternalRecord | undefined;

  /** Ajukan pengajuan ke telaah internal — mulai siklus 1. */
  ajukanTelaah: (
    pengajuan: PengajuanRingkas,
    adminUsername: string,
  ) => Promise<void>;

  /**
   * Approve — semua dokumen harus berstatus "sesuai".
   * Kalau ada yang "belum_sesuai", lempar error (harus pakai revisiTelaah).
   */
  approveTelaah: (
    telaahId: string,
    level: TelaahLevel,
    username: string,
    catatan: string,
    checklistDokumen: ChecklistDokumen,
  ) => Promise<void>;

  /**
   * Reject — minimal 1 dokumen "belum_sesuai" (wajib catatan ≥5 char).
   * State turun ke TELAAH_TAHAP_SETELAH_REJECT[level].
   */
  revisiTelaah: (
    telaahId: string,
    level: TelaahLevel,
    username: string,
    catatan: string,
    checklistDokumen: ChecklistDokumen,
  ) => Promise<void>;

  /**
   * Teruskan di jenjang turun — catatan OPSIONAL.
   * Hanya valid kalau state saat ini = TELAAH_TAHAP_REVISI_BY_LEVEL[level].
   */
  teruskanRevisi: (
    telaahId: string,
    level: TelaahLevel,
    username: string,
    catatan?: string,
  ) => Promise<void>;

  /**
   * Admin kirim revisi ke OPD — isi pengajuan.revisiTelaahInternal,
   * kirim notif ke OPD, state jadi MENUNGGU_REVISI_OPD.
   */
  kirimKeOPD: (
    telaahId: string,
    adminUsername: string,
    catatanTambahan: string,
  ) => Promise<void>;

  /**
   * Admin mulai siklus baru setelah OPD submit perbaikan.
   * State reset ke MENUNGGU_TELAAH_KASUBBID, siklusKe++, riwayat tetap.
   */
  ajukanTelaahUlang: (telaahId: string, adminUsername: string) => Promise<void>;
}

const TelaahInternalContext = createContext<TelaahInternalStoreValue | null>(
  null,
);

/* ==================== Provider ==================== */

export function TelaahInternalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TelaahInternalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Subscription real-time ──
  useEffect(() => {
    const q = query(
      collection(db, TELAAH_COLLECTION),
      orderBy("diajukanPada", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => d.data() as TelaahInternalRecord));
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Gagal membaca telaah internal:", err);
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  // ── Read helper ──
  const getTelaahByPengajuanId = useCallback(
    (pengajuanId: string) => data.find((t) => t.pengajuanId === pengajuanId),
    [data],
  );

  // ── Aksi 1: Ajukan telaah (siklus 1) ──
  const ajukanTelaah = useCallback(
    async (pengajuan: PengajuanRingkas, adminUsername: string) => {
      const telaahRef = doc(db, TELAAH_COLLECTION, pengajuan.id);
      const nowIso = new Date().toISOString();

      const logEntry: TelaahLogEntry = {
        milestone: "DIAJUKAN",
        olehUsername: adminUsername,
        olehTelaahLevel: "admin",
        catatan: "",
        timestamp: nowIso,
      };

      const record: TelaahInternalRecord = {
        id: pengajuan.id,
        pengajuanId: pengajuan.id,
        nomorPengajuan: pengajuan.nomorPengajuan,
        nomorRegistrasi: pengajuan.nomorRegistrasi ?? "",
        namaOPD: pengajuan.namaOPD,
        namaPenanggungJawab: pengajuan.namaPenanggungJawab,
        diajukanOleh: adminUsername,
        diajukanPada: nowIso,
        tahapSaatIni: "MENUNGGU_TELAAH_KASUBBID",
        selesai: false,
        selesaiPada: null,
        riwayat: [logEntry],
        siklusKe: 1,
      };

      await runTransaction(db, async (tx) => {
        const existing = await tx.get(telaahRef);
        if (existing.exists()) {
          throw new Error(
            "Pengajuan ini sudah pernah diajukan telaah internal — satu pengajuan hanya bisa satu siklus telaah.",
          );
        }
        tx.set(telaahRef, record);
      });

      await kirimNotifikasiInternal({
        targetUsername: "kasubbid",
        targetLevel: "kasubbid",
        telaahId: pengajuan.id,
        pengajuanId: pengajuan.id,
        nomorPengajuan: pengajuan.nomorPengajuan,
        nomorRegistrasi: pengajuan.nomorRegistrasi ?? "",
        milestone: "DIAJUKAN",
        judul: "Pengajuan baru menunggu telaah Anda",
        pesan: `Pengajuan ${
          pengajuan.nomorRegistrasi ?? pengajuan.nomorPengajuan
        } dari ${pengajuan.namaOPD} baru diajukan untuk telaah internal.`,
      });
    },
    [],
  );

  // ── Aksi 2: Approve telaah (jenjang naik) ──
  const approveTelaah = useCallback(
    async (
      telaahId: string,
      level: TelaahLevel,
      username: string,
      catatan: string,
      checklistDokumen: ChecklistDokumen,
    ) => {
      const telaahRef = doc(db, TELAAH_COLLECTION, telaahId);
      const nowIso = new Date().toISOString();
      const expectedTahap = TELAAH_TAHAP_BY_LEVEL[level];
      const milestone = TELAAH_MILESTONE_BY_LEVEL[level];

      const updatedRecord = await runTransaction(db, async (tx) => {
        const snap = await tx.get(telaahRef);
        if (!snap.exists()) throw new Error("Data telaah tidak ditemukan.");
        const current = snap.data() as TelaahInternalRecord;

        if (current.selesai) {
          throw new Error(
            "Telaah ini sudah selesai — tidak ada tahap lagi setelah Sekban.",
          );
        }
        if (current.tahapSaatIni !== expectedTahap) {
          throw new Error(
            `Tahap tidak sesuai. Saat ini: "${current.tahapSaatIni}", seharusnya: "${expectedTahap}". Mungkin sudah diproses pengguna lain.`,
          );
        }

        // Validasi: approve hanya boleh kalau semua dokumen "sesuai".
        const adaBelumSesuai = Object.values(checklistDokumen).some(
          (item) => item.status === "belum_sesuai",
        );
        if (adaBelumSesuai) {
          throw new Error(
            "Tidak bisa Approve — masih ada dokumen berstatus 'Belum Sesuai'. Gunakan tombol Revisi.",
          );
        }

        const logEntry: TelaahLogEntry = {
          milestone,
          olehUsername: username,
          olehTelaahLevel: level,
          catatan: catatan.trim(),
          timestamp: nowIso,
          ...(Object.keys(checklistDokumen).length > 0
            ? { checklistDokumen }
            : {}),
        };

        const nextTahap = TELAAH_NEXT_TAHAP[expectedTahap];
        const isSelesai = nextTahap === "SELESAI";

        const updates = {
          tahapSaatIni: nextTahap,
          riwayat: [...current.riwayat, logEntry],
          selesai: isSelesai,
          selesaiPada: isSelesai ? nowIso : null,
        };

        tx.update(telaahRef, updates);
        return { ...current, ...updates } as TelaahInternalRecord;
      });

      const nextTargetUsername =
        TELAAH_NOTIF_TARGET_BY_NEXT_TAHAP[updatedRecord.tahapSaatIni];
      const nextTargetLevel: TelaahLevel | "admin" =
        updatedRecord.tahapSaatIni === "SELESAI"
          ? "admin"
          : (nextTargetUsername as TelaahLevel);

      const isSelesai = updatedRecord.tahapSaatIni === "SELESAI";
      const identitas =
        updatedRecord.nomorRegistrasi || updatedRecord.nomorPengajuan;

      await kirimNotifikasiInternal({
        targetUsername: nextTargetUsername,
        targetLevel: nextTargetLevel,
        telaahId: updatedRecord.id,
        pengajuanId: updatedRecord.pengajuanId,
        nomorPengajuan: updatedRecord.nomorPengajuan,
        nomorRegistrasi: updatedRecord.nomorRegistrasi,
        milestone:
          updatedRecord.riwayat[updatedRecord.riwayat.length - 1].milestone,
        judul: isSelesai
          ? "Telaah internal selesai"
          : "Pengajuan menunggu telaah Anda",
        pesan: isSelesai
          ? `Telaah internal untuk ${identitas} (${updatedRecord.namaOPD}) telah selesai di tahap Sekban.`
          : `Pengajuan ${identitas} dari ${updatedRecord.namaOPD} menunggu telaah Anda.`,
      });
    },
    [],
  );

  // ── Aksi 3: Revisi telaah (reject, jenjang turun) ──
  const revisiTelaah = useCallback(
    async (
      telaahId: string,
      level: TelaahLevel,
      username: string,
      catatan: string,
      checklistDokumen: ChecklistDokumen,
    ) => {
      const telaahRef = doc(db, TELAAH_COLLECTION, telaahId);
      const nowIso = new Date().toISOString();
      const expectedTahap = TELAAH_TAHAP_BY_LEVEL[level];
      const milestone = TELAAH_MILESTONE_REJECT_BY_LEVEL[level];
      const tahapSetelah = TELAAH_TAHAP_SETELAH_REJECT[level];

      const updatedRecord = await runTransaction(db, async (tx) => {
        const snap = await tx.get(telaahRef);
        if (!snap.exists()) throw new Error("Data telaah tidak ditemukan.");
        const current = snap.data() as TelaahInternalRecord;

        if (current.selesai) {
          throw new Error("Telaah ini sudah selesai.");
        }
        if (current.tahapSaatIni !== expectedTahap) {
          throw new Error(
            `Tahap tidak sesuai. Saat ini: "${current.tahapSaatIni}", seharusnya: "${expectedTahap}".`,
          );
        }

        // Validasi: minimal 1 dokumen "belum_sesuai".
        const items = Object.values(checklistDokumen);
        const adaBelumSesuai = items.some(
          (item) => item.status === "belum_sesuai",
        );
        if (!adaBelumSesuai) {
          throw new Error(
            "Tidak bisa Revisi — semua dokumen sudah 'Sesuai'. Gunakan tombol Approve.",
          );
        }

        // Validasi: setiap "belum_sesuai" wajib catatan ≥5 karakter.
        for (const item of items) {
          if (
            item.status === "belum_sesuai" &&
            item.catatan.trim().length < 5
          ) {
            throw new Error(
              "Setiap dokumen 'Belum Sesuai' wajib diberi catatan minimal 5 karakter.",
            );
          }
        }

        const logEntry: TelaahLogEntry = {
          milestone,
          olehUsername: username,
          olehTelaahLevel: level,
          catatan: catatan.trim(),
          timestamp: nowIso,
          checklistDokumen,
        };

        const updates = {
          tahapSaatIni: tahapSetelah,
          riwayat: [...current.riwayat, logEntry],
        };

        tx.update(telaahRef, updates);
        return { ...current, ...updates } as TelaahInternalRecord;
      });

      // Notif ke target berikutnya (kabid / kasubbid / admin).
      const targetUsername = TELAAH_NOTIF_TARGET_BY_NEXT_TAHAP[tahapSetelah];
      const targetLevel: TelaahLevel | "admin" =
        targetUsername === "admin" ? "admin" : (targetUsername as TelaahLevel);

      const identitas =
        updatedRecord.nomorRegistrasi || updatedRecord.nomorPengajuan;

      await kirimNotifikasiInternal({
        targetUsername,
        targetLevel,
        telaahId: updatedRecord.id,
        pengajuanId: updatedRecord.pengajuanId,
        nomorPengajuan: updatedRecord.nomorPengajuan,
        nomorRegistrasi: updatedRecord.nomorRegistrasi,
        milestone,
        judul: "Pengajuan perlu ditindaklanjuti (revisi)",
        pesan: `Telaah ${identitas} dari ${updatedRecord.namaOPD} dikembalikan untuk direvisi oleh ${level}. Mohon ditindaklanjuti.`,
      });
    },
    [],
  );

  // ── Aksi 4: Teruskan revisi (jenjang turun) ──
  const teruskanRevisi = useCallback(
    async (
      telaahId: string,
      level: TelaahLevel,
      username: string,
      catatan?: string,
    ) => {
      const telaahRef = doc(db, TELAAH_COLLECTION, telaahId);
      const nowIso = new Date().toISOString();
      const expectedTahap = TELAAH_TAHAP_REVISI_BY_LEVEL[level];
      const milestone = TELAAH_MILESTONE_TERUSKAN_BY_LEVEL[level];

      if (!expectedTahap || !milestone) {
        throw new Error(
          `Level "${level}" tidak bisa meneruskan revisi (hanya kasubbid & kabid).`,
        );
      }

      const updatedRecord = await runTransaction(db, async (tx) => {
        const snap = await tx.get(telaahRef);
        if (!snap.exists()) throw new Error("Data telaah tidak ditemukan.");
        const current = snap.data() as TelaahInternalRecord;

        if (current.tahapSaatIni !== expectedTahap) {
          throw new Error(
            `Tahap tidak sesuai. Saat ini: "${current.tahapSaatIni}", seharusnya: "${expectedTahap}".`,
          );
        }

        const logEntry: TelaahLogEntry = {
          milestone,
          olehUsername: username,
          olehTelaahLevel: level,
          catatan: catatan?.trim() ?? "",
          timestamp: nowIso,
        };

        const nextTahap = TELAAH_NEXT_TAHAP[expectedTahap];

        const updates = {
          tahapSaatIni: nextTahap,
          riwayat: [...current.riwayat, logEntry],
        };

        tx.update(telaahRef, updates);
        return { ...current, ...updates } as TelaahInternalRecord;
      });

      const targetUsername =
        TELAAH_NOTIF_TARGET_BY_NEXT_TAHAP[updatedRecord.tahapSaatIni];
      const targetLevel: TelaahLevel | "admin" =
        targetUsername === "admin" ? "admin" : (targetUsername as TelaahLevel);

      const identitas =
        updatedRecord.nomorRegistrasi || updatedRecord.nomorPengajuan;

      await kirimNotifikasiInternal({
        targetUsername,
        targetLevel,
        telaahId: updatedRecord.id,
        pengajuanId: updatedRecord.pengajuanId,
        nomorPengajuan: updatedRecord.nomorPengajuan,
        nomorRegistrasi: updatedRecord.nomorRegistrasi,
        milestone,
        judul: "Revisi telaah diteruskan",
        pesan: `Revisi telaah ${identitas} dari ${updatedRecord.namaOPD} diteruskan oleh ${level}. Mohon ditindaklanjuti.`,
      });
    },
    [],
  );

  // ── Aksi 5: Admin kirim revisi ke OPD ──
  const kirimKeOPD = useCallback(
    async (
      telaahId: string,
      adminUsername: string,
      catatanTambahan: string,
    ) => {
      const telaahRef = doc(db, TELAAH_COLLECTION, telaahId);
      const nowIso = new Date().toISOString();

      // Ambil pengajuan dulu — butuh opdId, nomorRegistrasi, dll untuk
      // membangun revisiTelaahInternal & notif ke OPD.
      const pengajuanRef = doc(db, PENGAJUAN_COLLECTION, telaahId);
      const pengajuanSnap = await getDoc(pengajuanRef);
      if (!pengajuanSnap.exists()) {
        throw new Error("Pengajuan tidak ditemukan.");
      }
      const pengajuan =
        pengajuanSnap.data() as FormulirPenghapusanPiutangOPDRecord;

      const updatedRecord = await runTransaction(db, async (tx) => {
        const snap = await tx.get(telaahRef);
        if (!snap.exists()) throw new Error("Data telaah tidak ditemukan.");
        const current = snap.data() as TelaahInternalRecord;

        if (current.tahapSaatIni !== "MENUNGGU_ADMIN_KIRIM_REVISI") {
          throw new Error(
            `Tahap tidak sesuai. Saat ini: "${current.tahapSaatIni}", seharusnya: "MENUNGGU_ADMIN_KIRIM_REVISI".`,
          );
        }

        const logEntry: TelaahLogEntry = {
          milestone: "DIKIRIM_KE_OPD",
          olehUsername: adminUsername,
          olehTelaahLevel: "admin",
          catatan: catatanTambahan.trim(),
          timestamp: nowIso,
        };

        const updates = {
          tahapSaatIni: "MENUNGGU_REVISI_OPD" as const,
          riwayat: [...current.riwayat, logEntry],
        };

        tx.update(telaahRef, updates);
        return { ...current, ...updates } as TelaahInternalRecord;
      });

      // Bangun catatanPerLevel dari riwayat siklus ini.
      const catatanPerLevel = ambilCatatanPerLevelSaatIni(
        updatedRecord.riwayat,
      );

      // Update pengajuan: set revisiTelaahInternal.
      const revisiTelaahInternal: RevisiTelaahInternal = {
        aktif: true,
        telaahId,
        dikirimOleh: adminUsername,
        dikirimPada: nowIso,
        catatanPerLevel,
      };
      await updateDoc(pengajuanRef, {
        revisiTelaahInternal,
        updatedAt: nowIso,
      });

      // Notif ke OPD — pakai koleksi notifikasiOPD (dengan tipe khusus).
      await kirimNotifikasiTelaahKeOPD(
        {
          id: pengajuan.id,
          opdId: pengajuan.opdId,
          nomorPengajuan: pengajuan.nomorPengajuan,
          nomorRegistrasi: pengajuan.nomorRegistrasi,
        },
        catatanTambahan.trim(),
      );
    },
    [],
  );

  // ── Aksi 6: Ajukan telaah ulang (siklus baru) ──
  const ajukanTelaahUlang = useCallback(
    async (telaahId: string, adminUsername: string) => {
      const telaahRef = doc(db, TELAAH_COLLECTION, telaahId);
      const nowIso = new Date().toISOString();

      const updatedRecord = await runTransaction(db, async (tx) => {
        const snap = await tx.get(telaahRef);
        if (!snap.exists()) throw new Error("Data telaah tidak ditemukan.");
        const current = snap.data() as TelaahInternalRecord;

        if (current.tahapSaatIni !== "MENUNGGU_REVISI_OPD") {
          throw new Error(
            `Tahap tidak sesuai. Saat ini: "${current.tahapSaatIni}", seharusnya: "MENUNGGU_REVISI_OPD". Pengajuan ini belum siap diajukan ulang — mungkin OPD belum submit perbaikan.`,
          );
        }

        const logEntry: TelaahLogEntry = {
          milestone: "SIKLUS_BARU_DIMULAI",
          olehUsername: adminUsername,
          olehTelaahLevel: "admin",
          catatan: "",
          timestamp: nowIso,
        };

        const updates = {
          tahapSaatIni: "MENUNGGU_TELAAH_KASUBBID" as const,
          riwayat: [...current.riwayat, logEntry],
          siklusKe: increment(1),
          selesai: false,
          selesaiPada: null,
        };

        tx.update(telaahRef, updates);

        // Return state final untuk dipakai setelah transaction.
        // `siklusKe` disini masih nilai LAMA — increment() dieksekusi
        // di server. Jadi manual +1 untuk return value.
        return {
          ...current,
          ...updates,
          siklusKe: (current.siklusKe ?? 1) + 1,
        } as TelaahInternalRecord;
      });

      const identitas =
        updatedRecord.nomorRegistrasi || updatedRecord.nomorPengajuan;

      await kirimNotifikasiInternal({
        targetUsername: "kasubbid",
        targetLevel: "kasubbid",
        telaahId: updatedRecord.id,
        pengajuanId: updatedRecord.pengajuanId,
        nomorPengajuan: updatedRecord.nomorPengajuan,
        nomorRegistrasi: updatedRecord.nomorRegistrasi,
        milestone: "SIKLUS_BARU_DIMULAI",
        judul: "Pengajuan menunggu telaah Anda (siklus baru)",
        pesan: `Siklus ke-${updatedRecord.siklusKe} telaah internal untuk ${identitas} (${updatedRecord.namaOPD}) dimulai. Mohon ditelaah kembali.`,
      });
    },
    [],
  );

  const value = useMemo<TelaahInternalStoreValue>(
    () => ({
      data,
      isLoading,
      error,
      getTelaahByPengajuanId,
      ajukanTelaah,
      approveTelaah,
      revisiTelaah,
      teruskanRevisi,
      kirimKeOPD,
      ajukanTelaahUlang,
    }),
    [
      data,
      isLoading,
      error,
      getTelaahByPengajuanId,
      ajukanTelaah,
      approveTelaah,
      revisiTelaah,
      teruskanRevisi,
      kirimKeOPD,
      ajukanTelaahUlang,
    ],
  );

  return (
    <TelaahInternalContext.Provider value={value}>
      {children}
    </TelaahInternalContext.Provider>
  );
}

/* ==================== Hook ==================== */

export function useTelaahInternalStore(): TelaahInternalStoreValue {
  const ctx = useContext(TelaahInternalContext);
  if (!ctx) {
    throw new Error(
      "useTelaahInternalStore() harus dipanggil di dalam <TelaahInternalProvider> (dipasang di src/app/dashboard-v2/layout.tsx).",
    );
  }
  return ctx;
}
