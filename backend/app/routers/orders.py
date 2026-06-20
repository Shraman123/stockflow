from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import random, string
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.customer_order import CustomerOrder, CustomerOrderItem
from app.models.customer import Customer
from app.models.product import Product
from app.models.stock import StockMovement

router = APIRouter()

class ItemIn(BaseModel):
    product_id: int
    quantity: int

class OrderIn(BaseModel):
    customer_id: int
    notes: Optional[str] = None
    items: List[ItemIn]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class ItemOut(BaseModel):
    id: int; product_id: int; quantity: int; unit_price: float; total_price: float
    class Config: from_attributes = True

class OrderOut(BaseModel):
    id: int; order_number: str; customer_id: int; status: str
    total_amount: float; notes: Optional[str]; created_at: datetime; items: List[ItemOut] = []
    class Config: from_attributes = True

def gen(): return f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{''.join(random.choices(string.ascii_uppercase+string.digits,k=5))}"

def load(db, oid):
    return db.query(CustomerOrder).options(joinedload(CustomerOrder.items)).filter(CustomerOrder.id == oid).first()

@router.get("/", response_model=List[OrderOut])
def list_all(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(CustomerOrder).options(joinedload(CustomerOrder.items)).order_by(CustomerOrder.created_at.desc()).all()

@router.post("/", response_model=OrderOut, status_code=201)
def create(data: OrderIn, db: Session = Depends(get_db), current=Depends(get_current_user)):
    if not db.query(Customer).filter(Customer.id == data.customer_id).first():
        raise HTTPException(404, "Customer not found")
    total = 0.0
    validated = []
    for item in data.items:
        p = db.query(Product).filter(Product.id == item.product_id).first()
        if not p: raise HTTPException(404, f"Product {item.product_id} not found")
        if p.quantity_in_stock < item.quantity:
            raise HTTPException(400, f"Insufficient stock for '{p.name}'. Available: {p.quantity_in_stock}, requested: {item.quantity}")
        tp = item.quantity * p.unit_price
        total += tp
        validated.append((p, item.quantity, p.unit_price, tp))

    order_items = []
    for p, qty, price, tp in validated:
        before = p.quantity_in_stock
        p.quantity_in_stock -= qty
        db.add(StockMovement(product_id=p.id, movement_type="sale", quantity=-qty,
                             quantity_before=before, quantity_after=p.quantity_in_stock, created_by=current.id))
        order_items.append(CustomerOrderItem(product_id=p.id, quantity=qty, unit_price=price, total_price=tp))

    order = CustomerOrder(order_number=gen(), customer_id=data.customer_id,
                          notes=data.notes, total_amount=total, created_by=current.id, items=order_items)
    db.add(order); db.commit(); db.refresh(order)
    return load(db, order.id)

@router.get("/{oid}", response_model=OrderOut)
def get_one(oid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    o = load(db, oid)
    if not o: raise HTTPException(404, "Order not found"); return o

@router.put("/{oid}", response_model=OrderOut)
def update(oid: int, data: OrderUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    o = db.query(CustomerOrder).filter(CustomerOrder.id == oid).first()
    if not o: raise HTTPException(404, "Order not found")
    if data.status:
        if data.status not in {"pending","confirmed","shipped","delivered","cancelled"}:
            raise HTTPException(400, "Invalid status")
        o.status = data.status
    if data.notes is not None: o.notes = data.notes
    db.commit(); return load(db, oid)

@router.delete("/{oid}")
def delete(oid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    o = db.query(CustomerOrder).filter(CustomerOrder.id == oid).first()
    if not o: raise HTTPException(404, "Order not found")
    if o.status not in ("pending","cancelled"): raise HTTPException(400, "Can only delete pending/cancelled orders")
    db.delete(o); db.commit(); return {"message": "Deleted"}
