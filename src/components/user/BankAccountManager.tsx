import { FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2, Edit2, Building2, CheckCircle2, Loader2, CreditCard } from 'lucide-react'
import { bankAccountApi } from '@/api/bankAccountApi'
import { BankAccountResponse, PayoutMethod } from '@/types'
import { useAuthStore } from '@/store/authStore'

function emptyToUndefined(val: string) {
  return val === '' ? undefined : val
}

function maskAccount(acc: string | undefined | null) {
  if (!acc) return ''
  if (acc.length <= 4) return acc
  return '*'.repeat(acc.length - 4) + acc.slice(-4)
}

export default function BankAccountManager() {
  const { user } = useAuthStore()
  const [accounts, setAccounts] = useState<BankAccountResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const defaultFormState = {
    id: '',
    payoutMethod: PayoutMethod.LOCAL_BANK,
    payoutCountry: 'Vietnam',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    bankCode: '',
    branchName: '',
    notes: '',
  }

  const [form, setForm] = useState(defaultFormState)

  useEffect(() => {
    loadAccounts()
  }, [user?.userId])

  async function loadAccounts() {
    if (!user?.userId) return
    try {
      setLoading(true)
      const data = await bankAccountApi.getByUserId(user.userId)
      setAccounts(data || [])
    } catch (err) {
      toast.error('Unable to load bank accounts.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (acc: BankAccountResponse) => {
    setForm({
      id: acc.id,
      payoutMethod: acc.payoutMethod || PayoutMethod.LOCAL_BANK,
      payoutCountry: acc.payoutCountry || 'Vietnam',
      bankName: acc.bankName || '',
      accountHolderName: acc.accountHolderName || '',
      accountNumber: acc.accountNumber || '',
      bankCode: acc.bankCode || '',
      branchName: acc.branchName || '',
      notes: acc.notes || '',
    })
    setIsEditing(true)
  }

  const handleAddNew = () => {
    setForm(defaultFormState)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setForm(defaultFormState)
    setIsEditing(false)
  }

  const saveAccount = async (event: FormEvent) => {
    event.preventDefault()
    if (!user?.userId) return
    try {
      setSaving(true)
      const payload = {
        payoutMethod: form.payoutMethod,
        payoutCountry: form.payoutCountry.trim(),
        bankName: form.bankName.trim(),
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        bankCode: emptyToUndefined(form.bankCode),
        branchName: emptyToUndefined(form.branchName),
        isDefault: accounts.length === 0 || !!accounts.find(a => a.id === form.id)?.isDefault,
        notes: emptyToUndefined(form.notes),
      }
      
      if (form.id) {
        await bankAccountApi.update(user.userId, form.id, payload)
        toast.success('Cập nhật tài khoản ngân hàng thành công.')
      } else {
        await bankAccountApi.create(user.userId, payload)
        toast.success('Thêm tài khoản ngân hàng thành công.')
      }
      
      setIsEditing(false)
      await loadAccounts()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể lưu tài khoản ngân hàng.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user?.userId) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) return
    try {
      await bankAccountApi.delete(user.userId, id)
      toast.success('Đã xóa tài khoản.')
      await loadAccounts()
    } catch (err) {
      toast.error('Không thể xóa tài khoản.')
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!user?.userId) return
    try {
      await bankAccountApi.setDefault(user.userId, id)
      toast.success('Đã đặt làm mặc định.')
      await loadAccounts()
    } catch (err) {
      toast.error('Không thể đặt làm mặc định.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isEditing && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Danh sách tài khoản ngân hàng</h2>
          <button onClick={handleAddNew} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 shadow-sm">
            <Plus className="h-4 w-4" />
            Thêm tài khoản
          </button>
        </div>
      )}

      {!isEditing && accounts.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <CreditCard className="h-6 w-6 text-slate-500 dark:text-slate-400" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Chưa có tài khoản ngân hàng</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Hãy thêm tài khoản ngân hàng để thực hiện thanh toán hoặc rút tiền dễ dàng hơn.</p>
        </div>
      )}

      {!isEditing && accounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map(acc => (
            <div key={acc.id} className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all ${acc.isDefault ? 'border-primary-500 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-950/20' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'}`}>
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className={`h-5 w-5 ${acc.isDefault ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                    <h3 className="font-bold text-slate-900 dark:text-white">{acc.bankName}</h3>
                  </div>
                  {acc.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      <CheckCircle2 className="h-3 w-3" /> Mặc định
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Tên: <span className="font-bold">{acc.accountHolderName}</span></p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">STK: <span className="font-bold">{maskAccount(acc.accountNumber)}</span></p>
                  {acc.branchName && <p className="text-xs text-slate-500">Chi nhánh: {acc.branchName}</p>}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(acc)} className="inline-flex items-center gap-1.5 rounded-lg text-xs font-bold text-slate-600 transition hover:text-primary-600 dark:text-slate-400">
                    <Edit2 className="h-3.5 w-3.5" /> Sửa
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="inline-flex items-center gap-1.5 rounded-lg text-xs font-bold text-slate-600 transition hover:text-red-600 dark:text-slate-400">
                    <Trash2 className="h-3.5 w-3.5" /> Xóa
                  </button>
                </div>
                {!acc.isDefault && (
                  <button onClick={() => handleSetDefault(acc.id)} className="text-xs font-bold text-primary-600 hover:underline dark:text-primary-400">
                    Đặt mặc định
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <form onSubmit={saveAccount} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">{form.id ? 'Sửa tài khoản ngân hàng' : 'Thêm tài khoản ngân hàng'}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Nhập chính xác thông tin để quá trình giao dịch không bị gián đoạn.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ngân hàng thụ hưởng</span>
              <input required type="text" placeholder="VD: Vietcombank, Techcombank..." value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="mt-2 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tên chủ tài khoản</span>
              <input required type="text" placeholder="VIET HOA KHONG DAU" value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} className="mt-2 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Số tài khoản</span>
              <input required type="text" placeholder="Nhập số tài khoản" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="mt-2 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quốc gia</span>
              <input required type="text" value={form.payoutCountry} onChange={(e) => setForm({ ...form, payoutCountry: e.target.value })} className="mt-2 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chi nhánh (Tùy chọn)</span>
              <input type="text" placeholder="VD: Chi nhánh Tân Bình" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className="mt-2 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </label>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button type="button" onClick={handleCancel} disabled={saving} className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu tài khoản
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
