/* ------------------------------------------------------------------ */
/*  html2pdf.d.ts                                                      */
/*  Type declaration LENGKAP untuk html2pdf.js.                        */
/*                                                                     */
/*  Dibuat sendiri karena @types/html2pdf.js (komunitas) tidak         */
/*  menyertakan properti `pagebreak` yang sebenarnya didukung library. */
/* ------------------------------------------------------------------ */

declare module "html2pdf.js" {
  /**
   * Opsi `pagebreak` — mengontrol perilaku pindah halaman.
   * Didukung runtime oleh html2pdf.js, tapi tidak ada di @types komunitas.
   */
  interface Html2PdfPagebreak {
    mode?: string | string[];
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  }

  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: {
      unit?: string;
      format?: string | number[];
      orientation?: string;
    };
    pagebreak?: Html2PdfPagebreak;
    enableLinks?: boolean;
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(element: HTMLElement | string): Html2PdfWorker;
    toPdf(): Html2PdfWorker;
    toContainer(): Html2PdfWorker;
    toCanvas(): Html2PdfWorker;
    toImg(): Html2PdfWorker;
    save(filename?: string): Promise<void>;
    outputPdf(type?: string): Promise<unknown>;
    outputImg(type?: string): Promise<unknown>;
    get(key: string, cb?: (value: unknown) => void): Html2PdfWorker;
    then(cb: (value: unknown) => void): Html2PdfWorker;
  }

  interface Html2PdfStatic {
    (): Html2PdfWorker;
    (options: Html2PdfOptions): Html2PdfWorker;
  }

  const html2pdf: Html2PdfStatic;
  export default html2pdf;
}
