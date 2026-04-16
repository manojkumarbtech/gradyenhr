import { useState, useEffect } from "react"
import { subDays } from "date-fns"
import { Users, Clock, Download, TrendingUp, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { reportsApi } from "@/shared/lib/api"

interface AttendanceReport {
  total_employees: number
  total_present: number
  total_absent: number
  attendance_percentage: number
  working_days: number
  details: Array<{
    employee_id: number
    employee_name: string
    present: number
    absent: number
    percentage: number
  }>
}

interface LeaveReport {
  year: number
  total_requests: number
  pending: number
  approved: number
  rejected: number
  by_type: Record<string, number>
}

interface EmployeeReport {
  total_employees: number
  total_interns: number
  by_status: Record<string, number>
  by_department: Record<string, number>
  interns_by_status: Record<string, number>
}

interface DashboardSummary {
  total_employees: number
  total_interns: number
  total_departments: number
  present_today: number
  total_on_leave: number
  pending_leaves: number
  upcoming_training: number
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("attendance")
  const [loading, setLoading] = useState(true)
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReport | null>(null)
  const [leaveReport, setLeaveReport] = useState<LeaveReport | null>(null)
  const [employeeReport, setEmployeeReport] = useState<EmployeeReport | null>(null)
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [dateRange, setDateRange] = useState("7")
  const [year, setYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    fetchReports()
  }, [dateRange, year])

  async function fetchReports() {
    setLoading(true)
    try {
      const startDate = subDays(new Date(), parseInt(dateRange)).toISOString().split("T")[0]
      const endDate = new Date().toISOString().split("T")[0]
      
      const [att, leave, emp, summary] = await Promise.all([
        reportsApi.getAttendance(`start_date=${startDate}&end_date=${endDate}`),
        reportsApi.getLeave(`year=${year}`),
        reportsApi.getEmployees(),
        reportsApi.getDashboardSummary(),
      ])
      
      setAttendanceReport(att as AttendanceReport)
      setLeaveReport(leave as LeaveReport)
      setEmployeeReport(emp as EmployeeReport)
      setDashboardSummary(summary as DashboardSummary)
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">View attendance, leave, and employee reports.</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardSummary?.total_employees || 0}</div>
            <p className="text-xs text-muted-foreground">{dashboardSummary?.total_interns || 0} interns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{dashboardSummary?.present_today || 0}</div>
            <p className="text-xs text-muted-foreground">{dashboardSummary?.total_on_leave || 0} on leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{dashboardSummary?.pending_leaves || 0}</div>
            <p className="text-xs text-muted-foreground">awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <BarChart3 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardSummary?.total_departments || 0}</div>
            <p className="text-xs text-muted-foreground">{dashboardSummary?.upcoming_training || 0} upcoming training</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {attendanceReport?.attendance_percentage || 0}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Present</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-success">
                      {attendanceReport?.total_present || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-destructive">
                      {attendanceReport?.total_absent || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Employee Attendance Details</CardTitle>
                  <CardDescription>Last {dateRange} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium">Employee</th>
                          <th className="text-left p-4 font-medium">Present</th>
                          <th className="text-left p-4 font-medium">Absent</th>
                          <th className="text-left p-4 font-medium">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceReport?.details?.map((emp) => (
                          <tr key={emp.employee_id} className="border-t">
                            <td className="p-4 font-medium">{emp.employee_name}</td>
                            <td className="p-4 text-success">{emp.present}</td>
                            <td className="p-4 text-destructive">{emp.absent}</td>
                            <td className="p-4">
                              <Badge variant={emp.percentage >= 75 ? "success" : emp.percentage >= 50 ? "warning" : "destructive"}>
                                {emp.percentage}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {(!attendanceReport?.details || attendanceReport.details.length === 0) && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
                              No attendance data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{leaveReport?.total_requests || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-warning">{leaveReport?.pending || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-success">{leaveReport?.approved || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-destructive">{leaveReport?.rejected || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Leave by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {leaveReport?.by_type && Object.entries(leaveReport.by_type).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-4 rounded-lg border">
                        <span className="font-medium">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                    {(!leaveReport?.by_type || Object.keys(leaveReport.by_type).length === 0) && (
                      <p className="text-muted-foreground col-span-full text-center py-4">
                        No leave data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Active</span>
                        <span className="font-medium text-success">{employeeReport?.by_status?.active || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">On Leave</span>
                        <span className="font-medium text-warning">{employeeReport?.by_status?.on_leave || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Terminated</span>
                        <span className="font-medium text-destructive">{employeeReport?.by_status?.terminated || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Intern Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Active</span>
                        <span className="font-medium text-success">{employeeReport?.interns_by_status?.active || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-medium text-warning">{employeeReport?.interns_by_status?.pending || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-medium text-secondary">{employeeReport?.interns_by_status?.completed || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Employees by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeeReport?.by_department && Object.entries(employeeReport.by_department).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="font-medium">{dept}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                    {(!employeeReport?.by_department || Object.keys(employeeReport.by_department).length === 0) && (
                      <p className="text-muted-foreground text-center py-4">
                        No department data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}