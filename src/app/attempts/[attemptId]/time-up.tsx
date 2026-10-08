"use client";

import { useEffect, useTransition } from "react";

import { syncAttempt } from "@/lib/attempt-actions";

// Rendered when the participant comes back after every section has run out. Server Components
// shouldn't write to the database while rendering, so this asks the server to close the attempt
// through a Server Action instead. The action re-renders the page, which then shows the summary.
export function TimeUp({ attemptId }: { attemptId: string }) {
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Calling a Server Action from an Effect must go through startTransition.
    startTransition(() => syncAttempt(attemptId));
  }, [attemptId]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold">Waktu habis</h1>
      <p className="mt-2 text-zinc-600">Menyimpan dan mengumpulkan jawaban kamu...</p>
    </div>
  );
}
