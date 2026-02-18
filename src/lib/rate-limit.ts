import { supabaseAdmin } from "./supabase-server";

interface RateLimitConfig {
  action: string;
  maxRequests: number;
  windowMinutes: number;
  targetId?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.RATE_LIMIT_SALT ?? "toilet-map-salt"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ipHash = await hashIp(ip);
  const since = new Date(
    Date.now() - config.windowMinutes * 60 * 1000
  ).toISOString();

  let query = supabaseAdmin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("action", config.action)
    .gte("created_at", since);

  if (config.targetId) {
    query = query.eq("target_id", config.targetId);
  }

  const { count } = await query;
  const current = count ?? 0;
  const allowed = current < config.maxRequests;

  return { allowed, remaining: Math.max(0, config.maxRequests - current) };
}

export async function recordAction(
  ip: string,
  action: string,
  targetId?: string
): Promise<void> {
  const ipHash = await hashIp(ip);

  await supabaseAdmin.from("rate_limits").insert({
    ip_hash: ipHash,
    action,
    target_id: targetId ?? null,
  });

  // 1% 확률로 7일 이상 오래된 기록 정리
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from("rate_limits")
      .delete()
      .lt("created_at", cutoff);
  }
}
