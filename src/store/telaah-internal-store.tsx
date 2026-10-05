"use client";

/* ------------------------------------------------------------------ */
/*  telaah-internal-store.tsx                                          */
/*  Store untuk modul Telaah Internal Struktural BPKAD                */
/*  (Kasubbid → Kabid → Sekban).                                       */
/*                                                                      */
/*  Pola mengikuti pengajuan-store.tsx:                                */
/*  - Provider tunggal di dashboard-v2/layout.tsx (bukan root)         */
/*  - onSnapshot real-time ke collection "telaahInternal"              */
/*  - Aksi tulis via runTransaction untuk validasi urutan tahap        */
/*                                                                      */
/*  Tidak menyentuh collection existing apapun (pengajuan,             */
/*  notifikasiOPD, riwayatRevisi, counters).                           */
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
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  NotifikasiInternalRecord,
  TelaahInternalRecord,
  TelaahLevel,
  TelaahLogEntry,
} from "@/types/telaah-internal";
import {
  TELAAH_MILESTONE_BY_LEVEL,
  TELAAH_NEXT_TAHAP,
  TELAAH_NOTIF_TARGET_BY_NEXT_TAHAP,
  TELAAH_TAHAP_BY_LEVEL,
} from "@/types/telaah-internal";

const TELAAH_COLLECTION = "telaahInternal";
const NOTIFIKASI_INTERNAL_COLLECTION = "notifikasiInternal";

/* ==================== Helper — kirim notifikasi ==================== */

/**
 * Tulis satu dokumen ke `notifikasiInternal` lewat `addDoc` (doc ID
 * auto-generated oleh Firestore).
 *
 * Dipisah dari fungsi utama supaya:
 *  - format notif gampang diubah dari satu tempat,
 *  - unit test lebih mudah (mock `addDoc` cukup di satu spot).
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

/* ==================== Tipe input fungsi aksi ==================== */

/**
 * Data minimal pengajuan yang dibutuhkan saat mengajukan telaah.
 * Sengaja tidak pakai `FormulirPenghapusanPiutangOPDRecord` penuh supaya
 * pemanggil tidak perlu passing seluruh objek (cukup field yang relevan).
 */
interface PengajuanRingkas {
  id: string;
  nomorPengajuan: string;
  nomorRegistrasi: string | null;
  namaOPD: string;
  namaPenanggungJawab: string;
}

/* ==================== Context value ==================== */

interface TelaahInternalStoreValue {
  /** Semua dokumen telaah internal, real-time dari Firestore. */
  data: TelaahInternalRecord[];
  /** True selama snapshot pertama belum diterima. */
  isLoading: boolean;
  /** Pesan error bila listener/operasi Firestore gagal. */
  error: string | null;

  /** Cari telaah berdasarkan pengajuanId (== doc ID). */
  getTelaahByPengajuanId: (
    pengajuanId: string,
  ) => TelaahInternalRecord | undefined;

  /**
   * Ajukan pengajuan (status teregistrasi) ke telaah internal.
   * Gagal bila pengajuan sudah pernah diajukan — diproteksi oleh
   * Firestore transaction (baca dulu, baru tulis).
   *
   * Setelah record dibuat, otomatis kirim notifikasi ke Kasubbid.
   */
  ajukanTelaah: (
    pengajuan: PengajuanRingkas,
    adminUsername: string,
  ) => Promise<void>;

  /**
   * Approve telaah di tahap `level` user. Transaction-safe:
   *  - Cek `!selesai` (tidak ada tahap setelah Sekban),
   *  - Cek `tahapSaatIni === TELAAH_TAHAP_BY_LEVEL[level]` (urutan wajib),
   *  - Append log entry ke `riwayat`,
   *  - Update `tahapSaatIni`, `selesai`, `selesaiPada`.
   *
   * Setelah commit, otomatis kirim notifikasi ke target selanjutnya
   * (kabid / sekban / admin).
   */
  approveTelaah: (
    telaahId: string,
    level: TelaahLevel,
    username: string,
    catatan: string,
  ) => Promise<void>;
}

const TelaahInternalContext = createContext<TelaahInternalStoreValue | null>(
  null,
);

/* ==================== Provider ==================== */

export function TelaahInternalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TelaahInternalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Subscription real-time ke collection "telaahInternal" ──
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

  // ── Aksi 1: Ajukan telaah ──
  const ajukanTelaah = useCallback(
    async (pengajuan: PengajuanRingkas, adminUsername: string) => {
      // Doc ID = pengajuanId → deterministik, otomatis cegah duplikat.
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
      };

      // Transaction: baca dulu (cek existing), baru tulis. Aman dari
      // double-submit (dua admin klik "Ajukan" hampir bersamaan).
      await runTransaction(db, async (tx) => {
        const existing = await tx.get(telaahRef);
        if (existing.exists()) {
          throw new Error(
            "Pengajuan ini sudah pernah diajukan telaah internal — satu pengajuan hanya bisa satu siklus telaah.",
          );
        }
        tx.set(telaahRef, record);
      });

      // Setelah transaction commit, kirim notifikasi ke Kasubbid.
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

  // ── Aksi 2: Approve telaah ──
  const approveTelaah = useCallback(
    async (
      telaahId: string,
      level: TelaahLevel,
      username: string,
      catatan: string,
    ) => {
      const telaahRef = doc(db, TELAAH_COLLECTION, telaahId);
      const nowIso = new Date().toISOString();
      const expectedTahap = TELAAH_TAHAP_BY_LEVEL[level];
      const milestone = TELAAH_MILESTONE_BY_LEVEL[level];

      // Ambil hasil transaction sebagai return value (Firestore
      // runTransaction mendukung ini) — lebih bersih dari mutable
      // closure variable & TypeScript bisa narrowing langsung.
      const updatedRecord = await runTransaction(db, async (tx) => {
        // Aturan Firestore: semua tx.get() dipanggil sebelum tx.set/update.
        const snap = await tx.get(telaahRef);
        if (!snap.exists()) {
          throw new Error("Data telaah tidak ditemukan.");
        }
        const current = snap.data() as TelaahInternalRecord;

        // ── Validasi urutan tahap — enforcement utama ──
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

        const logEntry: TelaahLogEntry = {
          milestone,
          olehUsername: username,
          olehTelaahLevel: level,
          catatan: catatan.trim(),
          timestamp: nowIso,
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

        // Return state final untuk dipakai di luar transaction (kirim notif).
        return { ...current, ...updates } as TelaahInternalRecord;
      });

      // ── Setelah transaction commit, kirim notifikasi ──
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

  const value = useMemo<TelaahInternalStoreValue>(
    () => ({
      data,
      isLoading,
      error,
      getTelaahByPengajuanId,
      ajukanTelaah,
      approveTelaah,
    }),
    [
      data,
      isLoading,
      error,
      getTelaahByPengajuanId,
      ajukanTelaah,
      approveTelaah,
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
