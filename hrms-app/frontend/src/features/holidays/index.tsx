import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, Plus, Edit, Trash2, MoreHorizontal, Briefcase, Palmtree } from "lucide-react"
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
import { holidaysApi, leaveTypesApi } from "@/shared/lib/api"

interface Holiday {
  id: number
  name: string
  date: string
  day: string
  is_national_holiday: boolean
  description: string | null
  year: number
}

interface LeaveType {
  id: number
  name: string
  code: string
  description?: string | null
  annual_quota: number
  is_paid: boolean
}

export default function Holidays() {
  const [activeTab, setActiveTab] = useState("holidays")
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"holiday" | "leaveType">("holiday")
  const [editingItem, setEditingItem] = useState<Holiday | LeaveType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    day: "",
    is_national_holiday: true,
    description: "",
    year: new Date().getFullYear(),
    annual_quota: 0,
    is_paid: true,
  })

  useEffect(() => {
    fetchData()
  }, [yearFilter])

  async function fetchData() {
    try {
      const [holidaysData, leaveTypesData] = await Promise.all([
        holidaysApi.getAll(parseInt(yearFilter)),
        leaveTypesApi.getAll(),
      ])
      setHolidays(holidaysData as Holiday[])
      setLeaveTypes(leaveTypesData as LeaveType[])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(type: "holiday" | "leaveType", item?: Holiday | LeaveType) {
    setDialogType(type)
    if (item) {
      setEditingItem(item)
      if (type === "holiday") {
        const h = item as Holiday
        setFormData({
          name: h.name,
          date: h.date,
          day: h.day,
          is_national_holiday: h.is_national_holiday,
          description: h.description || "",
          year: h.year,
          annual_quota: 0,
          is_paid: true,
        })
      } else {
        const lt = item as LeaveType
        setFormData({
          name: lt.name,
          description: lt.description || "",
          annual_quota: lt.annual_quota,
          is_paid: lt.is_paid,
          date: "",
          day: "",
          is_national_holiday: true,
          year: new Date().getFullYear(),
        })
      }
    } else {
      setEditingItem(null)
      if (type === "holiday") {
        setFormData({
          name: "",
          date: "",
          day: "",
          is_national_holiday: true,
          description: "",
          year: parseInt(yearFilter),
          annual_quota: 0,
          is_paid: true,
        })
      } else {
        setFormData({
          name: "",
          description: "",
          annual_quota: 10,
          is_paid: true,
          date: "",
          day: "",
          is_national_holiday: true,
          year: new Date().getFullYear(),
        })
      }
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (dialogType === "holiday") {
        if (editingItem) {
          await holidaysApi.update((editingItem as Holiday).id, {
            name: formData.name,
            date: formData.date,
            day: formData.day,
            is_national_holiday: formData.is_national_holiday,
            description: formData.description || null,
          })
        } else {
          await holidaysApi.create({
            name: formData.name,
            date: formData.date,
            day: formData.day,
            is_national_holiday: formData.is_national_holiday,
            description: formData.description || null,
            year: parseInt(yearFilter),
          })
        }
      } else {
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
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save. Please try again.")
    }
  }

  async function handleDelete(item: Holiday | LeaveType) {
    const type = "date" in item ? "holiday" : "leave type"
    const name = "name" in item ? item.name : (item as Holiday).name
    if (!confirm(`Delete ${type} "${name}"?`)) return
    try {
      if ("date" in item) {
        await holidaysApi.delete((item as Holiday).id)
      } else {
        await leaveTypesApi.delete((item as LeaveType).id)
      }
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
      alert("Failed to delete.")
    }
  }

  const getDayOfWeek = (dateStr: string) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[new Date(dateStr).getDay()]
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value
    const day = getDayOfWeek(selectedDate)
    setFormData({ ...formData, date: selectedDate, day })
  }

  const stats = {
    total: holidays.length,
    national: holidays.filter(h => h.is_national_holiday).length,
    festival: holidays.filter(h => !h.is_national_holiday).length,
  }

  const years = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y <= currentYear + 2; y++) {
    years.push(y)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Holidays & Policies</h1>
          <p className="text-muted-foreground">Manage holiday calendar and leave policies.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Holidays</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">National Holidays</CardTitle>
            <Briefcase className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.national}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Festival Holidays</CardTitle>
            <Palmtree className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.festival}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="holidays">Holiday Calendar</TabsTrigger>
          <TabsTrigger value="policies">Leave Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="holidays" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleOpenDialog("holiday")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                {holidays.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No holidays for {yearFilter}. Add your first holiday.</p>
                ) : (
                  <div className="space-y-2">
                    {holidays.map((holiday) => (
                      <div key={holiday.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            holiday.is_national_holiday ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                          }`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{holiday.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(holiday.date), "MMMM d, yyyy")} - {holiday.day}
                            </p>
                            {holiday.description && (
                              <p className="text-xs text-muted-foreground">{holiday.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={holiday.is_national_holiday ? "success" : "secondary"}>
                            {holiday.is_national_holiday ? "National" : "Festival"}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog("holiday", holiday)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(holiday)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leave Policies</h2>
            <Button onClick={() => handleOpenDialog("leaveType")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Policy
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
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Annual Quota</span>
                      <span className="font-medium">{lt.annual_quota} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant={lt.is_paid ? "success" : "secondary"}>
                        {lt.is_paid ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {leaveTypes.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              No leave policies found. Add your first policy.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? `Edit ${dialogType === "holiday" ? "Holiday" : "Policy"}` 
                : dialogType === "holiday" ? "Add Holiday" : "Add Leave Policy"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {dialogType === "holiday" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Holiday Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Republic Day"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={handleDateChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Input
                        id="day"
                        value={formData.day}
                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                        placeholder="Auto-filled"
                        readOnly
                      />
                    </div>
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
                    <Label>Holiday Type</Label>
                    <Select
                      value={formData.is_national_holiday ? "national" : "festival"}
                      onValueChange={(v) => setFormData({ ...formData, is_national_holiday: v === "national" })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national">National Holiday</SelectItem>
                        <SelectItem value="festival">Festival Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Policy Name</Label>
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
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select
                      value={formData.is_paid ? "paid" : "unpaid"}
                      onValueChange={(v) => setFormData({ ...formData, is_paid: v === "paid" })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
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