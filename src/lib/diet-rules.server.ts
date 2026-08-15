export type DietRules = {
  label: string;
  isKeto: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  allowsEggs: boolean;
  allowsDairy: boolean;
  allowsMeat: boolean;
  proteinPool: string[];
  staplePool: string[];
  vegetablePool: string[];
  hardRules: string;
  bannedFoods: string[];
};

const KETO_BANNED = [
  "rice", "roti", "chapati", "bhakri", "naan", "paratha", "poha", "oats",
  "oatmeal", "muesli", "upma", "rava", "suji", "idli", "dosa", "appam",
  "puttu", "bread", "toast", "sandwich", "pasta", "noodle", "quinoa",
  "millet", "ragi", "jowar", "bajra", "barley", "daliya", "wheat", "flour",
  "maida", "corn", "potato", "sweet potato", "banana", "mango", "chikoo",
  "dates", "jaggery", "sugar", "honey", "chickpea", "chana", "rajma",
  "kidney bean", "lentil", "dal", "dhal", "beans", "khichdi",
];

export function resolveDietRules(preference: string): DietRules {
  const value = preference.toLowerCase().replace(/[_-]/g, " ");
  const isKeto = value.includes("keto");
  const isVegan = value.includes("vegan");
  const isEggetarian = value.includes("eggetarian") || value.includes("ovo vegetarian");
  const isVegetarian = isVegan || isEggetarian || value.includes("vegetarian") || value.includes("jain");
  const allowsEggs = !isVegan && (!isVegetarian || isEggetarian || value.includes("egg"));
  const allowsDairy = !isVegan;
  const allowsMeat = !isVegetarian && !isVegan;

  const ketoVegetarianProteins = [
    ...(allowsDairy ? ["paneer", "hung curd", "Greek yogurt", "cheese"] : []),
    ...(allowsEggs ? ["eggs"] : []),
    "tofu", "tempeh", "unsweetened soy protein", "hemp seeds", "chia seeds",
    "pumpkin seeds", "almonds", "walnuts",
  ];
  const ketoAnimalProteins = [
    "eggs", "chicken", "fish", "prawns",
    ...(value.includes("no beef") ? [] : ["lean beef"]),
    ...(allowsDairy ? ["paneer", "Greek yogurt", "cheese"] : []),
    "tofu",
  ];

  const proteinPool = isKeto
    ? (allowsMeat ? ketoAnimalProteins : ketoVegetarianProteins)
    : isVegan
      ? ["tofu", "tempeh", "chana", "rajma", "moong dal", "masoor dal", "soya chunks", "sprouts", "hemp seeds"]
      : isVegetarian
        ? ["paneer", "curd/dahi", ...(allowsEggs ? ["eggs"] : []), "chana", "rajma", "moong dal", "toor dal", "soya chunks", "sprouts", "besan"]
        : ["chicken", "eggs", "fish", "prawns", ...(value.includes("no beef") ? [] : ["lean beef"]), "paneer", "curd", "chana", "rajma", "moong dal"];

  const staplePool = isKeto
    ? ["cauliflower rice", "cabbage noodles", "zucchini noodles", "coconut flour chilla", "almond flour roti", "lettuce wraps", "avocado bowl"]
    : ["basmati rice", "brown rice", "whole-wheat roti", "bajra bhakri", "jowar bhakri", "ragi roti", "millet khichdi", "oats", "poha", "daliya", "vegetable upma"];

  const vegetablePool = isKeto
    ? ["spinach/palak", "methi", "cauliflower", "cabbage", "broccoli", "zucchini", "capsicum", "mushroom", "cucumber", "bottle gourd/lauki", "okra/bhindi", "eggplant/baingan"]
    : ["palak", "methi", "bhindi", "baingan", "lauki", "tinda", "tori", "cauliflower", "cabbage", "beans", "carrot", "capsicum", "mixed sabzi", "moringa"];

  const identityRules = [
    isVegan ? "VEGAN: no meat, fish, eggs, dairy, ghee, butter, whey, or honey." : "",
    isVegetarian && !isVegan ? `VEGETARIAN: no meat, poultry, fish, seafood, or meat stock.${allowsEggs ? " Eggs are allowed." : " Eggs are NOT allowed."}` : "",
    value.includes("no beef") ? "NO BEEF: no beef, beef stock, gelatin, or beef-derived ingredients." : "",
    value.includes("jain") ? "JAIN: no onion, garlic, potatoes, or other root vegetables." : "",
    value.includes("diabetic") ? "DIABETIC-FRIENDLY: no added/refined sugar; use controlled portions of low-GI carbohydrates." : "",
  ].filter(Boolean);

  const ketoRules = isKeto
    ? `KETO IS THE PRIMARY HARD CONSTRAINT and overrides every regional, breakfast, shake, deficiency, budget, and workout example below.
- Keep TOTAL NET CARBS at or below 30 g/day (net carbs = total carbs minus fiber); use moderate protein and fat for remaining energy.
- Build meals around ${proteinPool.join(", ")}; avocado, coconut, olives/olive oil, ghee/butter only when allowed; nuts/seeds; and low-carb vegetables.
- Bullet coffee (unsweetened coffee with a measured amount of butter/ghee and MCT/coconut oil) may be offered, but never as the sole protein-containing main meal.
- ABSOLUTELY FORBIDDEN: ${KETO_BANNED.join(", ")}.
- Do not use a forbidden food in a small portion, garnish, drink, shake, pre/post-workout meal, regional adaptation, or deficiency recommendation.`
    : "";

  return {
    label: preference,
    isKeto,
    isVegan,
    isVegetarian,
    allowsEggs,
    allowsDairy,
    allowsMeat,
    proteinPool,
    staplePool,
    vegetablePool,
    hardRules: [...identityRules, ketoRules].filter(Boolean).join("\n"),
    bannedFoods: isKeto ? KETO_BANNED : [],
  };
}

export function ketoTargets(calories: number, proteinG: number) {
  const carbsG = 30;
  const fatG = Math.max(45, Math.round((calories - proteinG * 4 - carbsG * 4) / 9));
  return { carbsG, fatG };
}

export function findDietViolations(plan: unknown, rules: DietRules, requiredSlots: string[]): string[] {
  if (!plan || typeof plan !== "object") return ["plan is not an object"];
  const record = plan as Record<string, unknown>;
  const meals = record.meals && typeof record.meals === "object" ? record.meals as Record<string, unknown> : {};
  const violations: string[] = [];
  for (const slot of requiredSlots) {
    if (!meals[slot] || typeof meals[slot] !== "object") violations.push(`missing ${slot}`);
  }
  if (!rules.isKeto) return violations;

  const foodText = JSON.stringify({ meals: record.meals, shakes: record.shakes }).toLowerCase();
  for (const food of rules.bannedFoods) {
    const escaped = food.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(foodText)) violations.push(`forbidden keto food: ${food}`);
  }
  const mealsList = Object.values(meals).filter((meal): meal is Record<string, unknown> => Boolean(meal) && typeof meal === "object");
  const totalCarbs = mealsList.reduce((sum, meal) => sum + (Number(meal.carbs_g) || 0), 0);
  const totalFiber = mealsList.reduce((sum, meal) => sum + (Number(meal.fiber_g) || 0), 0);
  if (totalCarbs - totalFiber > 30) violations.push(`net carbs are ${Math.round(totalCarbs - totalFiber)}g, maximum is 30g`);
  return [...new Set(violations)];
}