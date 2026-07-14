import { createFileRoute, Link } from "@tanstack/react-router";
import { useVehicles } from "@/lib/vehicle-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { predictMaintenance, healthScore, type ServiceRecord } from "@/lib/predictions";
import {
  Gauge, Wrench, Car, Droplet, ShieldCheck, TrendingUp, Calendar, Sparkles,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, differenceInDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { selected, isLoading } = useVehicles();

  const { data: history = [] } = useQuery({
    queryKey: ["service_history", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_history")
        .select("*")
        .eq("vehicle_id", selected!.id)
        .order("service_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ServiceRecord[];
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Loading garage…</div>;

  if (!selected) {
    return (
      <Card className="card-elevated mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Add your first vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Register a car to unlock predictions, part-failure alerts and reminders.
          </p>
          <Button asChild><Link to="/vehicles">Register vehicle</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const score = healthScore(selected, history);
  const preds = predictMaintenance(selected, history);
  const nextItem = [...preds].sort((a, b) => a.kmRemaining - b.kmRemaining)[0];
  const last = history[0];

  const chartData = [...history].reverse().map((s) => ({
    date: format(new Date(s.service_date), "MMM yy"),
    cost: Number(s.total_cost ?? 0),
    odometer: s.odometer,
  }));

  const insStatus = certStatus(selected.insurance_expiry);
  const emissions = emissionStatus(selected);


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{selected.manufacturer} {selected.model}</h1>
          <p className="text-sm text-muted-foreground">
            {selected.year} · {selected.fuel_type} · {selected.bs_standard} · {selected.registration_number}
          </p>
        </div>
        <Button asChild variant="outline"><Link to="/service-history">Log a service</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Gauge} label="Odometer" value={`${selected.odometer.toLocaleString()} km`} accent="primary" />
        <StatCard
          icon={Wrench}
          label="Last Service"
          value={last ? format(new Date(last.service_date), "d MMM yyyy") : "—"}
          hint={last ? `${last.odometer.toLocaleString()} km` : "No records yet"}
        />
        <StatCard
          icon={Sparkles}
          label="Next Service"
          value={nextItem.item}
          hint={
            nextItem.kmRemaining <= 0
              ? `Overdue by ${Math.abs(nextItem.kmRemaining).toLocaleString()} km`
              : `In ${nextItem.kmRemaining.toLocaleString()} km`
          }
          tone={nextItem.status}
        />
        <StatCard
          icon={Droplet}
          label="Engine Oil"
          value={oilStatus(selected, history)}
          hint={selected.engine_oil_grade ?? "Grade not set"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Service cost history</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="cost" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Log services to see trends.</div>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold">{score}<span className="text-lg text-muted-foreground">/100</span></div>
            <Progress value={score} className="mt-3" />
            <p className="mt-3 text-sm text-muted-foreground">
              {score >= 80 ? "Excellent shape — keep up scheduled service." :
                score >= 60 ? "Fair. A service is likely due soon." :
                  "Needs attention — book a workshop visit."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EmissionCard vehicle={selected} status={emissions} />
        <CertCard title="Insurance" number={selected.insurance_provider} expiry={selected.insurance_expiry} status={insStatus} icon={Calendar} />
      </div>


      <Card className="card-elevated">
        <CardHeader><CardTitle>Service History</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet. <Link className="text-primary underline" to="/service-history">Add the first one →</Link></p>
          ) : (
            <div className="divide-y">
              {history.slice(0, 5).map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{format(new Date(s.service_date), "d MMM yyyy")}</p>
                    <p className="text-xs text-muted-foreground">{s.parts_replaced ?? "General service"}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">₹{Number(s.total_cost ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{s.odometer.toLocaleString()} km</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone, accent }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string;
  hint?: string; tone?: "ok" | "due-soon" | "overdue"; accent?: "primary";
}) {
  const toneCls = tone === "overdue" ? "text-destructive" : tone === "due-soon" ? "text-[color:var(--warning)]" : "";
  return (
    <Card className="card-elevated">
      <CardContent className="p-4">
        <div className={`grid h-9 w-9 place-items-center rounded-md ${accent === "primary" ? "bg-hero text-primary-foreground" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`mt-1 truncate text-xl font-semibold ${toneCls}`}>{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function CertCard({ title, number, expiry, status, icon: Icon }: {
  title: string; number: string | null; expiry: string | null; status: ReturnType<typeof certStatus>;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="card-elevated">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{number ?? "Not set"} {expiry && `· expires ${format(new Date(expiry), "d MMM yyyy")}`}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardContent>
    </Card>
  );
}

function certStatus(expiry: string | null): { label: string; variant: "default" | "destructive" | "secondary" | "outline" } {
  if (!expiry) return { label: "Not set", variant: "outline" };
  const days = differenceInDays(new Date(expiry), new Date());
  if (days < 0) return { label: "Expired", variant: "destructive" };
  if (days < 30) return { label: `${days}d left`, variant: "destructive" };
  if (days < 90) return { label: `${days}d left`, variant: "secondary" };
  return { label: "Valid", variant: "default" };
}

import type { Vehicle } from "@/lib/predictions";
function oilStatus(v: Vehicle, hist: ServiceRecord[]): string {
  const interval = v.fuel_type === "Diesel" ? 8000 : 10000;
  const lastKm = hist[0]?.odometer ?? 0;
  const remaining = lastKm + interval - v.odometer;
  if (remaining <= 0) return "Change now";
  if (remaining < interval * 0.15) return "Due soon";
  return "Fresh";
}
