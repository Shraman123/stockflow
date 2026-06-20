from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.supplier import Supplier

router = APIRouter()

class SupplierIn(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = True

class SupplierOut(BaseModel):
    id: int; name: str; contact_person: Optional[str]; email: Optional[str]
    phone: Optional[str]; address: Optional[str]; is_active: bool; created_at: datetime
    class Config: from_attributes = True

@router.get("/", response_model=List[SupplierOut])
def list_all(db: Session = Depends(get_db), _=Depends(get_current_user)): return db.query(Supplier).all()

@router.post("/", response_model=SupplierOut, status_code=201)
def create(data: SupplierIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = Supplier(**data.model_dump()); db.add(s); db.commit(); db.refresh(s); return s

@router.put("/{sid}", response_model=SupplierOut)
def update(sid: int, data: SupplierIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == sid).first()
    if not s: raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_none=True).items(): setattr(s, k, v)
    db.commit(); db.refresh(s); return s

@router.delete("/{sid}")
def delete(sid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == sid).first()
    if not s: raise HTTPException(404, "Not found")
    db.delete(s); db.commit(); return {"message": "Deleted"}
