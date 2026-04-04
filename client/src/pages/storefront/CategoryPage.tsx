import { useEffect } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { useProducts } from "@/hooks/use-products";
import { Header } from "@/components/storefront/Header";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

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

export default function CategoryPage() {
  const [, params] = useRoute("/category/:categoryName");
  const search = useSearch();
  const [, navigate] = useLocation();
  const { data: products, isLoading } = useProducts();

  const categoryName = params?.categoryName
    ? decodeURIComponent(params.categoryName)
    : "";

  const isAll = categoryName === "All";

  const searchParams = new URLSearchParams(search);
  const subFilter = searchParams.get("sub");

  const categoryProducts = isAll
    ? (products?.filter((p) => !p.isArchived) || [])
    : (products?.filter((p) => !p.isArchived && p.category === categoryName) || []);

  useEffect(() => {
    if (isAll || !subFilter || !products || isLoading) return;

    const match = products.find(
      (p) =>
        !p.isArchived &&
        p.category === categoryName &&
        p.subCategory?.toLowerCase() === subFilter.toLowerCase()
    );

    if (match) {
      navigate(`/product/${match.id}`, { replace: true });
    }
  }, [subFilter, products, isLoading, categoryName, isAll, navigate]);

  const displayProducts = subFilter && !isAll
    ? categoryProducts.filter(
        (p) => p.subCategory?.toLowerCase() === subFilter.toLowerCase()
      )
    : categoryProducts;

  const heroImage = getFallbackImage(categoryName);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header onSearch={() => {}} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full flex-shrink-0"
            data-testid="button-back-category"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 bg-accent/10 flex items-center justify-center">
              {isAll ? (
                <span className="text-xl">🛒</span>
              ) : (
                <img
                  src={heroImage}
                  alt={categoryName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
                {isAll ? "All Products" : categoryName}
              </h1>
              {!isLoading && (
                <p className="text-sm text-muted-foreground">
                  {displayProducts.length} item{displayProducts.length !== 1 ? "s" : ""} available
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading
            ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
              ))
            : displayProducts.length > 0
            ? displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            : (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  No products found in this category.
                </div>
              )}
        </div>
      </main>

      <CartDrawer />
    </div>
  );
}
