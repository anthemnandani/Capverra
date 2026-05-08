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

    const name = body.name?.trim()
    const email = body.email?.trim()
    const company = body.company?.trim()
    const message = body.message?.trim()

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          error: "Name, email and message are required",
        },
        { status: 400 }
      )
    }

    await transporter.sendMail({
      from: `"${process.env.SMTP_SENDER_NAME}" <${process.env.SMTP_SENDER_EMAIL}>`,
      to: process.env.SMTP_SENDER_EMAIL,
      replyTo: email,
      subject: `New Contact Request from ${name}`,
      html: `
      <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">
              
              <table width="600" cellpadding="0" cellspacing="0" 
                style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                
                <!-- Header -->
                <tr>
                  <td 
                    style="
                      background:linear-gradient(135deg,#111827,#1f2937);
                      padding:32px;
                      text-align:center;
                    "
                  >
                    <h1 style="margin:0;color:#ffffff;font-size:28px;">
                      New Contact Request
                    </h1>

                    <p style="margin:10px 0 0;color:#d1d5db;font-size:14px;">
                      Capverra Website Contact Form
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:32px;">

                    <table width="100%" cellpadding="0" cellspacing="0">
                      
                      <tr>
                        <td style="padding-bottom:20px;">
                          <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">
                            FULL NAME
                          </p>

                          <p style="margin:0;font-size:16px;color:#111827;font-weight:600;">
                            ${name}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-bottom:20px;">
                          <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">
                            EMAIL ADDRESS
                          </p>

                          <p style="margin:0;font-size:16px;color:#111827;font-weight:600;">
                            ${email}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-bottom:20px;">
                          <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">
                            COMPANY
                          </p>

                          <p style="margin:0;font-size:16px;color:#111827;font-weight:600;">
                            ${company || "Not Provided"}
                          </p>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <p style="margin:0 0 10px;font-size:13px;color:#6b7280;">
                            MESSAGE
                          </p>

                          <div
                            style="
                              background:#f9fafb;
                              border:1px solid #e5e7eb;
                              border-radius:12px;
                              padding:18px;
                              color:#111827;
                              font-size:15px;
                              line-height:1.7;
                            "
                          >
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
                    style="
                      background:#f9fafb;
                      border-top:1px solid #e5e7eb;
                      padding:20px;
                      text-align:center;
                    "
                  >
                    <p style="margin:0;font-size:13px;color:#6b7280;">
                      This message was submitted from the Capverra contact page.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    })
  } catch (error) {
    console.error("[CONTACT_ERROR]", error)

    return NextResponse.json(
      {
        error: "Failed to send message",
      },
      { status: 500 }
    )
  }
}