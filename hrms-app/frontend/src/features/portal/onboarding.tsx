import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/shared/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import { 
  FileText, Upload, CheckCircle, Clock, 
  User, Calendar, Building, BookOpen
} from "lucide-react"

const API_URL = "http://localhost:8000"

interface UserProfile {
  id: number
  email: string
  name: string
  role: string
}

interface OnboardingTask {
  id: string
  title: string
  description: string
  category: string
  is_completed: boolean
  completed_at?: string
}

const defaultTasks: OnboardingTask[] = [
  { id: "1", title: "Profile Photo", description: "Upload your profile photo", category: "Personal", is_completed: false },
  { id: "2", title: "Aadhaar Card", description: "Upload Aadhaar card copy", category: "Identity", is_completed: false },
  { id: "3", title: "PAN Card", description: "Upload PAN card copy", category: "Identity", is_completed: false },
  { id: "4", title: "Educational Certificates", description: "Upload highest qualification certificates", category: "Education", is_completed: false },
  { id: "5", title: "Previous Experience Letters", description: "Upload experience letters from previous employers", category: "Work", is_completed: false },
  { id: "6", title: "Bank Account Details", description: "Submit bank account information for salary", category: "Finance", is_completed: false },
  { id: "7", title: "Emergency Contact", description: "Add emergency contact information", category: "Personal", is_completed: false },
  { id: "8", title: "Address Proof", description: "Upload utility bill or rental agreement", category: "Address", is_completed: false },
]

export default function EmployeeOnboarding() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tasks, setTasks] = useState<OnboardingTask[]>(defaultTasks)
  const [isLoading, setIsLoading] = useState(true)

  const getToken = () => localStorage.getItem("token")

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setProfile(await res.json())
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (taskId: string, _file: File) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, is_completed: true, completed_at: new Date().toISOString() }
          : task
      )
    )
  }

  const completedCount = tasks.filter((t) => t.is_completed).length
  const progress = (completedCount / tasks.length) * 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = []
    acc[task.category].push(task)
    return acc
  }, {} as Record<string, OnboardingTask[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding Documents</h1>
          <p className="text-muted-foreground">
            Complete your onboarding by uploading required documents
          </p>
        </div>
        <Badge variant={profile?.role === "intern" ? "warning" : "default"}>
          {profile?.role === "intern" ? "Intern" : "Employee"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Onboarding Progress
          </CardTitle>
          <CardDescription>
            Complete all required documents to finish onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{completedCount} of {tasks.length} completed</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          {progress === 100 && (
            <div className="mt-4 p-4 rounded-lg bg-success/10 text-success flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Onboarding completed successfully!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category === "Personal" && <User className="h-5 w-5" />}
              {category === "Identity" && <FileText className="h-5 w-5" />}
              {category === "Education" && <BookOpen className="h-5 w-5" />}
              {category === "Work" && <Building className="h-5 w-5" />}
              {category === "Finance" && <Calendar className="h-5 w-5" />}
              {category === "Address" && <FileText className="h-5 w-5" />}
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    task.is_completed ? "bg-success/5 border-success/20" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      task.is_completed ? "bg-success/20" : "bg-muted"
                    }`}>
                      {task.is_completed ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      {task.completed_at && (
                        <p className="text-xs text-success mt-1">
                          Uploaded on {new Date(task.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {task.is_completed ? (
                      <Badge variant="success">Completed</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          className="w-48"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(task.id, file)
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}