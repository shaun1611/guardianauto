
from pathlib import Path
import joblib

model_path = Path(__file__).parent / "guardian_auto_best_model.joblib"
bundle = joblib.load(model_path)

print("=== SAVED MODEL INFORMATION ===")
print("Bundle keys:", list(bundle.keys()))
print("Target:", bundle.get("target"))
print("Saved classes:", bundle.get("classes"))
print("Feature names:", bundle.get("features"))

model = bundle["model"]
print("\nModel classes:", getattr(model, "classes_", "Not available"))

if hasattr(model, "named_steps"):
    for name, step in model.named_steps.items():
        print(f"\nPipeline step: {name}")
        print("Step type:", type(step).__name__)
        if hasattr(step, "classes_"):
            print("Step classes:", step.classes_)
