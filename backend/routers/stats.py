from fastapi import APIRouter
from data_engine.engine import compute_stats

router = APIRouter(tags=["Stats"])

@router.get("/stats")
def get_stats():
    return compute_stats()
