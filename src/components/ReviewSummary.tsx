import type { ReviewSummary as ReviewSummaryType } from "@/types";

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
}

function pct(count: number, total: number): string {
  if (total === 0) return "0";
  return Math.round((count / total) * 100).toString();
}

export default function ReviewSummary({ summary }: ReviewSummaryProps) {
  const t = summary.total_count;

  const booleanItems = [
    { emoji: "🧻", label: "휴지", count: summary.has_toilet_paper },
    { emoji: "🚻", label: "남녀공용", count: summary.is_unisex },
    { emoji: "💧", label: "비데", count: summary.has_bidet },
    { emoji: "♿", label: "장애인 화장실", count: summary.has_accessible },
    { emoji: "👶", label: "기저귀 교환대", count: summary.has_diaper_table },
  ];

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-gray-400">총 {t}건의 평가</p>

      {/* 청결도 */}
      <div className="flex items-center gap-2 text-xs">
        <span className="shrink-0 font-medium text-gray-600">청결도</span>
        <div className="flex gap-2">
          <span>😊 {pct(summary.cleanliness.clean, t)}%</span>
          <span>😐 {pct(summary.cleanliness.average, t)}%</span>
          <span>😢 {pct(summary.cleanliness.dirty, t)}%</span>
        </div>
      </div>

      {/* Boolean 항목들 — 다수결 결과 + 응답 수 */}
      <div className="flex flex-wrap gap-1.5">
        {booleanItems.map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              item.count >= t / 2
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {item.emoji} {item.label}
            <span className="text-[10px] font-normal opacity-60">
              ({item.count}/{t})
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
