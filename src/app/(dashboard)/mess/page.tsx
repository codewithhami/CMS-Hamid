'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Utensils, Plus, Trash2, Edit, Search, Loader2, FileSpreadsheet } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, searchInputStyle, btnPrimaryStyle, actionBtnStyle, StatCard } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { MealRecord, Employee, MessBill } from '@/lib/types'
import { exportToExcel } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import DataTable from '@/components/common/DataTable'
import { useFactory } from '@/context/FactoryContext'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function MessPage() {
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [messBills, setMessBills] = useState<MessBill[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals
  const [showMealModal, setShowMealModal] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)

  // Forms
  const [mealForm, setMealForm] = useState({ id: '', employee_id: '', date: new Date().toISOString().split('T')[0] })
  const [billForm, setBillForm] = useState<{ id?: string, month: number, year: number, total_amount: number, notes: string }>({
    month: new Date().getMonth() + 1, year: new Date().getFullYear(), total_amount: 0, notes: ''
  })

  // Selected filter (for expense breakdown)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const supabase = createClient()
  const { activeFactory } = useFactory()

  useEffect(() => {
    if (activeFactory) fetchData()
  }, [activeFactory?.id])

  async function fetchData() {
    if (!activeFactory) return
    setLoading(true)
    try {
      const [mRes, eRes, bRes] = await Promise.all([
        supabase.from('meal_records').select('id, employee_id, date, employees(name)').eq('factory_id', activeFactory.id).order('date', { ascending: false }),
        supabase.from('employees').select('id, name').eq('factory_id', activeFactory.id).order('name'),
        supabase.from('mess_bills').select('*').eq('factory_id', activeFactory.id).order('year', { ascending: false }).order('month', { ascending: false })
      ])
      if (mRes.data) setMeals(mRes.data as unknown as MealRecord[])
      if (eRes.data) setEmployees(eRes.data as unknown as Employee[])
      if (bRes.data) setMessBills(bRes.data as unknown as MessBill[])
    } catch (error) {
      console.error('Error fetching mess data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveMeal = async () => {
    if (!mealForm.employee_id) return alert('Please select an employee')
    if (!activeFactory) return alert('No active factory selected')
    const payload = { employee_id: mealForm.employee_id, date: mealForm.date, factory_id: activeFactory.id }
    const { error } = mealForm.id 
      ? await supabase.from('meal_records').update(payload).eq('id', mealForm.id)
      : await supabase.from('meal_records').insert(payload)
    if (!error) { fetchData(); setShowMealModal(false) } else alert(error.message)
  }

  const deleteMeal = async (id: string) => {
    if (confirm('Delete this meal record?')) {
      const { error } = await supabase.from('meal_records').delete().eq('id', id)
      if (!error) fetchData()
      else alert(error.message)
    }
  }

  const saveBill = async () => {
    if (!activeFactory) return alert('No active factory selected')
    const payload = { month: billForm.month, year: billForm.year, total_amount: billForm.total_amount, notes: billForm.notes, factory_id: activeFactory.id }
    const { error } = billForm.id 
      ? await supabase.from('mess_bills').update(payload).eq('id', billForm.id)
      : await supabase.from('mess_bills').insert(payload)
    if (!error) { fetchData(); setShowBillModal(false) } else alert(error.message)
  }

  // Memoized calculations
  const breakdown = useMemo(() => {
    const mealsInMonth = meals.filter(m => {
      const d = new Date(m.date)
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
    })
    const bill = messBills.find(b => b.month === selectedMonth && b.year === selectedYear)
    const totalMeals = mealsInMonth.length
    const costPerMeal = bill && totalMeals > 0 ? bill.total_amount / totalMeals : 0

    const employeeData = employees.map(emp => {
      const count = mealsInMonth.filter(m => m.employee_id === emp.id).length
      return { id: emp.id, name: emp.name, count, expense: Math.round(costPerMeal * count) }
    }).filter(e => e.count > 0).sort((a, b) => b.expense - a.expense)

    return { bill, totalMeals, costPerMeal, employeeData }
  }, [meals, messBills, employees, selectedMonth, selectedYear])

  const filteredMeals = meals.filter(m => {
    const empName = (m as any).employees?.name || ''
    return empName.toLowerCase().includes(search.toLowerCase())
  })

  const getMealCost = (dateStr: string) => {
    const d = new Date(dateStr)
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    const bill = messBills.find(b => b.month === m && b.year === y)
    if (!bill) return 0
    const mCount = meals.filter(rm => {
      const rd = new Date(rm.date)
      return rd.getMonth() + 1 === m && rd.getFullYear() === y
    }).length
    return mCount > 0 ? Math.round(bill.total_amount / mCount) : 0
  }

  if (loading && meals.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <Loader2 className="animate-spin" size={48} color="#1773cf" />
      <p style={{ color: '#64748b' }}>Calculating mess analytics...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Monthly Breakdown</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => {
                const data = breakdown.employeeData.map(e => ({ Employee: e.name, Meals: e.count, Expense: e.expense }))
                exportToExcel(data, `Mess_Breakdown_${MONTHS[selectedMonth-1]}`, 'Mess')
              }}
              style={{ ...btnPrimaryStyle, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#445569' }}
            >
              <FileSpreadsheet size={16} color="#059669" /> Export
            </button>
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ ...inputStyle, width: 'auto', padding: '4px 8px' }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ ...inputStyle, width: '80px', padding: '4px 8px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <StatCard label="Total Mess Bill" value={formatCurrency(breakdown.bill?.total_amount || 0)} Icon={Utensils} color="#059669" bg="#ecfdf5" small />
          <StatCard label="Total Meals" value={breakdown.totalMeals} Icon={Utensils} color="#2563eb" bg="#eff6ff" small />
          <StatCard label="Cost Per Meal" value={formatCurrency(breakdown.costPerMeal)} Icon={Utensils} color="#7c3aed" bg="#f5f3ff" small />
        </div>

        <DataTable 
          columns={[
            { header: 'Employee', accessor: 'name', sortable: true },
            { header: 'Meals', accessor: 'count', align: 'center' },
            { header: 'Expense', accessor: (e: any) => <span style={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(e.expense)}</span>, align: 'right' }
          ]}
          data={breakdown.employeeData}
        />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mess Bills</h2>
          <button onClick={() => { setBillForm({ month: selectedMonth, year: selectedYear, total_amount: 0, notes: '' }); setShowBillModal(true) }} style={{ ...btnPrimaryStyle, background: '#10b981' }}><Plus size={16} /> Add Bill</button>
        </div>
        <DataTable 
          columns={[
            { header: 'Month', accessor: (b: MessBill) => MONTHS[b.month - 1] },
            { header: 'Year', accessor: 'year' },
            { header: 'Notes', accessor: 'notes' },
            { header: 'Total', accessor: (b: MessBill) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(b.total_amount)}</span>, align: 'right' },
            { header: '', accessor: (b: MessBill) => (
              <button onClick={() => { setBillForm({ ...b }); setShowBillModal(true) }} style={actionBtnStyle('edit')}><Edit size={16} /></button>
            ), align: 'right' }
          ]}
          data={messBills}
        />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Meal Records</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                const data = filteredMeals.map(m => ({ Employee: (m as any).employees?.name, Date: m.date, Expense: getMealCost(m.date) }))
                exportToExcel(data, 'Meal_History', 'Meals')
              }}
              style={{ ...btnPrimaryStyle, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#445569' }}
            >
              <FileSpreadsheet size={16} color="#059669" /> Export
            </button>
            <button onClick={() => { setMealForm({ id: '', employee_id: employees[0]?.id || '', date: new Date().toISOString().split('T')[0] }); setShowMealModal(true) }} style={btnPrimaryStyle} disabled={employees.length === 0}><Plus size={16} /> Add Meal</button>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
          <input 
            type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} 
            style={searchInputStyle} 
          />
        </div>

        <DataTable 
          columns={[
            { header: 'Employee', accessor: (m: any) => m.employees?.name || 'Unknown', sortable: true },
            { header: 'Date', accessor: 'date' },
            { header: 'Meal Expense', accessor: (m: MealRecord) => <span style={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(getMealCost(m.date))}</span>, align: 'right' },
            { header: '', accessor: (m: MealRecord) => (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setMealForm({ ...m }); setShowMealModal(true) }} style={actionBtnStyle('edit')}><Edit size={16} /></button>
                <button onClick={() => deleteMeal(m.id)} style={actionBtnStyle('delete')}><Trash2 size={16} /></button>
              </div>
            ), align: 'right' }
          ]}
          data={filteredMeals}
        />
      </div>

      {showMealModal && (
        <Modal title={mealForm.id ? 'Edit Meal' : 'Add Meal'} onClose={() => setShowMealModal(false)} onSave={saveMeal}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Employee Name *</label>
            <select value={mealForm.employee_id} onChange={e => setMealForm({ ...mealForm, employee_id: e.target.value })} style={inputStyle}>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Date</label>
            <input type="date" value={mealForm.date} onChange={e => setMealForm({ ...mealForm, date: e.target.value })} style={inputStyle} />
          </div>
        </Modal>
      )}

      {showBillModal && (
        <Modal title={billForm.id ? 'Edit Mess Bill' : 'Add Mess Bill'} onClose={() => setShowBillModal(false)} onSave={saveBill}>
          <div>
            <label style={labelStyle}>Month</label>
            <select value={billForm.month} onChange={e => setBillForm({ ...billForm, month: Number(e.target.value) })} style={inputStyle}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Year</label><input type="number" value={billForm.year} onChange={e => setBillForm({ ...billForm, year: Number(e.target.value) })} style={inputStyle} /></div>
          <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Total Amount (Rs.) *</label><input type="number" value={billForm.total_amount} onChange={e => setBillForm({ ...billForm, total_amount: Number(e.target.value) })} style={inputStyle} /></div>
          <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Notes</label><input type="text" value={billForm.notes} onChange={e => setBillForm({ ...billForm, notes: e.target.value })} style={inputStyle} /></div>
        </Modal>
      )}
    </div>
  )
}
