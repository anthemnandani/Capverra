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
        if (!response.ok) {
          throw new Error("Failed to fetch stats")
        }

        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Failed to load dashboard stats:", error)
      }
    }

    loadStats()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`
  }

  const cards = [
    {
      title: "Total Identities",
      value: stats.totalIdentities.toString(),
      description: "Active client profiles",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Assets",
      value: stats.totalAssets.toString(),
      description: "Assets under management",
      icon: Building2,
      color: "text-green-600",
    },
    {
      title: "Portfolio Value",
      value: formatCurrency(stats.totalValue),
      description: "Total asset valuation",
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Average Return",
      value: formatPercentage(stats.averageReturn),
      description: "Portfolio performance",
      icon: TrendingUp,
      color: stats.averageReturn >= 0 ? "text-green-600" : "text-red-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className={cn("h-4 w-4", card.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
