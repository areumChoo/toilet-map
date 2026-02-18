import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { REPORT_THRESHOLD } from "@/lib/constants";

// PATCH: 신고 카운트 증가
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  return NextResponse.json(data);
}
