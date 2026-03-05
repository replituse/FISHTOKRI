import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCreateOrder } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "10-digit mobile number required").max(10, "10-digit mobile number required"),
  deliveryArea: z.string().min(1, "Delivery area is required"),
  notes: z.string().optional(),
});

type CheckoutData = z.infer<typeof checkoutSchema>;

const DELIVERY_AREAS = [
  "Thane", "Mulund", "Airoli", "Bhandup", 
  "Vikhroli", "Powai", "Vashi", "Nerul"
];

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, totalPrice, clearCart } = useCart();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      deliveryArea: "",
      notes: "",
    },
  });

  const onSubmit = (data: CheckoutData) => {
    const orderItems = items.map((i) => ({
      productId: i.id,
      quantity: i.quantity,
      name: i.name,
      price: i.price,
    }));

    createOrder(
      { ...data, items: orderItems },
      {
        onSuccess: () => {
          setIsSuccess(true);
          clearCart();
          form.reset();
        },
      }
    );
  };

  const handleClose = (open: boolean) => {
    if (!open && isSuccess) {
      setTimeout(() => setIsSuccess(false), 300);
    }
    setIsCartOpen(open);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white border-l-0 p-0 overflow-hidden font-sans">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-emerald-50/50 to-white">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-200 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold text-[#1A237E] mb-3">Order Placed!</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-[250px]">
              Thank you! We will contact you shortly to confirm your delivery.
            </p>
            <Button
              onClick={() => handleClose(false)}
              size="lg"
              className="w-full max-w-[200px] rounded-xl font-semibold shadow-lg shadow-primary/20 bg-[#1A237E] text-white hover:bg-[#1A237E]/90"
            >
              Back to Store
            </Button>
          </div>
        ) : (
          <>
            <SheetHeader className="p-6 border-b border-border/50 bg-white/80 backdrop-blur sticky top-0 z-10">
              <SheetTitle className="flex items-center gap-2 text-2xl font-bold text-[#1A237E]">
                <ShoppingBag className="w-6 h-6" />
                Your Order
              </SheetTitle>
            </SheetHeader>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg">Your cart is empty</p>
                <Button variant="link" onClick={() => setIsCartOpen(false)} className="mt-4 text-[#1A237E]">
                  Continue Browsing
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100 p-1">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50/50 text-3xl">🐟</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#1A237E] truncate text-base">{item.name}</h4>
                          <div className="text-sm font-semibold text-slate-600 mt-1">₹{item.price} <span className="text-slate-400 font-normal">/ {item.unit}</span></div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1 bg-slate-50 rounded-full px-2 py-1 border border-slate-100">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white text-slate-600" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                              {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                            </Button>
                            <span className="text-sm font-bold w-6 text-center text-[#1A237E]">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-white text-slate-600" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-[#1A237E] text-lg mb-5">Delivery Details</h3>
                    <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="customerName" className="text-slate-600 font-semibold ml-1">Full Name</Label>
                        <Input id="customerName" placeholder="Enter your name" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-colors" {...form.register("customerName")} />
                        {form.formState.errors.customerName && <p className="text-xs font-medium text-red-500 ml-1 mt-1">{form.formState.errors.customerName.message}</p>}
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-slate-600 font-semibold ml-1">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="10-digit mobile number" className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-colors" {...form.register("phone")} />
                        {form.formState.errors.phone && <p className="text-xs font-medium text-red-500 ml-1 mt-1">{form.formState.errors.phone.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-600 font-semibold ml-1">Delivery Area</Label>
                        <Select onValueChange={(val) => form.setValue("deliveryArea", val)}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-colors">
                            <SelectValue placeholder="Select your area" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl border-slate-100">
                            {DELIVERY_AREAS.map((area) => (
                              <SelectItem key={area} value={area} className="rounded-lg py-2.5">{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.deliveryArea && <p className="text-xs font-medium text-red-500 ml-1 mt-1">{form.formState.errors.deliveryArea.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-slate-600 font-semibold ml-1">Special Instructions (Optional)</Label>
                        <Textarea id="notes" placeholder="e.g. Cut into small pieces" className="min-h-[100px] resize-none rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-colors p-4" {...form.register("notes")} />
                      </div>
                    </form>
                  </div>
                </div>

                <div className="p-6 border-t bg-white border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] sticky bottom-0 z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-slate-500 font-semibold text-base">Total Amount</span>
                    <span className="text-3xl font-bold text-[#1A237E]">₹{totalPrice}</span>
                  </div>
                  <Button 
                    type="submit" 
                    form="checkout-form" 
                    disabled={isPending}
                    className="w-full h-14 text-lg rounded-xl font-bold bg-[#1A237E] text-white hover:bg-[#1A237E]/95 shadow-xl shadow-blue-900/10 transition-all active:scale-[0.98]"
                  >
                    {isPending ? "Confirming..." : <span className="text-white">Confirm Order</span>}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
