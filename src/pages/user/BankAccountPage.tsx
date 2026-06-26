import BankAccountManager from '@/components/user/BankAccountManager'
import { CreditCard } from 'lucide-react'

export default function BankAccountPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shadow-inner">
          <CreditCard className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tài khoản ngân hàng</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Quản lý các tài khoản ngân hàng dùng cho thanh toán và rút tiền.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800 shadow-sm p-6 lg:p-8">
        <BankAccountManager />
      </div>
    </div>
  )
}
