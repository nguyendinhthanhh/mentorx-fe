import { X, ShieldCheck, FileText } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-4 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="relative overflow-hidden rounded-[24px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <FileText className="h-4 w-4" />
                </div>
                <Dialog.Title className="text-lg font-bold text-slate-900">
                  Điều khoản Dịch vụ & Quyền riêng tư
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-6 text-sm text-slate-600">
              <div className="space-y-6">
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-900">1. Chấp nhận Điều khoản</h3>
                  <p>
                    Bằng việc truy cập và sử dụng MentorX, bạn chấp nhận và đồng ý bị ràng buộc bởi các điều khoản và quy định của thỏa thuận này.
                    Ngoài ra, khi sử dụng các dịch vụ cụ thể này, bạn sẽ phải tuân theo bất kỳ hướng dẫn hoặc quy tắc nào được đăng tải áp dụng cho các dịch vụ đó.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-900">2. Mô tả Dịch vụ</h3>
                  <p>
                    MentorX cung cấp cho người dùng quyền truy cập vào một bộ sưu tập tài nguyên phong phú, bao gồm nhiều công cụ giao tiếp, diễn đàn, dịch vụ mua sắm,
                    và nội dung được cá nhân hóa. Bạn cũng hiểu và đồng ý rằng dịch vụ có thể bao gồm một số thông tin liên lạc từ MentorX.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-900">3. Quỹ đảm bảo (Escrow) và Thanh toán</h3>
                  <p>
                    Tất cả các giao dịch được thực hiện qua nền tảng đều được bảo mật thông qua hệ thống quỹ đảm bảo (escrow) của chúng tôi. Tiền được giữ an toàn cho đến khi
                    các cột mốc hoặc sản phẩm bàn giao đã thỏa thuận được đáp ứng và được Khách hàng phê duyệt. MXC là token chính thức được sử dụng trong nền tảng.
                  </p>
                </section>
                <section>
                  <h3 className="mb-2 text-base font-bold text-slate-900">4. Chính sách Bảo mật</h3>
                  <p>
                    Dữ liệu đăng ký của bạn và một số thông tin khác về bạn phải tuân theo Chính sách Bảo mật của chúng tôi.
                    Chúng tôi không bao giờ chia sẻ mã cá nhân hoặc ý tưởng của bạn ra ngoài nền tảng mà không có sự cho phép rõ ràng của bạn.
                  </p>
                </section>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
