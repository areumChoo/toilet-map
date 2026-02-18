"use client";

import { useState, useEffect } from "react";
import type { Password } from "@/types";
import { FRESHNESS_RECENT_DAYS, FRESHNESS_MODERATE_DAYS } from "@/lib/constants";
import { hasVotedPassword } from "@/lib/local-actions";

interface PasswordCardProps {
  password: Password;
  onVote: (id: string, vote: "confirm" | "wrong", newPassword?: string) => Promise<boolean>;
}

function getFreshness(lastConfirmedAt: string | null) {
  if (!lastConfirmedAt) return { label: "미확인", color: "text-gray-400" };
  const days = Math.floor(
    (Date.now() - new Date(lastConfirmedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= FRESHNESS_RECENT_DAYS) {
    return { label: `${days}일 전 확인`, color: "text-green-500" };
  }
  if (days <= FRESHNESS_MODERATE_DAYS) {
    return { label: `${days}일 전 확인`, color: "text-yellow-500" };
  }
  return { label: "미확인", color: "text-gray-400" };
}

export default function PasswordCard({ password, onVote }: PasswordCardProps) {
  const [copied, setCopied] = useState(false);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [showWrongForm, setShowWrongForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setVoted(hasVotedPassword(password.id));
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

  const handleConfirm = async () => {
    setVoting(true);
    const success = await onVote(password.id, "confirm");
    if (success) setVoted(true);
    setVoting(false);
  };

  const handleWrongSubmit = async () => {
    setVoting(true);
    const success = await onVote(password.id, "wrong", newPassword || undefined);
    if (success) {
      setVoted(true);
      setShowWrongForm(false);
      setNewPassword("");
    }
    setVoting(false);
  };

  const freshness = getFreshness(password.last_confirmed_at);

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
      <div className="flex items-center gap-2">
        {/* 위치 라벨 */}
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
          {password.location}
        </span>
        <span className={`text-xs ${freshness.color}`}>{freshness.label}</span>
        {password.confirm_count > 0 && (
          <span className="text-xs text-green-500">{password.confirm_count}명 확인</span>
        )}
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

        {/* 투표 */}
        {voted ? (
          <span className="shrink-0 rounded-full px-2 py-1 text-xs text-gray-400">
            투표완료
          </span>
        ) : (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={handleConfirm}
              disabled={voting}
              className="rounded-full px-2 py-1 text-xs text-green-600 active:bg-green-50 disabled:opacity-50"
            >
              맞아요
            </button>
            <button
              onClick={() => setShowWrongForm((v) => !v)}
              disabled={voting}
              className="rounded-full px-2 py-1 text-xs text-red-500 active:bg-red-50 disabled:opacity-50"
            >
              틀려요
            </button>
          </div>
        )}
      </div>

      {/* 틀려요 폼 */}
      {showWrongForm && !voted && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 (선택)"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-300"
          />
          <button
            onClick={handleWrongSubmit}
            disabled={voting}
            className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white active:bg-red-600 disabled:opacity-50"
          >
            제출
          </button>
        </div>
      )}
    </div>
  );
}
