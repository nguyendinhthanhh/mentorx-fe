import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import {
  analyticsApi,
  AnalyticsPeriod,
  FunnelType,
  JobStatsRole,
  ViewGranularity,
} from '@/api/analyticsApi'

// ─── View Recording (fire-and-forget, 30s client-side debounce) ──────────────

const viewDebounceMap = new Map<string, number>()
const DEBOUNCE_MS = 30_000

export function useRecordView(targetType: string, targetId: string | undefined) {
  const hasFired = useRef(false)

  useEffect(() => {
    if (!targetId || hasFired.current) return

    const key = `${targetType}:${targetId}`
    const lastFired = viewDebounceMap.get(key) || 0
    const now = Date.now()

    if (now - lastFired < DEBOUNCE_MS) return

    hasFired.current = true
    viewDebounceMap.set(key, now)
    analyticsApi.recordView({ targetType, targetId }).catch(() => {})
  }, [targetType, targetId])
}

// ─── View Count ──────────────────────────────────────────────────────────────

export function useViewCount(targetType: string, targetId: string | undefined) {
  return useQuery(
    ['analytics', 'view-count', targetType, targetId],
    () => analyticsApi.getViewCount(targetType, targetId!),
    { enabled: !!targetId, staleTime: 60_000 }
  )
}

// ─── Earnings Summary ────────────────────────────────────────────────────────

export function useEarningsSummary(period: AnalyticsPeriod, startDate?: string, endDate?: string) {
  const { user } = useAuthStore()
  return useQuery(
    ['analytics', 'earnings-summary', user?.userId, period, startDate, endDate],
    () => analyticsApi.getEarningsSummary(user!.userId, period, startDate, endDate),
    { enabled: !!user?.userId, staleTime: 60_000 }
  )
}

// ─── Earnings Daily ──────────────────────────────────────────────────────────

export function useEarningsDaily(page = 0, size = 30) {
  const { user } = useAuthStore()
  return useQuery(
    ['analytics', 'earnings-daily', user?.userId, page, size],
    () => analyticsApi.getEarningsDaily(user!.userId, page, size),
    { enabled: !!user?.userId, staleTime: 60_000 }
  )
}

// ─── Job Stats ───────────────────────────────────────────────────────────────

export function useJobStats(role: JobStatsRole) {
  const { user } = useAuthStore()
  return useQuery(
    ['analytics', 'job-stats', user?.userId, role],
    () => analyticsApi.getJobStats(user!.userId, role),
    { enabled: !!user?.userId, staleTime: 60_000 }
  )
}

// ─── Course Stats ────────────────────────────────────────────────────────────

export function useCourseStats(courseId?: string) {
  const { user } = useAuthStore()
  return useQuery(
    ['analytics', 'course-stats', user?.userId, courseId],
    () => analyticsApi.getCourseStats(user!.userId, courseId),
    { enabled: !!user?.userId, staleTime: 60_000 }
  )
}

// ─── Conversion ──────────────────────────────────────────────────────────────

export function useConversion(funnelType: FunnelType, startDate?: string, endDate?: string) {
  const { user } = useAuthStore()
  return useQuery(
    ['analytics', 'conversion', user?.userId, funnelType, startDate, endDate],
    () => analyticsApi.getConversion(user!.userId, funnelType, startDate, endDate),
    { enabled: !!user?.userId, staleTime: 60_000 }
  )
}

// ─── View Timeline ───────────────────────────────────────────────────────────

export function useViewTimeline(
  targetType: string,
  targetId: string | undefined,
  granularity: ViewGranularity,
  startDate?: string,
  endDate?: string
) {
  return useQuery(
    ['analytics', 'view-timeline', targetType, targetId, granularity, startDate, endDate],
    () => analyticsApi.getViewTimeline(targetType, targetId!, granularity, startDate, endDate),
    { enabled: !!targetId, staleTime: 60_000 }
  )
}

// ─── Dashboard (cached 5min to match backend Redis TTL) ──────────────────────

export function useDashboard() {
  const { user } = useAuthStore()
  return useQuery(
    ['analytics', 'dashboard', user?.userId],
    () => analyticsApi.getDashboard(user!.userId),
    { enabled: !!user?.userId, staleTime: 5 * 60 * 1000 }
  )
}
