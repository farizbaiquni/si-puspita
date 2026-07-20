import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC_QFXzDb4-HIYuingUrMYz3HucoN5jDAM",
  authDomain: "si-puspita-b7c29.firebaseapp.com",
  projectId: "si-puspita-b7c29",
  storageBucket: "si-puspita-b7c29.firebasestorage.app",
  messagingSenderId: "248594488095",
  appId: "1:248594488095:web:fdb52b9a3ee5f90825ae2a",
  measurementId: "G-TG7B2VRHGW",
};

// getApps().length dicek supaya tidak inisialisasi app Firebase dua kali
// (Next.js bisa re-run module ini saat hot-reload di development).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
// Catatan: file dokumen (PDF, dsb) TIDAK memakai Firebase Storage — sudah
// diganti ke Cloudinary (lihat lib/cloudinary.ts) karena Firebase Storage
// tidak lagi punya tier gratis (wajib upgrade ke plan Blaze).

// Analytics hanya jalan di browser (butuh window), dan tidak semua
// environment support (mis. beberapa browser dengan tracking-protection
// ketat) — makanya dibungkus isSupported() dan lazy-init, bukan langsung
// getAnalytics(app) di top-level seperti kode snippet asli dari console,
// karena itu akan crash saat file ini ke-import di server (SSR/Next.js).
let analyticsInstance: Analytics | null = null;

export async function getAnalyticsIfSupported(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;
  if (await isSupported()) {
    analyticsInstance = getAnalytics(app);
  }
  return analyticsInstance;
}
