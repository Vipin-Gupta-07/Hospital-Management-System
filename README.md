# Modern Hospital Management System

A fully modern, responsive, and secure Hospital Management System built with a **FastAPI** backend (SQLite database) and a **React (Vite)** frontend.

## Key Features

- **JWT Authentication**: Secure role-based login and signup for Admins, Doctors, and Patients.
- **Admin Dashboard**:
  - Track real-time statistics (total patients, total doctors, active room occupancies).
  - Register new doctor, patient, or admin accounts.
  - Dynamically assign doctors to patients.
  - Delete user account.
  - View partner hospital details.
- **Doctor Portal**:
  - Manage and view profiles of all assigned and general patients.
  - Prescribe medicines with detailed dosage and frequency guidelines.
  - File patient medical reports and diagnostic charts.
  - Schedule consultation appointments.
- **Patient Health Dashboard**:
  - View room and bed assignments.
  - Track prescribed medicines with frequency schedules.
  - Read diagnostic and lab reports instantly.
  - Monitor upcoming scheduled consultations.

--------

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Python** (version 3.8 or higher)
- **Node.js** (version 16 or higher) & **npm**

--------------

### Backend Setup

1. **Navigate to the root directory**:
   ```bash
   cd Hospital-Management-System
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Initialize the database & create default admin**:
   ```bash
   python -m backend.init_db
   ```
   *Note: This creates the SQLite database `hospital.db` and configures a default admin account (Username: `admin`, Password: `admin123`).*

4. **Start the FastAPI backend server**:
   ```bash
   uvicorn backend.main:app --reload
   ```
   The backend will run on `http://localhost:8000`. You can view the interactive Swagger API documentation at `http://localhost:8000/docs`.

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install npm dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`. Open this URL in your web browser.

-----

## Technology Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite, PyJWT, Pydantic
- **Frontend**: React (Vite), Lucide Icons, Custom CSS Design System
- **Design Theme**: Modern Glassmorphism, Sleek Slate Dark Mode, Smooth CSS Micro-animations
