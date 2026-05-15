"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"

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
    <>
      <Header />

      <main className="min-h-screen pt-32 pb-16 lg:pt-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
              Let&apos;s Connect
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Ready to elevate your business strategy? We&apos;d love to hear from you.
            </p>
          </div>

          {/* Form */}
          <div className="mx-auto mt-12 max-w-xl">
            <div className="rounded-lg border border-border bg-card p-8">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Send us a message
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="name"
                      className="block text-sm font-medium text-foreground"
                    >
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
                      className="mt-1.5 w-full rounded-md border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground"
                    >
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
                      className="mt-1.5 w-full rounded-md border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="company"
                    className="block text-sm font-medium text-foreground"
                  >
                    Company Name
                  </Label>

                  <Input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Your Company Inc."
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-md border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground"
                  >
                    How can we help?
                  </Label>

                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your business challenges and goals..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="mt-1.5 w-full resize-none rounded-md border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}