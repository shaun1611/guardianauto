import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

export function NoVehicleEmpty() {
  return (
    <Card className="card-elevated mx-auto max-w-md">
      <CardContent className="grid place-items-center gap-3 py-12 text-center">
        <Car className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Register a vehicle to unlock this feature.</p>
        <Button asChild><Link to="/vehicles">Add vehicle</Link></Button>
      </CardContent>
    </Card>
  );
}
