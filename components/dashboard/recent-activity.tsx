"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Plus } from "lucide-react"

interface ActivityItem {
  id: string
  type: "asset_added" | "identity_added" | "valuation_updated" | "optimization_generated"
  title: string
  description: string
  timestamp: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const response = await fetch("/api/dashboard/activity", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to fetch activity")
        }

        const data = await response.json()
        setActivities(data)
      } catch (error) {
        console.error("Failed to load activity:", error)
      }
    }

    loadActivity()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "asset_added":
        return <Plus className="h-4 w-4 text-green-600" />
      case "identity_added":
        return <Plus className="h-4 w-4 text-blue-600" />
      case "valuation_updated":
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case "optimization_generated":
        return <TrendingUp className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "asset_added":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Asset
          </Badge>
        )
      case "identity_added":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Identity
          </Badge>
        )
      case "valuation_updated":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Valuation
          </Badge>
        )
      case "optimization_generated":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            AI Analysis
          </Badge>
        )
      default:
        return <Badge variant="secondary">Activity</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <div className="flex-shrink-0 text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
