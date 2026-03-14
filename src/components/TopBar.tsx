'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, Search, Bell, User, Users, Store, FileText, LayoutDashboard, Settings, AlertCircle, Wallet, Zap, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TopBarProps {
  onMenuClick: () => void
  title: string
}

type SearchResult = {
  id: string
  label: string
  type: 'employee' | 'vendor' | 'page'
  url: string
}

type Notification = {
  id: string
  title: string
  message: string
  type: 'salary' | 'bill' | 'vendor'
  url: string
  icon: any
}

const PAGES = [
  { label: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', url: '/employees', icon: Users },
  { label: 'Vendors', url: '/vendors', icon: Store },
  { label: 'Salary Records', url: '/salary', icon: FileText },
  { label: 'Mess Management', url: '/mess', icon: FileText },
  { label: 'Reports', url: '/reports', icon: FileText },
  { label: 'Settings', url: '/settings', icon: Settings },
]

export default function TopBar({ onMenuClick, title }: TopBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search Logic
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setSearchLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      const [empRes, venRes] = await Promise.all([
        supabase.from('employees').select('id, name').ilike('name', `%${query}%`).limit(5),
        supabase.from('vendors').select('id, name').ilike('name', `%${query}%`).limit(5),
      ])

      const filteredPages = PAGES.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
        .map(p => ({ id: p.url, label: p.label, type: 'page' as const, url: p.url }))

      const empResults = (empRes.data || []).map(e => ({ id: e.id, label: e.name, type: 'employee' as const, url: `/employees?search=${encodeURIComponent(e.name)}` }))
      const venResults = (venRes.data || []).map(v => ({ id: v.id, label: v.name, type: 'vendor' as const, url: `/vendors?search=${encodeURIComponent(v.name)}` }))

      setResults([...filteredPages, ...empResults, ...venResults])
      setSearchLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Notifications Logic
  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    // Basic caching to prevent refresh loops in dev
    const lastFetch = sessionStorage.getItem('notif_timestamp')
    const now = Date.now()
    if (lastFetch && now - Number(lastFetch) < 30000) { // 30s cache
      const cached = sessionStorage.getItem('notifs')
      if (cached) {
        setNotifications(JSON.parse(cached))
        return
      }
    }

    setNotifLoading(true)
    console.log('Fetching notifications...')
    try {
      const [salaries, rent, electricity, vendors] = await Promise.all([
        supabase.from('salary_records').select('id, month, year, employee:employees(name)').eq('status', 'pending').limit(5),
        supabase.from('rent_records').select('id, month, year, property_name').eq('status', 'pending').limit(3),
        supabase.from('electricity_bills').select('id, month, year').eq('status', 'pending').limit(3),
        supabase.from('vendors').select('id, name, vendor_orders(vendor_order_parts(total_bill)), vendor_payments(advance_payment)').limit(20)
      ])

      console.log('Notification data received:', { salaries: salaries.data?.length, vendors: vendors.data?.length })

      const notifs: Notification[] = []

      // Salary alerts
      salaries.data?.forEach(s => {
        notifs.push({
          id: `sal-${s.id}`,
          title: 'Pending Salary',
          message: `${(s.employee as any)?.name || 'Employee'}'s salary for ${s.month}/${s.year} is pending`,
          type: 'salary',
          url: '/salary',
          icon: Wallet
        })
      })

      // Rent alerts
      rent.data?.forEach(r => {
        notifs.push({
          id: `rent-${r.id}`,
          title: 'Pending Rent',
          message: `Rent for ${r.property_name} (${r.month}/${r.year}) is unpaid`,
          type: 'bill',
          url: '/rent',
          icon: Building2
        })
      })

      // Electricity alerts
      electricity.data?.forEach(e => {
        notifs.push({
          id: `elec-${e.id}`,
          title: 'Electricity Bill',
          message: `Electricity bill for ${e.month}/${e.year} is unpaid`,
          type: 'bill',
          url: '/electricity',
          icon: Zap
        })
      })

      // High vendor balance alerts
      vendors.data?.forEach(v => {
        const orders = v.vendor_orders || []
        const payments = v.vendor_payments || []
        const totalBill = orders.reduce((s: number, o: any) => s + (o.vendor_order_parts || []).reduce((ps: number, p: any) => ps + Number(p.total_bill || 0), 0), 0)
        const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.advance_payment || 0), 0)
        const balance = totalBill - totalPaid

        if (balance > 50000) {
          notifs.push({
            id: `ven-${v.id}`,
            title: 'High Vendor Balance',
            message: `${v.name} has a pending balance of Rs. ${balance.toLocaleString()}`,
            type: 'vendor',
            url: '/vendors',
            icon: Store
          })
        }
      })

      const finalNotifs = notifs.slice(0, 10)
      setNotifications(finalNotifs)
      sessionStorage.setItem('notifs', JSON.stringify(finalNotifs))
      sessionStorage.setItem('notif_timestamp', now.toString())
    } catch (err) {
      console.error('Error in fetchNotifications:', err)
    } finally {
      setNotifLoading(false)
    }
  }

  const handleSelect = (url: string) => {
    router.push(url)
    setIsSearchOpen(false)
    setQuery('')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'employee': return <Users style={{ width: '14px', height: '14px', color: '#2563eb' }} />
      case 'vendor': return <Store style={{ width: '14px', height: '14px', color: '#7c3aed' }} />
      default: return <FileText style={{ width: '14px', height: '14px', color: '#64748b' }} />
    }
  }

  return (
    <header style={{
      height: '72px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuClick}
          style={{
            display: 'none',
            alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b',
          }}
          className="lg-hide"
        >
          <Menu style={{ width: '20px', height: '20px' }} />
        </button>
        <h1 className="truncate" style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', maxWidth: '160px' }}>{title}</h1>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search */}
        <div className="hidden sm:block" style={{ position: 'relative' }} ref={searchRef}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setIsSearchOpen(true)
            }}
            onFocus={() => setIsSearchOpen(true)}
            style={{
              padding: '8px 16px 8px 36px',
              borderRadius: '10px', border: '1.5px solid #e2e8f0',
              background: '#f8fafc', fontSize: '0.8125rem',
              outline: 'none', width: '200px', color: '#334155',
              transition: 'all 0.2s',
            }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = '#1773cf'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(23,115,207,0.1)' }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none' }}
          />

          {isSearchOpen && (query.trim().length >= 2 || results.length > 0) && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              width: '300px', background: 'white', borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9', overflow: 'hidden', zIndex: 110,
            }}>
              {searchLoading && <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>Searching...</div>}
              {!searchLoading && results.length === 0 && <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>No results found</div>}
              {results.length > 0 && (
                <div style={{ padding: '4px' }}>
                  {results.map((res, i) => (
                    <div
                      key={res.id + i}
                      onClick={() => handleSelect(res.url)}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getIcon(res.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{res.label}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'capitalize' }}>{res.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '10px',
              background: isNotifOpen ? '#f1f5f9' : 'transparent', border: 'none', cursor: 'pointer', color: '#64748b',
              position: 'relative', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if(!isNotifOpen) e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={e => { if(!isNotifOpen) e.currentTarget.style.background = 'transparent' }}
          >
            <Bell style={{ width: '18px', height: '18px', color: notifications.length > 0 ? '#1e293b' : '#64748b' }} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#ef4444', border: '2px solid white',
              }} />
            )}
          </button>

          {isNotifOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              width: '320px', background: 'white', borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid #f1f5f9', overflow: 'hidden', zIndex: 110,
            }}>
              <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>Notifications</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>{notifications.length} New</span>
              </div>
              
              <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
                {notifLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>Loading alerts...</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Bell style={{ width: '20px', height: '20px', color: '#cbd5e1' }} />
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>All caught up!</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>No pending alerts found.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const NotifIcon = n.icon
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          router.push(n.url)
                          setIsNotifOpen(false)
                        }}
                        style={{
                          padding: '12px', borderRadius: '12px', cursor: 'pointer',
                          display: 'flex', gap: '12px', transition: 'background 0.2s',
                          marginBottom: '4px'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '10px', 
                          background: n.type === 'salary' ? '#ecfdf5' : n.type === 'bill' ? '#fffbeb' : '#f5f3ff', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                          <NotifIcon style={{ 
                            width: '18px', height: '18px', 
                            color: n.type === 'salary' ? '#059669' : n.type === 'bill' ? '#d97706' : '#7c3aed' 
                          }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #1773cf, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 600, fontSize: '0.8125rem',
          cursor: 'pointer',
        }}>
          A
        </div>
      </div>
    </header>
  )
}
