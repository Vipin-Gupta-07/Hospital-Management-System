from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# Doctor Profile Schemas
class DoctorProfileBase(BaseModel):
    specialization: str

class DoctorProfileResponse(BaseModel):
    id: int
    specialization: str
    user: UserResponse

    class Config:
        from_attributes = True

# Patient Profile Schemas
class PatientProfileBase(BaseModel):
    room_number: Optional[int] = None
    bed_letter: Optional[str] = None

class PatientProfileResponse(BaseModel):
    id: int
    room_number: Optional[int] = None
    bed_letter: Optional[str] = None
    user: UserResponse
    doctor: Optional[DoctorProfileResponse] = None

    class Config:
        from_attributes = True

# Medicine Schemas
class MedicineBase(BaseModel):
    name: str
    dosage: str
    frequency: str

class MedicineCreate(MedicineBase):
    patient_username: str

class MedicineResponse(MedicineBase):
    id: int
    patient_id: int
    doctor_id: int

    class Config:
        from_attributes = True

# Report Schemas
class ReportBase(BaseModel):
    title: str
    content: str

class ReportCreate(ReportBase):
    patient_username: str

class ReportResponse(ReportBase):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentBase(BaseModel):
    date: str
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    patient_username: str
    doctor_username: str

class AppointmentResponse(AppointmentBase):
    id: int
    patient: PatientProfileResponse
    doctor: DoctorProfileResponse
    status: str

    class Config:
        from_attributes = True

# Full details for Admin View
class AllUserData(BaseModel):
    admins: List[UserResponse]
    doctors: List[DoctorProfileResponse]
    patients: List[PatientProfileResponse]
