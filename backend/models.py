from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, doctor, patient
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)

    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    specialization = Column(String, default="General Physician")

    user = relationship("User", back_populates="doctor_profile")
    patients = relationship("PatientProfile", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor", cascade="all, delete-orphan")
    prescribed_medicines = relationship("Medicine", back_populates="doctor", cascade="all, delete-orphan")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    room_number = Column(Integer, nullable=True)
    bed_letter = Column(String, nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="SET NULL"), nullable=True)

    user = relationship("User", back_populates="patient_profile")
    doctor = relationship("DoctorProfile", back_populates="patients")
    medicines = relationship("Medicine", back_populates="patient", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)      # e.g. "500mg"
    frequency = Column(String, nullable=False)   # e.g. "Twice daily"

    patient = relationship("PatientProfile", back_populates="medicines")
    doctor = relationship("DoctorProfile", back_populates="prescribed_medicines")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("PatientProfile", back_populates="reports")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"))
    date = Column(String, nullable=False)  # ISO Date String or formatted
    status = Column(String, default="Scheduled") # Scheduled, Completed, Cancelled
    notes = Column(Text, nullable=True)

    patient = relationship("PatientProfile", back_populates="appointments")
    doctor = relationship("DoctorProfile", back_populates="appointments")
