import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { CheckCircle, Clock, XCircle, Calendar, Plus } from "lucide-react"
import { attendanceApi, employeesApi } from "@/shared/lib/api"

interface AttendanceRecord {
  id: number
  employee_id: number
  employee_name?: string
  date: string
  check_in: string | null
  check_out: string | null
  status: string
}

interface Employee {
  id: number
  name: string
  department: string | null
}

const statusConfig = {
  present: { label: "Present", icon: CheckCircle, color: "text-success", badge: "success" as const },
  late: { label: "Late", icon: Clock, color: "text-warning", badge: "warning" as const },
  absent: { label: "Absent", icon: XCircle, color: "text-destructive", badge: "destructive" as const },
  leave: { label: "On Leave", icon: Calendar, color: "text-secondary", badge: "secondary" as const },
}

export default function Attendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<"list" | "calendar">("list")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    employee_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    check_in: "",
    check_out: "",
    status: "present",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [attData, empData] = await Promise.all([
        attendanceApi.getAll(),
        employeesApi.getAll(),
      ])
      
      const attendanceWithNames = (attData as AttendanceRecord[]).map(att => {
        const emp = (empData as Employee[]).find(e => e.id === att.employee_id)
        return { ...att, employee_name: emp?.name || `Employee #${att.employee_id}` }
      })
      
      setAttendance(attendanceWithNames)
      setEmployees(empData as Employee[])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = {
        employee_id: parseInt(formData.employee_id),
        date: formData.date,
        check_in: formData.check_in || null,
        check_out: formData.check_out || null,
        status: formData.status,
      }
      await attendanceApi.create(data)
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to save attendance:", error)
      alert("Failed to save attendance.")
    }
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const todayAttendance = attendance.filter(a => a.date === today)

  const todayStats = {
    present: todayAttendance.filter(a => a.status === "present").length,
    late: todayAttendance.filter(a => a.status === "late").length,
    absent: todayAttendance.filter(a => a.status === "absent").length,
    leave: todayAttendance.filter(a => a.status === "leave").length,
  }

  const calendarDays = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Track and manage employee attendance.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Mark Attendance
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
          List View
        </Button>
        <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>
          Calendar View
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{todayStats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{todayStats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{todayStats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{todayStats.leave}</div>
          </CardContent>
        </Card>
      </div>

      {view === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance - {format(new Date(), "MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : todayAttendance.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No attendance records for today.</p>
            ) : (
              <div className="space-y-4">
                {todayAttendance.map((att) => {
                  const status = statusConfig[att.status as keyof typeof statusConfig] || statusConfig.present
                  const StatusIcon = status.icon
                  return (
                    <div key={att.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          att.status === "present" ? "bg-success/20" : 
                          att.status === "late" ? "bg-warning/20" : 
                          att.status === "absent" ? "bg-destructive/20" : "bg-secondary/20"
                        }`}>
                          <StatusIcon className={`h-5 w-5 ${status.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{att.employee_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {att.check_in || "-"} - {att.check_out || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">In - Out</p>
                        </div>
                        <Badge variant={status.badge}>{status.label}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Calendar - {format(new Date(), "MMMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const dayStr = format(day, "yyyy-MM-dd")
                const dayAtt = attendance.filter(a => a.date === dayStr)
                const presentCount = dayAtt.filter(a => a.status === "present").length
                const isSelected = isSameDay(day, selectedDate)
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`p-2 rounded-lg text-sm transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    } ${isToday(day) && !isSelected ? "border border-primary" : ""}`}
                  >
                    <div className="font-medium">{format(day, "d")}</div>
                    {presentCount > 0 && (
                      <div className="text-xs text-success">{presentCount} present</div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="check_in">Check In</Label>
                  <Input
                    id="check_in"
                    type="time"
                    value={formData.check_in}
                    onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_out">Check Out</Label>
                  <Input
                    id="check_out"
                    type="time"
                    value={formData.check_out}
                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}