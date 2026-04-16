import { useState, useEffect } from "react"
import { Plus, Search, Mail, Phone, Calendar, Building, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Avatar, AvatarFallback } from "@/shared/ui/avatar"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { internsApi, departmentsApi, employeesApi } from "@/shared/lib/api"
import { useMasterData } from "@/shared/hooks/use-master-data"

interface Intern {
  id: number
  name: string
  email: string
  phone: string | null
  college: string | null
  degree: string | null
  year: string | null
  department_id: number | null
  department?: string | null
  start_date: string | null
  end_date: string | null
  status: string
  mentor_id: number | null
}

interface Department {
  id: number
  name: string
}

interface Employee {
  id: number
  name: string
}

const statusColors = {
  active: { badge: "success" as const, label: "Active" },
  pending: { badge: "warning" as const, label: "Pending" },
  completed: { badge: "secondary" as const, label: "Completed" },
  terminated: { badge: "destructive" as const, label: "Terminated" },
}

export default function Interns() {
  const [interns, setInterns] = useState<Intern[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIntern, setEditingIntern] = useState<Intern | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    degree: "",
    year: "",
    department_id: "",
    start_date: "",
    end_date: "",
    status: "",
    mentor_id: "",
  })
  const masterData = useMasterData()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [internData, deptData, empData] = await Promise.all([
        internsApi.getAll(),
        departmentsApi.getAll(),
        employeesApi.getAll(),
      ])
      setInterns(internData)
      setDepartments(deptData)
      setEmployees(empData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(intern?: Intern) {
    if (intern) {
      setEditingIntern(intern)
      setFormData({
        name: intern.name,
        email: intern.email,
        phone: intern.phone || "",
        college: intern.college || "",
        degree: intern.degree || "",
        year: intern.year || "",
        department_id: String(intern.department_id || ""),
        start_date: intern.start_date || "",
        end_date: intern.end_date || "",
        status: intern.status,
        mentor_id: String(intern.mentor_id || ""),
      })
    } else {
      setEditingIntern(null)
      setFormData({
        name: "", email: "", phone: "", college: "", degree: "", year: "",
        department_id: "", start_date: "", end_date: "", status: "pending", mentor_id: "",
      })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        college: formData.college || null,
        degree: formData.degree || null,
        year: formData.year || null,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        mentor_id: formData.mentor_id ? parseInt(formData.mentor_id) : null,
      }
      if (editingIntern) {
        await internsApi.update(editingIntern.id, data)
      } else {
        await internsApi.create(data)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to save intern:", error)
      alert("Failed to save intern.")
    }
  }

  async function handleDelete(intern: Intern) {
    if (!confirm(`Delete intern "${intern.name}"?`)) return
    try {
      await internsApi.delete(intern.id)
      fetchData()
    } catch (error) {
      console.error("Failed to delete intern:", error)
      alert("Failed to delete intern.")
    }
  }

  const filteredInterns = interns.filter(intern => {
    const matchesSearch = intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (intern.college && intern.college.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || intern.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    active: interns.filter(i => i.status === "active").length,
    pending: interns.filter(i => i.status === "pending").length,
    completed: interns.filter(i => i.status === "completed").length,
    total: interns.length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interns</h1>
          <p className="text-muted-foreground">Manage interns and inplant training students.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Intern
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search interns..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
<SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {masterData.intern_status.map(s => (
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
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInterns.map((intern) => {
              const status = statusColors[intern.status as keyof typeof statusColors] || statusColors.pending
              return (
                <Card key={intern.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-secondary/20 text-secondary">
                            {intern.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{intern.name}</p>
                          <p className="text-sm text-muted-foreground">{intern.degree || "No degree"}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(intern)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(intern)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-2">
                      {intern.college && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4" />
                          {intern.college} - {intern.year}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {intern.email}
                      </div>
                      {intern.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {intern.phone}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{intern.start_date || "-"} to {intern.end_date || "-"}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant={status.badge}>{status.label}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredInterns.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No interns found.
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Intern Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-success/10">
                  <p className="text-sm text-muted-foreground">Active Interns</p>
                  <p className="text-2xl font-bold text-success">{statusCounts.active}</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">{statusCounts.pending}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/10">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-secondary">{statusCounts.completed}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">{statusCounts.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIntern ? "Edit Intern" : "Add New Intern"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Input id="college" value={formData.college} onChange={(e) => setFormData({...formData, college: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <Input id="degree" value={formData.degree} onChange={(e) => setFormData({...formData, degree: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} placeholder="e.g., Final Year" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor">Mentor</Label>
                <Select value={formData.mentor_id} onValueChange={(v) => setFormData({...formData, mentor_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select mentor" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {masterData.intern_status.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingIntern ? "Save Changes" : "Add Intern"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}