'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Scissors, Plus, Edit, Trash2, Search, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, searchInputStyle, btnPrimaryStyle, actionBtnStyle, StatCard } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { ClippingExpense } from '@/lib/types'
import { exportToExcel } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import DataTable from '@/components/common/DataTable'

type ClipForm = { id?: string, description: string, total_amount: number }

const emptyForm: ClipForm = { description: '', total_amount: 0 }

export default function ClippingExpensePage() {
  const [records, setRecords] = useState<ClippingExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ClipForm>(emptyForm)

  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clipping_expenses')
        .select('id, description, total_amount, created_at')
        .order('created_at', { ascending: false })
      if (!error && data) setRecords(data as ClippingExpense[])
    } catch (error) {
      console.error('Error fetching clipping expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    return records.filter(r => r.description.toLowerCase().includes(search.toLowerCase()))
  }, [records, search])

  const totalExpense = useMemo(() => records.reduce((s, r) => s + Number(r.total_amount), 0), [records])

  const openModal = (record?: ClippingExpense) => {
    if (record) {
      setForm({ id: record.id, description: record.description, total_amount: record.total_amount })
    } else {
      setForm(emptyForm)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    const payload = { description: form.description, total_amount: form.total_amount }
    const { error } = form.id 
      ? await supabase.from('clipping_expenses').update(payload).eq('id', form.id)
      : await supabase.from('clipping_expenses').insert(payload)
    if (!error) { fetchData(); setShowModal(false) } else alert(error.message)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record?')) {
      const { error } = await supabase.from('clipping_expenses').delete().eq('id', id)
      if (!error) fetchData()
      else alert(error.message)
    }
  }

  if (loading && records.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <Loader2 className="animate-spin" size={48} color="#dc2626" />
      <p style={{ color: '#64748b' }}>Loading clipping logs...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Records" value={records.length} Icon={Scissors} color="#dc2626" bg="#fef2f2" />
        <StatCard label="Total Expense" value={formatCurrency(totalExpense)} Icon={Scissors} color="#059669" bg="#ecfdf5" />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Clipping Expenses</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                const data = records.map(r => ({ Clipping: r.description, Amount: r.total_amount, Date: r.created_at }))
                exportToExcel(data, `Clipping_Expenses_${new Date().toISOString().split('T')[0]}`, 'Expenses')
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
            type="text" placeholder="Search by clipping..." value={search} onChange={e => setSearch(e.target.value)} 
            style={searchInputStyle} 
          />
        </div>

        <DataTable 
          columns={[
            { header: 'Clipping', accessor: 'description', sortable: true },
            { header: 'Total Amount', accessor: (r: ClippingExpense) => <span style={{ fontWeight: 700 }}>{formatCurrency(r.total_amount)}</span>, align: 'right' },
            { header: '', accessor: (r: ClippingExpense) => (
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
        <Modal title={form.id ? 'Edit Clipping Expense' : 'Add Clipping Expense'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Clipping *</label>
            <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={inputStyle} placeholder="Enter clipping name" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Amount (Rs.) *</label>
            <input type="number" value={form.total_amount} onChange={e => setForm({...form, total_amount: Number(e.target.value)})} style={inputStyle} />
          </div>
        </Modal>
      )}
    </div>
  )
}
