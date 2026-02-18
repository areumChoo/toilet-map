"use client";

import { useState } from "react";
import type { Toilet } from "@/types";

interface ReviewFormProps {
  onSubmit: (
    data: {
      cleanliness: 1 | 2 | 3;
      has_toilet_paper: boolean;
      is_unisex: boolean;
      has_bidet: boolean;
      has_accessible: boolean;
      has_diaper_table: boolean;
    },
    toiletId: string
  ) => Promise<void>;
  toilets: Toilet[];
  selectedToiletId: string | null;
}

export default function ReviewForm({
  onSubmit,
  toilets,
  selectedToiletId,
}: ReviewFormProps) {
  const [cleanliness, setCleanliness] = useState<1 | 2 | 3 | null>(null);
  const [hasToiletPaper, setHasToiletPaper] = useState<boolean | null>(null);
  const [isUnisex, setIsUnisex] = useState<boolean | null>(null);
  const [hasBidet, setHasBidet] = useState<boolean | null>(null);
  const [hasAccessible, setHasAccessible] = useState<boolean | null>(null);
  const [hasDiaperTable, setHasDiaperTable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formToiletId, setFormToiletId] = useState<string | null>(
    selectedToiletId ?? (toilets.length === 1 ? toilets[0].id : null)
  );

  const resolvedToiletId = selectedToiletId ?? formToiletId;
  const needsToiletSelection =
    toilets.length > 1 && selectedToiletId === null;

  const allSelected =
    cleanliness !== null &&
    hasToiletPaper !== null &&
    isUnisex !== null &&
    hasBidet !== null &&
    hasAccessible !== null &&
    hasDiaperTable !== null &&
    resolvedToiletId !== null;

  const handleSubmit = async () => {
    if (!allSelected || !resolvedToiletId) return;
    setSubmitting(true);
    await onSubmit(
      {
        cleanliness: cleanliness!,
        has_toilet_paper: hasToiletPaper!,
        is_unisex: isUnisex!,
        has_bidet: hasBidet!,
        has_accessible: hasAccessible!,
        has_diaper_table: hasDiaperTable!,
      },
      resolvedToiletId
    );
    setCleanliness(null);
    setHasToiletPaper(null);
    setIsUnisex(null);
    setHasBidet(null);
    setHasAccessible(null);
    setHasDiaperTable(null);
    setFormToiletId(
      selectedToiletId ?? (toilets.length === 1 ? toilets[0].id : null)
    );
    setSubmitting(false);
  };

  const pillBtn = (
    selected: boolean,
    onClick: () => void,
    label: string
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "bg-blue-500 text-white"
          : "bg-gray-100 text-gray-600 active:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  const booleanRow = (
    label: string,
    value: boolean | null,
    setValue: (v: boolean) => void,
    trueLabel: string,
    falseLabel: string
  ) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex gap-1.5">
        {pillBtn(value === true, () => setValue(true), trueLabel)}
        {pillBtn(value === false, () => setValue(false), falseLabel)}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* 화장실 선택 (여러 개이고 전체 보기일 때) */}
      {needsToiletSelection && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">위치</span>
          <div className="flex flex-wrap gap-1.5">
            {toilets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormToiletId(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  formToiletId === t.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 active:bg-gray-200"
                }`}
              >
                {t.location}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 청결도 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">청결도</span>
        <div className="flex gap-1.5">
          {pillBtn(cleanliness === 1, () => setCleanliness(1), "😊 깨끗")}
          {pillBtn(cleanliness === 2, () => setCleanliness(2), "😐 보통")}
          {pillBtn(cleanliness === 3, () => setCleanliness(3), "😢 더러움")}
        </div>
      </div>

      {booleanRow("휴지", hasToiletPaper, setHasToiletPaper, "있음", "없음")}
      {booleanRow("남녀구분", isUnisex, setIsUnisex, "공용", "분리")}
      {booleanRow("비데", hasBidet, setHasBidet, "있음", "없음")}
      {booleanRow("장애인 화장실", hasAccessible, setHasAccessible, "있음", "없음")}
      {booleanRow("기저귀 교환대", hasDiaperTable, setHasDiaperTable, "있음", "없음")}

      <button
        onClick={handleSubmit}
        disabled={!allSelected || submitting}
        className="w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white active:bg-blue-600 disabled:bg-gray-300"
      >
        {submitting ? "등록 중..." : "평가 등록"}
      </button>
    </div>
  );
}
