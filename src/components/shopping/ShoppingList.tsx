"use client";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ShoppingItem } from "@/lib/types/db";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let householdId: string | null = null;
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      setLoading(true);
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (!user || userErr) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("household_id")
        .eq("id", user.id)
        .single();
      householdId = profile?.household_id ?? null;
      if (!householdId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setItems((data ?? []) as ShoppingItem[]);
      setLoading(false);

      subscription = supabase
        .channel("shopping_items")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shopping_items", filter: `household_id=eq.${householdId}` },
          (payload) => {
            setItems((prev) => {
              const copy = [...prev];
              if (payload.eventType === "INSERT") {
                return [payload.new as ShoppingItem, ...copy];
              }
              if (payload.eventType === "UPDATE") {
                const updated = payload.new as ShoppingItem;
                return copy.map((i) => (i.id === updated.id ? updated : i));
              }
              if (payload.eventType === "DELETE") {
                const removed = payload.old as { id: string };
                return copy.filter((i) => i.id !== removed.id);
              }
              return prev;
            });
          }
        )
        .subscribe();
    };

    init();
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [supabase]);

  const toggleChecked = async (item: ShoppingItem) => {
    const { error } = await supabase
      .from("shopping_items")
      .update({ is_checked: !item.is_checked })
      .eq("id", item.id);
    if (error) toast.error(error.message);
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("shopping_items").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  if (loading) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;
  if (!items.length)
    return (
      <div className="rounded-lg border p-4 text-sm text-zinc-500">
        Your list is empty. Add items to get started.
      </div>
    );

  return (
    <ul className="flex flex-col divide-y">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-3">
          <Checkbox checked={item.is_checked} onCheckedChange={() => toggleChecked(item)} />
          <div className="flex-1">
            <div className={`text-base ${item.is_checked ? "line-through text-zinc-400" : ""}`}>{item.name}</div>
            <div className="text-xs text-zinc-500">
              {[item.quantity, item.category].filter(Boolean).join(" • ")}
            </div>
          </div>
          <Button variant="ghost" onClick={() => removeItem(item.id)} className="text-red-500">
            Delete
          </Button>
        </li>
      ))}
    </ul>
  );
}
