"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/context"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileForm {
  firstName: string
  lastName: string
  email: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface NotificationPrefs {
  emailNotifications: boolean
  pushNotifications: boolean
}

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth()
  const supabase = createSupabaseBrowserClient()

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
  })
  const [profileLoading, setProfileLoading] = useState(false)

  // ── Password ─────────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    emailNotifications: false,
    pushNotifications: false,
  })
  const [notifLoading, setNotifLoading] = useState(false)

  // ── Prefill from auth user ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const nameParts = (user.name ?? "").trim().split(" ")
    setProfileForm({
      firstName: nameParts[0] ?? "",
      lastName: nameParts.slice(1).join(" ") ?? "",
      email: user.email ?? "",
    })

    if (user.notification_preferences) {
      const prefs = user.notification_preferences as Partial<NotificationPrefs>
      setNotifPrefs({
        emailNotifications: prefs.emailNotifications ?? false,
        pushNotifications: prefs.pushNotifications ?? false,
      })
    }
  }, [user])

  // ── Profile submit ────────────────────────────────────────────────────────
  const handleProfileSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user) return

      const fullName = [profileForm.firstName.trim(), profileForm.lastName.trim()]
        .filter(Boolean)
        .join(" ")

      if (!fullName) {
        toast.error("Name cannot be empty.")
        return
      }

      setProfileLoading(true)
      try {
        // 1. Update public.users table
        const { error: dbError } = await supabase
          .from("users")
          .update({ name: fullName })
          .eq("id", user.id)

        if (dbError) throw dbError

        // 2. Update auth email if changed
        if (profileForm.email !== user.email) {
          const { error: authError } = await supabase.auth.updateUser({
            email: profileForm.email,
          })
          if (authError) throw authError
          toast.success("Profile updated. Check your new email to confirm the change.")
        } else {
          toast.success("Profile updated successfully.")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update profile"
        console.error("[Settings] handleProfileSubmit:", err)
        toast.error(message)
      } finally {
        setProfileLoading(false)
      }
    },
    [user, profileForm, supabase],
  )

  // ── Password submit ───────────────────────────────────────────────────────
  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (passwordForm.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters.")
        return
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error("New passwords do not match.")
        return
      }

      setPasswordLoading(true)
      try {
        // Verify current password by re-signing in
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user?.email ?? "",
          password: passwordForm.currentPassword,
        })

        if (verifyError) {
          toast.error("Current password is incorrect.")
          return
        }

        // Update to new password
        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordForm.newPassword,
        })

        if (updateError) throw updateError

        toast.success("Password updated successfully.")
        setPasswordForm(EMPTY_PASSWORD_FORM)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update password"
        console.error("[Settings] handlePasswordSubmit:", err)
        toast.error(message)
      } finally {
        setPasswordLoading(false)
      }
    },
    [passwordForm, user, supabase],
  )

  // ── Notification toggle ───────────────────────────────────────────────────
  const handleNotifToggle = useCallback(
    async (key: keyof NotificationPrefs, value: boolean) => {
      if (!user) return

      const updated = { ...notifPrefs, [key]: value }
      setNotifPrefs(updated) // optimistic update

      setNotifLoading(true)
      try {
        const { error } = await supabase
          .from("users")
          .update({ notification_preferences: updated })
          .eq("id", user.id)

        if (error) throw error
      } catch (err) {
        // Rollback on failure
        setNotifPrefs(notifPrefs)
        console.error("[Settings] handleNotifToggle:", err)
        toast.error("Failed to update notification preferences.")
      } finally {
        setNotifLoading(false)
      }
    },
    [user, notifPrefs, supabase],
  )

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setProfile = (key: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setProfileForm((p) => ({ ...p, [key]: e.target.value }))

  const setPassword = (key: keyof PasswordForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setPasswordForm((p) => ({ ...p, [key]: e.target.value }))

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto sm:px-6 px-3 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* ── Profile ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={profileForm.firstName}
                    onChange={setProfile("firstName")}
                    disabled={profileLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={profileForm.lastName}
                    onChange={setProfile("lastName")}
                    disabled={profileLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={profileForm.email}
                  onChange={setProfile("email")}
                  disabled={profileLoading}
                  required
                />
              </div>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={notifPrefs.emailNotifications}
                onCheckedChange={(v) => handleNotifToggle("emailNotifications", v)}
                disabled={notifLoading || !user}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
              </div>
              <Switch
                checked={notifPrefs.pushNotifications}
                onCheckedChange={(v) => handleNotifToggle("pushNotifications", v)}
                disabled={notifLoading || !user}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Security ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={setPassword("currentPassword")}
                  disabled={passwordLoading}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={setPassword("newPassword")}
                  disabled={passwordLoading}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={setPassword("confirmPassword")}
                  disabled={passwordLoading}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}