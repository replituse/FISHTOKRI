import { useParams, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { Header } from "@/components/storefront/Header";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, Tag, ShoppingBag, Check, Utensils, Package, Copy, ChefHat,
  Flame, ExternalLink, Star, Sparkles, ShoppingBasket,
} from "lucide-react";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SwipeHint } from "@/components/storefront/SwipeHint";
import type { Combo, Product } from "@shared/schema";
import { getActiveHubDb } from "@/lib/queryClient";
import { getDummyDetail } from "@/lib/productDummyData";

import weighScaleIcon from "@assets/weight-scale_1774801344716.png";
import piecesIcon from "@assets/cutlery_1774801395283.png";
import servesIcon from "@assets/hot-food_1774801420499.png";

import fishImg from "@assets/Gemini_Generated_Image_w6wqkkw6wqkkw6wq_(1)_1772713077919.png";
import prawnsImg from "@assets/Gemini_Generated_Image_5xy0sd5xy0sd5xy0_1772713090650.png";
import chickenImg from "@assets/Gemini_Generated_Image_g0ecb4g0ecb4g0ec_1772713219972.png";
import muttonImg from "@assets/Gemini_Generated_Image_8fq0338fq0338fq0_1772713565349.png";
import masalaImg from "@assets/Gemini_Generated_Image_4e60a64e60a64e60_1772713888468.png";

const COUPONS = [
  { code: "FRESH10", desc: "10% off on your first order" },
  { code: "SAVE15", desc: "15% off on orders above ₹500" },
  { code: "TOKRI20", desc: "20% off for FishTokri members" },
];

const COMBO_RECIPES = [
  {
    name: "Surf & Turf Feast",
    description: "Grill the seafood with lemon butter and pair with spiced mutton chops for a show-stopping surf & turf spread.",
    image: "https://picsum.photos/seed/surf-turf/600/400",
    totalTime: "50 min", difficulty: "Medium",
  },
  {
    name: "Mixed Masala Tray Bake",
    description: "Marinate all combo items in a bold Malvani masala and roast together in one tray for a fuss-free feast.",
    image: "https://picsum.photos/seed/tray-bake/600/400",
    totalTime: "1 hr 10 min", difficulty: "Easy",
  },
  {
    name: "Combo Biryani",
    description: "Layer the marinated combo meats over fragrant basmati rice and slow-cook dum-style for a royal biryani.",
    image: "https://picsum.photos/seed/combo-biryani/600/400",
    totalTime: "1 hr 30 min", difficulty: "Advanced",
  },
  {
    name: "Coastal BBQ Night",
    description: "Skewer the combo pieces, coat in a tangy tamarind glaze, and grill for the ultimate Mumbai coastal BBQ experience.",
    image: "https://picsum.photos/seed/coastal-bbq/600/400",
    totalTime: "45 min", difficulty: "Easy",
  },
];

function getFallbackImage(category: string) {
  switch (category) {
    case "Prawns": return prawnsImg;
    case "Chicken": return chickenImg;
    case "Mutton": return muttonImg;
    case "Masalas": return masalaImg;
    default: return fishImg;
  }
}

function ComboHeroImage({ productImages, productCategories, name, tags }: {
  productImages: string[];
  productCategories: string[];
  name: string;
  tags: string[];
}) {
  const images = productImages.length > 0
    ? productImages
    : productCategories.map(getFallbackImage);

  const n = Math.min(images.length, 3);
  const slotPct = 100 / n;
  const widthPct = n === 1 ? 100 : slotPct + slotPct * 0.5;

  return (
    <div className="relative">
      <div className="aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden border border-border/20 shadow-xl bg-muted/10">
        {n === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-primary/5 to-accent/5">🐟</div>
        ) : (
          <div className="relative w-full h-full overflow-hidden">
            {images.slice(0, n).map((img, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0"
                style={{ left: `${i * slotPct}%`, width: `${widthPct}%`, zIndex: i }}
              >
                <img src={img} alt={`${name} item ${i + 1}`} className="w-full h-full object-cover" />
                {i < n - 1 && (
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/20" />
                )}
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        )}
      </div>

      {/* Tags overlay */}
      {tags.length > 0 && (
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <span key={tag} className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Combo badge */}
      <div className="absolute bottom-4 right-4">
        <span className="text-xs font-bold bg-black/60 text-white px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Combo Pack
        </span>
      </div>
    </div>
  );
}

function CouponCard({ code, desc }: { code: string; desc: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-background hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <span className="font-mono font-bold text-sm text-foreground tracking-widest border border-dashed border-border/60 rounded px-1.5 py-0.5 bg-muted/40">{code}</span>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 ml-3 shrink-0 transition-colors"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function IncludedProductCard({ item, product }: {
  item: { productId: string; label: string };
  product?: Product;
}) {
  const category = product?.category ?? "Fish";
  const img = product?.imageUrl || getFallbackImage(category);

  return (
    <Link href={product ? `/product/${product.id}` : "#"}>
      <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3 hover:border-emerald-300 hover:shadow-sm transition-all group cursor-pointer">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-muted/30 border border-border/20">
          <img src={img} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {item.label}
            </span>
          </div>
          {product && (
            <p className="text-xs text-muted-foreground ml-6 line-clamp-1">{product.category} · {product.weight ?? product.unit ?? ""}</p>
          )}
        </div>
        {product && (
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        )}
      </div>
    </Link>
  );
}

function ComboCard({ combo }: { combo: Combo }) {
  const [, navigate] = useLocation();
  const savings = combo.originalPrice - combo.discountedPrice;
  return (
    <div
      onClick={() => navigate(`/combo/${combo.id}`)}
      className="min-w-[200px] sm:min-w-[220px] snap-start bg-card border border-border/30 rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group flex flex-col"
    >
      <div className="w-full h-36 bg-muted/20 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">🎁</div>
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-bold text-primary uppercase tracking-wide">Combo</p>
        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{combo.name}</h4>
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-base font-bold text-foreground">₹{combo.discountedPrice}</span>
          <span className="text-xs text-muted-foreground line-through">₹{combo.originalPrice}</span>
        </div>
        {savings > 0 && (
          <p className="text-xs text-emerald-600 font-medium">Save ₹{savings}</p>
        )}
      </div>
    </div>
  );
}

export default function ComboDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addToCart, setIsCartOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const recipeScrollRef = useRef<HTMLDivElement>(null);
  const productRecipesScrollRef = useRef<HTMLDivElement>(null);
  const combosScrollRef = useRef<HTMLDivElement>(null);
  const similarScrollRef = useRef<HTMLDivElement>(null);

  const hubHeaders = getActiveHubDb() ? { "X-Hub-DB": getActiveHubDb()! } : {};

  const { data: combo, isLoading: comboLoading } = useQuery<Combo>({
    queryKey: ["/api/combos", id],
    queryFn: async () => {
      const res = await fetch(`/api/combos/${id}`, { credentials: "include", headers: hubHeaders });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: allCombos = [] } = useQuery<Combo[]>({ queryKey: ["/api/combos"] });

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const includedProducts = (combo?.includes ?? []).map((inc) => ({
    item: inc,
    product: productMap[inc.productId] as Product | undefined,
  }));

  const productImages = includedProducts
    .map(({ product }) => product?.imageUrl)
    .filter(Boolean) as string[];

  const productCategories = includedProducts
    .map(({ product }) => product?.category ?? "Fish");

  const otherCombos = allCombos.filter((c) => c.id !== id).slice(0, 8);

  // Collect all recipes from the combo's included products
  const allProductRecipes = includedProducts.flatMap(({ product }) => {
    if (!product) return [];
    const dbRecipes = product.recipes ?? [];
    if (dbRecipes.length > 0) {
      return dbRecipes.map((r: any) => ({
        title: r.title ?? r.name,
        description: r.description,
        image: r.image ?? null,
        totalTime: r.totalTime ?? "",
        difficulty: r.difficulty ?? "",
        productName: product.name,
      }));
    }
    // Fall back to dummy recipes for the category
    return getDummyDetail(product.category).recipes.map((r) => ({
      title: r.name,
      description: r.description,
      image: r.image,
      totalTime: r.totalTime,
      difficulty: r.difficulty,
      productName: product.name,
    }));
  });

  // Similar products: same categories as combo items, excluding combo's own products
  const comboProductIds = new Set((combo?.includes ?? []).map((inc) => inc.productId));
  const comboCategories = new Set(includedProducts.map(({ product }) => product?.category).filter(Boolean));
  const similarProducts = products
    .filter((p) => !p.isArchived && !comboProductIds.has(p.id) && comboCategories.has(p.category))
    .slice(0, 10);

  const handleAddToCart = () => {
    if (!combo) return;
    for (let i = 0; i < qty; i++) {
      addToCart({
        id: -Math.abs(parseInt(combo.id.slice(-6), 16) || 9999),
        name: combo.name,
        price: combo.discountedPrice,
        category: "Combo",
        status: "available",
        unit: combo.weight ?? undefined,
        imageUrl: null,
        isArchived: false,
        updatedAt: new Date(),
        limitedStockNote: null,
        sectionId: null,
        isCombo: true,
      } as any);
    }
    setAdded(true);
    setTimeout(() => { setAdded(false); setIsCartOpen(true); }, 800);
  };

  if (comboLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </div>
        <CartDrawer />
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Header />
        <p className="text-muted-foreground text-lg">Combo not found.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
        <CartDrawer />
      </div>
    );
  }

  const savings = combo.originalPrice - combo.discountedPrice;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Back */}
        <button
          onClick={() => navigate("/" as any)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to store
        </button>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">

          {/* LEFT – Hero image collage */}
          <ComboHeroImage
            productImages={productImages}
            productCategories={productCategories}
            name={combo.name}
            tags={combo.tags}
          />

          {/* RIGHT – Details */}
          <div className="flex flex-col gap-5">

            {/* Name + badges */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs">Combo Pack</Badge>
                <Badge variant="secondary" className="text-xs font-medium">{combo.includes.length} Items</Badge>
                {combo.discount > 0 && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs font-bold">{combo.discount}% Off</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{combo.name}</h1>
            </div>

            {/* Description */}
            {combo.fullDescription && (
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{combo.fullDescription}</p>
            )}

            {/* Stats bar — with custom icons */}
            <div className="flex items-stretch gap-0 divide-x divide-border border border-border/40 rounded-2xl overflow-hidden bg-muted/20">
              {[
                { label: "Serves", value: combo.serves ?? "—", icon: servesIcon },
                { label: "Weight", value: combo.weight ?? "—", icon: weighScaleIcon },
                { label: "Items", value: `${combo.includes.length} items`, icon: piecesIcon },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex-1 flex items-center gap-2.5 py-4 px-3 sm:px-4">
                  <div className="flex flex-col items-center shrink-0">
                    <img src={icon} alt={label} className="w-7 h-7 object-contain object-bottom dark:invert" />
                    <span className="text-[10px] text-muted-foreground mt-1 font-medium">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground leading-tight">{value}</span>
                </div>
              ))}
            </div>

            {/* What's Included */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-accent" /> What's Included
              </h3>
              <div className="space-y-2.5">
                {includedProducts.map(({ item, product }, i) => (
                  <IncludedProductCard key={i} item={item} product={product} />
                ))}
              </div>
            </div>

            {/* Price block */}
            <div className="bg-muted/30 border border-border/30 rounded-2xl px-5 py-4">
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-foreground">₹{combo.discountedPrice}</span>
                <span className="text-base text-muted-foreground line-through mb-0.5">₹{combo.originalPrice}</span>
                <span className="text-sm font-semibold text-green-600 mb-0.5">{combo.discount}% off</span>
              </div>
              <p className="text-xs text-muted-foreground">Inclusive of all taxes. Free delivery on orders above ₹499.</p>
            </div>

            {/* Savings highlight */}
            {savings > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    You save ₹{savings} ({combo.discount}% off)
                  </p>
                  <p className="text-xs text-muted-foreground">vs buying each item separately</p>
                </div>
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-muted/40 border border-border/40 rounded-full px-4 py-2">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="text-xl font-bold text-foreground w-7 h-7 flex items-center justify-center hover:text-primary transition-colors"
                  data-testid="button-qty-decrease"
                >−</button>
                <span className="text-base font-semibold w-5 text-center" data-testid="text-qty">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="text-xl font-bold text-foreground w-7 h-7 flex items-center justify-center hover:text-primary transition-colors"
                  data-testid="button-qty-increase"
                >+</button>
              </div>
              <Button
                onClick={handleAddToCart}
                className={`flex-1 h-12 rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  added ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-primary text-white shadow-lg shadow-primary/20"
                }`}
                data-testid="button-add-combo-to-cart"
              >
                {added ? (
                  <><Check className="w-5 h-5" /> Added to Cart!</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" /> Add {qty} to Cart — ₹{combo.discountedPrice * qty}</>
                )}
              </Button>
            </div>

            {/* Available Offers */}
            <div className="border border-border/40 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-muted/20">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Available Offers</h3>
              </div>
              <div className="flex flex-col divide-y divide-border/30">
                {COUPONS.map((c) => (
                  <CouponCard key={c.code} code={c.code} desc={c.desc} />
                ))}
              </div>
            </div>

            {/* Nutrition Info */}
            {combo.nutrition.length > 0 && (
              <div className="border border-border/30 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border/30">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Nutrition Info (per 100g serving)</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border/30">
                  {combo.nutrition.map((n, i) => (
                    <div key={i} className="flex flex-col items-center py-3 px-2">
                      <span className="text-base mb-0.5">{n.icon}</span>
                      <span className="text-xs font-semibold text-foreground">{n.value}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Why Choose This Combo ── */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">Why This Combo?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🎯", title: "Perfectly Curated", desc: "Handpicked items that complement each other for a complete meal experience." },
              { icon: "💰", title: `Save ₹${savings}`, desc: "Better value than buying each item separately. Maximum savings, premium quality." },
              { icon: "🚚", title: "Fresh & Fast", desc: "All items sourced fresh daily and delivered to your door, cleaned and ready to cook." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-4 bg-muted/20 border border-border/30 rounded-2xl">
                <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recipes from Combo Products ── */}
        {allProductRecipes.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-5">
              <ChefHat className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-foreground">Recipes from This Combo</h2>
            </div>
            <div className="relative">
              <div ref={productRecipesScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {allProductRecipes.map((recipe, idx) => (
                  <div
                    key={idx}
                    className="min-w-[240px] sm:min-w-[260px] snap-start bg-card border border-border/30 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="w-full h-44 overflow-hidden bg-muted/20 flex items-center justify-center">
                      {recipe.image ? (
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <ChefHat className="w-10 h-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{recipe.productName}</span>
                      <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{recipe.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">{recipe.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        {recipe.totalTime && <span className="text-xs text-muted-foreground">⏱ {recipe.totalTime}</span>}
                        {recipe.difficulty && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            recipe.difficulty === "Easy" ? "bg-green-100 text-green-700"
                            : recipe.difficulty === "Medium" ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                          }`}>{recipe.difficulty}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <SwipeHint scrollRef={productRecipesScrollRef} />
            </div>
          </section>
        )}

        {/* ── Meal Ideas ── */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <ChefHat className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">Meal Ideas for This Combo</h2>
          </div>
          <div className="relative">
            <div ref={recipeScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {COMBO_RECIPES.map((recipe) => (
                <div
                  key={recipe.name}
                  className="min-w-[240px] sm:min-w-[260px] snap-start bg-card border border-border/30 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="w-full h-44 overflow-hidden bg-muted/20">
                    <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    <h4 className="font-bold text-sm text-foreground leading-snug">{recipe.name}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">{recipe.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">⏱ {recipe.totalTime}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        recipe.difficulty === "Easy"
                          ? "bg-green-100 text-green-700"
                          : recipe.difficulty === "Medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>{recipe.difficulty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <SwipeHint scrollRef={recipeScrollRef} />
          </div>
        </section>

        {/* ── More Combo Deals ── */}
        {otherCombos.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-foreground">More Combo Deals</h2>
            </div>
            <div className="relative">
              <div ref={combosScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {otherCombos.map((c) => (
                  <ComboCard key={c.id} combo={c} />
                ))}
              </div>
              <SwipeHint scrollRef={combosScrollRef} />
            </div>
          </section>
        )}
        {/* ── Similar Products ── */}
        {similarProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <ShoppingBasket className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-foreground">Products in This Combo</h2>
            </div>
            <div className="relative">
              <div ref={similarScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {similarProducts.map((p) => (
                  <div key={p.id} className="w-[150px] sm:w-[170px] shrink-0 snap-start">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
              <SwipeHint scrollRef={similarScrollRef} />
            </div>
          </section>
        )}
      </div>

      <CartDrawer />
    </div>
  );
}
