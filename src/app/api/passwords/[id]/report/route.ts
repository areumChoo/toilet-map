import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { REPORT_THRESHOLD } from "@/lib/constants";
import { getClientIp } from "@/lib/get-ip";
import { checkRateLimit, recordAction } from "@/lib/rate-limit";

// PATCH: 신고 카운트 증가
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(request);

  // 대상별 제한: 같은 password에 24시간 내 1건
  const targetCheck = await checkRateLimit(ip, {
    action: "report",
    maxRequests: 1,
    windowMinutes: 24 * 60,
    targetId: id,
  });

  if (!targetCheck.allowed) {
    return NextResponse.json(
      { error: "이미 신고한 비밀번호입니다" },
      { status: 409 }
    );
  }

  // 전역 제한: 10분 내 20건
  const globalCheck = await checkRateLimit(ip, {
    action: "report",
    maxRequests: 20,
    windowMinutes: 10,
  });

  if (!globalCheck.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 현재 신고 수 조회
  const { data: current, error: fetchError } = await supabase
    .from("passwords")
    .select("report_count")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json(
      { error: "Password not found" },
      { status: 404 }
    );
  }

  const newCount = current.report_count + 1;
  const isActive = newCount < REPORT_THRESHOLD;

  const { data, error } = await supabase
    .from("passwords")
    .update({
      report_count: newCount,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 성공 시 기록
  await recordAction(ip, "report", id);

  return NextResponse.json(data);
}
