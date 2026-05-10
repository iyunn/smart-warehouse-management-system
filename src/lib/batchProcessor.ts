/**
 * batchProcessor.ts
 * Splits an array of AssetRecords into BATCH_SIZE chunks and sends each
 * chunk to POST /api/process sequentially.
 *
 * Design decisions:
 * - Sequential (not parallel) to avoid overwhelming the API server.
 * - Caller receives live progress via an onProgress callback.
 * - Individual batch failures are recorded but do NOT abort the whole run —
 *   the caller can inspect failedBatches in the summary.
 * - A per-batch retry (1 automatic retry on 5xx) reduces flakiness.
 */

import {
  BATCH_SIZE,
  type AssetRecord,
  type BatchResult,
  type ProcessSummary,
} from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchProgressEvent {
  batchIndex: number;       // 0-based index of batch just completed
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  percentComplete: number;  // 0–100
}

export type OnProgressCallback = (event: BatchProgressEvent) => void;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Split array into chunks of at most `size` elements. */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * POST a single batch with one automatic retry on server errors (5xx).
 * Returns a BatchResult indicating success or failure with an error message.
 */
async function sendBatch(
  batch: AssetRecord[],
  batchIndex: number,
  totalBatches: number,
  signal: AbortSignal
): Promise<BatchResult> {
  const attempt = async (): Promise<Response> => {
    return fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: batch }),
      signal,
    });
  };

  try {
    let res = await attempt();

    // One retry for transient 5xx errors
    if (res.status >= 500 && res.status < 600) {
      await new Promise((r) => setTimeout(r, 800)); // brief back-off
      res = await attempt();
    }

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.message ?? body?.error ?? detail;
      } catch {
        // ignore JSON parse failures
      }
      return {
        batchIndex,
        totalBatches,
        rowsInBatch: batch.length,
        success: false,
        error: `Batch ${batchIndex + 1}: ${detail}`,
      };
    }

    return {
      batchIndex,
      totalBatches,
      rowsInBatch: batch.length,
      success: true,
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        batchIndex,
        totalBatches,
        rowsInBatch: batch.length,
        success: false,
        error: "Upload dibatalkan oleh pengguna.",
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      batchIndex,
      totalBatches,
      rowsInBatch: batch.length,
      success: false,
      error: `Batch ${batchIndex + 1}: ${msg}`,
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Process all AssetRecords in batches of BATCH_SIZE.
 *
 * @param records      Validated records from the parser.
 * @param onProgress   Callback fired after each batch completes.
 * @param signal       AbortSignal to cancel mid-flight.
 * @returns            Full ProcessSummary.
 */
export async function processBatches(
  records: AssetRecord[],
  skippedRows: number,
  onProgress: OnProgressCallback,
  signal: AbortSignal
): Promise<ProcessSummary> {
  const startTime = Date.now();
  const batches = chunkArray(records, BATCH_SIZE);
  const totalBatches = batches.length;

  const errors: string[] = [];
  let successfulBatches = 0;
  let failedBatches = 0;

  for (let i = 0; i < batches.length; i++) {
    // Bail early if cancelled
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

    // Yield to the browser between batches to keep the UI responsive
    await new Promise((r) => setTimeout(r, 0));
  }

  return {
    totalRows: records.length + skippedRows,
    validRows: records.length,
    skippedRows,
    totalBatches,
    successfulBatches,
    failedBatches,
    errors,
    durationMs: Date.now() - startTime,
  };
}