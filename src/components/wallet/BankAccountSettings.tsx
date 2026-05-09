import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { bankAccountApi } from '@/api/bankAccountApi'
import { BankAccountRequest, BankAccountResponse } from '@/types'
import { Plus, Trash2, CheckCircle2, CreditCard, Building2, User, Landmark, Info, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface BankAccountSettingsProps {
  userId: string
}

export default function BankAccountSettings({ userId }: BankAccountSettingsProps) {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  const { data: accounts, isLoading } = useQuery(
    ['bankAccounts', userId],
    () => bankAccountApi.getByUserId(userId),
    { enabled: !!userId }
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BankAccountRequest>()

  const createMutation = useMutation(
    (data: BankAccountRequest) => bankAccountApi.create(userId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankAccounts', userId])
        setShowAddForm(false)
        reset()
      },
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Failed to add bank account')
      }
    }
  )

  const deleteMutation = useMutation(
    (accountId: string) => bankAccountApi.delete(userId, accountId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankAccounts', userId])
      }
    }
  )

  const setDefaultMutation = useMutation(
    (accountId: string) => bankAccountApi.setDefault(userId, accountId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankAccounts', userId])
      }
    }
  )

  const onSubmit = (data: BankAccountRequest) => {
    createMutation.mutate({ ...data, isDefault: accounts?.length === 0 })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading your bank accounts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Your Bank Accounts</h2>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-600" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Add New Bank Account</h3>
            <button 
              onClick={() => { setShowAddForm(false); setError(''); }}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 ml-1">Bank Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('bankName', { required: 'Bank name is required' })}
                    placeholder="e.g. Vietcombank"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                  />
                </div>
                {errors.bankName && <p className="text-[10px] text-red-500 ml-1">{errors.bankName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 ml-1">Account Holder Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('accountHolderName', { required: 'Holder name is required' })}
                    placeholder="FULL NAME"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none uppercase"
                  />
                </div>
                {errors.accountHolderName && <p className="text-[10px] text-red-500 ml-1">{errors.accountHolderName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 ml-1">Account Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('accountNumber', { required: 'Account number is required' })}
                    placeholder="001100..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                  />
                </div>
                {errors.accountNumber && <p className="text-[10px] text-red-500 ml-1">{errors.accountNumber.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 ml-1">Branch (Optional)</label>
                <input
                  {...register('branchName')}
                  placeholder="e.g. Hoan Kiem Branch"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                />
              </div>
            </div>

            <button
              disabled={createMutation.isLoading}
              type="submit"
              className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              {createMutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Account
            </button>
          </form>
        </div>
      )}

      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div 
              key={account.id} 
              className={`group relative bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${
                account.isDefault ? 'border-primary-200 ring-1 ring-primary-100' : 'border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-xl ${account.isDefault ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-400'}`}>
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  {account.isDefault && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-full uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" /> Default
                    </span>
                  )}
                  <button 
                    onClick={() => deleteMutation.mutate(account.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{account.bankName}</p>
                <p className="text-base font-bold text-gray-900 tracking-tight">{account.accountNumber}</p>
                <p className="text-sm font-medium text-gray-600">{account.accountHolderName}</p>
              </div>

              {!account.isDefault && (
                <button
                  onClick={() => setDefaultMutation.mutate(account.id)}
                  className="mt-4 w-full py-1.5 border border-gray-100 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No bank accounts added yet</p>
            <p className="text-xs text-gray-400 mt-1">Add a bank account to enable withdrawals</p>
          </div>
        )
      )}
    </div>
  )
}
