import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export const dynamic = "force-dynamic"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const subject = body.subject?.trim()
    const message = body.message?.trim()
    const email = body.email?.trim()

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

    await transporter.sendMail({
      from: `"${process.env.SMTP_SENDER_NAME}" <${process.env.SMTP_SENDER_EMAIL}>`,
      to: process.env.SMTP_SENDER_EMAIL,
      replyTo: email || process.env.SMTP_SENDER_EMAIL,
      subject: `Help Request: ${subject}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background-color:#f4f7fb;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:650px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td
              style="background:linear-gradient(135deg,#111827,#1f2937);padding:32px;text-align:center;">
              
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:700;">
                New Support Request
              </h1>

              <p style="margin:10px 0 0;color:#d1d5db;font-size:14px;">
                Capverra Support Center
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">

              <table width="100%" cellpadding="0" cellspacing="0"
                style="border-collapse:collapse;">

                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;">
                      SUBJECT
                    </p>

                    <div
                      style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;font-size:15px;font-weight:500;">
                      ${subject}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;">
                      USER EMAIL
                    </p>

                    <div
                      style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;font-size:15px;">
                      ${email || "Not provided"}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-weight:600;">
                      MESSAGE
                    </p>

                    <div
                      style="padding:18px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;font-size:15px;line-height:1.7;color:#111827;">
                      ${message.replace(/\n/g, "<br/>")}
                    </div>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              style="padding:24px;text-align:center;background:#f9fafb;border-top:1px solid #e5e7eb;">

              <p style="margin:0;font-size:13px;color:#6b7280;">
                This message was submitted from the Capverra Help & Support form.
              </p>

              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Capverra. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
    })

    return NextResponse.json({
      success: true,
      message: "Support message sent successfully",
    })
  } catch (error) {
    console.error("[HELP_SUPPORT_ERROR]", error)

    return NextResponse.json(
      {
        error: "Failed to send support message",
      },
      { status: 500 }
    )
  }
}