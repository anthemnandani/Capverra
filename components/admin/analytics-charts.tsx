'use client'

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react'

interface ChartData {
  date: string
  views: number
  sessions: number
}

interface TopPage {
  url: string
  views: number
  avgSessionDuration: number
  bounceRate: number
}

interface TrafficSource {
  source: string
  visits: number
  percentage: number
}

interface AnalyticsChartsProps {
  pageViews: ChartData[]
  topPages: TopPage[]
  trafficSources: TrafficSource[]
  delay?: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const CHART_COLORS = {
  views: '#3b82f6',
  sessions: '#10b981',
}

export function AnalyticsCharts({
  pageViews,
  topPages,
  trafficSources,
  delay = 0,
}: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Page Views Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.1 }}
        className="lg:col-span-2"
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Page Views & Sessions Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pageViews}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke={CHART_COLORS.views}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Page Views"
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke={CHART_COLORS.sessions}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Traffic Sources Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.2 }}
      >
        <Card className="bg-card border-border h-full">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-amber-500" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trafficSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, percentage }) => `${source}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="visits"
                >
                  {trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Pages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.3 }}
        className="lg:col-span-3"
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground">
                    <th className="text-left py-3 px-4 font-semibold">Page</th>
                    <th className="text-right py-3 px-4 font-semibold">Views</th>
                    <th className="text-right py-3 px-4 font-semibold">Avg. Duration</th>
                    <th className="text-right py-3 px-4 font-semibold">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((page, index) => (
                    <tr
                      key={page.url}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-foreground font-medium">{page.url}</td>
                      <td className="py-3 px-4 text-right text-foreground">
                        {page.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {page.avgSessionDuration}s
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            page.bounceRate < 40
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : page.bounceRate < 50
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                : 'bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {page.bounceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
