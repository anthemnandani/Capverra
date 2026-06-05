// app/api/admin/users/[userId]/role/route.ts
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const VALID_ROLES = ["client", "admin", "super_admin"] as const
type Role = typeof VALID_ROLES[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Verify the requester is authenticated
    const supabase = await createSupabaseServerClient()
    const { data: { user: requester } } = await supabase.auth.getUser()

    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Verify the requester is a super_admin
    const adminClient = createSupabaseAdminClient()
    const { data: requesterData } = await adminClient
      .from("users")
      .select("role")
      .eq("id", requester.id)
      .single()

    if (!requesterData || requesterData.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can change user roles" },
        { status: 403 }
      )
    }

    // 3. Parse and validate new role
    const body = await request.json()
    const newRole: Role = body.role

    if (!VALID_ROLES.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      )
    }

    const targetUserId = params.userId

    // 4. Prevent self-demotion
    if (targetUserId === requester.id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      )
    }

    // 5. Update role in public.users table
    const { error: updateError } = await adminClient
      .from("users")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", targetUserId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 6. Also update user_metadata in auth.users for consistency
    await adminClient.auth.admin.updateUserById(targetUserId, {
      user_metadata: { role: newRole },
    })

    return NextResponse.json({ success: true, role: newRole })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}