from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.product import Product
from app.models.customer_order import CustomerOrder
from app.models.stock import StockMovement
from app.models.supplier import Supplier
from app.models.category import Category
from app.models.customer import Customer

router = APIRouter()

@router.get("/stats")
def stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return {
        "total_products": db.query(Product).filter(Product.is_active == True).count(),
        "total_customers": db.query(Customer).filter(Customer.is_active == True).count(),
        "total_suppliers": db.query(Supplier).filter(Supplier.is_active == True).count(),
        "total_categories": db.query(Category).count(),
        "pending_orders": db.query(CustomerOrder).filter(CustomerOrder.status == "pending").count(),
        "low_stock_count": db.query(Product).filter(Product.quantity_in_stock <= Product.low_stock_threshold, Product.is_active == True).count(),
        "total_stock_value": round(db.query(func.sum(Product.quantity_in_stock * Product.cost_price)).scalar() or 0, 2),
        "total_revenue": round(db.query(func.sum(CustomerOrder.total_amount)).filter(CustomerOrder.status != "cancelled").scalar() or 0, 2),
        "stock_by_category": [{"category": r[0], "stock": r[1]} for r in
            db.query(Category.name, func.sum(Product.quantity_in_stock)).join(Product, Product.category_id == Category.id).group_by(Category.name).all()],
        "orders_by_status": [{"status": r[0], "count": r[1]} for r in
            db.query(CustomerOrder.status, func.count(CustomerOrder.id)).group_by(CustomerOrder.status).all()],
        "recent_movements": [{"id": m.id, "product_id": m.product_id, "movement_type": m.movement_type,
            "quantity": m.quantity, "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in db.query(StockMovement).order_by(StockMovement.created_at.desc()).limit(10).all()],
    }
