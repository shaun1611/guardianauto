import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { lookupObd, type ObdInfo } from "@/lib/obd-codes";
import { ScanLine, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/obd")({
  component: ObdPage,
});

function ObdPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ObdInfo | "not-found" | null>(null);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const info = lookupObd(code);
    setResult(info ?? "not-found");
  };

  const examples = ["P0171", "P0300", "P0420", "P0128", "P0562", "U0100"];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ScanLine className="h-6 w-6 text-primary" />OBD-II Diagnostic</h1>
        <p className="text-sm text-muted-foreground">Enter any OBD-II fault code — get description, causes, severity and action.</p>
      </header>

      <Card className="card-elevated">
        <CardHeader><CardTitle>Look up a fault code</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={search} className="flex flex-wrap gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label className="text-xs">OBD-II Code</Label>
              <Input placeholder="e.g. P0300" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="flex items-end"><Button type="submit">Diagnose</Button></div>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {examples.map((c) => (
              <button key={c} type="button" onClick={() => { setCode(c); setResult(lookupObd(c)); }}
                className="rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium hover:bg-accent">
                {c}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {result === "not-found" && (
        <Card className="border-destructive/50 card-elevated">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <p className="text-sm">Code <b>{code.toUpperCase()}</b> is not in our reference database. Verify the code with your OBD scanner.</p>
          </CardContent>
        </Card>
      )}

      {result && result !== "not-found" && (
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-lg">{result.code} · {result.description}</CardTitle>
            </div>
            <Badge variant={result.severity === "High" ? "destructive" : result.severity === "Medium" ? "secondary" : "default"}>
              {result.severity} severity
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <section>
              <h3 className="mb-1 text-sm font-semibold">Possible causes</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {result.causes.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </section>
            <section>
              <h3 className="mb-1 text-sm font-semibold">Recommended action</h3>
              <p className="text-sm">{result.action}</p>
            </section>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
