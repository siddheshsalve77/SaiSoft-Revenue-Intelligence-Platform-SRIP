"""
SRIP — Dashboard Summary Router
Provides all data needed for the main dashboard in one call.
"""
from datetime import date, timedelta
from fastapi import APIRouter, Query
from typing import Optional
from data_engine.engine import get_all_transactions, PRODUCTS, REGIONS, EMPLOYEES

router = APIRouter(tags=["Dashboard"])

def _filter_txns(txns, region=None, product_id=None, period=None):
    """Apply common filters to transactions."""
    today = date.today()

    if region:
        txns = [t for t in txns if t["region"] == region]
    if product_id:
        txns = [t for t in txns if t["product_id"] == product_id]

    if period == "today":
        txns = [t for t in txns if t["date"] == today.isoformat()]
    elif period == "week":
        start = (today - timedelta(days=today.weekday())).isoformat()
        txns = [t for t in txns if t["date"] >= start]
    elif period == "month":
        start = today.replace(day=1).isoformat()
        txns = [t for t in txns if t["date"] >= start]
    elif period == "quarter":
        q_start_month = ((today.month - 1) // 3) * 3 + 1
        start = today.replace(month=q_start_month, day=1).isoformat()
        txns = [t for t in txns if t["date"] >= start]
    elif period == "year":
        start = today.replace(month=1, day=1).isoformat()
        txns = [t for t in txns if t["date"] >= start]

    return txns


@router.get("/dashboard-summary")
def dashboard_summary(
    period: str = Query("month", enum=["today", "week", "month", "quarter", "year", "all"]),
    region: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
):
    all_txns = get_all_transactions()
    today = date.today()
    yesterday = (today - timedelta(days=1)).isoformat()
    today_str = today.isoformat()

    # Current period transactions (completed only for revenue)
    period_txns = _filter_txns(all_txns, region, product_id, period if period != "all" else None)
    completed = [t for t in period_txns if t["status"] == "completed"]

    # Previous period for comparison
    def get_prev_period_rev(p):
        all_c = [t for t in all_txns if t["status"] == "completed"]
        if p == "month":
            prev_month = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
            end_prev = today.replace(day=1).isoformat()
            start_prev = prev_month.isoformat()
            prev = [t for t in all_c if start_prev <= t["date"] < end_prev]
        elif p == "year":
            prev_year = str(today.year - 1)
            prev = [t for t in all_c if t["date"].startswith(prev_year)]
        elif p == "week":
            prev_start = (today - timedelta(days=today.weekday() + 7)).isoformat()
            prev_end  = (today - timedelta(days=today.weekday())).isoformat()
            prev = [t for t in all_c if prev_start <= t["date"] < prev_end]
        elif p == "quarter":
            q_sm = ((today.month - 1) // 3) * 3 + 1
            prev_q_end = today.replace(month=q_sm, day=1)
            prev_q_start_month = ((q_sm - 4) % 12) + 1
            prev_q_year = today.year if q_sm > 3 else today.year - 1
            from datetime import datetime as dt
            prev_q_start = dt(prev_q_year, prev_q_start_month, 1).date().isoformat()
            prev = [t for t in all_c if prev_q_start <= t["date"] < prev_q_end.isoformat()]
        else:
            return None
        return sum(t["amount"] for t in prev)

    curr_rev  = sum(t["amount"] for t in completed)
    prev_rev  = get_prev_period_rev(period)
    rev_change_pct = round(((curr_rev - prev_rev) / prev_rev * 100), 1) if prev_rev else None

    # Active clients (had a transaction in period)
    active_clients = len(set(t["client_id"] for t in completed))

    # Active employees (completed txn in period)
    active_emps = len(set(t["employee_id"] for t in completed))

    # Transactions count & change
    total_txns = len(completed)
    prev_txns_count = len([t for t in _filter_txns(
        [x for x in all_txns if x["status"] == "completed"],
        region, product_id, "year" if period == "year" else "month" if period == "month" else None
    )])

    # Today's activity
    today_txns  = [t for t in all_txns if t["date"] == today_str]
    yest_txns   = [t for t in all_txns if t["date"] == yesterday]
    today_rev   = sum(t["amount"] for t in today_txns if t["status"] == "completed")
    yest_rev    = sum(t["amount"] for t in yest_txns  if t["status"] == "completed")
    today_change = round(today_rev - yest_rev, 2)

    # Revenue trend (monthly for selected period scope)
    trend_txns = [t for t in all_txns if t["status"] == "completed"]
    if region:      trend_txns = [t for t in trend_txns if t["region"] == region]
    if product_id:  trend_txns = [t for t in trend_txns if t["product_id"] == product_id]

    if period in ("today", "week", "month"):
        # Show daily for last 30 days
        start_30 = (today - timedelta(days=29)).isoformat()
        trend_scope = [t for t in trend_txns if t["date"] >= start_30]
        trend_group = "day"
        def trend_key(d): return d
    elif period == "quarter":
        start_q = today.replace(month=((today.month-1)//3)*3+1, day=1).isoformat()
        trend_scope = [t for t in trend_txns if t["date"] >= start_q]
        trend_group = "week"
        def trend_key(d):
            from datetime import datetime as dt
            w = dt.fromisoformat(d).isocalendar()
            return f"{w[0]}-W{w[1]:02d}"
    else:
        trend_scope = trend_txns
        trend_group = "month"
        def trend_key(d): return d[:7]

    trend_buckets: dict = {}
    for t in trend_scope:
        k = trend_key(t["date"])
        trend_buckets[k] = trend_buckets.get(k, 0) + t["amount"]
    trend = [{"period": k, "revenue": round(v, 2)} for k, v in sorted(trend_buckets.items())]

    # Region comparison (for selected filters)
    region_data = []
    for r in REGIONS:
        r_txns = [t for t in all_txns if t["region"] == r and t["status"] == "completed"]
        if product_id: r_txns = [t for t in r_txns if t["product_id"] == product_id]
        if period and period != "all":
            r_txns = _filter_txns(r_txns, period=period)
        region_data.append({
            "region": r.replace(" MIDC", ""),
            "full_region": r,
            "revenue": round(sum(t["amount"] for t in r_txns), 2),
            "transactions": len(r_txns),
            "clients": len(set(t["client_id"] for t in r_txns)),
        })

    # Product distribution
    prod_data = []
    for p in PRODUCTS:
        p_txns = [t for t in completed if t["product_id"] == p["id"]]
        rev = sum(t["amount"] for t in p_txns)
        prod_data.append({
            "product_id": p["id"],
            "product_name": p["name"],
            "revenue": round(rev, 2),
            "count": len(p_txns),
            "color": {
                "tally": "#0EA66A",
                "tallyprime": "#14B87A",
                "sap": "#5A5FCF",
                "sap-s4": "#7477D4",
                "sap-fico": "#1DB8D3",
            }.get(p["id"], "#888"),
        })
    prod_data = sorted(prod_data, key=lambda x: x["revenue"], reverse=True)

    # Recent activity (last 15 completed)
    recent = sorted([t for t in all_txns if t["status"] == "completed"], key=lambda t: t["date"], reverse=True)[:15]

    # CEO highlights
    top_region   = max(region_data, key=lambda r: r["revenue"])
    top_product  = prod_data[0] if prod_data else {}
    active_emp_count = sum(1 for e in EMPLOYEES if e["exit_date"] is None)

    ceo_insights = [
        f"{top_region['full_region']} is leading revenue this {'month' if period == 'month' else 'period'}",
        f"{top_product.get('product_name', '—')} is the top-selling product",
        f"{active_emp_count} employees currently active across all regions",
        f"₹{round(curr_rev/1e7, 2)}Cr revenue tracked in selected period",
    ]

    return {
        "kpis": {
            "total_revenue": round(curr_rev, 2),
            "total_revenue_cr": round(curr_rev / 1e7, 2),
            "revenue_change_pct": rev_change_pct,
            "total_transactions": total_txns,
            "active_clients": active_clients,
            "active_employees": active_emp_count,
        },
        "today": {
            "transactions": len(today_txns),
            "revenue": round(today_rev, 2),
            "revenue_change_vs_yesterday": today_change,
            "recent_deals": today_txns[-5:] if today_txns else [],
        },
        "trend": trend,
        "regions": region_data,
        "products": prod_data,
        "recent_activity": recent,
        "ceo_insights": ceo_insights,
        "filters_applied": {
            "period": period,
            "region": region,
            "product_id": product_id,
        }
    }
