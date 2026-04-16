import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppStore } from "@/shared/lib/store"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { inquiriesApi } from "@/shared/lib/api"

const API_URL = "/api"

const features = [
  { icon: "👥", title: "Employee Management", desc: "Manage your team effectively" },
  { icon: "⏰", title: "Attendance Tracking", desc: "Real-time attendance monitoring" },
  { icon: "📚", title: "Training Programs", desc: "Comprehensive learning modules" },
  { icon: "🎓", title: "Internship Management", desc: "Track intern progress seamlessly" },
]

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500+", label: "Companies" },
  { value: "99.9%", label: "Uptime" },
]

export default function Auth() {
  const [email, setEmail] = useState("s.manojkumar@gradyens.com")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAppStore()
  
  // Inquiry form
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [inquiryName, setInquiryName] = useState("")
  const [inquiryEmail, setInquiryEmail] = useState("")
  const [inquiryDesc, setInquiryDesc] = useState("")
  const [inquirySubmitting, setInquirySubmitting] = useState(false)
  const [inquirySuccess, setInquirySuccess] = useState(false)

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault()
    setInquirySubmitting(true)
    try {
      await inquiriesApi.submit({ name: inquiryName, email: inquiryEmail, description: inquiryDesc })
      setInquirySuccess(true)
      setInquiryName("")
      setInquiryEmail("")
      setInquiryDesc("")
    } catch (err) {
      setError("Failed to submit inquiry")
    } finally {
      setInquirySubmitting(false)
    }
  }
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)

      const response = await fetch(`${API_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Invalid credentials")
      }

      const data = await response.json()
      localStorage.setItem("token", data.access_token)

      const userResponse = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser({
          id: String(userData.id),
          email: userData.email,
          name: userData.name,
          role: userData.role,
        })
      }

      navigate("/")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/40 to-violet-600/40 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-blue-600/30 to-cyan-500/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-violet-500/20 to-pink-500/20 rounded-full blur-[80px]" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col w-full p-12 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Gradyens HR</span>
          </div>

          {/* Main Content */}
          <div className="space-y-10">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white leading-tight">
                Simplify Your
                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  HR Operations
                </span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                Transform your workforce management with our comprehensive HR platform. 
                Track attendance, manage employees, and accelerate growth.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div 
                  key={i}
                  className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-12 pt-4">
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-slate-500 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-slate-500 text-sm">
            <div className="flex gap-6">
              <span className="hover:text-white cursor-pointer transition-colors">Contact IT Support</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Statement</span>
            </div>
            <span className="text-slate-600">v2.4.1</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">Gradyens HR</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Don't have an account? <span className="text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">Sign up free</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in to Gradyens HR"
              )}
            </Button>
          </form>

          {/* Demo Notice */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p className="text-sm text-center text-indigo-700 dark:text-indigo-300">
              <span className="font-medium">Demo Access:</span> s.manojkumar@gradyens.com / admin123
            </p>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden text-center text-sm text-slate-500">
            <button type="button" onClick={() => setShowInquiryForm(true)} className="hover:text-indigo-600">Submit Inquiry</button>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="hover:text-indigo-600 cursor-pointer">Contact IT Support</span>
              <span className="text-slate-300">|</span>
              <span className="hover:text-indigo-600 cursor-pointer">Privacy</span>
            </div>
            <p className="mt-2">v2.4.1</p>
          </div>

          {/* Inquiry Modal */}
          {showInquiryForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Submit Inquiry</h3>
                  <button onClick={() => setShowInquiryForm(false)} className="text-slate-500 hover:text-slate-700">✕</button>
                </div>
                {inquirySuccess ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">✓</div>
                    <p className="text-lg font-medium text-green-600">Thank you!</p>
                    <p className="text-muted-foreground">We received your inquiry and will get back to you soon.</p>
                    <Button onClick={() => { setShowInquiryForm(false); setInquirySuccess(false) }} className="mt-4">Close</Button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="iname">Name</Label>
                      <Input id="iname" value={inquiryName} onChange={(e) => setInquiryName(e.target.value)} required placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iemail">Email</Label>
                      <Input id="iemail" type="email" value={inquiryEmail} onChange={(e) => setInquiryEmail(e.target.value)} required placeholder="your@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idesc">Description</Label>
                      <textarea id="idesc" value={inquiryDesc} onChange={(e) => setInquiryDesc(e.target.value)} required placeholder="How can we help?" className="w-full p-3 border rounded-lg min-h-[100px]" />
                    </div>
                    <Button type="submit" disabled={inquirySubmitting} className="w-full">
                      {inquirySubmitting ? "Submitting..." : "Submit Inquiry"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}