import { useState, useEffect } from "react"
import { Building, Plus, Edit, Trash2, MoreHorizontal, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Textarea } from "@/shared/ui/textarea"
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
import { departmentsApi, leaveTypesApi } from "@/shared/lib/api"

interface Department {
  id: number
  name: string
  description: string | null
}

interface LeaveType {
  id: number
  name: string
  code: string
  description: string | null
  annual_quota: number
  is_paid: boolean
}

interface OrganizationSettings {
  company_name: string
  company_email: string
  company_phone: string
  company_address: string
  timezone: string
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("departments")
  const [departments, setDepartments] = useState<Department[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"department" | "leaveType">("department")
  const [editingItem, setEditingItem] = useState<Department | LeaveType | null>(null)
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    company_name: "Gradyens Technologies",
    company_email: "hr@gradyens.com",
    company_phone: "+91 9876543210",
    company_address: "123 Tech Park, Bangalore",
    timezone: "Asia/Kolkata",
  })

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    annual_quota: 0,
    is_paid: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [deptData, leaveData] = await Promise.all([
        departmentsApi.getAll(),
        leaveTypesApi.getAll(),
      ])
      setDepartments(deptData)
      setLeaveTypes(leaveData as LeaveType[])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(type: "department" | "leaveType", item?: Department | LeaveType) {
    setDialogType(type)
    if (item) {
      setEditingItem(item)
      if (type === "department") {
        const dept = item as Department
        setFormData({ name: dept.name, description: dept.description || "", code: "", annual_quota: 0, is_paid: true })
      } else {
        const leave = item as LeaveType
        setFormData({ name: leave.name, description: leave.description || "", code: leave.code, annual_quota: leave.annual_quota, is_paid: leave.is_paid })
      }
    } else {
      setEditingItem(null)
      setFormData({ name: "", description: "", code: "", annual_quota: type === "leaveType" ? 10 : 0, is_paid: true })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (dialogType === "department") {
        if (editingItem) {
          await departmentsApi.update((editingItem as Department).id, {
            name: formData.name,
            description: formData.description || null,
          })
        } else {
          await departmentsApi.create({
            name: formData.name,
            description: formData.description || null,
          })
        }
      } else {
        // Leave types - need to add API
        console.log("Leave type save not implemented")
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save. Please try again.")
    }
  }

  async function handleDelete(item: Department | LeaveType) {
    const type = "name" in item ? "department" : "leaveType"
    const name = item.name
    if (!confirm(`Delete ${type} "${name}"?`)) return
    try {
      if (type === "department") {
        await departmentsApi.delete((item as Department).id)
      }
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
      alert("Failed to delete.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your organization and application settings.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="leave">Leave Types</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Departments</h2>
            <Button onClick={() => handleOpenDialog("department")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <Card key={dept.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{dept.name}</h3>
                          <p className="text-sm text-muted-foreground">{dept.description || "No description"}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog("department", dept)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(dept)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {departments.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              No departments found. Add your first department.
            </div>
          )}
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leave Types</h2>
            <Button onClick={() => handleOpenDialog("leaveType")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Leave Type
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leaveTypes.length === 0 ? (
                  <p className="text-muted-foreground col-span-full">No leave types configured.</p>
                ) : (
                  leaveTypes.map((lt) => (
                    <div key={lt.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{lt.name}</h3>
                          <p className="text-sm text-muted-foreground">{lt.annual_quota} days per year</p>
                        </div>
                        <Badge variant="success">{lt.is_paid ? "Paid" : "Unpaid"}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Manage your company information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={orgSettings.company_name}
                    onChange={(e) => setOrgSettings({ ...orgSettings, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_email">Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={orgSettings.company_email}
                    onChange={(e) => setOrgSettings({ ...orgSettings, company_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_phone">Phone</Label>
                  <Input
                    id="company_phone"
                    value={orgSettings.company_phone}
                    onChange={(e) => setOrgSettings({ ...orgSettings, company_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={orgSettings.timezone} onValueChange={(v) => setOrgSettings({ ...orgSettings, timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company_address">Address</Label>
                  <Textarea
                    id="company_address"
                    value={orgSettings.company_address}
                    onChange={(e) => setOrgSettings({ ...orgSettings, company_address: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive attendance and leave updates via email</p>
                  </div>
                  <Button variant="outline">Enabled</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Leave Request Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when someone applies for leave</p>
                  </div>
                  <Button variant="outline">Enabled</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Training Reminders</p>
                    <p className="text-sm text-muted-foreground">Receive reminders for upcoming training sessions</p>
                  </div>
                  <Button variant="outline">Enabled</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Attendance Reports</p>
                    <p className="text-sm text-muted-foreground">Daily attendance summary reports</p>
                  </div>
                  <Button variant="outline">Enabled</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${dialogType === "department" ? "Department" : "Leave Type"}` : `Add ${dialogType === "department" ? "Department" : "Leave Type"}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Enter ${dialogType === "department" ? "department" : "leave type"} name`}
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
              {dialogType === "leaveType" && (
                <div className="space-y-2">
                  <Label htmlFor="annual_quota">Annual Quota (Days)</Label>
                  <Input
                    id="annual_quota"
                    type="number"
                    value={formData.annual_quota}
                    onChange={(e) => setFormData({ ...formData, annual_quota: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingItem ? "Save Changes" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}