import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { AlertCircle, Plus, RefreshCw, Save, Search, Settings, Trash2 } from 'lucide-react'

import {
  MentorBadgeSettingsRequest,
  MentorBadgeSettingsResponse,
  platformSettingApi,
  PlatformSettingResponse,
  PlatformSettingRequest,
} from '@/api/platformSettingApi'
import { useAuthStore } from '@/store/authStore'

const panelClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
const hiddenSettingPrefixes = ['mentor_badges.']

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
  const [badgeDraft, setBadgeDraft] = useState<MentorBadgeSettingsRequest | null>(null)

  const settingsQuery = useQuery(['platform-settings'], platformSettingApi.getAll, {
    retry: false,
  })
  const mentorBadgeSettingsQuery = useQuery(
    ['mentor-badge-settings'],
    platformSettingApi.getPublicMentorBadgeSettings,
    { retry: false }
  )

  const settings = settingsQuery.data || []
  const visibleSettings = useMemo(
    () =>
      settings.filter(
        (setting) => !hiddenSettingPrefixes.some((prefix) => setting.key.startsWith(prefix))
      ),
    [settings]
  )
  const selectedSetting = visibleSettings.find((setting) => setting.key === selectedKey) || null
  const filteredSettings = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return visibleSettings
    return visibleSettings.filter((setting) =>
      [setting.key, setting.value, setting.description, setting.updatedByName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    )
  }, [query, visibleSettings])

  useEffect(() => {
    if (mentorBadgeSettingsQuery.data) {
      setBadgeDraft(mentorBadgeSettingsQuery.data)
    }
  }, [mentorBadgeSettingsQuery.data])

  const createMutation = useMutation(platformSettingApi.create, {
    onSuccess: (setting) => {
      toast.success('Đã tạo cài đặt hệ thống')
      setSelectedKey(setting.key)
      setDraft(toDraft(setting))
      void queryClient.invalidateQueries(['platform-settings'])
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể tạo cài đặt')
    },
  })

  const updateBadgeSettingsMutation = useMutation(platformSettingApi.updateMentorBadgeSettings, {
    onSuccess: (settings) => {
      toast.success('Đã cập nhật quy tắc huy hiệu mentor')
      setBadgeDraft(settings)
      void queryClient.invalidateQueries(['mentor-badge-settings'])
      void queryClient.invalidateQueries(['platform-settings'])
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật quy tắc huy hiệu mentor')
    },
  })

  const updateMutation = useMutation(
    ({ key, request }: { key: string; request: PlatformSettingRequest }) => platformSettingApi.update(key, request),
    {
      onSuccess: (setting) => {
        toast.success('Đã cập nhật cài đặt hệ thống')
        setDraft(toDraft(setting))
        void queryClient.invalidateQueries(['platform-settings'])
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Không thể cập nhật cài đặt')
      },
    }
  )

  const deleteMutation = useMutation(platformSettingApi.delete, {
    onSuccess: () => {
      toast.success('Đã xóa cài đặt hệ thống')
      setSelectedKey(null)
      setDraft(emptyDraft)
      void queryClient.invalidateQueries(['platform-settings'])
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Không thể xóa cài đặt')
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
      toast.error('Cần nhập cả khóa và giá trị')
      return
    }

    if (selectedKey) {
      updateMutation.mutate({ key: selectedKey, request: normalizedDraft })
      return
    }

    createMutation.mutate(normalizedDraft)
  }

  const busy = createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading
  const badgeBusy = mentorBadgeSettingsQuery.isLoading || updateBadgeSettingsMutation.isLoading
  const badgeDraftChanged =
    badgeDraft != null &&
    mentorBadgeSettingsQuery.data != null &&
    JSON.stringify(badgeDraft) !== JSON.stringify(mentorBadgeSettingsQuery.data)

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Cài đặt nền tảng</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Quản lý các cài đặt vận hành dạng khóa và giá trị. Thông tin bí mật phải nằm trong biến môi trường, không lưu tại đây.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => settingsQuery.refetch()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${settingsQuery.isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Tạo cài đặt
          </button>
        </div>
      </header>

      <section className={`${panelClass} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-slate-50">Quy tắc huy hiệu mentor</h2>
            <p className="mt-0.5 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              Cấu hình huy hiệu mentor hiển thị trên thẻ công khai, hồ sơ công khai và các ngưỡng để mở khóa huy hiệu.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => mentorBadgeSettingsQuery.refetch()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${mentorBadgeSettingsQuery.isFetching ? 'animate-spin' : ''}`} />
              Làm mới quy tắc
            </button>
            <button
              type="button"
              onClick={() => badgeDraft && updateBadgeSettingsMutation.mutate(badgeDraft)}
              disabled={!badgeDraft || !badgeDraftChanged || badgeBusy}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              Lưu quy tắc huy hiệu
            </button>
          </div>
        </div>

        {mentorBadgeSettingsQuery.isError ? (
          <ErrorState onRetry={() => mentorBadgeSettingsQuery.refetch()} />
        ) : !badgeDraft ? (
          <LoadingRows />
        ) : (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Huy hiệu hiển thị</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Bật hoặc tắt từng loại huy hiệu mà không cần triển khai lại marketplace mentor.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleCard
                  title="Đã duyệt"
                  description="Hiển thị dấu xác thực tin cậy trên các bề mặt mentor công khai."
                  checked={badgeDraft.showApprovedBadge}
                  onChange={(checked) => setBadgeDraft((value) => value ? { ...value, showApprovedBadge: checked } : value)}
                />
                <ToggleCard
                  title="Nổi bật"
                  description="Hiển thị huy hiệu nổi bật khi mentor được đánh dấu nổi bật."
                  checked={badgeDraft.showFeaturedBadge}
                  onChange={(checked) => setBadgeDraft((value) => value ? { ...value, showFeaturedBadge: checked } : value)}
                />
                <ToggleCard
                  title="Đánh giá cao"
                  description="Trao huy hiệu dựa trên đánh giá khi đạt ngưỡng điểm và số lượt đánh giá."
                  checked={badgeDraft.showTopRatedBadge}
                  onChange={(checked) => setBadgeDraft((value) => value ? { ...value, showTopRatedBadge: checked } : value)}
                />
                <ToggleCard
                  title="Phản hồi nhanh"
                  description="Hiển thị huy hiệu cho mentor phản hồi trong giới hạn giờ đã cấu hình."
                  checked={badgeDraft.showFastResponseBadge}
                  onChange={(checked) => setBadgeDraft((value) => value ? { ...value, showFastResponseBadge: checked } : value)}
                />
                <ToggleCard
                  title="Kinh nghiệm"
                  description="Hiển thị huy hiệu số năm kinh nghiệm khi đạt ngưỡng tối thiểu."
                  checked={badgeDraft.showExperienceBadge}
                  onChange={(checked) => setBadgeDraft((value) => value ? { ...value, showExperienceBadge: checked } : value)}
                />
                <ToggleCard
                  title="Đặt lịch trực tiếp"
                  description="Hiển thị khi mentor có gói đặt một buổi đang hoạt động."
                  checked={badgeDraft.showDirectBookingBadge}
                  onChange={(checked) => setBadgeDraft((value) => value ? { ...value, showDirectBookingBadge: checked } : value)}
                />
                <ToggleCard
                  title="Minh chứng công khai"
                  description="Hiển thị khi mentor công khai portfolio, chứng chỉ hoặc liên kết minh chứng."
                  checked={badgeDraft.showPublicProofBadge}
                  onChange={(checked) => setBadgeDraft((value) => value ? { ...value, showPublicProofBadge: checked } : value)}
                />
                <ToggleCard
                  title="Đa ngôn ngữ"
                  description="Hiển thị khi mentor hỗ trợ đủ số ngôn ngữ công khai."
                  checked={badgeDraft.showMultilingualBadge}
                  onChange={(checked) => setBadgeDraft((value) => value ? { ...value, showMultilingualBadge: checked } : value)}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ngưỡng và giới hạn</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Các giá trị này kiểm soát khi nào huy hiệu xuất hiện và số huy hiệu hiển thị trong từng layout.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Điểm tối thiểu cho đánh giá cao"
                  hint="Từ 0.0 đến 5.0"
                  step="0.1"
                  value={badgeDraft.topRatedMinRating}
                  onChange={(value) =>
                    setBadgeDraft((current) => current ? { ...current, topRatedMinRating: value } : current)
                  }
                />
                <NumberField
                  label="Số đánh giá tối thiểu"
                  hint="Số lượng đánh giá công khai tối thiểu"
                  value={badgeDraft.topRatedMinReviews}
                  onChange={(value) =>
                    setBadgeDraft((current) => current ? { ...current, topRatedMinReviews: value } : current)
                  }
                />
                <NumberField
                  label="Giờ tối đa để tính phản hồi nhanh"
                  hint="Mentor phải phản hồi trong số giờ này"
                  value={badgeDraft.fastResponseMaxHours}
                  onChange={(value) =>
                    setBadgeDraft((current) => current ? { ...current, fastResponseMaxHours: value } : current)
                  }
                />
                <NumberField
                  label="Số năm kinh nghiệm tối thiểu"
                  hint="Số năm tối thiểu để hiện huy hiệu kinh nghiệm"
                  value={badgeDraft.experienceMinYears}
                  onChange={(value) =>
                    setBadgeDraft((current) => current ? { ...current, experienceMinYears: value } : current)
                  }
                />
                <NumberField
                  label="Số ngôn ngữ tối thiểu"
                  hint="Số ngôn ngữ công khai tối thiểu"
                  value={badgeDraft.multilingualMinLanguages}
                  onChange={(value) =>
                    setBadgeDraft((current) => current ? { ...current, multilingualMinLanguages: value } : current)
                  }
                />
                <NumberField
                  label="Số huy hiệu tối đa trên hồ sơ"
                  hint="Số chip tối đa hiển thị ở hero hồ sơ công khai"
                  value={badgeDraft.profileMaxBadges}
                  onChange={(value) =>
                    setBadgeDraft((current) => current ? { ...current, profileMaxBadges: value } : current)
                  }
                />
                <NumberField
                  label="Số huy hiệu tối đa trên danh sách"
                  hint="Số chip tối đa hiển thị trên thẻ mentor trong danh sách"
                  value={badgeDraft.listMaxBadges}
                  onChange={(value) =>
                    setBadgeDraft((current) => current ? { ...current, listMaxBadges: value } : current)
                  }
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Cách áp dụng hiện tại</p>
                <p className="mt-1">
                  Các trang mentor công khai đọc trực tiếp những quy tắc này từ backend. Lưu tại đây sẽ cập nhật cả thẻ mentor và header hồ sơ mentor.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className={panelClass}>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-slate-50">Danh sách cài đặt</h2>
              <p className="mt-0.5 text-xs text-slate-500">{visibleSettings.length} cài đặt</p>
            </div>
            <label className="relative block">
              <span className="sr-only">Tìm cài đặt</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo khóa, giá trị, mô tả"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 sm:w-72"
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
                    <th className="px-4 py-3">Khóa</th>
                    <th className="px-4 py-3">Giá trị</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3">Cập nhật</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSettings.map((setting) => (
                    <tr
                      key={setting.key}
                      className={
                        selectedKey === setting.key
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20'
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
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          Sửa
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
            <Settings className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-950 dark:text-slate-50">
              {selectedSetting ? 'Sửa cài đặt' : 'Tạo cài đặt'}
            </h2>
          </div>
          <div className="space-y-4 p-4">
            <Field label="Khóa">
              <input
                value={draft.key}
                onChange={(event) => setDraft((value) => ({ ...value, key: event.target.value }))}
                disabled={Boolean(selectedKey)}
                maxLength={100}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-900"
                placeholder="wallet.cooling_off_hours"
              />
            </Field>
            <Field label="Giá trị">
              <textarea
                value={draft.value}
                onChange={(event) => setDraft((value) => ({ ...value, value: event.target.value }))}
                className="min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950"
                placeholder="72"
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                value={draft.description || ''}
                onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
                className="min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Giải thích cài đặt này kiểm soát điều gì và ai nên thay đổi."
              />
            </Field>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {selectedKey ? 'Lưu thay đổi' : 'Tạo cài đặt'}
              </button>
              {selectedKey ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Xóa cài đặt "${selectedKey}"?`)) {
                      deleteMutation.mutate(selectedKey)
                    }
                  }}
                  disabled={busy}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-300 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
    </label>
  )
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  step,
}: {
  label: string
  hint: string
  value: number
  onChange: (value: number) => void
  step?: string
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <input
        type="number"
        value={value}
        step={step}
        onChange={(event) => onChange(toNumberValue(event.target.value, value))}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950"
      />
      <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">{hint}</p>
    </label>
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
      <p className="font-semibold">Không thể tải cài đặt nền tảng.</p>
      <button type="button" onClick={onRetry} className="underline underline-offset-4">
        Thử lại
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
      Không có cài đặt nền tảng nào khớp với bộ lọc hiện tại.
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

function toNumberValue(rawValue: string, fallback: number) {
  const parsed = Number(rawValue)
  return Number.isFinite(parsed) ? parsed : fallback
}
