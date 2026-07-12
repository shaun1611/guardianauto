import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/lib/vehicle-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessagesSquare, Sparkles, Trash2 } from "lucide-react";
import { diagnose } from "@/lib/complaint-diagnosis";
import { NoVehicleEmpty } from "@/components/no-vehicle-empty";
import { toast } from "sonner";
import { format } from "date-fns";

const SYMPTOMS = [
  "Engine noise", "Poor mileage", "Brake noise", "Vibration",
  "Hard starting", "Excessive smoke", "AC problem",
];

export const Route = createFileRoute("/_authenticated/complaints")({
  component: ComplaintsPage,
});

type Complaint = {
  id: string; symptom: string; description: string | null;
  ai_causes: string | null; ai_recommendation: string | null; severity: string | null; created_at: string;
};

function ComplaintsPage() {
  const { selected } = useVehicles();
  const qc = useQueryClient();
  const [symptom, setSymptom] = useState(SYMPTOMS[0]);
  const [desc, setDesc] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["complaints", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").eq("vehicle_id", selected!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Complaint[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const d = diagnose(`${symptom} ${desc}`);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("complaints").insert({
        vehicle_id: selected!.id, user_id: userData.user!.id, symptom, description: desc || null,
        ai_causes: d.causes.join(" | "), ai_recommendation: d.recommendation, severity: d.severity,
      });
      if (error) throw error;
      return d;
    },
    onSuccess: () => { toast.success("Diagnosis saved"); setDesc(""); qc.invalidateQueries({ queryKey: ["complaints"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("complaints").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }),
  });

  if (!selected) return <NoVehicleEmpty />;

  const live = diagnose(`${symptom} ${desc}`);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><MessagesSquare className="h-6 w-6 text-primary" />Complaint Registration</h1>
        <p className="text-sm text-muted-foreground">Describe a symptom — AI suggests probable causes.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader><CardTitle>Report a symptom</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Symptom</Label>
              <Select value={symptom} onValueChange={setSymptom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SYMPTOMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Details (when it happens, sound, RPM, etc.)</Label>
              <Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              <Sparkles className="h-4 w-4" /> Run AI diagnosis & save
            </Button>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>AI Diagnosis (live)</CardTitle>
            <Badge variant={live.severity === "High" ? "destructive" : live.severity === "Medium" ? "secondary" : "default"}>{live.severity}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <section>
              <h3 className="mb-1 font-semibold">Possible causes</h3>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">{live.causes.map((c) => <li key={c}>{c}</li>)}</ul>
            </section>
            <section>
              <h3 className="mb-1 font-semibold">Recommendation</h3>
              <p>{live.recommendation}</p>
            </section>
            {live.serviceRequired && <Badge variant="secondary">Service recommended</Badge>}
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated">
        <CardHeader><CardTitle>Complaint history</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No complaints logged yet.</p> : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{r.symptom}</p>
                      {r.severity && <Badge variant={r.severity === "High" ? "destructive" : "secondary"}>{r.severity}</Badge>}
                      <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "d MMM yyyy")}</span>
                    </div>
                    {r.description && <p className="mt-1 text-sm">{r.description}</p>}
                    {r.ai_causes && <p className="mt-1 text-xs text-muted-foreground"><b>Causes:</b> {r.ai_causes}</p>}
                    {r.ai_recommendation && <p className="mt-1 text-xs text-muted-foreground"><b>Action:</b> {r.ai_recommendation}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
