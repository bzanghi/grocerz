"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export const dynamic = "force-dynamic";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else window.location.href = "/post-auth";
    setLoading(false);
  };

  const onGoogle = async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) toast.error(error.message);
    if (data?.url) window.location.href = data.url;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-zinc-500">Log in to continue</p>
      </div>
      <form onSubmit={onEmailLogin} className="flex flex-col gap-3">
        <Input
          inputMode="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-lg"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-lg"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-12 rounded-lg bg-[#10B981] text-white hover:bg-[#0EA371]"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <Button
        variant="outline"
        onClick={onGoogle}
        className="h-12 rounded-lg border-[#F59E0B] text-[#F59E0B] hover:bg-[#FFF7ED]"
      >
        Continue with Google
      </Button>
      <p className="text-center text-sm">
        Don&apos;t have an account? {" "}
        <Link href="/signup" className="text-[#10B981] underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
