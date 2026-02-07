from fastapi import APIRouter, HTTPException
from app.models.prediction import PredictionRequest, PredictionResult
from app.ml.gluformer import GluFormerEngine
import time

router = APIRouter()
model_engine = GluFormerEngine()

@router.post("/glucose", response_model=PredictionResult)
def predict_glucose(request: PredictionRequest):
    """
    Predicts blood glucose using GluFormer model.
    """
    try:
        start_time = time.time()
        
        predicted_val, confidence = model_engine.predict(
            glucose=request.glucose_history,
            insulin=request.insulin_history,
            carbs=request.carb_history,
            horizon=request.horizon
        )
        
        end_time = time.time()
        
        return PredictionResult(
            predicted_glucose=predicted_val,
            confidence_interval=confidence,
            horizon_minutes=request.horizon,
            processing_time_ms=(end_time - start_time) * 1000,
            model_version="GluFormer-v1"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
