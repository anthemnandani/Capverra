import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-pretty">
          Overview of your identity and asset management platform.
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity />
        <div className="space-y-6">
          {/* Placeholder for additional dashboard widgets */}
          <div className="h-64 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
            <p className="text-muted-foreground">Additional widgets coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
