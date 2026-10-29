import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/lib/vehicle-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { predictMaintenance, type ServiceRecord } from "@/lib/predictions";
import { Brain, ArrowRight } from "lucide-react";
import { NoVehicleEmpty } from "@/components/no-vehicle-empty";

export const Route = createFileRoute("/_authenticated/predictions-backup")({
  component: PredictionsPage,
});

function PredictionsPage() {
  const { selected } = useVehicles();
  const { data: history = [] } = useQuery({
    queryKey: ["service_history", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_history").select("*").eq("vehicle_id", selected!.id).order("service_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ServiceRecord[];
    },
  });

  if (!selected) return <NoVehicleEmpty />;

  const preds = predictMaintenance(selected, history).sort((a, b) => a.kmRemaining - b.kmRemaining);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Brain className="h-6 w-6 text-primary" />AI Predictive Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          Based on model, {new Date().getFullYear() - selected.year} years age, {selected.fuel_type}, {selected.odometer.toLocaleString()} km and {history.length} past service{history.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {preds.map((p) => {
          const tone = p.status === "overdue" ? "destructive" : p.status === "due-soon" ? "secondary" : "default";
          const label = p.status === "overdue" ? "Overdue" : p.status === "due-soon" ? "Due soon" : "On track";
          return (
            <Card key={p.item} className="card-elevated">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <CardTitle className="text-base">{p.item}</CardTitle>
                <Badge variant={tone}>{label}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 text-xl font-semibold">
                  {p.dueAtKm.toLocaleString()} km
                  <span className="text-sm text-muted-foreground">
                    <ArrowRight className="mr-1 inline h-3 w-3" />
                    {p.kmRemaining <= 0 ? `${Math.abs(p.kmRemaining).toLocaleString()} km overdue` : `${p.kmRemaining.toLocaleString()} km to go`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
