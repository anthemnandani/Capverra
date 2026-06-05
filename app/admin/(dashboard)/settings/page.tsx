"use client"

import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { checkAdminStatus } from "@/lib/admin-actions"
import { useTheme } from "next-themes"
import type { AdminUser } from "@/lib/admin-types"
import {
  Settings,
  User,
  Bell,
  Shield,
  Key,
  Palette,
  Globe,
  Mail,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Icon className="w-4 h-4 text-indigo-400" />
            </div>
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  )
}

function ToggleSetting({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-indigo-500"
      />
    </div>
  )
}

export default function AdminSettingsPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [themeSaving, setThemeSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { setTheme } = useTheme()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [darkMode, setDarkMode] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [activityLogs, setActivityLogs] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  // pendingAvatarCleanUrl: upload ho gaya but save nahi hua yet
  const [pendingAvatarCleanUrl, setPendingAvatarCleanUrl] = useState<string | undefined>()

  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const { adminUser } = await checkAdminStatus()
        setAdminUser(adminUser)
        if (adminUser) {
          setName(adminUser.name || "")
          setEmail(adminUser.email)

          const storedUrl = adminUser.avatar_url
          if (storedUrl) {
            const cleanStored = storedUrl.split("?")[0]
            setAvatarUrl(`${cleanStored}?t=${Date.now()}`)
          } else {
            setAvatarUrl(undefined)
          }

          const savedTheme = adminUser.preferences?.theme ?? "dark"
          setDarkMode(savedTheme === "dark")
          setTheme(savedTheme)

          const prefs = adminUser.preferences ?? { theme: "dark" as const }
          if (prefs.emailNotifications !== undefined) setEmailNotifications(prefs.emailNotifications)
          if (prefs.pushNotifications !== undefined) setPushNotifications(prefs.pushNotifications)
          if (prefs.activityLogs !== undefined) setActivityLogs(prefs.activityLogs)
        }
      } catch (error) {
        console.error("Error loading admin:", error)
      } finally {
        setLoading(false)
      }
    }
    loadAdmin()
  }, [setTheme])

  // ── Profile save — avatar bhi yahan save hoga ─────────────────────────────
  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error("Name is required"); return }
    if (!adminUser?.user_id) return
    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()

      // pendingAvatarCleanUrl hai toh woh save karo, warna existing clean url
      const urlToSave = pendingAvatarCleanUrl
        ?? (adminUser.avatar_url ? adminUser.avatar_url.split("?")[0] : null)

      const { error } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          avatar_url: urlToSave,
          updated_at: new Date().toISOString(),
        })
        .eq("id", adminUser.user_id)

      if (error) throw error

      // Pending clear karo after successful save
      setPendingAvatarCleanUrl(undefined)
      toast.success("Profile updated successfully")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save profile"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  // ── Avatar upload — sirf storage mein upload, DB save nahi ───────────────
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !adminUser?.user_id) return
    if (file.size > 2 * 1024 * 1024) { toast.error("File too large — max 2 MB"); return }
    e.target.value = ""
    setAvatarUploading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const ext = file.name.split(".").pop() || "png"
      const path = `${adminUser.user_id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      const cleanUrl = data.publicUrl

      // Sirf preview update karo, DB save nahi
      setAvatarUrl(`${cleanUrl}?t=${Date.now()}`)
      setPendingAvatarCleanUrl(cleanUrl)

      toast.success("Avatar ready! Click 'Save Changes' to apply.")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed"
      toast.error(message)
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Theme toggle ──────────────────────────────────────────────────────────
  const handleThemeChange = async (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    setDarkMode(checked)
    setTheme(newTheme)

    if (!adminUser?.user_id) return
    setThemeSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const currentPrefs = adminUser.preferences ?? { theme: "dark" as const }
      const { error } = await supabase
        .from("users")
        .update({
          preferences: { ...currentPrefs, theme: newTheme },
          updated_at: new Date().toISOString(),
        })
        .eq("id", adminUser.user_id)
      if (error) throw error
      toast.success(`Switched to ${newTheme} mode`)
    } catch {
      toast.error("Failed to save theme preference")
      setDarkMode(!checked)
      setTheme(checked ? "light" : "dark")
    } finally {
      setThemeSaving(false)
    }
  }

  // ── Notification preferences save ────────────────────────────────────────
  const handleSaveNotifications = async () => {
    if (!adminUser?.user_id) return
    try {
      const supabase = createSupabaseBrowserClient()
      const currentPrefs = adminUser.preferences ?? { theme: "dark" as const }
      const { error } = await supabase
        .from("users")
        .update({
          preferences: { ...currentPrefs, emailNotifications, pushNotifications, activityLogs },
          updated_at: new Date().toISOString(),
        })
        .eq("id", adminUser.user_id)
      if (error) throw error
      toast.success("Notification preferences saved")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save preferences"
      toast.error(message)
    }
  }

  // ── Password change ───────────────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    if (!currentPw) { toast.error("Enter your current password"); return }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters"); return }
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return }
    setPwSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("Not authenticated")
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPw })
      if (signInErr) throw new Error("Current password is incorrect")
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success("Password updated successfully")
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password"
      toast.error(message)
    } finally {
      setPwSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-muted-foreground"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-muted-foreground"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-muted-foreground"
          >
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-muted-foreground"
          >
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <SettingsSection
            title="Profile Information"
            description="Update your personal information"
            icon={User}
            delay={0.1}
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold">
                    {adminUser?.name?.[0]?.toUpperCase() || adminUser?.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={avatarUploading}
                  onClick={() => fileRef.current?.click()}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Avatar"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-white/5 border-white/10 text-white opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Role</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span className="text-white capitalize">
                      {adminUser?.role.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="w-4 h-4 mr-2" />Save Changes</>
                  }
                </Button>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingsSection title="Email Notifications" description="Configure your email notification preferences" icon={Mail} delay={0.1}>
            <div className="space-y-1">
              <ToggleSetting
                label="Email Notifications"
                description="Receive email notifications for important updates"
                checked={emailNotifications}
                onCheckedChange={(v) => { setEmailNotifications(v); handleSaveNotifications() }}
              />
              <Separator className="bg-white/5" />
              <ToggleSetting label="Weekly Reports" description="Receive weekly summary reports via email" checked={true} onCheckedChange={() => {}} />
              <Separator className="bg-white/5" />
              <ToggleSetting label="New User Alerts" description="Get notified when new users sign up" checked={true} onCheckedChange={() => {}} />
            </div>
          </SettingsSection>

          <SettingsSection title="Push Notifications" description="Configure push notification preferences" icon={Bell} delay={0.2}>
            <div className="space-y-1">
              <ToggleSetting
                label="Push Notifications"
                description="Enable push notifications in your browser"
                checked={pushNotifications}
                onCheckedChange={(v) => { setPushNotifications(v); handleSaveNotifications() }}
              />
              <Separator className="bg-white/5" />
              <ToggleSetting
                label="Activity Alerts"
                description="Get notified about important activities"
                checked={activityLogs}
                onCheckedChange={(v) => { setActivityLogs(v); handleSaveNotifications() }}
              />
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <SettingsSection title="Password" description="Update your password" icon={Key} delay={0.1}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-gray-300">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="bg-white/5 border-white/10 text-white pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrentPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="bg-white/5 border-white/10 text-white pr-10"
                    />
                    <button type="button" onClick={() => setShowNewPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-300">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type={showNewPw ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              {confirmPw && newPw !== confirmPw && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
              <Button variant="outline" disabled={pwSaving} onClick={handleUpdatePassword} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                {pwSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : "Update Password"}
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection title="Two-Factor Authentication" description="Add an extra layer of security to your account" icon={Shield} delay={0.2}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {twoFactor ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-400" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{twoFactor ? "2FA Enabled" : "2FA Disabled"}</p>
                  <p className="text-gray-500 text-sm">{twoFactor ? "Your account is protected with 2FA" : "Enable 2FA for enhanced security"}</p>
                </div>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} className="data-[state=checked]:bg-indigo-500" />
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <SettingsSection title="Theme" description="Customize the look and feel" icon={Palette} delay={0.1}>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Dark Mode</p>
                <p className="text-gray-500 text-sm">Use dark theme for the admin panel</p>
              </div>
              <div className="flex items-center gap-2">
                {themeSaving && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                <Switch
                  checked={darkMode}
                  onCheckedChange={handleThemeChange}
                  disabled={themeSaving}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="Language & Region" description="Set your preferred language and timezone" icon={Globe} delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Language</Label>
                <Input value="English (US)" readOnly className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Timezone</Label>
                <Input value="(UTC+00:00) London" readOnly className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  )
}