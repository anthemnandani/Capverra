import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// This endpoint creates the test admin user
// Only works if the admin doesn't already exist
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

    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const adminEmail = "admin@capverra.com"
    const adminPassword = "Admin@2026"

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", adminEmail)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      // User exists, check if admin entry exists
      const { data: adminEntry } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", adminEmail)
        .limit(1)

      if (adminEntry && adminEntry.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Admin user already exists",
          isNew: false,
        })
      }
    }

    // Create auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: "Capverra Admin",
        role: "admin",
      },
    })

    if (authError) {
      // If user already exists in auth, try to get their ID
      if (authError.message.includes("already been registered")) {
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingUser = users?.find(u => u.email === adminEmail)
        
        if (existingUser) {
          // Create admin entry for existing auth user
          await supabase.from("admin_users").upsert({
            user_id: existingUser.id,
            email: adminEmail,
            name: "Capverra Admin",
            role: "super_admin",
            is_active: true,
          }, { onConflict: "user_id" })

          return NextResponse.json({
            success: true,
            message: "Admin entry created for existing user",
            isNew: false,
          })
        }
      }
      
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    // Create user entry in users table
    await supabase.from("users").upsert({
      id: authData.user.id,
      email: adminEmail,
      name: "Capverra Admin",
      role: "client",
    }, { onConflict: "id" })

    // Create admin entry
    await supabase.from("admin_users").upsert({
      user_id: authData.user.id,
      email: adminEmail,
      name: "Capverra Admin",
      role: "super_admin",
      is_active: true,
    }, { onConflict: "user_id" })

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      isNew: true,
    })
  } catch (error) {
    console.error("Admin seed error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
