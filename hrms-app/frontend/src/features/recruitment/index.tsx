import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Briefcase, Plus, Edit, Trash2, MoreHorizontal, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { recruitmentApi, departmentsApi } from "@/shared/lib/api"
import { useMasterData } from "@/shared/hooks/use-master-data"

interface JobPosting {
  id: number
  title: string
  department: string
  description: string | null
  requirements: string | null
  location: string | null
  employment_type: string
  experience_required: string | null
  salary_range: string | null
  status: string
  created_at: string
  deadline: string | null
}

interface Applicant {
  id: number
  job_id: number
  job_title?: string
  name: string
  email: string
  phone: string | null
  resume_url: string | null
  cover_letter: string | null
  status: string
  applied_at: string
  notes: string | null
}

const statusColors = {
  open: { badge: "success" as const, label: "Open" },
  closed: { badge: "secondary" as const, label: "Closed" },
  draft: { badge: "warning" as const, label: "Draft" },
}

const applicantStatusColors = {
  applied: { badge: "default" as const, label: "Applied" },
  screening: { badge: "warning" as const, label: "Screening" },
  interview: { badge: "info" as const, label: "Interview" },
  hired: { badge: "success" as const, label: "Hired" },
  rejected: { badge: "destructive" as const, label: "Rejected" },
}

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState("jobs")
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"job" | "applicant">("job")
  const [editingItem, setEditingItem] = useState<JobPosting | Applicant | null>(null)
  type JobFormData = {
  title: string
  department: string
  description: string
  requirements: string
  location: string
  employment_type: string
  experience_required: string
  salary_range: string
  status: string
  job_id: string
  deadline: string
  name: string
  email: string
  phone: string
  resume_url: string
  cover_letter: string
}

const [formData, setFormData] = useState<JobFormData>({
    title: "",
    department: "",
    description: "",
    requirements: "",
    location: "",
    employment_type: "",
    experience_required: "",
    salary_range: "",
    status: "",
    job_id: "",
    deadline: "",
    name: "",
    email: "",
    phone: "",
    resume_url: "",
    cover_letter: "",
  })
  const masterData = useMasterData()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [jobsData, applicantsData, deptData] = await Promise.all([
        recruitmentApi.getJobs(),
        recruitmentApi.getApplicants(),
        departmentsApi.getAll(),
      ])
      setJobs(jobsData as JobPosting[])
      setApplicants(applicantsData as Applicant[])
      setDepartments(deptData as { id: number; name: string }[])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(type: "job" | "applicant", item?: JobPosting | Applicant) {
    setDialogType(type)
    if (item) {
      setEditingItem(item)
      if (type === "job") {
        const job = item as JobPosting
        setFormData({
          title: job.title,
          department: job.department,
          description: job.description || "",
          requirements: job.requirements || "",
          location: job.location || "",
          employment_type: job.employment_type,
          experience_required: job.experience_required || "",
          salary_range: job.salary_range || "",
          status: job.status,
          job_id: "",
          deadline: job.deadline || "",
          name: "",
          email: "",
          phone: "",
          resume_url: "",
          cover_letter: "",
        })
      } else {
        const app = item as Applicant
        setFormData({
          name: app.name,
          email: app.email,
          phone: app.phone || "",
          resume_url: app.resume_url || "",
          cover_letter: app.cover_letter || "",
          title: "",
          department: "",
          description: "",
          requirements: "",
          location: "",
          employment_type: "",
          experience_required: "",
          salary_range: "",
          status: "",
          job_id: String(app.job_id || ""),
          deadline: "",
        })
      }
    } else {
      setEditingItem(null)
      if (type === "job") {
        setFormData({
          title: "",
          department: "",
          description: "",
          requirements: "",
          location: "",
          employment_type: "",
          experience_required: "",
          salary_range: "",
          status: "",
          job_id: "",
          deadline: "",
          name: "",
          email: "",
          phone: "",
          resume_url: "",
          cover_letter: "",
        })
      } else {
        setFormData({
          name: "",
          email: "",
          phone: "",
          resume_url: "",
          cover_letter: "",
          title: "",
          department: "",
          description: "",
          requirements: "",
          location: "",
          employment_type: "",
          experience_required: "",
          salary_range: "",
          status: "",
          job_id: "",
          deadline: "",
        })
      }
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (dialogType === "job") {
        if (editingItem) {
          await recruitmentApi.updateJob((editingItem as JobPosting).id, {
            title: formData.title,
            department: formData.department,
            description: formData.description || null,
            requirements: formData.requirements || null,
            location: formData.location || null,
            employment_type: formData.employment_type,
            experience_required: formData.experience_required || null,
            salary_range: formData.salary_range || null,
            status: formData.status,
            deadline: formData.deadline || null,
          })
        } else {
          await recruitmentApi.createJob({
            title: formData.title,
            department: formData.department,
            description: formData.description || null,
            requirements: formData.requirements || null,
            location: formData.location || null,
            employment_type: formData.employment_type,
            experience_required: formData.experience_required || null,
            salary_range: formData.salary_range || null,
            status: formData.status,
            deadline: formData.deadline || null,
          })
        }
      } else {
        // For applicants - just update status for now
        await recruitmentApi.updateApplicant((editingItem as Applicant).id, {
          status: formData.status,
        })
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save. Please try again.")
    }
  }

  async function handleDelete(item: JobPosting | Applicant) {
    const type = "title" in item ? "job" : "applicant"
    const name = "title" in item ? (item as JobPosting).title : (item as Applicant).name
    if (!confirm(`Delete ${type} "${name}"?`)) return
    try {
      if ("title" in item) {
        await recruitmentApi.deleteJob((item as JobPosting).id)
      }
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
      alert("Failed to delete.")
    }
  }

  const filteredJobs = jobs.filter(job => 
    statusFilter === "all" || job.status === statusFilter
  )

  const stats = {
    open: jobs.filter(j => j.status === "open").length,
    closed: jobs.filter(j => j.status === "closed").length,
    total: jobs.length,
    totalApplicants: applicants.length,
  }

  const getApplicantJobTitle = (jobId: number) => {
    const job = jobs.find(j => j.id === jobId)
    return job ? job.title : `Job #${jobId}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">Manage job postings and track applicants.</p>
        </div>
        <Button onClick={() => handleOpenDialog("job")}>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.closed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applicants">Applicants</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {masterData.job_status.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => {
                const status = statusColors[job.status as keyof typeof statusColors] || statusColors.open
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.department}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog("job", job)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(job)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        {job.location && (
                          <p className="text-sm text-muted-foreground">📍 {job.location}</p>
                        )}
                        <p className="text-sm text-muted-foreground">💼 {job.employment_type.replace("_", " ")}</p>
                        {job.experience_required && (
                          <p className="text-sm text-muted-foreground">⭐ {job.experience_required}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <Badge variant={status.badge}>{status.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(job.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {filteredJobs.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              No job postings found. Create your first job posting.
            </div>
          )}
        </TabsContent>

        <TabsContent value="applicants" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                {applicants.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No applicants yet.</p>
                ) : (
                  <div className="space-y-4">
                    {applicants.map((app) => {
                      const status = applicantStatusColors[app.status as keyof typeof applicantStatusColors] || applicantStatusColors.applied
                      return (
                        <div key={app.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {app.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{app.name}</p>
                              <p className="text-sm text-muted-foreground">{app.email}</p>
                              <p className="text-xs text-muted-foreground">Applied for: {getApplicantJobTitle(app.job_id)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={status.badge}>{status.label}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setFormData({ ...formData, status: "screening" })
                                  handleOpenDialog("applicant", { ...app, status: "screening" } as unknown as Applicant)
                                }}>
                                  Move to Screening
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setFormData({ ...formData, status: "interview" })
                                  handleOpenDialog("applicant", { ...app, status: "interview" } as unknown as Applicant)
                                }}>
                                  Move to Interview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setFormData({ ...formData, status: "hired" })
                                  handleOpenDialog("applicant", { ...app, status: "hired" } as unknown as Applicant)
                                }}>
                                  Mark as Hired
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setFormData({ ...formData, status: "rejected" })
                                  handleOpenDialog("applicant", { ...app, status: "rejected" } as unknown as Applicant)
                                }} className="text-destructive">
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? `Edit ${dialogType === "job" ? "Job" : "Applicant"}` 
                : dialogType === "job" ? "Create Job Posting" : "Update Applicant"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {dialogType === "job" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Software Engineer"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(v) => setFormData({ ...formData, department: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Job description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Key requirements"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Bangalore"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select
                        value={formData.employment_type}
                        onValueChange={(v) => setFormData({ ...formData, employment_type: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {masterData.employment_types.map(e => (
                            <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience_required">Experience</Label>
                      <Input
                        id="experience_required"
                        value={formData.experience_required}
                        onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                        placeholder="e.g., 2-4 years"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary_range">Salary Range</Label>
                      <Input
                        id="salary_range"
                        value={formData.salary_range}
                        onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                        placeholder="e.g., 5-10 LPA"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {masterData.job_status.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
<SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {masterData.applicant_status.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingItem ? "Save Changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}