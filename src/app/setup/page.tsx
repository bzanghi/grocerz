"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
function SetupInner() {
  // Avoid SSR errors when env is missing by forcing dynamic
  // and keeping this page fully client-side
  
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite");
  const [loading, setLoading] = useState(false);
  const [householdName, setHouseholdName] = useState("");

  useEffect(() => {
    if (invite) acceptInvite(invite);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite]);

  const acceptInvite = async (token: string) => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("accept_invite", { invite_token: token });
    if (error) toast.error(error.message);
    else {
      toast.success("Joined household!");
      router.replace("/dashboard");
    }
    setLoading(false);
  };

  const createHousehold = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (!user || userErr) {
      toast.error("Not authenticated");
      setLoading(false);
      return;
    }
    const { data: hh, error: hhErr } = await supabase
      .from("households")
      .insert({ name: householdName || null })
      .select("id")
      .single();
    if (hhErr) {
      toast.error(hhErr.message);
      setLoading(false);
      return;
    }
    const { error: updErr } = await supabase
      .from("users")
      .update({ household_id: hh.id })
      .eq("id", user.id);
    if (updErr) toast.error(updErr.message);
    else {
      toast.success("Household created!");
      router.replace("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Set up your household</h1>
        <p className="text-sm text-zinc-500">
          Create a new household or use an invite link to join your partner.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Create new household</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Household name (optional)"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            className="h-12 rounded-lg"
          />
          <Button
            onClick={createHousehold}
            disabled={loading}
            className="h-12 rounded-lg bg-[#10B981] text-white hover:bg-[#0EA371]"
          >
            Create
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Join with invite link</h2>
        <p className="text-sm text-zinc-500">
          If you have an invite link, open it on this device to join.
        </p>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-zinc-500">Loading…</div>}>
      <SetupInner />
    </Suspense>
  );
}
