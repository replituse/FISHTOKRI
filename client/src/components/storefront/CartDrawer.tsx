import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CheckCircle2, Minus, Plus, ShoppingBag, Trash2,
  MapPin, Banknote, CreditCard, ChevronRight, ClipboardList,
  X, Home, Briefcase, Tag, Navigation, Loader2, AlertCircle, Search
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCreateOrder } from "@/hooks/use-orders";
import { useCustomer } from "@/context/CustomerContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CustomerAddress } from "@shared/schema";

import fishImg from "@assets/Gemini_Generated_Image_w6wqkkw6wqkkw6wq_(1)_1772713077919.png";
import prawnsImg from "@assets/Gemini_Generated_Image_5xy0sd5xy0sd5xy0_1772713090650.png";
import chickenImg from "@assets/Gemini_Generated_Image_g0ecb4g0ecb4g0ec_1772713219972.png";
import muttonImg from "@assets/Gemini_Generated_Image_8fq0338fq0338fq0_1772713565349.png";
import masalaImg from "@assets/Gemini_Generated_Image_4e60a64e60a64e60_1772713888468.png";

const addressTypeColors: Record<string, string> = {
  house: "bg-blue-100 text-blue-700",
  office: "bg-purple-100 text-purple-700",
  other: "bg-amber-100 text-amber-700",
};

const TYPE_OPTIONS = [
  { value: "house" as const, icon: <Home className="w-3.5 h-3.5" />, label: "House" },
  { value: "office" as const, icon: <Briefcase className="w-3.5 h-3.5" />, label: "Office" },
  { value: "other" as const, icon: <Tag className="w-3.5 h-3.5" />, label: "Other" },
];

const emptyForm = {
  name: "", phone: "", building: "", street: "", area: "",
  pincode: "", type: "house" as "house" | "office" | "other",
  label: "", instructions: "",
};

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

async function photonSearch(query: string): Promise<PhotonFeature[]> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en&bbox=68.7,8.4,97.3,37.1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []).filter(
      (f: PhotonFeature) => f.properties.country === "India" || !f.properties.country
    );
  } catch {
    return [];
  }
}

function photonTitle(f: PhotonFeature): string {
  const p = f.properties;
  return p.name || p.locality || p.district || p.city || "";
}

function photonSubtitle(f: PhotonFeature): string {
  const p = f.properties;
  const parts: string[] = [];
  if (p.locality && p.locality !== photonTitle(f)) parts.push(p.locality);
  if (p.district && p.district !== photonTitle(f)) parts.push(p.district);
  if (p.city && p.city !== photonTitle(f)) parts.push(p.city);
  if (p.state) parts.push(p.state);
  return parts.slice(0, 3).join(", ");
}

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, updateInstruction, totalPrice, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { customer } = useCustomer();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [expandedInstructions, setExpandedInstructions] = useState<Record<number, boolean>>({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [geoFilling, setGeoFilling] = useState(false);
  const [geoFillStatus, setGeoFillStatus] = useState<"idle" | "success" | "error">("idle");
  const [geoFillMessage, setGeoFillMessage] = useState("");

  const [locSearch, setLocSearch] = useState("");
  const [locResults, setLocResults] = useState<PhotonFeature[]>([]);
  const [locSearching, setLocSearching] = useState(false);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const locTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (locTimeoutRef.current) clearTimeout(locTimeoutRef.current);
    const q = locSearch.trim();
    if (q.length < 2) {
      setLocResults([]);
      setLocSearching(false);
      setShowLocDropdown(q.length > 0);
      return;
    }
    setLocSearching(true);
    setShowLocDropdown(true);
    locTimeoutRef.current = setTimeout(async () => {
      const results = await photonSearch(q);
      setLocResults(results);
      setLocSearching(false);
    }, 350);
    return () => { if (locTimeoutRef.current) clearTimeout(locTimeoutRef.current); };
  }, [locSearch]);

  const handleLocResultSelect = useCallback((feature: PhotonFeature) => {
    const p = feature.properties;

    // area fields: locality → district → city (never use p.name here — that's the place name)
    const area = p.locality || p.district || p.city || "";
    const pincode = p.postcode?.replace(/\s/g, "") || "";
    const street = p.street || "";

    // p.name is the specific named place (e.g. "Hubtown Greenwoods") → Building/Floor
    // Only use it if it's different from the derived area (i.e. it's a POI / complex name, not just a locality)
    const placeName = p.name && p.name !== area ? p.name : "";

    setAddForm(f => ({
      ...f,
      building: placeName || f.building,
      street: street || f.street,
      area: area || f.area,
      pincode: pincode || f.pincode,
    }));
    setLocSearch("");
    setLocResults([]);
    setShowLocDropdown(false);
    setGeoFillStatus("success");
    const summary = [placeName, street, area, pincode].filter(Boolean).join(", ");
    setGeoFillMessage(`Auto-filled: ${summary || "please verify the fields below"}`);
  }, []);

  const savedAddresses: CustomerAddress[] = customer?.addresses ?? [];

  const activeAddressId = selectedAddressId ?? (savedAddresses[0]?.id || null);

  const getFallbackImage = (category: string) => {
    switch (category) {
      case "Prawns": return prawnsImg;
      case "Chicken": return chickenImg;
      case "Mutton": return muttonImg;
      case "Masalas": return masalaImg;
      case "Combo": return fishImg;
      default: return fishImg;
    }
  };

  const openAddForm = () => {
    setAddForm({
      ...emptyForm,
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
    });
    setGeoFillStatus("idle");
    setGeoFillMessage("");
    setLocSearch("");
    setLocResults([]);
    setShowLocDropdown(false);
    setShowAddForm(true);
    setTimeout(() => locInputRef.current?.focus(), 250);
  };

  const handleAutoFillLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoFillStatus("error");
      setGeoFillMessage("Your browser doesn't support location detection.");
      return;
    }
    setGeoFilling(true);
    setGeoFillStatus("idle");

    // Same geolocation options as the header location picker for consistent accuracy
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Same Nominatim URL as the header – no zoom/accept-language params which cause inconsistency
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data?.address ?? {};

          const pincode = addr.postcode?.replace(/\s/g, "") ?? "";

          // Same priority chain the header uses for postcode, extended for area/street fields
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.quarter ||
            addr.city_district ||
            addr.residential ||
            addr.hamlet ||
            addr.city ||
            addr.town ||
            addr.village ||
            "";

          const street = [addr.house_number, addr.road].filter(Boolean).join(", ") || addr.pedestrian || "";

          setAddForm(f => ({
            ...f,
            pincode: pincode || f.pincode,
            area: area || f.area,
            street: street || f.street,
          }));

          const filled = [area, pincode].filter(Boolean).join(", ");
          const city = addr.city || addr.town || addr.state_district || "";
          setGeoFillStatus("success");
          setGeoFillMessage(`Location detected: ${filled || city || "Please verify the fields below"}`);
        } catch {
          setGeoFillStatus("error");
          setGeoFillMessage("Couldn't fetch location details. Please fill manually.");
        } finally {
          setGeoFilling(false);
        }
      },
      (err) => {
        setGeoFilling(false);
        setGeoFillStatus("error");
        setGeoFillMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Please allow it in your browser settings."
            : "Couldn't detect location. Please fill address manually."
        );
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const saveAddress = async () => {
    if (!addForm.name || !addForm.phone || !addForm.building || !addForm.area) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const label =
      addForm.type === "other" ? (addForm.label || "Other") :
      addForm.type === "house" ? "Home" : "Office";

    setIsSavingAddress(true);
    try {
      const res = await fetch("/api/customer/me/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, label }),
      });
      if (!res.ok) throw new Error("Failed to save address");
      const updated = await res.json();
      queryClient.setQueryData(["/api/customer/me"], updated);
      const newAddr = updated.addresses?.[updated.addresses.length - 1];
      if (newAddr) setSelectedAddressId(newAddr.id);
      toast({ title: "Address saved!" });
      setShowAddForm(false);
      setAddForm(emptyForm);
    } catch {
      toast({ title: "Could not save address. Please try again.", variant: "destructive" });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const placeOrder = () => {
    const selected = savedAddresses.find(a => a.id === activeAddressId);
    if (!selected) return;
    const fullAddress = [selected.building, selected.street, selected.area, selected.pincode].filter(Boolean).join(", ");
    const orderItems = items.map(i => ({ productId: i.id, quantity: i.quantity, name: i.name, price: i.price }));
    createOrder(
      {
        customerName: selected.name || customer?.name || "",
        phone: selected.phone || customer?.phone || "",
        deliveryArea: selected.area,
        address: fullAddress,
        notes: selected.instructions,
        items: orderItems,
      },
      { onSuccess: () => { setIsSuccess(true); clearCart(); } }
    );
  };

  const handleClose = (open: boolean) => {
    if (!open && isSuccess) setTimeout(() => setIsSuccess(false), 300);
    setIsCartOpen(open);
  };

  const savedTotal = items.reduce((acc, item) => {
    const original = Math.round(item.price / 0.9);
    return acc + (original - item.price) * item.quantity;
  }, 0);

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white border-l border-border/30 p-0 overflow-hidden font-sans">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Order Placed!</h2>
              <p className="text-muted-foreground text-base mb-8 max-w-[260px]">
                Thank you! We'll contact you shortly to confirm your delivery.
              </p>
              <Button onClick={() => handleClose(false)} size="lg" className="w-full max-w-[220px] rounded-xl font-semibold bg-primary text-white">
                Back to Store
              </Button>
            </div>
          ) : (
            <>
              <SheetHeader className="px-5 py-4 border-b border-border/30 bg-white sticky top-0 z-10">
                <SheetTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Order Summary
                </SheetTitle>
              </SheetHeader>

              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm mt-1 mb-6">Add some fresh items to get started</p>
                  <Button variant="outline" onClick={() => setIsCartOpen(false)} className="rounded-xl">
                    Continue Browsing
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {savedTotal > 0 && (
                      <div className="mx-4 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-center">
                        <p className="text-emerald-700 text-sm font-semibold">🎉 Congratulations! You've saved ₹{savedTotal}</p>
                      </div>
                    )}

                    <div className="px-4 pt-4 space-y-3">
                      {items.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden" data-testid={`cart-item-${item.id}`}>
                          <div className="flex items-center gap-3 p-3">
                            <div className="w-14 h-14 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 p-1 flex items-center justify-center">
                              <img src={item.imageUrl || getFallbackImage(item.category)} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground text-sm truncate">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.unit}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold text-primary">₹{item.price}</span>
                                {!item.isCombo && (
                                  <>
                                    <span className="text-xs text-muted-foreground line-through">₹{Math.round(item.price / 0.9)}</span>
                                    <span className="text-[10px] font-semibold text-emerald-600">10% off</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-50 rounded-full px-2 py-1 border border-slate-100">
                              <button className="h-6 w-6 rounded-full hover:bg-white flex items-center justify-center" onClick={() => updateQuantity(item.id, item.quantity - 1)} data-testid={`button-decrease-${item.id}`}>
                                {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-slate-600" />}
                              </button>
                              <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                              <button className="h-6 w-6 rounded-full hover:bg-white flex items-center justify-center" onClick={() => updateQuantity(item.id, item.quantity + 1)} data-testid={`button-increase-${item.id}`}>
                                <Plus className="w-3 h-3 text-slate-600" />
                              </button>
                            </div>
                          </div>
                          {expandedInstructions[item.id] ? (
                            <div className="px-3 pb-3">
                              <Input
                                value={item.instruction || ""}
                                onChange={e => updateInstruction(item.id, e.target.value)}
                                placeholder="e.g. Thin sliced, curry cut, remove skin..."
                                className="h-8 text-xs rounded-lg border-border/50 bg-slate-50"
                                autoFocus
                                data-testid={`input-instruction-${item.id}`}
                              />
                            </div>
                          ) : (
                            <button
                              className="w-full px-3 pb-2.5 flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary font-medium"
                              onClick={() => setExpandedInstructions(p => ({ ...p, [item.id]: true }))}
                              data-testid={`button-add-instruction-${item.id}`}
                            >
                              <ClipboardList className="w-3 h-3" />
                              {item.instruction
                                ? <span className="text-muted-foreground truncate">"{item.instruction}"</span>
                                : "+ Add cooking instructions"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mx-4 mt-4 border border-dashed border-border/60 rounded-2xl p-4 space-y-2.5">
                      <h3 className="font-semibold text-foreground text-sm mb-3">Bill Details</h3>
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate mr-2">{item.name} × {item.quantity}</span>
                          <span className="font-medium flex-shrink-0">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-dashed border-border/40 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">₹{totalPrice}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery fee</span>
                          <span className="font-semibold text-emerald-600">FREE</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="text-lg font-bold text-primary">₹{totalPrice}</span>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="px-4 mt-5 mb-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary" /> Shipping Address
                        </h3>
                        {customer ? (
                          <Button size="sm" onClick={openAddForm} className="rounded-full h-8 px-3 text-xs bg-primary text-white gap-1" data-testid="button-add-address">
                            <Plus className="w-3 h-3" /> Add Address
                          </Button>
                        ) : null}
                      </div>

                      {!customer ? (
                        <button
                          onClick={() => { setIsCartOpen(false); navigate("/"); }}
                          className="w-full border-2 border-dashed border-border/50 rounded-2xl p-4 text-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          <MapPin className="w-6 h-6 mx-auto mb-1 opacity-40" />
                          <p className="text-sm font-medium">Please log in to use saved addresses</p>
                          <p className="text-xs mt-1 opacity-70">Tap to sign in with your phone</p>
                        </button>
                      ) : savedAddresses.length === 0 ? (
                        <button onClick={openAddForm} className="w-full border-2 border-dashed border-border/50 rounded-2xl p-4 text-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors" data-testid="button-add-first-address">
                          <MapPin className="w-6 h-6 mx-auto mb-1 opacity-40" />
                          <p className="text-sm font-medium">+ Add delivery address</p>
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {savedAddresses.map(addr => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all ${activeAddressId === addr.id ? "border-primary bg-primary/5" : "border-border/40 bg-white hover:border-primary/30"}`}
                              data-testid={`address-option-${addr.id}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${activeAddressId === addr.id ? "border-primary" : "border-slate-300"}`}>
                                  {activeAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold text-sm text-foreground">{addr.name || customer?.name}</span>
                                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${addressTypeColors[addr.type] || "bg-slate-100 text-slate-500"}`}>
                                      {addr.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{addr.phone || customer?.phone}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    {[addr.building, addr.street, addr.area, addr.pincode].filter(Boolean).join(", ")}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div className="px-4 mt-5 mb-4 space-y-3">
                      <h3 className="font-semibold text-foreground text-sm">Payment Method</h3>
                      <div className="space-y-2">
                        {[
                          { value: "cod", icon: <Banknote className="w-4 h-4 text-muted-foreground" />, label: "Cash on Delivery" },
                          { value: "online", icon: <CreditCard className="w-4 h-4 text-muted-foreground" />, label: "PhonePe / UPI / Cards / Net Banking" },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPaymentMethod(opt.value as "cod" | "online")}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${paymentMethod === opt.value ? "border-primary bg-primary/5" : "border-border/40 bg-white hover:border-primary/30"}`}
                            data-testid={`payment-${opt.value}`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === opt.value ? "border-primary" : "border-slate-300"}`}>
                              {paymentMethod === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            {opt.icon}
                            <span className="text-sm font-medium text-foreground">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-4 border-t border-border/30 bg-white sticky bottom-0 z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-primary">₹{totalPrice}</p>
                      </div>
                      <Button
                        onClick={placeOrder}
                        disabled={isPending || !customer || savedAddresses.length === 0}
                        className="h-12 px-8 rounded-xl font-bold bg-primary text-white hover:bg-primary/95 shadow-lg shadow-primary/20 flex items-center gap-2"
                        data-testid="button-place-order"
                      >
                        {isPending ? "Placing..." : <>Proceed <ChevronRight className="w-4 h-4" /></>}
                      </Button>
                    </div>
                    {!customer && (
                      <p className="text-xs text-center text-muted-foreground mt-2">Please log in to place an order</p>
                    )}
                    {customer && savedAddresses.length === 0 && (
                      <p className="text-xs text-center text-muted-foreground mt-2">Please add a delivery address to proceed</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Address Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl w-full rounded-2xl p-0 gap-0 flex flex-col max-h-[92vh]">
          <DialogHeader className="px-6 py-5 border-b border-border/30 shrink-0">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Add Delivery Address
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">

            {/* Location Search + Current Location */}
            <div className="space-y-3">
              {/* Search input */}
              <div className="relative">
                {locSearching ? (
                  <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin pointer-events-none" />
                ) : (
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                )}
                <input
                  ref={locInputRef}
                  type="text"
                  value={locSearch}
                  onChange={e => { setLocSearch(e.target.value); setGeoFillStatus("idle"); setGeoFillMessage(""); }}
                  onFocus={() => locSearch.trim().length >= 2 && setShowLocDropdown(true)}
                  placeholder="Search area, locality, landmark or pincode..."
                  className="w-full h-12 pl-10 pr-10 rounded-2xl border-2 border-border/60 focus:border-primary/60 bg-slate-50 focus:bg-white text-sm font-medium placeholder:text-muted-foreground/60 outline-none transition-all"
                  data-testid="input-location-search-address"
                />
                {locSearch && (
                  <button
                    onClick={() => { setLocSearch(""); setLocResults([]); setShowLocDropdown(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}

                {/* Search Dropdown */}
                {showLocDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-border/50 shadow-2xl z-20 overflow-hidden">
                    {/* Use current location — always at top of dropdown */}
                    <button
                      onClick={() => { setShowLocDropdown(false); setLocSearch(""); handleAutoFillLocation(); }}
                      disabled={geoFilling}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary/5 transition-colors border-b border-border/30"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">Use current location</p>
                        <p className="text-xs text-muted-foreground">Auto-detect & fill area & pincode</p>
                      </div>
                    </button>

                    {locSearching ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Finding locations...</span>
                      </div>
                    ) : locResults.length === 0 && locSearch.trim().length >= 2 ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No results found. Try a different search term.</div>
                    ) : (
                      <div className="max-h-[220px] overflow-y-auto">
                        {locResults.map((feature, i) => {
                          const title = photonTitle(feature);
                          const subtitle = photonSubtitle(feature);
                          const postcode = feature.properties.postcode;
                          return (
                            <button
                              key={`${feature.properties.osm_id ?? i}`}
                              onClick={() => handleLocResultSelect(feature)}
                              className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors border-b border-border/10 last:border-0"
                            >
                              <div className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
                                {postcode && (
                                  <p className="text-[11px] text-primary/70 font-medium mt-0.5">Pincode: {postcode}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Persistent Use Current Location button */}
              <button
                type="button"
                onClick={handleAutoFillLocation}
                disabled={geoFilling}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="button-use-current-location"
              >
                {geoFilling ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <Navigation className="w-5 h-5 text-primary shrink-0" />
                )}
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-primary leading-tight">
                    {geoFilling ? "Detecting location..." : "Use current location"}
                  </p>
                  <p className="text-xs text-muted-foreground">Auto-fill area & pincode</p>
                </div>
              </button>

              {geoFillStatus === "success" && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{geoFillMessage}</span>
                </div>
              )}
              {geoFillStatus === "error" && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{geoFillMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-xs text-muted-foreground font-medium">or enter manually</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name *</Label>
                <Input
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Recipient name"
                  className="rounded-xl h-11 border-border/60"
                  data-testid="input-address-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone *</Label>
                <Input
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="10-digit number"
                  type="tel"
                  className="rounded-xl h-11 border-border/60"
                  data-testid="input-address-phone"
                />
              </div>
            </div>

            {/* Address type */}
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAddForm(f => ({ ...f, type: opt.value }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    addForm.type === opt.value
                      ? "bg-foreground text-white border-foreground"
                      : "bg-white text-muted-foreground border-border/50 hover:border-foreground/30"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {addForm.type === "other" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Save As *</Label>
                <Input
                  value={addForm.label}
                  onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Parents Home, Gym"
                  className="rounded-xl h-11 border-border/60"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Building / Floor *</Label>
              <Input
                value={addForm.building}
                onChange={e => setAddForm(f => ({ ...f, building: e.target.value }))}
                placeholder="e.g. Wing A, Flat 402"
                className="rounded-xl h-11 border-border/60"
                data-testid="input-address-building"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Street</Label>
              <Input
                value={addForm.street}
                onChange={e => setAddForm(f => ({ ...f, street: e.target.value }))}
                placeholder="e.g. MG Road"
                className="rounded-xl h-11 border-border/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Area *</Label>
                <Input
                  value={addForm.area}
                  onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))}
                  placeholder="e.g. Andheri West"
                  className="rounded-xl h-11 border-border/60"
                  data-testid="input-address-area"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pincode</Label>
                <Input
                  value={addForm.pincode}
                  onChange={e => setAddForm(f => ({ ...f, pincode: e.target.value }))}
                  placeholder="400001"
                  type="tel"
                  maxLength={6}
                  className="rounded-xl h-11 border-border/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery Instructions</Label>
              <Textarea
                value={addForm.instructions}
                onChange={e => setAddForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="e.g. Ring bell twice, leave at door"
                className="rounded-xl border-border/60 resize-none min-h-[70px]"
                maxLength={100}
              />
            </div>
          </div>

          <div className="px-6 py-5 border-t border-border/30 flex gap-3 shrink-0">
            <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1 rounded-xl h-12">
              Cancel
            </Button>
            <Button
              onClick={saveAddress}
              disabled={isSavingAddress}
              className="flex-1 rounded-xl h-12 font-bold bg-primary text-white"
              data-testid="button-save-address"
            >
              {isSavingAddress ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save Address"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
