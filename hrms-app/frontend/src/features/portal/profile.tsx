import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/shared/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Separator } from "@/shared/ui/separator"
import { 
  User, Calendar, Clock, CheckCircle, XCircle, Mail, Phone, Building
} from "lucide-react"

const API_URL = "http://localhost:8000"

interface UserProfile {
  id: number
  email: string
  name: string
  role: string
  is_active: boolean
}

interface Employee {
  id: number
  employee_code: string
  first_name: string
  last_name?: string
  phone?: string
  department_id?: number
  designation?: string
  status: string
}

interface Department {
  id: number
  name: string
}

interface Attendance {
  id: number
  date: string
  check_in: string | null
  check_out: string | null
  source: string
}

interface LeaveRequest {
  id: number
  leave_type_id: number
  start_date: string
  end_date: string
  reason: string
  status: string
}

interface LeaveType {
  id: number
  name: string
  code: string
  annual_quota: number
}

export default function EmployeePortal() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getToken = () => localStorage.getItem("token")

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    fetchProfileData()
  }, [user])

  const fetchProfileData = async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      
      // Fetch user profile
      const userRes = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        setProfile(userData)
        
        // If employee, fetch employee details
        if (userData.role === "employee" || userData.role === "hr" || userData.role === "manager") {
          const empRes = await fetch(`${API_URL}/employees`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (empRes.ok) {
            const employees = await empRes.json()
            const myEmp = employees.find((e: Employee) => e.id === userData.id)
            if (myEmp) {
              setEmployee(myEmp)
              // Fetch department
              if (myEmp.department_id) {
                const deptRes = await fetch(`${API_URL}/departments`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
                if (deptRes.ok) {
                  const depts = await deptRes.json()
                  const myDept = depts.find((d: Department) => d.id === myEmp.department_id)
                  setDepartment(myDept)
                }
              }
            }
          }
        }
      }

      // Fetch attendance
      const attendRes = await fetch(`${API_URL}/attendances`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (attendRes.ok) {
        setAttendances(await attendRes.json())
      }

      // Fetch leave requests
      const leaveRes = await fetch(`${API_URL}/leave-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (leaveRes.ok) {
        setLeaveRequests(await leaveRes.json())
      }

      // Fetch leave types
      const leaveTypeRes = await fetch(`${API_URL}/leave-types`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (leaveTypeRes.ok) {
        setLeaveTypes(await leaveTypeRes.json())
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.name}!</p>
        </div>
        <Badge variant={profile?.role === "admin" ? "destructive" : profile?.role === "hr" ? "secondary" : "default"}>
          {profile?.role}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:row-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile?.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{profile?.name}</h2>
              <p className="text-muted-foreground">{profile?.email}</p>
              {employee && (
                <p className="text-sm text-muted-foreground mt-1">{employee.designation}</p>
              )}
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.email}</span>
              </div>
              {employee?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
              {employee && (
                <div className="flex items-center gap-3 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{department?.name || "No Department"}</span>
                </div>
              )}
              {employee && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Code: {employee.employee_code}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Present</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Check-in: 09:15 AM</p>
                  <p className="text-sm text-muted-foreground">Check-out: 06:30 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Balance
              </CardTitle>
              <CardDescription>Your available leave days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {leaveTypes.map((lt) => (
                  <div key={lt.id} className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{lt.annual_quota}</p>
                    <p className="text-sm text-muted-foreground">{lt.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">Attendance History</TabsTrigger>
          <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {attendances.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No attendance records found</p>
              ) : (
                <div className="space-y-4">
                  {attendances.slice(0, 10).map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          att.check_in ? "bg-success/20" : "bg-destructive/20"
                        }`}>
                          {att.check_in ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{att.date}</p>
                          <p className="text-sm text-muted-foreground">{att.source}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{att.check_in || "-"} - {att.check_out || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card>
            <CardHeader>
              <CardTitle>My Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No leave requests found</p>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((lr) => (
                    <div key={lr.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">
                          {leaveTypes.find((lt) => lt.id === lr.leave_type_id)?.name || "Leave"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lr.start_date} to {lr.end_date}
                        </p>
                        {lr.reason && <p className="text-sm text-muted-foreground mt-1">{lr.reason}</p>}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[lr.status]}`}>
                        {lr.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}