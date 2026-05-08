"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MapPin, Phone } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "contact@capverra.com",
    href: "mailto:contact@capverra.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (555) 000-0000",
    href: "tel:+15550000000",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "123 Strategy Avenue, Suite 500\nNew York, NY 10001",
    href: "#",
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    setLoading(true)

    console.log("Submitting form...")

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    console.log(data)

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong")
    }

    toast.success("Message sent successfully!")

    setFormData({
      name: "",
      email: "",
      company: "",
      message: "",
    })
  } catch (error) {
    console.error("CONTACT FORM ERROR:", error)

    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to send message"
    )
  } finally {
    setLoading(false)
  }
}

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Let&apos;s Connect
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Ready to elevate your business strategy? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div className="rounded-xl border border-border bg-card p-8">
              <h2 className="text-xl font-semibold text-foreground">
                Send us a message
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-foreground">
                    Company Name
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Your Company Inc."
                    value={formData.company}
                    onChange={handleChange}
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground">
                    How can we help?
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your business challenges and goals..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    required
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Get in touch
                </h2>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  Whether you&apos;re looking to transform your business strategy,
                  explore partnership opportunities, or simply have a question,
                  our team is here to help.
                </p>
              </div>

              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-secondary/30"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-foreground group-hover:text-primary transition-colors">
                        {item.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-auto rounded-xl border border-primary/30 bg-primary/5 p-6">
                <h3 className="font-semibold text-foreground">
                  Schedule a Consultation
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Prefer to speak directly with a strategist? Book a complimentary
                  30-minute discovery call to discuss your business needs.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Book a Call
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
