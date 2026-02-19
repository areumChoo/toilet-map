"use client";

import { useState, useCallback, useRef } from "react";

const KAKAOPAY_LINK = "https://qr.kakaopay.com/Ej7lWeRDg";

export default function DonationButton() {
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);

  const handleOpen = useCallback(() => {
    setVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
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
    if (dragCurrentY.current > 100) {
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    dragCurrentY.current = 0;
  }, [handleClose]);

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg active:scale-95 transition-transform"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="개발자 응원하기"
      >
        <span className="text-xl">🧻</span>
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          visible ? "opacity-30" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* 기부 바텀시트 */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* 드래그 핸들 */}
        <div
          className="sticky top-0 z-10 bg-white pb-2 pt-3 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pb-6">
          <div className="text-center">
            <p className="text-4xl">🧻</p>
            <h3 className="mt-2 text-base font-bold text-gray-900">
              급한 순간, 도움이 됐나요?
            </h3>
            <p className="mt-1.5 text-sm text-gray-500">
              인간 존엄을 지켜준 개발자에게
              <br />
              휴지 한 롤 기부해주세요
            </p>
          </div>

          <a
            href={KAKAOPAY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 text-sm font-semibold text-[#191919] active:bg-[#F0D800] transition-colors"
          >
            카카오페이로 1,000원 보내기
          </a>

          <button
            onClick={handleClose}
            className="mt-2 w-full py-2 text-xs text-gray-400 active:text-gray-500"
          >
            다음에 할게요
          </button>
        </div>
      </div>
    </>
  );
}
