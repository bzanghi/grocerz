"use client";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ShoppingItem } from "@/lib/types/db";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ShoppingList({ shoppingMode }: { shoppingMode?: boolean }) {
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
      .update({ is_checked: !item.is_checked, completed_at: !item.is_checked ? new Date().toISOString() : null })
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

  if (!shoppingMode) {
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

  const grouped = items.reduce((acc: Record<string, ShoppingItem[]>, it) => {
    const key = it.category || "Uncategorized";
    acc[key] = acc[key] || [];
    acc[key].push(it);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  const total = items.reduce((sum, it) => sum + (it.estimated_price ?? 0), 0);
  const done = items.filter((i) => i.is_checked).length;
  const progress = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 -mx-4 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span>
            {done} of {items.length} items
          </span>
          <span className="font-medium">${total.toFixed(2)}</span>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <div className="sticky top-28 z-0 -mx-4 bg-white px-4 py-2 text-xs font-semibold text-zinc-500">
            {cat}
          </div>
          <ul className="flex flex-col divide-y">
            {grouped[cat]
              .filter((i) => !i.is_checked)
              .map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <Checkbox checked={item.is_checked} onCheckedChange={() => toggleChecked(item)} />
                  <div className="flex-1">
                    <div className={`text-base ${item.is_checked ? "line-through text-zinc-400" : ""}`}>{item.name}</div>
                    <div className="text-xs text-zinc-500">
                      {[item.quantity, item.category].filter(Boolean).join(" • ")}
                    </div>
                  </div>
                </li>
              ))}
          </ul>

          {/* Completed sub-section */}
          {grouped[cat].some((i) => i.is_checked) && (
            <div className="mt-2 rounded-lg bg-zinc-50 p-2">
              <div className="mb-1 text-xs font-medium text-zinc-500">Completed</div>
              <ul className="flex flex-col divide-y">
                {grouped[cat]
                  .filter((i) => i.is_checked)
                  .map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-2">
                      <Checkbox checked={item.is_checked} onCheckedChange={() => toggleChecked(item)} />
                      <div className="flex-1 text-sm line-through text-zinc-400">{item.name}</div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
