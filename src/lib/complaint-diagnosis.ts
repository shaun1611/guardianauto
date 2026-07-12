// Rule-based symptom → diagnosis engine for common car complaints.

export type Diagnosis = {
  causes: string[];
  recommendation: string;
  severity: "Low" | "Medium" | "High";
  serviceRequired: boolean;
};

type Rule = {
  keywords: string[];
  diagnosis: Diagnosis;
};

const RULES: Rule[] = [
  {
    keywords: ["engine noise", "knocking", "tapping", "ticking"],
    diagnosis: {
      causes: ["Low or degraded engine oil", "Worn hydraulic tappets", "Timing chain slack", "Piston slap in a cold engine"],
      recommendation: "Check oil level and grade first. If knocking persists after an oil change, book an engine diagnostic — do not delay.",
      severity: "High",
      serviceRequired: true,
    },
  },
  {
    keywords: ["poor mileage", "low mileage", "fuel economy", "fuel efficiency"],
    diagnosis: {
      causes: ["Clogged air filter", "Worn spark plugs", "Under-inflated tyres", "Faulty O2 sensor", "Dragging brakes"],
      recommendation: "Replace air filter and spark plugs, verify tyre pressure and wheel alignment. If unresolved, scan for O2/MAF related fault codes.",
      severity: "Medium",
      serviceRequired: true,
    },
  },
  {
    keywords: ["brake noise", "squeal", "brake squeaking", "brake grinding"],
    diagnosis: {
      causes: ["Worn brake pads (wear indicator contact)", "Scored rotor surface", "Glazed pad material", "Debris in caliper"],
      recommendation: "Inspect front and rear brake pads immediately. Grinding = metal-to-metal contact — do not drive further before service.",
      severity: "High",
      serviceRequired: true,
    },
  },
  {
    keywords: ["vibration", "shaking", "wheel wobble", "shudder"],
    diagnosis: {
      causes: ["Wheel imbalance", "Bent rim", "Worn suspension bushes", "Warped brake rotor (if felt while braking)", "Failing CV joint"],
      recommendation: "Get wheels balanced and aligned. If vibration is felt during braking, inspect brake rotors for run-out.",
      severity: "Medium",
      serviceRequired: true,
    },
  },
  {
    keywords: ["hard starting", "cranking", "won't start", "slow start"],
    diagnosis: {
      causes: ["Weak battery", "Failing starter motor", "Dirty fuel injectors", "Low fuel pressure", "Bad crankshaft position sensor"],
      recommendation: "Load-test the battery and check terminals. If battery is healthy, inspect starter draw and fuel pressure.",
      severity: "Medium",
      serviceRequired: true,
    },
  },
  {
    keywords: ["smoke", "excessive smoke", "black smoke", "blue smoke", "white smoke"],
    diagnosis: {
      causes: ["Black: rich mixture / clogged air filter", "Blue: burning oil (worn rings/valve seals)", "White: coolant entering combustion (head gasket)"],
      recommendation: "Note the smoke colour before booking service. Blue or persistent white smoke needs urgent engine attention.",
      severity: "High",
      serviceRequired: true,
    },
  },
  {
    keywords: ["ac", "air conditioner", "cooling", "not cold"],
    diagnosis: {
      causes: ["Low refrigerant charge", "Clogged cabin air filter", "Failing compressor clutch", "Blocked condenser fins"],
      recommendation: "Replace cabin filter and clean the condenser. If cooling is still weak, get the refrigerant pressure checked.",
      severity: "Low",
      serviceRequired: true,
    },
  },
];

export function diagnose(symptom: string): Diagnosis {
  const text = symptom.toLowerCase();
  const matched = RULES.find((r) => r.keywords.some((k) => text.includes(k)));
  if (matched) return matched.diagnosis;
  return {
    causes: ["Symptom not recognised by the rule-based diagnostic engine"],
    recommendation: "Describe the issue in more specific terms (when it happens, sound, smell, RPM) or book a general inspection.",
    severity: "Low",
    serviceRequired: false,
  };
}
