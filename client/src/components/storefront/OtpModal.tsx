import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCustomer } from "@/context/CustomerContext";
import { Phone, KeyRound, X, ArrowLeft } from "lucide-react";

type Step = "phone" | "otp";

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
}

export function OtpModal({ open, onClose }: OtpModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refetch } = useCustomer();
  const [, navigate] = useLocation();
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (open) {
      setStep("phone");
      setPhone("");
      setOtp(["", "", "", ""]);
    }
  }, [open]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    }
  }, [step]);

  if (!open) return null;

  const handlePhoneSubmit = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      toast({ title: "Enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send OTP");
      }
      setPhone(cleaned);
      setStep("otp");
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 4) {
      e.preventDefault();
      setOtp(text.split(""));
      otpRefs[3].current?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 4) {
      toast({ title: "Enter the 4-digit OTP", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      refetch();
      onClose();
      navigate("/profile");
      toast({ title: "Welcome to FishTokri!" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl px-6 pt-6 pb-8 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full" data-testid="button-close-otp-modal">
          <X className="w-5 h-5" />
        </button>

        {step === "phone" ? (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Login / Sign up</h2>
              <p className="text-sm text-muted-foreground mt-1 text-center">Enter your mobile number to continue</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold">Mobile Number</Label>
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center h-10 px-3 rounded-xl border border-border/60 bg-slate-50 text-sm font-semibold text-foreground shrink-0">+91</span>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={e => e.key === "Enter" && handlePhoneSubmit()}
                    placeholder="00000 00000"
                    className="rounded-xl border-border/60 text-base tracking-widest"
                    data-testid="input-otp-phone"
                    autoFocus
                  />
                </div>
              </div>
              <Button
                onClick={handlePhoneSubmit}
                disabled={loading || phone.replace(/\D/g, "").length !== 10}
                className="w-full rounded-xl bg-primary text-white font-semibold"
                data-testid="button-send-otp"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                By continuing, you agree to our Terms & Privacy Policy
              </p>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep("phone")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 -ml-1 transition-colors"
              data-testid="button-back-to-phone"
            >
              <ArrowLeft className="w-4 h-4" /> Change number
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Enter OTP</h2>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                Sent to <span className="font-semibold text-foreground">+91 {phone}</span>
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex gap-3 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-border/60 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-slate-50"
                    data-testid={`input-otp-digit-${i}`}
                  />
                ))}
              </div>
              <Button
                onClick={handleOtpSubmit}
                disabled={loading || otp.join("").length !== 4}
                className="w-full rounded-xl bg-primary text-white font-semibold"
                data-testid="button-verify-otp"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Use OTP <span className="font-bold text-foreground">1234</span> for testing
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
