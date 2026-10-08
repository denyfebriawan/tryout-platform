"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-renders the current page's Server Components every few seconds, without a full reload.
// Used while waiting for a webhook to change something the page shows.
export function AutoRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
