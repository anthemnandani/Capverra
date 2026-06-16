import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { resetToken, password } = await req.json();
    if (!resetToken || !password) {
      return NextResponse.json({ error: "Token and password required" }, { status: 400 });
    }

    let email: string;
    try {
      const decoded = JSON.parse(Buffer.from(resetToken, "base64").toString());
      if (decoded.exp < Date.now()) {
        return NextResponse.json({ error: "Reset session expired" }, { status: 400 });
      }
      email = decoded.email;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // User dhundo by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    // const authUser = users.find((u) => u.email === email);
    const authUser = users.find((u: User) => u.email === email);
    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin client se password update — koi session nahi chahiye
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password }
    );
    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}