from datetime import datetime, date
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.models import User, Department, LeaveType, UserRole, Holiday
from app.core.auth import hash_password

Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    try:
        # Check if admins already exist
        if not db.query(User).filter(User.email == "s.manojkumar@gradyens.com").first():
            # Create admin users using SHA256 for simplicity
            admin1 = User(
                email="s.manojkumar@gradyens.com",
                password=hash_password("admin123"),
                name="Manoj Kumar S",
                role=UserRole.admin,
                is_active=True
            )
            db.add(admin1)
        
        if not db.query(User).filter(User.email == "e.manikandan@gradyens.com").first():
            admin2 = User(
                email="e.manikandan@gradyens.com",
                password=hash_password("admin123"),
                name="Manikandan E",
                role=UserRole.admin,
                is_active=True
            )
            db.add(admin2)
        
        # Create default departments
        departments = [
            Department(name="Engineering", code="ENG", description="Engineering Department"),
            Department(name="Human Resources", code="HR", description="HR Department"),
            Department(name="Marketing", code="MKT", description="Marketing Department"),
            Department(name="Finance", code="FIN", description="Finance Department"),
            Department(name="Design", code="DES", description="Design Department"),
            Department(name="Sales", code="SAL", description="Sales Department"),
        ]
        
        for dept in departments:
            existing = db.query(Department).filter(Department.code == dept.code).first()
            if not existing:
                db.add(dept)
        
        # Create default leave types with proper counts
        leave_types = [
            LeaveType(name="Casual Leave", code="CL", description="Regular casual leave", is_paid=True, annual_quota=12),
            LeaveType(name="Sick Leave", code="SL", description="Medical leave", is_paid=True, annual_quota=10),
            LeaveType(name="Earned Leave", code="EL", description="Accumulated leave", is_paid=True, annual_quota=15),
            LeaveType(name="Maternity Leave", code="ML", description="Pregnancy leave", is_paid=True, annual_quota=90),
            LeaveType(name="Paternity Leave", code="PL", description="Paternity leave", is_paid=True, annual_quota=15),
            LeaveType(name="Marriage Leave", code="MAR", description="Marriage leave", is_paid=True, annual_quota=5),
            LeaveType(name="Bereavement Leave", code="BL", description="Family death leave", is_paid=True, annual_quota=5),
            LeaveType(name="Compensatory Off", code="CO", description="Comp off for weekend/holiday work", is_paid=True, annual_quota=0),
            LeaveType(name="Unpaid Leave", code="UL", description="Leave without pay", is_paid=False, annual_quota=0),
        ]
        
        for lt in leave_types:
            existing = db.query(LeaveType).filter(LeaveType.code == lt.code).first()
            if not existing:
                db.add(lt)
        
        # Create default holidays for current year
        current_year = 2026
        holidays = [
            Holiday(name="Republic Day", date=date(2026, 1, 26), day="Sunday", is_national_holiday=True, description="Indian Republic Day", year=current_year),
            Holiday(name="Mahashivratri", date=date(2026, 2, 15), day="Sunday", is_national_holiday=False, description="Shivaratri festival", year=current_year),
            Holiday(name="Holi", date=date(2026, 3, 14), day="Saturday", is_national_holiday=False, description="Festival of colors", year=current_year),
            Holiday(name="Good Friday", date=date(2026, 4, 3), day="Friday", is_national_holiday=False, description="Christian holiday", year=current_year),
            Holiday(name="Ramzan/Eid", date=date(2026, 3, 21), day="Saturday", is_national_holiday=True, description="Eid-ul-Fitr", year=current_year),
            Holiday(name="May Day", date=date(2026, 5, 1), day="Friday", is_national_holiday=True, description="Labour Day", year=current_year),
            Holiday(name="Independence Day", date=date(2026, 8, 15), day="Saturday", is_national_holiday=True, description="Independence Day of India", year=current_year),
            Holiday(name="Ganesh Chaturthi", date=date(2026, 9, 7), day="Monday", is_national_holiday=False, description="Ganesh Festival", year=current_year),
            Holiday(name="Vijayadashami", date=date(2026, 10, 12), day="Monday", is_national_holiday=False, description="Dussehra", year=current_year),
            Holiday(name="Diwali", date=date(2026, 11, 1), day="Sunday", is_national_holiday=False, description="Festival of Lights", year=current_year),
            Holiday(name="Christmas", date=date(2026, 12, 25), day="Friday", is_national_holiday=True, description="Christmas Day", year=current_year),
        ]
        
        for h in holidays:
            existing = db.query(Holiday).filter(Holiday.date == h.date, Holiday.year == h.year).first()
            if not existing:
                db.add(h)
        
        db.commit()
        print("Admin users and default data created successfully!")
        print("Admin 1: s.manojkumar@gradyens.com / admin123")
        print("Admin 2: e.manikandan@gradyens.com / admin123")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()