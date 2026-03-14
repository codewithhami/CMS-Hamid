'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Users, Utensils, Wallet, Scissors, Layers,
  Building2, Zap, Receipt, BarChart3, Settings,
  TrendingUp, TrendingDown, ArrowRight, Truck, Loader2, FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatCard, cardStyle } from '@/lib/styles'
import { formatCurrency, calculateVendorTotalBilling, calculateVendorTotalPaid, calculateVendorBalance } from '@/lib/utils'
import { Vendor } from '@/lib/types'
import { useFactory } from '@/context/FactoryContext'

const modules = [
  { label: 'Employees', desc: 'Workforce management', href: '/employees', icon: Users, color: '#2563eb', bg: '#eff6ff' },
  { label: 'Mess (Food)', desc: 'Catering and meal tracking', href: '/mess', icon: Utensils, color: '#ea580c', bg: '#fff7ed' },
  { label: 'Salary', desc: 'Payroll and disbursements', href: '/salary', icon: Wallet, color: '#059669', bg: '#ecfdf5' },
  { label: 'Thread Expense', desc: 'Raw material costs', href: '/thread-expense', icon: Layers, color: '#7c3aed', bg: '#f5f3ff' },
  { label: 'Clipping Expense', desc: 'Trimming costs', href: '/clipping-expense', icon: Scissors, color: '#dc2626', bg: '#fef2f2' },
  { label: 'Rent', desc: 'Facility lease management', href: '/rent', icon: Building2, color: '#475569', bg: '#f8fafc' },
  { label: 'Electricity Bill', desc: 'Utility tracking', href: '/electricity', icon: Zap, color: '#d97706', bg: '#fffbeb' },
  { label: 'Vendors', desc: 'Vendor orders and payments', href: '/vendors', icon: Truck, color: '#db2777', bg: '#fdf2f8' },
  { label: 'Other Expenses', desc: 'Miscellaneous costs', href: '/other-expenses', icon: Receipt, color: '#0891b2', bg: '#ecfeff' },
  { label: 'Reports', desc: 'Business intelligence', href: '/reports', icon: BarChart3, color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Settings', desc: 'System configuration', href: '/settings', icon: Settings, color: '#64748b', bg: '#f1f5f9' },
]

const expenseConfig = [
  { label: 'Total Salary of Employees', amount: 0, color: '#059669', icon: Wallet, table: 'salary_records', key: 'base_salary' },
  { label: 'Rent', amount: 0, color: '#475569', icon: Building2, table: 'rent_records', key: 'amount' },
  { label: 'Electricity', amount: 0, color: '#d97706', icon: Zap, table: 'electricity_bills', key: 'total_amount' },
  { label: 'Thread Expense', amount: 0, color: '#7c3aed', icon: Layers, table: 'thread_expenses', key: 'total_amount' },
  { label: 'Clipping Expense', amount: 0, color: '#dc2626', icon: Scissors, table: 'clipping_expenses', key: 'total_amount' },
  { label: 'Mess Bill', amount: 0, color: '#ea580c', icon: Utensils, table: 'mess_bills', key: 'total_amount' },
  { label: 'Other Expenses', amount: 0, color: '#0891b2', icon: Receipt, table: 'other_expenses', key: 'amount' },
]

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState(expenseConfig)
  const [vendorStats, setVendorStats] = useState({
    total: 0,
    totalBill: 0,
    totalPaid: 0,
    balance: 0
  })

  const supabase = createClient()
  const { activeFactory } = useFactory()

  useEffect(() => {
    if (activeFactory) {
      fetchData()
    }
  }, [activeFactory?.id])

  async function fetchData() {
    if (!activeFactory) return
    setLoading(true)

    try {
      const results = await Promise.all([
        supabase.from('salary_records').select('base_salary').eq('factory_id', activeFactory.id),
        supabase.from('rent_records').select('amount').eq('factory_id', activeFactory.id),
        supabase.from('electricity_bills').select('total_amount').eq('factory_id', activeFactory.id),
        supabase.from('thread_expenses').select('total_amount').eq('factory_id', activeFactory.id),
        supabase.from('clipping_expenses').select('total_amount').eq('factory_id', activeFactory.id),
        supabase.from('mess_bills').select('total_amount').eq('factory_id', activeFactory.id),
        supabase.from('other_expenses').select('amount').eq('factory_id', activeFactory.id),
        supabase.from('vendors').select(`
          id,
          vendor_orders (
            id,
            vendor_order_parts (total_bill, stitches, rate, head, repeat_count, is_suit, suit_quantity)
          ),
          vendor_payments (advance_payment)
        `).eq('factory_id', activeFactory.id)
      ])

      const newExpenses = [...expenseConfig].map((exp, i) => {
        const data = results[i].data as any[] | null
        const sum = data ? data.reduce((acc, curr) => acc + (Number(curr[exp.key]) || 0), 0) : 0
        return { ...exp, amount: sum }
      })

      setExpenses(newExpenses)

      const vendors = (results[7].data || []) as unknown as Vendor[]
      let totalBill = 0
      let totalPaid = 0

      vendors.forEach(v => {
        const vBill = calculateVendorTotalBilling(v)
        const vPaid = calculateVendorTotalPaid(v)
        totalBill += vBill
        totalPaid += vPaid
      })
      console.log('Dashboard data:', { expenses: newExpenses, vendors: vendors.length, stats: { totalBill, totalPaid } })
      
      setExpenses(newExpenses)
      setVendorStats({
        total: vendors.length,
        totalBill,
        totalPaid,
        balance: totalBill - totalPaid
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const netProfit = vendorStats.totalBill - totalExpense
  const isProfit = netProfit >= 0

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1773cf 0%, #2563eb 50%, #4f46e5 100%)',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        color: 'white',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-20px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', right: '100px',
          width: '150px', height: '150px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <Image src="/logo.png" alt="Logo" width={48} height={48} style={{ borderRadius: '12px', border: '2px solid rgba(255,255,255,0.2)' }} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Industry Management</h1>
            <p style={{ fontSize: '0.875rem', opacity: 0.85 }}>Manage your entire operation from one place</p>
          </div>
        </div>
      </div>

      {/* ===== OVERALL FINANCIAL SUMMARY ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Overall Financial Summary</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#64748b', gap: '16px' }}>
          <Loader2 className="animate-spin" size={32} color="#1773cf" />
          <p>Analyzing financial data...</p>
        </div>
      ) : (
        <>
          {/* Top summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total Vendors" value={vendorStats.total} Icon={Truck} color="#2563eb" bg="#eff6ff" />
            <StatCard label="Total Vendor Bills" value={formatCurrency(vendorStats.totalBill)} Icon={FileText} color="#7c3aed" bg="#f5f3ff" />
            <StatCard label="Remaining Balance" value={formatCurrency(vendorStats.balance)} Icon={TrendingDown} color="#dc2626" bg="#fef2f2" />
            <StatCard label="Overall Net Profit" value={formatCurrency(netProfit)} Icon={TrendingUp} color={isProfit ? '#16a34a' : '#dc2626'} bg={isProfit ? '#dcfce7' : '#fee2e2'} />
          </div>

          {/* Expense Breakdown Table */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Overall Expense Breakdown</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' }}>Category</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(row => {
                    const Icon = row.icon
                    return (
                      <tr key={row.label} style={{ transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: row.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon style={{ width: '16px', height: '16px', color: row.color }} />
                          </div>
                          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>{row.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#dc2626', fontSize: '0.9375rem' }}>{formatCurrency(row.amount)}</td>
                      </tr>
                    )
                  })}
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a', fontSize: '0.9375rem' }}>Total Expense</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '1.125rem' }}>{formatCurrency(totalExpense)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#334155', fontSize: '0.9375rem' }}>Total Vendor Bills (Revenue)</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '1.125rem' }}>{formatCurrency(vendorStats.totalBill)}</td>
                  </tr>
                  <tr style={{ background: isProfit ? '#f0fdf4' : '#fef2f2', borderTop: '2px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>{isProfit ? 'Net Profit' : 'Net Loss'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, color: isProfit ? '#16a34a' : '#dc2626', fontSize: '1.25rem' }}>{formatCurrency(Math.abs(netProfit))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modules Header */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', marginTop: '1.5rem' }}>
        Modules
      </h2>

      {/* Module Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
      }}>
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
              <div className="dash-card" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: mod.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon style={{ width: '20px', height: '20px', color: mod.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>{mod.label}</p>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '2px' }}>{mod.desc}</p>
                  </div>
                </div>
                <ArrowRight style={{ width: '16px', height: '16px', color: '#94a3b8', flexShrink: 0 }} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Copyright */}
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '2rem', paddingBottom: '1rem' }}>
        © 2025 Industry Management System. All rights reserved.
      </p>
    </div>
  )
}
