"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AddItemForm() {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
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
    if (!profile?.household_id) {
      toast.error("No household linked. Finish setup first.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("shopping_items").insert({
      household_id: profile.household_id,
      name: name.trim(),
      quantity: quantity.trim() || null,
      category: category.trim() || null,
    });
    if (error) toast.error(error.message);
    else {
      setName("");
      setQuantity("");
      setCategory("");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={addItem} className="flex gap-2">
      <Input
        placeholder="Add item"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-12 flex-1 rounded-lg"
      />
      <Input
        placeholder="Qty"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="h-12 w-24 rounded-lg"
      />
      <Input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="h-12 w-28 rounded-lg"
      />
      <Button
        disabled={loading}
        className="h-12 rounded-lg bg-[#10B981] text-white hover:bg-[#0EA371]"
        type="submit"
      >
        Add
      </Button>
    </form>
  );
}
