from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.customer import Customer

router = APIRouter()

class CustomerIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class CustomerOut(BaseModel):
    id: int; name: str; email: str; phone: Optional[str]
    address: Optional[str]; is_active: bool; created_at: datetime
    class Config: from_attributes = True

@router.get("/", response_model=List[CustomerOut])
def list_all(db: Session = Depends(get_db), _=Depends(get_current_user)): return db.query(Customer).all()

@router.post("/", response_model=CustomerOut, status_code=201)
def create(data: CustomerIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(Customer).filter(Customer.email == data.email).first():
        raise HTTPException(400, "Email already registered")
    c = Customer(**data.model_dump()); db.add(c); db.commit(); db.refresh(c); return c

@router.get("/{cid}", response_model=CustomerOut)
def get_one(cid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == cid).first()
    if not c: raise HTTPException(404, "Customer not found"); return c

@router.put("/{cid}", response_model=CustomerOut)
def update(cid: int, data: CustomerUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == cid).first()
    if not c: raise HTTPException(404, "Customer not found")
    if data.email and data.email != c.email:
        if db.query(Customer).filter(Customer.email == data.email).first():
            raise HTTPException(400, "Email already in use")
    for k, v in data.model_dump(exclude_none=True).items(): setattr(c, k, v)
    db.commit(); db.refresh(c); return c

@router.delete("/{cid}")
def delete(cid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == cid).first()
    if not c: raise HTTPException(404, "Customer not found")
    db.delete(c); db.commit(); return {"message": "Deleted"}
