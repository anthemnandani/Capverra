import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const adminEmail = "admin@capverra.com"
    const adminPassword = "Admin@2026"

    // ── Step 1: Check if user already exists in custom users table ──
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", adminEmail)
      .single()

    if (existingUser) {
      // Already in users table — make sure role is super_admin
      if (existingUser.role !== "super_admin") {
        await supabase
          .from("users")
          .update({ role: "super_admin" })
          .eq("id", existingUser.id)
      }
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        isNew: false,
      })
    }

    // ── Step 2: Create auth user ──
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: "Capverra Admin",
        role: "super_admin",
      },
    })

    if (authError) {
      // Auth user may already exist even if users table row is missing
      if (authError.message.includes("already been registered")) {
        const {
          data: { users },
        } = await supabase.auth.admin.listUsers()

        const existingAuthUser = users?.find((u) => u.email === adminEmail)

        if (existingAuthUser) {
          // Insert / update users table row with super_admin role
          await supabase
            .from("users")
            .upsert(
              {
                id: existingAuthUser.id,
                email: adminEmail,
                name: "Capverra Admin",
                role: "super_admin",
              },
              { onConflict: "id" }
            )

          return NextResponse.json({
            success: true,
            message: "Admin role set for existing auth user",
            isNew: false,
          })
        }
      }

      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // ── Step 3: Insert into custom users table with role super_admin ──
    await supabase
      .from("users")
      .upsert(
        {
          id: authData.user.id,
          email: adminEmail,
          name: "Capverra Admin",
          role: "super_admin",
        },
        { onConflict: "id" }
      )

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      isNew: true,
    })
  } catch (error) {
    console.error("Admin seed error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}