import { useVehicles } from "@/lib/vehicle-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function VehicleSelector() {
  const { vehicles, selectedId, setSelectedId } = useVehicles();
  if (vehicles.length === 0) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/vehicles"><Plus className="h-4 w-4" />Add Vehicle</Link>
      </Button>
    );
  }
  return (
    <Select value={selectedId ?? undefined} onValueChange={setSelectedId}>
      <SelectTrigger className="h-9 w-[220px]">
        <SelectValue placeholder="Select a vehicle" />
      </SelectTrigger>
      <SelectContent>
        {vehicles.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.manufacturer} {v.model} · {v.registration_number}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
