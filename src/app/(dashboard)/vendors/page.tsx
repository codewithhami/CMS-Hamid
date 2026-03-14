'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Truck, Plus, ArrowLeft, ChevronDown, ChevronRight, FileText, Loader2, Edit, FileSpreadsheet, Search } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, StatCard, searchInputStyle, btnPrimaryStyle, cancelBtn, actionBtnStyle } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { exportVendorInvoice, exportToExcel } from '@/lib/exportUtils'
import { useSearchParams } from 'next/navigation'
import { OrderPart, VendorOrder, VendorPayment, VendorTaan, Vendor } from '@/lib/types'
import { calculatePartBill, calculateVendorTotalBilling, calculateVendorTotalPaid, calculateVendorBalance, calculateVendorTaans, formatCurrency, formatDate } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import DataTable from '@/components/common/DataTable'

function VendorsContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const s = searchParams.get('search')
    if (s) setSearch(s)
  }, [searchParams])

  // Modals
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTaanModal, setShowTaanModal] = useState(false)

  // Forms
  const [vForm, setVForm] = useState({ id: '', name: '', phone: '' })
  const [oForm, setOForm] = useState<Omit<VendorOrder, 'vendor_order_parts'> & { id?: string, parts: Omit<OrderPart, 'id'>[] }>({
    id: '', vendor_id: '', date: new Date().toISOString().split('T')[0], design_name: '', invoice_label: '', parts: []
  })
  const [pForm, setPForm] = useState<{ id?: string, date: string, advance_payment: number, notes: string }>({ date: new Date().toISOString().split('T')[0], advance_payment: 0, notes: '' })
  const [tForm, setTForm] = useState<{ id?: string, date: string, count: number, notes: string }>({ date: new Date().toISOString().split('T')[0], count: 0, notes: '' })

  const [expandedOrders, setExpandedOrders] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        id, name, phone,
        vendor_orders (
          id, vendor_id, date, design_name, invoice_label,
          vendor_order_parts (
            id, order_id, part_name, stitches, rate, head, repeat_count, total_bill
          )
        ),
        vendor_payments (id, vendor_id, date, advance_payment, notes),
        vendor_taans (id, vendor_id, date, count, notes)
      `)
      .order('name')
    
    if (error) {
      console.error('Error fetching vendors:', error)
    } else {
      setVendors(data as unknown as Vendor[] || [])
    }
    setLoading(false)
  }

  const filtered = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.phone.includes(search)
  )

  const selected = vendors.find(v => v.id === selectedId) || null

  // CRUD actions
  async function saveVendor() {
    if (!vForm.name || !vForm.phone) return alert('Name and phone are required')
    
    const payload = { name: vForm.name, phone: vForm.phone }
    if (vForm.id) {
      const { error } = await supabase.from('vendors').update(payload).eq('id', vForm.id)
      if (!error) { fetchData(); setShowVendorModal(false) } else alert(error.message)
    } else {
      const { error } = await supabase.from('vendors').insert(payload)
      if (!error) { fetchData(); setShowVendorModal(false) } else alert(error.message)
    }
  }

  async function saveOrder() {
    if (!oForm.design_name || oForm.parts.length === 0) return alert('Design name and parts are required')
    if (!selectedId) return

    const orderPayload = {
      vendor_id: selectedId,
      date: oForm.date,
      design_name: oForm.design_name,
      invoice_label: oForm.invoice_label
    }

    if (oForm.id) {
      const { error: orderError } = await supabase.from('vendor_orders').update(orderPayload).eq('id', oForm.id)
      if (orderError) return alert(orderError.message)
      await supabase.from('vendor_order_parts').delete().eq('order_id', oForm.id)
      const partsToInsert = oForm.parts.map(p => ({
        order_id: oForm.id,
        part_name: p.part_name,
        stitches: p.stitches,
        rate: p.rate,
        head: p.head,
        repeat_count: p.repeat_count,
        total_bill: p.total_bill
      }))
      await supabase.from('vendor_order_parts').insert(partsToInsert)
    } else {
      const { data: orderData, error: orderError } = await supabase.from('vendor_orders').insert(orderPayload).select('id').single()
      if (orderError) return alert(orderError.message)
      const partsToInsert = oForm.parts.map(p => ({
        order_id: orderData.id,
        part_name: p.part_name,
        stitches: p.stitches,
        rate: p.rate,
        head: p.head,
        repeat_count: p.repeat_count,
        total_bill: p.total_bill
      }))
      await supabase.from('vendor_order_parts').insert(partsToInsert)
    }
    fetchData()
    setShowOrderModal(false)
  }

  async function savePayment() {
    if (!selectedId) return
    const payload = { vendor_id: selectedId, date: pForm.date, advance_payment: pForm.advance_payment, notes: pForm.notes }
    const { error } = pForm.id ? await supabase.from('vendor_payments').update(payload).eq('id', pForm.id) : await supabase.from('vendor_payments').insert(payload)
    if (!error) { fetchData(); setShowPaymentModal(false) } else alert(error.message)
  }

  async function saveTaan() {
    if (!selectedId) return
    const payload = { vendor_id: selectedId, date: tForm.date, count: tForm.count, notes: tForm.notes }
    const { error } = tForm.id ? await supabase.from('vendor_taans').update(payload).eq('id', tForm.id) : await supabase.from('vendor_taans').insert(payload)
    if (!error) { fetchData(); setShowTaanModal(false) } else alert(error.message)
  }

  function addPart() {
    setOForm(prev => ({ 
      ...prev, 
      parts: [...prev.parts, { part_name: '', stitches: 0, rate: 0.9, head: 24, repeat_count: 4, order_id: prev.id || '', total_bill: 0 }] 
    }))
  }

  function updatePart(index: number, field: keyof Omit<OrderPart, 'id'>, val: any) {
    setOForm(prev => {
      const newParts = [...prev.parts]
      newParts[index] = { ...newParts[index], [field]: val }
      if (['stitches', 'rate', 'head', 'repeat_count'].includes(field as string)) {
        newParts[index].total_bill = calculatePartBill(newParts[index] as OrderPart)
      }
      return { ...prev, parts: newParts }
    })
  }

  function openEditOrderModal(order: VendorOrder) {
    setOForm({
      id: order.id,
      vendor_id: order.vendor_id,
      date: order.date,
      design_name: order.design_name,
      invoice_label: order.invoice_label || '',
      parts: order.vendor_order_parts.map(p => ({ ...p }))
    })
    setShowOrderModal(true)
  }

  if (selectedId && selected) {
    const tBill = calculateVendorTotalBilling(selected)
    const tPaid = calculateVendorTotalPaid(selected)
    const bal = calculateVendorBalance(selected)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <button onClick={() => setSelectedId(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
          <ArrowLeft size={20} /> Back to Vendors
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a' }}>{selected.name}</h1>
            <p style={{ color: '#64748b' }}>{selected.phone}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => { setVForm({ id: selected.id, name: selected.name, phone: selected.phone }); setShowVendorModal(true) }} style={{ ...btnPrimaryStyle, background: '#f8fafc', color: '#444', border: '1px solid #e2e8f0' }}>Edit Vendor</button>
            <button onClick={() => { 
                setOForm({ id: '', vendor_id: selected.id, date: new Date().toISOString().split('T')[0], design_name: '', invoice_label: '', parts: [
                    { part_name: 'Front', stitches: 0, rate: 0.9, head: 24, repeat_count: 4, order_id: '', total_bill: 0 },
                    { part_name: 'Back', stitches: 0, rate: 0.9, head: 24, repeat_count: 4, order_id: '', total_bill: 0 },
                    { part_name: 'Duphata', stitches: 0, rate: 0.9, head: 24, repeat_count: 8, order_id: '', total_bill: 0 }
                ]}); 
                setShowOrderModal(true) 
            }} style={btnPrimaryStyle}>Add New Order</button>
            <button onClick={() => { setPForm({ date: new Date().toISOString().split('T')[0], advance_payment: 0, notes: '' }); setShowPaymentModal(true) }} style={{ ...btnPrimaryStyle, background: '#10b981', border: 'none' }}>Add Payment</button>
            <button onClick={() => { setTForm({ date: new Date().toISOString().split('T')[0], count: 0, notes: '' }); setShowTaanModal(true) }} style={{ ...btnPrimaryStyle, background: '#7c3aed', border: 'none' }}>Add Taan</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard label="Total Billing" value={formatCurrency(tBill)} color="#2563eb" bg="#eff6ff" Icon={FileText} />
          <StatCard label="Total Paid" value={formatCurrency(tPaid)} color="#059669" bg="#ecfdf5" Icon={Truck} />
          <StatCard label="Balance Owed" value={formatCurrency(bal)} color={bal > 0 ? "#ef4444" : "#059669"} bg={bal > 0 ? "#fef2f2" : "#f0fdf4"} Icon={FileText} />
          <StatCard label="Total Taans" value={calculateVendorTaans(selected).toString()} color="#7c3aed" bg="#f5f3ff" Icon={Truck} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Orders Section */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Order History</h2>
              <button 
                onClick={() => exportVendorInvoice(selected)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
              >
                <FileSpreadsheet size={16} color="#059669" /> Export
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selected.vendor_orders.length === 0 ? <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No orders found.</p> :
                selected.vendor_orders.map(order => {
                  const isExpanded = expandedOrders.includes(order.id)
                  const total = order.vendor_order_parts.reduce((s, p) => s + p.total_bill, 0)
                  return (
                    <div key={order.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => setExpandedOrders(prev => isExpanded ? prev.filter(id => id !== order.id) : [...prev, order.id])}
                        style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isExpanded ? <ChevronDown size={20} color="#64748b" /> : <ChevronRight size={20} color="#64748b" />}
                          <div>
                            <p style={{ fontWeight: 600 }}>{order.design_name} {order.invoice_label && <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>({order.invoice_label})</span>}</p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(order.date)}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Bill</p>
                            <p style={{ fontWeight: 700, color: '#2563eb' }}>{formatCurrency(total)}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); openEditOrderModal(order); }} style={actionBtnStyle('edit')}><Edit size={16} /></button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ overflowX: 'auto', borderTop: '1px solid #f1f5f9' }}>
                          <table style={{ width: '100%', fontSize: '0.875rem' }}>
                            <thead style={{ background: '#f8fafc' }}>
                              <tr><th style={{ padding: '12px', textAlign: 'left' }}>Part</th><th style={{ textAlign: 'right' }}>Stitches</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Head</th><th style={{ textAlign: 'right' }}>Repeat</th><th style={{ textAlign: 'right', paddingRight: '16px' }}>Amount</th></tr>
                            </thead>
                            <tbody>
                              {order.vendor_order_parts.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '12px' }}>{p.part_name}</td>
                                  <td style={{ textAlign: 'right' }}>{p.stitches.toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>{p.rate}</td>
                                  <td style={{ textAlign: 'right' }}>{p.head}</td>
                                  <td style={{ textAlign: 'right' }}>{p.repeat_count}</td>
                                  <td style={{ textAlign: 'right', paddingRight: '16px', fontWeight: 600 }}>{formatCurrency(p.total_bill)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })
              }
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Payment History</h2>
                <button onClick={() => exportToExcel(selected.vendor_payments, `${selected.name}_Payments`, 'Payments')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>
                  <FileSpreadsheet size={14} color="#059669" /> Export
                </button>
              </div>
              <DataTable 
                data={selected.vendor_payments}
                columns={[
                  { header: 'Date', accessor: (p: any) => formatDate(p.date) },
                  { header: 'Notes', accessor: 'notes' },
                  { header: 'Amount', accessor: (p: any) => formatCurrency(p.advance_payment || 0), align: 'right' },
                  { header: '', accessor: (p: any) => (
                    <button onClick={() => { setPForm(p); setShowPaymentModal(true) }} style={{ ...actionBtnStyle('edit'), padding: '4px' }}><Edit size={12} /></button>
                  ), align: 'right' }
                ]}
              />
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Taan Logistics</h2>
                <button onClick={() => exportToExcel(selected.vendor_taans, `${selected.name}_Taans`, 'Taans')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>
                  <FileSpreadsheet size={14} color="#059669" /> Export
                </button>
              </div>
              <DataTable 
                data={selected.vendor_taans}
                columns={[
                  { header: 'Date', accessor: (t: any) => formatDate(t.date) },
                  { header: 'Notes', accessor: 'notes' },
                  { header: 'Count', accessor: 'count', align: 'right' },
                  { header: '', accessor: (t: any) => (
                    <button onClick={() => { setTForm(t); setShowTaanModal(true) }} style={{ ...actionBtnStyle('edit'), padding: '4px' }}><Edit size={12} /></button>
                  ), align: 'right' }
                ]}
              />
            </div>
          </div>
        </div>

        {showVendorModal && (
          <Modal title={vForm.id ? 'Edit Vendor' : 'Add Vendor'} onClose={() => setShowVendorModal(false)} onSave={saveVendor}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div><label style={labelStyle}>Vendor Name *</label><input type="text" value={vForm.name} onChange={e => setVForm({...vForm, name: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Phone Number *</label><input type="text" value={vForm.phone} onChange={e => setVForm({...vForm, phone: e.target.value})} style={inputStyle} /></div>
             </div>
          </Modal>
        )}

        {showOrderModal && (
          <Modal title={oForm.id ? 'Edit Order' : 'New Order'} onClose={() => setShowOrderModal(false)} onSave={saveOrder} maxWidth="800px">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div><label style={labelStyle}>Date</label><input type="date" value={oForm.date} onChange={e => setOForm({...oForm, date: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Design Name *</label><input type="text" value={oForm.design_name} onChange={e => setOForm({...oForm, design_name: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Invoice Status (Opt)</label><input type="text" value={oForm.invoice_label} onChange={e => setOForm({...oForm, invoice_label: e.target.value})} style={inputStyle} /></div>
            </div>
            
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 600 }}>Order Parts</h3>
              <button onClick={addPart} style={{ ...btnPrimaryStyle, padding: '4px 12px', fontSize: '0.75rem' }}>Add Part</button>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: '500px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}><tr>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Part Name</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Stitches</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Head</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Rep</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                </tr></thead>
                <tbody>
                  {oForm.parts.map((p, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px' }}><input value={p.part_name} onChange={e => updatePart(i, 'part_name', e.target.value)} style={{...inputStyle, padding: '4px 8px'}} /></td>
                      <td style={{ padding: '4px' }}><input type="number" value={p.stitches} onChange={e => updatePart(i, 'stitches', Number(e.target.value))} style={{...inputStyle, padding: '4px 8px', textAlign: 'right'}} /></td>
                      <td style={{ padding: '4px' }}><input type="number" step="0.01" value={p.rate} onChange={e => updatePart(i, 'rate', Number(e.target.value))} style={{...inputStyle, padding: '4px 8px', textAlign: 'right'}} /></td>
                      <td style={{ padding: '4px' }}><input type="number" value={p.head} onChange={e => updatePart(i, 'head', Number(e.target.value))} style={{...inputStyle, padding: '4px 8px', textAlign: 'right'}} /></td>
                      <td style={{ padding: '4px' }}><input type="number" value={p.repeat_count} onChange={e => updatePart(i, 'repeat_count', Number(e.target.value))} style={{...inputStyle, padding: '4px 8px', textAlign: 'right'}} /></td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.total_bill)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal>
        )}

        {showPaymentModal && (
          <Modal title={pForm.id ? 'Edit Payment' : 'Add Payment'} onClose={() => setShowPaymentModal(false)} onSave={savePayment}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div><label style={labelStyle}>Date</label><input type="date" value={pForm.date} onChange={e => setPForm({...pForm, date: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Amount (Rs.) *</label><input type="number" value={pForm.advance_payment} onChange={e => setPForm({...pForm, advance_payment: Number(e.target.value)})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Notes</label><input type="text" value={pForm.notes} onChange={e => setPForm({...pForm, notes: e.target.value})} style={inputStyle} /></div>
            </div>
          </Modal>
        )}

        {showTaanModal && (
          <Modal title={tForm.id ? 'Edit Taan Record' : 'Record Taans'} onClose={() => setShowTaanModal(false)} onSave={saveTaan}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div><label style={labelStyle}>Date</label><input type="date" value={tForm.date} onChange={e => setTForm({...tForm, date: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Count *</label><input type="number" value={tForm.count} onChange={e => setTForm({...tForm, count: Number(e.target.value)})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Notes</label><input type="text" value={tForm.notes} onChange={e => setTForm({...tForm, notes: e.target.value})} style={inputStyle} /></div>
            </div>
          </Modal>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Vendors" value={vendors.length} Icon={Truck} color="#2563eb" bg="#eff6ff" />
        <StatCard label="Total Billing" value={formatCurrency(vendors.reduce((s, v) => s + calculateVendorTotalBilling(v), 0))} Icon={FileText} color="#7c3aed" bg="#f5f3ff" />
        <StatCard label="Total Payables" value={formatCurrency(vendors.reduce((s, v) => s + calculateVendorBalance(v), 0))} Icon={FileText} color="#dc2626" bg="#fef2f2" />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Vendors List</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                const data = vendors.map(v => ({
                  Name: v.name, Phone: v.phone, Taans: calculateVendorTaans(v),
                  'Total Bill': calculateVendorTotalBilling(v), Paid: calculateVendorTotalPaid(v), Balance: calculateVendorBalance(v)
                }))
                exportToExcel(data, 'Vendors_Backup', 'Vendors')
              }}
              style={{ ...btnPrimaryStyle, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}
            >
              <FileSpreadsheet size={18} color="#059669" /> Export
            </button>
            <button onClick={() => { setVForm({ id: '', name: '', phone: '' }); setShowVendorModal(true) }} style={btnPrimaryStyle}><Plus size={16} /> Add Vendor</button>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
          <input 
            type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} 
            style={searchInputStyle} 
          />
        </div>

        <DataTable 
          columns={[
            { header: 'Vendor Name', accessor: 'name', sortable: true },
            { header: 'Phone', accessor: 'phone' },
            { header: 'Total Taans', accessor: (v: Vendor) => calculateVendorTaans(v).toLocaleString(), align: 'right' },
            { header: 'Total Bill', accessor: (v: Vendor) => formatCurrency(calculateVendorTotalBilling(v)), align: 'right' },
            { header: 'Advance / Paid', accessor: (v: Vendor) => formatCurrency(calculateVendorTotalPaid(v)), align: 'right' },
            { header: 'Remaining Balance', accessor: (v: Vendor) => {
              const bal = calculateVendorBalance(v);
              return <span style={{ fontWeight: 700, color: bal > 0 ? '#dc2626' : '#0f172a' }}>{formatCurrency(bal)}</span>
            }, align: 'right' },
            { header: '', accessor: (v: Vendor) => (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedId(v.id); }} 
                className="btn-primary" 
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
              >View Details</button>
            ), align: 'right' }
          ]}
          data={filtered}
          onRowClick={(row) => setSelectedId(row.id)}
        />
      </div>

      {showVendorModal && (
        <Modal title={vForm.id ? 'Edit Vendor' : 'Add Vendor'} onClose={() => setShowVendorModal(false)} onSave={saveVendor}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div><label style={labelStyle}>Vendor Name *</label><input type="text" value={vForm.name} onChange={e => setVForm({...vForm, name: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Phone Number *</label><input type="text" value={vForm.phone} onChange={e => setVForm({...vForm, phone: e.target.value})} style={inputStyle} /></div>
             </div>
        </Modal>
      )}
    </div>
  )
}

export default function VendorsPage() {
  return (
    <Suspense fallback={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Loader2 className="animate-spin" size={48} color="#2563eb" />
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading vendor data...</p>
        </div>
    }>
      <VendorsContent />
    </Suspense>
  )
}
