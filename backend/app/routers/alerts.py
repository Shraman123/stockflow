from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.product import Product

router = APIRouter()

@router.get("/low-stock")
def low_stock(db: Session = Depends(get_db), _=Depends(get_current_user)):
    products = db.query(Product).filter(
        Product.quantity_in_stock <= Product.low_stock_threshold,
        Product.is_active == True
    ).all()
    return [{"id": p.id, "name": p.name, "sku": p.sku,
             "quantity_in_stock": p.quantity_in_stock,
             "low_stock_threshold": p.low_stock_threshold,
             "deficit": p.low_stock_threshold - p.quantity_in_stock} for p in products]
