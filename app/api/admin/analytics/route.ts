import { NextRequest, NextResponse } from 'next/server'

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

// Generate mock analytics data
function generateAnalyticsData(days: number = 30): AnalyticsData {
  const now = new Date()
  const pageViewsData = []
  const trafficSources = [
    { source: 'Organic Search', percentage: 45 },
    { source: 'Direct', percentage: 25 },
    { source: 'Social Media', percentage: 20 },
    { source: 'Referral', percentage: 10 },
  ]

  // Generate page views trend
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    // Realistic fluctuation in page views
    const baseViews = 1000 + Math.random() * 500
    const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.7 : 1
    const views = Math.floor(baseViews * weekendMultiplier)
    const sessions = Math.floor(views * 0.65)
    
    pageViewsData.push({
      date: dateStr,
      views,
      sessions,
    })
  }

  // Top pages
  const topPages = [
    { url: '/dashboard', views: 12500, avgSessionDuration: 245, bounceRate: 32 },
    { url: '/features', views: 9800, avgSessionDuration: 189, bounceRate: 41 },
    { url: '/pricing', views: 8200, avgSessionDuration: 156, bounceRate: 48 },
    { url: '/docs', views: 6900, avgSessionDuration: 342, bounceRate: 24 },
    { url: '/blog', views: 5600, avgSessionDuration: 198, bounceRate: 52 },
    { url: '/contact', views: 3200, avgSessionDuration: 124, bounceRate: 65 },
    { url: '/resources', views: 2800, avgSessionDuration: 276, bounceRate: 38 },
    { url: '/api/docs', views: 2200, avgSessionDuration: 401, bounceRate: 18 },
    { url: '/case-studies', views: 1900, avgSessionDuration: 289, bounceRate: 44 },
    { url: '/about', views: 1600, avgSessionDuration: 167, bounceRate: 56 },
  ]

  // Calculate traffic source visits
  const totalViews = pageViewsData.reduce((sum, day) => sum + day.views, 0)
  const trafficSourcesData = trafficSources.map(source => ({
    source: source.source,
    visits: Math.floor(totalViews * (source.percentage / 100)),
    percentage: source.percentage,
  }))

  // Summary metrics
  const totalPageViews = pageViewsData.reduce((sum, day) => sum + day.views, 0)
  const totalSessions = pageViewsData.reduce((sum, day) => sum + day.sessions, 0)
  const avgSessionDuration = Math.floor(
    topPages.reduce((sum, page) => sum + page.avgSessionDuration, 0) / topPages.length
  )
  const bounceRate = Math.round(
    topPages.reduce((sum, page) => sum + page.bounceRate, 0) / topPages.length
  )

  return {
    pageViews: pageViewsData,
    topPages,
    trafficSources: trafficSourcesData,
    summaryMetrics: {
      totalPageViews,
      totalSessions,
      avgSessionDuration,
      bounceRate,
      newUsers: Math.floor(totalSessions * 0.22),
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const maxDays = 365

    if (days < 1 || days > maxDays) {
      return NextResponse.json(
        { error: `Days must be between 1 and ${maxDays}` },
        { status: 400 }
      )
    }

    const analyticsData = generateAnalyticsData(days)

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
