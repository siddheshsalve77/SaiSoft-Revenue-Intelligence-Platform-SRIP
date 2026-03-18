from fastapi import APIRouter
from data_engine.engine import EMPLOYEES, get_all_transactions, PRODUCTS

router = APIRouter(tags=["Employees"])

@router.get("/employees")
def list_employees():
    txns = get_all_transactions()
    result = []
    for emp in EMPLOYEES:
        emp_txns = [t for t in txns if t["employee_id"] == emp["id"] and t["status"] == "completed"]
        total_sales = sum(t["amount"] for t in emp_txns)
        # Top product
        prod_counts: dict = {}
        for t in emp_txns:
            prod_counts[t["product_name"]] = prod_counts.get(t["product_name"], 0) + t["amount"]
        top_product = max(prod_counts, key=prod_counts.get) if prod_counts else "—"

        result.append({
            **emp,
            "total_sales": round(total_sales, 2),
            "total_transactions": len(emp_txns),
            "top_product": top_product,
            "is_active": emp["exit_date"] is None,
        })
    return sorted(result, key=lambda e: e["total_sales"], reverse=True)
