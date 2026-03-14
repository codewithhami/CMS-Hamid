'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Zap, Plus, Edit, Trash2, Search, FileSpreadsheet, Loader2 } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, searchInputStyle, btnPrimaryStyle, actionBtnStyle, StatCard } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { ElectricityBill } from '@/lib/types'
import { exportToExcel } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import DataTable from '@/components/common/DataTable'
import { useFactory } from '@/context/FactoryContext'

type ElecForm = { id?: string, month_input: string, total_amount: number, status: 'pending' | 'paid' }

const emptyForm: ElecForm = { month_input: new Date().toISOString().slice(0, 7), total_amount: 0, status: 'pending' }

export default function ElectricityPage() {
  const [records, setRecords] = useState<ElectricityBill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ElecForm>(emptyForm)

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
        .from('electricity_bills')
        .select('id, month, year, total_amount, status')
        .eq('factory_id', activeFactory.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
      if (!error && data) setRecords(data as ElectricityBill[])
    } catch (error) {
      console.error('Error fetching electricity bills:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const monthYear = `${r.year}-${r.month.toString().padStart(2, '0')}`
      return monthYear.includes(search) || r.status.toLowerCase().includes(search.toLowerCase())
    })
  }, [records, search])

  const totalBill = useMemo(() => records.reduce((s, r) => s + Number(r.total_amount), 0), [records])

  const openModal = (record?: ElectricityBill) => {
    if (record) {
      setForm({
        id: record.id,
        month_input: `${record.year}-${record.month.toString().padStart(2, '0')}`,
        total_amount: Number(record.total_amount),
        status: record.status
      })
    } else {
      setForm(emptyForm)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!activeFactory) return alert('No active factory selected')
    const [year, month] = form.month_input.split('-').map(Number)
    const payload = { month, year, total_amount: form.total_amount, status: form.status, factory_id: activeFactory.id }
    const { error } = form.id 
      ? await supabase.from('electricity_bills').update(payload).eq('id', form.id)
      : await supabase.from('electricity_bills').insert(payload)
    if (!error) { fetchData(); setShowModal(false) } else alert(error.message)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record?')) {
      const { error } = await supabase.from('electricity_bills').delete().eq('id', id)
      if (!error) fetchData()
      else alert(error.message)
    }
  }

  if (loading && records.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <Loader2 className="animate-spin" size={48} color="#d97706" />
      <p style={{ color: '#64748b' }}>Retrieving utility data...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Electricity Bill" value={formatCurrency(totalBill)} Icon={Zap} color="#059669" bg="#ecfdf5" />
        <StatCard label="Total Records" value={records.length} Icon={Zap} color="#d97706" bg="#fffbeb" />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Electricity Bills</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                const data = records.map(r => ({ Month: `${r.year}-${r.month}`, Amount: r.total_amount, Status: r.status }))
                exportToExcel(data, `Electricity_Backup_${new Date().toISOString().split('T')[0]}`, 'Bills')
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
            type="text" placeholder="Search by month (YYYY-MM)..." value={search} onChange={e => setSearch(e.target.value)} 
            style={searchInputStyle} 
          />
        </div>

        <DataTable 
          columns={[
            { header: 'Month', accessor: (r: ElectricityBill) => `${r.year}-${r.month.toString().padStart(2, '0')}`, sortable: true },
            { header: 'Total Amount', accessor: (r: ElectricityBill) => <span style={{ fontWeight: 700 }}>{formatCurrency(r.total_amount)}</span>, align: 'right' },
            { header: 'Status', accessor: 'status', align: 'center' },
            { header: '', accessor: (r: ElectricityBill) => (
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
        <Modal title={form.id ? 'Edit Electricity Bill' : 'Add Electricity Bill'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Month</label>
            <input type="month" value={form.month_input} onChange={e => setForm({...form, month_input: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Total Amount (Rs.)</label>
            <input type="number" value={form.total_amount} onChange={e => setForm({...form, total_amount: Number(e.target.value)})} style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} style={inputStyle}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  )
}
