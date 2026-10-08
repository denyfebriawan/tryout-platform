import type { AccessTier, ExamType } from "@/generated/prisma/client";

export function TryoutBadges({ examType, accessTier }: { examType: ExamType; accessTier: AccessTier }) {
  return (
    <div className="flex gap-2 text-xs font-medium">
      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
        {examType === "UTBK" ? "UTBK-SNBT" : "TKA"}
      </span>
      {accessTier === "FREE" ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Gratis</span>
      ) : (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Premium</span>
      )}
    </div>
  );
}
