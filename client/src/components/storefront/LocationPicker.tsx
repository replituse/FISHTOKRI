import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, MapPin, Check, Navigation, Loader2, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { useHub, SuperHub, SubHub } from "@/context/HubContext";

type GeoStatus = "idle" | "detecting" | "serviceable" | "unserviceable" | "denied" | "error";

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    road?: string;
  };
  lat: string;
  lon: string;
}

async function getPincodeFromCoords(lat: number, lon: number): Promise<{ pincode: string | null; address: NominatimResult | null }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return { pincode: null, address: null };
    const data: NominatimResult = await res.json();
    const pincode = data?.address?.postcode?.replace(/\s/g, "") ?? null;
    return { pincode, address: data };
  } catch {
    return { pincode: null, address: null };
  }
}

async function searchLocations(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=in`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function getShortName(result: NominatimResult): string {
  const a = result.address;
  return a.suburb || a.neighbourhood || a.city_district || a.city || result.display_name.split(",")[0];
}

function getSubtitle(result: NominatimResult): string {
  const parts = result.display_name.split(",").map(s => s.trim());
  return parts.slice(1, 4).join(", ");
}

export function LocationPicker() {
  const { isPickerOpen, closePicker, setHub, selectedSuperHub, selectedSubHub } = useHub();
  const [step, setStep] = useState<"super" | "sub">("super");
  const [pickedSuper, setPickedSuper] = useState<SuperHub | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoMessage, setGeoMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<"idle" | "serviceable" | "unserviceable">("idle");
  const [searchMessage, setSearchMessage] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const { data: allSubHubs = [] } = useQuery<SubHub[]>({
    queryKey: ["/api/hubs/sub-all"],
    queryFn: async () => {
      const res = await fetch("/api/hubs/sub", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isPickerOpen,
  });

  useEffect(() => {
    if (isPickerOpen) {
      setStep("super");
      setPickedSuper(selectedSuperHub);
      setGeoStatus("idle");
      setGeoMessage("");
      setSearchQuery("");
      setSearchResults([]);
      setSearchStatus("idle");
      setSearchMessage("");
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  }, [isPickerOpen]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchStatus("idle");
      return;
    }
    setIsSearching(true);
    setSearchStatus("idle");
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  const handleSearchResultSelect = useCallback(async (result: NominatimResult) => {
    const pincode = result.address?.postcode?.replace(/\s/g, "") ?? null;

    if (!pincode) {
      setSearchStatus("unserviceable");
      setSearchMessage("We couldn't determine the pincode for this location. Please select manually.");
      setSearchResults([]);
      return;
    }

    const matchedSub = allSubHubs.find((sub) =>
      sub.pincodes.some((p) => p.replace(/\s/g, "") === pincode)
    );

    if (!matchedSub) {
      setSearchStatus("unserviceable");
      setSearchMessage(`We don't deliver to ${getShortName(result)} (${pincode}) yet.`);
      setSearchResults([]);
      setSearchQuery(getShortName(result));
      return;
    }

    const matchedSuper = superHubs.find((s) => s.id === matchedSub.superHubId);
    if (!matchedSuper) {
      setSearchStatus("unserviceable");
      setSearchMessage("Couldn't match your location. Please select manually.");
      setSearchResults([]);
      return;
    }

    setSearchStatus("serviceable");
    setSearchMessage(`We deliver to ${matchedSub.name}!`);
    setSearchResults([]);
    setSearchQuery(getShortName(result));

    setTimeout(() => {
      setHub(matchedSuper, matchedSub);
    }, 800);
  }, [allSubHubs, superHubs, setHub]);

  const handleDetectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoMessage("Your browser doesn't support location detection.");
      return;
    }
    setGeoStatus("detecting");
    setGeoMessage("Detecting your location...");
    setSearchResults([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGeoMessage("Checking serviceability...");

        const { pincode } = await getPincodeFromCoords(latitude, longitude);

        if (!pincode) {
          setGeoStatus("error");
          setGeoMessage("Couldn't determine your area. Please select manually.");
          return;
        }

        const matchedSub = allSubHubs.find((sub) =>
          sub.pincodes.some((p) => p.replace(/\s/g, "") === pincode)
        );

        if (!matchedSub) {
          setGeoStatus("unserviceable");
          setGeoMessage(`Sorry, we don't deliver to your area yet (${pincode}).`);
          return;
        }

        const matchedSuper = superHubs.find((s) => s.id === matchedSub.superHubId);
        if (!matchedSuper) {
          setGeoStatus("error");
          setGeoMessage("Couldn't match your location. Please select manually.");
          return;
        }

        setGeoStatus("serviceable");
        setGeoMessage(`Great news! We deliver to ${matchedSub.name}.`);

        setTimeout(() => {
          setHub(matchedSuper, matchedSub);
        }, 1200);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus("denied");
          setGeoMessage("Location access denied. Please allow it in your browser settings.");
        } else {
          setGeoStatus("error");
          setGeoMessage("Couldn't detect location. Please select manually.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [allSubHubs, superHubs, setHub]);

  if (!isPickerOpen) return null;

  const handleSuperSelect = (hub: SuperHub) => {
    setPickedSuper(hub);
    setStep("sub");
  };

  const handleSubSelect = (sub: SubHub) => {
    if (pickedSuper) setHub(pickedSuper, sub);
  };

  const GeoStatusBanner = () => {
    if (geoStatus === "idle") return null;
    const configs = {
      detecting: { icon: <Loader2 className="w-4 h-4 animate-spin" />, bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
      serviceable: { icon: <CheckCircle2 className="w-4 h-4" />, bg: "bg-green-50 border-green-200", text: "text-green-700" },
      unserviceable: { icon: <AlertCircle className="w-4 h-4" />, bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
      denied: { icon: <AlertCircle className="w-4 h-4" />, bg: "bg-red-50 border-red-200", text: "text-red-700" },
      error: { icon: <AlertCircle className="w-4 h-4" />, bg: "bg-red-50 border-red-200", text: "text-red-700" },
    };
    const cfg = configs[geoStatus as keyof typeof configs];
    if (!cfg) return null;
    return (
      <div className={`mx-4 mt-2 flex items-center gap-2 p-3 rounded-xl border text-sm ${cfg.bg} ${cfg.text}`}>
        {cfg.icon}
        <span>{geoMessage}</span>
      </div>
    );
  };

  const showSearchDropdown = searchQuery.trim().length >= 2 && (isSearching || searchResults.length > 0);

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePicker} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-border/30">
          {step === "sub" && (
            <button
              onClick={() => setStep("super")}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              data-testid="button-location-back"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground leading-tight">Select a location</h2>
          </div>
          <button
            onClick={closePicker}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-location-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Box */}
        <div className="px-4 pt-3 relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchStatus("idle"); }}
              placeholder="Search for your area, locality..."
              className="w-full h-11 pl-10 pr-10 rounded-2xl border-2 border-border/50 focus:border-primary/50 bg-slate-50 text-sm font-medium placeholder:text-muted-foreground/60 outline-none transition-colors"
              data-testid="input-location-search"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchStatus("idle"); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Search Status */}
          {searchStatus === "serviceable" && (
            <div className="mt-2 flex items-center gap-2 p-2.5 rounded-xl border bg-green-50 border-green-200 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{searchMessage}</span>
            </div>
          )}
          {searchStatus === "unserviceable" && (
            <div className="mt-2 flex items-center gap-2 p-2.5 rounded-xl border bg-orange-50 border-orange-200 text-orange-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchMessage}</span>
            </div>
          )}

          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl border border-border/50 shadow-xl z-10 overflow-hidden">
              {isSearching ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <>
                  {/* Use current location in dropdown */}
                  <button
                    onClick={() => { setSearchResults([]); setSearchQuery(""); handleDetectLocation(); }}
                    disabled={geoStatus === "detecting"}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-border/30"
                  >
                    <Navigation className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-primary">Use current location</p>
                      <p className="text-xs text-muted-foreground">Auto-detect your area</p>
                    </div>
                  </button>
                  {searchResults.map(result => (
                    <button
                      key={result.place_id}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors border-b border-border/20 last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{getShortName(result)}</p>
                        <p className="text-xs text-muted-foreground truncate">{getSubtitle(result)}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Use current location button (always visible) */}
        <div className="px-4 pt-3">
          <button
            onClick={handleDetectLocation}
            disabled={geoStatus === "detecting" || geoStatus === "serviceable"}
            data-testid="button-detect-location"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {geoStatus === "detecting" ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
            ) : (
              <Navigation className="w-5 h-5 text-primary shrink-0" />
            )}
            <div className="text-left">
              <p className="text-sm font-semibold text-primary leading-tight">
                {geoStatus === "detecting" ? "Detecting location..." : "Use current location"}
              </p>
              <p className="text-xs text-muted-foreground">Auto-detect & check serviceability</p>
            </div>
          </button>
        </div>

        {/* Geo Status Banner */}
        <GeoStatusBanner />

        {/* Divider */}
        <div className="flex items-center gap-3 px-4 mt-3">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-xs text-muted-foreground font-medium">or select manually</span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        {/* Content */}
        <div className="max-h-[38vh] overflow-y-auto p-4 pt-3">
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
                      {sub.pincodes?.length > 0 && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Pincodes: {sub.pincodes.slice(0, 3).join(", ")}{sub.pincodes.length > 3 ? "..." : ""}
                        </p>
                      )}
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
