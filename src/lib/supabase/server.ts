import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  // Support Next.js variations in cookies() return type
  const cookieStore = (typeof (cookies as unknown as () => unknown) === "function"
    ? await (cookies as unknown as () => Promise<{ getAll: () => { name: string; value: string }[]; set: (name: string, value: string, options?: Record<string, unknown>) => void }>)()
    : (cookies as unknown as { getAll: () => { name: string; value: string }[]; set: (name: string, value: string, options?: Record<string, unknown>) => void })) as {
    getAll: () => { name: string; value: string }[];
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
