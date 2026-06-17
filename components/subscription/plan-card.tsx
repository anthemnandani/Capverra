"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Plan } from "@/lib/plans"

interface PlanCardProps {
  plan: Plan
  isCurrentPlan?: boolean
  isSelected?: boolean
  isLoading?: boolean
  onSelect: (planId: string) => void
}

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  start:    ["2 optimization reports", "2 identities per report", "1 jurisdiction per report"],
  launch:   ["5 optimization reports", "3 identities per report", "2 jurisdictions per report"],
  grow:     ["20 optimization reports", "4 identities per report", "3 jurisdictions per report"],
  dominate: ["50 optimization reports", "4 identities per report", "4 jurisdictions per report"],
}

const POPULAR_PLAN = "launch"

export function PlanCard({
  plan,
  isCurrentPlan,
  isSelected,
  isLoading,
  onSelect,
}: PlanCardProps) {
  const highlights = PLAN_HIGHLIGHTS[plan.id] ?? []
  const isPopular  = plan.id === POPULAR_PLAN

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-6 cursor-pointer transition-all duration-200",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md"
          : isPopular
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/40",
        isCurrentPlan && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      onClick={() => !isCurrentPlan && !isLoading && onSelect(plan.id)}
    >
      {/* Popular badge */}
      {isPopular && !isCurrentPlan && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-4 right-4 size-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}

      {/* Plan header */}
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">
          {plan.name}
          {isCurrentPlan && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">(current)</span>
          )}
        </h3>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tracking-tight text-primary">
            ${plan.price}
          </span>
          <span className="text-sm text-muted-foreground">one-time</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {plan.description}
        </p>
      </div>

      {/* Feature list */}
      <ul className="space-y-3 mb-6 flex-1">
        {highlights.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Check className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
            <span className="text-sm text-foreground">{item}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {!isCurrentPlan && (
        <Button
          className={cn(
            "w-full",
            isSelected || isPopular
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border-primary/50 text-foreground hover:bg-secondary"
          )}
          variant={isSelected || isPopular ? "default" : "outline"}
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(plan.id)
          }}
        >
          {isSelected ? "Selected" : `Get ${plan.name}`}
        </Button>
      )}
    </div>
  )
}