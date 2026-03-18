from fastapi import APIRouter
from data_engine.engine import PRODUCTS, get_all_transactions

router = APIRouter(tags=["Products"])

@router.get("/products")
def list_products():
    txns = get_all_transactions()
    result = []
    for p in PRODUCTS:
        p_txns = [t for t in txns if t["product_id"] == p["id"] and t["status"] == "completed"]
        total_rev = sum(t["amount"] for t in p_txns)
        result.append({
            **p,
            "total_revenue": round(total_rev, 2),
            "total_clients": len(set(t["client_id"] for t in p_txns)),
            "total_transactions": len(p_txns),
        })
    return sorted(result, key=lambda x: x["total_revenue"], reverse=True)
