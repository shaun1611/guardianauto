from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load the trained Guardian Auto model
BASE_DIR = Path(__file__).resolve().parent
bundle = joblib.load(BASE_DIR / "guardian_auto_best_model.joblib")

model = bundle["model"]
features = bundle["features"]

app = FastAPI(title="Guardian Auto ML API")

# Allow the local frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://localhost:8080",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EngineReadings(BaseModel):
    engine_rpm: float
    lub_oil_pressure: float
    fuel_pressure: float
    coolant_pressure: float
    lub_oil_temp: float
    coolant_temp: float


@app.get("/")
def home():
    return {"status": "Guardian Auto ML API is running"}




@app.post("/predict")
def predict(data: EngineReadings):
    readings = data.model_dump()
    row = pd.DataFrame([readings], columns=features)
    prediction = int(model.predict(row)[0])

    labels = {
        0: "Normal",
        1: "Maintenance Required",
    }
    label = labels.get(prediction, "Unknown")

    return {
        "predicted_class": prediction,
        "condition_label": label,
        "note": (
            "Experimental prediction only. "
            "This model is not a substitute for vehicle diagnostics."
        ),
    }
