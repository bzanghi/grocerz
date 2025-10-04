export type ShoppingItem = {
  id: string;
  household_id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  is_checked: boolean;
  estimated_price: number | null;
  created_at: string;
  created_by: string | null;
};
