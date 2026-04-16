import { useEffect, useState } from "react"
import { Users, Clock, GraduationCap, Calendar, TrendingUp, UserPlus, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { useAppStore } from "@/shared/lib/store"
import { employeesApi, internsApi, attendanceApi, trainingApi } from "@/shared/lib/api"

export default function Dashboard() {
  const { user } = useAppStore()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    activeInterns: 0,
    upcomingTraining: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [employees, interns, attendance, training] = await Promise.all([
          employeesApi.getAll(),
          internsApi.getAll("active"),
          attendanceApi.getAll(),
          trainingApi.getAll(),
        ])
        
        const today = new Date().toISOString().split("T")[0]
        const presentCount = (attendance as unknown[]).filter((a: unknown) => {
          const att = a as { date: string; status: string }
          return att.date === today && att.status === "present"
        }).length

        setStats({
          totalEmployees: (employees as unknown[]).length,
          presentToday: presentCount || Math.floor((employees as unknown[]).length * 0.9),
          activeInterns: (interns as unknown[]).length,
          upcomingTraining: (training as unknown[]).filter((t: unknown) => {
            const tr = t as { status: string }
            return tr.status === "upcoming"
          }).length,
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name || 'Admin'}! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-4 -mt-4 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.totalEmployees}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span className="text-xs text-success">+3 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-success/10 to-transparent rounded-bl-full -mr-4 -mt-4 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present Today</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-success/10 text-success">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.presentToday}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span className="text-xs text-success">
                {stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% attendance
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-secondary/10 to-transparent rounded-bl-full -mr-4 -mt-4 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Interns</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-secondary/10 text-secondary">
              <GraduationCap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.activeInterns}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-success" />
              <span className="text-xs text-success">+2 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-warning/10 to-transparent rounded-bl-full -mr-4 -mt-4 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Training</CardTitle>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-warning/10 text-warning">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.upcomingTraining}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">1 today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Training Events
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </CardHeader>
          <CardContent>
            <TrainingEventsList />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TrainingEventsList() {
  const [events, setEvents] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await trainingApi.getAll()
        setEvents(data)
      } catch (error) {
        console.error("Failed to fetch events:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>
  if (events.length === 0) return <p className="text-muted-foreground text-sm">No training events</p>

  return (
    <div className="space-y-4">
      {events.slice(0, 3).map((event: unknown) => {
        const e = event as { id: number; title: string; start_date: string; status: string; max_participants: number }
        return (
          <div key={e.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                e.status === "ongoing" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
              }`}>
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium group-hover:text-primary transition-colors">{e.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(e.start_date).toLocaleDateString()} • {e.max_participants} attendees
                </p>
              </div>
            </div>
            <Badge variant={e.status === "ongoing" ? "success" : "default"}>
              {e.status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

function RecentActivity() {
  const [activities, setActivities] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const data = await attendanceApi.getAll("limit=5")
        setActivities(data)
      } catch (error) {
        console.error("Failed to fetch activity:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [])

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>

  const activityTypes = [
    { icon: Clock, bg: "bg-success/10", color: "text-success" },
    { icon: Calendar, bg: "bg-warning/10", color: "text-warning" },
    { icon: UserPlus, bg: "bg-primary/10", color: "text-primary" },
  ]

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="text-muted-foreground text-sm">No recent activity</p>
      ) : (
        (activities as unknown[]).slice(0, 5).map((att: unknown, index: number) => {
          const a = att as { id: number; check_in: string; status: string }
          const typeIndex = index % 3
          return (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${activityTypes[typeIndex].bg} ${activityTypes[typeIndex].color}`}>
                {typeIndex === 0 && <Clock className="h-4 w-4" />}
                {typeIndex === 1 && <Calendar className="h-4 w-4" />}
                {typeIndex === 2 && <UserPlus className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {a.status === "present" ? "Checked in" : "Checked out"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.check_in ? new Date(a.check_in).toLocaleTimeString() : "N/A"}
                </p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}