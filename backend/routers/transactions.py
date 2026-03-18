from fastapi import APIRouter, Query
from typing import Optional
from data_engine.engine import get_all_transactions

router = APIRouter(tags=["Transactions"])

@router.get("/transactions")
def list_transactions(
    region: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    txns = get_all_transactions()

    if region:      txns = [t for t in txns if t["region"] == region]
    if product_id:  txns = [t for t in txns if t["product_id"] == product_id]
    if employee_id: txns = [t for t in txns if t["employee_id"] == employee_id]
    if status:      txns = [t for t in txns if t["status"] == status]
    if year:        txns = [t for t in txns if t["date"].startswith(str(year))]
    if month and year:
        m = str(month).zfill(2)
        txns = [t for t in txns if t["date"].startswith(f"{year}-{m}")]

    # Sort newest first
    txns = sorted(txns, key=lambda t: t["date"], reverse=True)

    total = len(txns)
    start = (page - 1) * page_size
    txns_page = txns[start : start + page_size]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": txns_page,
    }

@router.get("/revenue-trend")
def revenue_trend(groupby: str = Query("month", enum=["month", "year", "quarter"])):
    txns = [t for t in get_all_transactions() if t["status"] == "completed"]
    buckets: dict = {}

    for t in txns:
        d = t["date"]
        if groupby == "year":
            key = d[:4]
        elif groupby == "quarter":
            y, m = int(d[:4]), int(d[5:7])
            q = (m - 1) // 3 + 1
            key = f"{y} Q{q}"
        else:
            key = d[:7]

        buckets[key] = buckets.get(key, 0) + t["amount"]

    sorted_keys = sorted(buckets.keys())
    return [{"period": k, "revenue": round(buckets[k], 2)} for k in sorted_keys]

@router.get("/region-comparison")
def region_comparison():
    txns = [t for t in get_all_transactions() if t["status"] == "completed"]
    from data_engine.engine import REGIONS
    result = []
    for region in REGIONS:
        rev = sum(t["amount"] for t in txns if t["region"] == region)
        count = len([t for t in txns if t["region"] == region])
        result.append({"region": region, "revenue": round(rev, 2), "transactions": count})
    return result

@router.get("/product-distribution")
def product_distribution():
    txns = [t for t in get_all_transactions() if t["status"] == "completed"]
    from data_engine.engine import PRODUCTS
    result = []
    for p in PRODUCTS:
        rev = sum(t["amount"] for t in txns if t["product_id"] == p["id"])
        count = len([t for t in txns if t["product_id"] == p["id"]])
        result.append({"product_id": p["id"], "product_name": p["name"], "revenue": round(rev, 2), "count": count})
    return sorted(result, key=lambda x: x["revenue"], reverse=True)
