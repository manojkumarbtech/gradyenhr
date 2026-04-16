import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Shield } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import { Label } from "@/shared/ui/label"
import { Avatar, AvatarFallback } from "@/shared/ui/avatar"
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
import { usersApi, permissionsApi } from "@/shared/lib/api"
import { useAppStore } from "@/shared/lib/store"

interface UserData {
  id: number
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
}

export default function Users() {
  const { user: currentUser } = useAppStore()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "employee",
  })
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)
  const [allPermissions, setAllPermissions] = useState<{key: string, label: string}[]>([])
  const [userPermissions, setUserPermissions] = useState<Record<string, {can_read: boolean, can_create: boolean, can_update: boolean, can_delete: boolean}>>({})

  useEffect(() => {
    fetchUsers()
    fetchPermissions()
  }, [])

  async function fetchPermissions() {
    try {
      const allPerms = await permissionsApi.getAll()
      setAllPermissions(allPerms)
    } catch (e) { console.error("Failed to load perm types:", e) }
  }

  async function fetchPermissionsForUser(userId: number) {
    try {
      setAllPermissions(await permissionsApi.getAll())
      const userPerms = await permissionsApi.getUserPermissions(userId)
      const permMap: Record<string, any> = {}
      ;(userPerms as any[]).forEach((p: any) => {
        permMap[p.permission_key] = {
          can_read: p.can_read, can_create: p.can_create,
          can_update: p.can_update, can_delete: p.can_delete
        }
      })
      setUserPermissions(permMap)
    } catch (e) { console.error("Failed to load permissions:", e) }
  }

  async function fetchUsers() {
    try {
      const data = await usersApi.getAll()
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenDialog(user?: UserData) {
    if (user) {
      setEditingUser(user)
      fetchPermissionsForUser(user.id)
      setFormData({
        email: user.email,
        name: user.name,
        password: "",
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({ email: "", name: "", password: "", role: "employee" })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingUser) {
        // Update existing user
        await usersApi.update(editingUser.id, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
        })
      } else {
        // Create new user
        await usersApi.create(formData)
      }
      setIsDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Failed to save user:", error)
      alert("Failed to save user. Please try again.")
    }
  }

  async function handleDelete(user: UserData) {
    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) return
    try {
      await usersApi.delete(user.id)
      fetchUsers()
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert("Failed to delete user.")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive"
      case "hr": return "warning"
      case "manager": return "info"
      default: return "default"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system users and their access permissions</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={user.is_active ? "success" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {user.role !== "admin" ? (
                          <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsPermissionsOpen(true) }}>
                            <Shield className="h-4 w-4" />
                          </Button>
                          ) : (
                          <Button variant="ghost" size="icon" disabled title="Admin has all permissions">
                            <Shield className="h-4 w-4 opacity-50" />
                          </Button>
                          )}
                          {user.role !== "admin" && <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>}
                          {String(user.id) !== String(currentUser?.id) && user.role !== "admin" && <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                  required
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Enter password"
                    required={!editingUser}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {editingUser?.name}</DialogTitle>
          </DialogHeader>
          {editingUser?.role === "admin" ? (
            <div className="py-8 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Admin has full access to all modules and features.</p>
              <p className="text-sm mt-2">No permissions need to be configured.</p>
            </div>
          ) : (<>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {allPermissions.map((perm) => (
              <div key={perm.key} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{perm.label}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={userPermissions[perm.key]?.can_read ?? true}
                      onChange={(e) => setUserPermissions({
                        ...userPermissions,
                        [perm.key]: { ...userPermissions[perm.key], can_read: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Read
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={userPermissions[perm.key]?.can_create ?? false}
                      onChange={(e) => setUserPermissions({
                        ...userPermissions,
                        [perm.key]: { ...userPermissions[perm.key], can_create: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Create
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={userPermissions[perm.key]?.can_update ?? false}
                      onChange={(e) => setUserPermissions({
                        ...userPermissions,
                        [perm.key]: { ...userPermissions[perm.key], can_update: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Update
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={userPermissions[perm.key]?.can_delete ?? false}
                      onChange={(e) => setUserPermissions({
                        ...userPermissions,
                        [perm.key]: { ...userPermissions[perm.key], can_delete: e.target.checked }
                      })}
                      className="rounded"
                    />
                    Delete
                  </label>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!editingUser) return
              const perms = Object.entries(userPermissions).map(([key, val]) => ({
                permission_key: key, ...val
              }))
              await permissionsApi.setUserPermissions(editingUser.id, perms)
              setIsPermissionsOpen(false)
            }}>Save Permissions</Button>
          </DialogFooter>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  )
}