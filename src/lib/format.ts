// Display formatting shared by Server and Client Components.

// 225 -> "3 menit 45 detik"
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (minutes === 0) return `${seconds} detik`;
  return seconds === 0 ? `${minutes} menit` : `${minutes} menit ${seconds} detik`;
}

// Countdown display: 225 -> "03:45", 3725 -> "1:02:05"
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

// Scores use Indonesian number format with at most one decimal: 742.86 -> "742,9", 600 -> "600".
const scoreFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

export function formatScore(score: number): string {
  return scoreFormat.format(score);
}

// Fixed to WIB: the server may run in UTC (e.g. on Vercel), and participants are in Indonesia.
const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatDateTime(date: Date): string {
  return `${dateTimeFormat.format(date)} WIB`;
}
