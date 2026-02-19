import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getClientIp } from "@/lib/get-ip";
import { checkRateLimit, recordAction } from "@/lib/rate-limit";

// GET: 뷰포트 내 건물 조회
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const swLat = searchParams.get("swLat");
  const swLng = searchParams.get("swLng");
  const neLat = searchParams.get("neLat");
  const neLng = searchParams.get("neLng");

  if (!swLat || !swLng || !neLat || !neLng) {
    return NextResponse.json(
      { error: "Missing bounds parameters" },
      { status: 400 }
    );
  }

  // 화장실이 1개 이상인 건물만 반환 (inner join)
  const { data, error } = await supabase
    .from("buildings")
    .select("id, name, address, road_address, lat, lng, toilets!inner(id, passwords(id))")
    .gte("lat", parseFloat(swLat))
    .lte("lat", parseFloat(neLat))
    .gte("lng", parseFloat(swLng))
    .lte("lng", parseFloat(neLng));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const buildings = (data ?? []).map(({ toilets, ...rest }) => ({
    ...rest,
    has_passwords: (toilets as { passwords: unknown[] }[]).some(
      (t) => t.passwords.length > 0
    ),
  }));

  return NextResponse.json(buildings);
}

// POST: 건물 upsert (주소 기준)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, address, road_address, lat, lng } = body;

  if (!address || lat == null || lng == null) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // 먼저 기존 건물 조회 (주소 기준)
  const { data: existing } = await supabase
    .from("buildings")
    .select("*")
    .eq("address", address)
    .single();

  if (existing) {
    // 기존 건물 반환 시 rate limit 기록 안 함
    return NextResponse.json(existing);
  }

  const ip = getClientIp(request);

  // 전역 제한: 10분 내 10건
  const globalCheck = await checkRateLimit(ip, {
    action: "building",
    maxRequests: 10,
    windowMinutes: 10,
  });

  if (!globalCheck.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 없으면 새로 삽입
  const { data, error } = await supabase
    .from("buildings")
    .insert({ name, address, road_address, lat, lng })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 새 건물 생성 시에만 기록
  await recordAction(ip, "building");

  return NextResponse.json(data, { status: 201 });
}
