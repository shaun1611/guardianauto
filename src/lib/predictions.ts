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

  const baselineKm = km - (km % oilInterval);
  const baseOil = Math.max(lastService, baselineKm);

    {
      label: "Engine Oil Change",
      interval: oilInterval,
      base: lastService || km - (km % oilInterval),
      note: `${vehicle.fuel_type} interval ${oilInterval.toLocaleString()} km`,
    },
    {
      label: "General Service",
      interval: INTERVALS.general_service,
      base: lastService || km - (km % INTERVALS.general_service),
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
  // PUC/Insurance
  const now = Date.now();
  if (vehicle.puc_expiry && new Date(vehicle.puc_expiry).getTime() < now) score -= 5;
  if (vehicle.insurance_expiry && new Date(vehicle.insurance_expiry).getTime() < now) score -= 10;
  return Math.max(10, Math.min(100, Math.round(score)));
}
