import { X, Send, AlertTriangle, ShieldAlert, CheckCircle2, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { notificationApi } from '@/api/notificationApi'

interface AdminNotifyModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  referenceId?: string
  referenceType?: 'TRANSACTION' | 'WALLET' | 'ACCOUNT'
  actionType: 'REJECT' | 'FREEZE' | 'AUDIT'
  onConfirm?: (message: string) => void
}

const TEMPLATES = {
  REJECT: [
    { title: 'Incorrect Bank Info', content: 'Yêu cầu rút tiền của bạn bị từ chối do thông tin ngân hàng không chính xác. Vui lòng cập nhật lại.' },
    { title: 'Suspicious Activity', content: 'Giao dịch bị từ chối để bảo mật do phát hiện dấu hiệu bất thường. Vui lòng liên hệ hỗ trợ.' },
    { title: 'Insufficient Balance', content: 'Số dư khả dụng không đủ để thực hiện lệnh rút này sau khi trừ phí.' }
  ],
  FREEZE: [
    { title: 'Security Lock', content: 'Tài khoản của bạn đã bị tạm khóa để bảo vệ tài sản do phát hiện truy cập trái phép.' },
    { title: 'Policy Violation', content: 'Ví của bạn bị phong tỏa do vi phạm chính sách giao dịch của nền tảng.' },
    { title: 'Verification Required', content: 'Vui lòng hoàn thành xác minh danh tính nâng cao để tiếp tục sử dụng ví.' }
  ],
  AUDIT: [
    { title: 'Balance Correction', content: 'Hệ thống đã thực hiện điều chỉnh số dư sau khi đối soát dữ liệu ledger.' },
    { title: 'Fee Adjustment', content: 'Thông báo về việc điều chỉnh phí giao dịch cho các lệnh vừa thực hiện.' }
  ]
}

export default function AdminNotifyModal({ isOpen, onClose, userId, referenceId, referenceType, actionType, onConfirm }: AdminNotifyModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const templates = TEMPLATES[actionType] || []

  const handleSend = async () => {
    const finalMessage = customMessage || (selectedTemplate !== null ? templates[selectedTemplate].content : '')
    
    if (!finalMessage) {
      toast.error('Please select a template or enter a message')
      return
    }

    setIsSending(true)
    try {
      const title = selectedTemplate !== null ? templates[selectedTemplate].title : `System Alert: ${actionType}`
      const content = referenceId 
        ? `${finalMessage} (Ref: ${referenceType} #${referenceId})`
        : finalMessage

      await notificationApi.sendNotification({
        userId,
        title,
        message: content,
        notificationType: 'SYSTEM'
      })
      
      if (onConfirm) {
        onConfirm(content)
      } else {
        toast.success('Notification sent to user')
      }
      onClose()
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
           <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${actionType === 'FREEZE' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                 {actionType === 'FREEZE' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                 <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Notify User</h3>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Action: {actionType}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all text-gray-400">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Template</label>
              <div className="grid grid-cols-1 gap-2">
                 {templates.map((t, i) => (
                   <button
                    key={i}
                    onClick={() => {
                      setSelectedTemplate(i)
                      setCustomMessage('')
                    }}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${selectedTemplate === i ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10' : 'border-gray-50 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
                   >
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{t.title}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 italic">"{t.content}"</p>
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Or Custom Message</label>
              <textarea 
                value={customMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value)
                  setSelectedTemplate(null)
                }}
                placeholder="Type additional context here..."
                className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all text-sm font-medium resize-none min-h-[100px]"
              />
           </div>

           {referenceId && (
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Context Linked: {referenceType} #{referenceId}</span>
             </div>
           )}
        </div>

        <div className="p-8 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-50 dark:border-gray-800 flex gap-4">
           <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-all"
           >
              Cancel
           </button>
           <button 
            onClick={handleSend}
            disabled={isSending}
            className="flex-1 py-4 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2"
           >
              {isSending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Send & Confirm
           </button>
        </div>
      </div>
    </div>
  )
}
