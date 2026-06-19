"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

export const dynamic = "force-dynamic";
export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const onEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) toast.error(error.message);
    else toast.success("Account created! Please verify your email if required.");
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
    <div className="glass elev-2 mx-auto w-full max-w-sm rounded-2xl p-6 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="text-sm text-zinc-500">Sign up to get started</p>
      </div>
      <form onSubmit={onEmailSignup} className="flex flex-col gap-3">
        <Input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 rounded-lg"
        />
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
          {loading ? "Creating..." : "Sign up"}
        </Button>
      </form>
      <Button
        variant="outline"
        onClick={onGoogle}
        className="h-12 rounded-lg"
      >
        Continue with Google
      </Button>
      <p className="text-center text-sm">
        Already have an account? {" "}
        <Link href="/login" className="text-[#10B981] underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
