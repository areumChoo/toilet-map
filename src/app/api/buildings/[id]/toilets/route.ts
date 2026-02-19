import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getClientIp } from "@/lib/get-ip";
import { checkRateLimit, recordAction } from "@/lib/rate-limit";

// GET: 건물별 화장실 목록
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("toilets")
    .select("*")
    .eq("building_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: 화장실 등록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { location } = body;

  if (!location) {
    return NextResponse.json(
      { error: "Missing required field: location" },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const globalCheck = await checkRateLimit(ip, {
    action: "toilet",
    maxRequests: 10,
    windowMinutes: 10,
  });

  if (!globalCheck.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const { data, error } = await supabase
    .from("toilets")
    .upsert(
      { building_id: id, location },
      { onConflict: "building_id,location" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAction(ip, "toilet");

  return NextResponse.json(data, { status: 201 });
}
