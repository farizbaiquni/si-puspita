/**
 * Backup Firestore + Firestore rules ke folder `backups/`.
 *
 * - Hanya membaca database (read-only).
 * - Semua koleksi dan subkoleksi ikut di-export.
 * - Tipe khusus Firestore (Timestamp, GeoPoint, DocumentReference, Bytes)
 *   disimpan dengan penanda `__type` agar bisa direstore.
 * - Salinan `firestore.rules` lokal dan rules yang sedang live ikut disimpan.
 *
 * Jalankan:
 *   npx tsx scripts/backup-firestore.ts
 */
import { createHash } from "crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  DocumentReference,
  GeoPoint,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import type {
  CollectionReference,
  DocumentData,
} from "firebase-admin/firestore";
import { GoogleAuth } from "google-auth-library";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SERVICE_ACCOUNT_PATH = path.join(ROOT, "serviceAccountKey.json");
const LOCAL_RULES_PATH = path.join(ROOT, "firestore.rules");
const BACKUPS_DIR = path.join(ROOT, "backups");

type BackupDocument = {
  path: string;
  createTime?: string;
  updateTime?: string;
  data: Record<string, unknown>;
};

type LiveRules = {
  content: string;
  releaseName: string;
  rulesetName: string;
  updateTime?: string;
};

/** Ubah nilai Firestore menjadi JSON yang bisa direstore kembali. */
function serializeValue(value: unknown): unknown {
  if (value === null) return null;

  const t = typeof value;
  if (t === "string" || t === "boolean") return value;

  if (t === "number") {
    const n = value as number;
    if (Number.isNaN(n)) return { __type: "number", value: "NaN" };
    if (n === Infinity) return { __type: "number", value: "Infinity" };
    if (n === -Infinity) return { __type: "number", value: "-Infinity" };
    return n;
  }

  if (t === "bigint") {
    return { __type: "bigint", value: (value as bigint).toString() };
  }

  if (t === "undefined") {
    throw new Error("Nilai undefined tidak didukung Firestore.");
  }

  if (value instanceof Timestamp) {
    return {
      __type: "timestamp",
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    };
  }

  if (value instanceof Date) {
    const ms = value.getTime();
    return {
      __type: "timestamp",
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1_000_000,
    };
  }

  if (value instanceof GeoPoint) {
    return {
      __type: "geopoint",
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }

  if (value instanceof DocumentReference) {
    return { __type: "reference", path: value.path };
  }

  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return {
      __type: "bytes",
      base64: Buffer.from(value as Uint8Array).toString("base64"),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (value instanceof Map) {
    const result: Record<string, unknown> = {};
    for (const [key, item] of value.entries()) {
      result[String(key)] = serializeValue(item);
    }
    return result;
  }

  if (t === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeValue(item);
    }
    return result;
  }

  throw new Error(`Tipe data tidak didukung: ${t}`);
}

function serializeDocumentData(data: DocumentData): Record<string, unknown> {
  const result = serializeValue(data);
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Data dokumen Firestore bukan object.");
  }
  return result as Record<string, unknown>;
}

async function walkCollection(
  collection: CollectionReference,
  documents: BackupDocument[],
  perCollection: Record<string, number>,
): Promise<void> {
  const snapshot = await collection.get();
  perCollection[collection.path] = snapshot.size;

  for (const doc of snapshot.docs) {
    documents.push({
      path: doc.ref.path,
      createTime: doc.createTime?.toDate().toISOString(),
      updateTime: doc.updateTime?.toDate().toISOString(),
      data: serializeDocumentData(doc.data()),
    });

    const subCollections = await doc.ref.listCollections();
    for (const subCollection of subCollections) {
      await walkCollection(subCollection, documents, perCollection);
    }
  }
}

async function fetchLiveRules(
  projectId: string,
  serviceAccount: unknown,
): Promise<LiveRules | null> {
  try {
    const auth = new GoogleAuth({
      credentials: serviceAccount as Record<string, unknown>,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) throw new Error("Access token kosong.");

    const headers = { Authorization: `Bearer ${token.token}` };
    const releasesResponse = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
      { headers },
    );
    if (!releasesResponse.ok) {
      throw new Error(
        `Gagal membaca releases (HTTP ${releasesResponse.status}).`,
      );
    }

    const releases = (await releasesResponse.json()) as {
      releases?: {
        name?: string;
        rulesetName?: string;
        updateTime?: string;
      }[];
    };
    const release = (releases.releases ?? []).find((item) =>
      item.name?.endsWith("/releases/cloud.firestore"),
    );
    if (!release?.rulesetName) {
      throw new Error("Release cloud.firestore tidak ditemukan.");
    }

    const rulesetId = release.rulesetName.split("/").pop();
    if (!rulesetId) throw new Error("Ruleset ID kosong.");

    const rulesetResponse = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets/${rulesetId}`,
      { headers },
    );
    if (!rulesetResponse.ok) {
      throw new Error(
        `Gagal membaca ruleset (HTTP ${rulesetResponse.status}).`,
      );
    }

    const ruleset = (await rulesetResponse.json()) as {
      source?: { files?: { name?: string; content?: string }[] };
    };

    return {
      content: (ruleset.source?.files ?? [])
        .map((file) => file.content ?? "")
        .join("\n"),
      releaseName: release.name ?? "",
      rulesetName: release.rulesetName,
      updateTime: release.updateTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Peringatan: gagal mengambil rules live (${message}). Backup tetap dilanjutkan.`,
    );
    return null;
  }
}

function sortedRecord(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    ),
  );
}

function makeFolderName(exportedAt: string): string {
  const base = exportedAt.replace(/[:.]/g, "-");
  let name = base;
  let counter = 2;
  while (existsSync(path.join(BACKUPS_DIR, name))) {
    name = `${base}-${counter}`;
    counter += 1;
  }
  return name;
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function buildReadme(params: {
  projectId: string;
  exportedAt: string;
  folderName: string;
  totalDocuments: number;
  totalCollections: number;
  backupSha256: string;
  localRulesSha256: string;
  liveRulesSha256: string | null;
}): string {
  const lines = [
    "# Backup Firestore — si-puspita",
    "",
    `- Project: \`${params.projectId}\``,
    `- Waktu export: \`${params.exportedAt}\``,
    `- Total dokumen: \`${params.totalDocuments}\``,
    `- Total koleksi (termasuk subkoleksi): \`${params.totalCollections}\``,
    `- File backup: \`firestore-backup.json\``,
    `- SHA-256 backup: \`${params.backupSha256}\``,
    "",
    "## File",
    "",
    "- `firestore-backup.json` — seluruh data Firestore.",
    "- `firestore.rules` — salinan aturan lokal saat backup (bisa belum dipublikasikan).",
    `- SHA-256 rules lokal: \`${params.localRulesSha256}\``,
  ];

  if (params.liveRulesSha256) {
    lines.push(
      "- `firestore.rules.live` — aturan yang sedang aktif di production saat backup.",
    );
    lines.push(`- SHA-256 rules live: \`${params.liveRulesSha256}\``);
  }

  lines.push(
    "- `manifest.json` — ringkasan, jumlah dokumen, dan checksum.",
    "",
    "## Cara restore",
    "",
    "Dry-run (tidak menulis apa pun):",
    "",
    "```bash",
    `npx tsx scripts/restore-firestore-backup.ts "backups/${params.folderName}/firestore-backup.json"`,
    "```",
    "",
    "Restore sungguhan (menulis ke Firestore):",
    "",
    "```bash",
    `npx tsx scripts/restore-firestore-backup.ts "backups/${params.folderName}/firestore-backup.json" --confirm`,
    "```",
    "",
    "> Restore hanya membuat/menimpa dokumen yang ada di backup. Dokumen lain",
    "> yang tidak ada di backup **tidak dihapus**.",
    "",
    "> Dry-run sudah diuji. Mode `--confirm` sengaja belum dijalankan ke",
    "> production; sebaiknya uji dulu di emulator/staging sebelum dipakai.",
    "",
    "## Cara restore rules",
    "",
    "Script restore di atas **tidak** mempublikasikan rules. Untuk restore rules:",
    "",
    "1. Buka Firebase Console → Firestore Database → Rules.",
    "2. Salin isi `firestore.rules` (aturan lokal saat backup) atau",
    "   `firestore.rules.live` (aturan yang aktif di production saat backup).",
    "3. Klik **Publish**.",
    "",
    "## Peringatan",
    "",
    "Folder ini berisi data production dan bisa memuat data pribadi.",
    "Jangan commit ke Git. Folder `/backups/` sudah masuk `.gitignore`.",
    "",
  );

  return lines.join("\n");
}

async function main() {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error("serviceAccountKey.json tidak ditemukan.");
  }

  const serviceAccount = JSON.parse(
    readFileSync(SERVICE_ACCOUNT_PATH, "utf8"),
  );
  const projectId = String(serviceAccount.project_id ?? "");
  if (!projectId) {
    throw new Error("project_id tidak ditemukan di serviceAccountKey.json.");
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  const db = getFirestore();

  console.log(`Membaca Firestore project ${projectId} (read-only)...`);

  const topLevelCollections = await db.listCollections();
  const topLevelNames = topLevelCollections
    .map((collection) => collection.id)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const documents: BackupDocument[] = [];
  const perCollection: Record<string, number> = {};

  for (const collection of topLevelCollections) {
    await walkCollection(collection, documents, perCollection);
  }

  documents.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const exportedAt = new Date().toISOString();
  const perCollectionSorted = sortedRecord(perCollection);
  const totalCollections = Object.keys(perCollectionSorted).length;

  const payload = {
    metadata: {
      formatVersion: 1,
      projectId,
      database: "(default)",
      exportedAt,
      tool: "scripts/backup-firestore.ts",
      totalDocuments: documents.length,
      totalCollections,
      topLevelCollections: topLevelNames,
      perCollection: perCollectionSorted,
    },
    documents,
  };

  const backupJson = `${JSON.stringify(payload, null, 2)}\n`;
  const backupSha256 = sha256(backupJson);

  mkdirSync(BACKUPS_DIR, { recursive: true });
  const folderName = makeFolderName(exportedAt);
  const outputDir = path.join(BACKUPS_DIR, folderName);
  mkdirSync(outputDir, { recursive: true });

  const backupPath = path.join(outputDir, "firestore-backup.json");
  writeFileSync(backupPath, backupJson, "utf8");

  const localRules = readFileSync(LOCAL_RULES_PATH, "utf8");
  writeFileSync(path.join(outputDir, "firestore.rules"), localRules, "utf8");
  const localRulesSha256 = sha256(localRules);

  const liveRules = await fetchLiveRules(projectId, serviceAccount);
  let liveRulesSha256: string | null = null;
  if (liveRules) {
    const liveRulesContent = liveRules.content.endsWith("\n")
      ? liveRules.content
      : `${liveRules.content}\n`;
    liveRulesSha256 = sha256(liveRulesContent);
    writeFileSync(
      path.join(outputDir, "firestore.rules.live"),
      liveRulesContent,
      "utf8",
    );
  }

  const manifest = {
    formatVersion: 1,
    projectId,
    exportedAt,
    backupFile: "firestore-backup.json",
    backupSha256,
    totalDocuments: documents.length,
    totalCollections,
    topLevelCollections: topLevelNames,
    perCollection: perCollectionSorted,
    rules: {
      local: {
        file: "firestore.rules",
        sha256: localRulesSha256,
        note: "Salinan firestore.rules lokal saat backup; belum tentu sudah dipublikasikan.",
      },
      live: liveRules
        ? {
            file: "firestore.rules.live",
            sha256: liveRulesSha256,
            releaseName: liveRules.releaseName,
            rulesetName: liveRules.rulesetName,
            updateTime: liveRules.updateTime,
          }
        : null,
    },
  };

  writeFileSync(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  writeFileSync(
    path.join(outputDir, "README.md"),
    buildReadme({
      projectId,
      exportedAt,
      folderName,
      totalDocuments: documents.length,
      totalCollections,
      backupSha256,
      localRulesSha256,
      liveRulesSha256,
    }),
    "utf8",
  );

  console.log("");
  console.log("Backup selesai.");
  console.log(`Folder   : ${path.relative(ROOT, outputDir)}`);
  console.log(`Dokumen  : ${documents.length}`);
  console.log(`Koleksi  : ${totalCollections}`);
  console.log(`SHA-256  : ${backupSha256}`);
  console.log("");
  console.log("Rincian dokumen per koleksi:");
  for (const [name, count] of Object.entries(perCollectionSorted)) {
    console.log(` - ${name}: ${count}`);
  }
  console.log("");
  console.log(
    "Rules live:",
    liveRules ? "tersimpan di firestore.rules.live" : "tidak tersedia",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("GAGAL:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
