import { createFileRoute } from "@tanstack/react-router";
import { useVehicles } from "@/lib/vehicle-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { predictFailingParts } from "@/lib/part-failures";
import { NoVehicleEmpty } from "@/components/no-vehicle-empty";

export const Route = createFileRoute("/_authenticated/part-failure")({
  component: PartFailurePage,
});

function PartFailurePage() {
  const { selected } = useVehicles();
  if (!selected) return <NoVehicleEmpty />;

  const parts = predictFailingParts(selected.odometer, selected.fuel_type);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <AlertTriangle className="h-6 w-6 text-primary" />
          Frequent Part Failure Prediction
        </h1>
        <p className="text-sm text-muted-foreground">
          Components commonly requiring inspection at {selected.odometer.toLocaleString()} km on {selected.manufacturer} {selected.model} ({selected.fuel_type}).
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {parts.map((p) => {
          const tone = p.priority === "High" ? "destructive" : p.priority === "Medium" ? "secondary" : "default";
          return (
            <Card key={p.part} className="card-elevated">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <CardTitle className="text-base">{p.part}</CardTitle>
                <Badge variant={tone}>{p.priority}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{p.reason}</p>
                <p className="font-medium">Est. cost: {p.estimatedCost}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
