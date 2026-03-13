'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Wallet, Plus, Edit, Trash2, Search, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, searchInputStyle, btnPrimaryStyle, StatCard, actionBtnStyle } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { SalaryRecord, Employee, MealRecord, MessBill } from '@/lib/types'
import { exportToExcel } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import DataTable from '@/components/common/DataTable'

type SalaryForm = { id?: string, employee_id: string, month_input: string, base_salary: number, advance_amount: number, status: 'pending' | 'paid' | 'partial' }

const emptyRecord: SalaryForm = { employee_id: '', month_input: new Date().toISOString().slice(0, 7), base_salary: 0, advance_amount: 0, status: 'pending' }

export default function SalaryPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([])
  const [messBills, setMessBills] = useState<MessBill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<SalaryForm>(emptyRecord)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [rRes, eRes, mRes, bRes] = await Promise.all([
        supabase.from('salary_records')
          .select('id, employee_id, month, year, base_salary, advance_amount, net_salary, status, employees(name)')
          .order('year', { ascending: false })
          .order('month', { ascending: false }),
        supabase.from('employees')
          .select('id, name, salary')
          .order('name'),
        supabase.from('meal_records')
          .select('id, employee_id, date'),
        supabase.from('mess_bills')
          .select('id, month, year, total_amount')
      ])
      
      if (rRes.data) setRecords(rRes.data as unknown as SalaryRecord[])
      if (eRes.data) setEmployees(eRes.data as unknown as Employee[])
      if (mRes.data) setMealRecords(mRes.data as unknown as MealRecord[])
      if (bRes.data) setMessBills(bRes.data as unknown as MessBill[])
    } catch (error) {
      console.error('Error fetching salary data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const empName = (r as any).employees?.name || ''
      return empName.toLowerCase().includes(search.toLowerCase())
    })
  }, [records, search])

  const stats = useMemo(() => {
    const totalBase = records.reduce((s, r) => s + (r.base_salary || 0), 0)
    const totalAdvance = records.reduce((s, r) => s + (r.advance_amount || 0), 0)
    const totalPending = records.filter(r => r.status !== 'paid').reduce((s, r) => {
      const mess = getMessExpense(r.employee_id, r.month, r.year)
      return s + ((r.net_salary || 0) - (r.advance_amount || 0) - mess)
    }, 0)
    return { totalBase, totalAdvance, totalPending }
  }, [records, messBills, mealRecords])

  const openModal = (record?: SalaryRecord) => {
    if (record) {
      setForm({
        id: record.id,
        employee_id: record.employee_id,
        month_input: `${record.year}-${record.month.toString().padStart(2, '0')}`,
        base_salary: record.base_salary,
        advance_amount: record.advance_amount || 0,
        status: record.status
      })
    } else {
      setForm({ ...emptyRecord, employee_id: employees[0]?.id || '', base_salary: employees[0]?.salary || 0 })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.employee_id) return alert('Please select an employee')
    
    const [year, month] = form.month_input.split('-').map(Number)
    const payload = {
      employee_id: form.employee_id,
      month,
      year,
      base_salary: form.base_salary,
      advance_amount: form.advance_amount,
      net_salary: form.base_salary,
      status: form.status
    }

    const { error } = form.id 
      ? await supabase.from('salary_records').update(payload).eq('id', form.id)
      : await supabase.from('salary_records').insert(payload)

    if (!error) {
      fetchData()
      setShowModal(false)
    } else {
      alert(error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record?')) {
      const { error } = await supabase.from('salary_records').delete().eq('id', id)
      if (!error) fetchData()
      else alert(error.message)
    }
  }

  const formMonthYear = form.month_input.split('-').map(Number)
  const formMessExpense = form.employee_id && formMonthYear.length === 2 ? getMessExpense(form.employee_id, formMonthYear[1], formMonthYear[0]) : 0

  if (loading && records.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <Loader2 className="animate-spin" size={48} color="#2563eb" />
      <p style={{ color: '#64748b' }}>Processing payroll data...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Records" value={records.length} Icon={Wallet} color="#2563eb" bg="#eff6ff" />
        <StatCard label="Total Base Salary" value={formatCurrency(stats.totalBase)} Icon={Wallet} color="#7c3aed" bg="#f5f3ff" />
        <StatCard label="Advance Payments" value={formatCurrency(stats.totalAdvance)} Icon={Wallet} color="#059669" bg="#ecfdf5" />
        <StatCard label="Net Pending" value={formatCurrency(stats.totalPending)} Icon={Wallet} color="#d97706" bg="#fffbeb" />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Salary Records</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                const data = records.map(r => {
                  const mess = getMessExpense(r.employee_id, r.month, r.year)
                  return {
                    Employee: (r as any).employees?.name || 'Unknown',
                    Month: `${r.year}-${r.month.toString().padStart(2, '0')}`,
                    'Base Salary': r.base_salary,
                    'Advance': r.advance_amount,
                    'Mess Deduction': mess,
                    'Net Payable': (r.net_salary || 0) - (r.advance_amount || 0) - mess,
                    Status: r.status
                  }
                })
                exportToExcel(data, `Salary_Backup_${new Date().toISOString().split('T')[0]}`, 'Salaries')
              }}
              style={{ ...btnPrimaryStyle, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#445569' }}
            >
              <FileSpreadsheet size={18} color="#059669" /> Export
            </button>
            <button onClick={() => openModal()} style={btnPrimaryStyle}><Plus size={16} /> Add Record</button>
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
            { header: 'Employee', accessor: (r: any) => r.employees?.name || 'Unknown', sortable: true },
            { header: 'Month', accessor: (r: SalaryRecord) => `${r.year}-${r.month.toString().padStart(2, '0')}` },
            { header: 'Base', accessor: (r: SalaryRecord) => formatCurrency(r.base_salary), align: 'right' },
            { header: 'Advance', accessor: (r: SalaryRecord) => <span style={{ color: '#f59e0b' }}>{formatCurrency(r.advance_amount)}</span>, align: 'right' },
            { header: 'Mess', accessor: (r: SalaryRecord) => <span style={{ color: '#ea580c', fontWeight: 600 }}>{formatCurrency(getMessExpense(r.employee_id, r.month, r.year))}</span>, align: 'right' },
            { header: 'Remaining', accessor: (r: SalaryRecord) => {
              const mess = getMessExpense(r.employee_id, r.month, r.year)
              return <span style={{ fontWeight: 700 }}>{formatCurrency((r.net_salary || 0) - (r.advance_amount || 0) - mess)}</span>
            }, align: 'right' },
            { header: 'Status', accessor: 'status', align: 'center' },
            { header: '', accessor: (r: SalaryRecord) => (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => openModal(r)} style={actionBtnStyle('edit')}><Edit size={16} /></button>
                <button onClick={() => handleDelete(r.id)} style={actionBtnStyle('delete')}><Trash2 size={16} /></button>
              </div>
            ), align: 'right' }
          ]}
          data={filteredRecords}
        />
      </div>

      {showModal && (
        <Modal title={form.id ? 'Edit Salary Record' : 'Add Salary Record'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Employee Name *</label>
            <select 
              value={form.employee_id} 
              onChange={e => {
                const emp = employees.find(emp => emp.id === e.target.value)
                setForm({ ...form, employee_id: e.target.value, base_salary: emp?.salary || 0 })
              }} 
              style={inputStyle}
            >
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Month</label><input type="month" value={form.month_input} onChange={e => setForm({...form, month_input: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Base Salary (Rs.)</label><input type="number" value={form.base_salary} onChange={e => setForm({...form, base_salary: Number(e.target.value)})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Advance Paid (Rs.)</label><input type="number" value={form.advance_amount} onChange={e => setForm({...form, advance_amount: Number(e.target.value)})} style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} style={inputStyle}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Basic Salary</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(form.base_salary)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: '#ea580c' }}>Mess Deduction</span>
                <span style={{ fontWeight: 600, color: '#ea580c' }}>- {formatCurrency(formMessExpense)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '0.875rem', color: '#f59e0b' }}>Advance Adjustment</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>- {formatCurrency(form.advance_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Net Payable</span>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#2563eb' }}>{formatCurrency(form.base_salary - form.advance_amount - formMessExpense)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
