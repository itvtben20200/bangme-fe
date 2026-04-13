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
