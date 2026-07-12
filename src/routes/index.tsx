import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Car, Gauge, Wrench, Activity, ShieldCheck, Bot } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-hero text-primary-foreground">
              <Car className="h-5 w-5" />
            </div>
            AutoMind
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
            <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero opacity-[0.08]" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Bot className="h-3.5 w-3.5 text-primary" /> AI · Machine Learning · Mechanical Engineering
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            The AI mechanic that <span className="bg-hero bg-clip-text text-transparent">knows your car</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Predictive maintenance, OBD-II diagnostics, part-failure forecasting and smart reminders — built for passenger cars under 100 HP.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Register your car free</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth">I already have an account</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: Gauge, title: "Predictive Maintenance", body: "Next service, oil change, tyre & battery windows computed from your driving." },
          { icon: Activity, title: "OBD-II Diagnostics", body: "Enter any fault code — get description, causes, severity and recommended action." },
          { icon: Wrench, title: "Part Failure Prediction", body: "Mileage-based risk model flags parts likely to need inspection now." },
          { icon: ShieldCheck, title: "PUC & Insurance", body: "Store certificates and get reminders before expiry." },
          { icon: Bot, title: "Complaint Analysis", body: "Describe a symptom — AI suggests probable causes and next steps." },
          { icon: Car, title: "Multi-Vehicle Garage", body: "One account, every car. Complete service history in one place." },
        ].map((f) => (
          <div
            key={f.title}
            className={`card-elevated rounded-xl border bg-card p-6 transition-all duration-500 ${ready ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
