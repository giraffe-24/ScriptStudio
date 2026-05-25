import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return false;
  // publishable / anon キーを誤設定している場合は無効扱い
  if (key.startsWith("sb_publishable_")) return false;
  return true;
}

export function getSupabaseConfigHint(): string | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return "SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を Vercel に設定してください。";
  }
  if (key.startsWith("sb_publishable_")) {
    return "SUPABASE_SERVICE_ROLE_KEY に publishable キーが入っています。Supabase の service_role（secret）キーに差し替えてください。";
  }
  return null;
}

export function getSupabaseServer(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase が未設定です（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）");
  }
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL!.trim(),
      process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    );
  }
  return client;
}
