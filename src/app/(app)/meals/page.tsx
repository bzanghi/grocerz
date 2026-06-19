"use client";
import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Meal } from "@/lib/types/db";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export default function MealsPage() {
  const [meals, setMeals] = React.useState<Meal[]>([]);
  const [filter, setFilter] = React.useState<"all" | "quick" | "kid">("all");

  React.useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .is("household_id", null);
      if (error) toast.error(error.message);
      else setMeals((data ?? []) as Meal[]);
    };
    load();
  }, []);

  const filtered = meals.filter((m) => {
    if (filter === "quick") return !!m.is_quick_meal;
    if (filter === "kid") return !!m.is_kid_friendly;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 glass p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Meal Library</h1>
          <Link href="/dashboard" className="text-[#10B981] underline">
            Back
          </Link>
        </div>
        <div className="mt-3 flex gap-2 text-sm">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "quick" ? "default" : "outline"} onClick={() => setFilter("quick")}>
            Quick (&lt;30m)
          </Button>
          <Button variant={filter === "kid" ? "default" : "outline"} onClick={() => setFilter("kid")}>
            Kid-Friendly
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((meal) => (
          <Link key={meal.id} href={`/meals/${meal.id}`} className="rounded-xl glass overflow-hidden elev-1">
            <div className="relative aspect-[4/3] bg-zinc-100">
              {meal.image_url && (
                <Image src={meal.image_url} alt={meal.name} fill sizes="50vw" className="object-cover" />
              )}
            </div>
            <div className="p-2">
              <div className="text-sm font-medium line-clamp-2">{meal.name}</div>
              <div className="mt-1 flex items-center gap-1">
                {meal.prep_time ? (
                  <Badge variant="secondary">{meal.prep_time}m</Badge>
                ) : null}
                {meal.is_kid_friendly ? <Badge className="bg-[#10B981] text-white">Kid</Badge> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
