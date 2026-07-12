import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Vehicle } from "./predictions";

type Ctx = {
  vehicles: Vehicle[];
  selectedId: string | null;
  selected: Vehicle | null;
  setSelectedId: (id: string) => void;
  isLoading: boolean;
  refetch: () => void;
};

const VehicleCtx = createContext<Ctx | null>(null);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedIdState] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Vehicle[];
    },
  });

  const vehicles = data ?? [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("selectedVehicleId");
    if (stored && vehicles.some((v) => v.id === stored)) {
      setSelectedIdState(stored);
    } else if (vehicles[0]) {
      setSelectedIdState(vehicles[0].id);
    } else {
      setSelectedIdState(null);
    }
  }, [vehicles]);

  const setSelectedId = (id: string) => {
    setSelectedIdState(id);
    if (typeof window !== "undefined") localStorage.setItem("selectedVehicleId", id);
  };

  const selected = vehicles.find((v) => v.id === selectedId) ?? null;

  return (
    <VehicleCtx.Provider value={{ vehicles, selectedId, selected, setSelectedId, isLoading, refetch }}>
      {children}
    </VehicleCtx.Provider>
  );
}

export function useVehicles() {
  const ctx = useContext(VehicleCtx);
  if (!ctx) throw new Error("useVehicles must be used within VehicleProvider");
  return ctx;
}
