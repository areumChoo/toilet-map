import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

  const { data, error } = await supabase
    .from("buildings")
    .select("*, passwords(id)")
    .gte("lat", parseFloat(swLat))
    .lte("lat", parseFloat(neLat))
    .gte("lng", parseFloat(swLng))
    .lte("lng", parseFloat(neLng));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 비밀번호가 1개 이상 등록된 건물만 반환
  const filtered = (data ?? [])
    .filter((b: Record<string, unknown>) => Array.isArray(b.passwords) && b.passwords.length > 0)
    .map(({ passwords: _pw, ...rest }) => rest);

  return NextResponse.json(filtered);
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
    return NextResponse.json(existing);
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

  return NextResponse.json(data, { status: 201 });
}
