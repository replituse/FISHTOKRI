import { useRoute, useLocation } from "wouter";
import { useProducts } from "@/hooks/use-products";
import { useCart } from "@/context/CartContext";
import { Header } from "@/components/storefront/Header";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getDummyDetail } from "@/lib/productDummyData";
import {
  ChevronLeft, Plus, Minus, Copy, Check, Tag, ChefHat, ShoppingBasket,
} from "lucide-react";
import { useState, useRef } from "react";
import { SwipeHint } from "@/components/storefront/SwipeHint";
import type { Product } from "@shared/schema";

import weighScaleIcon from "@assets/weight-scale_1774801344716.png";
import piecesIcon from "@assets/cutlery_1774801395283.png";
import servesIcon from "@assets/hot-food_1774801420499.png";

import fishImg from "@assets/Gemini_Generated_Image_w6wqkkw6wqkkw6wq_(1)_1772713077919.png";
import prawnsImg from "@assets/Gemini_Generated_Image_5xy0sd5xy0sd5xy0_1772713090650.png";
import chickenImg from "@assets/Gemini_Generated_Image_g0ecb4g0ecb4g0ec_1772713219972.png";
import muttonImg from "@assets/Gemini_Generated_Image_8fq0338fq0338fq0_1772713565349.png";
import masalaImg from "@assets/Gemini_Generated_Image_4e60a64e60a64e60_1772713888468.png";

function getFallbackImage(category: string) {
  switch (category) {
    case "Prawns": return prawnsImg;
    case "Chicken": return chickenImg;
    case "Mutton": return muttonImg;
    case "Masalas": return masalaImg;
    default: return fishImg;
  }
}

function CouponCard({ code, desc }: { code: string; desc: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
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
        onClick={copy}
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 ml-3 shrink-0 transition-colors"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function RecipeCard({
  recipe, category, index, onViewRecipe,
}: {
  recipe: { name: string; description: string; image: string; totalTime: string; difficulty: string };
  category: string;
  index: number;
  onViewRecipe: (category: string, index: number) => void;
}) {
  return (
    <div className="min-w-[240px] sm:min-w-[260px] snap-start bg-card border border-border/30 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="w-full h-44 overflow-hidden bg-muted/20">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{recipe.name}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">{recipe.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">⏱ {recipe.totalTime}</span>
          <button
            onClick={() => onViewRecipe(category, index)}
            className="text-xs font-semibold text-accent border border-accent rounded-full px-3 py-1 hover:bg-accent hover:text-white transition-colors"
          >
            View Recipe
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = useProducts();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const recipeScrollRef = useRef<HTMLDivElement>(null);
  const similarScrollRef = useRef<HTMLDivElement>(null);

  const productId = params?.id;
  const product = products?.find((p) => p.id === productId);
  const isUnavailable = product?.status === "unavailable";

  const dummy = product ? getDummyDetail(product.category) : null;
  const hasDiscount = product?.originalPrice != null && product?.price != null && product.originalPrice > product.price;
  const effectiveDiscountPct = hasDiscount
    ? Math.round((product!.originalPrice! - product!.price!) / product!.originalPrice! * 100)
    : 0;
  const strikePrice = hasDiscount ? product!.originalPrice : null;

  const availableProducts = products?.filter((p) => !p.isArchived && p.id !== productId) ?? [];
  const sameCategory = availableProducts.filter((p) => p.category === product?.category);
  const otherCategory = availableProducts.filter((p) => p.category !== product?.category);
  const recommended = [...sameCategory, ...otherCategory].slice(0, 10);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <CartDrawer />
      </div>
    );
  }

  if (!product || !dummy) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Header />
        <p className="text-muted-foreground text-lg">Product not found.</p>
        <Button onClick={() => setLocation("/")}>Go Home</Button>
        <CartDrawer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Back */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to store
        </button>

        {/* ── Main Grid: Image | Details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">

          {/* LEFT – Image */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden border border-border/20 shadow-lg bg-muted/20">
              <img
                src={product.imageUrl || getFallbackImage(product.category)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.status === "limited" && (
              <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-none shadow">Limited Stock</Badge>
            )}
            {product.status === "unavailable" && (
              <Badge className="absolute top-4 left-4 bg-red-500 text-white border-none shadow">Sold Out</Badge>
            )}
          </div>

          {/* RIGHT – Details */}
          <div className="flex flex-col gap-5">

            {/* Name + category / subcategory */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="text-xs font-medium">{product.category}</Badge>
                {product.subCategory && product.subCategory !== product.name && (
                  <Badge variant="outline" className="text-xs font-medium text-muted-foreground">{product.subCategory}</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{product.name}</h1>
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{product.description || dummy.description}</p>

            {/* Weight / Pieces / Serves — custom icons */}
            <div className="flex items-stretch gap-0 divide-x divide-border border border-border/40 rounded-2xl overflow-hidden bg-muted/20">
              {[
                { label: "Weight", value: product.weight || dummy.weight, icon: weighScaleIcon },
                { label: "Pieces", value: product.pieces || dummy.pieces, icon: piecesIcon },
                { label: "Serves", value: product.serves || dummy.serves, icon: servesIcon },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex-1 flex items-center gap-3 py-4 px-4">
                  <div className="flex flex-col items-center shrink-0">
                    <img src={icon} alt={label} className="w-7 h-7 object-contain object-bottom dark:invert" />
                    <span className="text-[10px] text-muted-foreground mt-1 font-medium">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground leading-tight">{value}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="bg-muted/30 border border-border/30 rounded-2xl px-5 py-4">
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-foreground">₹{product.price}</span>
                {strikePrice && <span className="text-base text-muted-foreground line-through mb-0.5">₹{strikePrice}</span>}
                {effectiveDiscountPct > 0 && <span className="text-sm font-semibold text-green-600 mb-0.5">{effectiveDiscountPct}% off</span>}
              </div>
              <p className="text-xs text-muted-foreground">Inclusive of all taxes. Free delivery on orders above ₹499.</p>
            </div>

            {/* Qty + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border/40 rounded-full overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-semibold text-sm">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={() => { for (let i = 0; i < qty; i++) addToCart(product); }}
                disabled={isUnavailable}
                className="flex-1 h-11 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md"
              >
                {isUnavailable ? "Out of Stock" : `Add ${qty} to Cart — ₹${(product.price ?? 0) * qty}`}
              </Button>
            </div>

            {/* Available Offers — moved below Add to Cart, compact & professional */}
            <div className="border border-border/40 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-muted/20">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Available Offers</h3>
              </div>
              <div className="flex flex-col divide-y divide-border/30">
                {dummy.coupons.map((c) => (
                  <CouponCard key={c.code} {...c} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Explore New Recipes ── */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <ChefHat className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">Explore New Recipes</h2>
          </div>
          {product.recipes && product.recipes.length > 0 ? (
            <div className="relative">
              <div ref={recipeScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {product.recipes.map((r, idx) => (
                  <div
                    key={idx}
                    className="min-w-[240px] sm:min-w-[280px] snap-start bg-card border border-border/30 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="w-full h-44 overflow-hidden bg-muted/20 flex items-center justify-center">
                      {r.image ? (
                        <img src={r.image} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                          <ChefHat className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{r.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">{r.description}</p>
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {r.totalTime && <span>⏱ {r.totalTime}</span>}
                          {r.difficulty && (
                            <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                              r.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                              r.difficulty === "Hard" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>{r.difficulty}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setLocation(`/recipe/product/${product.id}/${idx}`)}
                          className="text-xs font-semibold text-accent border border-accent rounded-full px-3 py-1 hover:bg-accent hover:text-white transition-colors"
                        >
                          View Recipe
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <SwipeHint scrollRef={recipeScrollRef} />
            </div>
          ) : (
            <div className="relative">
              <div ref={recipeScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {dummy.recipes.map((r, idx) => (
                  <RecipeCard
                    key={r.name}
                    recipe={r}
                    category={product.category}
                    index={idx}
                    onViewRecipe={(cat, i) => setLocation(`/recipe/${encodeURIComponent(cat)}/${i}`)}
                  />
                ))}
              </div>
              <SwipeHint scrollRef={recipeScrollRef} />
            </div>
          )}
        </section>

        {/* ── Similar Products ── */}
        {recommended.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <ShoppingBasket className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-foreground">
                {sameCategory.length > 0 ? `More ${product.category}` : "You May Also Like"}
              </h2>
            </div>
            <div className="relative">
              <div
                ref={similarScrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
              >
                {recommended.map((p) => (
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
