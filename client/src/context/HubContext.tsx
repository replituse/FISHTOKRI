import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { setActiveHubDb, queryClient } from "@/lib/queryClient";

export interface SuperHub {
  id: string;
  name: string;
  location: string | null;
  imageUrl: string | null;
}

export interface SubHub {
  id: string;
  superHubId: string | null;
  name: string;
  location: string | null;
  imageUrl: string | null;
  dbName: string;
  pincodes: string[];
}

interface HubContextValue {
  selectedSuperHub: SuperHub | null;
  selectedSubHub: SubHub | null;
  setHub: (superHub: SuperHub, subHub: SubHub) => void;
  clearHub: () => void;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
}

const HubContext = createContext<HubContextValue>({
  selectedSuperHub: null,
  selectedSubHub: null,
  setHub: () => {},
  clearHub: () => {},
  isPickerOpen: false,
  openPicker: () => {},
  closePicker: () => {},
});

const STORAGE_KEY = "fishtokri_hub";

export function HubProvider({ children }: { children: ReactNode }) {
  const [selectedSuperHub, setSelectedSuperHub] = useState<SuperHub | null>(null);
  const [selectedSubHub, setSelectedSubHub] = useState<SubHub | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { superHub, subHub } = JSON.parse(saved);
        setSelectedSuperHub(superHub);
        setSelectedSubHub(subHub);
        setActiveHubDb(subHub.dbName);
      }
    } catch {}
  }, []);

  const setHub = useCallback((superHub: SuperHub, subHub: SubHub) => {
    setSelectedSuperHub(superHub);
    setSelectedSubHub(subHub);
    setActiveHubDb(subHub.dbName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ superHub, subHub }));
    queryClient.invalidateQueries();
    setIsPickerOpen(false);
  }, []);

  const clearHub = useCallback(() => {
    setSelectedSuperHub(null);
    setSelectedSubHub(null);
    setActiveHubDb(null);
    localStorage.removeItem(STORAGE_KEY);
    queryClient.invalidateQueries();
  }, []);

  return (
    <HubContext.Provider value={{
      selectedSuperHub, selectedSubHub, setHub, clearHub,
      isPickerOpen, openPicker: () => setIsPickerOpen(true), closePicker: () => setIsPickerOpen(false),
    }}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  return useContext(HubContext);
}
