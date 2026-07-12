import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/lib/vehicle-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { NoVehicleEmpty } from "@/components/no-vehicle-empty";

export const Route = createFileRoute("/_authenticated/service-history")({
  component: HistoryPage,
});

type Row = {
  id: string; service_date: string; odometer: number; parts_replaced: string | null;
  service_center: string | null; labour_cost: number | null; total_cost: number | null; notes: string | null;
};

function HistoryPage() {
  const { selected } = useVehicles();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["service_history", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_history").select("*").eq("vehicle_id", selected!.id).order("service_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("service_history").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["service_history"] }); },
  });

  if (!selected) return <NoVehicleEmpty />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service History</h1>
          <p className="text-sm text-muted-foreground">{selected.manufacturer} {selected.model} · {selected.registration_number}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add entry</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New service entry</DialogTitle></DialogHeader>
            <ServiceForm vehicleId={selected.id} vehicleOdo={selected.odometer} onDone={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["service_history"] });
              qc.invalidateQueries({ queryKey: ["vehicles"] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-elevated">
        <CardHeader><CardTitle>All records</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service entries yet.</p>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
                  <div className="min-w-0">
                    <p className="font-medium">{format(new Date(r.service_date), "d MMM yyyy")} · {r.odometer.toLocaleString()} km</p>
                    <p className="truncate text-sm text-muted-foreground">{r.parts_replaced ?? "General service"}{r.service_center ? ` · ${r.service_center}` : ""}</p>
                    {r.notes && <p className="mt-1 text-xs text-muted-foreground">{r.notes}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">₹{Number(r.total_cost ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Labour ₹{Number(r.labour_cost ?? 0).toLocaleString()}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceForm({ vehicleId, vehicleOdo, onDone }: { vehicleId: string; vehicleOdo: number; onDone: () => void }) {
  const [f, setF] = useState({
    service_date: format(new Date(), "yyyy-MM-dd"),
    odometer: vehicleOdo, parts_replaced: "", service_center: "", labour_cost: 0, total_cost: 0, notes: "",
  });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from("service_history").insert({
      vehicle_id: vehicleId, user_id: userData.user.id, ...f,
    });
    if (!error && f.odometer > vehicleOdo) {
      await supabase.from("vehicles").update({ odometer: f.odometer }).eq("id", vehicleId);
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Service saved");
    onDone();
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Fld label="Service Date"><Input type="date" required value={f.service_date} onChange={(e) => setF({ ...f, service_date: e.target.value })} /></Fld>
      <Fld label="Odometer (km)"><Input type="number" required value={f.odometer} onChange={(e) => setF({ ...f, odometer: Number(e.target.value) })} /></Fld>
      <Fld label="Service Center"><Input value={f.service_center} onChange={(e) => setF({ ...f, service_center: e.target.value })} /></Fld>
      <Fld label="Labour Cost (₹)"><Input type="number" min={0} value={f.labour_cost} onChange={(e) => setF({ ...f, labour_cost: Number(e.target.value) })} /></Fld>
      <Fld label="Total Cost (₹)"><Input type="number" min={0} value={f.total_cost} onChange={(e) => setF({ ...f, total_cost: Number(e.target.value) })} /></Fld>
      <div className="sm:col-span-2"><Fld label="Parts Replaced"><Input placeholder="e.g. Engine oil, oil filter, air filter" value={f.parts_replaced} onChange={(e) => setF({ ...f, parts_replaced: e.target.value })} /></Fld></div>
      <div className="sm:col-span-2"><Fld label="Notes"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Fld></div>
      <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>Save</Button></div>
    </form>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
