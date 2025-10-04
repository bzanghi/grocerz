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

export type Meal = {
  id: string;
  name: string;
  prep_time: number | null;
  is_kid_friendly: boolean | null;
  is_quick_meal: boolean | null;
  image_url: string | null;
  is_custom: boolean | null;
  household_id: string | null;
};

export type MealIngredient = {
  id: string;
  meal_id: string;
  ingredient_name: string;
  base_quantity: string | null; // for 4 servings
  category: string | null;
};
