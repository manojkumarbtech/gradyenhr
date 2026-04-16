import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/shared/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { format } from "date-fns"
import { 
  Clock, MapPin, Calendar, CheckCircle, 
  XCircle, Sunset, Sunrise
} from "lucide-react"

const API_URL = "/api"

interface UserProfile {
  id: number
  email: string
  name: string
  role: string
}

interface AttendanceRecord {
  id: number
  date: string
  check_in: string | null
  check_out: string | null
  source: string
}

const WORK_START_TIME = "09:00"
const LATE_THRESHOLD = "09:30"

export default function EmployeeAttendance() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const getToken = () => localStorage.getItem("token")

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    fetchAttendanceData()
  }, [user])

  const fetchAttendanceData = async () => {
    try {
      const token = getToken()
      
      // Fetch profile
      const profileRes = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (profileRes.ok) {
        setProfile(await profileRes.json())
      }

      // Fetch today's attendance
      const today = format(new Date(), "yyyy-MM-dd")
      const attendRes = await fetch(`${API_URL}/attendances?date_filter=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (attendRes.ok) {
        const records = await attendRes.json()
        setTodayAttendance(records[0] || null)
      }

      // Fetch attendance history
      const historyRes = await fetch(`${API_URL}/attendances`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (historyRes.ok) {
        setAttendanceHistory(await historyRes.json())
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setIsCheckingIn(true)
    try {
      const token = getToken()
      const today = format(new Date(), "yyyy-MM-dd")
      const now = new Date().toISOString()
      
      const response = await fetch(`${API_URL}/attendances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employee_id: profile?.id,
          date: today,
          check_in: now,
        }),
      })

      if (response.ok) {
        fetchAttendanceData()
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    setIsCheckingOut(true)
    try {
      const token = getToken()
      if (todayAttendance) {
        const now = new Date().toISOString()
        await fetch(`${API_URL}/attendances/${todayAttendance.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            check_out: now,
          }),
        })
        fetchAttendanceData()
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsCheckingOut(false)
    }
  }

  const isLate = () => {
    if (!todayAttendance?.check_in) return false
    const checkInTime = todayAttendance.check_in.split("T")[1].substring(0, 5)
    return checkInTime > LATE_THRESHOLD
  }

  const getStatus = () => {
    if (!todayAttendance) return "not_marked"
    if (todayAttendance.check_in && !todayAttendance.check_out) return "working"
    if (todayAttendance.check_in && todayAttendance.check_out) return "completed"
    return "not_marked"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const status = getStatus()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Tracker</h1>
        <p className="text-muted-foreground">Mark your daily attendance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{format(new Date(), "EEEE")}</CardTitle>
            <CardDescription>{format(new Date(), "MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-primary mb-4">
              {format(new Date(), "HH:mm")}
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Office - Main Campus</span>
            </div>

            {status === "not_marked" && (
              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                >
                  <Sunrise className="h-5 w-5 mr-2" />
                  {isCheckingIn ? "Checking In..." : "Check In"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Expected: {WORK_START_TIME} AM
                </p>
              </div>
            )}

            {status === "working" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <span className="font-medium text-success">
                    {isLate() ? "Late Arrival" : "Working"}
                  </span>
                </div>
                <div className="text-left space-y-2 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Sunrise className="h-4 w-4 text-muted-foreground" />
                    <span>Check-in: {todayAttendance?.check_in?.split("T")[1].substring(0, 8)}</span>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="w-full"
                  onClick={handleCheckOut}
                  disabled={isCheckingOut}
                >
                  <Sunset className="h-5 w-5 mr-2" />
                  {isCheckingOut ? "Checking Out..." : "Check Out"}
                </Button>
              </div>
            )}

            {status === "completed" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <span className="font-medium text-success">Day Completed</span>
                </div>
                <div className="text-left space-y-2 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Sunrise className="h-4 w-4 text-muted-foreground" />
                    <span>Check-in: {todayAttendance?.check_in?.split("T")[1].substring(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunset className="h-4 w-4 text-muted-foreground" />
                    <span>Check-out: {todayAttendance?.check_out?.split("T")[1].substring(0, 8)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => {
                const dayDate = new Date()
                dayDate.setDate(dayDate.getDate() - (5 - index) - new Date().getDay() + 1)
                const record = attendanceHistory.find(r => r.date === format(dayDate, "yyyy-MM-dd"))
                
                return (
                  <div key={day} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        record?.check_in ? "bg-success/20" : "bg-muted"
                      }`}>
                        {record?.check_in ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{day}</span>
                    </div>
                    <div className="text-right">
                      {record?.check_in ? (
                        <span className="text-sm">
                          {record.check_in.split("T")[1].substring(0, 5)} - {record.check_out?.split("T")[1].substring(0, 5) || "..."}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Absent</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance History
          </CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No attendance records found</p>
          ) : (
            <div className="space-y-3">
              {attendanceHistory.slice(0, 15).map((att) => (
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
                    {att.check_in ? (
                      <>
                        <p className="text-sm">In: {att.check_in.split("T")[1].substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Out: {att.check_out?.split("T")[1].substring(0, 8) || "-"}
                        </p>
                      </>
                    ) : (
                      <Badge variant="destructive">Absent</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}