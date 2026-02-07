from fastapi import APIRouter, HTTPException
from app.models.safety import SafetyContext, InsulinLog, CarbLog, SafetyCheckResult
from app.ml.safety import SafetyEngine
from typing import List

router = APIRouter()

@router.post("/validate", response_model=SafetyCheckResult)
def validate_dose(
    context: SafetyContext,
    proposed_bolus: float,
    insulin_history: List[InsulinLog],
    carb_history: List[CarbLog]
):
    """
    Validates a proposed insulin dose against safety rules.
    Checks Max IOB and Predicted Lows.
    """
    try:
        result = SafetyEngine.check_safety(
            context=context,
            proposed_bolus=proposed_bolus,
            insulin_history=insulin_history,
            carb_history=carb_history
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/iob", response_model=float)
def calculate_iob(insulin_history: List[InsulinLog]):
    """
    Calculates current Insulin On Board (IOB).
    """
    return SafetyEngine.calculate_iob(insulin_history)
