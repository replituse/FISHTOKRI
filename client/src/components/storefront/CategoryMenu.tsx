import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";

import fishImg from "@assets/Gemini_Generated_Image_w6wqkkw6wqkkw6wq_(1)_1772713077919.png";
import prawnsImg from "@assets/Gemini_Generated_Image_5xy0sd5xy0sd5xy0_1772713090650.png";
import chickenImg from "@assets/Gemini_Generated_Image_g0ecb4g0ecb4g0ec_1772713219972.png";
import muttonImg from "@assets/Gemini_Generated_Image_8fq0338fq0338fq0_1772713565349.png";
import masalaImg from "@assets/Gemini_Generated_Image_4e60a64e60a64e60_1772713888468.png";
import menuIcon from "@assets/menu_1774777071510.png";

const MENU_DATA = [
  {
    name: "Fish",
    image: fishImg,
    subcategories: [
      "Silver Pomfret", "Black Pomfret", "Khapri Pomfret",
      "Surmai (King Fish)", "Rawas (Indian Salmon)", "Lady Fish",
      "Bombil (Bombay Duck)", "Bangda (Mackerel)", "Tarli (Sardine)",
      "Karli", "Shark", "Catla", "Tuna", "Ghol", "Jitada", "Vaam",
    ],
  },
  {
    name: "Prawns",
    image: prawnsImg,
    subcategories: [
      "White Prawn", "Red Prawn", "Tiger Prawn",
      "Freshwater Prawn", "Scampi Prawn", "Jumbo Prawn",
      "Kardi", "Lobsters",
    ],
  },
  {
    name: "Chicken",
    image: chickenImg,
    subcategories: [
      "Chicken Curry Cut", "Chicken Breast",
      "Chicken Boneless Cubes", "Chicken Whole Leg",
      "Chicken Drumstick", "Chicken Lollipop",
      "Chicken Kheema", "Chicken Liver",
    ],
  },
  {
    name: "Mutton",
    image: muttonImg,
    subcategories: [
      "Goat Curry Cut", "Goat Shoulder Cut", "Goat Boneless",
      "Goat Liver", "Goat Kheema", "Goat Paya",
      "Goat Brain", "Goat Biryani Cut",
    ],
  },
  {
    name: "Crab",
    image: prawnsImg,
    subcategories: ["Fresh Crab", "Mud Crab", "Blue Crab", "Crab Pieces"],
  },
  {
    name: "Squid",
    image: fishImg,
    subcategories: ["Fresh Squid", "Squid Rings", "Baby Squid"],
  },
  {
    name: "Lobster",
    image: prawnsImg,
    subcategories: ["Whole Lobster", "Lobster Tail", "Half Lobster"],
  },
  {
    name: "Dried Fish",
    image: fishImg,
    subcategories: ["Dried Bombil", "Dried Bangda", "Dried Tarli", "Dried Prawn", "Sukha Jhinga"],
  },
  {
    name: "Eggs",
    image: chickenImg,
    subcategories: ["Farm Eggs (Tray of 30)", "Farm Eggs (Tray of 12)", "Country Eggs"],
  },
  {
    name: "Mutton Keema",
    image: muttonImg,
    subcategories: ["Goat Kheema 500g", "Goat Kheema 1kg", "Mixed Kheema"],
  },
  {
    name: "Masalas",
    image: masalaImg,
    subcategories: [
      "Fish Curry Masala", "Fish Fry Masala", "Malvani Masala",
      "Special Chicken Masala", "Special Mutton Masala", "Koliwada Masala",
    ],
  },
  {
    name: "Combos",
    image: fishImg,
    subcategories: [
      "Sea Treasure Pack", "Family Feast Combo", "Weekend Special",
      "Quick Meal Combo", "Prawns Delight",
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CategoryMenuDropdown({ open, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState(MENU_DATA[0].name);
  const [, navigate] = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const active = MENU_DATA.find(c => c.name === activeCategory) || MENU_DATA[0];

  const handleSubcategoryClick = (sub: string) => {
    onClose();
    navigate(`/?category=${encodeURIComponent(activeCategory)}&q=${encodeURIComponent(sub)}`);
    window.dispatchEvent(new CustomEvent("fishtokri-category-select", { detail: { category: activeCategory } }));
  };

  const handleCategoryClick = (cat: string) => {
    onClose();
    window.dispatchEvent(new CustomEvent("fishtokri-category-select", { detail: { category: cat } }));
    navigate("/");
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 z-[100] shadow-2xl border-t border-border/20"
      style={{ maxHeight: "80vh" }}
    >
      <div className="max-w-7xl mx-auto bg-white flex overflow-hidden rounded-b-2xl shadow-xl">
        {/* Left panel — main categories */}
        <div className="w-56 sm:w-64 flex-shrink-0 bg-slate-50 border-r border-slate-100 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {MENU_DATA.map(cat => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              onMouseEnter={() => setActiveCategory(cat.name)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-100/60 ${
                activeCategory === cat.name
                  ? "bg-white border-l-2 border-l-accent"
                  : "hover:bg-white border-l-2 border-l-transparent"
              }`}
              data-testid={`menu-category-${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white border border-slate-100 shadow-sm">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              </div>
              <span className={`text-sm font-medium ${activeCategory === cat.name ? "text-foreground font-semibold" : "text-slate-600"}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Right panel — subcategories */}
        <div className="flex-1 bg-white p-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {active.subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => handleSubcategoryClick(sub)}
                className="text-left text-sm text-slate-600 hover:text-accent font-medium py-3 px-2 border-b border-slate-100 hover:bg-accent/5 rounded transition-colors"
                data-testid={`menu-subcategory-${sub.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { menuIcon };
