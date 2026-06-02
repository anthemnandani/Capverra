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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const response = await fetch("/api/dashboard/activity", { cache: "no-store" })
        const data = await response.json()
        setActivities(data)
      } catch (error) {
        console.error("Failed to load activity:", error)
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "asset_added":
        return <Plus className="h-4 w-4 text-green-600" />
      case "identity_added":
        return <Plus className="h-4 w-4 text-amber-600" />
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
        return <Badge className="bg-green-100 text-green-800">Asset</Badge>
      case "identity_added":
        return <Badge className="bg-amber-100 text-amber-800">Identity</Badge>
      case "valuation_updated":
        return <Badge className="bg-purple-100 text-purple-800">Valuation</Badge>
      case "optimization_generated":
        return <Badge className="bg-orange-100 text-orange-800">AI Analysis</Badge>
      default:
        return <Badge>Activity</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()

    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInSeconds < 60) {
      return "Just now"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return `${diffInDays}d ago`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-4 w-4 bg-gray-300 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="mt-1">{getActivityIcon(activity.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
