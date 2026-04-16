from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    hr = "hr"
    manager = "manager"
    employee = "employee"
    intern = "intern"

class UserBase(BaseModel):
    email: str
    name: str
    role: UserRole = UserRole.employee

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    date_of_join: Optional[date] = None
    date_of_birth: Optional[date] = None

class EmployeeCreate(EmployeeBase):
    user_id: int
    employee_code: str

class EmployeeSimpleCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    status: Optional[str] = "active"
    date_of_join: Optional[date] = None

class EmployeeWithUserResponse(BaseModel):
    id: int
    user_id: int
    employee_code: str
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    date_of_join: Optional[date] = None
    date_of_birth: Optional[date] = None
    profile_image: Optional[str] = None
    status: str
    created_at: datetime
    name: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        from_attributes = True

class EmployeeUpdate(EmployeeBase):
    status: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int
    employee_code: str
    profile_image: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class InternBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    college: str
    degree: str
    year: str
    department_id: Optional[int] = None
    mentor_id: Optional[int] = None
    intern_start_date: date
    intern_end_date: date

class InternCreate(InternBase):
    pass

class InternUpdate(InternBase):
    status: Optional[str] = None

class InternResponse(InternBase):
    id: int
    status: str
    offer_letter_url: Optional[str] = None
    certificate_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class LeaveTypeBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    is_paid: bool = True
    annual_quota: int = 0

class LeaveTypeCreate(LeaveTypeBase):
    pass

class LeaveTypeResponse(LeaveTypeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class LeaveRequestBase(BaseModel):
    employee_id: int
    leave_type_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None
    work_date: Optional[date] = None  # Date for comp-off claim

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    employee_id: int
    status: str
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    employee_id: int
    date: date

class AttendanceCreate(AttendanceBase):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None

class AttendanceResponse(AttendanceBase):
    id: int
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    source: str
    device_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TrainingEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str
    start_date: date
    end_date: date
    venue: Optional[str] = None
    max_participants: int = 0

class TrainingEventCreate(TrainingEventBase):
    pass

class TrainingEventUpdate(TrainingEventBase):
    status: Optional[str] = None

class TrainingEventResponse(TrainingEventBase):
    id: int
    status: str
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TrainingAssignmentBase(BaseModel):
    intern_id: int
    title: str
    description: Optional[str] = None
    assignment_type: str  # coding_test, task, project
    due_date: date
    max_score: int = 100

class TrainingAssignmentCreate(TrainingAssignmentBase):
    pass

class TrainingAssignmentUpdate(BaseModel):
    status: Optional[str] = None
    submitted_content: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None

class TrainingAssignmentResponse(TrainingAssignmentBase):
    id: int
    status: str
    submitted_at: Optional[datetime] = None
    submitted_content: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    assigned_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

class HolidayBase(BaseModel):
    name: str
    date: date
    day: str
    is_national_holiday: bool = True
    description: Optional[str] = None

class HolidayCreate(HolidayBase):
    year: int

class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[date] = None
    day: Optional[str] = None
    is_national_holiday: Optional[bool] = None
    description: Optional[str] = None

class HolidayResponse(HolidayBase):
    id: int
    year: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class JobPostingBase(BaseModel):
    title: str
    department: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    employment_type: str = "full_time"
    experience_required: Optional[str] = None
    salary_range: Optional[str] = None

class JobPostingCreate(JobPostingBase):
    deadline: Optional[date] = None

class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_required: Optional[str] = None
    salary_range: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[date] = None

class JobPostingResponse(JobPostingBase):
    id: int
    status: str
    posted_by: Optional[int] = None
    created_at: datetime
    deadline: Optional[date] = None
    
    class Config:
        from_attributes = True

class ApplicantBase(BaseModel):
    job_id: int
    name: str
    email: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class ApplicantResponse(ApplicantBase):
    id: int
    status: str
    applied_at: datetime
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

class AssetBase(BaseModel):
    name: str
    asset_type: str
    category: str
    description: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[str] = None
    warranty_expiry: Optional[date] = None
    status: str = "available"
    location: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[str] = None
    warranty_expiry: Optional[date] = None
    status: Optional[str] = None
    location: Optional[str] = None
    assigned_to: Optional[int] = None
    assigned_date: Optional[date] = None

class AssetResponse(AssetBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AssetAssignmentBase(BaseModel):
    asset_id: int
    assigned_to: int
    assigned_type: str = "employee"
    notes: Optional[str] = None

class AssetAssignmentCreate(AssetAssignmentBase):
    assigned_by: Optional[int] = None

class AssetAssignmentResponse(AssetAssignmentBase):
    id: int
    assigned_date: datetime
    status: str
    assigned_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class AssetReturnRequestBase(BaseModel):
    asset_id: int
    request_type: str
    reason: Optional[str] = None

class AssetReturnRequestCreate(AssetReturnRequestBase):
    requested_by: int

class AssetReturnRequestUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None

class AssetReturnRequestResponse(BaseModel):
    id: int
    asset_id: int
    requested_by: int
    request_type: str
    reason: Optional[str] = None
    status: str
    requested_at: datetime
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    
    class Config:
        from_attributes = True

class MasterDataEntryBase(BaseModel):
    category: str
    value: str
    label: str
    sort_order: int = 0
    is_active: bool = True

class MasterDataEntryCreate(MasterDataEntryBase):
    pass

class MasterDataEntryUpdate(BaseModel):
    value: Optional[str] = None
    label: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class MasterDataEntryResponse(MasterDataEntryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserPermissionBase(BaseModel):
    permission_key: str

class UserPermissionCreate(UserPermissionBase):
    user_id: Optional[int] = None
    can_read: bool = True
    can_create: bool = False
    can_update: bool = False
    can_delete: bool = False

class UserPermissionUpdate(BaseModel):
    can_read: Optional[bool] = None
    can_create: Optional[bool] = None
    can_update: Optional[bool] = None
    can_delete: Optional[bool] = None

class UserPermissionResponse(UserPermissionBase):
    id: int
    can_read: bool
    can_create: bool
    can_update: bool
    can_delete: bool
    granted_by: Optional[int] = None
    granted_at: datetime
    
    class Config:
        from_attributes = True

class InquiryBase(BaseModel):
    name: str
    email: str
    description: Optional[str] = None

class InquiryCreate(InquiryBase):
    pass

class InquiryUpdate(BaseModel):
    status: Optional[str] = None

class InquiryResponse(InquiryBase):
    id: int
    external_id: Optional[int] = None
    status: str
    submitted_date: datetime
    synced_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True