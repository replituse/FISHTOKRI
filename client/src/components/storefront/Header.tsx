import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import { useHub } from "@/context/HubContext";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";
import { CategoryMenuDropdown } from "@/components/storefront/CategoryMenu";
import { OtpModal } from "@/components/storefront/OtpModal";
import { LocationPicker } from "@/components/storefront/LocationPicker";

import logoImg from "@assets/280573676_130730389426381_2998509351925873585_n-removebg-previ_1774706495578.png";
import cartImg from "@assets/shopping-bag_1774706595493.png";
import userImg from "@assets/user_(1)_1774707188827.png";
import searchImg from "@assets/search-interface-symbol_1774706690468.png";
import locationImg from "@assets/placeholder_(1)_1774706943633.png";
import menuIconImg from "@assets/category_1774778224285.png";

const SEARCH_PHRASES = [
  "Search for fresh seafood...",
  "Try Surmai or Pomfret...",
  "Chicken, Mutton, Prawns...",
  "Fresh Crab & Lobster...",
  "Search for Masalas...",
  "Bombil, Bangda, Rawas...",
];

function TypewriterPlaceholder() {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => setPaused(false), 1400);
      return () => clearTimeout(t);
    }

    const phrase = SEARCH_PHRASES[phraseIdx];

    if (!deleting) {
      if (charIdx < phrase.length) {
        const t = setTimeout(() => {
          setDisplayed(phrase.slice(0, charIdx + 1));
          setCharIdx(c => c + 1);
        }, 55);
        return () => clearTimeout(t);
      } else {
        setPaused(true);
        setDeleting(true);
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => {
          setDisplayed(phrase.slice(0, charIdx - 1));
          setCharIdx(c => c - 1);
        }, 30);
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setPhraseIdx(i => (i + 1) % SEARCH_PHRASES.length);
      }
    }
  }, [charIdx, deleting, paused, phraseIdx]);

  return (
    <span className="text-muted-foreground/60 text-sm pointer-events-none select-none">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export function Header({ onSearch }: { onSearch?: (query: string) => void }) {
  const { totalItems, setIsCartOpen } = useCart();
  const { customer } = useCustomer();
  const { selectedSubHub, selectedSuperHub, openPicker } = useHub();
  const [, navigate] = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const locationLabel = selectedSubHub
    ? selectedSubHub.name
    : selectedSuperHub
    ? selectedSuperHub.name
    : "Select Area";

  const handleProfileClick = () => {
    if (customer) {
      navigate("/profile");
    } else {
      setOtpModalOpen(true);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 glass">
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
            <img src={searchImg} alt="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain z-10" />
            {/* Typewriter placeholder shown when empty & unfocused */}
            {!searchValue && !searchFocused && (
              <div className="absolute left-10 top-1/2 -translate-y-1/2 z-10">
                <TypewriterPlaceholder />
              </div>
            )}
            <input
              type="search"
              value={searchValue}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => {
                setSearchValue(e.target.value);
                onSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 h-10 rounded-full bg-white border border-slate-200 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 text-sm transition-all"
              data-testid="input-search-desktop"
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

          {/* Category menu icon */}
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

          <Button
            variant="ghost"
            size="icon"
            className={`text-foreground hover:bg-accent/10 rounded-full w-9 h-9 relative ${customer ? "ring-2 ring-primary/30" : ""}`}
            onClick={handleProfileClick}
            aria-label={customer ? "My Profile" : "Login"}
            data-testid="button-profile"
          >
            <img src={userImg} alt="Profile" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
            {customer && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            )}
          </Button>

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
          <button
            onClick={openPicker}
            className="flex items-center gap-1 pl-1.5 border-l border-border/50 ml-0.5 hover:opacity-70 transition-opacity"
            data-testid="button-location-picker"
          >
            <img src={locationImg} alt="Location" className="w-3.5 h-3.5 object-contain" />
            <span className={`text-xs sm:text-sm font-medium max-w-[80px] truncate ${selectedSubHub ? "text-primary" : "text-foreground"}`}>
              {locationLabel}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
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
            <img src={searchImg} alt="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain z-10" />
            <input
              type="search"
              placeholder="Search for fresh seafood..."
              className="w-full pl-10 pr-4 h-9 rounded-full bg-white border border-slate-200 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 text-sm"
              onChange={(e) => onSearch(e.target.value)}
              autoFocus
              data-testid="input-search-mobile"
            />
          </div>
        </div>
      )}
    </header>

    <OtpModal open={otpModalOpen} onClose={() => setOtpModalOpen(false)} />
    <LocationPicker />
    </>
  );
}
