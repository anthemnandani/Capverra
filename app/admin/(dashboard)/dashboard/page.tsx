"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getDashboardStats, checkAdminStatus } from "@/lib/admin-actions"
import type { DashboardStats, AdminUser } from "@/lib/admin-types"
import {
  Users,
  FolderOpen,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Globe,
  Shield,
  Clock,
  ArrowUpRight,
  Sparkles,
  Target,
  Eye,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { AnalyticsSummary } from "@/components/admin/analytics-summary"
import { DateRangePicker } from "@/components/admin/date-range-picker"

// Animated counter component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      setCount(Math.floor(progress * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{count.toLocaleString()}</span>
}

// Metric card with 3D hover effect
function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay = 0,
  onClick,
}: {
  title: string
  value: number
  change?: number
  icon: React.ElementType
  color: "indigo" | "emerald" | "amber" | "rose" | "cyan" | "purple"
  delay?: number
  onClick?: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  const colorClasses = {
    indigo: {
      bg: "from-indigo-500/20 to-indigo-600/5",
      icon: "from-indigo-500 to-indigo-600",
      glow: "shadow-indigo-500/20",
      text: "text-indigo-400",
    },
    emerald: {
      bg: "from-emerald-500/20 to-emerald-600/5",
      icon: "from-emerald-500 to-emerald-600",
      glow: "shadow-emerald-500/20",
      text: "text-emerald-400",
    },
    amber: {
      bg: "from-amber-500/20 to-amber-600/5",
      icon: "from-amber-500 to-amber-600",
      glow: "shadow-amber-500/20",
      text: "text-amber-400",
    },
    rose: {
      bg: "from-rose-500/20 to-rose-600/5",
      icon: "from-rose-500 to-rose-600",
      glow: "shadow-rose-500/20",
      text: "text-rose-400",
    },
    cyan: {
      bg: "from-cyan-500/20 to-cyan-600/5",
      icon: "from-cyan-500 to-cyan-600",
      glow: "shadow-cyan-500/20",
      text: "text-cyan-400",
    },
    purple: {
      bg: "from-purple-500/20 to-purple-600/5",
      icon: "from-purple-500 to-purple-600",
      glow: "shadow-purple-500/20",
      text: "text-purple-400",
    },
  }

  const colors = colorClasses[color]

  return (
    <motion.button
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative group w-full text-left ${onClick ? "cursor-pointer" : ""}`}
    >
      <motion.div
        animate={{
          rotateX: isHovered ? -5 : 0,
          rotateY: isHovered ? 5 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Glow effect */}
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r ${colors.bg} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />

        <Card className="relative bg-card border-border backdrop-blur-xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-foreground to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>

          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">{title}</p>
                <motion.p
                  className="text-3xl lg:text-4xl font-bold text-foreground"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.2, type: "spring" }}
                >
                  <AnimatedCounter value={value} />
                </motion.p>
                {change !== undefined && (
                  <div className="flex items-center gap-1">
                    {change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        change >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {change >= 0 ? "+" : ""}
                      {change}%
                    </span>
                    <span className="text-muted-foreground text-sm">vs last week</span>
                  </div>
                )}
              </div>

              <motion.div
                animate={{
                  rotate: isHovered ? 12 : 0,
                  scale: isHovered ? 1.1 : 1,
                }}
                className={`p-3 rounded-xl bg-gradient-to-br ${colors.icon} shadow-lg ${colors.glow}`}
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.button>
  )
}

// Activity timeline item
function ActivityItem({
  action,
  resource,
  time,
  index,
}: {
  action: string
  resource: string
  time: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-colors group"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        {index < 4 && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-primary/30 to-transparent" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium truncate">{action}</p>
        <p className="text-muted-foreground text-xs truncate">{resource}</p>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Clock className="w-3 h-3" />
        {time}
      </div>
    </motion.div>
  )
}

// Quick action button
function QuickAction({
  label,
  icon: Icon,
  href,
  color,
  delay,
}: {
  label: string
  icon: React.ElementType
  href: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring" }}
    >
      <Link href={href}>
        <Button
          variant="outline"
          className={`h-auto py-4 px-6 flex flex-col items-center gap-2 bg-accent/50 border-border hover:bg-accent transition-all duration-300 group`}
        >
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ duration: 0.5 }}
            className={`p-2 rounded-lg ${color}`}
          >
            <Icon className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">
            {label}
          </span>
        </Button>
      </Link>
    </motion.div>
  )
}

// Parallax background shapes
function ParallaxShapes() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -150])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        style={{ y: y1 }}
        className="absolute top-20 right-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-40 left-20 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
      />
      <motion.div
        style={{ y: y3 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/5 blur-3xl"
      />
    </div>
  )
}

// Live pulse indicator
function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
      </span>
      <span className="text-emerald-400 text-sm font-medium">Live</span>
    </div>
  )
}

interface AnalyticsData {
  pageViews: Array<{ date: string; views: number; sessions: number }>
  topPages: Array<{ url: string; views: number; avgSessionDuration: number; bounceRate: number }>
  trafficSources: Array<{ source: string; visits: number; percentage: number }>
  summaryMetrics: {
    totalPageViews: number
    totalSessions: number
    avgSessionDuration: number
    bounceRate: number
    newUsers: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedDays, setSelectedDays] = useState(30)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, { adminUser }] = await Promise.all([
          getDashboardStats(),
          checkAdminStatus(),
        ])
        setStats(statsData)
        setAdminUser(adminUser)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true)
      try {
        const response = await fetch(`/api/admin/analytics?days=${selectedDays}`)
        if (response.ok) {
          const data: AnalyticsData = await response.json()
          setAnalyticsData(data)
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setAnalyticsLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedDays])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative">
      <ParallaxShapes />

      <div className="relative space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
              Welcome back, {adminUser?.name || "Admin"}
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <span role="img" aria-label="wave">{"("}</span>
              </motion.span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with your platform today
            </p>
          </div>
          <LiveIndicator />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <MetricCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            change={stats?.userGrowth}
            icon={Users}
            color="indigo"
            delay={0}
            onClick={() => router.push("/admin/users")}
          />
          <MetricCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={Activity}
            color="emerald"
            delay={0.1}
            onClick={() => router.push("/admin/users")}
          />
          <MetricCard
            title="Total Assets"
            value={stats?.totalAssets || 0}
            change={stats?.assetGrowth}
            icon={FolderOpen}
            color="amber"
            delay={0.2}
            onClick={() => router.push("/admin/assets")}
          />
          <MetricCard
            title="Identities"
            value={stats?.totalIdentities || 0}
            icon={Shield}
            color="cyan"
            delay={0.3}
            onClick={() => router.push("/admin/dashboard")}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <MetricCard
            title="Reports Generated"
            value={stats?.reportsGenerated || 0}
            icon={FileText}
            color="purple"
            delay={0.4}
          />
          <MetricCard
            title="System Uptime"
            value={99}
            icon={Zap}
            color="emerald"
            delay={0.5}
          />
          <MetricCard
            title="Global Reach"
            value={42}
            icon={Globe}
            color="rose"
            delay={0.6}
          />
        </div>

        {/* Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-card border-border backdrop-blur-xl h-full">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <QuickAction
                  label="View Users"
                  icon={Users}
                  href="/admin/users"
                  color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                  delay={0.5}
                />
                <QuickAction
                  label="View Assets"
                  icon={FolderOpen}
                  href="/admin/assets"
                  color="bg-gradient-to-br from-amber-500 to-amber-600"
                  delay={0.6}
                />
                <QuickAction
                  label="New Report"
                  icon={FileText}
                  href="/admin/reports"
                  color="bg-gradient-to-br from-purple-500 to-purple-600"
                  delay={0.7}
                />
                <QuickAction
                  label="Analytics"
                  icon={BarChart3}
                  href="/admin/reports"
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  delay={0.8}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="bg-card border-border backdrop-blur-xl h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Recent Activity
                </CardTitle>
                <Link
                  href="/admin/reports"
                  className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
                >
                  View all
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-1">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((activity, index) => (
                    <ActivityItem
                      key={activity.id}
                      action={activity.action}
                      resource={`${activity.resource_type} ${activity.resource_id || ""}`}
                      time={new Date(activity.created_at).toLocaleString()}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-muted-foreground/70 text-sm">
                      Activity will appear here as admins take actions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analytics Section */}
        {analyticsData && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <DateRangePicker
                selectedDays={selectedDays}
                onDaysChange={setSelectedDays}
                onRefresh={() => window.location.reload()}
                onExport={() => {
                  const csv = [
                    ['Date', 'Page Views', 'Sessions'],
                    ...analyticsData.pageViews.map(d => [d.date, d.views, d.sessions])
                  ].map(row => row.join(',')).join('\n')
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `analytics-${selectedDays}days.csv`
                  a.click()
                }}
                isLoading={analyticsLoading}
              />
            </motion.div>

            <AnalyticsSummary metrics={analyticsData.summaryMetrics} delay={0.8} />

            <AnalyticsCharts
              pageViews={analyticsData.pageViews}
              topPages={analyticsData.topPages}
              trafficSources={analyticsData.trafficSources}
              delay={0.9}
            />
          </>
        )}

        {/* Charts Section */}
        {!analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-card border-border backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    User Growth Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                      >
                        <BarChart3 className="w-8 h-8 text-primary" />
                      </motion.div>
                      <p className="text-muted-foreground">Analytics visualization</p>
                      <p className="text-muted-foreground/70 text-sm">
                        Loading charts...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Asset Distribution Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-card border-border backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-amber-500" />
                    Asset Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        animate={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4"
                      >
                        <PieChart className="w-8 h-8 text-amber-500" />
                      </motion.div>
                      <p className="text-muted-foreground">Asset breakdown</p>
                      <p className="text-muted-foreground/70 text-sm">
                        Loading distribution...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
