from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal

class StudentCreate(BaseModel):
    name: str
    parent_name: str
    phone_number: str
    email: Optional[str] = None
    enrollment_date: date
    standard: str
    subjects: str
    custom_fee: Decimal
    payment_type: str
    batch_timing: str

class StudentResponse(StudentCreate):
    id: int

    class Config:
        from_attributes = True


# --- BILLING CYCLE SCHEMAS ---
# What we expect when setting up a new 3-month cycle
class BillingCycleCreate(BaseModel):
    cycle_name: str  # e.g., "Term 1: Jan-Mar 2026"
    start_date: date
    end_date: date
    base_amount: Decimal
    late_fee_amount: Decimal

class BillingCycleResponse(BillingCycleCreate):
    id: int

    class Config:
        from_attributes = True


# --- PAYMENT SCHEMAS ---
class PaymentResponse(BaseModel):
    id: int
    student_id: int
    billing_cycle_id: int
    status: str
    base_amount_due: Decimal
    late_fee_applied: Decimal
    total_paid: Decimal
    paid_at: Optional[date] = None

    class Config:
        from_attributes = True