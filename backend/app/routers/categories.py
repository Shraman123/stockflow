from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.category import Category

router = APIRouter()

class CategoryIn(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: int; name: str; description: Optional[str]; created_at: datetime
    class Config: from_attributes = True

@router.get("/", response_model=List[CategoryOut])
def list_all(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Category).all()

@router.post("/", response_model=CategoryOut, status_code=201)
def create(data: CategoryIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(Category).filter(Category.name == data.name).first():
        raise HTTPException(400, "Category already exists")
    c = Category(**data.model_dump()); db.add(c); db.commit(); db.refresh(c); return c

@router.put("/{cid}", response_model=CategoryOut)
def update(cid: int, data: CategoryIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Category).filter(Category.id == cid).first()
    if not c: raise HTTPException(404, "Not found")
    for k, v in data.model_dump(exclude_none=True).items(): setattr(c, k, v)
    db.commit(); db.refresh(c); return c

@router.delete("/{cid}")
def delete(cid: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(Category).filter(Category.id == cid).first()
    if not c: raise HTTPException(404, "Not found")
    db.delete(c); db.commit(); return {"message": "Deleted"}
