from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_admin, hash_password
from app.models.user import User

router = APIRouter()

class UserIn(BaseModel):
    name: str; email: EmailStr; password: str; role: Optional[str] = "staff"

class UserUpdate(BaseModel):
    name: Optional[str] = None; email: Optional[EmailStr] = None
    role: Optional[str] = None; is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: int; name: str; email: str; role: str; is_active: bool; created_at: datetime
    class Config: from_attributes = True

@router.get("/", response_model=List[UserOut])
def list_all(db: Session = Depends(get_db), _=Depends(require_admin)): return db.query(User).all()

@router.post("/", response_model=UserOut, status_code=201)
def create(data: UserIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.email == data.email).first(): raise HTTPException(400, "Email taken")
    u = User(name=data.name, email=data.email, hashed_password=hash_password(data.password), role=data.role)
    db.add(u); db.commit(); db.refresh(u); return u

@router.delete("/{uid}")
def delete(uid: int, db: Session = Depends(get_db), current=Depends(require_admin)):
    if uid == current.id: raise HTTPException(400, "Cannot delete yourself")
    u = db.query(User).filter(User.id == uid).first()
    if not u: raise HTTPException(404, "Not found")
    db.delete(u); db.commit(); return {"message": "Deleted"}
