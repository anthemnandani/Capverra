
"use client"

import { Moon, Sun, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { updateAdminPreferences } from "@/lib/admin-actions"
import { checkAdminStatus } from "@/lib/admin-actions"

export function AdminThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // admin ka user_id fetch karo
    checkAdminStatus().then(({ adminUser }) => {
      if (adminUser) setUserId(adminUser.user_id)
    })
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon"
        className="h-9 w-9 rounded-lg border border-border bg-background hover:bg-accent"
        disabled
      >
        <Sun className="h-4 w-4 text-foreground" />
      </Button>
    )
  }

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme) // turant UI update

    if (userId) {
      setSaving(true)
      await updateAdminPreferences(userId, {
        theme: newTheme as "dark" | "light"
      })
      setSaving(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} disabled={saving}
      className="h-9 w-9 rounded-lg border border-border bg-background hover:bg-accent"
      aria-label="Toggle theme"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-foreground" />
      ) : theme === "dark" ? (
        <Sun className="h-4 w-4 text-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-foreground" />
      )}
    </Button>
  )
}