from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import auth, users, categories, suppliers, customers, products, orders, stock, alerts, dashboard
import app.models.user, app.models.category, app.models.supplier, app.models.customer
import app.models.product, app.models.stock, app.models.customer_order

Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockFlow — Inventory & Order Management", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router,        prefix="/api/auth",       tags=["Auth"])
app.include_router(users.router,       prefix="/api/users",      tags=["Users"])
app.include_router(categories.router,  prefix="/api/categories", tags=["Categories"])
app.include_router(suppliers.router,   prefix="/api/suppliers",  tags=["Suppliers"])
app.include_router(customers.router,   prefix="/api/customers",  tags=["Customers"])
app.include_router(products.router,    prefix="/api/products",   tags=["Products"])
app.include_router(orders.router,      prefix="/api/orders",     tags=["Orders"])
app.include_router(stock.router,       prefix="/api/stock",      tags=["Stock"])
app.include_router(alerts.router,      prefix="/api/alerts",     tags=["Alerts"])
app.include_router(dashboard.router,   prefix="/api/dashboard",  tags=["Dashboard"])

@app.get("/")
def root(): return {"message": "StockFlow API", "docs": "/docs"}

@app.get("/health")
def health(): return {"status": "ok"}
