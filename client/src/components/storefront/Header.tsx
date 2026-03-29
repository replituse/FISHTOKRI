import { useState } from "react";
import { Link } from "wouter";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

import logoImg from "@assets/280573676_130730389426381_2998509351925873585_n-removebg-previ_1774706495578.png";
import cartImg from "@assets/shopping-bag_1774706595493.png";
import userImg from "@assets/user_(1)_1774707188827.png";
import searchImg from "@assets/search-interface-symbol_1774706690468.png";
import locationImg from "@assets/placeholder_(1)_1774706943633.png";

export function Header({ onSearch }: { onSearch?: (query: string) => void }) {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
            <img src={logoImg} alt="FishTokri Logo" className="w-9 h-9 sm:w-12 sm:h-12 object-contain" />
            <span className="text-lg sm:text-2xl font-display font-medium text-foreground">
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

        {/* Right: Search icon (mobile) | User | Cart | Location */}
        <div className="flex items-center gap-0.5 sm:gap-3 shrink-0">
          {/* Mobile search icon */}
          {onSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-foreground hover:bg-accent/10 rounded-full"
              onClick={() => setMobileSearchOpen(v => !v)}
              aria-label="Search"
            >
              {mobileSearchOpen
                ? <X className="w-5 h-5" />
                : <img src={searchImg} alt="Search" className="w-5 h-5 object-contain" />
              }
            </Button>
          )}

          <Link href="/profile">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent/10 rounded-full">
              <img src={userImg} alt="Profile" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            </Button>
          </Link>

          <Button
            onClick={() => setIsCartOpen(true)}
            variant="ghost"
            size="icon"
            className="relative text-foreground hover:bg-accent/10 rounded-full"
          >
            <img src={cartImg} alt="Cart" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </Button>

          {/* Location — visible on all screen sizes */}
          <div className="flex items-center gap-1 pl-1 border-l border-border/50 ml-0.5">
            <img src={locationImg} alt="Location" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Mumbai</span>
          </div>
        </div>
      </div>

      {/* Mobile expandable search bar */}
      {onSearch && mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 border-t border-border/20 pt-2.5 bg-white/95 backdrop-blur-sm">
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
