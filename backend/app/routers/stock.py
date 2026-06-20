from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.stock import StockMovement
from app.models.product import Product

router = APIRouter()

class MovementIn(BaseModel):
    product_id: int; movement_type: str; quantity: int
    reference: Optional[str] = None; notes: Optional[str] = None

class MovementOut(BaseModel):
    id: int; product_id: int; movement_type: str; quantity: int
    quantity_before: int; quantity_after: int; reference: Optional[str]
    notes: Optional[str]; created_at: datetime
    class Config: from_attributes = True

VALID = {"purchase","sale","adjustment","return_in","return_out"}

@router.get("/", response_model=List[MovementOut])
def list_all(product_id: Optional[int] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(StockMovement)
    if product_id: q = q.filter(StockMovement.product_id == product_id)
    return q.order_by(StockMovement.created_at.desc()).limit(100).all()

@router.post("/", response_model=MovementOut, status_code=201)
def create(data: MovementIn, db: Session = Depends(get_db), current=Depends(get_current_user)):
    if data.movement_type not in VALID: raise HTTPException(400, f"Type must be one of {VALID}")
    p = db.query(Product).filter(Product.id == data.product_id).first()
    if not p: raise HTTPException(404, "Product not found")
    before = p.quantity_in_stock
    after = before + data.quantity
    if after < 0: raise HTTPException(400, f"Insufficient stock. Current: {before}")
    p.quantity_in_stock = after
    m = StockMovement(product_id=p.id, movement_type=data.movement_type, quantity=data.quantity,
                      quantity_before=before, quantity_after=after, reference=data.reference,
                      notes=data.notes, created_by=current.id)
    db.add(m); db.commit(); db.refresh(m); return m
