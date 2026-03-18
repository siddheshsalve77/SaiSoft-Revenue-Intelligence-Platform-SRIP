from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from routers import stats, transactions, employees, products, clients, auth, dashboard

app = FastAPI(
    title="SRIP — SaiSoft Revenue Intelligence Platform API",
    version="1.0.0",
    description="Internal analytics backend for Sai Soft Infosys",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(stats.router,        prefix="/api")
app.include_router(dashboard.router,    prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(employees.router,    prefix="/api")
app.include_router(products.router,     prefix="/api")
app.include_router(clients.router,      prefix="/api")
app.include_router(auth.router,         prefix="/api")

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SRIP API"}
