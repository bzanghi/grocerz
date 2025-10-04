"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Meal, MealIngredient, ShoppingItem } from "@/lib/types/db";
import { mergeQuantities } from "@/lib/quantity";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Scale base quantities (defined for 4 servings) to 5 people.
// scaling factor: 5 / 4 = 1.25
const FAMILY_SIZE = 5;
const BASE_SERVINGS = 4;
const SCALE = FAMILY_SIZE / BASE_SERVINGS; // 1.25

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export default function MealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [meal, setMeal] = React.useState<Meal | null>(null);
  const [ingredients, setIngredients] = React.useState<MealIngredient[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const { data: m, error: me } = await supabase.from("meals").select("*").eq("id", id).single();
      if (me) {
        toast.error(me.message);
        setLoading(false);
        return;
      }
      setMeal(m as Meal);
      const { data: ing, error: ie } = await supabase
        .from("meal_ingredients")
        .select("*")
        .eq("meal_id", id)
        .order("ingredient_name");
      if (ie) toast.error(ie.message);
      setIngredients((ing ?? []) as MealIngredient[]);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const addToList = async () => {
    try {
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

      // For each ingredient, either insert new or merge with existing item (duplicate prevention)
      for (const ing of ingredients) {
        const scaledQty = scaleQuantity(ing.base_quantity ?? "");
        const name = ing.ingredient_name;
        const category = ing.category ?? null;

        // Pantry check: skip items that are on hand
        const { data: pantry } = await supabase
          .from("pantry_items")
          .select("on_hand")
          .eq("household_id", householdId)
          .ilike("name", name);
        if (pantry && pantry.some((p) => p.on_hand)) {
          continue; // skip items we already have on hand
        }

        // Check for existing item by name (case-insensitive) in this household
        const { data: existing } = await supabase
          .from("shopping_items")
          .select("id, quantity")
          .eq("household_id", householdId)
          .ilike("name", name);

        if (existing && existing.length > 0) {
          // Merge quantities: simple string concatenation if different
          const current = existing[0];
          const newQty = mergeQuantities(current.quantity, scaledQty);
          await supabase
            .from("shopping_items")
            .update({ quantity: newQty, category })
            .eq("id", current.id);
        } else {
          await supabase.from("shopping_items").insert({
            household_id: householdId,
            name,
            quantity: scaledQty || null,
            category,
          } satisfies Partial<ShoppingItem>);
        }
      }
      toast.success("Added meal ingredients to list for 5 people.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add ingredients.";
      toast.error(msg);
    }
  };

  if (loading) return <div className="p-4 text-sm text-zinc-500">Loading…</div>;
  if (!meal) return <div className="p-4 text-sm text-red-500">Meal not found.</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{meal.name}</h1>
          <Link href="/meals" className="text-[#10B981] underline">
            Back
          </Link>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <div className="mb-2 text-sm text-zinc-600">Ingredients (scaled for 5)</div>
        <ul className="flex flex-col divide-y">
          {ingredients.map((ing) => (
            <li key={ing.id} className="flex items-center gap-3 py-2 text-sm">
              <div className="flex-1">
                <div className="font-medium">{ing.ingredient_name}</div>
                <div className="text-xs text-zinc-500">
                  {ing.base_quantity ?? ""} → {scaleQuantity(ing.base_quantity ?? "")}
                </div>
              </div>
              <div className="text-xs text-zinc-500">{ing.category}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="sticky bottom-4 z-10 -mx-4 bg-white/70 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <Button className="h-12 w-full rounded-lg bg-[#10B981] text-white hover:bg-[#0EA371]" onClick={addToList}>
          Add All Ingredients to List (for 5)
        </Button>
      </div>
    </div>
  );
}

// Helpers: Simple quantity scaling and merging
function scaleQuantity(qty: string): string {
  if (!qty) return "";
  // Try to parse numbers (including fractions like 1/2)
  const parts = qty.split(/\s+/);
  // First token numeric, rest as unit
  const [first, ...rest] = parts;
  const n = parseFraction(first);
  if (isNaN(n)) return qty; // if not parseable, leave as-is
  const scaled = roundSmart(n * SCALE);
  return [scaled, ...rest].join(" ").trim();
}

function parseFraction(s: string): number {
  // supports "1", "1.5", "1/2"
  if (s.includes("/")) {
    const [a, b] = s.split("/").map(Number);
    if (!isNaN(a) && !isNaN(b) && b !== 0) return a / b;
  }
  const n = Number(s);
  return n;
}

function roundSmart(n: number): string {
  // Keep halves and quarters where possible, else 2 decimals
  const quarter = Math.round(n * 4) / 4;
  if (Math.abs(quarter - Math.round(quarter)) < 1e-6) return String(Math.round(quarter));
  if (Math.abs(quarter * 2 - Math.round(quarter * 2)) < 1e-6) return `${Math.round(quarter * 2)}/2`;
  if (Math.abs(quarter * 4 - Math.round(quarter * 4)) < 1e-6) return `${Math.round(quarter * 4)}/4`;
  return n.toFixed(2);
}

// merge logic moved to lib/quantity
