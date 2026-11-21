from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


# order_status schema
class OrderStatus(str,Enum):
    PREPARING = "preparing"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"


# main table which is going to store the data
class Order(SQLModel,table=True):
    id : Optional[int] = Field(default=None, primary_key=True)
    customer_name : str
    delivery_address : str
    items : str
    status : OrderStatus = Field(default = OrderStatus.PREPARING)
    created_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at : datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# schema for order creation

class OrderCreate(SQLModel):
    customer_name : str
    delivery_address : str
    items : str

# schema for updating the order status

class OrderUpdate(SQLModel):
    status : Optional[OrderStatus] = None
    delivery_address : Optional[str] = None

# schema for status log

class StatusLog(SQLModel):
    order_id : int
    old_status : str
    new_status : str
    changed_at : datetime

