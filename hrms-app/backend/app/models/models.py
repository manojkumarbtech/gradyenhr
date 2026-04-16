from sqlalchemy import Column, String, Integer, Date, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    hr = "hr"
    manager = "manager"
    employee = "employee"
    intern = "intern"

class EmployeeStatus(str, enum.Enum):
    active = "active"
    on_leave = "on_leave"
    terminated = "terminated"

class InternStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    completed = "completed"
    terminated = "terminated"

class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class AttendanceSource(str, enum.Enum):
    web = "web"
    biometric = "biometric"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.employee)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="user", uselist=False)

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    employees = relationship("Employee", back_populates="department")
    interns = relationship("Intern", back_populates="department")

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    employee_code = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String)
    phone = Column(String)
    department_id = Column(Integer, ForeignKey("departments.id"))
    designation = Column(String)
    date_of_join = Column(Date)
    date_of_birth = Column(Date)
    profile_image = Column(String)
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.active)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="employee")
    department = relationship("Department", back_populates="employees")
    attendances = relationship("Attendance", back_populates="employee")
    leave_requests = relationship("LeaveRequest", back_populates="employee")
    leave_balances = relationship("LeaveBalance", back_populates="employee")

class Intern(Base):
    __tablename__ = "interns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    college = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    year = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    mentor_id = Column(Integer, ForeignKey("employees.id"))
    intern_start_date = Column(Date, nullable=False)
    intern_end_date = Column(Date, nullable=False)
    status = Column(Enum(InternStatus), default=InternStatus.pending)
    offer_letter_url = Column(String)
    certificate_url = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="interns")
    mentor = relationship("Employee")

class LeaveType(Base):
    __tablename__ = "leave_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    description = Column(Text)
    is_paid = Column(Boolean, default=True)
    annual_quota = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    balances = relationship("LeaveBalance", back_populates="leave_type")
    requests = relationship("LeaveRequest", back_populates="leave_type")

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    year = Column(Integer, nullable=False)
    balance = Column(Integer, default=0)
    used = Column(Integer, default=0)

    employee = relationship("Employee", back_populates="leave_balances")
    leave_type = relationship("LeaveType", back_populates="balances")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.pending)
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    work_date = Column(Date)  # Date for which comp-off is claimed (Saturday/Sunday)
    created_at = Column(DateTime, server_default=func.now())

    employee = relationship("Employee", back_populates="leave_requests")
    leave_type = relationship("LeaveType", back_populates="requests")

class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    source = Column(Enum(AttendanceSource), default=AttendanceSource.web)
    device_id = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    employee = relationship("Employee", back_populates="attendances")

class TrainingEvent(Base):
    __tablename__ = "training_events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    event_type = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    venue = Column(String)
    max_participants = Column(Integer, default=0)
    status = Column(String, default="upcoming")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    registrations = relationship("TrainingRegistration", back_populates="event")
    attendances = relationship("TrainingAttendance", back_populates="event")

class TrainingRegistration(Base):
    __tablename__ = "training_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("training_events.id"), nullable=False)
    participant_id = Column(Integer, nullable=False)
    participant_type = Column(String, default="employee")
    status = Column(String, default="pending")
    registration_date = Column(DateTime, server_default=func.now())

    event = relationship("TrainingEvent", back_populates="registrations")

class TrainingAttendance(Base):
    __tablename__ = "training_attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("training_events.id"), nullable=False)
    participant_id = Column(Integer, nullable=False)
    participant_type = Column(String, default="employee")
    check_in_time = Column(DateTime)
    feedback_submitted = Column(Boolean, default=False)
    rating = Column(Integer)
    feedback = Column(Text)

    event = relationship("TrainingEvent", back_populates="attendances")

class TrainingAssignment(Base):
    __tablename__ = "training_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    intern_id = Column(Integer, ForeignKey("interns.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    assignment_type = Column(String, nullable=False)  # coding_test, task, project
    due_date = Column(Date, nullable=False)
    max_score = Column(Integer, default=100)
    status = Column(String, default="pending")  # pending, submitted, graded
    submitted_at = Column(DateTime)
    submitted_content = Column(Text)
    score = Column(Integer)
    feedback = Column(Text)
    assigned_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

class MasterDataEntry(Base):
    __tablename__ = "master_data"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)
    value = Column(String, nullable=False)
    label = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    day = Column(String, nullable=False)
    is_national_holiday = Column(Boolean, default=True)
    description = Column(Text)
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class JobPosting(Base):
    __tablename__ = "job_postings"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    description = Column(Text)
    requirements = Column(Text)
    location = Column(String)
    employment_type = Column(String, default="full_time")
    experience_required = Column(String)
    salary_range = Column(String)
    status = Column(String, default="open")
    posted_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deadline = Column(Date)

class Applicant(Base):
    __tablename__ = "applicants"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    resume_url = Column(String)
    cover_letter = Column(Text)
    status = Column(String, default="applied")
    applied_at = Column(DateTime, server_default=func.now())
    notes = Column(Text)

    job = relationship("JobPosting")

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text)
    serial_number = Column(String, unique=True)
    purchase_date = Column(Date)
    purchase_cost = Column(String)
    warranty_expiry = Column(Date)
    status = Column(String, default="available")
    location = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    assignments = relationship("AssetAssignment", back_populates="asset")
    return_requests = relationship("AssetReturnRequest", back_populates="asset")

class AssetCategory(Base):
    __tablename__ = "asset_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class AssetAssignment(Base):
    __tablename__ = "asset_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    assigned_to = Column(Integer, nullable=False)
    assigned_type = Column(String, default="employee")  # employee or intern
    assigned_date = Column(DateTime, server_default=func.now())
    assigned_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="active")
    notes = Column(Text)
    
    asset = relationship("Asset")

class AssetReturnRequest(Base):
    __tablename__ = "asset_return_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    requested_by = Column(Integer, nullable=False)
    request_type = Column(String, nullable=False)  # relieving, internship_complete, other
    reason = Column(Text)
    status = Column(String, default="pending")  # pending, approved, rejected
    requested_at = Column(DateTime, server_default=func.now())
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    admin_notes = Column(Text)
    
    asset = relationship("Asset")

class UserPermission(Base):
    __tablename__ = "user_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    permission_key = Column(String, nullable=False)
    can_read = Column(Boolean, default=True)
    can_create = Column(Boolean, default=False)
    can_update = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    granted_by = Column(Integer, ForeignKey("users.id"))
    granted_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User", foreign_keys=[user_id])

class Inquiry(Base):
    __tablename__ = "inquiries"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, nullable=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="new")  # new, in_progress, resolved
    submitted_date = Column(DateTime, server_default=func.now())
    synced_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())