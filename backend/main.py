from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import random
import string

from .database import engine, Base, get_db
from . import models, schemas, auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hospital Management System API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root / Health Check
@app.get("/")
def read_root():
    return {"message": "Welcome to the Hospital Management System API"}

# --- AUTH ROUTER ---
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@auth_router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        password_hash=hashed_pwd,
        role=user.role,
        name=user.name,
        email=user.email
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize profile based on role
    if user.role == "doctor":
        doc_profile = models.DoctorProfile(user_id=new_user.id)
        db.add(doc_profile)
    elif user.role == "patient":
        # Randomly assign a room/bed initially
        room = random.randint(101, 499)
        bed = random.choice(string.ascii_uppercase)
        pat_profile = models.PatientProfile(user_id=new_user.id, room_number=room, bed_letter=bed)
        db.add(pat_profile)
    
    db.commit()
    return new_user

@auth_router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@auth_router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# --- ADMIN ROUTER ---
admin_router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@admin_router.get("/summary", response_model=schemas.AllUserData)
def get_system_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    admins = db.query(models.User).filter(models.User.role == "admin").all()
    doctors = db.query(models.DoctorProfile).all()
    patients = db.query(models.PatientProfile).all()
    return {
        "admins": admins,
        "doctors": doctors,
        "patients": patients
    }

@admin_router.post("/users", response_model=schemas.UserResponse)
def admin_create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        password_hash=hashed_pwd,
        role=user.role,
        name=user.name,
        email=user.email
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if user.role == "doctor":
        doc_profile = models.DoctorProfile(user_id=new_user.id)
        db.add(doc_profile)
    elif user.role == "patient":
        room = random.randint(101, 499)
        bed = random.choice(string.ascii_uppercase)
        pat_profile = models.PatientProfile(user_id=new_user.id, room_number=room, bed_letter=bed)
        db.add(pat_profile)
    
    db.commit()
    return new_user

@admin_router.delete("/users/{username}")
def admin_delete_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": f"User {username} deleted successfully"}

@admin_router.put("/assign-doctor")
def assign_doctor(
    patient_username: str,
    doctor_username: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["admin"]))
):
    patient_user = db.query(models.User).filter(models.User.username == patient_username, models.User.role == "patient").first()
    doctor_user = db.query(models.User).filter(models.User.username == doctor_username, models.User.role == "doctor").first()
    
    if not patient_user or not doctor_user:
        raise HTTPException(status_code=404, detail="Patient or Doctor user not found")
    
    patient_profile = patient_user.patient_profile
    doctor_profile = doctor_user.doctor_profile
    
    if not patient_profile or not doctor_profile:
        raise HTTPException(status_code=500, detail="Profile records are missing")
    
    patient_profile.doctor_id = doctor_profile.id
    db.commit()
    return {"message": f"Patient '{patient_username}' assigned to Doctor '{doctor_username}' successfully."}


# --- DOCTOR ROUTER ---
doctor_router = APIRouter(prefix="/api/doctor", tags=["Doctor Operations"])

@doctor_router.get("/patients", response_model=List[schemas.PatientProfileResponse])
def get_doctor_patients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["doctor"]))
):
    # Returns all patients assigned to this doctor
    doc_id = current_user.doctor_profile.id
    patients = db.query(models.PatientProfile).filter(models.PatientProfile.doctor_id == doc_id).all()
    return patients

@doctor_router.get("/all-patients", response_model=List[schemas.PatientProfileResponse])
def get_all_patients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["doctor"]))
):
    # Doctors can search/view any patient (similar to terminal logic: view another patient data)
    patients = db.query(models.PatientProfile).all()
    return patients

@doctor_router.post("/medicines", response_model=schemas.MedicineResponse)
def prescribe_medicine(
    med: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["doctor"]))
):
    patient_user = db.query(models.User).filter(models.User.username == med.patient_username, models.User.role == "patient").first()
    if not patient_user:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    new_med = models.Medicine(
        patient_id=patient_user.patient_profile.id,
        doctor_id=current_user.doctor_profile.id,
        name=med.name,
        dosage=med.dosage,
        frequency=med.frequency
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med

@doctor_router.post("/reports", response_model=schemas.ReportResponse)
def add_report(
    rep: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["doctor"]))
):
    patient_user = db.query(models.User).filter(models.User.username == rep.patient_username, models.User.role == "patient").first()
    if not patient_user:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    new_report = models.Report(
        patient_id=patient_user.patient_profile.id,
        title=rep.title,
        content=rep.content
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@doctor_router.post("/appointments", response_model=schemas.AppointmentResponse)
def schedule_appointment(
    appt: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["doctor", "admin"]))
):
    patient_user = db.query(models.User).filter(models.User.username == appt.patient_username, models.User.role == "patient").first()
    doctor_user = db.query(models.User).filter(models.User.username == appt.doctor_username, models.User.role == "doctor").first()
    
    if not patient_user or not doctor_user:
        raise HTTPException(status_code=404, detail="Patient or Doctor not found")
    
    new_appt = models.Appointment(
        patient_id=patient_user.patient_profile.id,
        doctor_id=doctor_user.doctor_profile.id,
        date=appt.date,
        notes=appt.notes
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return new_appt

@doctor_router.get("/appointments", response_model=List[schemas.AppointmentResponse])
def get_doctor_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["doctor"]))
):
    doc_id = current_user.doctor_profile.id
    appts = db.query(models.Appointment).filter(models.Appointment.doctor_id == doc_id).all()
    return appts


# --- PATIENT ROUTER ---
patient_router = APIRouter(prefix="/api/patient", tags=["Patient Operations"])

@patient_router.get("/profile", response_model=schemas.PatientProfileResponse)
def get_patient_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["patient"]))
):
    return current_user.patient_profile

@patient_router.get("/medicines", response_model=List[schemas.MedicineResponse])
def get_patient_medicines(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["patient"]))
):
    pat_id = current_user.patient_profile.id
    medicines = db.query(models.Medicine).filter(models.Medicine.patient_id == pat_id).all()
    return medicines

@patient_router.get("/reports", response_model=List[schemas.ReportResponse])
def get_patient_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["patient"]))
):
    pat_id = current_user.patient_profile.id
    reports = db.query(models.Report).filter(models.Report.patient_id == pat_id).all()
    return reports

@patient_router.get("/appointments", response_model=List[schemas.AppointmentResponse])
def get_patient_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["patient"]))
):
    pat_id = current_user.patient_profile.id
    appts = db.query(models.Appointment).filter(models.Appointment.patient_id == pat_id).all()
    return appts


# Register Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(doctor_router)
app.include_router(patient_router)
