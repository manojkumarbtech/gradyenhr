import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Package, Plus, Search, Edit, Trash2, MoreHorizontal, Monitor, Smartphone, Keyboard, Headphones, Printer, User, CheckCircle, XCircle, ArrowRightCircle } from "lucide-react"
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
import { assetsApi, employeesApi, internsApi } from "@/shared/lib/api"
import { useAppStore } from "@/shared/lib/store"
import { useMasterData } from "@/shared/hooks/use-master-data"

interface Asset {
  id: number
  name: string
  asset_type: string
  category: string
  description: string | null
  serial_number: string | null
  purchase_date: string | null
  purchase_cost: string | null
  warranty_expiry: string | null
  status: string
  location: string | null
}

interface AssetAssignment {
  id: number
  asset_id: number
  assigned_to: number
  assigned_type: string
  assigned_date: string
  status: string
  notes: string | null
  asset_name?: string
  assigned_to_name?: string
}

interface ReturnRequest {
  id: number
  asset_id: number
  requested_by: number
  request_type: string
  reason: string | null
  status: string
  requested_at: string
  approved_by: number | null
  approved_at: string | null
  admin_notes: string | null
  asset_name?: string
  requested_by_name?: string
}

interface Employee {
  id: number
  name: string
}

const categoryIcons: Record<string, typeof Monitor> = {
  "Laptop": Monitor,
  "Desktop": Monitor,
  "Mobile": Smartphone,
  "Tablet": Smartphone,
  "Keyboard": Keyboard,
  "Mouse": Keyboard,
  "Headset": Headphones,
  "Printer": Printer,
  "Other": Package,
}

const statusColors = {
  available: { badge: "success" as const, label: "Available" },
  assigned: { badge: "info" as const, label: "Assigned" },
  under_maintenance: { badge: "warning" as const, label: "Maintenance" },
  retired: { badge: "secondary" as const, label: "Retired" },
}

const returnStatusColors = {
  pending: { badge: "warning" as const, label: "Pending" },
  approved: { badge: "success" as const, label: "Approved" },
  rejected: { badge: "destructive" as const, label: "Rejected" },
}

export default function Assets() {
  const [activeTab, setActiveTab] = useState("assets")
  const [assets, setAssets] = useState<Asset[]>([])
  const [assignments, setAssignments] = useState<AssetAssignment[]>([])
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [interns, setInterns] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const masterData = useMasterData()
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    asset_type: "",
    category: "",
    description: "",
    serial_number: "",
    purchase_date: "",
    purchase_cost: "",
    warranty_expiry: "",
    status: "available",
    location: "",
  })
  const [assignData, setAssignData] = useState({
    asset_id: "",
    assigned_to: "",
    assigned_type: "employee",
    notes: "",
  })
  const [returnFormData, setReturnFormData] = useState({
    asset_id: "",
    request_type: "",
    reason: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [assetsData, assignmentsData, returnData, empData, internData] = await Promise.all([
        assetsApi.getAll(),
        assetsApi.getAssignments(),
        assetsApi.getReturnRequests(),
        employeesApi.getAll(),
        internsApi.getAll(),
      ])
      setAssets(assetsData as Asset[])
      
      const enrichedAssignments = (assignmentsData as AssetAssignment[]).map(a => ({
        ...a,
        asset_name: (assetsData as Asset[]).find(asset => asset.id === a.asset_id)?.name || `Asset #${a.asset_id}`,
        assigned_to_name: a.assigned_type === "employee" 
          ? (empData as Employee[]).find(e => e.id === a.assigned_to)?.name || `Employee #${a.assigned_to}`
          : (internData as Employee[]).find(i => i.id === a.assigned_to)?.name || `Intern #${a.assigned_to}`
      }))
      setAssignments(enrichedAssignments)
      
      const enrichedReturns = (returnData as ReturnRequest[]).map(r => ({
        ...r,
        asset_name: (assetsData as Asset[]).find(asset => asset.id === r.asset_id)?.name || `Asset #${r.asset_id}`,
        requested_by_name: r.request_type === "relieving"
          ? (empData as Employee[]).find(e => e.id === r.requested_by)?.name || `Employee #${r.requested_by}`
          : (internData as Employee[]).find(i => i.id === r.requested_by)?.name || `Intern #${r.requested_by}`
      }))
      setReturnRequests(enrichedReturns)
      
      setEmployees(empData as Employee[])
      setInterns(internData as Employee[])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(asset?: Asset) {
    if (asset) {
      setEditingAsset(asset)
      setFormData({
        name: asset.name,
        asset_type: asset.asset_type,
        category: asset.category,
        description: asset.description || "",
        serial_number: asset.serial_number || "",
        purchase_date: asset.purchase_date || "",
        purchase_cost: asset.purchase_cost || "",
        warranty_expiry: asset.warranty_expiry || "",
        status: asset.status,
        location: asset.location || "",
      })
    } else {
      setEditingAsset(null)
      setFormData({
        name: "", asset_type: "", category: "", description: "",
        serial_number: "", purchase_date: "", purchase_cost: "",
        warranty_expiry: "", status: "available", location: "",
      })
    }
    setIsDialogOpen(true)
  }

  function handleAssignOpen(asset?: Asset) {
    if (asset) {
      setAssignData({
        asset_id: String(asset.id),
        assigned_to: "",
        assigned_type: "employee",
        notes: "",
      })
    }
    setIsAssignDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = {
        name: formData.name,
        asset_type: formData.asset_type,
        category: formData.category,
        description: formData.description || null,
        serial_number: formData.serial_number || null,
        purchase_date: formData.purchase_date || null,
        purchase_cost: formData.purchase_cost || null,
        warranty_expiry: formData.warranty_expiry || null,
        status: formData.status,
        location: formData.location || null,
      }
      
      if (editingAsset) {
        await assetsApi.update(editingAsset.id, data)
      } else {
        await assetsApi.create(data)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save. Please try again.")
    }
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await assetsApi.assign({
        asset_id: parseInt(assignData.asset_id),
        assigned_to: parseInt(assignData.assigned_to),
        assigned_type: assignData.assigned_type,
        notes: assignData.notes || null,
      })
      setIsAssignDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to assign:", error)
      alert("Failed to assign asset.")
    }
  }

  async function handleReturnRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const userId = useAppStore.getState().user?.id
      if (!userId) {
        alert("Please log in to submit a return request.")
        return
      }
      await assetsApi.requestReturn({
        asset_id: parseInt(returnFormData.asset_id),
        requested_by: parseInt(userId),
        request_type: returnFormData.request_type,
        reason: returnFormData.reason || null,
      })
      alert("Return request submitted!")
      setReturnFormData({ asset_id: "", request_type: "", reason: "" })
      setIsReturnDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Failed to submit return request:", error)
      alert("Failed to submit return request.")
    }
  }

  async function handleApproveReturn(request: ReturnRequest, status: "approved" | "rejected") {
    try {
      await assetsApi.updateReturnRequest(request.id, { status })
      fetchData()
    } catch (error) {
      console.error("Failed to update:", error)
      alert("Failed to update return request.")
    }
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`Delete asset "${asset.name}"?`)) return
    try {
      await assetsApi.delete(asset.id)
      fetchData()
    } catch (error) {
      console.error("Failed to delete:", error)
      alert("Failed to delete.")
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const assignedAssets = assets.filter(a => a.status === "assigned")
  const availableAssets = assets.filter(a => a.status === "available")

  const stats = {
    total: assets.length,
    available: availableAssets.length,
    assigned: assignedAssets.length,
    pendingReturns: returnRequests.filter(r => r.status === "pending").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Office Assets</h1>
          <p className="text-muted-foreground">Manage and track company assets.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <User className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.assigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return Pending</CardTitle>
            <ArrowRightCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingReturns}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="returns">Return Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {masterData.asset_status.map((s) => (
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
              {filteredAssets.map((asset) => {
                const status = statusColors[asset.status as keyof typeof statusColors] || statusColors.available
                const IconComponent = categoryIcons[asset.asset_type] || Package
                return (
                  <Card key={asset.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{asset.name}</h3>
                            <p className="text-sm text-muted-foreground">{asset.asset_type}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(asset)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            {asset.status === "available" && (
                              <DropdownMenuItem onClick={() => handleAssignOpen(asset)}>
                                <User className="h-4 w-4 mr-2" /> Assign
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(asset)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        {asset.serial_number && <p className="text-sm text-muted-foreground">S/N: {asset.serial_number}</p>}
                        {asset.location && <p className="text-sm text-muted-foreground">📍 {asset.location}</p>}
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <Badge variant={status.badge}>{status.label}</Badge>
                        <span className="text-xs text-muted-foreground">{asset.category}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.filter(a => a.status === "active").length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No active assignments</p>
              ) : (
                <div className="space-y-4">
                  {assignments.filter(a => a.status === "active").map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg border">
<div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{assignment.assigned_to_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.assigned_type === "employee" ? "Employee" : "Intern"} • {assignment.asset_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(assignment.assigned_date), "MMM d, yyyy")}
                          </p>
                          <Badge variant="info">{assignment.assigned_type}</Badge>
                          <Button size="sm" variant="outline" onClick={() => {
                            setReturnFormData({ asset_id: String(assignment.asset_id), request_type: "", reason: "" })
                            setIsReturnDialogOpen(true)
                          }}>
                            <ArrowRightCircle className="h-4 w-4 mr-1" /> Return
                          </Button>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Return Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {returnRequests.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No return requests</p>
              ) : (
                <div className="space-y-4">
                  {returnRequests.map((request) => {
                    const status = returnStatusColors[request.status as keyof typeof returnStatusColors] || returnStatusColors.pending
                    return (
                      <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{request.asset_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested by: {request.requested_by_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Reason: {request.request_type} {request.reason && `- ${request.reason}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={status.badge}>{status.label}</Badge>
                          {request.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleApproveReturn(request, "approved")}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleApproveReturn(request, "rejected")}>
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Asset Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., MacBook Pro" required />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {masterData.asset_types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {masterData.asset_categories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} placeholder="S/N" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {masterData.asset_status.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingAsset ? "Save Changes" : "Add Asset"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Asset Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={assignData.assigned_to} onValueChange={(v) => setAssignData({ ...assignData, assigned_to: v })}>
                  <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" disabled>-- Employees --</SelectItem>
                    {employees.map(emp => <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>)}
                    <SelectItem value="" disabled>-- Interns --</SelectItem>
                    {interns.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={assignData.assigned_type} onValueChange={(v) => setAssignData({ ...assignData, assigned_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={assignData.notes} onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Assign</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Request Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Asset Return Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReturnRequestSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Request Type</Label>
                <Select value={returnFormData.request_type} onValueChange={(v) => setReturnFormData({ ...returnFormData, request_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {masterData.return_request_types.map(rt => (
                      <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea value={returnFormData.reason} onChange={(e) => setReturnFormData({ ...returnFormData, reason: e.target.value })} placeholder="Additional details..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReturnDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}