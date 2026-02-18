"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SelectedBuilding, Password, Toilet } from "@/types";
import PasswordCard from "./PasswordCard";
import PasswordForm from "./PasswordForm";
import ReviewSection from "./ReviewSection";
import { markPasswordVoted } from "@/lib/local-actions";

interface BuildingPanelProps {
  building: SelectedBuilding | null;
  onClose: () => void;
}

export default function BuildingPanel({
  building,
  onClose,
}: BuildingPanelProps) {
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedToiletId, setSelectedToiletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // 드래그 관련
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);

  // 열림/닫힘 애니메이션
  useEffect(() => {
    if (building) {
      // 다음 프레임에서 visible을 켜서 CSS transition 작동
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [building]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300); // transition 끝난 후 실제 닫기
  }, [onClose]);

  // 드래그 제스처
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    // 아래로만 드래그 허용
    dragCurrentY.current = Math.max(0, dy);
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dragCurrentY.current}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
    }
    // 100px 이상 드래그하면 닫기
    if (dragCurrentY.current > 100) {
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    dragCurrentY.current = 0;
  }, [handleClose]);

  // 건물 upsert → id 획득 → 비밀번호 목록 조회
  const loadBuilding = useCallback(async (b: SelectedBuilding) => {
    setLoading(true);
    setPasswords([]);
    setToilets([]);
    setSelectedToiletId(null);
    setBuildingId(null);

    try {
      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const data = await res.json();
      if (data.id) {
        setBuildingId(data.id);
        const [pwRes, toiletRes] = await Promise.all([
          fetch(`/api/buildings/${data.id}/passwords`),
          fetch(`/api/buildings/${data.id}/toilets`),
        ]);
        const pwData = await pwRes.json();
        const toiletData = await toiletRes.json();
        if (Array.isArray(pwData)) setPasswords(pwData);
        if (Array.isArray(toiletData)) setToilets(toiletData);
      }
    } catch {
      // 네트워크 에러
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (building) {
      loadBuilding(building);
    }
  }, [building, loadBuilding]);

  const handleAddPassword = async (location: string, password: string) => {
    if (!buildingId) return;
    try {
      const res = await fetch(`/api/buildings/${buildingId}/passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, password }),
      });

      if (res.status === 429) {
        alert("너무 많은 요청입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const data = await res.json();
      if (data.id) {
        setPasswords((prev) => [data, ...prev]);
        // 비밀번호 등록 시 새 toilet이 생성될 수 있으므로 목록 갱신
        const toiletRes = await fetch(`/api/buildings/${buildingId}/toilets`);
        const toiletData = await toiletRes.json();
        if (Array.isArray(toiletData)) setToilets(toiletData);
      }
    } catch {
      // 에러 처리
    }
  };

  const handleVote = async (
    id: string,
    vote: "confirm" | "wrong",
    newPassword?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/passwords/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, newPassword }),
      });

      if (res.status === 409) {
        markPasswordVoted(id);
        alert("이미 투표한 비밀번호입니다");
        return false;
      }

      if (res.status === 429) {
        alert("너무 많은 요청입니다. 잠시 후 다시 시도해주세요.");
        return false;
      }

      const data = await res.json();

      if (vote === "confirm" && data.id) {
        setPasswords((prev) =>
          prev.map((p) => (p.id === id ? data : p))
        );
        markPasswordVoted(id);
        return true;
      }

      if (vote === "wrong" && data.voted) {
        setPasswords((prev) => {
          const updated = prev.map((p) =>
            p.id === id ? data.voted : p
          );
          if (data.createdPassword) {
            return [
              { ...data.createdPassword, location: prev.find((p) => p.id === id)?.location ?? "" },
              ...updated,
            ];
          }
          return updated;
        });
        markPasswordVoted(id);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  if (!building) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          visible ? "opacity-30" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* 드래그 핸들 영역 */}
        <div
          className="sticky top-0 z-10 bg-white pb-2 pt-3 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300" />
          <div className="flex items-start justify-between px-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold">
                {building.name || building.road_address || building.address}
              </h2>
              {building.road_address && (
                <p className="truncate text-xs text-gray-500">
                  {building.road_address}
                </p>
              )}
              <p className="truncate text-xs text-gray-400">
                {building.address}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-2 shrink-0 rounded-full p-1 text-gray-400 active:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-3 px-4 pb-4">
          {/* 비밀번호 목록 */}
          {loading ? (
            <div className="space-y-2 py-2">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-gray-100 p-3">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="mt-2 h-5 w-32 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : passwords.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-2 text-gray-300"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p className="text-sm">등록된 비밀번호가 없습니다</p>
              <p className="mt-1 text-xs text-gray-300">아래에서 첫 번째로 등록해보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {passwords.map((pw) => (
                <PasswordCard
                  key={pw.id}
                  password={pw}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}

          {/* 비밀번호 등록 폼 */}
          {buildingId && (
            <div className="border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">
                비밀번호 등록
              </p>
              <PasswordForm onSubmit={handleAddPassword} />
            </div>
          )}

          {/* 간단평가 */}
          {buildingId && (
            <div className="border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">간단평가</p>
              {toilets.length >= 2 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedToiletId(null)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedToiletId === null
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 active:bg-gray-200"
                    }`}
                  >
                    전체
                  </button>
                  {toilets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedToiletId(t.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selectedToiletId === t.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 active:bg-gray-200"
                      }`}
                    >
                      {t.location}
                    </button>
                  ))}
                </div>
              )}
              <ReviewSection
                buildingId={buildingId}
                toilets={toilets}
                selectedToiletId={selectedToiletId}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
