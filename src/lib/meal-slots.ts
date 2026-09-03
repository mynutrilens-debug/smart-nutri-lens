// Every plan uses the same fixed 5-meal structure (fat loss, weight gain, muscle gain).
export const ALL_MEAL_SLOTS = [
  "breakfast",
  "pre_workout",
  "post_workout",
  "lunch",
  "snack",
  "dinner",
] as const;

export type MealSlot = (typeof ALL_MEAL_SLOTS)[number];

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  pre_workout: "Pre-workout",
  post_workout: "Post-workout",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};

/** The fixed 5 meals every plan contains, in chronological order. */
export const FIXED_MEAL_SLOTS: MealSlot[] = [
  "breakfast",
  "post_workout",
  "lunch",
  "snack",
  "dinner",
];

/** Always returns the fixed 5-meal structure. */
export function mealSlotsFor(): MealSlot[] {
  return [...FIXED_MEAL_SLOTS];
}

export function mealSlotLabels(slots: MealSlot[]): string {
  return slots.map((s) => SLOT_LABEL[s]).join(", ");
}

/** Drops any meal the plan returned that isn't in the allowed slot list. */
export function pruneMealsToSlots<T extends Record<string, any>>(
  meals: T | null | undefined,
  slots: MealSlot[],
): Record<string, any> {
  if (!meals || typeof meals !== "object") return {};
  const out: Record<string, any> = {};
  for (const s of slots) {
    const m = (meals as any)[s];
    if (m && typeof m === "object" && (m.name || m.items)) out[s] = m;
  }
  return out;
}
