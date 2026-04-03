import { useState, useEffect, useRef, type RefObject } from "react";
import { Link } from "wouter";
import { Header } from "@/components/storefront/Header";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { SwipeHint } from "@/components/storefront/SwipeHint";
import { useProducts } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useLocation } from "wouter";
import { ChevronLeft, Tag } from "lucide-react";
import { COMBOS_DATA } from "@/pages/storefront/ComboDetail";
import { useQuery } from "@tanstack/react-query";
import type { CarouselSlide, Category } from "@shared/schema";

import welcomeAudio from "@assets/ElevenLabs_2026-03-05T15_00_59_Bella_-_Professional,_Bright,_W_1772722955169.mp3";

function ComboImages({ images }: { images: string[] }) {
  const n = images.length;
  // Each image occupies equal share + a bit extra for overlap, positioned at even intervals
  const slotPct = 100 / n;
  const widthPct = n === 1 ? 100 : slotPct + slotPct * 0.45;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((img, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0"
          style={{
            left: `${i * slotPct}%`,
            width: `${widthPct}%`,
            zIndex: i,
          }}
        >
          <img
            src={img}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Soft shadow on right edge for depth */}
          {i < n - 1 && (
            <div className="absolute top-0 right-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-black/10" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const { data: carouselSlides = [] } = useQuery<CarouselSlide[]>({ queryKey: ["/api/carousel"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentBanner, setCurrentBanner] = useState(0);
  const [view, setView] = useState<"home" | "category">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, navigate] = useLocation();

  const catScrollRef = useRef<HTMLDivElement>(null);
  const comboScrollRef = useRef<HTMLDivElement>(null);
  const specialScrollRef = useRef<HTMLDivElement>(null);
  const fishScrollRef = useRef<HTMLDivElement>(null);
  const prawnsScrollRef = useRef<HTMLDivElement>(null);
  const chickenScrollRef = useRef<HTMLDivElement>(null);
  const muttonScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasVisited = localStorage.getItem("fishtokri_visited");
    if (!hasVisited) {
      const playAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log("Audio play failed:", err));
          localStorage.setItem("fishtokri_visited", "true");
          window.removeEventListener("click", playAudio);
        }
      };
      window.addEventListener("click", playAudio);
      return () => window.removeEventListener("click", playAudio);
    }
  }, []);

  useEffect(() => {
    if (view === "home" && carouselSlides.length > 0) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % carouselSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [view, carouselSlides.length]);

  const handleCategoryClick = (catName: string) => {
    setActiveCategory(catName);
    setView("category");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredProducts = products?.filter((p) => {
    if (p.isArchived) return false;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeCategory === "All") return matchesSearch;
    return p.category === activeCategory && matchesSearch;
  }) || [];

  const getSectionProducts = (category: string) => {
    return products?.filter(p => !p.isArchived && (category === "Today's Special" ? true : p.category === category)).slice(0, 6) || [];
  };

  const sectionRefs: Record<string, RefObject<HTMLDivElement>> = {
    Fish: fishScrollRef,
    Prawns: prawnsScrollRef,
    Chicken: chickenScrollRef,
    Mutton: muttonScrollRef,
  };

  if (view === "category") {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <audio ref={audioRef} src={welcomeAudio} />
        <Header onSearch={setSearchQuery} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setView("home")} className="rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-2xl sm:text-3xl font-medium text-foreground">{activeCategory} Selection</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {isLoading ? [1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />) :
              filteredProducts.length > 0 ?
                filteredProducts.map(product => <ProductCard key={product.id} product={product} />) :
                <div className="col-span-full py-20 text-center text-muted-foreground">No products found matching your search.</div>
            }
          </div>
        </main>
        <CartDrawer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <audio ref={audioRef} src={welcomeAudio} />
      <Header onSearch={(q) => {
        setSearchQuery(q);
        if (q) setView("category");
      }} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        {/* Banner Carousel */}
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-5 shadow-lg">
          {carouselSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBanner ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={slide.imageUrl} alt={slide.title || `Banner ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {carouselSlides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentBanner ? 'bg-white w-5' : 'bg-white/50'}`}
                  data-testid={`carousel-dot-${index}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Category Row — 12 categories, big images no circle bg */}
        <div className="mb-6">
          <div
            ref={catScrollRef}
            className="flex overflow-x-auto gap-6 scrollbar-hide snap-x snap-mandatory"
          >
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className="flex-none flex flex-col items-center gap-2 snap-start group"
                data-testid={`category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 overflow-hidden transition-all duration-300 group-hover:scale-105">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-full flex items-center justify-center text-2xl">
                      🐟
                    </div>
                  )}
                </div>
                <span className="text-sm sm:text-base font-medium text-foreground whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
          <SwipeHint />
        </div>

        {/* Combos Special Section */}
        <section className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-accent" />
            <h2 className="text-xl sm:text-2xl font-medium text-foreground uppercase tracking-wide">Combos Special</h2>
          </div>
          <div ref={comboScrollRef} className="flex overflow-x-auto gap-4 sm:gap-5 scrollbar-hide snap-x">
            {COMBOS_DATA.map(combo => (
              <div key={combo.id} className="min-w-[200px] sm:min-w-[230px] snap-start flex-none">
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Full-bleed images — no bg, no circles */}
                  <Link href={`/combo/${combo.id}`}>
                    <div className="h-36 overflow-hidden rounded-t-2xl cursor-pointer">
                      <ComboImages images={combo.images} />
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/combo/${combo.id}`}>
                      <h3 className="font-semibold text-foreground text-sm leading-tight truncate cursor-pointer hover:text-primary">{combo.name}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{combo.description}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <div>
                        <span className="text-sm font-bold text-primary">₹{combo.discountedPrice}</span>
                        <span className="text-xs text-muted-foreground line-through ml-1.5">₹{combo.originalPrice}</span>
                      </div>
                      <button
                        onClick={() => addToCart({
                          id: combo.cartId,
                          name: combo.name,
                          price: combo.discountedPrice,
                          category: "Combo",
                          status: "available",
                          unit: combo.weight,
                          imageUrl: null,
                          isArchived: false,
                          updatedAt: new Date(),
                          limitedStockNote: null,
                          isCombo: true,
                        } as any)}
                        className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xl font-light hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                        data-testid={`button-add-combo-${combo.id}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <SwipeHint />
        </section>

        {/* Today's Special Section */}
        <section className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl sm:text-2xl font-medium text-foreground uppercase tracking-wide">FishTokri Today's Special</h2>
          </div>
          <div ref={specialScrollRef} className="flex overflow-x-auto gap-4 sm:gap-6 scrollbar-hide snap-x">
            {isLoading ? [1,2,3,4,5,6].map(i => <Skeleton key={i} className="min-w-[240px] sm:min-w-[280px] h-[340px] sm:h-[380px] rounded-3xl" />) :
              getSectionProducts("Today's Special").map(product => (
                <div key={product.id} className="min-w-[240px] sm:min-w-[280px] snap-start">
                  <ProductCard product={product} />
                </div>
              ))
            }
          </div>
          <SwipeHint />
        </section>

        {/* Category Specials */}
        {["Fish", "Prawns", "Chicken", "Mutton"].map((category) => (
          <section key={category} className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl sm:text-2xl font-medium text-foreground uppercase tracking-wide">{category} Specials</h2>
              <Button variant="link" onClick={() => handleCategoryClick(category)} className="text-accent font-medium p-0">View More</Button>
            </div>
            <div ref={sectionRefs[category]} className="flex overflow-x-auto gap-4 sm:gap-6 scrollbar-hide snap-x">
              {isLoading ? [1,2,3,4,5,6].map(i => <Skeleton key={i} className="min-w-[240px] sm:min-w-[280px] h-[340px] sm:h-[380px] rounded-3xl" />) :
                getSectionProducts(category).map(product => (
                  <div key={product.id} className="min-w-[240px] sm:min-w-[280px] snap-start">
                    <ProductCard product={product} />
                  </div>
                ))
              }
            </div>
            <SwipeHint />
          </section>
        ))}
      </main>

      <CartDrawer />
    </div>
  );
}
