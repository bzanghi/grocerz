"use client";
import * as React from "react";
import Link from "next/link";
import AddItemForm from "@/components/shopping/AddItemForm";
import NextDynamic from "next/dynamic";
import ThemeToggle from "@/components/ThemeToggle";
import { Switch } from "@/components/ui/switch";
import QuickHistory from "@/components/shopping/QuickHistory";

const ShoppingList = NextDynamic(() => import("@/components/shopping/ShoppingList"), {
  ssr: false,
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export default function DashboardPage() {
  const [shoppingMode, setShoppingMode] = React.useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-4 mb-2 glass p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Shopping List</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-600">Shopping Mode</span>
            <Switch checked={shoppingMode} onCheckedChange={(v) => setShoppingMode(Boolean(v))} />
            <ThemeToggle />
            <Link href="/meals" className="text-[#10B981] underline">
              Meals
            </Link>
            <Link href="/pantry" className="text-[#10B981] underline">
              Pantry
            </Link>
            <Link href="/templates" className="text-[#10B981] underline">
              Templates
            </Link>
            <Link href="/setup" className="text-[#10B981] underline">
              Setup
            </Link>
          </div>
        </div>
      </div>
      {!shoppingMode && (
        <>
          <div className="glass elev-1 rounded-xl p-3">
            <AddItemForm />
          </div>
          <div className="glass elev-1 rounded-xl">
            <QuickHistory />
          </div>
        </>
      )}
      <div className="glass elev-1 rounded-xl p-2">
        <ShoppingList shoppingMode={shoppingMode} />
      </div>
    </div>
  );
}
