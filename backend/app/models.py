from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parent_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    email = Column(String, nullable=True)
    enrollment_date = Column(Date, nullable=False)
    standard = Column(String, nullable=False)
    subjects = Column(String, nullable=False)
    custom_fee = Column(Numeric(10, 2), nullable=False)
    payment_type = Column(String, default="3_MONTHS") # "MONTHLY" or "3_MONTHS"
    batch_timing = Column(String, nullable=False)

    payments = relationship("Payment", back_populates="student", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    billing_cycle_id = Column(Integer, nullable=True) # Optional plain integer field
    status = Column(String, default="UNPAID") # "UNPAID", "CLAIMED", "PAID"
    base_amount_due = Column(Numeric(10, 2), nullable=False)
    late_fee_applied = Column(Numeric(10, 2), default=0.00)
    total_paid = Column(Numeric(10, 2), nullable=False)
    paid_at = Column(Date, nullable=False)

    student = relationship("Student", back_populates="payments")


# (Optional: Remove or keep BillingCycle if needed, but remove any relationships pointing to payments)
class BillingCycle(Base):
    __tablename__ = "billing_cycles"

    id = Column(Integer, primary_key=True, index=True)
    month_year = Column(String, nullable=False)