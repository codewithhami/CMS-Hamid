'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Layers, Plus, Edit, Trash2, Search, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, searchInputStyle, btnPrimaryStyle, actionBtnStyle, StatCard } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { ThreadExpense } from '@/lib/types'
import { exportToExcel } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import DataTable from '@/components/common/DataTable'
import { useFactory } from '@/context/FactoryContext'

type ThreadForm = { id?: string, date: string, thread_type: string, quantity: number, unit: string, total_amount: number }

const emptyForm: ThreadForm = { date: new Date().toISOString().split('T')[0], thread_type: '', quantity: 0, unit: 'boxes', total_amount: 0 }

export default function ThreadExpensePage() {
  const [records, setRecords] = useState<ThreadExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ThreadForm>(emptyForm)

  const supabase = createClient()
  const { activeFactory } = useFactory()

  useEffect(() => {
    if (activeFactory) fetchData()
  }, [activeFactory?.id])

  async function fetchData() {
    if (!activeFactory) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('thread_expenses')
        .select('id, date, thread_type, quantity, unit, total_amount')
        .eq('factory_id', activeFactory.id)
        .order('date', { ascending: false })
      if (!error && data) setRecords(data as ThreadExpense[])
    } catch (error) {
      console.error('Error fetching thread expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    return records.filter(r => r.thread_type.toLowerCase().includes(search.toLowerCase()))
  }, [records, search])

  const totalExpense = useMemo(() => records.reduce((s, r) => s + Number(r.total_amount), 0), [records])

  const openModal = (record?: ThreadExpense) => {
    if (record) {
      setForm({ ...record })
    } else {
      setForm(emptyForm)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!activeFactory) return alert('No active factory selected')
    const payload = { 
      date: form.date, 
      thread_type: form.thread_type, 
      quantity: form.quantity, 
      unit: form.unit, 
      total_amount: form.total_amount,
      factory_id: activeFactory.id
    }
    const { error } = form.id 
      ? await supabase.from('thread_expenses').update(payload).eq('id', form.id)
      : await supabase.from('thread_expenses').insert(payload)
    if (!error) { fetchData(); setShowModal(false) } else alert(error.message)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record?')) {
      const { error } = await supabase.from('thread_expenses').delete().eq('id', id)
      if (!error) fetchData()
      else alert(error.message)
    }
  }

  if (loading && records.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <Loader2 className="animate-spin" size={48} color="#7c3aed" />
      <p style={{ color: '#64748b' }}>Loading thread inventory...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Records" value={records.length} Icon={Layers} color="#7c3aed" bg="#f5f3ff" />
        <StatCard label="Total Expense" value={formatCurrency(totalExpense)} Icon={Layers} color="#059669" bg="#ecfdf5" />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Thread Expenses</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                const data = records.map(r => ({ Date: r.date, Type: r.thread_type, Qty: r.quantity, Unit: r.unit, Amount: r.total_amount }))
                exportToExcel(data, `Thread_Expenses_${new Date().toISOString().split('T')[0]}`, 'Expenses')
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
            type="text" placeholder="Search thread types..." value={search} onChange={e => setSearch(e.target.value)} 
            style={searchInputStyle} 
          />
        </div>

        <DataTable 
          columns={[
            { header: 'Date', accessor: 'date', sortable: true },
            { header: 'Thread Type', accessor: 'thread_type', sortable: true },
            { header: 'Quantity', accessor: (r: ThreadExpense) => `${r.quantity} ${r.unit}` },
            { header: 'Total Amount', accessor: (r: ThreadExpense) => <span style={{ fontWeight: 700 }}>{formatCurrency(r.total_amount)}</span>, align: 'right' },
            { header: '', accessor: (r: ThreadExpense) => (
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
        <Modal title={form.id ? 'Edit Thread Expense' : 'Add Thread Expense'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Thread Type</label><input type="text" value={form.thread_type} onChange={e => setForm({...form, thread_type: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Quantity</label><input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Unit</label><input type="text" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} style={inputStyle} /></div>
          <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Total Amount (Rs.) *</label><input type="number" value={form.total_amount} onChange={e => setForm({...form, total_amount: Number(e.target.value)})} style={inputStyle} /></div>
        </Modal>
      )}
    </div>
  )
}
