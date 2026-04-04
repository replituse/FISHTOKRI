import { useParams, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { Header } from "@/components/storefront/Header";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Tag, ShoppingBag, Check, Utensils, Package } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Combo, Product } from "@shared/schema";
import { Link } from "wouter";

function ComboImage({ productImages, name }: { productImages: string[], name: string }) {
  const n = productImages.length;
  if (n === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30 text-6xl">
        🐟
      </div>
    );
  }
  const slotPct = 100 / n;
  const widthPct = n === 1 ? 100 : slotPct + slotPct * 0.45;
  return (
    <div className="relative w-full h-full overflow-hidden">
      {productImages.map((img, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0"
          style={{ left: `${i * slotPct}%`, width: `${widthPct}%`, zIndex: i }}
        >
          <img src={img} alt={name} className="w-full h-full object-cover" />
          {i < n - 1 && (
            <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-r from-transparent to-black/15" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ComboDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addToCart, setIsCartOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: combo, isLoading: comboLoading } = useQuery<Combo>({
    queryKey: ["/api/combos", id],
    queryFn: async () => {
      const res = await fetch(`/api/combos/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const productImages = (combo?.includes ?? [])
    .map((inc) => productMap[inc.productId]?.imageUrl)
    .filter(Boolean) as string[];

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
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full rounded-2xl" />
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

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <button
          onClick={() => navigate("/" as any)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to store
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">
          {/* LEFT – Product images collage */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden border border-border/20 shadow-lg bg-muted/10">
              <ComboImage productImages={productImages} name={combo.name} />
            </div>
            {combo.tags.length > 0 && (
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                {combo.tags.map((tag) => (
                  <span key={tag} className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-full shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT – Details */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1 block">
                Combo Pack
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {combo.name}
              </h1>
            </div>

            {combo.fullDescription && (
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {combo.fullDescription}
              </p>
            )}

            {/* Stats bar */}
            <div className="flex items-center gap-0 divide-x divide-border border border-border/40 rounded-2xl overflow-hidden bg-muted/20">
              {[
                { label: "Serves", value: combo.serves ?? "—", icon: "🍽️" },
                { label: "Weight", value: combo.weight ?? "—", icon: "⚖️" },
                { label: "Items", value: `${combo.includes.length} items`, icon: "📦" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex-1 flex flex-col items-center py-4 px-2">
                  <span className="text-xl mb-1">{icon}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground mt-0.5 text-center">{value}</span>
                </div>
              ))}
            </div>

            {/* What's Included */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-accent" /> What's Included
              </h3>
              <div className="space-y-2">
                {combo.includes.map((item, i) => {
                  const product = productMap[item.productId];
                  return (
                    <div key={i} className="flex items-center gap-3 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      {product ? (
                        <Link href={`/product/${product.id}`}>
                          <span className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline">
                            {item.label}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price */}
            <div className="bg-muted/30 border border-border/30 rounded-2xl px-5 py-4">
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-foreground">₹{combo.discountedPrice}</span>
                <span className="text-base text-muted-foreground line-through mb-0.5">₹{combo.originalPrice}</span>
                <span className="text-sm font-semibold text-green-600 mb-0.5">{combo.discount}% off</span>
              </div>
              <p className="text-xs text-muted-foreground">Inclusive of all taxes. Free delivery on orders above ₹499.</p>
            </div>

            {/* Savings highlight */}
            <div className="flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-2xl p-4">
              <Tag className="w-5 h-5 text-accent flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  You save ₹{combo.originalPrice - combo.discountedPrice} ({combo.discount}% off)
                </p>
                <p className="text-xs text-muted-foreground">vs buying each item separately</p>
              </div>
            </div>

            {/* Qty + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-muted/40 border border-border/40 rounded-full px-4 py-2">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="text-xl font-bold text-foreground w-7 h-7 flex items-center justify-center hover:text-primary transition-colors"
                  data-testid="button-qty-decrease"
                >
                  −
                </button>
                <span className="text-base font-semibold w-5 text-center" data-testid="text-qty">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="text-xl font-bold text-foreground w-7 h-7 flex items-center justify-center hover:text-primary transition-colors"
                  data-testid="button-qty-increase"
                >
                  +
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                className={`flex-1 h-12 rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  added ? "bg-emerald-500 text-white" : "bg-primary text-white shadow-lg shadow-primary/20"
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

            {/* Nutrition info */}
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
      </div>

      <CartDrawer />
    </div>
  );
}
