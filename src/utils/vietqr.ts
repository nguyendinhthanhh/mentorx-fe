/**
 * VietQR bank BIN mapping – maps common Vietnamese bank names to their NAPAS BIN codes.
 * Used for generating VietQR-compatible QR codes for admin payouts.
 *
 * @see https://www.vietqr.io/danh-sach-ngan-hang
 */

const BANK_BIN_MAP: Record<string, string> = {
  // State-owned / big-four
  'vietcombank': '970436',
  'vcb': '970436',
  'vietinbank': '970415',
  'viettinbank': '970415',
  'ctg': '970415',
  'bidv': '970418',
  'agribank': '970405',
  'vba': '970405',

  // Joint-stock commercial banks
  'techcombank': '970407',
  'tcb': '970407',
  'mbbank': '970422',
  'mb': '970422',
  'mb bank': '970422',
  'vpbank': '970432',
  'acb': '970416',
  'sacombank': '970403',
  'stb': '970403',
  'hdbank': '970437',
  'tpbank': '970423',
  'tp bank': '970423',
  'ocb': '970448',
  'shb': '970443',
  'eximbank': '970431',
  'msb': '970426',
  'maritimebank': '970426',
  'maritime bank': '970426',
  'vib': '970441',
  'seabank': '970440',
  'sea bank': '970440',
  'lienvietpostbank': '970449',
  'lpb': '970449',
  'lienviet': '970449',
  'saigonbank': '970400',
  'sgb': '970400',
  'bacabank': '970409',
  'baca bank': '970409',
  'pvcombank': '970412',
  'abbank': '970425',
  'ab bank': '970425',
  'namcombank': '970428',
  'namabank': '970428',
  'ncb': '970419',
  'baovibank': '970438',
  'baoviet': '970438',
  'kienlongbank': '970452',
  'klb': '970452',
  'pgbank': '970430',
  'vietabank': '970427',
  'vab': '970427',
  'vietbank': '970454',
  'vietcapitalbank': '970454',
  'dongabank': '970406',
  'dab': '970406',
  'gpbank': '970408',
  'cbbank': '970444',
  'cbv': '970444',

  // E-wallets & digital banks
  'momo': '970457',
  'zalopay': '970458',
  'vnpay': '970459',

  // Foreign banks (Vietnam branch)
  'cimb': '422589',
  'wooribank': '970457',
  'uob': '970458',
  'shinhanbank': '970424',
  'shinhan': '970424',
}

/**
 * Resolve a free-text bank name to a VietQR BIN code.
 * Returns undefined if no match found.
 */
export function resolveBankBin(bankName: string): string | undefined {
  if (!bankName) return undefined
  const normalised = bankName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
  // Direct match
  if (BANK_BIN_MAP[normalised]) return BANK_BIN_MAP[normalised]
  // Partial match – find the first key that is a substring of the normalised name
  for (const [key, bin] of Object.entries(BANK_BIN_MAP)) {
    if (normalised.includes(key)) return bin
  }
  return undefined
}

/**
 * Generate VietQR data string for a bank transfer.
 * Returns the full QR content (VietQR URL for img) or a raw data string.
 */
export function buildVietQRData(opts: {
  bankBin: string
  accountNo: string
  accountName?: string
  amount?: number
  description?: string
}): string {
  const { bankBin, accountNo, amount, description, accountName } = opts
  const params = new URLSearchParams()
  if (amount && amount > 0) params.set('amount', String(Math.round(amount)))
  if (description) params.set('addInfo', description)
  if (accountName) params.set('accountName', accountName)
  const qs = params.toString()
  return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png${qs ? '?' + qs : ''}`
}
