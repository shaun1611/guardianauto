// Curated OBD-II fault code database for passenger cars.

export type ObdInfo = {
  code: string;
  description: string;
  causes: string[];
  severity: "Low" | "Medium" | "High";
  action: string;
};

const CODES: Record<string, ObdInfo> = {
  P0000: { code: "P0000", description: "No fault", causes: ["No stored code"], severity: "Low", action: "System healthy — no action required." },
  P0100: { code: "P0100", description: "Mass Air Flow (MAF) circuit malfunction", causes: ["Dirty MAF sensor", "Loose intake hose", "Faulty MAF sensor"], severity: "Medium", action: "Inspect and clean MAF sensor; check intake ducting for leaks." },
  P0113: { code: "P0113", description: "Intake Air Temperature sensor high input", causes: ["Sensor wiring open", "Faulty IAT sensor"], severity: "Low", action: "Check IAT connector and replace sensor if needed." },
  P0128: { code: "P0128", description: "Coolant temperature below thermostat regulation", causes: ["Stuck-open thermostat", "Low coolant"], severity: "Medium", action: "Replace thermostat and top up coolant." },
  P0133: { code: "P0133", description: "O2 Sensor circuit slow response (Bank 1 Sensor 1)", causes: ["Aged oxygen sensor", "Exhaust leak"], severity: "Medium", action: "Replace upstream O2 sensor; check exhaust for leaks." },
  P0171: { code: "P0171", description: "System too lean (Bank 1)", causes: ["Vacuum leak", "Weak fuel pump", "Dirty MAF", "Failing O2 sensor"], severity: "Medium", action: "Smoke-test intake for leaks; check fuel pressure and MAF." },
  P0172: { code: "P0172", description: "System too rich (Bank 1)", causes: ["Leaking injector", "MAF overreporting", "Excessive fuel pressure"], severity: "Medium", action: "Inspect injectors and MAF; verify fuel pressure regulator." },
  P0217: { code: "P0217", description: "Engine coolant over-temperature", causes: ["Low coolant", "Faulty radiator fan", "Stuck thermostat"], severity: "High", action: "Stop driving. Recover coolant system before further use." },
  P0300: { code: "P0300", description: "Random / multiple cylinder misfire", causes: ["Worn spark plugs", "Failing ignition coil", "Clogged injector", "Vacuum leak"], severity: "High", action: "Diagnose per-cylinder; replace plugs/coils as needed. Do not delay — catalyst damage risk." },
  P0301: { code: "P0301", description: "Cylinder 1 misfire detected", causes: ["Bad spark plug/coil on cyl 1", "Injector fault", "Compression loss"], severity: "High", action: "Swap coil and plug from another cylinder; if misfire follows, replace." },
  P0302: { code: "P0302", description: "Cylinder 2 misfire detected", causes: ["Bad spark plug/coil on cyl 2", "Injector fault"], severity: "High", action: "Diagnose cylinder 2 ignition and fuel components." },
  P0303: { code: "P0303", description: "Cylinder 3 misfire detected", causes: ["Bad spark plug/coil on cyl 3", "Injector fault"], severity: "High", action: "Diagnose cylinder 3 ignition and fuel components." },
  P0304: { code: "P0304", description: "Cylinder 4 misfire detected", causes: ["Bad spark plug/coil on cyl 4", "Injector fault"], severity: "High", action: "Diagnose cylinder 4 ignition and fuel components." },
  P0335: { code: "P0335", description: "Crankshaft Position sensor circuit malfunction", causes: ["Failing CKP sensor", "Damaged reluctor ring", "Wiring issue"], severity: "High", action: "Vehicle may fail to start. Replace CKP sensor after wiring check." },
  P0401: { code: "P0401", description: "EGR flow insufficient", causes: ["Clogged EGR valve", "Blocked passages", "Faulty DPFE sensor"], severity: "Medium", action: "Clean EGR valve and passages; inspect vacuum lines." },
  P0420: { code: "P0420", description: "Catalyst efficiency below threshold (Bank 1)", causes: ["Aged catalytic converter", "O2 sensor drift", "Exhaust leak"], severity: "Medium", action: "Verify O2 sensors first; replace catalyst if confirmed." },
  P0442: { code: "P0442", description: "EVAP system small leak detected", causes: ["Loose fuel cap", "Cracked EVAP hose"], severity: "Low", action: "Tighten fuel cap; smoke-test EVAP system." },
  P0455: { code: "P0455", description: "EVAP system large leak detected", causes: ["Missing/loose fuel cap", "Disconnected EVAP hose"], severity: "Low", action: "Re-seat fuel cap; inspect EVAP hoses at charcoal canister." },
  P0500: { code: "P0500", description: "Vehicle Speed Sensor malfunction", causes: ["Failing VSS", "Wiring open"], severity: "Medium", action: "Test VSS and wiring; replace sensor if faulty." },
  P0562: { code: "P0562", description: "System voltage low", causes: ["Weak battery", "Failing alternator", "Loose ground"], severity: "Medium", action: "Load-test battery and alternator output." },
  P0700: { code: "P0700", description: "Transmission control system malfunction", causes: ["TCM fault", "Solenoid issue", "Low ATF"], severity: "High", action: "Read TCM sub-codes; inspect transmission fluid." },
  U0100: { code: "U0100", description: "Lost communication with ECM/PCM", causes: ["CAN bus wiring", "ECU fault", "Ground issue"], severity: "High", action: "Inspect CAN wiring and ECU connectors — do not drive." },
};

export function lookupObd(code: string): ObdInfo | null {
  const key = code.trim().toUpperCase();
  return CODES[key] ?? null;
}

export function obdKnownCodes(): string[] {
  return Object.keys(CODES);
}
