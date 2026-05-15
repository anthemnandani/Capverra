"use client"

import { joinWaitlist } from "@/app/(public)/actions/waitlist"
import { useState } from "react"

export function Pricing() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(formData: FormData) {
    setStatus("loading")
    setMessage("")

    const result = await joinWaitlist(formData)

    if (result.error) {
      setStatus("error")
      setMessage(result.error)
    } else {
      setStatus("success")
      setMessage("You're on the list! We'll be in touch soon.")
    }
  }

  return (
    <section id="pricing" className="bg-background pt-32 pb-20 sm:pb-28 lg:pt-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Coming Soon!
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            We&apos;re working hard to bring you something amazing. Join our waitlist to be the first to know when we launch.
          </p>

          <form action={handleSubmit} className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                disabled={status === "loading" || status === "success"}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-sm"
              />
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "loading" ? "Joining..." : status === "success" ? "Joined!" : "Join Waitlist"}
              </button>
            </div>

            {message && (
              <p
                className={`mt-4 text-sm ${
                  status === "error" ? "text-red-500" : "text-green-500"
                }`}
              >
                {message}
              </p>
            )}
          </form>

           <p className="mt-8 text-sm text-muted-foreground">
            By joining, you agree to receive updates and marketing communications from us.
          </p>
        </div>
      </div>
    </section>
  )
}
