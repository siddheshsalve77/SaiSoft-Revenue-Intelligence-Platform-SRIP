from fastapi import APIRouter
from data_engine.engine import CLIENTS, get_all_transactions

router = APIRouter(tags=["Clients"])

@router.get("/clients")
def list_clients():
    txns = get_all_transactions()
    result = []
    for c in CLIENTS:
        c_txns = [t for t in txns if t["client_id"] == c["id"] and t["status"] == "completed"]
        total_rev = sum(t["amount"] for t in c_txns)
        products_bought = list(set(t["product_name"] for t in c_txns))
        first_deal = min((t["date"] for t in c_txns), default=None)
        last_deal  = max((t["date"] for t in c_txns), default=None)

        # Segment by revenue
        if total_rev >= 5_00_000:
            value_tier = "high-value"
        elif total_rev >= 1_00_000:
            value_tier = "frequent"
        else:
            value_tier = "standard"

        result.append({
            **c,
            "total_revenue": round(total_rev, 2),
            "total_transactions": len(c_txns),
            "products_bought": products_bought,
            "first_deal": first_deal,
            "last_deal": last_deal,
            "value_tier": value_tier,
        })
    return sorted(result, key=lambda x: x["total_revenue"], reverse=True)
