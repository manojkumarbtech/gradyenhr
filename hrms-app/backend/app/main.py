import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from app.core.database import get_db, engine, Base, SessionLocal
from app.core.auth import verify_password, hash_password, create_access_token, decode_token
from app.models.models import User, Department, Employee, Intern, LeaveType, LeaveRequest, LeaveBalance, Attendance, TrainingEvent, TrainingAssignment, Holiday, JobPosting, Applicant, Asset, AssetCategory, AssetAssignment, AssetReturnRequest, UserRole, MasterDataEntry, UserPermission, Inquiry
from app.schemas.schemas import (
    UserCreate, UserResponse, Token,
    DepartmentCreate, DepartmentResponse,
    EmployeeCreate, EmployeeResponse, EmployeeUpdate, EmployeeSimpleCreate, EmployeeWithUserResponse,
    InternCreate, InternResponse, InternUpdate,
    LeaveTypeCreate, LeaveTypeResponse,
    LeaveRequestCreate, LeaveRequestResponse,
    AttendanceCreate, AttendanceResponse,
    TrainingEventCreate, TrainingEventResponse, TrainingEventUpdate,
    TrainingAssignmentCreate, TrainingAssignmentResponse, TrainingAssignmentUpdate,
    HolidayCreate, HolidayResponse, HolidayUpdate,
    JobPostingCreate, JobPostingResponse, JobPostingUpdate,
    ApplicantCreate, ApplicantResponse, ApplicantUpdate,
    AssetCreate, AssetResponse, AssetUpdate,
    AssetAssignmentCreate, AssetAssignmentResponse,
    AssetReturnRequestCreate, AssetReturnRequestResponse, AssetReturnRequestUpdate,
    MasterDataEntryCreate, MasterDataEntryResponse, MasterDataEntryUpdate,
    UserPermissionCreate, UserPermissionResponse, UserPermissionUpdate,
    InquiryCreate, InquiryResponse, InquiryUpdate,
)
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
from enum import Enum
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

Base.metadata.create_all(bind=engine)

# Create admin user from environment variables if not exists
db = SessionLocal()
admin_email = os.environ.get("ADMIN_EMAIL", "s.manojkumar@gradyens.com")
admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
admin_user = db.query(User).filter(User.email == admin_email).first()
if not admin_user:
    admin = User(
        email=admin_email,
        password=hash_password(admin_password),
        name="Admin",
        role=UserRole.admin,
        is_active=True
    )
    db.add(admin)
    db.commit()
db.close()

app = FastAPI(title="HRMS API", description="Human Resource Management System API")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(*allowed_roles: str):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker

from fastapi import Request

@app.post("/token", response_model=Token)
@limiter.limit("20/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = hash_password(user.password)
    db_user = User(email=user.email, password=hashed_password, name=user.name, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(require_role("admin", "hr"))):
    return current_user

@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    return db.query(User).all()

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if "email" in user_data:
        db_user.email = user_data["email"]
    if "name" in user_data:
        db_user.name = user_data["name"]
    if "role" in user_data:
        db_user.role = user_data["role"]
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

@app.post("/departments", response_model=DepartmentResponse)
def create_department(department: DepartmentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_dept = Department(**department.model_dump())
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@app.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    return db.query(Department).all()

@app.put("/departments/{department_id}", response_model=DepartmentResponse)
def update_department(department_id: int, department: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_dept = db.query(Department).filter(Department.id == department_id).first()
    if db_dept is None:
        raise HTTPException(status_code=404, detail="Department not found")
    if "name" in department:
        db_dept.name = department["name"]
    if "description" in department:
        db_dept.description = department["description"]
    db.commit()
    db.refresh(db_dept)
    return db_dept

@app.delete("/departments/{department_id}")
def delete_department(department_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_dept = db.query(Department).filter(Department.id == department_id).first()
    if db_dept is None:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(db_dept)
    db.commit()
    return {"message": "Department deleted successfully"}

@app.post("/employees/simple", response_model=EmployeeWithUserResponse)
def create_employee_simple(employee: EmployeeSimpleCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    existing_user = db.query(User).filter(User.email == employee.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password("Welcome@123")
    db_user = User(email=employee.email, password=hashed_password, name=employee.name, role=UserRole.employee)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    import random
    emp_code = f"EMP{random.randint(1000, 9999)}"
    
    db_employee = Employee(
        user_id=db_user.id,
        employee_code=emp_code,
        first_name=employee.name.split()[0] if employee.name else employee.name,
        last_name=" ".join(employee.name.split()[1:]) if len(employee.name.split()) > 1 else None,
        phone=employee.phone,
        department_id=employee.department_id,
        designation=employee.designation,
        status=employee.status or "active",
        date_of_join=employee.date_of_join,
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    
    return {
        "id": db_employee.id,
        "user_id": db_employee.user_id,
        "employee_code": db_employee.employee_code,
        "first_name": db_employee.first_name,
        "last_name": db_employee.last_name,
        "phone": db_employee.phone,
        "department_id": db_employee.department_id,
        "designation": db_employee.designation,
        "date_of_join": db_employee.date_of_join,
        "date_of_birth": db_employee.date_of_birth,
        "profile_image": db_employee.profile_image,
        "status": db_employee.status,
        "created_at": db_employee.created_at,
        "name": employee.name,
        "email": employee.email,
    }

@app.post("/employees", response_model=EmployeeResponse)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_user = db.query(User).filter(User.id == employee.user_id).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")
    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@app.get("/employees", response_model=List[EmployeeWithUserResponse])
def get_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    employees = db.query(Employee).offset(skip).limit(limit).all()
    result = []
    for emp in employees:
        user = db.query(User).filter(User.id == emp.user_id).first()
        emp_dict = {
            "id": emp.id,
            "user_id": emp.user_id,
            "employee_code": emp.employee_code,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "phone": emp.phone,
            "department_id": emp.department_id,
            "designation": emp.designation,
            "date_of_join": emp.date_of_join,
            "date_of_birth": emp.date_of_birth,
            "profile_image": emp.profile_image,
            "status": emp.status,
            "created_at": emp.created_at,
            "name": user.name if user else None,
            "email": user.email if user else None,
        }
        result.append(emp_dict)
    return result

@app.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@app.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, employee: EmployeeUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, value in employee.model_dump(exclude_unset=True).items():
        setattr(db_employee, key, value)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@app.post("/interns", response_model=InternResponse)
def create_intern(intern: InternCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_intern = Intern(**intern.model_dump())
    db.add(db_intern)
    db.commit()
    db.refresh(db_intern)
    return db_intern

@app.get("/interns", response_model=List[InternResponse])
def get_interns(status_filter: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    query = db.query(Intern)
    if status_filter:
        query = query.filter(Intern.status == status_filter)
    return query.all()

@app.get("/interns/{intern_id}", response_model=InternResponse)
def get_intern(intern_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    intern = db.query(Intern).filter(Intern.id == intern_id).first()
    if intern is None:
        raise HTTPException(status_code=404, detail="Intern not found")
    return intern

@app.put("/interns/{intern_id}", response_model=InternResponse)
def update_intern(intern_id: int, intern: InternUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_intern = db.query(Intern).filter(Intern.id == intern_id).first()
    if db_intern is None:
        raise HTTPException(status_code=404, detail="Intern not found")
    for key, value in intern.model_dump(exclude_unset=True).items():
        setattr(db_intern, key, value)
    db.commit()
    db.refresh(db_intern)
    return db_intern

@app.post("/leave-types", response_model=LeaveTypeResponse)
def create_leave_type(leave_type: LeaveTypeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_leave_type = LeaveType(**leave_type.model_dump())
    db.add(db_leave_type)
    db.commit()
    db.refresh(db_leave_type)
    return db_leave_type

@app.get("/leave-types", response_model=List[LeaveTypeResponse])
def get_leave_types(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    return db.query(LeaveType).all()

@app.put("/leave-types/{leave_type_id}", response_model=LeaveTypeResponse)
def update_leave_type(leave_type_id: int, leave_type: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
    if db_leave_type is None:
        raise HTTPException(status_code=404, detail="Leave type not found")
    if "name" in leave_type:
        db_leave_type.name = leave_type["name"]
    if "description" in leave_type:
        db_leave_type.description = leave_type["description"]
    if "annual_quota" in leave_type:
        db_leave_type.annual_quota = leave_type["annual_quota"]
    if "is_paid" in leave_type:
        db_leave_type.is_paid = leave_type["is_paid"]
    db.commit()
    db.refresh(db_leave_type)
    return db_leave_type

@app.delete("/leave-types/{leave_type_id}")
def delete_leave_type(leave_type_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_leave_type = db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
    if db_leave_type is None:
        raise HTTPException(status_code=404, detail="Leave type not found")
    db.delete(db_leave_type)
    db.commit()
    return {"message": "Leave type deleted successfully"}

@app.post("/leave-requests", response_model=LeaveRequestResponse)
def create_leave_request(leave_request: LeaveRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_leave_request = LeaveRequest(**leave_request.model_dump())
    db.add(db_leave_request)
    db.commit()
    db.refresh(db_leave_request)
    return db_leave_request

@app.get("/leave-requests", response_model=List[LeaveRequestResponse])
def get_leave_requests(
    status_filter: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LeaveRequest)
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)
    return query.all()

@app.put("/leave-requests/{leave_request_id}")
def update_leave_request(
    leave_request_id: int,
    leave_request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_request_id).first()
    if db_leave_request is None:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if "status" in leave_request:
        db_leave_request.status = leave_request["status"]
        if leave_request["status"] in ["approved", "rejected"]:
            db_leave_request.approved_by = current_user.id
            from datetime import datetime
            db_leave_request.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_leave_request)
    return db_leave_request

@app.get("/leave-balances", response_model=List[dict])
def get_leave_balances(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LeaveBalance)
    if employee_id:
        query = query.filter(LeaveBalance.employee_id == employee_id)
    balances = query.all()
    result = []
    for b in balances:
        leave_type = db.query(LeaveType).filter(LeaveType.id == b.leave_type_id).first()
        result.append({
            "id": b.id,
            "employee_id": b.employee_id,
            "leave_type_id": b.leave_type_id,
            "leave_type_name": leave_type.name if leave_type else "Unknown",
            "year": b.year,
            "balance": b.balance,
            "used": b.used,
            "available": b.balance - b.used
        })
    return result

@app.post("/attendances", response_model=AttendanceResponse)
def create_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_attendance = Attendance(**attendance.model_dump())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@app.get("/attendances", response_model=List[AttendanceResponse])
def get_attendances(date_filter: Optional[date] = None, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    query = db.query(Attendance)
    if date_filter:
        query = query.filter(Attendance.date == date_filter)
    return query.all()

@app.put("/attendances/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(attendance_id: int, attendance: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance not found")
    for key, value in attendance.items():
        if value is not None:
            setattr(db_attendance, key, value)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@app.get("/attendances/summary")
def get_attendance_summary(date_filter: Optional[date] = None, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    if not date_filter:
        date_filter = date.today()
    all_attendance = db.query(Attendance).filter(Attendance.date == date_filter).all()
    return {
        "date": date_filter,
        "total": len(all_attendance),
        "present": len([a for a in all_attendance if a.check_in]),
    }

@app.post("/training-events", response_model=TrainingEventResponse)
def create_training_event(event: TrainingEventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_event = TrainingEvent(**event.model_dump(), created_by=current_user.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/training-events", response_model=List[TrainingEventResponse])
def get_training_events(status_filter: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(TrainingEvent)
    if status_filter:
        query = query.filter(TrainingEvent.status == status_filter)
    return query.all()

@app.get("/training-events/{event_id}", response_model=TrainingEventResponse)
def get_training_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(TrainingEvent).filter(TrainingEvent.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Training event not found")
    return event

@app.put("/training-events/{event_id}", response_model=TrainingEventResponse)
def update_training_event(event_id: int, event: TrainingEventUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_event = db.query(TrainingEvent).filter(TrainingEvent.id == event_id).first()
    if db_event is None:
        raise HTTPException(status_code=404, detail="Training event not found")
    for key, value in event.model_dump(exclude_unset=True).items():
        setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event

# Training Assignment APIs for Interns
@app.post("/training-assignments", response_model=TrainingAssignmentResponse)
def create_training_assignment(
    assignment: TrainingAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hr"))
):
    db_assignment = TrainingAssignment(
        **assignment.model_dump(),
        assigned_by=current_user.id
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.get("/training-assignments")
def get_training_assignments(
    intern_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TrainingAssignment)
    if intern_id:
        query = query.filter(TrainingAssignment.intern_id == intern_id)
    return query.order_by(TrainingAssignment.due_date.desc()).all()

@app.get("/training-assignments/{assignment_id}", response_model=TrainingAssignmentResponse)
def get_training_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(TrainingAssignment).filter(TrainingAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@app.put("/training-assignments/{assignment_id}", response_model=TrainingAssignmentResponse)
def update_training_assignment(
    assignment_id: int,
    assignment: TrainingAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_assignment = db.query(TrainingAssignment).filter(TrainingAssignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Handle submission
    if assignment.submitted_content is not None:
        db_assignment.submitted_content = assignment.submitted_content
        db_assignment.submitted_at = func.now()
        db_assignment.status = "submitted"
    
    # Handle grading
    if assignment.status:
        db_assignment.status = assignment.status
    if assignment.score is not None:
        db_assignment.score = assignment.score
    if assignment.feedback is not None:
        db_assignment.feedback = assignment.feedback
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.delete("/training-assignments/{assignment_id}")
def delete_training_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(TrainingAssignment).filter(TrainingAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}

@app.post("/holidays", response_model=HolidayResponse)
def create_holiday(holiday: HolidayCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_holiday = Holiday(**holiday.model_dump())
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@app.get("/holidays")
def get_holidays(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Holiday)
    if year:
        query = query.filter(Holiday.year == year)
    return query.order_by(Holiday.date).all()

@app.get("/holidays/{holiday_id}", response_model=HolidayResponse)
def get_holiday(holiday_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return holiday

@app.put("/holidays/{holiday_id}", response_model=HolidayResponse)
def update_holiday(holiday_id: int, holiday: HolidayUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if db_holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found")
    for key, value in holiday.model_dump(exclude_unset=True).items():
        setattr(db_holiday, key, value)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@app.delete("/holidays/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if db_holiday is None:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(db_holiday)
    db.commit()
    return {"message": "Holiday deleted successfully"}

@app.get("/reports/attendance")
def get_attendance_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Attendance)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    
    attendances = query.all()
    
    total_present = len([a for a in attendances if a.check_in is not None])
    total_absent = 0
    total_late = 0
    
    employees = db.query(Employee).all()
    if department_id:
        employees = [e for e in employees if e.department_id == department_id]
    
    total_employees = len(employees)
    working_days = len(set([a.date for a in attendances])) if attendances else 1
    
    result = {
        "total_employees": total_employees,
        "total_present": total_present,
        "total_absent": (total_employees * working_days) - total_present,
        "attendance_percentage": round((total_present / (total_employees * working_days) * 100), 2) if total_employees > 0 else 0,
        "working_days": working_days,
        "details": []
    }
    
    for emp in employees[:10]:
        emp_att = [a for a in attendances if a.employee_id == emp.id]
        present_count = len([a for a in emp_att if a.check_in is not None])
        result["details"].append({
            "employee_id": emp.id,
            "employee_name": f"Employee {emp.id}",
            "present": present_count,
            "absent": working_days - present_count,
            "percentage": round((present_count / working_days * 100), 2) if working_days > 0 else 0
        })
    
    return result

@app.get("/reports/leave")
def get_leave_report(
    year: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not year:
        year = date.today().year
    
    leave_requests = db.query(LeaveRequest).all()
    leave_types = db.query(LeaveType).all()
    
    pending = len([l for l in leave_requests if l.status == "pending"])
    approved = len([l for l in leave_requests if l.status == "approved"])
    rejected = len([l for l in leave_requests if l.status == "rejected"])
    
    by_type = {}
    for lt in leave_types:
        count = len([l for l in leave_requests if l.leave_type_id == lt.id])
        by_type[lt.name] = count
    
    return {
        "year": year,
        "total_requests": len(leave_requests),
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "by_type": by_type
    }

@app.get("/reports/employees")
def get_employee_report(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Employee)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    
    employees = query.all()
    departments = db.query(Department).all()
    
    by_status = {
        "active": len([e for e in employees if e.status == "active"]),
        "on_leave": len([e for e in employees if e.status == "on_leave"]),
        "terminated": len([e for e in employees if e.status == "terminated"]),
    }
    
    by_department = {}
    for dept in departments:
        count = len([e for e in employees if e.department_id == dept.id])
        by_department[dept.name] = count
    
    interns = db.query(Intern).all()
    intern_by_status = {
        "active": len([i for i in interns if i.status == "active"]),
        "pending": len([i for i in interns if i.status == "pending"]),
        "completed": len([i for i in interns if i.status == "completed"]),
    }
    
    return {
        "total_employees": len(employees),
        "total_interns": len(interns),
        "by_status": by_status,
        "by_department": by_department,
        "interns_by_status": intern_by_status
    }

@app.get("/reports/dashboard-summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    
    total_employees = db.query(Employee).count()
    total_interns = db.query(Intern).count()
    total_departments = db.query(Department).count()
    
    today_att = db.query(Attendance).filter(Attendance.date == today).all()
    present_today = len([a for a in today_att if a.check_in is not None])
    
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "pending").count()
    
    upcoming_training = db.query(TrainingEvent).filter(TrainingEvent.status == "upcoming").count()
    
    return {
        "total_employees": total_employees,
        "total_interns": total_interns,
        "total_departments": total_departments,
        "present_today": present_today,
        "total_on_leave": total_employees - present_today,
        "pending_leaves": pending_leaves,
        "upcoming_training": upcoming_training
    }

@app.post("/job-postings", response_model=JobPostingResponse)
def create_job_posting(job: JobPostingCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_job = JobPosting(**job.model_dump(), posted_by=current_user.id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.get("/job-postings")
def get_job_postings(
    status: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(JobPosting)
    if status:
        query = query.filter(JobPosting.status == status)
    if department:
        query = query.filter(JobPosting.department == department)
    return query.order_by(JobPosting.created_at.desc()).all()

@app.get("/job-postings/{job_id}", response_model=JobPostingResponse)
def get_job_posting(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if job is None:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return job

@app.put("/job-postings/{job_id}", response_model=JobPostingResponse)
def update_job_posting(job_id: int, job: JobPostingUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if db_job is None:
        raise HTTPException(status_code=404, detail="Job posting not found")
    for key, value in job.model_dump(exclude_unset=True).items():
        setattr(db_job, key, value)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.delete("/job-postings/{job_id}")
def delete_job_posting(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if db_job is None:
        raise HTTPException(status_code=404, detail="Job posting not found")
    db.delete(db_job)
    db.commit()
    return {"message": "Job posting deleted successfully"}

@app.post("/applicants", response_model=ApplicantResponse)
def create_applicant(applicant: ApplicantCreate, db: Session = Depends(get_db)):
    db_applicant = Applicant(**applicant.model_dump())
    db.add(db_applicant)
    db.commit()
    db.refresh(db_applicant)
    return db_applicant

@app.get("/applicants")
def get_applicants(
    job_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Applicant)
    if job_id:
        query = query.filter(Applicant.job_id == job_id)
    if status:
        query = query.filter(Applicant.status == status)
    return query.order_by(Applicant.applied_at.desc()).all()

@app.get("/applicants/{applicant_id}", response_model=ApplicantResponse)
def get_applicant(applicant_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if applicant is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return applicant

@app.put("/applicants/{applicant_id}", response_model=ApplicantResponse)
def update_applicant(applicant_id: int, applicant: ApplicantUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if db_applicant is None:
        raise HTTPException(status_code=404, detail="Applicant not found")
    for key, value in applicant.model_dump(exclude_unset=True).items():
        setattr(db_applicant, key, value)
    db.commit()
    db.refresh(db_applicant)
    return db_applicant

@app.post("/assets", response_model=AssetResponse)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_asset = Asset(**asset.model_dump())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.get("/assets")
def get_assets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Asset)
    if status:
        query = query.filter(Asset.status == status)
    if category:
        query = query.filter(Asset.category == category)
    if assigned_to:
        query = query.filter(Asset.assigned_to == assigned_to)
    return query.order_by(Asset.created_at.desc()).all()

@app.get("/assets/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@app.put("/assets/{asset_id}", response_model=AssetResponse)
def update_asset(asset_id: int, asset: AssetUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    for key, value in asset.model_dump(exclude_unset=True).items():
        setattr(db_asset, key, value)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted successfully"}

@app.post("/asset-assignments", response_model=AssetAssignmentResponse)
def create_asset_assignment(assignment: AssetAssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_assignment = AssetAssignment(
        asset_id=assignment.asset_id,
        assigned_to=assignment.assigned_to,
        assigned_type=assignment.assigned_type,
        assigned_by=current_user.id,
        notes=assignment.notes,
        status="active"
    )
    db.add(db_assignment)
    
    db_asset = db.query(Asset).filter(Asset.id == assignment.asset_id).first()
    if db_asset:
        db_asset.status = "assigned"
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@app.get("/asset-assignments")
def get_asset_assignments(
    asset_id: Optional[int] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AssetAssignment)
    if asset_id:
        query = query.filter(AssetAssignment.asset_id == asset_id)
    if assigned_to:
        query = query.filter(AssetAssignment.assigned_to == assigned_to)
    return query.order_by(AssetAssignment.assigned_date.desc()).all()

@app.get("/asset-assignments/{assignment_id}", response_model=AssetAssignmentResponse)
def get_asset_assignment(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    assignment = db.query(AssetAssignment).filter(AssetAssignment.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@app.post("/asset-return-requests", response_model=AssetReturnRequestResponse)
def create_return_request(request: AssetReturnRequestCreate, db: Session = Depends(get_db)):
    db_request = AssetReturnRequest(
        asset_id=request.asset_id,
        requested_by=request.requested_by,
        request_type=request.request_type,
        reason=request.reason,
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@app.get("/asset-return-requests")
def get_return_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AssetReturnRequest)
    if status:
        query = query.filter(AssetReturnRequest.status == status)
    return query.order_by(AssetReturnRequest.requested_at.desc()).all()

@app.put("/asset-return-requests/{request_id}", response_model=AssetReturnRequestResponse)
def update_return_request(request_id: int, update: AssetReturnRequestUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_request = db.query(AssetReturnRequest).filter(AssetReturnRequest.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    if update.status:
        db_request.status = update.status
        if update.status in ["approved", "rejected"]:
            db_request.approved_by = current_user.id
            from datetime import datetime
            db_request.approved_at = datetime.utcnow()
        if update.admin_notes:
            db_request.admin_notes = update.admin_notes
        
        if update.status == "approved":
            db_asset = db.query(Asset).filter(Asset.id == db_request.asset_id).first()
            if db_asset:
                db_asset.status = "available"
            
            db_assignment = db.query(AssetAssignment).filter(
                AssetAssignment.asset_id == db_request.asset_id,
                AssetAssignment.status == "active"
            ).first()
            if db_assignment:
                db_assignment.status = "returned"
    
    db.commit()
    db.refresh(db_request)
    return db_request

@app.get("/")
def read_root():
    return {"message": "HRMS API is running"}

@app.get("/master-data")
def get_master_data(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    entries = db.query(MasterDataEntry).filter(MasterDataEntry.is_active == True).order_by(MasterDataEntry.category, MasterDataEntry.sort_order).all()
    
    result = {}
    for entry in entries:
        if entry.category not in result:
            result[entry.category] = []
        result[entry.category].append({"id": entry.id, "value": entry.value, "label": entry.label})
    
    if not result:
        seed_master_data(db)
        entries = db.query(MasterDataEntry).filter(MasterDataEntry.is_active == True).order_by(MasterDataEntry.category, MasterDataEntry.sort_order).all()
        for entry in entries:
            if entry.category not in result:
                result[entry.category] = []
            result[entry.category].append({"id": entry.id, "value": entry.value, "label": entry.label})
    
    result["departments"] = [{"id": d.id, "name": d.name} for d in db.query(Department).all()]
    return result

def seed_master_data(db: Session):
    default_data = [
        ("employee_status", "active", "Active", 1),
        ("employee_status", "on_leave", "On Leave", 2),
        ("employee_status", "terminated", "Terminated", 3),
        ("user_roles", "employee", "Employee", 1),
        ("user_roles", "hr", "HR", 2),
        ("user_roles", "manager", "Manager", 3),
        ("user_roles", "admin", "Admin", 4),
        ("user_roles", "intern", "Intern", 5),
        ("asset_status", "available", "Available", 1),
        ("asset_status", "assigned", "Assigned", 2),
        ("asset_status", "under_maintenance", "Under Maintenance", 3),
        ("asset_status", "retired", "Retired", 4),
        ("asset_types", "Laptop", "Laptop", 1),
        ("asset_types", "Desktop", "Desktop", 2),
        ("asset_types", "Mobile", "Mobile", 3),
        ("asset_types", "Tablet", "Tablet", 4),
        ("asset_types", "Monitor", "Monitor", 5),
        ("asset_types", "Keyboard", "Keyboard", 6),
        ("asset_types", "Mouse", "Mouse", 7),
        ("asset_types", "Headset", "Headset", 8),
        ("asset_types", "Printer", "Printer", 9),
        ("asset_types", "Other", "Other", 10),
        ("asset_categories", "Electronics", "Electronics", 1),
        ("asset_categories", "Furniture", "Furniture", 2),
        ("asset_categories", "Office Equipment", "Office Equipment", 3),
        ("asset_categories", "Software", "Software", 4),
        ("asset_categories", "Other", "Other", 5),
        ("return_request_types", "relieving", "Relieving (Leaving Company)", 1),
        ("return_request_types", "internship_complete", "Internship Completed", 2),
        ("return_request_types", "other", "Other", 3),
        ("job_status", "open", "Open", 1),
        ("job_status", "closed", "Closed", 2),
        ("job_status", "draft", "Draft", 3),
        ("employment_types", "full_time", "Full Time", 1),
        ("employment_types", "part_time", "Part Time", 2),
        ("employment_types", "contract", "Contract", 3),
        ("employment_types", "internship", "Internship", 4),
        ("applicant_status", "applied", "Applied", 1),
        ("applicant_status", "screening", "Screening", 2),
        ("applicant_status", "interview", "Interview", 3),
        ("applicant_status", "hired", "Hired", 4),
        ("applicant_status", "rejected", "Rejected", 5),
        ("leave_status", "pending", "Pending", 1),
        ("leave_status", "approved", "Approved", 2),
        ("leave_status", "rejected", "Rejected", 3),
        ("leave_types", "paid", "Paid Leave", 1),
        ("leave_types", "unpaid", "Unpaid Leave", 2),
        ("leave_types", "CO", "Compensatory Off (CO)", 3),
        ("intern_status", "pending", "Pending", 1),
        ("intern_status", "active", "Active", 2),
        ("intern_status", "completed", "Completed", 3),
        ("intern_status", "terminated", "Terminated", 4),
        ("holiday_types", "national", "National Holiday", 1),
        ("holiday_types", "festival", "Festival Holiday", 2),
        ("attendance_status", "present", "Present", 1),
        ("attendance_status", "late", "Late", 2),
        ("attendance_status", "absent", "Absent", 3),
        ("attendance_status", "leave", "On Leave", 4),
        ("training_types", "Technical", "Technical", 1),
        ("training_types", "Soft Skills", "Soft Skills", 2),
        ("training_types", "Compliance", "Compliance", 3),
        ("training_types", "Onboarding", "Onboarding", 4),
        ("training_status", "upcoming", "Upcoming", 1),
        ("training_status", "ongoing", "Ongoing", 2),
        ("training_status", "completed", "Completed", 3),
        ("training_status", "cancelled", "Cancelled", 4),
        ("timezones", "Asia/Kolkata", "Asia/Kolkata (IST)", 1),
        ("timezones", "America/New_York", "America/New_York (EST)", 2),
        ("timezones", "Europe/London", "Europe/London (GMT)", 3),
    ]
    
    for cat, val, lbl, order in default_data:
        existing = db.query(MasterDataEntry).filter(
            MasterDataEntry.category == cat,
            MasterDataEntry.value == val
        ).first()
        if not existing:
            entry = MasterDataEntry(category=cat, value=val, label=lbl, sort_order=order)
            db.add(entry)
    db.commit()

@app.post("/master-data", response_model=MasterDataEntryResponse)
def create_master_data(entry: MasterDataEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    existing = db.query(MasterDataEntry).filter(
        MasterDataEntry.category == entry.category,
        MasterDataEntry.value == entry.value
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Entry with this value already exists")
    
    db_entry = MasterDataEntry(**entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.put("/master-data/{entry_id}", response_model=MasterDataEntryResponse)
def update_master_data(entry_id: int, entry: MasterDataEntryUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_entry = db.query(MasterDataEntry).filter(MasterDataEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    for key, value in entry.dict(exclude_unset=True).items():
        setattr(db_entry, key, value)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.delete("/master-data/{entry_id}")
def delete_master_data(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_entry = db.query(MasterDataEntry).filter(MasterDataEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db_entry.is_active = False
    db.commit()
    return {"message": "Entry deleted successfully"}

ALL_PERMISSIONS = [
    {"key": "users", "label": "User Management"},
    {"key": "employees", "label": "Employees"},
    {"key": "attendance", "label": "Attendance"},
    {"key": "leave", "label": "Leave Management"},
    {"key": "holidays", "label": "Holidays"},
    {"key": "reports", "label": "Reports"},
    {"key": "recruitment", "label": "Recruitment"},
    {"key": "assets", "label": "Office Assets"},
    {"key": "interns", "label": "Interns"},
    {"key": "training", "label": "Training Events"},
    {"key": "training_assignments", "label": "Training Tasks"},
    {"key": "settings", "label": "Settings"},
    {"key": "master_data", "label": "Master Data"},
]

@app.get("/permissions")
def get_all_permissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ALL_PERMISSIONS

@app.get("/users/{user_id}/permissions", response_model=List[UserPermissionResponse])
def get_user_permissions(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    perms = db.query(UserPermission).filter(UserPermission.user_id == user_id).all()
    if not perms:
        return []
    return perms

@app.post("/users/{user_id}/permissions", response_model=List[UserPermissionResponse])
def set_user_permissions(
    user_id: int, 
    permissions: List[UserPermissionCreate], 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("admin"))
):
    db.query(UserPermission).filter(UserPermission.user_id == user_id).delete()
    for perm in permissions:
        db_perm = UserPermission(
            user_id=user_id,
            permission_key=perm.permission_key,
            can_read=perm.can_read,
            can_create=perm.can_create,
            can_update=perm.can_update,
            can_delete=perm.can_delete,
            granted_by=current_user.id
        )
        db.add(db_perm)
    db.commit()
    return db.query(UserPermission).filter(UserPermission.user_id == user_id).all()

def check_permission(user: User, permission_key: str, action: str = "read") -> bool:
    if user.role == "admin":
        return True
    if user.role in ["hr", "manager"]:
        return True
    perm = db.query(UserPermission).filter(
        UserPermission.user_id == user.id,
        UserPermission.permission_key == permission_key
    ).first()
    if not perm:
        return user.role != "employee"
    return getattr(perm, f"can_{action}", False)

# External DB MySQL connection (Hostinger)
def get_external_db():
    try:
        import pymysql
        # Try common Hostinger MySQL hostname patterns
        hosts_to_try = [
            "mysql3131258.hostingerserve.com",  # Common Hostinger pattern
            "localhost",
            "127.0.0.1",
            os.environ.get("EXTERNAL_DB_HOST", "localhost")
        ]
        
        for host in hosts_to_try:
            try:
                connection = pymysql.connect(
                    host=host,
                    user=os.environ.get("EXTERNAL_DB_USER", "u313852103_gradyen"),
                    password=os.environ.get("EXTERNAL_DB_PASS", "*Q==EV8zV"),
                    database=os.environ.get("EXTERNAL_DB_NAME", "u313852103_gradyens"),
                    cursorclass=pymysql.cursors.DictCursor,
                    connect_timeout=5
                )
                print(f"Connected to external DB at: {host}")
                return connection
            except Exception as e:
                continue
        
        return None
    except ImportError:
        print("pymysql not installed")
        return None
    except Exception as e:
        print(f"External DB connection error: {e}")
        return None

@app.get("/inquiries", response_model=List[InquiryResponse])
def get_inquiries(status_filter: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    query = db.query(Inquiry)
    if status_filter and status_filter != "all":
        query = query.filter(Inquiry.status == status_filter)
    return query.order_by(Inquiry.submitted_date.desc()).all()

@app.put("/inquiries/{inquiry_id}", response_model=InquiryResponse)
def update_inquiry(inquiry_id: int, inquiry: InquiryUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin", "hr"))):
    db_inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not db_inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    if inquiry.status:
        db_inquiry.status = inquiry.status
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry

@app.delete("/inquiries/{inquiry_id}")
def delete_inquiry(inquiry_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    db_inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not db_inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    db.delete(db_inquiry)
    db.commit()
    return {"message": "Inquiry deleted successfully"}

@app.post("/inquiries/sync")
def sync_inquiries(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    external_db = get_external_db()
    if not external_db:
        return {"message": "Could not connect to external database"}
    
    try:
        with external_db.cursor() as cursor:
            cursor.execute("SELECT id, Name, email, description, submitted_date FROM inquiries")
            external_inquiries = cursor.fetchall()
        
        synced_count = 0
        for ext_inq in external_inquiries:
            existing = db.query(Inquiry).filter(Inquiry.external_id == ext_inq["id"]).first()
            if not existing:
                new_inquiry = Inquiry(
                    external_id=ext_inq["id"],
                    name=ext_inq["Name"],
                    email=ext_inq["email"],
                    description=ext_inq["description"],
                    submitted_date=ext_inq["submitted_date"],
                    synced_at=datetime.utcnow()
                )
                db.add(new_inquiry)
                synced_count += 1
        
        db.commit()
        return {"message": f"Synced {synced_count} new inquiries"}
    finally:
        external_db.close()

@app.post("/inquiries/submit", response_model=InquiryResponse)
def submit_inquiry(inquiry: InquiryCreate, db: Session = Depends(get_db)):
    db_inquiry = Inquiry(**inquiry.model_dump())
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry