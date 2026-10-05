"use client";

/* ------------------------------------------------------------------ */
/*  test-telaah/page.tsx                                               */
/*  ⚠️ FILE TEST SEMENTARA — HAPUS SETELAH VERIFIKASI LANGKAH 2.3     */
/*                                                                      */
/*  Tujuan: membuktikan end-to-end Firestore write/read store telaah   */
/*  internal + notifikasi internal BERFUNGSI sebelum UI dibuat.        */
/*                                                                      */
/*  Catatan teknis:                                                     */
/*  Dummy ID di-generate SAAT KLIK (bukan di module scope / useEffect)  */
/*  supaya:                                                             */
/*    1. Tidak ada hydration mismatch (server & client initial render   */
/*       sama-sama null).                                               */
/*    2. Tidak ada ESLint warning "synchronous setState in effect"      */
/*       (setState dipanggil dari event handler, bukan effect body).    */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import {
  TelaahInternalProvider,
  useTelaahInternalStore,
} from "@/store/telaah-internal-store";
import { useNotifikasiInternal } from "@/store/notifikasi-internal-store";
import type { TelaahLevel } from "@/types/telaah-internal";

/* ==================== Panel untuk menampilkan data store ==================== */
function PanelData() {
  const store = useTelaahInternalStore();

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <h3 className="mb-2 font-bold text-gray-800">📊 Store Telaah Internal</h3>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-gray-500">isLoading:</span>{" "}
          <span className="font-mono">{String(store.isLoading)}</span>
        </p>
        <p>
          <span className="text-gray-500">error:</span>{" "}
          <span className="font-mono text-red-600">
            {store.error ?? "(tidak ada)"}
          </span>
        </p>
        <p>
          <span className="text-gray-500">Jumlah dokumen:</span>{" "}
          <span className="font-mono font-bold">{store.data.length}</span>
        </p>
      </div>

      {store.data.length > 0 && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
            Daftar Telaah
          </p>
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {store.data.map((t) => (
              <div
                key={t.id}
                className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 font-mono text-xs"
              >
                <p>
                  <span className="text-gray-500">id:</span> {t.id}
                </p>
                <p>
                  <span className="text-gray-500">tahapSaatIni:</span>{" "}
                  <span className="font-bold text-blue-700">
                    {t.tahapSaatIni}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">selesai:</span>{" "}
                  {String(t.selesai)}
                </p>
                <p>
                  <span className="text-gray-500">riwayat.length:</span>{" "}
                  {t.riwayat.length}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== Panel untuk test notifikasi ==================== */
function PanelNotif({ username }: { username: string }) {
  const notif = useNotifikasiInternal(username);

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <h3 className="mb-2 font-bold text-gray-800">
        🔔 Notifikasi untuk {username}
      </h3>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-gray-500">isLoading:</span>{" "}
          <span className="font-mono">{String(notif.isLoading)}</span>
        </p>
        <p>
          <span className="text-gray-500">unreadCount:</span>{" "}
          <span className="font-mono font-bold text-red-600">
            {notif.unreadCount}
          </span>
        </p>
        <p>
          <span className="text-gray-500">Total:</span>{" "}
          <span className="font-mono">{notif.data.length}</span>
        </p>
      </div>

      {notif.data.length > 0 && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
            Daftar Notifikasi
          </p>
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {notif.data.map((n) => (
              <div
                key={n.id}
                className={`rounded border px-2 py-1.5 text-xs ${
                  n.dibaca
                    ? "border-gray-200 bg-gray-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <p className="font-bold">{n.judul}</p>
                <p className="text-gray-600">{n.pesan}</p>
                <p className="mt-0.5 font-mono text-[10px] text-gray-400">
                  {n.id.slice(0, 8)}... · {n.milestone}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== Panel aksi (tombol test) ==================== */
function PanelAksi() {
  const store = useTelaahInternalStore();
  const [log, setLog] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [adminUsername, setAdminUsername] = useState("admin");

  // ── Dummy ID disimpan di state, TAPI di-generate di event handler ──
  // (bukan di module scope / useEffect). Initial value null → server &
  // client render identik → hydration cocok. Setelah klik pertama,
  // ID di-set dan tombol approve baru bisa dipakai.
  const [activeDummyId, setActiveDummyId] = useState<string | null>(null);

  const appendLog = (msg: string) => {
    setLog((prev) => [
      `[${new Date().toLocaleTimeString("id-ID")}] ${msg}`,
      ...prev,
    ]);
  };

  const handleAjukan = async () => {
    if (isBusy) return;

    // Generate ID baru SETIAP kali klik "Ajukan Telaah" — supaya bisa
    // test ulang tanpa harus refresh halaman. Timestamp cukup unik
    // (ms resolution) untuk menghindari bentrok dengan test sebelumnya
    // (kecuali user klik 2x dalam 1 ms — tidak realistis).
    const newId = "test-pengajuan-" + Date.now();
    setActiveDummyId(newId);

    const pengajuanDummy = {
      id: newId,
      nomorPengajuan: "999/PENGAJUAN/TEST/10/2026",
      nomorRegistrasi: "999/REG-PUSPITA/TEST/10/2026",
      namaOPD: "Dinas Testing (Dummy)",
      namaPenanggungJawab: "Testing Bot",
    };

    setIsBusy(true);
    try {
      appendLog(
        `⏳ Mengajukan telaah untuk ${pengajuanDummy.nomorRegistrasi}...`,
      );
      await store.ajukanTelaah(pengajuanDummy, adminUsername);
      appendLog(`✅ Sukses ajukan telaah (ID: ${newId})`);
    } catch (err) {
      appendLog(
        `❌ Gagal ajukan: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleApprove = async (level: TelaahLevel) => {
    if (isBusy || !activeDummyId) return;
    setIsBusy(true);
    try {
      appendLog(`⏳ Approve sebagai ${level}...`);
      await store.approveTelaah(
        activeDummyId,
        level,
        level,
        `Catatan test dari ${level}`,
      );
      appendLog(`✅ Sukses approve sebagai ${level}`);
    } catch (err) {
      appendLog(
        `❌ Gagal approve: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetId = () => {
    setActiveDummyId(null);
    appendLog("ℹ️ Dummy ID di-reset — klik Ajukan Telaah untuk ID baru.");
  };

  const handleResetInfo = () => {
    appendLog(
      "ℹ️ Reset manual: buka Firebase Console dan hapus doc telaah + notif test.",
    );
  };

  const handleClearLocalStorage = () => {
    localStorage.removeItem("si-puspita-session");
    appendLog("ℹ️ LocalStorage session dibersihkan");
  };

  const currentTelaah = activeDummyId
    ? store.getTelaahByPengajuanId(activeDummyId)
    : undefined;

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <h3 className="mb-3 font-bold text-gray-800">🎬 Aksi Testing</h3>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Username Admin (untuk diajukanOleh)
          </label>
          <input
            type="text"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>

        <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs">
          <p className="font-bold text-amber-800">Dummy ID aktif:</p>
          <p className="font-mono break-all text-amber-700">
            {activeDummyId ?? "(belum ada — klik Ajukan Telaah)"}
          </p>
        </div>

        {currentTelaah && (
          <div className="rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs">
            <p className="font-bold text-blue-800">Tahap saat ini:</p>
            <p className="font-mono text-blue-700">
              {currentTelaah.tahapSaatIni}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAjukan}
            disabled={isBusy}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            1️⃣ Ajukan Telaah
          </button>
          <button
            onClick={() => handleApprove("kasubbid")}
            disabled={isBusy || !activeDummyId}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            2️⃣ Approve Kasubbid
          </button>
          <button
            onClick={() => handleApprove("kabid")}
            disabled={isBusy || !activeDummyId}
            className="rounded bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            3️⃣ Approve Kabid
          </button>
          <button
            onClick={() => handleApprove("sekban")}
            disabled={isBusy || !activeDummyId}
            className="rounded bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            4️⃣ Approve Sekban
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleResetId}
            disabled={isBusy}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            🔄 Reset Dummy ID
          </button>
          <button
            onClick={handleResetInfo}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
          >
            🗑️ Cara Reset Firestore
          </button>
          <button
            onClick={handleClearLocalStorage}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
          >
            🧹 Clear Session
          </button>
        </div>
      </div>

      {log.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-3">
          <p className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
            Log
          </p>
          <div className="max-h-40 overflow-y-auto rounded border border-gray-200 bg-gray-900 p-2 font-mono text-[11px] text-green-400">
            {log.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== Root page ==================== */
export default function TestTelaahPage() {
  return (
    <TelaahInternalProvider>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <p className="text-lg font-bold text-red-800">
            ⚠️ HALAMAN TEST SEMENTARA
          </p>
          <p className="mt-1 text-sm text-red-700">
            Hapus folder{" "}
            <code className="rounded bg-red-100 px-1">
              src/app/test-telaah/
            </code>{" "}
            setelah verifikasi Langkah 2.3 selesai.
          </p>
        </div>

        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          🧪 Verifikasi Store Telaah Internal
        </h1>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
          <p className="mb-2 font-bold text-blue-800">📋 Urutan Testing:</p>
          <ol className="list-inside list-decimal space-y-1 text-blue-700">
            <li>
              Klik &ldquo;1️⃣ Ajukan Telaah&rdquo; → cek store jadi 1 dokumen
            </li>
            <li>
              Klik &ldquo;2️⃣ Approve Kasubbid&rdquo; → cek tahap jadi
              MENUNGGU_TELAAH_KABID
            </li>
            <li>
              Klik &ldquo;3️⃣ Approve Kabid&rdquo; → cek tahap jadi
              MENUNGGU_TELAAH_SEKBAN
            </li>
            <li>Klik &ldquo;4️⃣ Approve Sekban&rdquo; → cek selesai = true</li>
            <li>
              Cek notif muncul di panel 🔔 (kasubbid, kabid, sekban, admin)
            </li>
            <li>
              Cek Firebase Console → Firestore → collection telaahInternal &amp;
              notifikasiInternal
            </li>
          </ol>
          <p className="mt-2 text-xs text-blue-600">
            💡 Tip: klik &ldquo;🔄 Reset Dummy ID&rdquo; untuk dapat ID baru
            tanpa refresh halaman.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PanelAksi />
          <PanelData />

          <PanelNotif username="kasubbid" />
          <PanelNotif username="kabid" />
          <PanelNotif username="sekban" />
          <PanelNotif username="admin" />
        </div>
      </div>
    </TelaahInternalProvider>
  );
}
