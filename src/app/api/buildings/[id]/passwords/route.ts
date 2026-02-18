import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getClientIp } from "@/lib/get-ip";
import { checkRateLimit, recordAction } from "@/lib/rate-limit";

// GET: 건물별 비밀번호 목록 (toilets 조인)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("passwords")
    .select("*, toilets!inner(building_id, location)")
    .eq("toilets.building_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // toilets에서 location을 flatten
  const flattened = (data ?? []).map(({ toilets, ...rest }: Record<string, unknown>) => ({
    ...rest,
    location: (toilets as { location: string }).location,
  }));

  return NextResponse.json(flattened);
}

// POST: 비밀번호 등록 (toilet 자동 생성/조회)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { location, password } = body;

  if (!location || !password) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);

  // 전역 제한: 10분 내 5건
  const globalCheck = await checkRateLimit(ip, {
    action: "password",
    maxRequests: 5,
    windowMinutes: 10,
  });

  if (!globalCheck.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // toilet upsert
  const { data: toilet, error: toiletError } = await supabase
    .from("toilets")
    .upsert(
      { building_id: id, location },
      { onConflict: "building_id,location" }
    )
    .select()
    .single();

  if (toiletError || !toilet) {
    return NextResponse.json(
      { error: toiletError?.message ?? "Failed to create toilet" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("passwords")
    .insert({ toilet_id: toilet.id, password })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 성공 시 기록
  await recordAction(ip, "password");

  // location을 flatten하여 반환
  return NextResponse.json({ ...data, location }, { status: 201 });
}
