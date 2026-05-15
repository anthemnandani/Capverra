"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address" }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from("waitlist").insert({ email })

  if (error) {
    if (error.code === "23505") {
      return { error: "This email is already on the waitlist!" }
    }
    return { error: "Something went wrong. Please try again." }
  }

  return { success: true }
}
