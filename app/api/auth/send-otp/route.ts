import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // User exist check
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!userData) {
      return NextResponse.json({ success: true }); // security
    }

    // Purane OTPs expire karo
    await supabase
      .from("password_reset_otps")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false);

    // Naya OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error: insertError } = await supabase
      .from("password_reset_otps")
      .insert({ email, otp, expires_at: expiresAt.toISOString() });

    if (insertError) throw insertError;

    // Gmail se email bhejo
    await transporter.sendMail({
      from: `"Capverra" <${process.env.SMTP_USERNAME}>`,
      to: email,
      subject: "Your Password Reset Code",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Code</h2>
          <p>Your one-time code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f4f4f5; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #999; font-size: 14px;">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-otp]", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}