import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getClientIp } from "@/lib/get-ip";
import { checkRateLimit, recordAction } from "@/lib/rate-limit";

// POST: 맞아요/틀려요 투표
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { vote, newPassword } = body as {
    vote: "confirm" | "wrong";
    newPassword?: string;
  };

  if (vote !== "confirm" && vote !== "wrong") {
    return NextResponse.json(
      { error: "Invalid vote type" },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);

  // 대상별 제한: 같은 password에 24시간 내 1건
  const targetCheck = await checkRateLimit(ip, {
    action: "vote",
    maxRequests: 1,
    windowMinutes: 24 * 60,
    targetId: id,
  });

  if (!targetCheck.allowed) {
    return NextResponse.json(
      { error: "이미 투표한 비밀번호입니다" },
      { status: 409 }
    );
  }

  // 전역 제한: 10분 내 20건
  const globalCheck = await checkRateLimit(ip, {
    action: "vote",
    maxRequests: 20,
    windowMinutes: 10,
  });

  if (!globalCheck.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 현재 password 조회
  const { data: current, error: fetchError } = await supabase
    .from("passwords")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json(
      { error: "Password not found" },
      { status: 404 }
    );
  }

  if (vote === "confirm") {
    const { data, error } = await supabase
      .from("passwords")
      .update({
        confirm_count: current.confirm_count + 1,
        last_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAction(ip, "vote", id);
    return NextResponse.json(data);
  }

  // vote === "wrong"
  const { data: voted, error: wrongError } = await supabase
    .from("passwords")
    .update({
      wrong_count: current.wrong_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (wrongError) {
    return NextResponse.json({ error: wrongError.message }, { status: 500 });
  }

  let createdPassword = null;

  if (newPassword && newPassword.trim()) {
    const { data: newPw, error: insertError } = await supabase
      .from("passwords")
      .insert({ toilet_id: current.toilet_id, password: newPassword.trim() })
      .select()
      .single();

    if (!insertError && newPw) {
      createdPassword = newPw;
    }
  }

  await recordAction(ip, "vote", id);
  return NextResponse.json({ voted, createdPassword });
}
