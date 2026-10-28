# Guardian Auto
### ML-Based Engine Condition Assessment for Cars Under 100 hp

## Project Overview
Guardian Auto is a machine-learning-based project designed to assess engine conditions using sensor data. It aims to support early identification of potential engine problems and promote predictive maintenance.

The project combines a web interface with a machine learning model and a Python API.

## Objectives
- Develop a web-based engine condition assessment system.
- Use machine learning to classify engine conditions based on sensor parameters.
- Provide predictions through a simple user interface.
- Explore the potential of predictive maintenance for vehicles under 100 hp.

## Technology Stack
- **Frontend:** React, TypeScript, Vite, TanStack
- **Backend API:** Python, FastAPI, Uvicorn
- **Machine Learning:** Scikit-learn, Extra Trees Classifier
- **Data Processing:** Pandas
- **Model Storage:** Joblib
- **Version Control:** Git and GitHub

## Input Parameters
The model uses six engine parameters:

1. Engine RPM
2. Lubricating oil pressure
3. Fuel pressure
4. Coolant pressure
5. Lubricating oil temperature
6. Coolant temperature

## Machine Learning Model
The project uses a trained Extra Trees classification model with median imputation for missing values. Model performance was evaluated using accuracy, balanced accuracy, precision, recall, and macro F1-score.

The tuned model achieved approximately **65.11% test accuracy** and **64.13% macro F1-score** in the recorded evaluation.

These results are experimental and do not establish suitability for real-world vehicle diagnosis.

## Running the Project Locally

### 1. Start the Web Application
Install the required Node.js dependencies using the project's package manager and start the frontend development server according to the project configuration.

### 2. Start the Machine Learning API
Open a terminal in the `ml-api` directory, activate the Python virtual environment, and run:

```bash
python -m uvicorn app:app --port 8000
```

The API should be available at:

`http://127.0.0.1:8000`

To check whether the API is running, open that address in a browser.

### 3. Make a Prediction
The frontend prediction form sends six engine parameters to the API endpoint:

`POST http://127.0.0.1:8000/predict`

The API requires the machine-learning model file to be available in the expected location.

## Repository Structure
- `src/` — Frontend application source code
- `ml-api/` — Machine learning API and trained model
- `supabase/` — Database-related configuration and migrations
- `package.json` — Frontend dependencies and scripts

## Limitations
- The model's performance is experimental and requires further improvement.
- The dataset has not been confirmed to represent only vehicles under 100 hp.
- Successful frontend-to-API integration must be verified.
- The system has not been validated as a replacement for professional vehicle diagnostics.

## Future Scope
- Improve model accuracy and reliability.
- Validate predictions using real-world vehicle data.
- Improve frontend and API integration.
- Explore additional sensor parameters and machine-learning methods.
- Investigate real-time engine monitoring.

## Team
- Abie Saju — Civil Engineering
- Shaun Sebastian Josy — Mechanical Engineering
- Pranav Prasad — Mechanical Engineering
- Muhammed Shaniz — Electrical Engineering

## Repository
https://github.com/shaun1611/guardianauto

---
**Disclaimer:** Guardian Auto is an academic project intended for experimental engine condition assessment. Its predictions should not be used as the sole basis for vehicle maintenance or safety decisions.
