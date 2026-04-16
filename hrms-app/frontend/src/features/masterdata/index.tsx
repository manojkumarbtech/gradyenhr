import { useState, useEffect } from "react"
import { Settings, Save, RefreshCw, ChevronRight, ChevronDown, Plus, Trash2, Edit2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Badge } from "@/shared/ui/badge"
import { ScrollArea } from "@/shared/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog"
import { masterDataApi } from "@/shared/lib/api"
import { useAppStore } from "@/shared/lib/store"

interface MasterDataItem {
  value: string
  label: string
  id?: number
}

interface Department {
  id: number
  name: string
}

interface MasterData {
  employee_status: MasterDataItem[]
  user_roles: MasterDataItem[]
  asset_status: MasterDataItem[]
  asset_types: MasterDataItem[]
  asset_categories: MasterDataItem[]
  return_request_types: MasterDataItem[]
  job_status: MasterDataItem[]
  employment_types: MasterDataItem[]
  applicant_status: MasterDataItem[]
  leave_status: MasterDataItem[]
  intern_status: MasterDataItem[]
  holiday_types: MasterDataItem[]
  leave_types: MasterDataItem[]
  attendance_status: MasterDataItem[]
  training_types: MasterDataItem[]
  training_status: MasterDataItem[]
  timezones: MasterDataItem[]
  departments: Department[]
}

type CategoryKey = keyof MasterData

const SCREEN_GROUPS = [
  {
    screen: "Employee Management",
    categories: [
      { key: "employee_status" as CategoryKey, title: "Employee Status" },
      { key: "user_roles" as CategoryKey, title: "User Roles" },
    ]
  },
  {
    screen: "Assets",
    categories: [
      { key: "asset_status" as CategoryKey, title: "Asset Status" },
      { key: "asset_types" as CategoryKey, title: "Asset Types" },
      { key: "asset_categories" as CategoryKey, title: "Asset Categories" },
      { key: "return_request_types" as CategoryKey, title: "Return Request Types" },
    ]
  },
  {
    screen: "Recruitment",
    categories: [
      { key: "job_status" as CategoryKey, title: "Job Status" },
      { key: "employment_types" as CategoryKey, title: "Employment Types" },
      { key: "applicant_status" as CategoryKey, title: "Applicant Status" },
    ]
  },
  {
    screen: "Leave Management",
    categories: [
      { key: "leave_status" as CategoryKey, title: "Leave Status" },
      { key: "leave_types" as CategoryKey, title: "Leave Types" },
      { key: "intern_status" as CategoryKey, title: "Intern Status" },
    ]
  },
  {
    screen: "Attendance",
    categories: [
      { key: "attendance_status" as CategoryKey, title: "Attendance Status" },
    ]
  },
  {
    screen: "Training",
    categories: [
      { key: "training_types" as CategoryKey, title: "Training Types" },
      { key: "training_status" as CategoryKey, title: "Training Status" },
    ]
  },
  {
    screen: "Holidays",
    categories: [
      { key: "holiday_types" as CategoryKey, title: "Holiday Types" },
    ]
  },
  {
    screen: "System",
    categories: [
      { key: "timezones" as CategoryKey, title: "Timezones" },
      { key: "departments" as CategoryKey, title: "Departments" },
    ]
  },
]

type DialogMode = "edit" | "add" | "delete" | null

import { useNavigate } from "react-router-dom"

export default function MasterData() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/")
    }
  }, [user, navigate])
  
  if (!user || user.role !== "admin") {
    return null
  }
  
  const [masterData, setMasterData] = useState<MasterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("employee_status")
  const [expandedScreens, setExpandedScreens] = useState<string[]>(["Employee Management"])
  
  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedItem, setSelectedItem] = useState<MasterDataItem | null>(null)
  const [formData, setFormData] = useState({ value: "", label: "" })
  const [deleteConfirm, setDeleteConfirm] = useState("")

  useEffect(() => {
    fetchMasterData()
  }, [])

  async function fetchMasterData() {
    try {
      const data = await masterDataApi.getAll()
      setMasterData(data as MasterData)
    } catch (error) {
      console.error("Failed to fetch master data:", error)
    } finally {
      setLoading(false)
    }
  }

  function toggleScreen(screen: string) {
    setExpandedScreens(prev => 
      prev.includes(screen) 
        ? prev.filter(s => s !== screen)
        : [...prev, screen]
    )
  }

  function getCategoryInfo(key: CategoryKey): string {
    for (const group of SCREEN_GROUPS) {
      const cat = group.categories.find(c => c.key === key)
      if (cat) return group.screen
    }
    return ""
  }

  function openEditDialog(item: MasterDataItem) {
    setSelectedItem(item)
    setFormData({ value: item.value, label: item.label })
    setDialogMode("edit")
  }

  function openAddDialog() {
    setSelectedItem(null)
    setFormData({ value: "", label: "" })
    setDialogMode("add")
  }

  function openDeleteDialog(item: MasterDataItem) {
    setSelectedItem(item)
    setDeleteConfirm("")
    setDialogMode("delete")
  }

  function closeDialog() {
    setDialogMode(null)
    setSelectedItem(null)
    setFormData({ value: "", label: "" })
    setDeleteConfirm("")
  }

  function saveEdit() {
    if (!masterData || !selectedItem) return
    
    const entryId = (selectedItem as MasterDataItem & { id?: number }).id
    if (!entryId) return
    
    masterDataApi.update(entryId, { value: formData.value, label: formData.label })
      .then(() => {
        const items = [...(masterData[selectedCategory] as MasterDataItem[])]
        const index = items.findIndex(i => i.value === selectedItem.value)
        if (index >= 0) {
          items[index] = { ...items[index], value: formData.value, label: formData.label }
          setMasterData({ ...masterData, [selectedCategory]: items })
        }
        closeDialog()
      })
      .catch(err => {
        console.error("Failed to update:", err)
        alert("Failed to update entry")
      })
  }

  async function confirmDelete() {
    if (!masterData || !selectedItem) return
    if (deleteConfirm !== selectedItem.value) return
    
    const entryId = (selectedItem as MasterDataItem & { id?: number }).id
    if (!entryId) return
    
    try {
      await masterDataApi.delete(entryId)
      const items = (masterData[selectedCategory] as MasterDataItem[]).filter(i => i.value !== selectedItem.value)
      setMasterData({ ...masterData, [selectedCategory]: items })
      closeDialog()
    } catch (err) {
      console.error("Failed to delete:", err)
      alert("Failed to delete entry")
    }
  }

  async function addItem() {
    if (!masterData || !formData.value || !formData.label) return
    
    try {
      const result = await masterDataApi.create({ 
        category: selectedCategory, 
        value: formData.value, 
        label: formData.label 
      })
      const newItem = { ...result as MasterDataItem, id: (result as { id: number }).id }
      const items = [...(masterData[selectedCategory] as MasterDataItem[]), newItem]
      setMasterData({ ...masterData, [selectedCategory]: items })
      closeDialog()
    } catch (err) {
      console.error("Failed to add:", err)
      alert("Failed to add entry")
    }
  }

  function handleSaveAll() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      alert("Master data saved successfully!")
    }, 1000)
  }

  function getCategoryTitle(key: CategoryKey): string {
    for (const group of SCREEN_GROUPS) {
      const cat = group.categories.find(c => c.key === key)
      if (cat) return cat.title
    }
    return key
  }

  function getCategoryCount(key: CategoryKey): number {
    if (!masterData) return 0
    if (key === "departments") return masterData.departments.length
    return (masterData[key] as MasterDataItem[]).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isDepartment = selectedCategory === "departments"
  const currentItems = masterData ? masterData[selectedCategory] : []
  const currentScreen = getCategoryInfo(selectedCategory)

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Master Data Management
          </h1>
          <p className="text-muted-foreground">Manage all dropdown values and system configurations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMasterData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSaveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-full">
        {/* Left Panel - Tree View */}
        <Card className="w-80 flex-shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Data Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="p-2">
                {SCREEN_GROUPS.map((group) => {
                  const isExpanded = expandedScreens.includes(group.screen)
                  const isActiveScreen = currentScreen === group.screen
                  
                  return (
                    <div key={group.screen} className="mb-1">
                      <button
                        onClick={() => toggleScreen(group.screen)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                          isActiveScreen ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm">{group.screen}</span>
                      </button>
                      
                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {group.categories.map((cat) => {
                            const isSelected = selectedCategory === cat.key
                            const count = getCategoryCount(cat.key)
                            
                            return (
                              <button
                                key={cat.key}
                                onClick={() => setSelectedCategory(cat.key)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground" 
                                    : "hover:bg-muted"
                                }`}
                              >
                                <span>{cat.title}</span>
                                <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs">
                                  {count}
                                </Badge>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel - List View */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{getCategoryTitle(selectedCategory)}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isDepartment 
                    ? "Company departments. Manage in Settings for full CRUD." 
                    : `Configure ${getCategoryTitle(selectedCategory).toLowerCase()} options for the system.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {currentItems.length} items
                </Badge>
                {!isDepartment && (
                  <Button size="sm" onClick={openAddDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-2">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted rounded-lg text-sm font-medium">
                  <div className="col-span-4">Value</div>
                  <div className="col-span-6">Label</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Data Rows */}
                {currentItems.map((item: MasterDataItem | Department) => {
                  if (isDepartment) {
                    const dept = item as Department
                    return (
                      <div key={dept.id} className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg items-center">
                        <div className="col-span-4">
                          <code className="text-sm bg-muted px-2 py-1 rounded">{dept.id}</code>
                        </div>
                        <div className="col-span-6">
                          <span className="text-sm">{dept.name}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <Button size="sm" variant="outline" disabled className="h-8">
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )
                  }
                  
                  const mdItem = item as MasterDataItem
                  
                  return (
                    <div key={mdItem.value} className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg items-center">
                      <div className="col-span-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{mdItem.value}</code>
                      </div>
                      <div className="col-span-6">
                        <span className="text-sm">{mdItem.label}</span>
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(mdItem)} className="h-8">
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(mdItem)} className="h-8">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {/* Empty State */}
                {currentItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No items found. Click "Add New" to create one.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogMode === "edit"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {getCategoryTitle(selectedCategory)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">Value</Label>
              <Input
                id="edit-value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Enter value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Enter label"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={saveEdit} disabled={!formData.value || !formData.label}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={dialogMode === "add"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {getCategoryTitle(selectedCategory)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-value">Value</Label>
              <Input
                id="add-value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Enter value (e.g., active)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-label">Label</Label>
              <Input
                id="add-label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Enter label (e.g., Active)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={addItem} disabled={!formData.value || !formData.label}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogMode === "delete"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm">
                <span className="font-medium">Value:</span> <code className="bg-muted px-1 rounded">{selectedItem?.value}</code>
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Label:</span> {selectedItem?.label}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="delete-confirm">
                Type <code className="bg-muted px-1 rounded">{selectedItem?.value}</code> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type value to confirm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteConfirm !== selectedItem?.value}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}