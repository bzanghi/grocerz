import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (!user || userErr) return NextResponse.json({ ok: false }, { status: 401 });

  const email = user.email!;
  const full_name = (user.user_metadata as Record<string, unknown> | undefined)?.["full_name"] as string | null ?? null;
  await supabase.from("users").upsert({ id: user.id, email, full_name });
  return NextResponse.json({ ok: true });
}
