"use client";

/* ------------------------------------------------------------------ */
/*  notifikasi-store.tsx                                               */
/*  Notifikasi untuk OPD (verifikasi BPKAD & revisi telaah internal).  */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  FormulirPenghapusanPiutangOPDRecord,
  NotifikasiOPD,
  StatusFormulir,
} from "@/types/types";

const NOTIFIKASI_COLLECTION = "notifikasiOPD";

function buatPesanVerifikasi(
  status: StatusFormulir,
  nomorPengajuan: string,
  catatan?: string,
): { judul: string; pesan: string } {
  if (status === "teregistrasi") {
    return {
      judul: "Pengajuan Anda telah teregistrasi",
      pesan: `Pengajuan ${nomorPengajuan} telah lolos verifikasi dan resmi teregistrasi.`,
    };
  }
  if (status === "revisi") {
    return {
      judul: "Pengajuan Anda perlu direvisi",
      pesan: catatan
        ? `Pengajuan ${nomorPengajuan} dikembalikan untuk revisi. Catatan verifikator: ${catatan}`
        : `Pengajuan ${nomorPengajuan} dikembalikan untuk revisi.`,
    };
  }
  return {
    judul: "Status pengajuan Anda diperbarui",
    pesan: `Pengajuan ${nomorPengajuan} sekarang berstatus "${status}".`,
  };
}

export async function kirimNotifikasiVerifikasi(
  pengajuan: Pick<
    FormulirPenghapusanPiutangOPDRecord,
    "id" | "opdId" | "nomorPengajuan"
  >,
  statusBaru: StatusFormulir,
  catatan?: string,
): Promise<void> {
  const { judul, pesan } = buatPesanVerifikasi(
    statusBaru,
    pengajuan.nomorPengajuan,
    catatan,
  );

  const notifikasiBaru: Omit<NotifikasiOPD, "id"> = {
    opdId: pengajuan.opdId,
    pengajuanId: pengajuan.id,
    nomorPengajuan: pengajuan.nomorPengajuan,
    status: statusBaru,
    tipe: "verifikasi",
    judul,
    pesan,
    dibaca: false,
    createdAt: new Date().toISOString(),
  };

  await addDoc(collection(db, NOTIFIKASI_COLLECTION), notifikasiBaru);
}

/**
 * Notifikasi ke OPD saat Admin mengirim revisi dari TELAAH INTERNAL.
 * Status tetap "teregistrasi", tipe khusus "telaah_internal".
 */
export async function kirimNotifikasiTelaahKeOPD(
  pengajuan: Pick<
    FormulirPenghapusanPiutangOPDRecord,
    "id" | "opdId" | "nomorPengajuan" | "nomorRegistrasi"
  >,
  catatanAdmin: string,
): Promise<void> {
  const identitas = pengajuan.nomorRegistrasi ?? pengajuan.nomorPengajuan;
  const judul = "Pengajuan Anda perlu direvisi (Telaah Internal)";
  const pesan = catatanAdmin
    ? `Pengajuan ${identitas} dikembalikan untuk direvisi setelah telaah internal. Catatan dari BPKAD: ${catatanAdmin}`
    : `Pengajuan ${identitas} dikembalikan untuk direvisi setelah telaah internal. Silakan periksa catatan dari telaah.`;

  const notifikasiBaru: Omit<NotifikasiOPD, "id"> = {
    opdId: pengajuan.opdId,
    pengajuanId: pengajuan.id,
    nomorPengajuan: pengajuan.nomorPengajuan,
    status: "teregistrasi",
    tipe: "telaah_internal",
    judul,
    pesan,
    dibaca: false,
    createdAt: new Date().toISOString(),
  };

  await addDoc(collection(db, NOTIFIKASI_COLLECTION), notifikasiBaru);
}

interface UseNotifikasiOPDResult {
  data: NotifikasiOPD[];
  unreadCount: number;
  isLoading: boolean;
  tandaiDibaca: (id: string) => Promise<void>;
  tandaiSemuaDibaca: () => Promise<void>;
}

export function useNotifikasiOPD(
  opdId: string | undefined,
): UseNotifikasiOPDResult {
  const [data, setData] = useState<NotifikasiOPD[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!opdId) return;

    const q = query(
      collection(db, NOTIFIKASI_COLLECTION),
      where("opdId", "==", opdId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(
          snapshot.docs.map(
            (docSnap) =>
              ({ id: docSnap.id, ...docSnap.data() }) as NotifikasiOPD,
          ),
        );
        setIsLoading(false);
      },
      (err) => {
        console.error("Gagal membaca notifikasi OPD:", err);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [opdId]);

  const effectiveData = opdId ? data : [];
  const effectiveIsLoading = opdId ? isLoading : false;

  const tandaiDibaca = async (id: string) => {
    await updateDoc(doc(db, NOTIFIKASI_COLLECTION, id), { dibaca: true });
  };

  const tandaiSemuaDibaca = async () => {
    const belumDibaca = effectiveData.filter((n) => !n.dibaca);
    if (belumDibaca.length === 0) return;
    const batch = writeBatch(db);
    belumDibaca.forEach((n) =>
      batch.update(doc(db, NOTIFIKASI_COLLECTION, n.id), { dibaca: true }),
    );
    await batch.commit();
  };

  const unreadCount = effectiveData.filter((n) => !n.dibaca).length;

  return {
    data: effectiveData,
    unreadCount,
    isLoading: effectiveIsLoading,
    tandaiDibaca,
    tandaiSemuaDibaca,
  };
}
