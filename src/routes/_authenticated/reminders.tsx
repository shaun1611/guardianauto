import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/lib/vehicle-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BellRing, Plus, Trash2 } from "lucide-react";
import { NoVehicleEmpty } from "@/components/no-vehicle-empty";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

const KINDS = [
  { value: "oil_change", label: "Engine Oil Change" },
  { value: "service", label: "Vehicle Service" },
  { value: "puc", label: "Pollution Certificate" },
  { value: "insurance", label: "Insurance Renewal" },
  { value: "battery", label: "Battery Check" },
  { value: "tyres", label: "Tyre Inspection" },
  { value: "air_filter", label: "Air Filter" },
  { value: "brake", label: "Brake Inspection" },
] as const;

type Kind = typeof KINDS[number]["value"];

type Reminder = {
  id: string; kind: Kind; title: string; due_date: string | null;
  due_odometer: number | null; completed: boolean; notes: string | null;
};

export const Route = createFileRoute("/_authenticated/reminders")({
  component: RemindersPage,
});

function RemindersPage() {
  const { selected } = useVehicles();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["reminders", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from("reminders").select("*").eq("vehicle_id", selected!.id).order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Reminder[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (r: Reminder) => {
      const { error } = await supabase.from("reminders").update({ completed: !r.completed }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("reminders").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  if (!selected) return <NoVehicleEmpty />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><BellRing className="h-6 w-6 text-primary" />Reminders</h1>
          <p className="text-sm text-muted-foreground">Never miss oil changes, PUC, insurance or tyre checks.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New reminder</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New reminder</DialogTitle></DialogHeader>
            <ReminderForm vehicleId={selected.id} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["reminders"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-elevated">
        <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No reminders set. Add one above.</p> : (
            <div className="divide-y">
              {rows.map((r) => {
                const days = r.due_date ? differenceInDays(new Date(r.due_date), new Date()) : null;
                const badge = r.completed ? { label: "Done", variant: "default" as const } :
                  days === null ? { label: "Manual", variant: "outline" as const } :
                  days < 0 ? { label: `${-days}d overdue`, variant: "destructive" as const } :
                  days < 15 ? { label: `${days}d left`, variant: "destructive" as const } :
                  days < 45 ? { label: `${days}d left`, variant: "secondary" as const } :
                  { label: `${days}d left`, variant: "default" as const };
                return (
                  <div key={r.id} className="flex items-center gap-3 py-3">
                    <Checkbox checked={r.completed} onCheckedChange={() => toggle.mutate(r)} />
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${r.completed ? "line-through text-muted-foreground" : ""}`}>{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.due_date ? format(new Date(r.due_date), "d MMM yyyy") : "No date"}
                        {r.due_odometer ? ` · at ${r.due_odometer.toLocaleString()} km` : ""}
                      </p>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReminderForm({ vehicleId, onDone }: { vehicleId: string; onDone: () => void }) {
  const [kind, setKind] = useState<Kind>("oil_change");
  const [title, setTitle] = useState("Engine oil change");
  const [dueDate, setDueDate] = useState("");
  const [dueOdo, setDueOdo] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const onKindChange = (v: string) => {
    setKind(v as Kind);
    const found = KINDS.find((k) => k.value === v);
    if (found) setTitle(found.label);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("reminders").insert({
      vehicle_id: vehicleId, user_id: userData.user!.id,
      kind, title, due_date: dueDate || null, due_odometer: dueOdo === "" ? null : Number(dueOdo),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Reminder added");
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Type</Label>
        <Select value={kind} onValueChange={onKindChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label className="text-xs">Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Due at odometer (km)</Label><Input type="number" min={0} value={dueOdo} onChange={(e) => setDueOdo(e.target.value === "" ? "" : Number(e.target.value))} /></div>
      </div>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>Save reminder</Button></div>
    </form>
  );
}
