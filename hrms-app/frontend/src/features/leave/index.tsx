import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Plus, Calendar, CheckCircle, XCircle, Clock, Edit, Trash2, MoreHorizontal, FileCheck, FileX } from "lucide-react"
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
import { leaveApi, leaveTypesApi, employeesApi } from "@/shared/lib/api"

interface LeaveType {
  id: number
  name: string
  code: string
  description: string | null
  is_paid: boolean
  annual_quota: number
}

interface LeaveRequest {
  id: number
  employee_id: number
  leave_type_id: number
  start_date: string
  end_date: string
  reason: string | null
  status: string
  approved_by: number | null
  approved_at: string | null
  created_at: string
}

interface Employee {
  id: number
  name: string
  designation: string | null
}

const statusColors = {
  pending: { badge: "warning" as const, label: "Pending", icon: Clock, color: "text-warning" },
  approved: { badge: "success" as const, label: "Approved", icon: CheckCircle, color: "text-success" },
  rejected: { badge: "destructive" as const, label: "Rejected", icon: XCircle, color: "text-destructive" },
}

export default function Leave() {
  const [activeTab, setActiveTab] = useState("requests")
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"request" | "leaveType">("request")
  const [editingItem, setEditingItem] = useState<LeaveType | LeaveRequest | null>(null)
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
    work_date: "",
    name: "",
    description: "",
    annual_quota: 0,
    is_paid: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [typesData, requestsData, empData] = await Promise.all([
        leaveTypesApi.getAll(),
        leaveApi.getAll(),
        employeesApi.getAll(),
      ])
      setLeaveTypes(typesData as LeaveType[])
      setLeaveRequests(requestsData as LeaveRequest[])
      setEmployees(empData as Employee[])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(type: "request" | "leaveType", item?: LeaveType | LeaveRequest) {
    setDialogType(type)
    if (item) {
      setEditingItem(item)
      if (type === "leaveType") {
        const lt = item as LeaveType
        setFormData({
          name: lt.name,
          description: lt.description || "",
          annual_quota: lt.annual_quota,
          is_paid: lt.is_paid,
          employee_id: "",
          leave_type_id: "",
          start_date: "",
          end_date: "",
          reason: "",
          work_date: "",
        })
      } else {
        const lr = item as LeaveRequest
        setFormData({
          employee_id: String(lr.employee_id),
          leave_type_id: String(lr.leave_type_id),
          start_date: lr.start_date,
          end_date: lr.end_date,
          reason: lr.reason || "",
          work_date: (lr as any).work_date || "",
          name: "",
          description: "",
          annual_quota: 0,
          is_paid: true,
        })
      }
    } else {
      setEditingItem(null)
      setFormData({
        employee_id: "",
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
        work_date: "",
        name: "",
        description: "",
        annual_quota: type === "leaveType" ? 10 : 0,
        is_paid: true,
      })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (dialogType === "leaveType") {
        if (editingItem) {
          await leaveTypesApi.update((editingItem as LeaveType).id, {
            name: formData.name,
            description: formData.description || null,
            annual_quota: formData.annual_quota,
            is_paid: formData.is_paid,
          })
        } else {
          await leaveTypesApi.create({
            name: formData.name,
            code: formData.name.toUpperCase().slice(0, 3) + Math.floor(Math.random() * 100),
            description: formData.description || null,
            annual_quota: formData.annual_quota,
            is_paid: formData.is_paid,
          })
        }
      } else {
        const isCompOff = leaveTypes.find(lt => lt.id === parseInt(formData.leave_type_id))?.code === "CO"
        await leaveApi.create({
          employee_id: parseInt(formData.employee_id),
          leave_type_id: parseInt(formData.leave_type_id),
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason || null,
          ...(isCompOff && formData.work_date ? { work_date: formData.work_date } : {}),
        })
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save. Please try again.")
    }
  }

  async function handleApproveReject(request: LeaveRequest, status: "approved" | "rejected") {
    try {
      await leaveApi.update(request.id, { status })
      fetchData()
    } catch (error) {
      console.error("Failed to update:", error)
      alert("Failed to update leave request.")
    }
  }

  async function handleDelete(item: LeaveType | LeaveRequest) {
    const type = "code" in item ? "leave type" : "leave request"
    const name = "name" in item ? item.name : `Request #${(item as LeaveRequest).id}`
    if (!confirm(`Delete ${type} "${name}"?`)) return
    try {
      if ("code" in item) {
        await leaveTypesApi.delete((item as LeaveType).id)
      }
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
      alert("Failed to delete.")
    }
  }

  const filteredRequests = leaveRequests.filter(req => 
    statusFilter === "all" || req.status === statusFilter
  )

  const stats = {
    pending: leaveRequests.filter(r => r.status === "pending").length,
    approved: leaveRequests.filter(r => r.status === "approved").length,
    rejected: leaveRequests.filter(r => r.status === "rejected").length,
    total: leaveRequests.length,
  }

  const getEmployeeName = (id: number) => {
    const emp = employees.find(e => e.id === id)
    return emp ? emp.name : `Employee #${id}`
  }

  const getLeaveTypeName = (id: number) => {
    const lt = leaveTypes.find(t => t.id === id)
    return lt ? lt.name : `Leave #${id}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Manage leave types and employee leave requests.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleOpenDialog("request")}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                {filteredRequests.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No leave requests found.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => {
                      const status = statusColors[request.status as keyof typeof statusColors] || statusColors.pending
                      const StatusIcon = status.icon
                      return (
                        <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${status.badge === "warning" ? "bg-warning/10" : status.badge === "success" ? "bg-success/10" : "bg-destructive/10"}`}>
                              <StatusIcon className={`h-5 w-5 ${status.color}`} />
                            </div>
                            <div>
                              <p className="font-medium">{getEmployeeName(request.employee_id)}</p>
                              <p className="text-sm text-muted-foreground">
                                {getLeaveTypeName(request.leave_type_id)} • {format(new Date(request.start_date), "MMM d")} - {format(new Date(request.end_date), "MMM d, yyyy")}
                              </p>
                              {request.reason && (
                                <p className="text-xs text-muted-foreground mt-1">Reason: {request.reason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={status.badge}>{status.label}</Badge>
                            {request.status === "pending" && (
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" onClick={() => handleApproveReject(request, "approved")}>
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleApproveReject(request, "rejected")}>
                                  <FileX className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
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

        <TabsContent value="types" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leave Types</h2>
            <Button onClick={() => handleOpenDialog("leaveType")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Leave Type
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leaveTypes.map((lt) => (
              <Card key={lt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{lt.name}</h3>
                      <p className="text-sm text-muted-foreground">{lt.code}</p>
                      <p className="text-sm text-muted-foreground mt-1">{lt.description || "No description"}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog("leaveType", lt)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(lt)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant={lt.is_paid ? "success" : "secondary"}>
                      {lt.is_paid ? "Paid" : "Unpaid"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{lt.annual_quota} days/year</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {leaveTypes.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              No leave types found. Add your first leave type.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? `Edit ${dialogType === "leaveType" ? "Leave Type" : "Leave Request"}` 
                : dialogType === "leaveType" ? "Add Leave Type" : "New Leave Request"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {dialogType === "leaveType" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Casual Leave"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annual_quota">Annual Quota (days)</Label>
                    <Input
                      id="annual_quota"
                      type="number"
                      value={formData.annual_quota}
                      onChange={(e) => setFormData({ ...formData, annual_quota: parseInt(e.target.value) })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee</Label>
                    <Select
                      value={formData.employee_id}
                      onValueChange={(v) => setFormData({ ...formData, employee_id: v })}
                      required
                    >
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leave_type_id">Leave Type</Label>
                    <Select
                      value={formData.leave_type_id}
                      onValueChange={(v) => setFormData({ ...formData, leave_type_id: v })}
                      required
                    >
                      <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((lt) => (
                          <SelectItem key={lt.id} value={String(lt.id)}>{lt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Reason for leave"
                    />
                  </div>
                  
                  {leaveTypes.find(lt => lt.id === parseInt(formData.leave_type_id))?.code === "CO" && (
                    <div className="space-y-2">
                      <Label htmlFor="work_date">Work Date (Saturday/Sunday)</Label>
                      <Input
                        id="work_date"
                        type="date"
                        value={formData.work_date}
                        onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Select the date when you worked on weekend/holiday that you want to avail as comp-off
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingItem ? "Save Changes" : "Submit"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}