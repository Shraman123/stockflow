# StockFlow — Inventory & Order Management System

Full-stack Inventory & Order Management built with FastAPI + React + PostgreSQL.

## Features
- JWT Auth (admin / staff roles)
- Products with unique SKUs, categories, suppliers
- Customers with unique emails
- Orders — stock auto-deducted on placement, insufficient stock blocked
- Stock movement audit log
- Low stock alerts
- Dashboard with charts

## Stack
| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Container | Docker, docker-compose, nginx |

## Run with Docker
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

## Run locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## First-time setup
1. Go to http://localhost:8000/docs
2. POST `/api/auth/register`:
```json
{ "name": "Admin", "email": "admin@example.com", "password": "admin123", "role": "admin" }
```
3. Login at http://localhost:5173

## Environment Variables
```env
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@db:5432/dbname
```
