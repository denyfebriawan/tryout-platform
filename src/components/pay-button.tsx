"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { startPremiumCheckout } from "@/lib/payment-actions";

// The part of Midtrans's snap.js API that we use. The script adds `window.snap` when it loads.
type SnapCallbacks = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};
declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

const SCRIPT_ID = "midtrans-snap";

// Adds snap.js to the page once. A call while it's still loading waits for the same <script> tag.
function loadSnap(scriptUrl: string, clientKey: string): Promise<void> {
  if (window.snap) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove(); // so the next click tries a fresh download
        reject(new Error("Failed to load snap.js"));
      },
      { once: true },
    );
    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = scriptUrl;
      script.dataset.clientKey = clientKey; // snap.js reads the client key from data-client-key
      document.body.appendChild(script);
    }
  });
}

const ERROR_MESSAGES = {
  "already-premium": "Akun kamu sudah Premium.",
  unavailable: "Pembayaran sedang tidak tersedia. Coba lagi nanti.",
  script: "Gagal memuat halaman pembayaran. Periksa koneksi lalu coba lagi.",
  payment: "Pembayaran gagal. Silakan coba lagi.",
};

export function PayButton({ scriptUrl, clientKey }: { scriptUrl: string; clientKey: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Start loading snap.js as soon as the button shows, so the popup opens quickly on click.
  useEffect(() => {
    loadSnap(scriptUrl, clientKey).catch(() => {});
  }, [scriptUrl, clientKey]);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await loadSnap(scriptUrl, clientKey);
      } catch {
        setError(ERROR_MESSAGES.script);
        return;
      }

      // A Server Action called like a normal async function: it runs on the server and returns data.
      const result = await startPremiumCheckout();
      if (!result.ok) {
        setError(ERROR_MESSAGES[result.error]);
        return;
      }

      // These callbacks only move the user along. They grant nothing: anyone could call them from
      // the browser console. Premium comes from the webhook, and the finish page shows its result.
      const finishUrl = `/premium/finish?order_id=${encodeURIComponent(result.orderId)}`;
      window.snap?.pay(result.snapToken, {
        onSuccess: () => router.push(finishUrl),
        onPending: () => router.push(finishUrl),
        onError: () => setError(ERROR_MESSAGES.payment),
      });
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-amber-500 px-5 py-2.5 font-medium text-white hover:bg-amber-600 disabled:opacity-60"
      >
        {isPending ? "Menyiapkan pembayaran..." : "Bayar sekarang"}
      </button>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-zinc-500">Mode sandbox Midtrans: tidak ada uang sungguhan yang ditarik.</p>
      )}
    </div>
  );
}
