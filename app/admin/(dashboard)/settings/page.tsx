"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { checkAdminStatus } from "@/lib/admin-actions"
import type { AdminUser } from "@/lib/admin-types"
import {
  Settings,
  User,
  Bell,
  Shield,
  Key,
  Palette,
  Moon,
  Sun,
  Globe,
  Mail,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

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

  // Settings state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [darkMode, setDarkMode] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [activityLogs, setActivityLogs] = useState(true)

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const { adminUser } = await checkAdminStatus()
        setAdminUser(adminUser)
        if (adminUser) {
          setName(adminUser.name || "")
          setEmail(adminUser.email)
        }
      } catch (error) {
        console.error("Error loading admin:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAdmin()
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success("Profile updated successfully")
    setSaving(false)
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
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
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold">
                    {adminUser?.name?.[0]?.toUpperCase() || adminUser?.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Change Avatar
                </Button>
              </div>

              {/* Form */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
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
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingsSection
            title="Email Notifications"
            description="Configure your email notification preferences"
            icon={Mail}
            delay={0.1}
          >
            <div className="space-y-1">
              <ToggleSetting
                label="Email Notifications"
                description="Receive email notifications for important updates"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
              <Separator className="bg-white/5" />
              <ToggleSetting
                label="Weekly Reports"
                description="Receive weekly summary reports via email"
                checked={true}
                onCheckedChange={() => {}}
              />
              <Separator className="bg-white/5" />
              <ToggleSetting
                label="New User Alerts"
                description="Get notified when new users sign up"
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Push Notifications"
            description="Configure push notification preferences"
            icon={Bell}
            delay={0.2}
          >
            <div className="space-y-1">
              <ToggleSetting
                label="Push Notifications"
                description="Enable push notifications in your browser"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
              <Separator className="bg-white/5" />
              <ToggleSetting
                label="Activity Alerts"
                description="Get notified about important activities"
                checked={activityLogs}
                onCheckedChange={setActivityLogs}
              />
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <SettingsSection
            title="Password"
            description="Update your password"
            icon={Key}
            delay={0.1}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-gray-300">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-gray-300">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-300">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Update Password
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            icon={Shield}
            delay={0.2}
          >
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
                  <p className="text-white font-medium">
                    {twoFactor ? "2FA Enabled" : "2FA Disabled"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {twoFactor
                      ? "Your account is protected with 2FA"
                      : "Enable 2FA for enhanced security"}
                  </p>
                </div>
              </div>
              <Switch
                checked={twoFactor}
                onCheckedChange={setTwoFactor}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <SettingsSection
            title="Theme"
            description="Customize the look and feel"
            icon={Palette}
            delay={0.1}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">Dark Mode</p>
                    <p className="text-gray-500 text-sm">
                      Use dark theme for the admin panel
                    </p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Language & Region"
            description="Set your preferred language and timezone"
            icon={Globe}
            delay={0.2}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Language</Label>
                <Input
                  value="English (US)"
                  readOnly
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Timezone</Label>
                <Input
                  value="(UTC+00:00) London"
                  readOnly
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  )
}
