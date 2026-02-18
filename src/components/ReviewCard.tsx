import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

const cleanlinessMap: Record<1 | 2 | 3, string> = {
  1: "😊 깨끗",
  2: "😐 보통",
  3: "😢 더러움",
};

export default function ReviewCard({ review }: ReviewCardProps) {
  const tags: string[] = [];
  if (review.has_toilet_paper) tags.push("🧻 휴지");
  if (review.is_unisex) tags.push("🚻 공용");
  if (review.has_bidet) tags.push("💧 비데");
  if (review.has_accessible) tags.push("♿ 장애인");
  if (review.has_diaper_table) tags.push("👶 기저귀");

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">
            {cleanlinessMap[review.cleanliness]}
          </span>
          {review.toilet_location && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
              {review.toilet_location}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-300">
          {relativeTime(review.created_at)}
        </span>
      </div>
      {tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
