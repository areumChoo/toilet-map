import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getClientIp } from "@/lib/get-ip";
import { checkRateLimit, recordAction } from "@/lib/rate-limit";
import type { Review, ReviewSummary } from "@/types";

// GET: 건물별 리뷰 목록 + 요약 (toilets 조인, ?toilet_id= 필터링 지원)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const toiletId = request.nextUrl.searchParams.get("toilet_id");

  let query = supabase
    .from("reviews")
    .select("*, toilets!inner(building_id, location)")
    .eq("toilets.building_id", id)
    .order("created_at", { ascending: false });

  if (toiletId) {
    query = query.eq("toilet_id", toiletId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reviews: Review[] = (data ?? []).map(({ toilets, ...rest }: Record<string, unknown>) => ({
    ...(rest as Omit<Review, "toilet_location">),
    toilet_location: (toilets as { location: string }).location,
  }));

  const total_count = reviews.length;

  const summary: ReviewSummary = {
    total_count,
    cleanliness: {
      clean: reviews.filter((r) => r.cleanliness === 1).length,
      average: reviews.filter((r) => r.cleanliness === 2).length,
      dirty: reviews.filter((r) => r.cleanliness === 3).length,
    },
    has_toilet_paper: reviews.filter((r) => r.has_toilet_paper).length,
    is_unisex: reviews.filter((r) => r.is_unisex).length,
    has_bidet: reviews.filter((r) => r.has_bidet).length,
    has_accessible: reviews.filter((r) => r.has_accessible).length,
    has_diaper_table: reviews.filter((r) => r.has_diaper_table).length,
  };

  return NextResponse.json({ summary, reviews });
}

// POST: 리뷰 등록 (toilet_id 필수)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    toilet_id,
    cleanliness,
    has_toilet_paper,
    is_unisex,
    has_bidet,
    has_accessible,
    has_diaper_table,
  } = body;

  if (!toilet_id) {
    return NextResponse.json(
      { error: "Missing required field: toilet_id" },
      { status: 400 }
    );
  }

  if (
    ![1, 2, 3].includes(cleanliness) ||
    typeof has_toilet_paper !== "boolean" ||
    typeof is_unisex !== "boolean" ||
    typeof has_bidet !== "boolean" ||
    typeof has_accessible !== "boolean" ||
    typeof has_diaper_table !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid required fields" },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);

  // 대상별 제한: 같은 toilet에 24시간 내 1건
  const targetCheck = await checkRateLimit(ip, {
    action: "review",
    maxRequests: 1,
    windowMinutes: 24 * 60,
    targetId: toilet_id,
  });

  if (!targetCheck.allowed) {
    return NextResponse.json(
      { error: "이미 이 화장실에 평가를 등록했습니다" },
      { status: 409 }
    );
  }

  // 전역 제한: 10분 내 10건
  const globalCheck = await checkRateLimit(ip, {
    action: "review",
    maxRequests: 10,
    windowMinutes: 10,
  });

  if (!globalCheck.allowed) {
    return NextResponse.json(
      { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // toilet이 해당 건물에 속하는지 검증
  const { data: toilet, error: toiletError } = await supabase
    .from("toilets")
    .select("id")
    .eq("id", toilet_id)
    .eq("building_id", id)
    .single();

  if (toiletError || !toilet) {
    return NextResponse.json(
      { error: "Toilet not found in this building" },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      toilet_id,
      cleanliness,
      has_toilet_paper,
      is_unisex,
      has_bidet,
      has_accessible,
      has_diaper_table,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 성공 시 기록
  await recordAction(ip, "review", toilet_id);

  return NextResponse.json(data, { status: 201 });
}
