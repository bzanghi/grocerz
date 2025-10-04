"use client";
import Link from "next/link";
import AddItemForm from "@/components/shopping/AddItemForm";
import NextDynamic from "next/dynamic";

const ShoppingList = NextDynamic(() => import("@/components/shopping/ShoppingList"), {
  ssr: false,
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-0 z-10 -mx-4 mb-2 bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Shopping List</h1>
          <Link href="/setup" className="text-[#10B981] underline">
            Setup
          </Link>
        </div>
      </div>
      <AddItemForm />
      <ShoppingList />
    </div>
  );
}
