"use client"

import { useState } from "react"
import { Sparkles, AlertCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlanCard } from "@/components/subscription/plan-card"
import { getPaidPlans, getPlan } from "@/lib/plans"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanId: string
  reason?: "report_limit" | "general"
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlanId,
  reason = "general",
}: UpgradeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [isLoading,      setIsLoading]      = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const paidPlans   = getPaidPlans()
  const currentPlan = getPlan(currentPlanId)

  const handleCheckout = async () => {
    if (!selectedPlanId) return
    setIsLoading(true)
    setError(null)
    try {
      const res  = await fetch("/api/stripe/create-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan_id: selectedPlanId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create checkout session")
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent className="!max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border">

        {/* ── Header ── */}
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            Investment Tiers
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            {reason === "report_limit"
              ? `You've used all ${currentPlan.reportLimit} report${currentPlan.reportLimit === 1 ? "" : "s"} included in your ${currentPlan.name} plan. Choose a tier to continue generating optimization reports.`
              : "Choose the plan that aligns with your optimization goals. All plans include our commitment to your success."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Current plan banner ── */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary/60 border border-border text-sm">
          <Sparkles className="size-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            Current plan:{" "}
            <span className="font-semibold text-foreground">{currentPlan.name}</span>
            {" — "}
            {currentPlan.reportLimit} report{currentPlan.reportLimit === 1 ? "" : "s"},{" "}
            {currentPlan.identityLimit} {currentPlan.identityLimit === 1 ? "identity" : "identities"},{" "}
            {currentPlan.jurisdictionLimit} jurisdiction{currentPlan.jurisdictionLimit === 1 ? "" : "s"}
          </span>
        </div>

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2 pt-2">
          {paidPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={plan.id === currentPlanId}
              isSelected={selectedPlanId === plan.id}
              isLoading={isLoading}
              onSelect={setSelectedPlanId}
            />
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive px-1">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-5 border-t border-border mt-2">
          <p className="text-xs text-muted-foreground">
            One-time payment · No recurring charges · Secure checkout via Stripe
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!selectedPlanId || isLoading}
              onClick={handleCheckout}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Redirecting…
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}