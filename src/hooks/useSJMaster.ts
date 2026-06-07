"use client";

import { useState, useEffect } from "react";
import type { SJTujuan } from "@/lib/sjTypes";

// Hook untuk fetch master jenis
export function useMasterJenis() {
  const [jenis, setJenis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sj/master/jenis")
      .then(r => r.json())
      .then(json => {
        if (!cancelled) setJenis(json.jenis ?? []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { jenis, loading };
}

// Hook untuk fetch master merk
export function useMasterMerk() {
  const [merk, setMerk] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sj/master/merk")
      .then(r => r.json())
      .then(json => {
        if (!cancelled) setMerk(json.merk ?? []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { merk, loading };
}

// Hook untuk fetch master tujuan
export function useMasterTujuan() {
  const [tujuan, setTujuan] = useState<SJTujuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/sj/tujuan")
      .then(r => r.json())
      .then(json => {
        if (!cancelled) setTujuan(json.tujuan ?? []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTick]);

  const refresh = () => setRefreshTick(t => t + 1);

  return { tujuan, loading, refresh };
}
