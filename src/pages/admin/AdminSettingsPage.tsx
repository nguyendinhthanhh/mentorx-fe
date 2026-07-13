import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { AlertCircle, Plus, RefreshCw, Save, Search, Settings, Trash2 } from 'lucide-react'

import {
  platformSettingApi,
  PlatformSettingResponse,
  PlatformSettingRequest,
} from '@/api/platformSettingApi'
import { useAuthStore } from '@/store/authStore'

const panelClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'

const emptyDraft: PlatformSettingRequest = {
  key: '',
  value: '',
  description: '',
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.userId)
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<PlatformSettingRequest>(emptyDraft)

  const settingsQuery = useQuery(['platform-settings'], platformSettingApi.getAll, {
    retry: false,
  })

  const settings = settingsQuery.data || []
  const selectedSetting = settings.find((setting) => setting.key === selectedKey) || null
  const filteredSettings = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return settings
    return settings.filter((setting) =>
      [setting.key, setting.value, setting.description, setting.updatedByName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    )
  }, [query, settings])

  const createMutation = useMutation(platformSettingApi.create, {
    onSuccess: (setting) => {
      toast.success('Platform setting created')
      setSelectedKey(setting.key)
      setDraft(toDraft(setting))
      void queryClient.invalidateQueries(['platform-settings'])
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not create setting')
    },
  })

  const updateMutation = useMutation(
    ({ key, request }: { key: string; request: PlatformSettingRequest }) => platformSettingApi.update(key, request),
    {
      onSuccess: (setting) => {
        toast.success('Platform setting updated')
        setDraft(toDraft(setting))
        void queryClient.invalidateQueries(['platform-settings'])
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Could not update setting')
      },
    }
  )

  const deleteMutation = useMutation(platformSettingApi.delete, {
    onSuccess: () => {
      toast.success('Platform setting deleted')
      setSelectedKey(null)
      setDraft(emptyDraft)
      void queryClient.invalidateQueries(['platform-settings'])
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Could not delete setting')
    },
  })

  const selectSetting = (setting: PlatformSettingResponse) => {
    setSelectedKey(setting.key)
    setDraft(toDraft(setting))
  }

  const startCreate = () => {
    setSelectedKey(null)
    setDraft(emptyDraft)
  }

  const handleSubmit = () => {
    const normalizedDraft = {
      ...draft,
      key: draft.key.trim(),
      value: draft.value.trim(),
      description: draft.description?.trim(),
      updatedBy: userId,
    }

    if (!normalizedDraft.key || !normalizedDraft.value) {
      toast.error('Key and value are required')
      return
    }

    if (selectedKey) {
      updateMutation.mutate({ key: selectedKey, request: normalizedDraft })
      return
    }

    createMutation.mutate(normalizedDraft)
  }

  const busy = createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Platform Settings</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Manage operational key-value settings used by the platform. Keep secrets in environment variables, not here.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => settingsQuery.refetch()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${settingsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New setting
          </button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className={panelClass}>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-slate-50">Settings registry</h2>
              <p className="mt-0.5 text-xs text-slate-500">{settings.length} settings</p>
            </div>
            <label className="relative block">
              <span className="sr-only">Search settings</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search key, value, description"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 sm:w-72"
              />
            </label>
          </div>

          {settingsQuery.isError ? (
            <ErrorState onRetry={() => settingsQuery.refetch()} />
          ) : settingsQuery.isLoading ? (
            <LoadingRows />
          ) : filteredSettings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50">
                  <tr>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSettings.map((setting) => (
                    <tr
                      key={setting.key}
                      className={
                        selectedKey === setting.key
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {setting.key}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {maskSensitiveValue(setting.key, setting.value)}
                      </td>
                      <td className="max-w-[320px] truncate px-4 py-3 text-slate-600 dark:text-slate-400">
                        {setting.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{setting.updatedAt || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => selectSetting(setting)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className={`${panelClass} h-fit xl:sticky xl:top-6`}>
          <div className="flex items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
            <Settings className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-950 dark:text-slate-50">
              {selectedSetting ? 'Edit setting' : 'Create setting'}
            </h2>
          </div>
          <div className="space-y-4 p-4">
            <Field label="Key">
              <input
                value={draft.key}
                onChange={(event) => setDraft((value) => ({ ...value, key: event.target.value }))}
                disabled={Boolean(selectedKey)}
                maxLength={100}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
                placeholder="wallet.cooling_off_hours"
              />
            </Field>
            <Field label="Value">
              <textarea
                value={draft.value}
                onChange={(event) => setDraft((value) => ({ ...value, value: event.target.value }))}
                className="min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                placeholder="72"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={draft.description || ''}
                onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
                className="min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Explain what this controls and who should change it."
              />
            </Field>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white transition hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {selectedKey ? 'Save changes' : 'Create setting'}
              </button>
              {selectedKey ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete setting "${selectedKey}"?`)) {
                      deleteMutation.mutate(selectedKey)
                    }
                  }}
                  disabled={busy}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-rose-700 dark:text-rose-300">
      <AlertCircle className="h-6 w-6" />
      <p className="font-semibold">Could not load platform settings.</p>
      <button type="button" onClick={onRetry} className="underline underline-offset-4">
        Retry
      </button>
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-40 items-center justify-center p-6 text-center text-sm text-slate-500">
      No platform settings match this view.
    </div>
  )
}

function toDraft(setting: PlatformSettingResponse): PlatformSettingRequest {
  return {
    key: setting.key,
    value: setting.value,
    description: setting.description || '',
  }
}

function maskSensitiveValue(key: string, value: string) {
  if (/secret|token|password|api[_-]?key|private/i.test(key)) {
    return value ? '********' : ''
  }
  return value
}
