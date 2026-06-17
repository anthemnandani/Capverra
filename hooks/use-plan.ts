"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface UserPlanStatus {
  plan_id:             string
  plan_name:           string
  reports_total:       number
  reports_used:        number
  reports_remaining:   number
  identity_limit:      number
  jurisdiction_limit:  number
  subscription_status: string
  has_active_plan:     boolean
  purchase_id:         string | null
  purchased_at:        string | null
  exhausted_at:        string | null
}

export const FREE_PLAN_STATUS: UserPlanStatus = {
  plan_id:             "free",
  plan_name:           "Free",
  reports_total:       1,
  reports_used:        0,
  reports_remaining:   1,
  identity_limit:      2,
  jurisdiction_limit:  1,
  subscription_status: "free",
  has_active_plan:     false,
  purchase_id:         null,
  purchased_at:        null,
  exhausted_at:        null,
}

// Module-level cache — shared across all hook instances on the page
// Avoids multiple components each firing their own fetch on mount
let cachedStatus: UserPlanStatus | null  = null
let cacheTime:    number                  = 0
const CACHE_TTL_MS = 30_000 // 30 seconds

export function usePlan() {
  const [planStatus, setPlanStatus] = useState<UserPlanStatus>(
    cachedStatus ?? FREE_PLAN_STATUS
  )
  const [isLoading, setIsLoading] = useState(!cachedStatus)
  const [error,     setError]     = useState<string | null>(null)
  const inflightRef               = useRef<Promise<void> | null>(null)

  const fetchPlan = useCallback(async (force = false) => {
    // Return cached if fresh and not forced
    if (!force && cachedStatus && Date.now() - cacheTime < CACHE_TTL_MS) {
      setPlanStatus(cachedStatus)
      setIsLoading(false)
      return
    }

    // Deduplicate concurrent calls — reuse in-flight promise
    if (inflightRef.current) {
      await inflightRef.current
      if (cachedStatus) setPlanStatus(cachedStatus)
      return
    }

    const promise = (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/user/plan", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch plan")
        const data: UserPlanStatus = await res.json()
        cachedStatus = data
        cacheTime    = Date.now()
        setPlanStatus(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plan")
        // Keep last known state on error — don't reset to free
      } finally {
        setIsLoading(false)
        inflightRef.current = null
      }
    })()

    inflightRef.current = promise
    await promise
  }, [])

  useEffect(() => {
    fetchPlan()
  }, [fetchPlan])

  const invalidate = useCallback(() => {
    cachedStatus = null
    cacheTime    = 0
    fetchPlan(true)
  }, [fetchPlan])

  return {
    planStatus,
    isLoading,
    error,
    refetch:           invalidate,       // force refresh (use after checkout success)
    canGenerateReport: planStatus.reports_remaining > 0,
  }
}