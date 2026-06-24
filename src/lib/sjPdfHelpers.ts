"use client";

import { pdf } from "@react-pdf/renderer";
import { SuratJalanPDF, type SJDataForPDF } from "@/components/sj/SuratJalanPDF";
import { SuratPenerimaanPDF } from "@/components/sj/SuratPenerimaanPDF";
import React from "react";

// ─── Cache logo base64 di module-level (load sekali per session) ──────────
let cachedLogoBase64: string | null = null;
let loadingPromise: Promise<string | null> | null = null;

async function loadLogo(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      // Logo di-import via Next.js static asset (path absolut dari public)
      // Karena logo ada di src/assets/, kita perlu fetch dari URL Next.js
      const res = await fetch("/logo-idm.png");
      if (!res.ok) throw new Error("Logo not found");

      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Logo gagal dimuat, pakai fallback:", e);
      return null;
    }
  })();

  cachedLogoBase64 = await loadingPromise;
  return cachedLogoBase64;
}

// ─── Generate PDF blob untuk preview ──────────────────────────────────────
// ─── Generate PDF blob untuk preview ──────────────────────────────────────
export async function generateSJPdfBlob(data: SJDataForPDF, jenis: 'keluar' | 'masuk' = 'keluar'): Promise<Blob> {
  const logoSrc = await loadLogo();
  const element = jenis === 'masuk'
    ? React.createElement(SuratPenerimaanPDF, { data })
    : React.createElement(SuratJalanPDF, { data, logoSrc: logoSrc ?? undefined });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDoc = pdf(element as any);
  return await pdfDoc.toBlob();
}

// ─── Download PDF dengan nama file otomatis ──────────────────────────────
export async function downloadSJPdf(data: SJDataForPDF, jenis: 'keluar' | 'masuk' = 'keluar'): Promise<void> {
  const blob = await generateSJPdfBlob(data, jenis);
  const url = URL.createObjectURL(blob);

  const cleanNoSJ = data.no_sj.replace(/[\/\\:*?"<>|]/g, "-");
  const filename = jenis === 'masuk' ? `SPB-${cleanNoSJ}.pdf` : `${cleanNoSJ}.pdf`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Open PDF in new tab for print ───────────────────────────────────────
export async function openSJPdfForPrint(data: SJDataForPDF, jenis: 'keluar' | 'masuk' = 'keluar'): Promise<void> {
  const blob = await generateSJPdfBlob(data, jenis);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
