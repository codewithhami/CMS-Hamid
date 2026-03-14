export type Profile = {
  id: string
  full_name: string
  email: string
  avatar_url: string
  role: 'admin' | 'manager' | 'viewer'
  created_at: string
  updated_at: string
}

export type Employee = {
  id: string
  name: string
  father_name: string
  cnic: string
  phone: string
  designation: string
  department: string
  salary: number
  joining_date: string
  status: 'active' | 'inactive' | 'terminated'
  address: string
  created_at: string
  updated_at: string
}

export type MealRecord = {
  id: string
  employee_id: string
  date: string
  created_at: string
  employee?: Employee
}

export type SalaryRecord = {
  id: string
  employee_id: string
  month: number
  year: number
  base_salary: number
  advance_amount: number
  net_salary: number
  status: 'pending' | 'paid' | 'partial'
  created_at: string
  employee?: Employee
}

export type ThreadExpense = {
  id: string
  date: string
  thread_type: string
  quantity: number
  unit: string
  total_amount: number
  created_at: string
}


export type ClippingExpense = {
  id: string
  description: string
  total_amount: number
  created_at: string
}

export type RentRecord = {
  id: string
  month: number
  year: number
  amount: number
  status: 'pending' | 'paid'
  created_at: string
}


export type ElectricityBill = {
  id: string
  month: number
  year: number
  total_amount: number
  status: 'pending' | 'paid'
  created_at: string
}

export type MessBill = {
  id: string
  month: number
  year: number
  total_amount: number
  notes: string
}

export type OtherExpense = {
  id: string
  date: string
  description: string
  amount: number
  created_at: string
}



export type OrderPart = {
  id: string
  order_id: string
  part_name: string
  stitches: number
  rate: number
  head: number
  repeat_count: number
  total_bill: number
  is_suit?: boolean
  suit_quantity?: number
}

export type VendorOrder = {
  id: string
  vendor_id: string
  date: string
  design_name: string
  invoice_label?: string
  vendor_order_parts: OrderPart[]
}

export type VendorPayment = {
  id: string
  vendor_id: string
  date: string
  advance_payment: number
  notes: string
}

export type Vendor = {
  id: string
  name: string
  phone: string
  vendor_orders: VendorOrder[]
  vendor_payments: VendorPayment[]
  vendor_taans: VendorTaan[]
}

export type MonthName = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' |
  'July' | 'August' | 'September' | 'October' | 'November' | 'December'

export const MONTHS: MonthName[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
export type VendorTaan = {
  id: string
  vendor_id: string
  date: string
  count: number
  notes: string
  created_at?: string
}
