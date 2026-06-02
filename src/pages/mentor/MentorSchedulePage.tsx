import { FormEvent, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, Clock3, MessageCircle, Plus, Save, Trash2, Users } from 'lucide-react'
import { mentorApi } from '@/api/mentorApi'
import { useAuthStore } from '@/store/authStore'
import { LoadingRows, MetricCard, PageShell, SelectInput, StateCard, StatusPill, TextInput, Toolbar } from './shared/MentorHubUI'

type AvailabilitySlot = {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive?: boolean
}

const days = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

export default function MentorSchedulePage() {
  const { user } = useAuthStore()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming' | 'availability' | 'past'>('calendar')
  const [draft, setDraft] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' })

  useEffect(() => {
    void loadSchedule()
  }, [user?.userId])

  const loadSchedule = async () => {
    if (!user?.userId) return
    try {
      setLoading(true)
      setError('')
      const weekly = await mentorApi.getWeeklyAvailability(user.userId)
      const flattened = Object.entries(weekly.weeklySchedule || {}).flatMap(([day, daySlots]) =>
        (daySlots as AvailabilitySlot[]).map((slot) => ({
          ...slot,
          dayOfWeek: Number(slot.dayOfWeek ?? day),
        }))
      )
      setSlots(flattened)
      setBlockedDates(weekly.blockedDates || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load mentor schedule.')
    } finally {
      setLoading(false)
    }
  }

  const activeSlots = useMemo(() => slots.filter((slot) => slot.isActive !== false), [slots])
  const slotsByDay = useMemo(() => {
    return days.map((day) => ({
      ...day,
      slots: activeSlots
        .filter((slot) => Number(slot.dayOfWeek) === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
  }, [activeSlots])

  const addSlot = async (event: FormEvent) => {
    event.preventDefault()
    if (!user?.userId) return
    if (draft.startTime >= draft.endTime) {
      toast.error('End time must be later than start time.')
      return
    }
    try {
      setSaving(true)
      await mentorApi.createAvailabilitySlot(user.userId, {
        dayOfWeek: draft.dayOfWeek,
        startTime: draft.startTime,
        endTime: draft.endTime,
        isActive: true,
      })
      toast.success('Availability slot saved.')
      await loadSchedule()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save availability.')
    } finally {
      setSaving(false)
    }
  }

  const deleteSlot = async (slot: AvailabilitySlot) => {
    if (!user?.userId || !slot.id) return
    try {
      setSaving(true)
      await mentorApi.deleteAvailabilitySlot(user.userId, slot.id)
      toast.success('Availability slot removed.')
      await loadSchedule()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not remove availability.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      eyebrow="MentorHub"
      title="Schedule"
      description="Manage your availability and see real sessions when the booking module provides them."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Upcoming sessions" value="0" helper="No session API is available yet." icon={<CalendarDays className="h-5 w-5" />} />
        <MetricCard label="Pending bookings" value="0" helper="Bookings are not exposed by backend yet." icon={<Users className="h-5 w-5" />} tone="amber" />
        <MetricCard label="Available slots" value={activeSlots.length} helper="Recurring weekly slots." icon={<Clock3 className="h-5 w-5" />} tone="emerald" />
        <MetricCard label="Blocked dates" value={blockedDates.length} helper="Dates marked unavailable." icon={<CalendarDays className="h-5 w-5" />} tone="slate" />
      </div>

      <Toolbar>
        <div className="flex w-full overflow-x-auto rounded-2xl bg-slate-100 p-1 lg:w-auto">
          {[
            ['calendar', 'Calendar'],
            ['upcoming', 'Upcoming'],
            ['availability', 'Availability'],
            ['past', 'Past'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`h-10 whitespace-nowrap rounded-xl px-4 text-sm font-black transition ${activeTab === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold text-slate-500 lg:ml-auto">
          Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone || 'Browser timezone'}
        </p>
      </Toolbar>

      {loading ? (
        <LoadingRows rows={4} />
      ) : error ? (
        <StateCard tone="error" title="Unable to load schedule" message={error} action={<button onClick={loadSchedule} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">Retry</button>} />
      ) : activeTab === 'availability' ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Weekly availability</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Booked sessions are not overwritten here. This page only manages recurring free slots.</p>
              </div>
              <StatusPill label={`${activeSlots.length} slots`} tone="indigo" />
            </div>
            <div className="mt-5 space-y-3">
              {slotsByDay.map((day) => (
                <div key={day.value} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <p className="w-32 shrink-0 text-sm font-black text-slate-900">{day.label}</p>
                    {day.slots.length === 0 ? (
                      <p className="text-sm font-semibold text-slate-400">No availability</p>
                    ) : (
                      <div className="flex flex-1 flex-wrap gap-2">
                        {day.slots.map((slot, index) => (
                          <span key={slot.id || `${day.value}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700">
                            {slot.startTime} - {slot.endTime}
                            {slot.id ? (
                              <button disabled={saving} onClick={() => deleteSlot(slot)} className="text-rose-500 hover:text-rose-700" aria-label="Remove slot">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={addSlot} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Add slot</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Use real weekly availability data from the mentor availability endpoint.</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Day</span>
                <SelectInput value={draft.dayOfWeek} onChange={(event) => setDraft({ ...draft, dayOfWeek: Number(event.target.value) })} className="mt-2 w-full">
                  {days.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </SelectInput>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Start</span>
                  <TextInput type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} className="mt-2 w-full" />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">End</span>
                  <TextInput type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} className="mt-2 w-full" />
                </label>
              </div>
              <button disabled={saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <Save className="h-4 w-4 animate-pulse" /> : <Plus className="h-4 w-4" />}
                Save slot
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'calendar' ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-7">
            {slotsByDay.map((day) => (
              <div key={day.value} className="min-h-[160px] rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{day.label}</p>
                <div className="mt-4 space-y-2">
                  {day.slots.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-400">No slots</p>
                  ) : (
                    day.slots.map((slot, index) => (
                      <div key={slot.id || index} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-indigo-700 shadow-sm">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <StateCard
          title={activeTab === 'upcoming' ? 'No sessions scheduled' : 'No past sessions available'}
          message={activeTab === 'upcoming' ? 'When clients book sessions through a backend booking module, they will appear here.' : 'Completed session history will appear when session tracking exists.'}
          action={<button type="button" onClick={() => setActiveTab('availability')} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white"><MessageCircle className="h-4 w-4" /> Manage availability</button>}
        />
      )}
    </PageShell>
  )
}
