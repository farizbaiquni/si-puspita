"use client";

/* ------------------------------------------------------------------ */
/*  ScaledBeritaAcaraPreview.tsx                                       */
/*  Wrapper preview F4 yang auto-fit ukuran (tidak pernah terpotong).  */
/*                                                                     */
/*  Kenapa perlu wrapper khusus:                                       */
/*  - `transform: scale()` TIDAK mengubah layout — parent tidak ikut   */
/*    mengecil. Kalau tinggi parent dipatok manual (mis. calc(330mm *  */
/*    0.6)), dokumen yang lebih tinggi dari 1 halaman F4 akan          */
/*    terpotong begitu parent diberi `overflow-hidden`.               */
/*  - Di sini ukuran wrapper dihitung dari hasil pengukuran konten     */
/*    asli (offsetWidth/offsetHeight) × skala, jadi tinggi preview     */
/*    selalu = tinggi dokumen sebenarnya (bisa > 1 halaman).           */
/*  - Skala juga dihitung dari lebar kolom yang tersedia (maks 1 /     */
/*    100%), supaya di layar sempit dokumen tetap tampil penuh.        */
/* ------------------------------------------------------------------ */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import BeritaAcaraPreview from "./BeritaAcaraPreview";
import type { BeritaAcaraData } from "./types";

// useLayoutEffect menimbulkan warning saat SSR — fallback ke useEffect
// di server (pola isomorphic effect standar).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface ScaledBeritaAcaraPreviewProps {
  data: BeritaAcaraData;
}

interface BoxSize {
  width: number;
  height: number;
}

export default function ScaledBeritaAcaraPreview({
  data,
}: ScaledBeritaAcaraPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [box, setBox] = useState<BoxSize | null>(null);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const update = () => {
      const availableWidth = container.clientWidth;
      // offsetWidth/offsetHeight = ukuran layout ASLI (transform tidak
      // memengaruhi nilai offset*), jadi aman dipakai sebagai basis.
      const contentWidth = content.offsetWidth;
      const contentHeight = content.offsetHeight;
      if (!availableWidth || !contentWidth || !contentHeight) return;

      const nextScale = Math.min(availableWidth / contentWidth, 1);

      setScale((prev) =>
        Math.abs(prev - nextScale) < 0.001 ? prev : nextScale,
      );
      setBox((prev) => {
        const width = contentWidth * nextScale;
        const height = contentHeight * nextScale;
        if (
          prev &&
          Math.abs(prev.width - width) < 0.5 &&
          Math.abs(prev.height - height) < 0.5
        ) {
          return prev;
        }
        return { width, height };
      });
    };

    update();

    // Pantau: lebar kolom (resize/breakpoint) & tinggi konten (isian
    // form berubah / font selesai dimuat / tab preview kembali tampil).
    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {/* Sizer: ukurannya = konten SETELAH diskala, sehingga tidak ada
          bagian dokumen yang terpotong (tinggi mengikuti isi dokumen). */}
      <div
        className="relative mx-auto"
        style={
          box
            ? { width: `${box.width}px`, height: `${box.height}px` }
            : { width: "100%" }
        }
      >
        <div
          ref={contentRef}
          className="w-[215mm] origin-top-left bg-white shadow-md"
          style={{ transform: `scale(${scale})` }}
        >
          <BeritaAcaraPreview data={data} />
        </div>
      </div>
    </div>
  );
}
