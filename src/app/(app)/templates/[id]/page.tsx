"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ShoppingTemplate, ShoppingTemplateItem } from "@/lib/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = React.useState<ShoppingTemplate | null>(null);
  const [items, setItems] = React.useState<ShoppingTemplateItem[]>([]);
  const [name, setName] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [category, setCategory] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: t, error: te } = await supabase.from("shopping_templates").select("*").eq("id", id).single();
      if (te) return toast.error(te.message);
      setTemplate(t as ShoppingTemplate);
      const { data: its, error: ie } = await supabase
        .from("shopping_template_items")
        .select("*")
        .eq("template_id", id)
        .order("name");
      if (ie) return toast.error(ie.message);
      setItems((its ?? []) as ShoppingTemplateItem[]);
    };
    if (id) load();
  }, [id]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("shopping_template_items")
      .insert({ template_id: id, name: name.trim(), quantity: quantity.trim() || null, category: category.trim() || null })
      .select("*")
      .single();
    if (error) return toast.error(error.message);
    setItems((prev) => [data as ShoppingTemplateItem, ...prev]);
    setName("");
    setQuantity("");
    setCategory("");
  };

  const removeItem = async (itemId: string) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("shopping_template_items").delete().eq("id", itemId);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  if (!template) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;
  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 glass p-4 elev-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{template.name}</h1>
          <Link href="/templates" className="text-[#10B981] underline">
            Back
          </Link>
        </div>
      </div>

      <form onSubmit={addItem} className="flex gap-2">
        <Input placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 flex-1 rounded-lg" />
        <Input placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-12 w-24 rounded-lg" />
        <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 w-28 rounded-lg" />
        <Button type="submit" className="h-12 rounded-lg bg-[#10B981] text-white hover:bg-[#0EA371]">
          Add
        </Button>
      </form>

      <div className="rounded-xl glass elev-1">
        {!items.length ? (
          <div className="p-4 text-sm text-zinc-500">No items yet.</div>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="text-sm font-medium">{it.name}</div>
                  <div className="text-xs text-zinc-500">{[it.quantity, it.category].filter(Boolean).join(" • ")}</div>
                </div>
                <Button variant="ghost" className="text-red-500" onClick={() => removeItem(it.id)}>
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
