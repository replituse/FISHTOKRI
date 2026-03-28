export interface ProductDummyDetail {
  description: string;
  weight: string;
  pieces: string;
  serves: string;
  discountPct: number;
  coupons: { code: string; desc: string; color: string }[];
  nutrition: { label: string; value: string; icon: string }[];
  recipes: { name: string; time: string; difficulty: string; emoji: string }[];
}

const COUPONS = [
  { code: "FRESH10", desc: "10% off on your first order", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { code: "SAVE15", desc: "15% off on orders above ₹500", color: "bg-green-50 border-green-200 text-green-700" },
  { code: "TOKRI20", desc: "20% off for FishTokri members", color: "bg-blue-50 border-blue-200 text-blue-700" },
];

export const CATEGORY_DUMMY: Record<string, ProductDummyDetail> = {
  Fish: {
    description:
      "Freshly sourced from the Arabian Sea, this premium fish is cleaned and dressed by our expert handlers. Rich in Omega-3 fatty acids and high-quality protein, it's perfect for curries, fries, or grills. Delivered fresh to your doorstep every morning.",
    weight: "500 g",
    pieces: "2–3 Pieces",
    serves: "Serves 3",
    discountPct: 10,
    coupons: COUPONS,
    nutrition: [
      { label: "Calories", value: "150 kcal", icon: "🔥" },
      { label: "Protein", value: "26 g", icon: "💪" },
      { label: "Fat", value: "4 g", icon: "🫒" },
      { label: "Carbs", value: "0 g", icon: "🌾" },
      { label: "Omega-3", value: "1.8 g", icon: "🐟" },
      { label: "Sodium", value: "80 mg", icon: "🧂" },
    ],
    recipes: [
      { name: "Malvani Fish Curry", time: "35 min", difficulty: "Medium", emoji: "🍛" },
      { name: "Crispy Fish Fry", time: "20 min", difficulty: "Easy", emoji: "🍳" },
      { name: "Fish Koliwada", time: "25 min", difficulty: "Easy", emoji: "🧆" },
      { name: "Steamed Fish with Ginger", time: "30 min", difficulty: "Medium", emoji: "🥢" },
    ],
  },
  Prawns: {
    description:
      "Hand-picked and deveined Tiger Prawns from certified coastal farms. Juicy, tender and versatile — perfect for starters, mains, and biryanis. Each batch is quality-checked for freshness before delivery.",
    weight: "500 g",
    pieces: "20–25 Pieces",
    serves: "Serves 3",
    discountPct: 12,
    coupons: COUPONS,
    nutrition: [
      { label: "Calories", value: "99 kcal", icon: "🔥" },
      { label: "Protein", value: "24 g", icon: "💪" },
      { label: "Fat", value: "0.3 g", icon: "🫒" },
      { label: "Carbs", value: "0.2 g", icon: "🌾" },
      { label: "Iodine", value: "35 mcg", icon: "🌊" },
      { label: "Sodium", value: "111 mg", icon: "🧂" },
    ],
    recipes: [
      { name: "Prawn Masala Curry", time: "30 min", difficulty: "Medium", emoji: "🍛" },
      { name: "Garlic Butter Prawns", time: "15 min", difficulty: "Easy", emoji: "🧄" },
      { name: "Prawn Biryani", time: "60 min", difficulty: "Hard", emoji: "🍚" },
      { name: "Koliwada Prawns", time: "20 min", difficulty: "Easy", emoji: "🧆" },
    ],
  },
  Chicken: {
    description:
      "Farm-fresh antibiotic-free chicken, processed under hygienic conditions and cut to your preferred size. High in lean protein, low in fat — ideal for everyday meals. Pre-cleaned and ready to cook.",
    weight: "450 g",
    pieces: "2–4 Pieces",
    serves: "Serves 4",
    discountPct: 15,
    coupons: COUPONS,
    nutrition: [
      { label: "Calories", value: "165 kcal", icon: "🔥" },
      { label: "Protein", value: "31 g", icon: "💪" },
      { label: "Fat", value: "3.6 g", icon: "🫒" },
      { label: "Carbs", value: "0 g", icon: "🌾" },
      { label: "Iron", value: "1 mg", icon: "⚡" },
      { label: "Sodium", value: "74 mg", icon: "🧂" },
    ],
    recipes: [
      { name: "Chicken Curry", time: "40 min", difficulty: "Medium", emoji: "🍛" },
      { name: "Tandoori Chicken", time: "50 min", difficulty: "Medium", emoji: "🔥" },
      { name: "Chicken Biryani", time: "60 min", difficulty: "Hard", emoji: "🍚" },
      { name: "Lemon Herb Roast", time: "90 min", difficulty: "Medium", emoji: "🍋" },
    ],
  },
  Mutton: {
    description:
      "Premium cuts from locally sourced free-range goats, aged and butchered by skilled craftsmen. Rich, flavourful meat that delivers restaurant-quality results at home. Ideal for slow-cooked curries and biryanis.",
    weight: "500 g",
    pieces: "6–8 Pieces",
    serves: "Serves 4",
    discountPct: 8,
    coupons: COUPONS,
    nutrition: [
      { label: "Calories", value: "258 kcal", icon: "🔥" },
      { label: "Protein", value: "25 g", icon: "💪" },
      { label: "Fat", value: "17 g", icon: "🫒" },
      { label: "Carbs", value: "0 g", icon: "🌾" },
      { label: "Iron", value: "2.7 mg", icon: "⚡" },
      { label: "Sodium", value: "72 mg", icon: "🧂" },
    ],
    recipes: [
      { name: "Mutton Rogan Josh", time: "70 min", difficulty: "Hard", emoji: "🍛" },
      { name: "Mutton Biryani", time: "90 min", difficulty: "Hard", emoji: "🍚" },
      { name: "Mutton Keema Pav", time: "40 min", difficulty: "Medium", emoji: "🥙" },
      { name: "Paya Soup", time: "120 min", difficulty: "Medium", emoji: "🍲" },
    ],
  },
  Masalas: {
    description:
      "Authentic hand-ground masala blends crafted from the finest whole spices. No artificial colours, preservatives or fillers — just pure flavour in every pinch. Formulated by our in-house chef to complement FishTokri's premium seafood.",
    weight: "100 g",
    pieces: "1 Pack",
    serves: "Serves 8",
    discountPct: 5,
    coupons: COUPONS.slice(0, 2),
    nutrition: [
      { label: "Calories", value: "310 kcal", icon: "🔥" },
      { label: "Carbs", value: "55 g", icon: "🌾" },
      { label: "Protein", value: "10 g", icon: "💪" },
      { label: "Fat", value: "8 g", icon: "🫒" },
      { label: "Fibre", value: "18 g", icon: "🌿" },
      { label: "Sodium", value: "40 mg", icon: "🧂" },
    ],
    recipes: [
      { name: "Fish Curry with Masala", time: "35 min", difficulty: "Easy", emoji: "🍛" },
      { name: "Malvani Chicken", time: "45 min", difficulty: "Medium", emoji: "🍗" },
      { name: "Koliwada Fry", time: "20 min", difficulty: "Easy", emoji: "🧆" },
      { name: "Spiced Prawn Stir-fry", time: "25 min", difficulty: "Easy", emoji: "🍳" },
    ],
  },
};

export function getDummyDetail(category: string): ProductDummyDetail {
  return CATEGORY_DUMMY[category] ?? CATEGORY_DUMMY["Fish"];
}

export function getStrikePrice(price: number, discountPct: number): number {
  return Math.round(price / (1 - discountPct / 100));
}
