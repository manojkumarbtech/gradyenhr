const API_URL = "http://localhost:8000"

function getToken() {
  const token = localStorage.getItem("token")
  console.log("Getting token:", token ? "present" : "missing")
  return token
}

function getHeaders() {
  const token = getToken()
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  console.log("Headers:", headers)
  return headers
}

export const api = {
  get: async (endpoint: string) => {
    const url = `${API_URL}${endpoint}`
    console.log(`GET ${url}`, getHeaders())
    const response = await fetch(url, { headers: getHeaders() })
    console.log(`GET ${endpoint} status:`, response.status)
    if (!response.ok) {
      const error = await response.text()
      console.error(`GET ${endpoint} error:`, error)
      throw new Error(error || "Failed to fetch")
    }
    return response.json()
  },

  post: async (endpoint: string, data: unknown) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || "Failed to create")
    }
    return response.json()
  },

  put: async (endpoint: string, data: unknown) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || "Failed to update")
    }
    return response.json()
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || "Failed to delete")
    }
    return response.json()
  },
}

export const employeesApi = {
  getAll: () => api.get("/employees"),
  getById: (id: number) => api.get(`/employees/${id}`),
  create: (data: unknown) => api.post("/employees/simple", data),
  update: (id: number, data: unknown) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
}

export const usersApi = {
  getAll: () => api.get("/users"),
  getMe: () => api.get("/users/me"),
  create: (data: unknown) => api.post("/register", data),
  update: (id: number, data: unknown) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
}

export const internsApi = {
  getAll: (status?: string) => api.get(`/interns${status ? `?status_filter=${status}` : ""}`),
  getById: (id: number) => api.get(`/interns/${id}`),
  create: (data: unknown) => api.post("/interns", data),
  update: (id: number, data: unknown) => api.put(`/interns/${id}`, data),
  delete: (id: number) => api.delete(`/interns/${id}`),
}

export const departmentsApi = {
  getAll: () => api.get("/departments"),
  create: (data: unknown) => api.post("/departments", data),
  update: (id: number, data: unknown) => api.put(`/departments/${id}`, data),
  delete: (id: number) => api.delete(`/departments/${id}`),
}

export const leaveTypesApi = {
  getAll: () => api.get("/leave-types"),
  create: (data: unknown) => api.post("/leave-types", data),
  update: (id: number, data: unknown) => api.put(`/leave-types/${id}`, data),
  delete: (id: number) => api.delete(`/leave-types/${id}`),
}

export const leaveApi = {
  getAll: (params?: string) => api.get(`/leave-requests${params ? `?${params}` : ""}`),
  create: (data: unknown) => api.post("/leave-requests", data),
  update: (id: number, data: unknown) => api.put(`/leave-requests/${id}`, data),
  getBalances: (employeeId?: number) => api.get(`/leave-balances${employeeId ? `?employee_id=${employeeId}` : ""}`),
}

export const holidaysApi = {
  getAll: (year?: number) => api.get(`/holidays${year ? `?year=${year}` : ""}`),
  getById: (id: number) => api.get(`/holidays/${id}`),
  create: (data: unknown) => api.post("/holidays", data),
  update: (id: number, data: unknown) => api.put(`/holidays/${id}`, data),
  delete: (id: number) => api.delete(`/holidays/${id}`),
}

export const reportsApi = {
  getAttendance: (params?: string) => api.get(`/reports/attendance${params ? `?${params}` : ""}`),
  getLeave: (params?: string) => api.get(`/reports/leave${params ? `?${params}` : ""}`),
  getEmployees: (params?: string) => api.get(`/reports/employees${params ? `?${params}` : ""}`),
  getDashboardSummary: () => api.get("/reports/dashboard-summary"),
}

export const recruitmentApi = {
  getJobs: () => api.get("/job-postings"),
  createJob: (data: unknown) => api.post("/job-postings", data),
  updateJob: (id: number, data: unknown) => api.put(`/job-postings/${id}`, data),
  deleteJob: (id: number) => api.delete(`/job-postings/${id}`),
  getApplicants: (jobId?: number) => api.get(`/applicants${jobId ? `?job_id=${jobId}` : ""}`),
  createApplicant: (data: unknown) => api.post("/applicants", data),
  updateApplicant: (id: number, data: unknown) => api.put(`/applicants/${id}`, data),
}

export const assetsApi = {
  getAll: () => api.get("/assets"),
  create: (data: unknown) => api.post("/assets", data),
  update: (id: number, data: unknown) => api.put(`/assets/${id}`, data),
  delete: (id: number) => api.delete(`/assets/${id}`),
  assign: (data: unknown) => api.post("/asset-assignments", data),
  getAssignments: () => api.get("/asset-assignments"),
  requestReturn: (data: unknown) => api.post("/asset-return-requests", data),
  getReturnRequests: () => api.get("/asset-return-requests"),
  updateReturnRequest: (id: number, data: unknown) => api.put(`/asset-return-requests/${id}`, data),
}

export const attendanceApi = {
  getAll: (params?: string) => api.get(`/attendances${params ? `?${params}` : ""}`),
  create: (data: unknown) => api.post("/attendances", data),
  update: (id: number, data: unknown) => api.put(`/attendances/${id}`, data),
}

export const trainingApi = {
  getEvents: () => api.get("/training-events"),
  getAll: () => api.get("/training-events"),
  createEvent: (data: unknown) => api.post("/training-events", data),
  create: (data: unknown) => api.post("/training-events", data),
  updateEvent: (id: number, data: unknown) => api.put(`/training-events/${id}`, data),
  update: (id: number, data: unknown) => api.put(`/training-events/${id}`, data),
  deleteEvent: (id: number) => api.delete(`/training-events/${id}`),
  delete: (id: number) => api.delete(`/training-events/${id}`),
  // Training assignments for interns
  getAssignments: (internId?: number) => api.get(`/training-assignments${internId ? `?intern_id=${internId}` : ""}`),
  createAssignment: (data: unknown) => api.post("/training-assignments", data),
  updateAssignment: (id: number, data: unknown) => api.put(`/training-assignments/${id}`, data),
  deleteAssignment: (id: number) => api.delete(`/training-assignments/${id}`),
}

export const masterDataApi = {
  getAll: () => api.get("/master-data"),
  create: (data: unknown) => api.post("/master-data", data),
  update: (id: number, data: unknown) => api.put(`/master-data/${id}`, data),
  delete: (id: number) => api.delete(`/master-data/${id}`),
}

export const permissionsApi = {
  getAll: () => api.get("/permissions"),
  getUserPermissions: (userId: number) => api.get(`/users/${userId}/permissions`),
  setUserPermissions: (userId: number, data: unknown) => api.post(`/users/${userId}/permissions`, data),
}

export const inquiriesApi = {
  getAll: (status?: string) => api.get(`/inquiries${status ? `?status_filter=${status}` : ""}`),
  update: (id: number, data: unknown) => api.put(`/inquiries/${id}`, data),
  delete: (id: number) => api.delete(`/inquiries/${id}`),
  sync: () => api.post("/inquiries/sync", {}),
  submit: (data: unknown) => api.post("/inquiries/submit", data),
}