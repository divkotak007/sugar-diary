from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class InsulinType(str, Enum):
    RAPID = "rapid"
    SHORT = "short"
    INTERMEDIATE = "intermediate"
    LONG = "long"

class LogEntry(BaseModel):
    timestamp: datetime
    
class InsulinLog(LogEntry):
    units: float = Field(..., gt=0)
    type: InsulinType = InsulinType.RAPID
    duration_minutes: int = 360 # Default duration of action

class CarbLog(LogEntry):
    grams: float = Field(..., ge=0)
    absorption_time: int = 180 # Default absorption time in minutes

class GlucoseLog(LogEntry):
    value: float = Field(..., ge=20, le=600) # mg/dL

class SafetyContext(BaseModel):
    current_glucose: float
    target_glucose: float = 100.0
    isf: float # Insulin Sensitivity Factor (mg/dL / unit)
    carb_ratio: float # Carb Ratio (g / unit)
    max_iob: float = 5.0 # Max IOB safety cap
    
class SafetyCheckResult(BaseModel):
    is_safe: bool
    reason: Optional[str] = None
    allowed_bolus: float
    current_iob: float
    current_cob: float
    predicted_glucose: Optional[float] = None
