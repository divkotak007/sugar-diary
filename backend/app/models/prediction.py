from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PredictionRequest(BaseModel):
    glucose_history: List[float] = Field(..., description="Last 24-48 hours of glucose readings")
    insulin_history: List[float] = Field(..., description="Corresponding insulin doses")
    carb_history: List[float] = Field(..., description="Corresponding carb entries")
    time_minutes: List[int] = Field(..., description="Relative time in minutes for each point")
    horizon: int = Field(30, description="Prediction horizon in minutes (30, 60, 120)")

class PredictionResult(BaseModel):
    predicted_glucose: float
    confidence_interval: List[float] # [low, high]
    horizon_minutes: int
    processing_time_ms: float
    model_version: str
