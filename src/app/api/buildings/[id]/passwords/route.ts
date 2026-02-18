import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

  // location을 flatten하여 반환
  return NextResponse.json({ ...data, location }, { status: 201 });
}
