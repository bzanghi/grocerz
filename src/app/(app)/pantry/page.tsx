"use client";
import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PantryItem } from "@/lib/types/db";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function PantryPage() {
  const [items, setItems] = React.useState<PantryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [category, setCategory] = React.useState("");

  React.useEffect(() => {
    let householdId: string | null = null;
    let subscription: ReturnType<ReturnType<typeof createSupabaseBrowserClient>["channel"]> | null = null;
    const init = async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("users")
        .select("household_id")
        .eq("id", user?.id)
        .single();
      householdId = profile?.household_id ?? null;
      if (!householdId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("pantry_items")
        .select("*")
        .eq("household_id", householdId)
        .order("updated_at", { ascending: false });
      if (error) toast.error(error.message);
      else setItems((data ?? []) as PantryItem[]);
      setLoading(false);

      subscription = supabase
        .channel("pantry_items")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pantry_items", filter: `household_id=eq.${householdId}` },
          (payload) => {
            setItems((prev) => {
              if (payload.eventType === "INSERT") return [payload.new as PantryItem, ...prev];
              if (payload.eventType === "UPDATE") {
                const u = payload.new as PantryItem;
                return prev.map((i) => (i.id === u.id ? u : i));
              }
              if (payload.eventType === "DELETE") {
                const r = payload.old as { id: string };
                return prev.filter((i) => i.id !== r.id);
              }
              return prev;
            });
          }
        )
        .subscribe();
    };
    init();
    return () => {
      const supabase = createSupabaseBrowserClient();
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("users")
      .select("household_id")
      .eq("id", user?.id)
      .single();
    const householdId = profile?.household_id;
    if (!householdId) return toast.error("No household linked.");
    const { error } = await supabase.from("pantry_items").insert({
      household_id: householdId,
      name: name.trim(),
      quantity: quantity.trim() || null,
      category: category.trim() || null,
      on_hand: true,
    });
    if (error) toast.error(error.message);
    else {
      setName("");
      setQuantity("");
      setCategory("");
    }
  };

  const toggleOnHand = async (item: PantryItem) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("pantry_items")
      .update({ on_hand: !item.on_hand })
      .eq("id", item.id);
    if (error) toast.error(error.message);
  };

  const removeItem = async (id: string) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("pantry_items").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  if (loading) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 glass p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Pantry</h1>
          <Link href="/dashboard" className="text-[#10B981] underline">
            Back
          </Link>
        </div>
      </div>

      <form onSubmit={addItem} className="flex gap-2">
        <Input placeholder="Add pantry item" value={name} onChange={(e) => setName(e.target.value)} className="h-12 flex-1 rounded-lg" />
        <Input placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-12 w-24 rounded-lg" />
        <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 w-28 rounded-lg" />
        <Button className="h-12 rounded-lg bg-[#10B981] text-white hover:bg-[#0EA371]" type="submit">
          Add
        </Button>
      </form>

      <div className="rounded-xl glass elev-1">
        {!items.length ? (
          <div className="p-4 text-sm text-zinc-500">No pantry items yet.</div>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3">
                <Checkbox checked={item.on_hand} onCheckedChange={() => toggleOnHand(item)} />
                <div className="flex-1">
                  <div className="text-base">
                    {item.name}
                    {!item.on_hand && <span className="ml-2 text-xs text-red-500">out</span>}
                  </div>
                  <div className="text-xs text-zinc-500">{[item.quantity, item.category].filter(Boolean).join(" • ")}</div>
                </div>
                <Button variant="ghost" onClick={() => removeItem(item.id)} className="text-red-500">
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
