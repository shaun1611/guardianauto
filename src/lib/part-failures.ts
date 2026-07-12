// Frequent part failure predictions by odometer mileage bracket.
// Based on typical failure curves for sub-100HP passenger cars.

export type PartRisk = {
  part: string;
  reason: string;
  priority: "Low" | "Medium" | "High";
  estimatedCost: string;
};

type Bracket = { from: number; to: number; items: PartRisk[] };

const BRACKETS: Bracket[] = [
  {
    from: 20000,
    to: 30000,
    items: [
      { part: "Air Filter", reason: "First replacement due for clean intake airflow", priority: "Medium", estimatedCost: "₹400 – ₹900" },
      { part: "Wiper Blades", reason: "Rubber hardens after 2 years of use", priority: "Low", estimatedCost: "₹300 – ₹800" },
      { part: "Cabin Filter", reason: "Restricts HVAC airflow when clogged", priority: "Low", estimatedCost: "₹300 – ₹700" },
    ],
  },
  {
    from: 30000,
    to: 45000,
    items: [
      { part: "Front Brake Pads", reason: "Typical friction material wear in city driving", priority: "High", estimatedCost: "₹1,200 – ₹3,500" },
      { part: "Spark Plugs (Petrol)", reason: "Electrode wear reduces ignition efficiency", priority: "Medium", estimatedCost: "₹600 – ₹2,500" },
      { part: "Coolant Flush", reason: "Corrosion inhibitors degrade over time", priority: "Medium", estimatedCost: "₹800 – ₹1,800" },
    ],
  },
  {
    from: 45000,
    to: 60000,
    items: [
      { part: "Brake Pads", reason: "Second pad change typical at this mileage", priority: "High", estimatedCost: "₹1,200 – ₹3,500" },
      { part: "Clutch Plate", reason: "Slippage/hard bite common near 50k km", priority: "High", estimatedCost: "₹6,000 – ₹15,000" },
      { part: "Suspension Bushes", reason: "Rubber bushes soften causing knock/rattle", priority: "Medium", estimatedCost: "₹1,500 – ₹5,000" },
      { part: "Wheel Bearings", reason: "Humming noise at highway speeds", priority: "Medium", estimatedCost: "₹2,000 – ₹6,000" },
      { part: "Battery", reason: "Cranking capacity drops after ~4 years", priority: "Medium", estimatedCost: "₹5,000 – ₹9,000" },
      { part: "Timing Belt (if fitted)", reason: "Manufacturer-recommended precautionary change", priority: "High", estimatedCost: "₹4,500 – ₹9,000" },
    ],
  },
  {
    from: 60000,
    to: 80000,
    items: [
      { part: "Shock Absorbers", reason: "Damping loss causes bounce and body roll", priority: "Medium", estimatedCost: "₹4,000 – ₹10,000" },
      { part: "Alternator Belt", reason: "Cracks and glazing cause slippage", priority: "Medium", estimatedCost: "₹800 – ₹2,000" },
      { part: "Fuel Filter (Diesel)", reason: "Clogging reduces power and mileage", priority: "High", estimatedCost: "₹700 – ₹2,000" },
      { part: "Radiator Hoses", reason: "Age-related softening risks leaks", priority: "Medium", estimatedCost: "₹800 – ₹2,500" },
    ],
  },
  {
    from: 80000,
    to: 120000,
    items: [
      { part: "Clutch Assembly", reason: "Full kit typically needed at this range", priority: "High", estimatedCost: "₹8,000 – ₹18,000" },
      { part: "Engine Mounts", reason: "Cabin vibration at idle indicates wear", priority: "Medium", estimatedCost: "₹2,500 – ₹7,000" },
      { part: "Steering Rack Ends / Tie Rods", reason: "Play detected during alignment", priority: "Medium", estimatedCost: "₹1,500 – ₹4,500" },
      { part: "Alternator", reason: "Voltage drop risks battery drain", priority: "Medium", estimatedCost: "₹4,000 – ₹9,000" },
    ],
  },
];

export function predictFailingParts(odometer: number, fuelType?: "Petrol" | "Diesel"): PartRisk[] {
  const results = new Map<string, PartRisk>();
  for (const b of BRACKETS) {
    if (odometer >= b.from - 5000 && odometer <= b.to + 5000) {
      b.items.forEach((it) => {
        if (fuelType === "Petrol" && it.part.includes("Diesel")) return;
        results.set(it.part, it);
      });
    }
  }
  if (results.size === 0) {
    return [
      { part: "Routine Inspection", reason: "No major parts flagged for this mileage bracket", priority: "Low", estimatedCost: "—" },
    ];
  }
  return Array.from(results.values());
}
