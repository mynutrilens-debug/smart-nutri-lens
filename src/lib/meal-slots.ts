// Maps a user's preferred meal frequency to the exact meal slots a plan may contain.
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

/**
 * Returns the meal slots for a given frequency, in chronological order.
 * Slots are added in priority order: 3 main meals → snack → post → pre workout.
 */
export function mealSlotsFor(frequency?: number | null, trains = true): MealSlot[] {
  const freq = Math.max(2, Math.min(6, Math.round(Number(frequency) || 4)));
  const order: MealSlot[] = trains
    ? ["breakfast", "lunch", "dinner", "snack", "post_workout", "pre_workout"]
    : ["breakfast", "lunch", "dinner", "snack"];
  const picked =
    freq === 2 ? (["lunch", "dinner"] as MealSlot[]) : order.slice(0, freq);
  return ALL_MEAL_SLOTS.filter((s) => picked.includes(s));

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
