"use client";

import { useState, useEffect } from "react";

/**
 * Fetch unique values dari keyword_rules untuk rule_type tertentu.
 * Dipakai untuk autocomplete suggestion di field value.
 *
 * Source: keyword_rules saja (sesuai Opsi A — dasar dari keyword rule itu sendiri)
 */
export function useKeywordRuleValues(ruleType: "jenis" | "merk" | null) {
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ruleType) { setValues([]); return; }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/keyword-rules/values?type=${ruleType}`)
      .then(r => r.json())
      .then(json => {
        if (!cancelled && json.values) setValues(json.values);
      })
      .catch(() => { if (!cancelled) setValues([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [ruleType]);

  return { values, loading };
}
