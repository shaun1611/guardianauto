from pathlib import Path
import joblib
import pandas as pd

folder = Path(__file__).resolve().parent
bundle = joblib.load(folder / "guardian_auto_best_model.joblib")

model = bundle["model"]
features = bundle["features"]

print("Features:", features)
print("Model classes:", model.classes_)

tests = [
    [800, 1, 1, 1, 120, 120],
    [3000, 0.5, 1, 0.5, 120, 120],
]

for values in tests:
    row = pd.DataFrame([dict(zip(features, values))], columns=features)
    print("\nInput:", row.to_dict(orient="records")[0])
    print("Prediction:", model.predict(row)[0])
    if hasattr(model, "predict_proba"):
        print("Probabilities:", model.predict_proba(row)[0])
