"use client";
import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ShoppingItem } from "@/lib/types/db";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { mergeQuantities } from "@/lib/quantity";

export default function QuickHistory() {
  const [recent, setRecent] = React.useState<ShoppingItem[]>([]);

  React.useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("household_id")
        .eq("id", user.id)
        .single();
      const householdId = profile?.household_id as string | undefined;
      if (!householdId) return;
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("household_id", householdId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(50);
      if (error) return toast.error(error.message);
      const byName = new Map<string, ShoppingItem>();
      for (const it of (data ?? []) as ShoppingItem[]) {
        const key = it.name.toLowerCase();
        if (!byName.has(key)) byName.set(key, it);
      }
      setRecent(Array.from(byName.values()));
    };
    load();
  }, []);

  const readd = async (it: ShoppingItem) => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("users")
      .select("household_id")
      .eq("id", user?.id)
      .single();
    const householdId = profile?.household_id as string | undefined;
    if (!householdId) return toast.error("No household linked.");

    // Merge into existing unchecked item if present
    const { data: existing } = await supabase
      .from("shopping_items")
      .select("id, quantity, is_checked")
      .eq("household_id", householdId)
      .ilike("name", it.name)
      .limit(1);

    if (existing && existing.length > 0) {
      const curr = existing[0];
      const newQty = mergeQuantities(curr.quantity, it.quantity);
      const { error } = await supabase
        .from("shopping_items")
        .update({ quantity: newQty, is_checked: false, category: it.category, completed_at: null })
        .eq("id", curr.id);
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.from("shopping_items").insert({
        household_id: householdId,
        name: it.name,
        quantity: it.quantity,
        category: it.category,
        is_checked: false,
      });
      if (error) toast.error(error.message);
    }
  };

  if (!recent.length) return null;
  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 pt-1">
      {recent.map((it) => (
        <Button
          key={it.id}
          variant="outline"
          className="h-8 shrink-0 rounded-full px-3 text-xs"
          onClick={() => readd(it)}
          title={[it.quantity, it.category].filter(Boolean).join(" • ")}
        >
          {it.name}
        </Button>
      ))}
    </div>
  );
}
