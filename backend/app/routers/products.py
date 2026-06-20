from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.product import Product

router = APIRouter()

class ProductIn(BaseModel):
    name: str; sku: str; description: Optional[str] = None
    category_id: Optional[int] = None; supplier_id: Optional[int] = None
    unit_price: float = 0.0; cost_price: float = 0.0
    quantity_in_stock: int = 0; low_stock_threshold: int = 10; unit: str = "pcs"

class ProductUpdate(BaseModel):
    name: Optional[str] = None; description: Optional[str] = None
    category_id: Optional[int] = None; supplier_id: Optional[int] = None
    unit_price: Optional[float] = None; cost_price: Optional[float] = None
    low_stock_threshold: Optional[int] = None; unit: Optional[str] = None; is_active: Optional[bool] = None

class CategorySmall(BaseModel):
    id: int; name: str
    class Config: from_attributes = True

class SupplierSmall(BaseModel):
    id: int; name: str
    class Config: from_attributes = True

class ProductOut(BaseModel):
    id: int; name: str; sku: str; description: Optional[str]
    category_id: Optional[int]; supplier_id: Optional[int]
    unit_price: float; cost_price: float; quantity_in_stock: int
    low_stock_threshold: int; unit: str; is_active: bool; created_at: datetime
    category: Optional[CategorySmall] = None; supplier: Optional[SupplierSmall] = None
    class Config: from_attributes = True

def q(db): return db.query(Product).options(joinedload(Product.category), joinedload(Product.supplier))

@router.get("/", response_model=List[ProductOut])
def list_all(search: Optional[str] = None, category_id: Optional[int] = None,
             low_stock: Optional[bool] = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    query = q(db)
    if search: query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    if category_id: query = query.filter(Product.category_id == category_id)
    if low_stock: query = query.filter(Product.quantity_in_stock <= Product.low_stock_threshold)
    return query.all()

@router.post("/", response_model=ProductOut, status_code=201)
def create(data: ProductIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(400, "SKU already exists")
    p = Product(**data.model_dump()); db.add(p); db.commit(); db.refresh(p)
    return q(db).filter(Product.id == p.id).first()

@router.get("/{pid}", response_model=ProductOut)
def get_one(pid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = q(db).filter(Product.id == pid).first()
    if not p: raise HTTPException(404, "Not found"); return p

@router.put("/{pid}", response_model=ProductOut)
def update(pid: int, data: ProductUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == pid).first()
    if not p: raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_none=True).items(): setattr(p, k, v)
    db.commit()
    return q(db).filter(Product.id == pid).first()

@router.delete("/{pid}")
def delete(pid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(Product).filter(Product.id == pid).first()
    if not p: raise HTTPException(404, "Not found")
    db.delete(p); db.commit(); return {"message": "Deleted"}
