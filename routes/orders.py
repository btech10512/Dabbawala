from datetime import datetime, date, time, timezone
from fastapi import APIRouter, FastAPI, Depends, HTTPException, Query
from database import get_session
from models import Order, OrderStatus, OrderCreate, OrderUpdate
from sqlmodel import Session, select
from zoneinfo import ZoneInfo

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=Order)
def create_order(order : OrderCreate, session : Session = Depends(get_session)):
    db_order = Order(**order.model_dump())
    session.add(db_order)
    session.commit()
    session.refresh(db_order)
    return db_order

@router.get("/", response_model=list[Order])
def list_orders(
    status : OrderStatus | None = Query(default = None, description="Filter by order status"),
    created_date : date | None = Query(default=None,description="Filter by creation date YYYY-MM-DD"),
    skip : int = Query(default=0, ge=0),
    limit : int = Query(10, ge=1, le=100),
    session : Session = Depends(get_session)
):
    query = select(Order)

    if status:
        query = query.where(Order.status == status)
    if created_date:
        # start = datetime.combine(created_date.min.time())
        # end = datetime.combine(created_date.max.time())
        start = datetime.combine(
        created_date, time.min, tzinfo=ZoneInfo("Asia/Kolkata")
        ).astimezone(timezone.utc)

        end = datetime.combine(
        created_date, time.max, tzinfo=ZoneInfo("Asia/Kolkata")
        ).astimezone(timezone.utc)

        query = query.where(Order.created_at >= start, Order.created_at <= end)
    # now somes the pagination part 

    query = query.offset(skip).limit(limit)

    orders = session.exec(query).all()
    return orders