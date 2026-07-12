import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Plus, Trash2, Car } from "lucide-react";
import { toast } from "sonner";
import type { Vehicle } from "@/lib/predictions";
import { useVehicles } from "@/lib/vehicle-context";

export const Route = createFileRoute("/_authenticated/vehicles")({
  component: VehiclesPage,
});

function VehiclesPage() {
  const qc = useQueryClient();
  const { refetch } = useVehicles();
  const [open, setOpen] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Vehicle[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Vehicle removed"); qc.invalidateQueries({ queryKey: ["vehicles"] }); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Vehicles</h1>
          <p className="text-sm text-muted-foreground">Register cars under 100 HP to enable AI features.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Register vehicle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register new vehicle</DialogTitle></DialogHeader>
            <VehicleForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["vehicles"] }); refetch(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {vehicles.length === 0 ? (
        <Card className="card-elevated"><CardContent className="grid place-items-center gap-3 py-16 text-center">
          <Car className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No vehicles yet — register your first car above.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} className="card-elevated">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{v.manufacturer} {v.model}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{v.registration_number}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(v.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{v.year}</Badge>
                  <Badge variant="secondary">{v.fuel_type}</Badge>
                  <Badge variant="secondary">{v.bs_standard}</Badge>
                </div>
                <p className="text-muted-foreground">{v.odometer.toLocaleString()} km · Oil: {v.engine_oil_grade ?? "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function VehicleForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    manufacturer: "", model: "", year: new Date().getFullYear(), fuel_type: "Petrol" as "Petrol" | "Diesel",
    bs_standard: "BS6" as "BS4" | "BS6", engine_oil_grade: "", registration_number: "", odometer: 0,
    puc_number: "", puc_expiry: "", insurance_provider: "", insurance_expiry: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setSaving(false); return toast.error("Not signed in"); }
    const payload = {
      ...form,
      user_id: userData.user.id,
      puc_expiry: form.puc_expiry || null,
      insurance_expiry: form.insurance_expiry || null,
      puc_number: form.puc_number || null,
      insurance_provider: form.insurance_provider || null,
      engine_oil_grade: form.engine_oil_grade || null,
    };
    const { error } = await supabase.from("vehicles").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Vehicle registered");
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <F label="Manufacturer" required><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} required /></F>
      <F label="Model" required><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required /></F>
      <F label="Year" required><Input type="number" min={1990} max={new Date().getFullYear() + 1} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required /></F>
      <F label="Fuel Type" required>
        <Select value={form.fuel_type} onValueChange={(v) => setForm({ ...form, fuel_type: v as "Petrol" | "Diesel" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="Petrol">Petrol</SelectItem><SelectItem value="Diesel">Diesel</SelectItem></SelectContent>
        </Select>
      </F>
      <F label="BS Standard" required>
        <Select value={form.bs_standard} onValueChange={(v) => setForm({ ...form, bs_standard: v as "BS4" | "BS6" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="BS4">BS4</SelectItem><SelectItem value="BS6">BS6</SelectItem></SelectContent>
        </Select>
      </F>
      <F label="Engine Oil Grade"><Input placeholder="e.g. 5W-30" value={form.engine_oil_grade} onChange={(e) => setForm({ ...form, engine_oil_grade: e.target.value })} /></F>
      <F label="Registration Number" required><Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value.toUpperCase() })} required /></F>
      <F label="Current Odometer (km)" required><Input type="number" min={0} value={form.odometer} onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })} required /></F>
      <F label="PUC Number"><Input value={form.puc_number} onChange={(e) => setForm({ ...form, puc_number: e.target.value })} /></F>
      <F label="PUC Expiry"><Input type="date" value={form.puc_expiry} onChange={(e) => setForm({ ...form, puc_expiry: e.target.value })} /></F>
      <F label="Insurance Provider"><Input value={form.insurance_provider} onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })} /></F>
      <F label="Insurance Expiry"><Input type="date" value={form.insurance_expiry} onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })} /></F>
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save vehicle"}</Button>
      </div>
    </form>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}
