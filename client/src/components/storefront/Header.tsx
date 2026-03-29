import { useState, useRef } from "react";
import { Link } from "wouter";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { CategoryMenuDropdown } from "@/components/storefront/CategoryMenu";

import logoImg from "@assets/280573676_130730389426381_2998509351925873585_n-removebg-previ_1774706495578.png";
import cartImg from "@assets/shopping-bag_1774706595493.png";
import userImg from "@assets/user_(1)_1774707188827.png";
import searchImg from "@assets/search-interface-symbol_1774706690468.png";
import locationImg from "@assets/placeholder_(1)_1774706943633.png";
import menuIconImg from "@assets/menu_(2)_1774778083706.png";

export function Header({ onSearch }: { onSearch?: (query: string) => void }) {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center gap-1.5 group">
            <img src={logoImg} alt="FishTokri Logo" className="w-11 h-11 sm:w-14 sm:h-14 object-contain" />
            <span className="text-xl sm:text-3xl font-display font-semibold text-foreground leading-none">
              Fish<span className="text-accent">Tokri</span>
            </span>
          </Link>
        </div>

        {/* Center: Search bar — desktop only */}
        {onSearch && (
          <div className="flex-1 max-w-md relative hidden sm:block">
            <img src={searchImg} alt="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain" />
            <Input
              type="search"
              placeholder="Search for fresh seafood..."
              className="pl-10 rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}

        {/* Right: Icons */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          {/* Mobile search icon */}
          {onSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-foreground hover:bg-accent/10 rounded-full w-9 h-9"
              onClick={() => setMobileSearchOpen(v => !v)}
              aria-label="Search"
              data-testid="button-mobile-search"
            >
              {mobileSearchOpen
                ? <X className="w-5 h-5" />
                : <img src={searchImg} alt="Search" className="w-5 h-5 object-contain" />
              }
            </Button>
          )}

          {/* Category menu icon — between search and profile */}
          <Button
            variant="ghost"
            size="icon"
            className={`text-foreground hover:bg-accent/10 rounded-full w-9 h-9 transition-colors ${categoryMenuOpen ? "bg-accent/10" : ""}`}
            onClick={() => setCategoryMenuOpen(v => !v)}
            aria-label="Categories"
            data-testid="button-categories"
          >
            <img src={menuIconImg} alt="Categories" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
          </Button>

          <Link href="/profile">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent/10 rounded-full w-9 h-9" data-testid="button-profile">
              <img src={userImg} alt="Profile" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            </Button>
          </Link>

          <Button
            onClick={() => setIsCartOpen(true)}
            variant="ghost"
            size="icon"
            className="relative text-foreground hover:bg-accent/10 rounded-full w-9 h-9"
            data-testid="button-cart"
          >
            <img src={cartImg} alt="Cart" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </Button>

          {/* Location */}
          <div className="flex items-center gap-1 pl-1.5 border-l border-border/50 ml-0.5">
            <img src={locationImg} alt="Location" className="w-3.5 h-3.5 object-contain" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Mumbai</span>
          </div>
        </div>
      </div>

      {/* Category mega-menu dropdown */}
      <CategoryMenuDropdown
        open={categoryMenuOpen}
        onClose={() => setCategoryMenuOpen(false)}
      />

      {/* Mobile expandable search */}
      {onSearch && mobileSearchOpen && (
        <div className="sm:hidden px-3 pb-2.5 pt-2 border-t border-border/20 bg-white/95 backdrop-blur-sm">
          <div className="relative">
            <img src={searchImg} alt="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain" />
            <Input
              type="search"
              placeholder="Search for fresh seafood..."
              className="pl-10 rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 h-9"
              onChange={(e) => onSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
