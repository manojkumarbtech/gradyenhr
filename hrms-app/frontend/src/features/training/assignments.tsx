import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Plus, Code, FileText, FolderOpen, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Badge } from "@/shared/ui/badge"
import { Textarea } from "@/shared/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
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
import { useAppStore } from "@/shared/lib/store"
import { trainingApi, internsApi } from "@/shared/lib/api"

interface TrainingAssignment {
  id: number
  intern_id: number
  intern_name?: string
  title: string
  description: string | null
  assignment_type: string
  due_date: string
  max_score: number
  status: string
  submitted_at: string | null
  submitted_content: string | null
  score: number | null
  feedback: string | null
  assigned_by: number | null
  created_at: string
}

interface Intern {
  id: number
  name: string
  email: string
  status: string
}



const statusColors: Record<string, { badge: "success" | "warning" | "destructive" | "secondary" | "default"; label: string }> = {
  pending: { badge: "warning", label: "Pending" },
  submitted: { badge: "default", label: "Submitted" },
  graded: { badge: "success", label: "Graded" },
}

const assignmentTypeOptions = [
  { value: "coding_test", label: "Coding Test" },
  { value: "task", label: "Task" },
  { value: "project", label: "Project" },
]

export default function TrainingAssignments() {
  const { user } = useAppStore()
  const isAdmin = user?.role === "admin" || user?.role === "hr" || user?.role === "manager"
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([])
  const [interns, setInterns] = useState<Intern[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<TrainingAssignment | null>(null)
  const [formData, setFormData] = useState({
    intern_id: "",
    title: "",
    description: "",
    assignment_type: "",
    due_date: "",
    max_score: "100",
  })
  const [gradingData, setGradingData] = useState({ score: "", feedback: "" })
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<TrainingAssignment | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [assignmentsData, internsData] = await Promise.all([
        trainingApi.getAssignments(),
        internsApi.getAll("active"),
      ])
      
      // Add intern names to assignments
      const assignmentsWithNames = (assignmentsData as TrainingAssignment[]).map(a => ({
        ...a,
        intern_name: (internsData as Intern[]).find(i => i.id === a.intern_id)?.name || "Unknown"
      }))
      
      setAssignments(assignmentsWithNames)
      setInterns(internsData as Intern[])
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
        intern_id: parseInt(formData.intern_id),
        title: formData.title,
        description: formData.description || null,
        assignment_type: formData.assignment_type,
        due_date: formData.due_date,
        max_score: parseInt(formData.max_score),
      }

      if (editingAssignment) {
        await trainingApi.updateAssignment(editingAssignment.id, data)
      } else {
        await trainingApi.createAssignment(data)
      }

      setIsDialogOpen(false)
      setEditingAssignment(null)
      setFormData({
        intern_id: "",
        title: "",
        description: "",
        assignment_type: "",
        due_date: "",
        max_score: "100",
      })
      fetchData()
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save assignment")
    }
  }

  async function handleDelete(assignment: TrainingAssignment) {
    if (!confirm(`Delete "${assignment.title}"?`)) return
    try {
      await trainingApi.deleteAssignment(assignment.id)
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  function openGradeDialog(assignment: TrainingAssignment) {
    setSelectedAssignment(assignment)
    setGradingData({
      score: String(assignment.score || ""),
      feedback: assignment.feedback || "",
    })
    setGradeDialogOpen(true)
  }

  async function handleGradeSubmit() {
    if (!selectedAssignment) return
    try {
      await trainingApi.updateAssignment(selectedAssignment.id, {
        status: "graded",
        score: parseInt(gradingData.score) || null,
        feedback: gradingData.feedback || null,
      })
      setGradeDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to grade:", error)
    }
  }

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return a.status === "pending"
    if (activeTab === "submitted") return a.status === "submitted"
    if (activeTab === "graded") return a.status === "graded"
    return true
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "coding_test": return <Code className="h-4 w-4" />
      case "task": return <FileText className="h-4 w-4" />
      case "project": return <FolderOpen className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    return assignmentTypeOptions.find(o => o.value === type)?.label || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            {isAdmin ? "Training Assignments" : "My Training Tasks"}
          </h1>
          <p className="text-muted-foreground">{isAdmin ? "Assign coding tests, tasks, and projects to interns" : "View your training assignments and tasks"}</p>
        </div>
        {isAdmin && (
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({assignments.filter(a => a.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({assignments.filter(a => a.status === "submitted").length})</TabsTrigger>
          <TabsTrigger value="graded">Graded ({assignments.filter(a => a.status === "graded").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No assignments found. Create a new assignment to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map((assignment) => {
                const status = statusColors[assignment.status] || statusColors.pending
                return (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {getTypeIcon(assignment.assignment_type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{assignment.intern_name}</p>
                          </div>
                        </div>
                        <Badge variant={status.badge}>{status.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{getTypeLabel(assignment.assignment_type)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Due:</span>
                          <span className="font-medium">{format(new Date(assignment.due_date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Max Score:</span>
                          <span className="font-medium">{assignment.max_score}</span>
                        </div>
                        {assignment.score !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Score:</span>
                            <span className="font-medium text-green-600">{assignment.score}/{assignment.max_score}</span>
                          </div>
                        )}
                      </div>

                      {assignment.status === "submitted" && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Submitted content:</p>
                          <div className="p-2 bg-muted rounded text-xs max-h-20 overflow-auto">
                            {assignment.submitted_content || "No content"}
                          </div>
                          <Button size="sm" className="mt-2 w-full" onClick={() => openGradeDialog(assignment)}>
                            Grade Assignment
                          </Button>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                          setEditingAssignment(assignment)
                          setFormData({
                            intern_id: String(assignment.intern_id),
                            title: assignment.title,
                            description: assignment.description || "",
                            assignment_type: assignment.assignment_type,
                            due_date: assignment.due_date,
                            max_score: String(assignment.max_score),
                          })
                          setIsDialogOpen(true)
                        }}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(assignment)}>
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Assignment" : "New Assignment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Intern</Label>
                <Select
                  value={formData.intern_id}
                  onValueChange={(v) => setFormData({ ...formData, intern_id: v })}
                  required
                >
                  <SelectTrigger><SelectValue placeholder="Select intern" /></SelectTrigger>
                  <SelectContent>
                    {interns.map((intern) => (
                      <SelectItem key={intern.id} value={String(intern.id)}>{intern.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Assignment title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Assignment details, requirements, etc."
                />
              </div>

              <div className="space-y-2">
                <Label>Assignment Type</Label>
                <Select
                  value={formData.assignment_type}
                  onValueChange={(v) => setFormData({ ...formData, assignment_type: v })}
                  required
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {assignmentTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    value={formData.max_score}
                    onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                    min="1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false)
                setEditingAssignment(null)
                setFormData({
                  intern_id: "",
                  title: "",
                  description: "",
                  assignment_type: "",
                  due_date: "",
                  max_score: "100",
                })
              }}>Cancel</Button>
              <Button type="submit">{editingAssignment ? "Save" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Assignment - {selectedAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Score (out of {selectedAssignment?.max_score})</Label>
              <Input
                type="number"
                value={gradingData.score}
                onChange={(e) => setGradingData({ ...gradingData, score: e.target.value })}
                min="0"
                max={selectedAssignment?.max_score}
              />
            </div>
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                value={gradingData.feedback}
                onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                placeholder="Provide feedback on the submission..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGradeSubmit}>Submit Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}