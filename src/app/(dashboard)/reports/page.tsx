'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Wallet, Loader2, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react'
import { cardStyle, StatCard, btnPrimaryStyle } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { exportAllToExcel } from '@/lib/exportUtils'
import { formatCurrency, calculateVendorTotalBilling } from '@/lib/utils'
import { Vendor } from '@/lib/types'
import { useFactory } from '@/context/FactoryContext'

type ExpenseData = { label: string; amount: number; color: string; key: string; table: string }

const expenseConfig: ExpenseData[] = [
  { label: 'Salary', amount: 0, color: '#2563eb', key: 'base_salary', table: 'salary_records' },
  { label: 'Thread', amount: 0, color: '#7c3aed', key: 'total_amount', table: 'thread_expenses' },
  { label: 'Clipping', amount: 0, color: '#dc2626', key: 'total_amount', table: 'clipping_expenses' },
  { label: 'Rent', amount: 0, color: '#475569', key: 'amount', table: 'rent_records' },
  { label: 'Electricity', amount: 0, color: '#d97706', key: 'total_amount', table: 'electricity_bills' },
  { label: 'Mess', amount: 0, color: '#ea580c', key: 'total_amount', table: 'mess_bills' },
  { label: 'Other', amount: 0, color: '#0891b2', key: 'amount', table: 'other_expenses' },
]

export default function ReportsPage() {
  const [expenseData, setExpenseData] = useState<ExpenseData[]>(expenseConfig)
  const [revenue, setRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const supabase = createClient()
  const { activeFactory } = useFactory()

  useEffect(() => {
    if (activeFactory) fetchData()
  }, [activeFactory?.id])

  async function fetchData() {
    if (!activeFactory) return
    setLoading(true)
    try {
      const results = await Promise.all([
        supabase.from('salary_records').select('base_salary').eq('factory_id', activeFactory.id),
        supabase.from('thread_expenses').select('total_amount').eq('factory_id', activeFactory.id),
        supabase.from('clipping_expenses').select('total_amount').eq('factory_id', activeFactory.id),
        supabase.from('rent_records').select('amount').eq('factory_id', activeFactory.id),
        supabase.from('electricity_bills').select('total_amount').eq('factory_id', activeFactory.id),
        supabase.from('mess_bills').select('total_amount').eq('factory_id', activeFactory.id),
        supabase.from('other_expenses').select('amount').eq('factory_id', activeFactory.id),
        supabase.from('vendors').select(`
          id,
          vendor_orders (
            id,
            vendor_order_parts (total_bill, stitches, rate, head, repeat_count)
          )
        `).eq('factory_id', activeFactory.id)
      ])

      const newExpenses = [...expenseConfig].map((exp, i) => {
        const data = results[i].data as any[] | null
        const sum = data ? data.reduce((acc, curr) => acc + (Number(curr[exp.key]) || 0), 0) : 0
        return { ...exp, amount: sum }
      })
      setExpenseData(newExpenses)

      const vendors = (results[7].data || []) as unknown as Vendor[]
      const totalRev = vendors.reduce((sum, v) => sum + calculateVendorTotalBilling(v), 0)
      setRevenue(totalRev)

    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportBackup = async () => {
    setExporting(true)
    try {
      const tables = [
        'employees', 'meal_records', 'salary_records', 'salary_advances',
        'thread_expenses', 'clipping_expenses', 'rent_records', 
        'electricity_bills', 'mess_bills', 'other_expenses',
        'vendors', 'vendor_orders', 'vendor_order_parts', 
        'vendor_payments', 'vendor_taans'
      ]

      if (!activeFactory) return alert('No factory selected')

      // Use the factory_id filter for almost all tables
      const results = await Promise.all(tables.map(t => {
        // supplier_order_parts does not natively have factory_id in schema but it has order_id
        // which links back to vendor_id so we must filter it manually. Same for salary advances
        if (t === 'vendor_order_parts' || t === 'salary_advances') {
          return supabase.from(t).select('*')
        }
        return supabase.from(t).select('*').eq('factory_id', activeFactory.id)
      }))
      
      const employees = results[tables.indexOf('employees')].data || []
      const vendors = results[tables.indexOf('vendors')].data || []
      const orders = results[tables.indexOf('vendor_orders')].data || []
      
      const empMap = Object.fromEntries(employees.map((e: any) => [e.id, e.name]))
      const venMap = Object.fromEntries(vendors.map((v: any) => [v.id, v.name]))
      
      const mealRecords = results[tables.indexOf('meal_records')].data || []
      const messBills = results[tables.indexOf('mess_bills')].data || []

      const getMessExpense = (employeeId: string, month: number, year: number): number => {
        const bill = messBills.find(b => b.month === month && b.year === year)
        if (!bill || bill.total_amount === 0) return 0
        const mealsInMonth = mealRecords.filter(m => {
          const d = new Date(m.date)
          return d.getMonth() + 1 === month && d.getFullYear() === year
        })
        const totalMeals = mealsInMonth.length
        if (totalMeals === 0) return 0
        const empMeals = mealsInMonth.filter(m => m.employee_id === employeeId).length
        return Math.round((bill.total_amount / totalMeals) * empMeals)
      }
      const orderMap = Object.fromEntries(orders.map((o: any) => [o.id, { 
        vendor_name: venMap[o.vendor_id] || 'Unknown Vendor',
        design_name: o.design_name 
      }]))

      // UUID to Short ID mapper for Excel readability
      const uuidToShortMap: Record<string, number> = {}
      let nextShortId = 1
      function getShortId(idAsString: string) {
        if (!uuidToShortMap[idAsString]) uuidToShortMap[idAsString] = nextShortId++
        return uuidToShortMap[idAsString]
      }

      const exportSheets = tables.map((name, i) => {
        let data = results[i].data || []
        
        if (data.length > 0) {
          data = data.map((row: any) => {
            let enrichedRow: any = {}
            
            // Loop through keys to insert names immediately after their respective IDs
            for (const key in row) {
              let val = row[key]

              // Replace long UUIDs with short sequential IDs (1 to 1000+)
              if (typeof val === 'string' && val.length > 30 && val.includes('-') && (key === 'id' || key.endsWith('_id'))) {
                val = getShortId(val)
              }

              enrichedRow[key] = val // Assign field with potentially shortened ID

              if (key === 'employee_id' && empMap[row.employee_id]) {
                enrichedRow.Employee_Name = empMap[row.employee_id]
              }
              if (key === 'vendor_id' && venMap[row.vendor_id]) {
                enrichedRow.Vendor_Name = venMap[row.vendor_id]
              }
              if (key === 'order_id' && orderMap[row.order_id]) {
                enrichedRow.Vendor_Name = orderMap[row.order_id].vendor_name
                enrichedRow.Design_Name = orderMap[row.order_id].design_name
              }
            }
            
            if (row.created_at) enrichedRow.created_at = row.created_at.split('T')[0]
            if (row.updated_at) enrichedRow.updated_at = row.updated_at.split('T')[0]
            delete enrichedRow.created_by

            // Specific cleanup
            if (name === 'thread_expenses') {
              delete enrichedRow.vendor; delete enrichedRow.unit_price; delete enrichedRow.notes
            } else if (name === 'salary_records') {
              const base = Number(row.base_salary) || 0
              const advance = Number(row.advance_amount) || 0
              const mess = getMessExpense(row.employee_id, row.month, row.year)
              enrichedRow.Mess_Deduction = mess
              enrichedRow.Remaining_Balance = base - advance - mess
              delete enrichedRow.deductions; delete enrichedRow.bonus; delete enrichedRow.paid_date; delete enrichedRow.notes
            } else if (name === 'vendor_order_parts') {
              enrichedRow.Total_Bill = Math.round((row.stitches / 1000) * row.rate * row.head * row.repeat_count)
            }

            return enrichedRow
          })
        }

        return {
          sheetName: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          data: data
        }
      }).filter(s => s.data.length > 0)

      const totalExpense = expenseData.reduce((s, e) => s + e.amount, 0)
      exportSheets.unshift({
        sheetName: 'Financial Summary',
        data: [{
          'Total Revenue': revenue,
          'Total Expense': totalExpense,
          'Net Profit': revenue - totalExpense,
          'Status': (revenue - totalExpense) >= 0 ? 'Profit' : 'Loss'
        }]
      })

      // Create specialized Vendor Balances sheet
      if (vendors.length > 0) {
        // Fetch full vendor data to calculate bills accurately
        const { data: fullVendors } = await supabase.from('vendors').select(`
          id, name,
          vendor_orders ( vendor_order_parts ( total_bill, stitches, rate, head, repeat_count ) ),
          vendor_payments ( advance_payment )
        `).eq('factory_id', activeFactory.id)
        
        if (fullVendors) {
          const vendorBalancesData = fullVendors.map(v => {
            const orders = v.vendor_orders || []
            const payments = v.vendor_payments || []
            
            const totalBill = orders.reduce((s: number, o: any) => 
               s + (o.vendor_order_parts || []).reduce((ps: number, p: any) => {
                 const stored = Number(p.total_bill) || 0
                 if (stored > 0) return ps + stored
                 return ps + Math.round(((Number(p.stitches)||0) / 1000) * (Number(p.rate)||0) * (Number(p.head)||0) * (Number(p.repeat_count)||0))
               }, 0), 0)
               
            const totalPaid = payments.reduce((s: number, p: any) => s + (Number(p.advance_payment) || 0), 0)
            
            return {
              'Vendor ID': getShortId(v.id),
              'Vendor Name': v.name,
              'Total Billed': totalBill,
              'Total Paid': totalPaid,
              'Remaining Balance': totalBill - totalPaid,
              'Status': (totalBill - totalPaid) > 0 ? 'Owes Money' : (totalBill - totalPaid) < 0 ? 'Overpaid' : 'Settled'
            }
          })
          
          exportSheets.splice(1, 0, {
            sheetName: 'Vendor Balances',
            data: vendorBalancesData
          })
        }
      }

      // Create specialized Mess Breakdown sheet
      if (messBills.length > 0 && mealRecords.length > 0) {
        const messBreakdownData: any[] = []
        
        messBills.forEach(bill => {
          const mealsInMonth = mealRecords.filter(m => {
            if (!m.date) return false
            const d = new Date(m.date)
            return d.getMonth() + 1 === bill.month && d.getFullYear() === bill.year
          })
          
          const totalMeals = mealsInMonth.length
          const costPerMeal = totalMeals > 0 ? bill.total_amount / totalMeals : 0

          employees.forEach(emp => {
            const count = mealsInMonth.filter(m => m.employee_id === emp.id).length
            if (count > 0) {
              messBreakdownData.push({
                'Year': bill.year,
                'Month': bill.month,
                'Employee ID': getShortId(emp.id),
                'Employee Name': emp.name,
                'Meals Taken': count,
                'Cost Per Meal': Math.round(costPerMeal),
                'Total Mess Expense': Math.round(costPerMeal * count)
              })
            }
          })
        })
        
        if (messBreakdownData.length > 0) {
          exportSheets.splice(2, 0, {
            sheetName: 'Mess Breakdown',
            data: messBreakdownData.sort((a, b) => b.Year - a.Year || b.Month - a.Month)
          })
        }
      }

      exportAllToExcel(exportSheets, `Industry_Backup_${new Date().toISOString().split('T')[0]}`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data backup.')
    } finally {
      setExporting(false)
    }
  }

  const totalExpense = expenseData.reduce((s, e) => s + e.amount, 0)
  const maxAmount = Math.max(...expenseData.map(e => e.amount), 1)
  const netProfit = revenue - totalExpense
  const isProfit = netProfit >= 0

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', gap: '16px' }}>
        <Loader2 className="animate-spin" size={48} color="#1773cf" />
        <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>Analyzing reports data...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Reports & Analytics</h1>
        <button 
          onClick={handleExportBackup} 
          disabled={exporting}
          style={{ ...btnPrimaryStyle, background: exporting ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
        >
          {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          {exporting ? 'Generating Backup...' : 'Export Full Backup (Excel)'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Revenue" value={formatCurrency(revenue)} Icon={ArrowUpRight} color="#16a34a" bg="#dcfce7" />
        <StatCard label="Total Expenses" value={formatCurrency(totalExpense)} Icon={ArrowDownRight} color="#dc2626" bg="#fee2e2" />
        <StatCard label={isProfit ? "Net Profit" : "Net Loss"} value={formatCurrency(Math.abs(netProfit))} Icon={Wallet} color={isProfit ? "#2563eb" : "#ea580c"} bg={isProfit ? "#eff6ff" : "#fff7ed"} />
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>Expense Breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {expenseData.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '100px', fontSize: '0.875rem', fontWeight: 500, color: '#334155', flexShrink: 0 }}>{item.label}</span>
              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '8px', height: '32px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(item.amount / maxAmount) * 100}%`,
                  height: '100%', borderRadius: '8px',
                  background: item.color,
                  display: 'flex', alignItems: 'center', paddingLeft: '12px',
                  transition: 'width 0.5s ease',
                  minWidth: item.amount > 0 ? '60px' : '0px',
                }}>
                  {item.amount > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>
                      {formatCurrency(item.amount)}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', width: '80px', textAlign: 'right', flexShrink: 0 }}>
                {totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Category Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {expenseData.map(item => (
            <div key={item.label} style={{
              padding: '16px', borderRadius: '14px', border: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>{item.label}</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(item.amount)}</p>
              </div>
              <div>
                {item.amount > (totalExpense / expenseData.length)
                  ? <TrendingUp size={14} color="#dc2626" />
                  : <TrendingDown size={14} color="#059669" />
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
