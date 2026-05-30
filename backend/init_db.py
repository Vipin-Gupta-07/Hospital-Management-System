from backend.database import engine, SessionLocal
from backend import models
from backend import auth

def init():
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            hashed_pwd = auth.get_password_hash("admin123")
            default_admin = models.User(
                username="admin",
                password_hash=hashed_pwd,
                role="admin",
                name="System Administrator",
                email="admin@hospital.com"
            )
            db.add(default_admin)
            db.commit()
            print("Default admin account created: admin / admin123")
        else:
            print("Admin account already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    init()
