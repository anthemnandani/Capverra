"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, TrendingUp, DollarSign } from "lucide-react"

const initialStats = {
  totalIdentities: 0,
  totalAssets: 0,
  totalValue: 0,
  averageReturn: 0,
}

export function StatsCards() {
  const [stats, setStats] = useState(initialStats)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats", { cache: "no-store" })
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Failed to load dashboard stats:", error)
      }
    }

    loadStats()
  }, [])

  // ✅ Counter Hook
  const useCounter = (end: number) => {
    const [value, setValue] = useState(0)

    useEffect(() => {
      let start = 0
      const duration = 800
      const step = end / (duration / 16)

      const timer = setInterval(() => {
        start += step
        if (start >= end) {
          setValue(end)
          clearInterval(timer)
        } else {
          setValue(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }, [end])

    return value
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  const formatPercentage = (value: number) =>
    `${value > 0 ? "+" : ""}${value.toFixed(1)}%`

  const cards = [
    {
      title: "Total Identities",
      value: stats.totalIdentities,
      description: "Active client profiles",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Assets",
      value: stats.totalAssets,
      description: "Assets under management",
      icon: Building2,
      color: "text-green-600",
    },
    {
      title: "Portfolio Value",
      value: stats.totalValue,
      description: "Total asset valuation",
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Average Return",
      value: stats.averageReturn,
      description: "Portfolio performance",
      icon: TrendingUp,
      color: stats.averageReturn >= 0 ? "text-green-600" : "text-red-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const animated = useCounter(card.value)

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">
                {card.title === "Portfolio Value"
                  ? formatCurrency(animated)
                  : card.title === "Average Return"
                  ? formatPercentage(animated)
                  : animated}
              </div>

              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}