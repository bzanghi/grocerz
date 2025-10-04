"use client";
import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ShoppingTemplate, ShoppingTemplateItem, ShoppingItem } from "@/lib/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { mergeQuantities } from "@/lib/quantity";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<ShoppingTemplate[]>([]);
  const [name, setName] = React.useState("");

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
        .from("shopping_templates")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setTemplates((data ?? []) as ShoppingTemplate[]);
    };
    load();
  }, []);

  const createTemplate = async (e: React.FormEvent) => {
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
    const householdId = profile?.household_id as string | undefined;
    if (!householdId) return toast.error("No household linked.");
    const { data, error } = await supabase
      .from("shopping_templates")
      .insert({ household_id: householdId, name: name.trim() })
      .select("*")
      .single();
    if (error) toast.error(error.message);
    else {
      setTemplates((prev) => [data as ShoppingTemplate, ...prev]);
      setName("");
    }
  };

  const applyTemplate = async (templateId: string) => {
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

    const { data: items, error } = await supabase
      .from("shopping_template_items")
      .select("*")
      .eq("template_id", templateId);
    if (error) return toast.error(error.message);

    for (const t of (items ?? []) as ShoppingTemplateItem[]) {
      const { data: existing } = await supabase
        .from("shopping_items")
        .select("id, quantity")
        .eq("household_id", householdId)
        .ilike("name", t.name)
        .limit(1);
      if (existing && existing.length > 0) {
        const curr = existing[0];
        const newQty = mergeQuantities(curr.quantity, t.quantity);
        await supabase
          .from("shopping_items")
          .update({ quantity: newQty, category: t.category, is_checked: false, completed_at: null })
          .eq("id", curr.id);
      } else {
        await supabase.from("shopping_items").insert({
          household_id: householdId,
          name: t.name,
          quantity: t.quantity,
          category: t.category,
          is_checked: false,
        } satisfies Partial<ShoppingItem>);
      }
    }
    toast.success("Template applied to list.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 glass p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Templates</h1>
          <Link href="/dashboard" className="text-[#10B981] underline">
            Back
          </Link>
        </div>
      </div>

      <form onSubmit={createTemplate} className="flex gap-2">
        <Input placeholder="New template name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 flex-1 rounded-lg" />
        <Button type="submit" className="h-12 rounded-lg bg-[#10B981] text-white hover:bg-[#0EA371]">
          Create
        </Button>
      </form>

      <div className="rounded-xl glass elev-1">
        {!templates.length ? (
          <div className="p-4 text-sm text-zinc-500">No templates yet.</div>
        ) : (
          <ul className="divide-y">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center justify-between p-3">
                <div className="font-medium">{t.name}</div>
                <div className="flex items-center gap-2">
                  <Link href={`/templates/${t.id}`} className="text-[#10B981] underline">
                    Edit
                  </Link>
                  <Button variant="outline" onClick={() => applyTemplate(t.id)}>
                    Apply
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
