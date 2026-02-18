"use client";

import { useState, useEffect } from "react";
import type { Password } from "@/types";
import { REPORT_THRESHOLD } from "@/lib/constants";
import { hasReportedPassword, markPasswordReported } from "@/lib/local-actions";

interface PasswordCardProps {
  password: Password;
  onReport: (id: string) => Promise<boolean>;
}

export default function PasswordCard({ password, onReport }: PasswordCardProps) {
  const [copied, setCopied] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    setReported(hasReportedPassword(password.id));
  }, [password.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleReport = async () => {
    setReporting(true);
    const success = await onReport(password.id);
    if (success) {
      markPasswordReported(password.id);
      setReported(true);
    }
    setReporting(false);
  };

  const isWarning = password.report_count >= REPORT_THRESHOLD;

  return (
    <div
      className={`rounded-xl border p-3 ${
        isWarning
          ? "border-red-200 bg-red-50/60"
          : "border-gray-100 bg-gray-50/50"
      }`}
    >
      <div className="flex items-center gap-2">
        {/* 위치 라벨 */}
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
          {password.location}
        </span>
        <span className="text-xs text-gray-300">
          {new Date(password.created_at).toLocaleDateString("ko-KR")}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {/* 비밀번호 */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-bold tracking-widest text-gray-800">
            {password.password}
          </span>
          <button
            onClick={handleCopy}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              copied
                ? "bg-green-100 text-green-600"
                : "bg-blue-50 text-blue-600 active:bg-blue-100"
            }`}
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                복사됨
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                복사
              </>
            )}
          </button>
        </div>

        {/* 신고 */}
        {reported ? (
          <span className="shrink-0 rounded-full px-2 py-1 text-xs text-orange-500">
            신고완료
          </span>
        ) : (
          <button
            onClick={handleReport}
            disabled={reporting}
            className="shrink-0 rounded-full px-2 py-1 text-xs text-gray-400 active:bg-gray-100 disabled:opacity-50"
          >
            신고 {password.report_count > 0 && `(${password.report_count})`}
          </button>
        )}
      </div>

      {isWarning && (
        <p className="mt-1.5 text-xs text-red-500">
          신고가 많아 정확하지 않을 수 있습니다
        </p>
      )}
    </div>
  );
}
