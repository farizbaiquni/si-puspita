import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
