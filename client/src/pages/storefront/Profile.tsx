import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/storefront/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCustomer } from "@/context/CustomerContext";
import { OtpModal } from "@/components/storefront/OtpModal";
import { apiRequest } from "@/lib/queryClient";
import type { Customer, CustomerAddress, OrderRequest } from "@shared/schema";
import {
  User, MapPin, Plus, Pencil, Trash2,
  CheckCircle2, ChevronLeft, Home, Briefcase, Tag, Navigation,
  ShoppingBag, Clock, Truck, PackageCheck, ChevronDown, ChevronUp,
  Receipt, Package, AlertCircle, LogOut
} from "lucide-react";

const TYPE_OPTIONS = [
  { value: "house" as const, icon: <Home className="w-3.5 h-3.5" />, label: "House" },
  { value: "office" as const, icon: <Briefcase className="w-3.5 h-3.5" />, label: "Office" },
  { value: "other" as const, icon: <Tag className="w-3.5 h-3.5" />, label: "Other" },
];

const addressTypeColors: Record<string, string> = {
  house: "bg-pink-100 text-pink-700",
  office: "bg-purple-100 text-purple-700",
  other: "bg-amber-100 text-amber-700",
};

type EmptyAddress = Omit<CustomerAddress, "id">;
const emptyAddress: EmptyAddress = {
  name: "", phone: "", building: "", street: "", area: "",
  pincode: "", type: "house", label: "Home", instructions: "",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:          { label: "Order Placed",      color: "bg-yellow-100 text-yellow-700 border-yellow-200",  icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed:        { label: "Confirmed",          color: "bg-blue-100 text-blue-700 border-blue-200",        icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  out_for_delivery: { label: "Out for Delivery",   color: "bg-orange-100 text-orange-700 border-orange-200",  icon: <Truck className="w-3.5 h-3.5" /> },
  delivered:        { label: "Delivered",          color: "bg-green-100 text-green-700 border-green-200",     icon: <PackageCheck className="w-3.5 h-3.5" /> },
  cancelled:        { label: "Cancelled",          color: "bg-red-100 text-red-700 border-red-200",           icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

interface OrderItem {
  productId: string | number;
  quantity: number;
  name: string;
  price: number;
}

const TABS = ["Profile & Addresses", "My Orders"] as const;
type Tab = typeof TABS[number];
type OrdersSubTab = "current" | "previous";

function OrderCard({ order }: { order: OrderRequest }) {
  const [expanded, setExpanded] = useState(false);
  const items: OrderItem[] = Array.isArray(order.items) ? order.items as OrderItem[] : [];
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 49;
  const total = subtotal + deliveryFee;
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  }) : "";

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden" data-testid={`card-order-${order.id}`}>
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">Order #{order.id}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 ${status.color}`}>
          {status.icon}
          {status.label}
        </div>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {items.slice(0, expanded ? items.length : 2).map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-xs flex items-center justify-center text-muted-foreground font-semibold flex-shrink-0">
                {item.quantity}
              </span>
              <span className="text-sm text-foreground truncate">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-foreground shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        {!expanded && items.length > 2 && (
          <p className="text-xs text-muted-foreground">+{items.length - 2} more item{items.length - 2 > 1 ? "s" : ""}</p>
        )}
      </div>

      <div className="px-4 pb-3 flex items-start gap-2">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">{order.address}, {order.deliveryArea}</p>
      </div>

      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-base font-bold text-foreground">₹{total.toLocaleString()}</span>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          data-testid={`button-invoice-${order.id}`}
        >
          <Receipt className="w-3.5 h-3.5" />
          {expanded ? "Hide Invoice" : "View Invoice"}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100">
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">Tax Invoice</p>
                <p className="text-[11px] text-muted-foreground">FishTokri · Mumbai</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">#{String(order.id).padStart(6, "0")}</p>
                <p className="text-[11px] text-muted-foreground">{date}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 space-y-0.5">
              <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wide">Bill To</p>
              <p className="text-sm font-semibold text-foreground">{order.customerName}</p>
              <p className="text-xs text-muted-foreground">{order.phone}</p>
              <p className="text-xs text-muted-foreground">{order.address}, {order.deliveryArea}</p>
            </div>

            <div>
              <div className="flex text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pb-1.5 border-b border-slate-100">
                <span className="flex-1">Item</span>
                <span className="w-10 text-center">Qty</span>
                <span className="w-20 text-right">Rate</span>
                <span className="w-20 text-right">Amount</span>
              </div>
              <div className="space-y-0">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center py-2 border-b border-slate-50 text-sm">
                    <span className="flex-1 text-foreground">{item.name}</span>
                    <span className="w-10 text-center text-muted-foreground">{item.quantity}</span>
                    <span className="w-20 text-right text-muted-foreground">₹{item.price.toLocaleString()}</span>
                    <span className="w-20 text-right font-semibold text-foreground">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-green-600">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>GST (5%)</span><span>Included</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-slate-200">
                <span>Total Paid</span><span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            {order.notes && (
              <div className="bg-amber-50 rounded-lg p-2.5">
                <p className="text-[11px] font-semibold text-amber-700 mb-0.5">Order Notes</p>
                <p className="text-xs text-amber-600">{order.notes}</p>
              </div>
            )}
            <p className="text-[11px] text-center text-muted-foreground pt-1">Thank you for shopping with FishTokri! 🐟</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { customer, isLoading: customerLoading, refetch, logout } = useCustomer();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("Profile & Addresses");
  const [ordersSubTab, setOrdersSubTab] = useState<OrdersSubTab>("current");
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [draftProfile, setDraftProfile] = useState({ name: "", email: "", dateOfBirth: "" });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addressForm, setAddressForm] = useState<EmptyAddress>(emptyAddress);
  const [useAccountDetails, setUseAccountDetails] = useState(false);

  useEffect(() => {
    if (customer) {
      setDraftProfile({
        name: customer.name || "",
        email: customer.email || "",
        dateOfBirth: customer.dateOfBirth || "",
      });
    }
  }, [customer]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderRequest[]>({
    queryKey: ["/api/customer/me/orders"],
    queryFn: async () => {
      const res = await fetch("/api/customer/me/orders");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!customer && activeTab === "My Orders",
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string | null; email?: string | null; dateOfBirth?: string | null }) =>
      apiRequest("PATCH", "/api/customer/me", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      setEditingProfile(false);
      toast({ title: "Profile updated" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const addAddressMutation = useMutation({
    mutationFn: (data: EmptyAddress) => apiRequest("POST", "/api/customer/me/addresses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      cancelForm();
      toast({ title: "Address added" });
    },
    onError: () => toast({ title: "Failed to add address", variant: "destructive" }),
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmptyAddress> }) =>
      apiRequest("PATCH", `/api/customer/me/addresses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      cancelForm();
      toast({ title: "Address updated" });
    },
    onError: () => toast({ title: "Failed to update address", variant: "destructive" }),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/customer/me/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
      toast({ title: "Address removed" });
    },
    onError: () => toast({ title: "Failed to remove address", variant: "destructive" }),
  });

  const openAddForm = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setUseAccountDetails(false);
    setShowAddressForm(true);
  };

  const openEditForm = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      name: addr.name, phone: addr.phone, building: addr.building,
      street: addr.street, area: addr.area, pincode: addr.pincode || "",
      type: addr.type, label: addr.label, instructions: addr.instructions,
    });
    setUseAccountDetails(false);
    setShowAddressForm(true);
  };

  const cancelForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setUseAccountDetails(false);
  };

  const handleUseAccountDetails = (v: boolean) => {
    setUseAccountDetails(v);
    if (v) setAddressForm(f => ({
      ...f,
      name: customer?.name || "",
      phone: customer?.phone || "",
    }));
  };

  const saveAddress = () => {
    if (!addressForm.name || !addressForm.phone || !addressForm.building || !addressForm.area) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const label = addressForm.type === "other"
      ? (addressForm.label || "Other")
      : addressForm.type === "house" ? "Home" : "Office";
    const entry = { ...addressForm, label };
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: entry });
    } else {
      addAddressMutation.mutate(entry);
    }
  };

  const currentOrders = orders.filter(o => ["pending", "confirmed", "out_for_delivery"].includes(o.status));
  const previousOrders = orders.filter(o => ["delivered", "cancelled"].includes(o.status));

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <Skeleton className="h-10 w-48 rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to continue</h1>
            <p className="text-muted-foreground text-sm">Login with your mobile number to view your profile and orders.</p>
          </div>
          <Button
            onClick={() => setOtpModalOpen(true)}
            className="rounded-xl bg-primary text-white px-8 font-semibold"
            data-testid="button-login"
          >
            Login / Sign up
          </Button>
        </main>
        <OtpModal open={otpModalOpen} onClose={() => setOtpModalOpen(false)} />
      </div>
    );
  }

  const addresses = customer.addresses || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Back + Title */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full border border-border/50 bg-white">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await logout(); navigate("/"); }}
            className="text-muted-foreground hover:text-red-600 gap-1.5 rounded-full text-xs"
            data-testid="button-logout"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-border/40 shadow-sm mb-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {tab === "Profile & Addresses" && <User className="w-3.5 h-3.5" />}
              {tab === "My Orders" && <ShoppingBag className="w-3.5 h-3.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* ── Profile & Addresses Tab ── */}
        {activeTab === "Profile & Addresses" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-foreground" />
                  <h2 className="text-base font-bold text-foreground">Profile Details</h2>
                </div>
                {!editingProfile && (
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => {
                      setDraftProfile({ name: customer.name || "", email: customer.email || "", dateOfBirth: customer.dateOfBirth || "" });
                      setEditingProfile(true);
                    }}
                    className="rounded-full text-muted-foreground hover:text-primary"
                    data-testid="button-edit-profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {editingProfile ? (
                <div className="space-y-3">
                  {([
                    { field: "name" as const, label: "Full Name", placeholder: "Your name" },
                    { field: "email" as const, label: "Email", placeholder: "you@example.com" },
                  ] as const).map(({ field, label, placeholder }) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Input
                        value={draftProfile[field]}
                        onChange={e => setDraftProfile(p => ({ ...p, [field]: e.target.value }))}
                        placeholder={placeholder}
                        className="rounded-xl border-border/60"
                        data-testid={`input-profile-${field}`}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                    <Input
                      type="date"
                      value={draftProfile.dateOfBirth}
                      onChange={e => setDraftProfile(p => ({ ...p, dateOfBirth: e.target.value }))}
                      className="rounded-xl border-border/60"
                      data-testid="input-profile-dob"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditingProfile(false)}>Cancel</Button>
                    <Button
                      className="flex-1 rounded-xl bg-primary text-white"
                      disabled={updateProfileMutation.isPending}
                      onClick={() => updateProfileMutation.mutate({
                        name: draftProfile.name || null,
                        email: draftProfile.email || null,
                        dateOfBirth: draftProfile.dateOfBirth || null,
                      })}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {[
                    { label: "Phone", value: customer.phone, verified: true },
                    { label: "Name", value: customer.name },
                    { label: "Email", value: customer.email },
                    {
                      label: "Date of Birth",
                      value: customer.dateOfBirth
                        ? new Date(customer.dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : null,
                    },
                  ].map(({ label, value, verified }) => (
                    <div key={label} className="py-3">
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      {value
                        ? <p className="font-bold text-foreground">{value}</p>
                        : <p className="font-normal italic text-muted-foreground text-sm">Not set</p>}
                      {verified && <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> Verified</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Addresses section */}
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-foreground" />
                  <h2 className="text-base font-bold text-foreground">Saved Addresses</h2>
                </div>
                {!showAddressForm ? (
                  <Button onClick={openAddForm} size="sm" className="rounded-full bg-primary text-white text-xs px-4 gap-1 h-8 hover:bg-primary/90" data-testid="button-add-address">
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={cancelForm} className="text-muted-foreground hover:text-foreground text-xs h-8 rounded-full" data-testid="button-cancel-address">
                    Cancel
                  </Button>
                )}
              </div>

              {showAddressForm && (
                <div className="mb-5 pb-5 border-b border-border/30 space-y-4">
                  <p className="text-sm font-semibold">{editingAddress ? "Edit Address" : "Add New Address"}</p>
                  {customer.name && (
                    <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-border/40">
                      <Checkbox id="use-account-profile" checked={useAccountDetails} onCheckedChange={v => handleUseAccountDetails(!!v)} className="mt-0.5" />
                      <div>
                        <label htmlFor="use-account-profile" className="text-sm font-semibold text-foreground cursor-pointer">Use my account details</label>
                        <p className="text-xs text-muted-foreground mt-0.5">{customer.name} · {customer.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Full Name *</Label>
                      <Input value={addressForm.name} onChange={e => setAddressForm(f => ({ ...f, name: e.target.value }))} placeholder="Recipient name" className="rounded-xl border-border/60" data-testid="input-address-name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Phone *</Label>
                      <Input value={addressForm.phone} onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" className="rounded-xl border-border/60" data-testid="input-address-phone" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Building / Flat No *</Label>
                    <Input value={addressForm.building} onChange={e => setAddressForm(f => ({ ...f, building: e.target.value }))} placeholder="Wing A, Flat 302, Building Name" className="rounded-xl border-border/60" data-testid="input-address-building" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Street / Locality</Label>
                    <Input value={addressForm.street} onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))} placeholder="Street name or society" className="rounded-xl border-border/60" data-testid="input-address-street" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Area / Suburb *</Label>
                      <Input value={addressForm.area} onChange={e => setAddressForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Thane West" className="rounded-xl border-border/60" data-testid="input-address-area" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Pincode</Label>
                      <Input value={addressForm.pincode} onChange={e => setAddressForm(f => ({ ...f, pincode: e.target.value }))} placeholder="400601" className="rounded-xl border-border/60" data-testid="input-address-pincode" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Address Type</Label>
                    <div className="flex gap-2">
                      {TYPE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setAddressForm(f => ({
                            ...f, type: opt.value,
                            label: opt.value === "house" ? "Home" : opt.value === "office" ? "Office" : f.label,
                          }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            addressForm.type === opt.value
                              ? "bg-primary text-white border-primary"
                              : "border-border/60 text-muted-foreground hover:border-primary/40"
                          }`}
                          data-testid={`button-address-type-${opt.value}`}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                    {addressForm.type === "other" && (
                      <Input
                        value={addressForm.label}
                        onChange={e => setAddressForm(f => ({ ...f, label: e.target.value }))}
                        placeholder='Custom label (e.g. "Parents Home")'
                        className="rounded-xl border-border/60 text-sm"
                        data-testid="input-address-custom-label"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Delivery Instructions</Label>
                    <Textarea
                      value={addressForm.instructions}
                      onChange={e => setAddressForm(f => ({ ...f, instructions: e.target.value }))}
                      placeholder="Leave at door, ring bell twice, etc."
                      className="rounded-xl border-border/60 text-sm resize-none"
                      rows={2}
                      data-testid="input-address-instructions"
                    />
                  </div>
                  <Button
                    onClick={saveAddress}
                    disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                    className="w-full rounded-xl bg-primary text-white font-semibold"
                    data-testid="button-save-address"
                  >
                    {(addAddressMutation.isPending || updateAddressMutation.isPending) ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                  </Button>
                </div>
              )}

              {addresses.length === 0 && !showAddressForm ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">No saved addresses yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="rounded-2xl border border-border/50 bg-slate-50/50 p-4" data-testid={`card-address-${addr.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {addr.type === "house" && <Home className="w-4 h-4 text-muted-foreground" />}
                            {addr.type === "office" && <Briefcase className="w-4 h-4 text-muted-foreground" />}
                            {addr.type === "other" && <Tag className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-foreground">{addr.name}</p>
                              <Badge className={`text-[10px] font-semibold px-2 py-0 h-4 ${addressTypeColors[addr.type] || "bg-slate-100 text-slate-600"}`}>{addr.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {[addr.building, addr.street, addr.area, addr.pincode].filter(Boolean).join(", ")}
                            </p>
                            {addr.instructions && (
                              <p className="text-[11px] text-muted-foreground/70 mt-1 italic">{addr.instructions}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full text-muted-foreground hover:text-primary" onClick={() => openEditForm(addr)} data-testid={`button-edit-address-${addr.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="w-7 h-7 rounded-full text-muted-foreground hover:text-red-500"
                            disabled={deleteAddressMutation.isPending}
                            onClick={() => deleteAddressMutation.mutate(addr.id)}
                            data-testid={`button-delete-address-${addr.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── My Orders Tab ── */}
        {activeTab === "My Orders" && (
          <div className="space-y-4">
            <div className="flex gap-1 bg-white rounded-2xl p-1 border border-border/40 shadow-sm">
              {(["current", "previous"] as OrdersSubTab[]).map(sub => (
                <button
                  key={sub}
                  onClick={() => setOrdersSubTab(sub)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    ordersSubTab === sub ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`tab-orders-${sub}`}
                >
                  {sub === "current" ? "Active" : "Previous"}
                </button>
              ))}
            </div>

            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
              </div>
            ) : ordersSubTab === "current" ? (
              currentOrders.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3 bg-white rounded-2xl border border-border/50 shadow-sm">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No active orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              )
            ) : (
              previousOrders.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3 bg-white rounded-2xl border border-border/50 shadow-sm">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No previous orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {previousOrders.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
