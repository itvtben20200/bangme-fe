/**
 * Resolves a media key to a full URL.
 * If the key is already a full URL (e.g. from seed data), return it as-is.
 * In development (or when USE_LOCAL_UPLOAD is true), use the API URL to serve local uploads.
 * In production, prefix with the CloudFront / CDN domain.
 */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (key.startsWith('http://') || key.startsWith('https://')) return key
  
  // In development, serve from local uploads directory via the backend
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_USE_LOCAL_UPLOAD === 'true'
  
  if (isDevelopment) {
    // Remove /api from API_URL to get the base backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4002'
    return `${backendUrl}/uploads/${key}`
  }
  
  // Production: use CDN
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'cdn.bangme.com'
  return `https://${cdnDomain}/${key}`
}

export function formatCoins(amount: number): string {
  return amount.toLocaleString() + ' BangCoins'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function calculateCashoutFees(grossUSD: number, platformTaxPercent = 25, processingFeePercent = 2.5) {
  const platformTax   = grossUSD * (platformTaxPercent / 100)
  const afterTax      = grossUSD - platformTax
  const processingFee = afterTax * (processingFeePercent / 100)
  const netAmount     = afterTax - processingFee
  return { grossUSD, platformTax, processingFee, netAmount }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
