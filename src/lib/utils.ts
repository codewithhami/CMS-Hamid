import { OrderPart } from './types'

/**
 * Safely converts any value to a number. 
 * Defaults to 0 if the value is null, undefined, NaN, or non-numeric.
 */
export function safeNumber(val: any): number {
  if (val === null || val === undefined) return 0
  const num = typeof val === 'number' ? val : Number(val)
  return isNaN(num) ? 0 : num
}

/**
 * Formats a number as a currency string.
 * Gracefully handles non-numeric inputs by defaulting to Rs. 0.
 */
export function formatCurrency(amount: any): string {
  const cleanAmount = safeNumber(amount)
  return `Rs. ${cleanAmount.toLocaleString()}`
}

/**
 * Calculates the total bill for a vendor order part.
 */
export function calculatePartBill(part: any): number {
  const stitches = safeNumber(part.stitches)
  const rate = safeNumber(part.rate)
  const head = safeNumber(part.head)
  const repeatCount = safeNumber(part.repeat_count)
  
  return Math.round((stitches / 1000) * rate * head * repeatCount)
}

/**
 * Calculates the total billing for a vendor from their orders and parts.
 */
export function calculateVendorTotalBilling(vendor: any): number {
  if (!vendor) return 0
  const orders = vendor.vendor_orders || []
  return orders.reduce((sum: number, order: any) => {
    const parts = order.vendor_order_parts || []
    return sum + parts.reduce((ps: number, p: any) => ps + calculatePartBill(p), 0)
  }, 0)
}

/**
 * Calculates total paid amount for a vendor.
 */
export function calculateVendorTotalPaid(vendor: any): number {
  if (!vendor) return 0
  const payments = vendor.vendor_payments || []
  return payments.reduce((sum: number, p: any) => sum + safeNumber(p.advance_payment), 0)
}

/**
 * Calculates total taans for a vendor.
 */
export function calculateVendorTaans(vendor: any): number {
  if (!vendor) return 0
  const taans = vendor.vendor_taans || []
  return taans.reduce((sum: number, t: any) => sum + safeNumber(t.count), 0)
}

/**
 * Calculates current balance for a vendor.
 */
export function calculateVendorBalance(vendor: any): number {
  return calculateVendorTotalBilling(vendor) - calculateVendorTotalPaid(vendor)
}

/**
 * Formats a date string to YYYY-MM-DD.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return dateStr.split('T')[0]
}
