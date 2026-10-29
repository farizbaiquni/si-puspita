/* ------------------------------------------------------------------ */
/*  generatePdf.ts                                                     */
/*  Utility untuk generate PDF Berita Acara ukuran F4/Folio.           */
/* ------------------------------------------------------------------ */

export interface GeneratePdfOptions {
  /** ID elemen HTML yang akan di-render jadi PDF */
  elementId: string;
  /** Nama file PDF (tanpa ekstensi) */
  filename: string;
  /** Callback opsional saat progress */
  onProgress?: (progress: number) => void;
}

/** Ukuran F4/Folio dalam mm */
const PAGE_WIDTH_MM = 215;
const PAGE_HEIGHT_MM = 330;

/**
 * Generate PDF dari elemen HTML dan langsung download.
 *
 * Konfigurasi:
 *   - Ukuran: F4/Folio (215 × 330 mm), portrait
 *   - Margin: atas 20mm, kanan 20mm, bawah 20mm, kiri 30mm
 *   - Resolution: scale 2 (setara ±200 DPI)
 *
 * @throws Error kalau elemen tidak ditemukan atau library gagal load
 */
export async function downloadBeritaAcaraPdf({
  elementId,
  filename,
  onProgress,
}: GeneratePdfOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(
      `Elemen dengan id "${elementId}" tidak ditemukan. Pastikan elemen sudah di-render.`,
    );
  }

  // Dynamic import — supaya html2pdf.js tidak ikut di initial bundle.
  // Cast ke `any` karena tipe library tidak lengkap.
  const html2pdfModule = await import("html2pdf.js");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf = html2pdfModule.default as any;

  const options = {
    margin: [20, 20, 20, 30], // atas, kanan, bawah, kiri (mm)
    filename: `${filename}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
    },
    jsPDF: {
      unit: "mm",
      format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM],
      orientation: "portrait",
    },
    pagebreak: { mode: ["avoid-all", "css"] },
  };

  // Bangun worker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const worker: any = html2pdf().set(options).from(element);

  // Tambah nomor halaman di footer sebelum save
  await new Promise<void>((resolve, reject) => {
    worker
      .toPdf()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get("pdf", (pdf: any) => {
        try {
          const totalPages = pdf.internal.getNumberOfPages();
          const centerX = PAGE_WIDTH_MM / 2;
          const bottomY = PAGE_HEIGHT_MM - 10;

          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setFont("times");
            pdf.text(`Halaman ${i} dari ${totalPages}`, centerX, bottomY, {
              align: "center",
            });
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
  });

  // Save
  await worker.save();

  onProgress?.(100);
}
