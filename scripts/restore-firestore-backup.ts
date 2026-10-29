/**
 * Restore Firestore dari file backup JSON buatan `scripts/backup-firestore.ts`.
 *
 * Aman secara default: hanya DRY-RUN. Penulisan ke Firestore baru terjadi
 * jika argumen `--confirm` diberikan.
 *
 * Contoh:
 *   npx tsx scripts/restore-firestore-backup.ts
 *   npx tsx scripts/restore-firestore-backup.ts backups/2026-.../firestore-backup.json
 *   npx tsx scripts/restore-firestore-backup.ts backups/2026-.../firestore-backup.json --confirm
 */
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  GeoPoint,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SERVICE_ACCOUNT_PATH = path.join(ROOT, "serviceAccountKey.json");
const BACKUPS_DIR = path.join(ROOT, "backups");

type BackupDocument = {
  path: string;
  createTime?: string;
  updateTime?: string;
  data: Record<string, unknown>;
};

type BackupPayload = {
  metadata: {
    formatVersion?: number;
    projectId?: string;
    exportedAt?: string;
    totalDocuments?: number;
    totalCollections?: number;
    perCollection?: Record<string, number>;
  };
  documents: BackupDocument[];
};

function isDocumentPath(value: string): boolean {
  const parts = value.split("/");
  return (
    parts.length >= 2 &&
    parts.length % 2 === 0 &&
    parts.every((part) => part.length > 0)
  );
}

function findLatestBackup(): string {
  if (!existsSync(BACKUPS_DIR)) {
    throw new Error(
      `Folder backup tidak ditemukan: ${BACKUPS_DIR}. Jalankan dulu scripts/backup-firestore.ts.`,
    );
  }

  const folders = readdirSync(BACKUPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) =>
      existsSync(path.join(BACKUPS_DIR, name, "firestore-backup.json")),
    )
    .sort()
    .reverse();

  if (folders.length === 0) {
    throw new Error(
      "Tidak ada file backup di folder backups/. Jalankan dulu scripts/backup-firestore.ts.",
    );
  }

  return path.join(BACKUPS_DIR, folders[0], "firestore-backup.json");
}

function resolveBackupPath(argument?: string): string {
  if (!argument) return findLatestBackup();

  const resolved = path.resolve(process.cwd(), argument);
  if (existsSync(resolved) && statSync(resolved).isDirectory()) {
    return path.join(resolved, "firestore-backup.json");
  }
  return resolved;
}

function printUsage() {
  console.log("Cara pakai:");
  console.log(
    "  npx tsx scripts/restore-firestore-backup.ts [file-atau-folder-backup] [--confirm]",
  );
  console.log("");
  console.log("Tanpa --confirm: dry-run (tidak menulis ke Firestore).");
  console.log(
    "Dengan --confirm: menulis/menimpa dokumen dari backup ke Firestore.",
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  const unknownFlags = args.filter(
    (arg) => arg.startsWith("--") && arg !== "--confirm",
  );
  if (unknownFlags.length > 0) {
    throw new Error(`Argumen tidak dikenal: ${unknownFlags.join(", ")}`);
  }

  const confirm = args.includes("--confirm");
  const backupArgument = args.find((arg) => !arg.startsWith("--"));
  const backupPath = resolveBackupPath(backupArgument);

  if (!existsSync(backupPath)) {
    throw new Error(`File backup tidak ditemukan: ${backupPath}`);
  }

  const raw = readFileSync(backupPath, "utf8");
  const payload = JSON.parse(raw) as BackupPayload;

  if (payload?.metadata?.formatVersion !== 1) {
    throw new Error(
      "Format backup tidak dikenal. Pastikan file dibuat oleh scripts/backup-firestore.ts versi ini.",
    );
  }
  if (!Array.isArray(payload.documents)) {
    throw new Error("Struktur backup tidak valid: `documents` bukan array.");
  }
  if (!payload.metadata.projectId) {
    throw new Error("Metadata backup tidak memiliki projectId.");
  }

  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error("serviceAccountKey.json tidak ditemukan.");
  }

  const serviceAccount = JSON.parse(
    readFileSync(SERVICE_ACCOUNT_PATH, "utf8"),
  );
  const actualProjectId = String(serviceAccount.project_id ?? "");
  if (!actualProjectId) {
    throw new Error("project_id tidak ditemukan di serviceAccountKey.json.");
  }
  if (payload.metadata.projectId !== actualProjectId) {
    throw new Error(
      `Backup untuk project "${payload.metadata.projectId}", tetapi service account untuk "${actualProjectId}". Restore dibatalkan.`,
    );
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  const db = getFirestore();

  function deserializeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => deserializeValue(item));
    }

    if (value && typeof value === "object") {
      const object = value as Record<string, unknown>;
      const type = object.__type;

      if (type === "timestamp") {
        const seconds = Number(object.seconds);
        const nanoseconds = Number(object.nanoseconds);
        if (!Number.isInteger(seconds) || !Number.isInteger(nanoseconds)) {
          throw new Error("Nilai timestamp di backup tidak valid.");
        }
        return new Timestamp(seconds, nanoseconds);
      }

      if (type === "geopoint") {
        const latitude = Number(object.latitude);
        const longitude = Number(object.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new Error("Nilai geopoint di backup tidak valid.");
        }
        return new GeoPoint(latitude, longitude);
      }

      if (type === "reference") {
        const referencePath = String(object.path ?? "");
        if (!isDocumentPath(referencePath)) {
          throw new Error(
            `Path DocumentReference di backup tidak valid: ${referencePath}`,
          );
        }
        return db.doc(referencePath);
      }

      if (type === "bytes") {
        if (typeof object.base64 !== "string") {
          throw new Error("Nilai bytes di backup tidak valid.");
        }
        return Buffer.from(object.base64, "base64");
      }

      if (type === "bigint") {
        if (typeof object.value !== "string") {
          throw new Error("Nilai bigint di backup tidak valid.");
        }
        return BigInt(object.value);
      }

      if (type === "number") {
        if (object.value === "NaN") return NaN;
        if (object.value === "Infinity") return Infinity;
        if (object.value === "-Infinity") return -Infinity;
        throw new Error(`Nilai number khusus tidak dikenal: ${object.value}`);
      }

      if (type !== undefined) {
        throw new Error(`Tipe data backup tidak dikenal: ${String(type)}`);
      }

      const result: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(object)) {
        result[key] = deserializeValue(item);
      }
      return result;
    }

    return value;
  }

  const documents = payload.documents.map((document) => {
    if (!document || typeof document.path !== "string") {
      throw new Error("Ada dokumen backup tanpa path.");
    }
    if (!isDocumentPath(document.path)) {
      throw new Error(`Path dokumen tidak valid: ${document.path}`);
    }
    if (
      !document.data ||
      typeof document.data !== "object" ||
      Array.isArray(document.data)
    ) {
      throw new Error(`Data dokumen tidak valid: ${document.path}`);
    }

    return {
      path: document.path,
      data: deserializeValue(document.data) as Record<string, unknown>,
    };
  });

  console.log("File backup :", path.relative(process.cwd(), backupPath));
  console.log("Project     :", payload.metadata.projectId);
  console.log("Waktu export:", payload.metadata.exportedAt ?? "(tidak ada)");
  console.log("Dokumen     :", documents.length);
  console.log(
    "Koleksi     :",
    payload.metadata.totalCollections ?? "(tidak ada)",
  );

  if (payload.metadata.perCollection) {
    console.log("");
    console.log("Rincian dokumen per koleksi:");
    for (const [name, count] of Object.entries(
      payload.metadata.perCollection,
    )) {
      console.log(` - ${name}: ${count}`);
    }
  }

  console.log("");
  console.log("Contoh path:");
  for (const document of documents.slice(0, 10)) {
    console.log(` - ${document.path}`);
  }
  if (documents.length > 10) {
    console.log(` - ... dan ${documents.length - 10} dokumen lainnya`);
  }

  if (!confirm) {
    console.log("");
    console.log("MODE DRY-RUN: tidak ada data yang ditulis ke Firestore.");
    console.log(
      "Tambahkan --confirm jika benar-benar ingin menulis/menimpa dokumen dari backup.",
    );
    return;
  }

  console.log("");
  console.log("MODE RESTORE: menulis ke Firestore...");
  console.log(
    "Peringatan: dokumen yang ada di backup akan dibuat/ditimpa. Dokumen lain di Firestore tidak dihapus.",
  );

  const chunkSize = 400;
  let written = 0;
  for (let index = 0; index < documents.length; index += chunkSize) {
    const chunk = documents.slice(index, index + chunkSize);
    const batch = db.batch();
    for (const document of chunk) {
      batch.set(db.doc(document.path), document.data);
    }
    await batch.commit();
    written += chunk.length;
    console.log(` - ${written}/${documents.length} dokumen ditulis`);
  }

  console.log("");
  console.log("Restore selesai.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("GAGAL:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
