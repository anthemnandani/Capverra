import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Verify requester is authenticated
    const supabase = await createSupabaseServerClient()
    const { data: { user: requester } } = await supabase.auth.getUser()

    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Verify requester is super_admin
    const adminClient = createSupabaseAdminClient()
    const { data: requesterData } = await adminClient
      .from("users")
      .select("role")
      .eq("id", requester.id)
      .single()

    if (!requesterData || requesterData.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can delete users" },
        { status: 403 }
      )
    }

    const targetUserId = params.userId

    // 3. Prevent self-deletion
    if (targetUserId === requester.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    // 4. Get all identity IDs for this user (needed to cascade reports)
    const { data: identities } = await adminClient
      .from("identities")
      .select("id")
      .eq("user_id", targetUserId)

    const identityIds = (identities || []).map((i: { id: string }) => i.id)

    // 5. Get all asset IDs for this user (needed to cascade reports)
    const { data: assets } = await adminClient
      .from("assets")
      .select("id")
      .eq("user_id", targetUserId)

    const assetIds = (assets || []).map((a: { id: string }) => a.id)

    // 6. Delete optimization reports linked to user's assets or identities
    if (assetIds.length > 0) {
      await adminClient
        .from("optimization_reports")
        .delete()
        .in("asset_id", assetIds)
    }

    // 7. Delete assets
    await adminClient
      .from("assets")
      .delete()
      .eq("user_id", targetUserId)

    // 8. Delete identities
    await adminClient
      .from("identities")
      .delete()
      .eq("user_id", targetUserId)

    // 9. Delete from public.users table
    await adminClient
      .from("users")
      .delete()
      .eq("id", targetUserId)

    // 10. Delete from auth.users (must be last)
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(targetUserId)

    if (authDeleteError) {
      return NextResponse.json({ error: authDeleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}