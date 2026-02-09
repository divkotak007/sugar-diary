from fastapi import APIRouter
from app.api.api_v1.endpoints import safety, prediction

api_router = APIRouter()
api_router.include_router(safety.router, prefix="/safety", tags=["safety"])
api_router.include_router(prediction.router, prefix="/predict", tags=["prediction"])
