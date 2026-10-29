import joblib
import pandas as pd
from pathlib import Path

folder = Path(__file__).resolve().parent
bundle = joblib.load(folder / "guardian_auto_best_model.joblib")

model = bundle["model"]
features = bundle["features"]

base = {
    "engine_rpm": 800,
    "lub_oil_pressure": 1,
    "fuel_pressure": 1,
    "coolant_pressure": 1,
    "lub_oil_temp": 120,
    "coolant_temp": 120,
}

for rpm in [500, 800, 1200, 1800, 2500, 3000, 4000]:
    readings = base.copy()
    readings["engine_rpm"] = rpm
    row = pd.DataFrame([readings], columns=features)

    prediction = model.predict(row)[0]
    probabilities = model.predict_proba(row)[0]

    print(
        f"RPM: {rpm} | Prediction: {prediction} "
        f"| Probabilities: {probabilities}"
    )