
import math
from typing import List
from datetime import datetime, timedelta
from app.models.safety import InsulinLog, CarbLog, SafetyCheckResult, SafetyContext

class SafetyEngine:
    """
    Safety Engine implementing oref0-style algorithms for IOB/COB calculation
    and dose validation.
    """
    
    @staticmethod
    def calculate_iob(
        insulin_logs: List[InsulinLog], 
        current_time: datetime = None
    ) -> float:
        """
        Calculates Insulin On Board (IOB) using exponential decay curves.
        Based on standard open source artificial pancreas algorithms.
        """
        if current_time is None:
            current_time = datetime.now()
            
        total_iob = 0.0
        
        for log in insulin_logs:
            # Only count rapid acting insulin
            if log.type not in ["rapid", "short"]:
                continue
                
            time_elapsed = (current_time - log.timestamp).total_seconds() / 60.0 # minutes
            dia = log.duration_minutes # Duration of Insulin Action
            
            # If dose is older than DIA or in future, skip
            if time_elapsed < 0 or time_elapsed >= dia:
                continue
                
            # Insulin activity curve (exponential decay)
            # This is a simplified version of the Walsh model often used in oref0
            # Activity = 1 - (t/DIA) ... simplified linear for v1, will upgrade
            
            # Better model: Bilinear peak
            # For Phase 1, we implement a linear decay from peak (standard bolus wizard logic)
            # Peak is approx 75 mins usually.
            
            # Valid Simple Algo: Linear depletion
            # iob = dose * (1 - (time_elapsed / dia))
            
            iob_contribution = log.units * (1.0 - (time_elapsed / float(dia)))
            if iob_contribution > 0:
                total_iob += iob_contribution
                
        return round(total_iob, 2)

    @staticmethod
    def calculate_cob(
        carb_logs: List[CarbLog],
        current_time: datetime = None
    ) -> float:
        """
        Calculates Carbs On Board (COB) assuming linear absorption.
        """
        if current_time is None:
            current_time = datetime.now()
            
        total_cob = 0.0
        
        for log in carb_logs:
            time_elapsed = (current_time - log.timestamp).total_seconds() / 60.0
            absorption_time = log.absorption_time
            
            if time_elapsed < 0 or time_elapsed >= absorption_time:
                continue
                
            # Linear absorption
            cob_contribution = log.grams * (1.0 - (time_elapsed / float(absorption_time)))
            if cob_contribution > 0:
                total_cob += cob_contribution
                
        return round(total_cob, 2)
        
    @staticmethod
    def check_safety(
        context: SafetyContext,
        proposed_bolus: float,
        insulin_history: List[InsulinLog],
        carb_history: List[CarbLog]
    ) -> SafetyCheckResult:
        """
        Runs safety gates to validate a proposed dose.
        """
        current_iob = SafetyEngine.calculate_iob(insulin_history)
        current_cob = SafetyEngine.calculate_cob(carb_history)
        
        # 1. Max IOB Check
        expected_iob = current_iob + proposed_bolus
        if expected_iob > context.max_iob:
            return SafetyCheckResult(
                is_safe=False,
                reason=f"Max IOB exceeded. Current: {current_iob}u + Dose: {proposed_bolus}u > Limit: {context.max_iob}u",
                allowed_bolus=max(0, context.max_iob - current_iob),
                current_iob=current_iob,
                current_cob=current_cob
            )
            
        # 2. Predicted Low Check (Simple)
        # Predicted Glucose = Current - (IOB * ISF) + (COB / CarbRatio * ISF)
        # This is a basic projection. GluFormer will provide the complex prediction later.
        
        insulin_impact = (current_iob + proposed_bolus) * context.isf
        carb_impact = (current_cob / context.carb_ratio) * context.isf if context.carb_ratio > 0 else 0
        
        predicted_bg = context.current_glucose - insulin_impact + carb_impact
        
        # Safety floor: 70 mg/dL
        if predicted_bg < 70:
            # Calculate what dose would keep us above 70
            # 70 = Current - (SafeIOB * ISF) + CarbImpact
            # SafeIOB = (Current + CarbImpact - 70) / ISF
            
            safe_iob = (context.current_glucose + carb_impact - 70) / context.isf
            available_bolus_room = max(0, safe_iob - current_iob)
            
            return SafetyCheckResult(
                is_safe=False,
                reason=f"Predicted low glucose ({int(predicted_bg)} mg/dL). Reduce dose.",
                allowed_bolus=round(available_bolus_room, 1),
                current_iob=current_iob,
                current_cob=current_cob,
                predicted_glucose=predicted_bg
            )
            
        return SafetyCheckResult(
            is_safe=True,
            allowed_bolus=proposed_bolus,
            current_iob=current_iob,
            current_cob=current_cob,
            predicted_glucose=predicted_bg
        )
