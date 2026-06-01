'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Users, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SummaryMetricsProps {
  metrics: {
    totalPageViews: number
    totalSessions: number
    avgSessionDuration: number
    bounceRate: number
    newUsers: number
  }
  delay?: number
}

export function AnalyticsSummary({ metrics, delay = 0 }: SummaryMetricsProps) {
  const summaryCards = [
    {
      title: 'Total Page Views',
      value: metrics.totalPageViews.toLocaleString(),
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Sessions',
      value: metrics.totalSessions.toLocaleString(),
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Avg. Session Duration',
      value: `${metrics.avgSessionDuration}s`,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600',
    },
    {
      title: 'Bounce Rate',
      value: `${metrics.bounceRate}%`,
      icon: AlertCircle,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + index * 0.1 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-5 h-5 ${card.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
