import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2, Minus, Plus, ShoppingBag, Trash2,
  MapPin, Banknote, CreditCard, Package, Navigation,
  Home, Briefcase, Tag, ChevronRight, X
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCreateOrder } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import fishImg from "@assets/Gemini_Generated_Image_w6wqkkw6wqkkw6wq_(1)_1772713077919.png";
import prawnsImg from "@assets/Gemini_Generated_Image_5xy0sd5xy0sd5xy0_1772713090650.png";
import chickenImg from "@assets/Gemini_Generated_Image_g0ecb4g0ecb4g0ec_1772713219972.png";
import muttonImg from "@assets/Gemini_Generated_Image_8fq0338fq0338fq0_1772713565349.png";
import masalaImg from "@assets/Gemini_Generated_Image_4e60a64e60a64e60_1772713888468.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  building: string;
  street: string;
  area: string;
  type: "house" | "office" | "other";
  label: string;
  instructions: string;
}

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "10-digit mobile number required").max(10),
  address: z.string().min(5, "Address is required"),
  notes: z.string().optional(),
});

type CheckoutData = z.infer<typeof checkoutSchema>;

const addressSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "10-digit number required"),
  building: z.string().min(1, "Building/Floor required"),
  street: z.string().optional(),
  area: z.string().min(2, "Area required"),
  type: z.enum(["house", "office", "other"]),
  label: z.string().optional(),
  instructions: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

const TYPE_OPTIONS = [
  { value: "house", icon: <Home className="w-3.5 h-3.5" />, label: "House" },
  { value: "office", icon: <Briefcase className="w-3.5 h-3.5" />, label: "Office" },
  { value: "other", icon: <Tag className="w-3.5 h-3.5" />, label: "Other" },
] as const;

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, totalPrice, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [useAccountDetails, setUseAccountDetails] = useState(true);
  const [profileData, setProfileData] = useState<{ name: string; phone: string } | null>(null);

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { name: "", phone: "", building: "", street: "", area: "", type: "house", label: "", instructions: "" },
  });

  const form = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { customerName: "", phone: "", address: "", notes: "" },
  });

  useEffect(() => {
    if (!isCartOpen) return;
    const addr = localStorage.getItem("fishtokri_addresses");
    if (addr) {
      const parsed: SavedAddress[] = JSON.parse(addr);
      setSavedAddresses(parsed);
      if (parsed.length > 0 && !selectedAddressId) setSelectedAddressId(parsed[0].id);
    }
    const profile = localStorage.getItem("fishtokri_profile");
    if (profile) {
      const p = JSON.parse(profile);
      setProfileData({ name: p.name || "", phone: p.phone || "" });
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (useAccountDetails && profileData) {
      addressForm.setValue("name", profileData.name);
      addressForm.setValue("phone", profileData.phone);
    }
  }, [useAccountDetails, profileData]);

  const getFallbackImage = (category: string) => {
    switch (category) {
      case "Prawns": return prawnsImg;
      case "Chicken": return chickenImg;
      case "Mutton": return muttonImg;
      case "Masalas": return masalaImg;
      default: return fishImg;
    }
  };

  const saveNewAddress = (data: AddressFormData) => {
    const newAddr: SavedAddress = {
      id: Date.now().toString(),
      name: data.name,
      phone: data.phone,
      building: data.building,
      street: data.street || "",
      area: data.area,
      type: data.type,
      label: data.type === "other" ? (data.label || "Other") : data.type === "house" ? "Home" : "Office",
      instructions: data.instructions || "",
    };
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    localStorage.setItem("fishtokri_addresses", JSON.stringify(updated));
    setSelectedAddressId(newAddr.id);
    setShowAddressDialog(false);
    addressForm.reset();
  };

  const placeOrder = () => {
    const selected = savedAddresses.find(a => a.id === selectedAddressId);
    if (!selected) return;
    const fullAddress = [selected.building, selected.street, selected.area].filter(Boolean).join(", ");
    const orderItems = items.map(i => ({ productId: i.id, quantity: i.quantity, name: i.name, price: i.price }));
    createOrder(
      { customerName: selected.name, phone: selected.phone, deliveryArea: selected.area, address: fullAddress, notes: selected.instructions, items: orderItems },
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
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-200">
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

                    {/* Savings Banner */}
                    {savedTotal > 0 && (
                      <div className="mx-4 mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-center">
                        <p className="text-emerald-700 text-sm font-semibold">🎉 Congratulations! You've saved ₹{savedTotal}</p>
                      </div>
                    )}

                    {/* Cart Items */}
                    <div className="px-4 pt-4 space-y-3">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-white rounded-2xl border border-border/40 p-3 shadow-sm" data-testid={`cart-item-${item.id}`}>
                          <div className="w-14 h-14 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 p-1 flex items-center justify-center">
                            <img src={item.imageUrl || getFallbackImage(item.category)} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{item.unit}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-primary">₹{item.price}</span>
                              <span className="text-xs text-muted-foreground line-through">₹{Math.round(item.price / 0.9)}</span>
                              <span className="text-[10px] font-semibold text-emerald-600">10% off</span>
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
                      ))}
                    </div>

                    {/* Bill Details */}
                    <div className="mx-4 mt-4 border border-dashed border-border/60 rounded-2xl p-4 space-y-2.5">
                      <h3 className="font-semibold text-foreground text-sm mb-3">Bill Details</h3>
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
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

                    {/* Delivery Address */}
                    <div className="px-4 mt-5 mb-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary" /> Shipping Address
                        </h3>
                        <Button size="sm" onClick={() => setShowAddressDialog(true)} className="rounded-full h-8 px-3 text-xs bg-primary text-white gap-1">
                          <Plus className="w-3 h-3" /> Add Address
                        </Button>
                      </div>

                      {savedAddresses.length === 0 ? (
                        <button
                          onClick={() => setShowAddressDialog(true)}
                          className="w-full border-2 border-dashed border-border/50 rounded-2xl p-4 text-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                        >
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
                              className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all ${
                                selectedAddressId === addr.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border/40 bg-white hover:border-primary/30"
                              }`}
                              data-testid={`address-option-${addr.id}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedAddressId === addr.id ? "border-primary" : "border-slate-300"}`}>
                                  {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold text-sm text-foreground">{addr.name}</span>
                                    <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{addr.label}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{addr.phone}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    {[addr.building, addr.street, addr.area].filter(Boolean).join(", ")}
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
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                              paymentMethod === opt.value ? "border-primary bg-primary/5" : "border-border/40 bg-white hover:border-primary/30"
                            }`}
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

                  {/* Sticky Footer */}
                  <div className="px-4 py-4 border-t border-border/30 bg-white sticky bottom-0 z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-primary">₹{totalPrice}</p>
                      </div>
                      <Button
                        onClick={placeOrder}
                        disabled={isPending || (!selectedAddressId && savedAddresses.length > 0) || savedAddresses.length === 0}
                        className="h-12 px-8 rounded-xl font-bold bg-primary text-white hover:bg-primary/95 shadow-lg shadow-primary/20 flex items-center gap-2"
                        data-testid="button-place-order"
                      >
                        {isPending ? "Placing..." : <>Proceed <ChevronRight className="w-4 h-4" /></>}
                      </Button>
                    </div>
                    {savedAddresses.length === 0 && (
                      <p className="text-xs text-center text-muted-foreground">Please add a delivery address to proceed</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto scrollbar-hide p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/30">
            <DialogTitle className="text-lg font-bold">Add Delivery Address</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Fill in your delivery location details</DialogDescription>
          </DialogHeader>

          <form onSubmit={addressForm.handleSubmit(saveNewAddress)} className="px-5 pb-5 space-y-4 pt-4">
            {/* Use account details */}
            {profileData?.name && (
              <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3.5 border border-border/40">
                <Checkbox
                  id="use-account"
                  checked={useAccountDetails}
                  onCheckedChange={(v) => setUseAccountDetails(!!v)}
                  className="mt-0.5"
                />
                <div>
                  <label htmlFor="use-account" className="text-sm font-semibold text-foreground cursor-pointer">Use my account details</label>
                  <p className="text-xs text-muted-foreground mt-0.5">{profileData.name}, {profileData.phone}</p>
                </div>
              </div>
            )}

            {!useAccountDetails && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</Label>
                  <Input {...addressForm.register("name")} placeholder="Recipient name" className="rounded-xl border-border/60" />
                  {addressForm.formState.errors.name && <p className="text-xs text-red-500">{addressForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                  <Input {...addressForm.register("phone")} placeholder="10-digit mobile" className="rounded-xl border-border/60" />
                  {addressForm.formState.errors.phone && <p className="text-xs text-red-500">{addressForm.formState.errors.phone.message}</p>}
                </div>
              </>
            )}

            {/* Map placeholder */}
            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Set your location on map</p>
                <p className="text-xs text-muted-foreground">Tap to pin your exact delivery location</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-lg border-primary/30 text-primary text-xs shrink-0">
                Open Map
              </Button>
            </div>

            {/* Location Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Location Details</h3>

              {/* Address type toggle */}
              <div className="flex gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => addressForm.setValue("type", opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      addressForm.watch("type") === opt.value
                        ? "bg-foreground text-white border-foreground"
                        : "bg-white text-muted-foreground border-border/50 hover:border-foreground/30"
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Building / Floor *</Label>
                <Input {...addressForm.register("building")} placeholder="e.g. Kairali Park, Wing A, Floor 3" className="rounded-xl border-border/60" />
                {addressForm.formState.errors.building && <p className="text-xs text-red-500">{addressForm.formState.errors.building.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Street <span className="font-normal text-muted-foreground/60">(Recommended)</span></Label>
                <Input {...addressForm.register("street")} placeholder="e.g. 205, MG Road" className="rounded-xl border-border/60" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Area *</Label>
                <Input {...addressForm.register("area")} placeholder="e.g. Thane West, Maharashtra 400601" className="rounded-xl border-border/60" />
                {addressForm.formState.errors.area && <p className="text-xs text-red-500">{addressForm.formState.errors.area.message}</p>}
              </div>

              {addressForm.watch("type") === "other" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Save address as *</Label>
                  <Input {...addressForm.register("label")} placeholder="e.g. Room, Gym, Parents Home" className="rounded-xl border-border/60" />
                </div>
              )}
            </div>

            {/* Delivery Instructions */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Delivery Instructions</h3>
              <div className="space-y-1.5">
                <Textarea
                  {...addressForm.register("instructions")}
                  placeholder="Instructions to reach (e.g. Take the first left near red gate)"
                  className="rounded-xl border-border/60 resize-none min-h-[72px]"
                  maxLength={100}
                />
                <p className="text-right text-xs text-muted-foreground">{addressForm.watch("instructions")?.length || 0}/100</p>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary text-white text-base mt-2">
              Save Address
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
