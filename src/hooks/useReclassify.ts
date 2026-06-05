"use client";

import { useState, useCallback } from "react";

type ReclassifyStatus = "idle" | "loading" | "success" | "error";

interface ReclassifyResult {
  updated: number;
  total_unknown: number;
  message: string;
}

interface UseReclassifyReturn {
  status: ReclassifyStatus;
  result: ReclassifyResult | null;
  error: string | null;
  trigger: () => Promise<ReclassifyResult | null>;
  reset: () => void;
}

export function useReclassify(): UseReclassifyReturn {
  const [status, setStatus] = useState<ReclassifyStatus>("idle");
  const [result, setResult] = useState<ReclassifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async (): Promise<ReclassifyResult | null> => {
    setStatus("loading");
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/reclassify", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Reclassification failed");
      }

      const reclassifyResult: ReclassifyResult = {
        updated: data.updated,
        total_unknown: data.total_unknown,
        message: data.message,
      };

      setResult(reclassifyResult);
      setStatus("success");
      return reclassifyResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(msg);
      setStatus("error");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, trigger, reset };
}
