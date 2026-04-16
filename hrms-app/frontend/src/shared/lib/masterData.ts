export const MASTER_DATA = {
  // Employee Status
  employeeStatus: [
    { value: "active", label: "Active" },
    { value: "on_leave", label: "On Leave" },
    { value: "terminated", label: "Terminated" },
  ],

  // User Roles
  userRoles: [
    { value: "employee", label: "Employee" },
    { value: "hr", label: "HR" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Admin" },
    { value: "intern", label: "Intern" },
  ],

  // Asset Status
  assetStatus: [
    { value: "available", label: "Available" },
    { value: "assigned", label: "Assigned" },
    { value: "under_maintenance", label: "Under Maintenance" },
    { value: "retired", label: "Retired" },
  ],

  // Asset Types
  assetTypes: [
    { value: "Laptop", label: "Laptop" },
    { value: "Desktop", label: "Desktop" },
    { value: "Mobile", label: "Mobile" },
    { value: "Tablet", label: "Tablet" },
    { value: "Monitor", label: "Monitor" },
    { value: "Keyboard", label: "Keyboard" },
    { value: "Mouse", label: "Mouse" },
    { value: "Headset", label: "Headset" },
    { value: "Printer", label: "Printer" },
    { value: "Other", label: "Other" },
  ],

  // Asset Categories
  assetCategories: [
    { value: "Electronics", label: "Electronics" },
    { value: "Furniture", label: "Furniture" },
    { value: "Office Equipment", label: "Office Equipment" },
    { value: "Software", label: "Software" },
    { value: "Other", label: "Other" },
  ],

  // Return Request Types
  returnRequestTypes: [
    { value: "relieving", label: "Relieving (Leaving Company)" },
    { value: "internship_complete", label: "Internship Completed" },
    { value: "other", label: "Other" },
  ],

  // Job Status
  jobStatus: [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "draft", label: "Draft" },
  ],

  // Employment Types
  employmentTypes: [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
  ],

  // Applicant Status
  applicantStatus: [
    { value: "applied", label: "Applied" },
    { value: "screening", label: "Screening" },
    { value: "interview", label: "Interview" },
    { value: "hired", label: "Hired" },
    { value: "rejected", label: "Rejected" },
  ],

  // Leave Request Status
  leaveStatus: [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],

  // Intern Status
  internStatus: [
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "terminated", label: "Terminated" },
  ],

  // Holiday Types
  holidayTypes: [
    { value: "national", label: "National Holiday" },
    { value: "festival", label: "Festival Holiday" },
  ],

  // Leave Types
  leaveTypes: [
    { value: "paid", label: "Paid Leave" },
    { value: "unpaid", label: "Unpaid Leave" },
  ],

  // Attendance Status
  attendanceStatus: [
    { value: "present", label: "Present" },
    { value: "late", label: "Late" },
    { value: "absent", label: "Absent" },
    { value: "leave", label: "On Leave" },
  ],

  // Training Types
  trainingTypes: [
    { value: "Technical", label: "Technical" },
    { value: "Soft Skills", label: "Soft Skills" },
    { value: "Compliance", label: "Compliance" },
    { value: "Onboarding", label: "Onboarding" },
  ],

  // Training Status
  trainingStatus: [
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ],

  // Timezones
  timezones: [
    { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
    { value: "America/New_York", label: "America/New_York (EST)" },
    { value: "Europe/London", label: "Europe/London (GMT)" },
  ],

  // Report Periods
  reportPeriods: [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
  ],

  // Years
  years: [
    { value: "2026", label: "2026" },
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
    { value: "2023", label: "2023" },
  ],
}

export type MasterDataKey = keyof typeof MASTER_DATA