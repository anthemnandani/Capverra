import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // DB se OTP match karo
    const { data, error } = await supabase
      .from("password_reset_otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // OTP use hua mark karo
    await supabase
      .from("password_reset_otps")
      .update({ used: true })
      .eq("id", data.id);

    // Reset token banao
    const resetToken = Buffer.from(
      JSON.stringify({ email, exp: Date.now() + 15 * 60 * 1000 })
    ).toString("base64");

    return NextResponse.json({ success: true, resetToken });
  } catch (error) {
    console.error("[verify-otp]", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}