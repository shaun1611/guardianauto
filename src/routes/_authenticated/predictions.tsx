import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/lib/vehicle-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { predictMaintenance, type ServiceRecord } from "@/lib/predictions";
import { Brain, ArrowRight, Activity, LoaderCircle, Info } from "lucide-react";
import { useState } from "react";
import { NoVehicleEmpty } from "@/components/no-vehicle-empty";

export const Route = createFileRoute("/_authenticated/predictions")({
  component: PredictionsPage,
});
function PredictionsPage() {
  const [mlResult, setMlResult] = useState("");
  const [mlCondition, setMlCondition] = useState("");
  const [mlLoading, setMlLoading] = useState(false);
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

<Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            ML Engine Condition Check
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter engine sensor readings to test the experimental ML model.
          </p>
        </CardHeader>
        <CardContent>
          
<form
  className="grid gap-4 sm:grid-cols-2"
  onSubmit={async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const values = new FormData(form);

    const payload = {
      engine_rpm: Number(values.get("engine_rpm")),
      lub_oil_pressure: Number(values.get("lub_oil_pressure")),
      fuel_pressure: Number(values.get("fuel_pressure")),
      coolant_pressure: Number(values.get("coolant_pressure")),
      lub_oil_temp: Number(values.get("lub_oil_temp")),
      coolant_temp: Number(values.get("coolant_temp")),
    };

    setMlLoading(true);
    setMlResult("Checking your sensor readings...");

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API request failed (${response.status})`);
      }

      const result = await response.json();
      const label =
  result.condition_label ?? `Class ${result.predicted_class}`;

setMlCondition(label);
setMlResult(
  `Class ${result.predicted_class}. This is an experimental prediction, not a confirmed diagnosis.`
);
    } catch {
      setMlResult(
        "Could not connect to the ML API. Make sure the Guardian Auto ML API is running on port 8000, then try again."
      );
    } finally {
      setMlLoading(false);
    }
  }}
>
  {[
    ["engine_rpm", "Engine RPM", 1500],
    ["lub_oil_pressure", "Lubricating Oil Pressure", 3.5],
    ["fuel_pressure", "Fuel Pressure", 11],
    ["coolant_pressure", "Coolant Pressure", 2],
    ["lub_oil_temp", "Lubricating Oil Temperature (°C)", 85],
    ["coolant_temp", "Coolant Temperature (°C)", 90],
  ].map(([name, label, value]) => (
    <label key={name as string} className="grid gap-1 text-sm">
      <span>{label}</span>
      <input
        name={name as string}
        type="number"
        step="any"
        defaultValue={value as number}
        required
        className="w-full rounded-md border border-input bg-background px-3 py-2"
      />
    </label>
  ))}

  <button
    type="submit"
    disabled={mlLoading}
    className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
  >
    {mlLoading ? (
      <>
        <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
        Checking...
      </>
    ) : (
      "Check Engine Condition"
    )}
  </button>

  <div
    role="status"
    aria-live="polite"
    className="rounded-lg border bg-muted/30 p-4 sm:col-span-2"
  >
    <div className="flex items-start gap-2">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
  <p className="text-lg font-semibold text-foreground">
    {mlCondition || "Awaiting engine readings"}
  </p>
  <p className="text-sm text-muted-foreground">
    {mlResult ||
      "Enter the engine sensor readings and select Check Engine Condition."}
  </p>
  <p className="text-xs text-muted-foreground">
    Experimental AI prediction only — not a confirmed diagnosis. Consult a qualified mechanic before making maintenance decisions.
  </p>
</div>
    </div>
  </div>
</form>

        </CardContent>
      </Card>
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
