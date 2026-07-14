// Rule-based predictive maintenance engine for passenger cars <100 HP.
// Uses vehicle age, odometer, fuel type, and last service to compute
// upcoming maintenance milestones.

export type Vehicle = {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  fuel_type: "Petrol" | "Diesel";
  bs_standard: "BS4" | "BS6";
  engine_oil_grade: string | null;
  registration_number: string;
  odometer: number;
  co_emission: number | null;
  hc_emission: number | null;
  insurance_provider: string | null;
  insurance_expiry: string | null;
};


export type ServiceRecord = {
  id: string;
  service_date: string;
  odometer: number;
  parts_replaced: string | null;
  total_cost: number | null;
};

export type Prediction = {
  item: string;
  dueAtKm: number;
  kmRemaining: number;
  status: "ok" | "due-soon" | "overdue";
  note: string;
};

// Interval table (km) tuned to sub-100HP passenger cars in India (BS4/BS6).
const INTERVALS = {
  oil_petrol: 10000,
  oil_diesel: 8000,
  general_service: 10000,
  brake_inspection: 20000,
  tyre: 40000,
  battery: 50000,
  air_filter: 15000,
};

export function predictMaintenance(
  vehicle: Vehicle,
  history: ServiceRecord[],
): Prediction[] {
  const km = vehicle.odometer;
  const lastService = history[0]?.odometer ?? 0;
  const oilInterval =
    vehicle.fuel_type === "Diesel" ? INTERVALS.oil_diesel : INTERVALS.oil_petrol;

  const baseFor = (interval: number) => Math.max(lastService, km - (km % interval));

  const items: Array<{ label: string; interval: number; base: number; note: string }> = [
    {
      label: "Engine Oil Change",
      interval: oilInterval,
      base: baseFor(oilInterval),
      note: `${vehicle.fuel_type} interval ${oilInterval.toLocaleString()} km`,
    },
    {
      label: "General Service",
      interval: INTERVALS.general_service,
      base: baseFor(INTERVALS.general_service),
      note: "Full inspection + fluids",
    },

    {
      label: "Brake Inspection",
      interval: INTERVALS.brake_inspection,
      base: km - (km % INTERVALS.brake_inspection),
      note: "Pads, rotors, brake fluid",
    },
    {
      label: "Tyre Replacement",
      interval: INTERVALS.tyre,
      base: km - (km % INTERVALS.tyre),
      note: "Check tread depth & rotation",
    },
    {
      label: "Battery Check",
      interval: INTERVALS.battery,
      base: km - (km % INTERVALS.battery),
      note: "Load test + terminals",
    },
    {
      label: "Air Filter Replacement",
      interval: INTERVALS.air_filter,
      base: km - (km % INTERVALS.air_filter),
      note: "Improves mileage & performance",
    },
  ];

  return items.map((it) => {
    const dueAt = it.base + it.interval;
    const remaining = dueAt - km;
    let status: Prediction["status"] = "ok";
    if (remaining <= 0) status = "overdue";
    else if (remaining <= it.interval * 0.15) status = "due-soon";
    return {
      item: it.label,
      dueAtKm: dueAt,
      kmRemaining: remaining,
      status,
      note: it.note,
    };
  });
}

// AI health score 0-100 based on age, mileage, service coverage.
export function healthScore(vehicle: Vehicle, history: ServiceRecord[]): number {
  const age = new Date().getFullYear() - vehicle.year;
  const km = vehicle.odometer;
  let score = 100;
  // Deduct for age
  score -= Math.min(30, age * 2.5);
  // Deduct for odometer
  score -= Math.min(30, (km / 200000) * 30);
  // Boost for recent service
  const lastKm = history[0]?.odometer ?? 0;
  const gap = km - lastKm;
  if (gap > 15000) score -= 15;
  else if (gap > 10000) score -= 8;
  // Boost for service frequency
  if (history.length >= 5) score += 5;
  else if (history.length >= 2) score += 2;
  // Emissions & Insurance
  const now = Date.now();
  // BS6 CO limit ~0.3%, BS4 ~0.5%; HC BS6 ~200 ppm, BS4 ~750 ppm.
  const coLimit = vehicle.bs_standard === "BS6" ? 0.3 : 0.5;
  const hcLimit = vehicle.bs_standard === "BS6" ? 200 : 750;
  if (vehicle.co_emission != null && vehicle.co_emission > coLimit) score -= 6;
  if (vehicle.hc_emission != null && vehicle.hc_emission > hcLimit) score -= 6;
  if (vehicle.insurance_expiry && new Date(vehicle.insurance_expiry).getTime() < now) score -= 10;

  return Math.max(10, Math.min(100, Math.round(score)));
}
