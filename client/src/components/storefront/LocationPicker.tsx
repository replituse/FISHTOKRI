import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, MapPin, Check } from "lucide-react";
import { useHub, SuperHub, SubHub } from "@/context/HubContext";

export function LocationPicker() {
  const { isPickerOpen, closePicker, setHub, selectedSuperHub, selectedSubHub } = useHub();
  const [step, setStep] = useState<"super" | "sub">("super");
  const [pickedSuper, setPickedSuper] = useState<SuperHub | null>(null);

  const { data: superHubs = [], isLoading: loadingSuper } = useQuery<SuperHub[]>({
    queryKey: ["/api/hubs/super"],
    enabled: isPickerOpen,
  });

  const { data: subHubs = [], isLoading: loadingSub } = useQuery<SubHub[]>({
    queryKey: ["/api/hubs/sub", pickedSuper?.id],
    queryFn: async () => {
      const res = await fetch(`/api/hubs/sub?superHubId=${pickedSuper!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sub hubs");
      return res.json();
    },
    enabled: !!pickedSuper,
  });

  useEffect(() => {
    if (isPickerOpen) {
      setStep("super");
      setPickedSuper(selectedSuperHub);
    }
  }, [isPickerOpen]);

  if (!isPickerOpen) return null;

  const handleSuperSelect = (hub: SuperHub) => {
    setPickedSuper(hub);
    setStep("sub");
  };

  const handleSubSelect = (sub: SubHub) => {
    if (pickedSuper) setHub(pickedSuper, sub);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePicker} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border/30">
          {step === "sub" && (
            <button
              onClick={() => setStep("super")}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              data-testid="button-location-back"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2 flex-1">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                {step === "super" ? "Select your city" : `Areas in ${pickedSuper?.name}`}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === "super" ? "Where should we deliver?" : "Pick your delivery area"}
              </p>
            </div>
          </div>
          <button
            onClick={closePicker}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-location-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {step === "super" ? (
            loadingSuper ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : superHubs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No cities available</p>
            ) : (
              <div className="space-y-2.5">
                {superHubs.map(hub => (
                  <button
                    key={hub.id}
                    onClick={() => handleSuperSelect(hub)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left
                      ${selectedSuperHub?.id === hub.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/40 hover:border-primary/30 hover:bg-muted/40"
                      }`}
                    data-testid={`button-super-hub-${hub.id}`}
                  >
                    {hub.imageUrl ? (
                      <img src={hub.imageUrl} alt={hub.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{hub.name}</p>
                      {hub.location && <p className="text-xs text-muted-foreground truncate">{hub.location}</p>}
                    </div>
                    {selectedSuperHub?.id === hub.id && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )
          ) : (
            loadingSub ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-2xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : subHubs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No areas available yet</p>
            ) : (
              <div className="space-y-2">
                {subHubs.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubSelect(sub)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left
                      ${selectedSubHub?.id === sub.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/40 hover:border-primary/30 hover:bg-muted/40"
                      }`}
                    data-testid={`button-sub-hub-${sub.id}`}
                  >
                    {sub.imageUrl ? (
                      <img src={sub.imageUrl} alt={sub.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{sub.name}</p>
                      {sub.location && <p className="text-xs text-muted-foreground truncate">{sub.location}</p>}
                    </div>
                    {selectedSubHub?.id === sub.id && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
