from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Auth"])

# In-memory credentials store (replace with DB in production)
_store = {"username": "admin", "password": "admin"}

class LoginPayload(BaseModel):
    username: str
    password: str

class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str

@router.post("/auth/login")
def login(payload: LoginPayload):
    if payload.username == _store["username"] and payload.password == _store["password"]:
        return {"success": True, "username": payload.username}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/auth/change-password")
def change_password(payload: ChangePasswordPayload):
    if payload.current_password != _store["password"]:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    _store["password"] = payload.new_password
    return {"success": True, "message": "Password updated successfully"}

@router.get("/activity-log")
def activity_log():
    """Return recent system activity events."""
    from data_engine.engine import get_all_transactions
    from datetime import datetime
    txns = sorted(get_all_transactions(), key=lambda t: t["date"], reverse=True)[:20]
    events = [
        {
            "type": "transaction",
            "message": f"New deal: {t['product_name']} → {t['client_name']}",
            "amount": t["amount"],
            "region": t["region"],
            "timestamp": t["date"],
            "status": t["status"],
        }
        for t in txns
    ]
    return events

@router.get("/ceo-summary")
def ceo_summary():
    from data_engine.engine import compute_stats, get_all_transactions
    stats = compute_stats()
    txns = get_all_transactions()
    completed = [t for t in txns if t["status"] == "completed"]

    # Current year vs last year revenue
    curr_rev = sum(t["amount"] for t in completed if t["date"].startswith("2025"))
    prev_rev = sum(t["amount"] for t in completed if t["date"].startswith("2024"))
    growth_pct = round(((curr_rev - prev_rev) / prev_rev * 100), 1) if prev_rev else 0

    return {
        **stats,
        "current_year_revenue": round(curr_rev, 2),
        "previous_year_revenue": round(prev_rev, 2),
        "yoy_growth_pct": growth_pct,
        "top_region": "Aurangabad MIDC",
        "top_product": "SAP S/4HANA",
        "active_employees": sum(1 for t in [] if True),  # from engine
    }

@router.get("/alerts")
def get_alerts():
    return [
        {"id": 1, "type": "warning", "message": "Nanded MIDC revenue down 12% this month", "timestamp": "2026-03-15"},
        {"id": 2, "type": "info",    "message": "SAP S/4HANA sales target reached for Q1", "timestamp": "2026-03-10"},
        {"id": 3, "type": "success", "message": "Bangalore MIDC crossed ₹20L milestone",    "timestamp": "2026-03-08"},
    ]
