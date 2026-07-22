from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
import traceback

from .database import engine, get_db
from . import models, schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nerva Tuitions Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_term_dates(enrollment_date: date, payment_type: str):
    days_per_term = 90 if payment_type == "3_MONTHS" else 30
    today = date.today()
    
    term_start = enrollment_date
    term_end = term_start + timedelta(days=days_per_term)
    
    while today >= term_end:
        term_start = term_end
        term_end = term_start + timedelta(days=days_per_term)
        
    return term_start, term_end

def calculate_late_fee():
    today = date.today()
    current_day = today.day
    if current_day >= 10:
        return (current_day - 9) * 50.0
    return 0.0

# --- AUTHENTICATION / LOGIN ---
@app.post("/login")
def login(phone: str = Body(..., embed=True), password: str = Body(..., embed=True), db: Session = Depends(get_db)):
    clean_phone = phone.strip()
    if clean_phone.lower() == "admin" and password == "admin123":
        return {"role": "ADMIN", "user": {"name": "Admin Ma'am"}}
    
    student = db.query(models.Student).filter(models.Student.phone_number.contains(clean_phone)).first()
    if student:
        return {"role": "PARENT", "student_id": student.id, "user": {"name": student.parent_name, "student_name": student.name}}
    
    raise HTTPException(status_code=401, detail="Invalid phone number or password")

# --- GET ALL STUDENTS (ADMIN) ---
@app.get("/students/")
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(models.Student).all()
    result = []
    
    for s in students:
        term_start, term_end = get_current_term_dates(s.enrollment_date, s.payment_type)
        
        latest_payment = db.query(models.Payment).filter(
            models.Payment.student_id == s.id,
            models.Payment.paid_at >= term_start,
            models.Payment.paid_at <= term_end
        ).order_by(models.Payment.id.desc()).first()
        
        status = latest_payment.status if latest_payment else "UNPAID"
        late_fee = 0.0 if status == "PAID" else calculate_late_fee()
        
        student_data = {
            "id": s.id,
            "name": s.name,
            "parent_name": s.parent_name,
            "phone_number": s.phone_number,
            "email": s.email,
            "enrollment_date": s.enrollment_date,
            "term_start": term_start,
            "term_end": term_end,
            "standard": s.standard,
            "subjects": s.subjects,
            "custom_fee": float(s.custom_fee),
            "payment_type": s.payment_type,
            "batch_timing": s.batch_timing,
            "payment_status": status,
            "late_fee": late_fee
        }
        result.append(student_data)
        
    return result

# --- GET SINGLE STUDENT (PARENT) ---
@app.get("/students/{student_id}")
def get_single_student(student_id: int, db: Session = Depends(get_db)):
    s = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
        
    term_start, term_end = get_current_term_dates(s.enrollment_date, s.payment_type)
    
    latest_payment = db.query(models.Payment).filter(
        models.Payment.student_id == s.id,
        models.Payment.paid_at >= term_start,
        models.Payment.paid_at <= term_end
    ).order_by(models.Payment.id.desc()).first()
    
    status = latest_payment.status if latest_payment else "UNPAID"
    late_fee = 0.0 if status == "PAID" else calculate_late_fee()
    
    return {
        "id": s.id,
        "name": s.name,
        "parent_name": s.parent_name,
        "phone_number": s.phone_number,
        "term_start": term_start,
        "term_end": term_end,
        "standard": s.standard,
        "subjects": s.subjects,
        "custom_fee": float(s.custom_fee),
        "payment_type": s.payment_type,
        "batch_timing": s.batch_timing,
        "payment_status": status,
        "late_fee": late_fee
    }

# --- PARENT CLAIM PAYMENT ---
@app.post("/payments/student/{student_id}/claim")
def claim_payment_by_parent(student_id: int, db: Session = Depends(get_db)):
    try:
        student = db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        multiplier = 3 if student.payment_type == "3_MONTHS" else 1
        base_due = float(student.custom_fee) * multiplier
        late_fee = calculate_late_fee()
        total_due = base_due + late_fee

        payment = models.Payment(
            student_id=student.id,
            status="CLAIMED",
            base_amount_due=base_due,
            late_fee_applied=late_fee,
            total_paid=total_due,
            paid_at=date.today()
        )
        db.add(payment)
        db.commit()
        return {"status": "Success", "message": "Claim submitted!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- ADMIN APPROVE PAYMENT ---
@app.post("/payments/student/{student_id}/pay")
def pay_student_latest_invoice(student_id: int, db: Session = Depends(get_db)):
    try:
        student = db.query(models.Student).filter(models.Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        claimed = db.query(models.Payment).filter(
            models.Payment.student_id == student_id,
            models.Payment.status == "CLAIMED"
        ).first()
        
        if claimed:
            claimed.status = "PAID"
            db.commit()
            return {"status": "Success", "amount_paid": float(claimed.total_paid)}

        multiplier = 3 if student.payment_type == "3_MONTHS" else 1
        base_due = float(student.custom_fee) * multiplier
        late_fee = calculate_late_fee()
        total_due = base_due + late_fee

        payment = models.Payment(
            student_id=student.id,
            status="PAID",
            base_amount_due=base_due,
            late_fee_applied=late_fee,
            total_paid=total_due,
            paid_at=date.today()
        )
        db.add(payment)
        db.commit()
        return {"status": "Success", "amount_paid": float(total_due)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- STUDENT CRUD ---
@app.post("/students/", response_model=schemas.StudentResponse, status_code=201)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = models.Student(
        name=student.name, parent_name=student.parent_name, phone_number=student.phone_number,
        email=student.email, enrollment_date=student.enrollment_date, standard=student.standard,
        subjects=student.subjects, custom_fee=student.custom_fee, payment_type=student.payment_type,
        batch_timing=student.batch_timing
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.put("/students/{student_id}")
def update_student(student_id: int, updated_data: schemas.StudentCreate, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.name = updated_data.name
    student.parent_name = updated_data.parent_name
    student.phone_number = updated_data.phone_number
    student.email = updated_data.email
    student.standard = updated_data.standard
    student.subjects = updated_data.subjects
    student.custom_fee = updated_data.custom_fee
    student.payment_type = updated_data.payment_type
    student.batch_timing = updated_data.batch_timing

    db.commit()
    return {"status": "Success"}

@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.query(models.Payment).filter(models.Payment.student_id == student_id).delete()
    db.delete(student)
    db.commit()
    return {"status": "Success"}

# --- REVENUE SPLIT ANALYTICS ---
@app.get("/analytics/revenue-split")
def get_revenue_analytics(db: Session = Depends(get_db)):
    paid_invoices = db.query(models.Payment).filter(models.Payment.status == "PAID").all()
    gross_revenue = float(sum(p.total_paid for p in paid_invoices)) if paid_invoices else 0.0
    
    return {
        "gross_revenue": gross_revenue,
        "employer_share_40": gross_revenue * 0.40,
        "mom_take_home_60": gross_revenue * 0.60,
    }