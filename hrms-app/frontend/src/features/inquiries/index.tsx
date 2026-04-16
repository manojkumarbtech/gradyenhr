import { useState, useEffect } from "react"
import { MessageSquare, RefreshCw, Trash2, Search } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { inquiriesApi } from "@/shared/lib/api"

interface Inquiry {
  id: number
  name: string
  email: string
  description: string | null
  status: string
  submitted_date: string
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter])

  async function fetchInquiries() {
    try {
      const data = await inquiriesApi.getAll(statusFilter)
      setInquiries(data as Inquiry[])
    } catch (error) {
      console.error("Failed to fetch inquiries:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await inquiriesApi.sync()
      await fetchInquiries()
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setSyncing(false)
    }
  }

  async function handleStatusChange(inquiryId: number, newStatus: string) {
    try {
      await inquiriesApi.update(inquiryId, { status: newStatus })
      setInquiries(inquiries.map(i => 
        i.id === inquiryId ? { ...i, status: newStatus } : i
      ))
    } catch (error) {
      console.error("Update failed:", error)
    }
  }

  async function handleDelete(inquiryId: number) {
    if (!confirm("Are you sure you want to delete this inquiry?")) return
    try {
      await inquiriesApi.delete(inquiryId)
      setInquiries(inquiries.filter(i => i.id !== inquiryId))
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const filteredInquiries = inquiries.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Inquiries
          </h1>
          <p className="text-muted-foreground">Manage customer inquiries and form submissions</p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync from External"}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No inquiries found
        </div>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-left p-4 font-medium">Submitted</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-t hover:bg-muted/50">
                  <td className="p-4 font-medium">{inquiry.name}</td>
                  <td className="p-4 text-muted-foreground">{inquiry.email}</td>
                  <td className="p-4 max-w-xs truncate">{inquiry.description || "-"}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(inquiry.submitted_date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Select value={inquiry.status} onValueChange={(v) => handleStatusChange(inquiry.id, v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(inquiry.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}