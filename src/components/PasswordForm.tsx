"use client";

import { useState } from "react";

interface PasswordFormProps {
  onSubmit: (location: string, password: string) => Promise<void>;
}

export default function PasswordForm({ onSubmit }: PasswordFormProps) {
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !password.trim()) return;
    setSubmitting(true);
    await onSubmit(location.trim(), password.trim());
    setLocation("");
    setPassword("");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="위치 (예: 1층 남자화장실)"
        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <input
        type="text"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        className="w-24 shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={submitting || !location.trim() || !password.trim()}
        className="shrink-0 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white active:bg-blue-600 disabled:bg-gray-300"
      >
        {submitting ? "..." : "등록"}
      </button>
    </form>
  );
}
