"use client";

import { useState, useEffect, useCallback } from "react";
import type { Review, ReviewSummary as ReviewSummaryType, Toilet } from "@/types";
import ReviewSummaryComponent from "./ReviewSummary";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import { hasReviewedToilet, markToiletReviewed } from "@/lib/local-actions";

interface ReviewSectionProps {
  buildingId: string;
  toilets: Toilet[];
  selectedToiletId: string | null;
}

export default function ReviewSection({
  buildingId,
  toilets,
  selectedToiletId,
}: ReviewSectionProps) {
  const [summary, setSummary] = useState<ReviewSummaryType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // 선택된 화장실이 변경되면 리뷰 여부 확인
  useEffect(() => {
    if (selectedToiletId) {
      setAlreadyReviewed(hasReviewedToilet(selectedToiletId));
    } else {
      // "전체" 탭: 모든 toilet 중 하나라도 리뷰했으면 true
      setAlreadyReviewed(toilets.some((t) => hasReviewedToilet(t.id)));
    }
  }, [selectedToiletId, toilets]);

  const fetchReviews = useCallback(async () => {
    try {
      const url = selectedToiletId
        ? `/api/buildings/${buildingId}/reviews?toilet_id=${selectedToiletId}`
        : `/api/buildings/${buildingId}/reviews`;
      const res = await fetch(url);
      const data = await res.json();
      setSummary(data.summary);
      setReviews(data.reviews ?? []);
    } catch {
      // 네트워크 에러
    } finally {
      setLoading(false);
    }
  }, [buildingId, selectedToiletId]);

  useEffect(() => {
    setLoading(true);
    setShowAll(false);
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (
    formData: {
      cleanliness: 1 | 2 | 3;
      has_toilet_paper: boolean;
      is_unisex: boolean;
      has_bidet: boolean;
      has_accessible: boolean;
      has_diaper_table: boolean;
    },
    toiletId: string
  ) => {
    try {
      const res = await fetch(`/api/buildings/${buildingId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, toilet_id: toiletId }),
      });

      if (res.ok) {
        markToiletReviewed(toiletId);
        setAlreadyReviewed(true);
        setShowForm(false);
        setLoading(true);
        await fetchReviews();
      } else if (res.status === 409) {
        markToiletReviewed(toiletId);
        setAlreadyReviewed(true);
        setShowForm(false);
        alert("이미 이 화장실에 평가를 등록했습니다");
      } else if (res.status === 429) {
        alert("너무 많은 요청입니다. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      // 에러 처리
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-100 p-3"
          >
            <div className="h-3 w-32 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-48 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* 요약 */}
      {summary && summary.total_count > 0 && (
        <ReviewSummaryComponent summary={summary} />
      )}

      {/* 개별 리뷰 리스트 */}
      {reviews.length === 0 ? (
        <p className="py-3 text-center text-xs text-gray-400">
          아직 평가가 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {!showAll && reviews.length > 3 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full rounded-lg border border-gray-200 py-1.5 text-xs text-gray-500 active:bg-gray-50"
            >
              더보기 ({reviews.length - 3}건)
            </button>
          )}
        </div>
      )}

      {/* 폼 토글 */}
      {alreadyReviewed ? (
        <p className="py-2 text-center text-xs text-gray-400">
          이미 평가를 등록했습니다
        </p>
      ) : showForm ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3">
          <ReviewForm
            onSubmit={handleSubmit}
            toilets={toilets}
            selectedToiletId={selectedToiletId}
          />
          <button
            onClick={() => setShowForm(false)}
            className="mt-2 w-full text-xs text-gray-400"
          >
            취소
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 active:bg-gray-50"
        >
          + 평가 등록하기
        </button>
      )}
    </div>
  );
}
