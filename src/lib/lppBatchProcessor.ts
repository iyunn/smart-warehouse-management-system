/**
 * lppBatchProcessor.ts
 * Splits combined LPPRecord[] (dari 3 file CGA1/CGA2/CGA3) into chunks and
 * sends each chunk to POST /api/lpp/process sequentially.
 *
 * Mirrors batchProcessor.ts (DAT) pattern, including the batchIndex/
 * totalBatches/isLastBatch fields — penting agar server tau kapan batch
 * terakhir (lihat fix kritis 17 Juni di asset_notes/DAT untuk alasan ini).
 */

import type { LPPRecord } from "./lppParser";

const BATCH_SIZE = 500;

export interface LPPBatchResult {
  batchIndex: number;
  totalBatches: number;
  rowsInBatch: number;
  success: boolean;
  error?: string;
}

export interface LPPProcessSummary {
  totalRows: number;
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  errors: string[];
  durationMs: number;
}

export interface LPPBatchProgressEvent {
  batchIndex: number;
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  percentComplete: number;
}

export type LPPOnProgressCallback = (event: LPPBatchProgressEvent) => void;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function sendBatch(
  batch: LPPRecord[],
  batchIndex: number,
  totalBatches: number,
  signal: AbortSignal
): Promise<LPPBatchResult> {
  const attempt = async (): Promise<Response> => {
    return fetch("/api/lpp/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: batch,
        batchIndex,
        totalBatches,
        isLastBatch: batchIndex === totalBatches - 1,
      }),
      signal,
    });
  };

  try {
    let res = await attempt();

    if (res.status >= 500 && res.status < 600) {
      await new Promise((r) => setTimeout(r, 800));
      res = await attempt();
    }

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.error ?? detail;
      } catch {
        // ignore
      }
      return {
        batchIndex, totalBatches, rowsInBatch: batch.length,
        success: false, error: `Batch ${batchIndex + 1}: ${detail}`,
      };
    }

    return { batchIndex, totalBatches, rowsInBatch: batch.length, success: true };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        batchIndex, totalBatches, rowsInBatch: batch.length,
        success: false, error: "Upload dibatalkan oleh pengguna.",
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      batchIndex, totalBatches, rowsInBatch: batch.length,
      success: false, error: `Batch ${batchIndex + 1}: ${msg}`,
    };
  }
}

export async function processLPPBatches(
  records: LPPRecord[],
  onProgress: LPPOnProgressCallback,
  signal: AbortSignal
): Promise<LPPProcessSummary> {
  const startTime = Date.now();
  const batches = chunkArray(records, BATCH_SIZE);
  const totalBatches = batches.length;

  const errors: string[] = [];
  let successfulBatches = 0;
  let failedBatches = 0;

  for (let i = 0; i < batches.length; i++) {
    if (signal.aborted) {
      errors.push("Upload dibatalkan oleh pengguna.");
      break;
    }

    const result = await sendBatch(batches[i], i, totalBatches, signal);

    if (result.success) {
      successfulBatches++;
    } else {
      failedBatches++;
      if (result.error) errors.push(result.error);
    }

    onProgress({
      batchIndex: i,
      totalBatches,
      successfulBatches,
      failedBatches,
      percentComplete: Math.round(((i + 1) / totalBatches) * 100),
    });

    await new Promise((r) => setTimeout(r, 0));
  }

  return {
    totalRows: records.length,
    totalBatches,
    successfulBatches,
    failedBatches,
    errors,
    durationMs: Date.now() - startTime,
  };
}
