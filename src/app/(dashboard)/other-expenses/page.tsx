'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Receipt, Plus, Edit, Trash2, Search, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, searchInputStyle, btnPrimaryStyle, actionBtnStyle, StatCard } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { OtherExpense } from '@/lib/types'
import { exportToExcel } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import DataTable from '@/components/common/DataTable'

type ExpForm = { id?: string, date: string, description: string, amount: number }

const emptyForm: ExpForm = { date: new Date().toISOString().split('T')[0], description: '', amount: 0 }

export default function OtherExpensesPage() {
  const [records, setRecords] = useState<OtherExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ExpForm>(emptyForm)

  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('other_expenses')
        .select('id, date, description, amount')
        .order('date', { ascending: false })
      if (!error && data) setRecords(data as OtherExpense[])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    return records.filter(r => r.description.toLowerCase().includes(search.toLowerCase()))
  }, [records, search])

  const totalExpense = useMemo(() => records.reduce((s, r) => s + Number(r.amount), 0), [records])

  const openModal = (record?: OtherExpense) => {
    if (record) {
      setForm({ id: record.id, date: record.date, description: record.description, amount: record.amount })
    } else {
      setForm(emptyForm)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    const payload = { date: form.date, description: form.description, amount: form.amount }
    const { error } = form.id 
      ? await supabase.from('other_expenses').update(payload).eq('id', form.id)
      : await supabase.from('other_expenses').insert(payload)
    if (!error) { fetchData(); setShowModal(false) } else alert(error.message)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record?')) {
      const { error } = await supabase.from('other_expenses').delete().eq('id', id)
      if (!error) fetchData()
      else alert(error.message)
    }
  }

  if (loading && records.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <Loader2 className="animate-spin" size={48} color="#0891b2" />
      <p style={{ color: '#64748b' }}>Filing expense records...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Miscellaneous" value={formatCurrency(totalExpense)} Icon={Receipt} color="#059669" bg="#ecfdf5" />
        <StatCard label="Total Records" value={records.length} Icon={Receipt} color="#0891b2" bg="#ecfeff" />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Other Expenses</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                const data = records.map(r => ({ Date: r.date, Description: r.description, Amount: r.amount }))
                exportToExcel(data, `Other_Expenses_Backup_${new Date().toISOString().split('T')[0]}`, 'Expenses')
              }}
              style={{ ...btnPrimaryStyle, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#445569' }}
            >
              <FileSpreadsheet size={16} color="#059669" /> Export
            </button>
            <button onClick={() => openModal()} style={btnPrimaryStyle}><Plus size={16} /> Add Record</button>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
          <input 
            type="text" placeholder="Search by description..." value={search} onChange={e => setSearch(e.target.value)} 
            style={searchInputStyle} 
          />
        </div>

        <DataTable 
          columns={[
            { header: 'Date', accessor: 'date', sortable: true },
            { header: 'Description', accessor: 'description', sortable: true },
            { header: 'Amount', accessor: (r: OtherExpense) => <span style={{ fontWeight: 700 }}>{formatCurrency(r.amount)}</span>, align: 'right' },
            { header: '', accessor: (r: OtherExpense) => (
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
        <Modal title={form.id ? 'Edit Expense' : 'Add Expense'} onClose={() => setShowModal(false)} onSave={handleSave} loading={false}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Description *</label>
            <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} placeholder="Expense details" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Amount (Rs.)</label>
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} style={inputStyle} />
          </div>
        </Modal>
      )}
    </div>
  )
}
