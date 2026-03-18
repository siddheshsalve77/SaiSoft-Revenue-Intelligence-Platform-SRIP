"""
SRIP — SaiSoft Revenue Intelligence Platform
Data Engine: Generates and serves 4-5 years of realistic business data
"""
import random
import math
from datetime import date, timedelta, datetime
from typing import List, Dict, Any

# ── Seed for consistent data ─────────────────────────────────
random.seed(42)

# ── Constants ────────────────────────────────────────────────
PRODUCTS = [
    {"id": "tally",      "name": "Tally",       "category": "Accounting",     "base_price": 18000},
    {"id": "tallyprime", "name": "Tally Prime",  "category": "Accounting+",    "base_price": 27000},
    {"id": "sap",        "name": "SAP",          "category": "ERP",            "base_price": 120000},
    {"id": "sap-s4",     "name": "SAP S/4HANA",  "category": "Intelligent ERP","base_price": 280000},
    {"id": "sap-fico",   "name": "SAP FICO",     "category": "Finance Module", "base_price": 95000},
]

REGIONS = ["Aurangabad MIDC", "Nanded MIDC", "Bangalore MIDC"]

REGION_WEIGHTS = {
    "Aurangabad MIDC": 0.50,
    "Nanded MIDC":     0.30,
    "Bangalore MIDC":  0.20,
}

EMPLOYEES = [
    # id, name, role, region, join_date, exit_date (None = active)
    {"id": "E01", "name": "Suresh Bhosale",    "role": "Regional Manager",  "region": "Aurangabad MIDC", "join_date": "2019-06-01", "exit_date": None},
    {"id": "E02", "name": "Priya Deshmukh",    "role": "Sales Executive",   "region": "Aurangabad MIDC", "join_date": "2020-01-15", "exit_date": None},
    {"id": "E03", "name": "Rahul Shinde",      "role": "Account Manager",   "region": "Aurangabad MIDC", "join_date": "2020-04-01", "exit_date": None},
    {"id": "E04", "name": "Anita Patil",       "role": "Support Executive", "region": "Aurangabad MIDC", "join_date": "2021-03-15", "exit_date": None},
    {"id": "E05", "name": "Vishal Kulkarni",   "role": "Sales Executive",   "region": "Aurangabad MIDC", "join_date": "2021-07-01", "exit_date": None},
    {"id": "E06", "name": "Sneha Jadhav",      "role": "Sales Executive",   "region": "Aurangabad MIDC", "join_date": "2022-02-01", "exit_date": None},
    {"id": "E07", "name": "Mahesh Gaikwad",    "role": "Account Manager",   "region": "Aurangabad MIDC", "join_date": "2019-11-01", "exit_date": "2023-08-31"},
    {"id": "E08", "name": "Kavita Munde",      "role": "Support Executive", "region": "Aurangabad MIDC", "join_date": "2022-06-01", "exit_date": None},
    {"id": "E09", "name": "Ajit Kale",         "role": "Sales Executive",   "region": "Aurangabad MIDC", "join_date": "2023-01-15", "exit_date": None},
    {"id": "E10", "name": "Deepa Wankhede",    "role": "Support Executive", "region": "Aurangabad MIDC", "join_date": "2023-09-01", "exit_date": None},
    # Nanded
    {"id": "E11", "name": "Ganesh Yadav",      "role": "Regional Manager",  "region": "Nanded MIDC",     "join_date": "2020-03-01", "exit_date": None},
    {"id": "E12", "name": "Sunita Thakur",     "role": "Sales Executive",   "region": "Nanded MIDC",     "join_date": "2020-08-01", "exit_date": None},
    {"id": "E13", "name": "Rajan Nimbalkar",   "role": "Account Manager",   "region": "Nanded MIDC",     "join_date": "2021-01-01", "exit_date": None},
    {"id": "E14", "name": "Meera Chavan",      "role": "Support Executive", "region": "Nanded MIDC",     "join_date": "2021-10-01", "exit_date": "2024-02-28"},
    {"id": "E15", "name": "Sanjay Birajdar",   "role": "Sales Executive",   "region": "Nanded MIDC",     "join_date": "2022-05-01", "exit_date": None},
    {"id": "E16", "name": "Pooja Ingale",      "role": "Sales Executive",   "region": "Nanded MIDC",     "join_date": "2023-03-01", "exit_date": None},
    # Bangalore
    {"id": "E17", "name": "Venkat Reddy",      "role": "Regional Manager",  "region": "Bangalore MIDC",  "join_date": "2020-07-01", "exit_date": None},
    {"id": "E18", "name": "Lakshmi Nair",      "role": "Account Manager",   "region": "Bangalore MIDC",  "join_date": "2021-04-01", "exit_date": None},
    {"id": "E19", "name": "Kartik Shetty",     "role": "Sales Executive",   "region": "Bangalore MIDC",  "join_date": "2021-11-01", "exit_date": None},
    {"id": "E20", "name": "Divya Murthy",      "role": "Sales Executive",   "region": "Bangalore MIDC",  "join_date": "2022-09-01", "exit_date": None},
    {"id": "E21", "name": "Anil Kumar",        "role": "Support Executive", "region": "Bangalore MIDC",  "join_date": "2023-02-01", "exit_date": None},
    {"id": "E22", "name": "Rohan Salunkhe",    "role": "Sales Executive",   "region": "Aurangabad MIDC", "join_date": "2024-01-15", "exit_date": None},
    {"id": "E23", "name": "Sapna Thorat",      "role": "Account Manager",   "region": "Nanded MIDC",     "join_date": "2024-04-01", "exit_date": None},
    {"id": "E24", "name": "Nikhil Pawar",      "role": "Sales Executive",   "region": "Bangalore MIDC",  "join_date": "2024-06-01", "exit_date": None},
]

CLIENTS_RAW = [
    ("C001", "Marathwada Traders",        "Aurangabad MIDC", "SME"),
    ("C002", "Shri Ganesh Auto Parts",    "Aurangabad MIDC", "Trader"),
    ("C003", "Jay Bhavani Textiles",      "Aurangabad MIDC", "SME"),
    ("C004", "Saraswati Steel Works",     "Aurangabad MIDC", "Manufacturing"),
    ("C005", "Parbhani Agro Exports",     "Nanded MIDC", "SME"),
    ("C006", "New India Chemicals",       "Nanded MIDC", "Manufacturing"),
    ("C007", "Laxmi Plastic Industries",  "Nanded MIDC", "SME"),
    ("C008", "Govind Enterprises",        "Nanded MIDC", "Trader"),
    ("C009", "Sahyadri Food Products",    "Nanded MIDC", "SME"),
    ("C010", "Deccan Pharma Pvt Ltd",     "Bangalore MIDC", "Manufacturing"),
    ("C011", "Karnataka Tech Solutions",  "Bangalore MIDC", "SME"),
    ("C012", "Mysore Auto Components",    "Bangalore MIDC", "Manufacturing"),
    ("C013", "Sunrise Exports Ltd",       "Bangalore MIDC", "Trader"),
    ("C014", "Vidarbha Cement Corp",      "Aurangabad MIDC", "Manufacturing"),
    ("C015", "Amol Engineers",            "Aurangabad MIDC", "SME"),
    ("C016", "Swadeshi Hardware Hub",     "Nanded MIDC", "Trader"),
    ("C017", "Bharat Fabrication Works",  "Aurangabad MIDC", "Manufacturing"),
    ("C018", "Eklavya Logistics",         "Nanded MIDC", "Service"),
    ("C019", "Tulja Industrial Supplies", "Aurangabad MIDC", "Trader"),
    ("C020", "BangaTech Manufacturing",   "Bangalore MIDC", "Manufacturing"),
    ("C021", "Akashdeep Services",        "Aurangabad MIDC", "Service"),
    ("C022", "Nandadeep Platers",         "Nanded MIDC", "SME"),
    ("C023", "Modern Rubber Products",    "Bangalore MIDC", "SME"),
    ("C024", "Krushna Cotton Mills",      "Aurangabad MIDC", "Manufacturing"),
    ("C025", "Vighnaharta Auto Garage",   "Nanded MIDC", "Service"),
    ("C026", "Pioneer Packaging",         "Bangalore MIDC", "SME"),
    ("C027", "Shivshakti Cold Storage",   "Aurangabad MIDC", "Service"),
    ("C028", "Samruddhi Pulses Mill",     "Nanded MIDC", "Manufacturing"),
    ("C029", "RK Furniture Works",        "Bangalore MIDC", "Trader"),
    ("C030", "Solapur Road Auto Parts",   "Aurangabad MIDC", "Trader"),
]

CLIENTS = [
    {"id": c[0], "name": c[1], "region": c[2], "segment": c[3], "since": None}
    for c in CLIENTS_RAW
]

# ── Transaction Generation ───────────────────────────────────
def _growth_multiplier(year: int) -> float:
    """Simulate realistic year-on-year growth with slight variance."""
    base = {2020: 1.0, 2021: 1.08, 2022: 1.18, 2023: 1.31, 2024: 1.45, 2025: 1.60, 2026: 1.72}
    return base.get(year, 1.0)

def _product_weight(product_id: str, year: int) -> float:
    """SAP products grow in prominence over the years."""
    sap_bias = 1.0 + (year - 2020) * 0.08
    weights = {
        "tally":      1.2,
        "tallyprime": 1.0,
        "sap":        0.7 * sap_bias,
        "sap-s4":     0.3 * sap_bias,
        "sap-fico":   0.4 * sap_bias,
    }
    return weights.get(product_id, 1.0)

def generate_transactions() -> List[Dict]:
    txns = []
    txn_id = 1
    start = date(2020, 1, 1)
    end = date(2026, 3, 18)  # today

    current = start
    while current <= end:
        # Average 1-3 transactions per working day
        if current.weekday() < 6:  # Mon-Sat
            year = current.year
            growth = _growth_multiplier(year)
            n_txns = random.choices([0, 1, 2, 3], weights=[0.3, 0.4, 0.2, 0.1])[0]

            for _ in range(n_txns):
                product = random.choices(
                    PRODUCTS,
                    weights=[_product_weight(p["id"], year) for p in PRODUCTS]
                )[0]

                # Price with variance
                price_variance = random.uniform(0.92, 1.12)
                amount = round(product["base_price"] * growth * price_variance, 2)

                # Determine employee active on this date
                active_emps = [
                    e for e in EMPLOYEES
                    if date.fromisoformat(e["join_date"]) <= current
                    and (e["exit_date"] is None or date.fromisoformat(e["exit_date"]) >= current)
                ]
                if not active_emps:
                    continue
                emp = random.choice(active_emps)

                # Choose client from employee's region
                region_clients = [c for c in CLIENTS if c["region"] == emp["region"]]
                if not region_clients:
                    region_clients = CLIENTS
                client = random.choice(region_clients)

                txns.append({
                    "id": f"TXN{txn_id:05d}",
                    "date": current.isoformat(),
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "client_id": client["id"],
                    "client_name": client["name"],
                    "region": emp["region"],
                    "employee_id": emp["id"],
                    "employee_name": emp["name"],
                    "amount": amount,
                    "status": random.choices(["completed", "completed", "completed", "pending", "cancelled"],
                                             weights=[0.82, 0.82, 0.82, 0.12, 0.06])[0],
                })
                txn_id += 1

        current += timedelta(days=1)

    return txns

# ── Singleton data store ─────────────────────────────────────
_cache: Dict[str, Any] = {}

def get_all_transactions() -> List[Dict]:
    if "transactions" not in _cache:
        _cache["transactions"] = generate_transactions()
    return _cache["transactions"]

def compute_stats() -> Dict:
    txns = [t for t in get_all_transactions() if t["status"] == "completed"]
    total_rev = sum(t["amount"] for t in txns)
    unique_clients = len(set(t["client_id"] for t in txns))

    return {
        "total_revenue": round(total_rev, 2),
        "total_revenue_cr": round(total_rev / 1_00_00_000, 2),  # in Crores (Indian)
        "total_clients": unique_clients,
        "total_products": len(PRODUCTS),
        "total_regions": len(REGIONS),
        "total_transactions": len(txns),
        "generated_at": datetime.now().isoformat(),
    }
