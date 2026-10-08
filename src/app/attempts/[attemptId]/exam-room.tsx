"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";

import { saveAnswer, submitSection, syncAttempt } from "@/lib/attempt-actions";
import type { ExamQuestion, SavedAnswer } from "@/lib/attempts";
import { formatClock } from "@/lib/format";

type ExamRoomProps = {
  attemptId: string;
  tryoutTitle: string;
  section: { id: string; code: string; name: string; number: number; total: number };
  deadlineMs: number;
  // The server's clock at render time, used to correct for a device clock that's off.
  serverNowMs: number;
  questions: ExamQuestion[];
  initialAnswers: Record<string, SavedAnswer>;
};

const EMPTY_ANSWER: SavedAnswer = { selectedOptionId: null, isFlagged: false };

export function ExamRoom({
  attemptId,
  tryoutTitle,
  section,
  deadlineMs,
  serverNowMs,
  questions,
  initialAnswers,
}: ExamRoomProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [pendingSaves, setPendingSaves] = useState(0);
  // Answers whose save failed, kept so "Coba lagi" can resend them.
  const [failedSaves, setFailedSaves] = useState<Record<string, SavedAnswer>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  // isPending stays true until the Server Action finishes and the re-rendered page arrives.
  const [isSubmitting, startSubmit] = useTransition();

  const question = questions[currentIndex];
  const answer = answers[question.id] ?? EMPTY_ANSWER;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isLastSection = section.number === section.total;
  const locked = timeUp || isSubmitting;

  const answeredCount = questions.filter((q) => answers[q.id]?.selectedOptionId).length;
  const flaggedCount = questions.filter((q) => answers[q.id]?.isFlagged).length;
  const failedCount = Object.keys(failedSaves).length;

  // Autosave. The screen updates first (optimistic), then the answer is sent to the server.
  // Next.js sends Server Actions one at a time, so saves reach the server in the order they're made.
  async function save(questionId: string, next: SavedAnswer) {
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
    setPendingSaves((count) => count + 1);
    try {
      const result = await saveAnswer({ attemptId, questionId, ...next });
      if (result.ok) {
        setFailedSaves((prev) => withoutKey(prev, questionId));
      } else if (result.error === "closed") {
        // The server says this section is over. Reload to get whatever comes next.
        router.refresh();
      } else {
        setFailedSaves((prev) => ({ ...prev, [questionId]: next }));
      }
    } catch {
      // Network error or server crash: keep the answer so it can be resent.
      setFailedSaves((prev) => ({ ...prev, [questionId]: next }));
    } finally {
      setPendingSaves((count) => count - 1);
    }
  }

  function retryFailedSaves() {
    for (const [questionId, saved] of Object.entries(failedSaves)) void save(questionId, saved);
  }

  function handleExpire() {
    setTimeUp(true);
    // The client only reports that its countdown ended. The server checks its own clock, closes the
    // section, and re-renders the page with the next section (or the summary).
    startSubmit(() => syncAttempt(attemptId));
  }

  function confirmSubmit() {
    startSubmit(() => submitSection(attemptId, section.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border border-t-0 border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-xs text-zinc-500">
            {tryoutTitle} · Subtes {section.number} dari {section.total}
          </p>
          <p className="truncate font-semibold">{section.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <SaveStatus pending={pendingSaves > 0} failedCount={failedCount} onRetry={retryFailedSaves} />
          <Countdown deadlineMs={deadlineMs} serverNowMs={serverNowMs} onExpire={handleExpire} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between text-sm text-zinc-500">
            <span>
              Soal {currentIndex + 1} dari {questions.length}
            </span>
            {answer.isFlagged && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Ragu-ragu</span>
            )}
          </div>

          {question.stimulus && (
            <div className="mb-4 rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed whitespace-pre-line text-zinc-700">
              {question.stimulus}
            </div>
          )}
          <p className="mb-4 leading-relaxed whitespace-pre-line">{question.stem}</p>

          {/* A disabled fieldset disables every input inside it. */}
          <fieldset disabled={locked} className="flex flex-col gap-2">
            <legend className="sr-only">Pilihan jawaban</legend>
            {question.options.map((option) => {
              const checked = answer.selectedOptionId === option.id;
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-300 ${
                    checked ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {/* A real radio input (visually hidden) keeps keyboard and screen reader support. */}
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={checked}
                    onChange={() => save(question.id, { ...answer, selectedOptionId: option.id })}
                    className="sr-only"
                  />
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                      checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 text-zinc-600"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="pt-0.5 whitespace-pre-line">{option.text}</span>
                </label>
              );
            })}
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={locked}
                onClick={() => save(question.id, { ...answer, isFlagged: !answer.isFlagged })}
                className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {answer.isFlagged ? "Batal ragu-ragu" : "Ragu-ragu"}
              </button>
              <button
                type="button"
                disabled={locked || !answer.selectedOptionId}
                onClick={() => save(question.id, { ...answer, selectedOptionId: null })}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                Hapus jawaban
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((index) => index - 1)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              {isLastQuestion ? (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setConfirmOpen(true)}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLastSection ? "Kumpulkan tryout" : "Selesai subtes"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((index) => index + 1)}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Berikutnya
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4 self-start rounded-xl border border-zinc-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-medium">Navigasi soal</h2>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => {
              const saved = answers[q.id];
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Soal ${index + 1}`}
                  aria-current={index === currentIndex ? "step" : undefined}
                  className={`flex h-9 items-center justify-center rounded-md border text-sm font-medium ${navButtonColor(saved)} ${
                    index === currentIndex ? "ring-2 ring-indigo-400 ring-offset-1" : ""
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <ul className="flex flex-col gap-1 text-xs text-zinc-500">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-indigo-600" /> Sudah dijawab
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-amber-400" /> Ragu-ragu
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-sm border border-zinc-300 bg-white" /> Belum dijawab
            </li>
          </ul>
          <p className="text-sm text-zinc-600">
            Terjawab {answeredCount} dari {questions.length}
          </p>
          <button
            type="button"
            disabled={locked}
            onClick={() => setConfirmOpen(true)}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLastSection ? "Kumpulkan tryout" : "Selesai subtes"}
          </button>
        </aside>
      </div>

      {confirmOpen && !timeUp && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {isLastSection ? "Kumpulkan tryout?" : "Selesaikan subtes ini?"}
            </h2>
            <ul className="mt-3 space-y-1 text-sm text-zinc-600">
              <li>
                Terjawab {answeredCount} dari {questions.length} soal.
              </li>
              {answeredCount < questions.length && <li>{questions.length - answeredCount} soal belum dijawab.</li>}
              {flaggedCount > 0 && <li>{flaggedCount} soal masih ditandai ragu-ragu.</li>}
              <li>
                Kamu tidak bisa kembali ke subtes {section.code} setelah ini.
                {!isLastSection && " Subtes berikutnya langsung dimulai."}
              </li>
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmSubmit}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isSubmitting ? "Memproses..." : "Ya, lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {timeUp && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div role="alertdialog" aria-live="assertive" className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-lg">
            <h2 className="text-lg font-semibold">Waktu habis</h2>
            <p className="mt-2 text-sm text-zinc-600">
              {isLastSection ? "Mengumpulkan jawaban kamu..." : "Menyimpan jawaban dan membuka subtes berikutnya..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Displays the time left. It lives in its own component so only it re-renders on every tick,
// not the whole exam room.
function Countdown({
  deadlineMs,
  serverNowMs,
  onExpire,
}: {
  deadlineMs: number;
  serverNowMs: number;
  onExpire: () => void;
}) {
  // Start from the server's numbers, so the server render and the first client render match.
  const [remainingMs, setRemainingMs] = useState(deadlineMs - serverNowMs);
  // How far the device clock is from the server's, measured once. A ref keeps it when Next.js hides
  // this page during navigation and shows it again later with the same (by then old) serverNowMs.
  const clockOffsetRef = useRef<number | null>(null);
  // useEffectEvent: always calls the latest onExpire without restarting the interval when it changes.
  const fireExpire = useEffectEvent(onExpire);

  useEffect(() => {
    clockOffsetRef.current ??= serverNowMs - Date.now();
    const offset = clockOffsetRef.current;
    let lastExpireCall = 0;

    const timer = setInterval(() => {
      const ms = deadlineMs - (Date.now() + offset);
      setRemainingMs(ms);
      // Keep reporting every few seconds until the server agrees the time is up and moves on.
      if (ms <= 0 && Date.now() - lastExpireCall > 3000) {
        lastExpireCall = Date.now();
        fireExpire();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [deadlineMs, serverNowMs]);

  const color =
    remainingMs <= 60_000 ? "bg-red-50 text-red-700" : remainingMs <= 5 * 60_000 ? "bg-amber-50 text-amber-800" : "bg-zinc-100 text-zinc-800";

  return (
    <div className={`rounded-md px-3 py-1.5 font-mono text-lg font-semibold tabular-nums ${color}`} aria-label="Sisa waktu">
      {formatClock(remainingMs / 1000)}
    </div>
  );
}

function SaveStatus({ pending, failedCount, onRetry }: { pending: boolean; failedCount: number; onRetry: () => void }) {
  if (failedCount > 0) {
    return (
      <p role="alert" className="flex items-center gap-2 text-xs text-red-700">
        Gagal menyimpan {failedCount} jawaban.
        <button type="button" onClick={onRetry} className="font-medium underline">
          Coba lagi
        </button>
      </p>
    );
  }
  return <p className="text-xs text-zinc-500">{pending ? "Menyimpan..." : "Jawaban tersimpan"}</p>;
}

function navButtonColor(saved: SavedAnswer | undefined): string {
  if (saved?.isFlagged) return "border-amber-400 bg-amber-400 text-white";
  if (saved?.selectedOptionId) return "border-indigo-600 bg-indigo-600 text-white";
  return "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50";
}

// Returns a copy without `key`, or the same object if the key isn't there (so React can skip a re-render).
function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record;
  const copy = { ...record };
  delete copy[key];
  return copy;
}
