'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Utensils, Wallet, Scissors, Layers,
  Building2, Zap, Receipt, BarChart3, Settings, ChevronLeft,
  LogOut, X, Truck
} from 'lucide-react'
import { logout } from '@/app/(auth)/actions'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Vendors', href: '/vendors', icon: Truck },
  { label: 'Employees', href: '/employees', icon: Users },
  { label: 'Mess (Food)', href: '/mess', icon: Utensils },
  { label: 'Salary', href: '/salary', icon: Wallet },
  { label: 'Thread Expense', href: '/thread-expense', icon: Layers },
  { label: 'Clipping Expense', href: '/clipping-expense', icon: Scissors },
  { label: 'Rent', href: '/rent', icon: Building2 },
  { label: 'Electricity Bill', href: '/electricity', icon: Zap },
  { label: 'Other Expenses', href: '/other-expenses', icon: Receipt },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname()

  const sidebarWidth = collapsed ? '80px' : '270px'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)', zIndex: 40,
          }}
        />
      )}

      <aside 
        className={mobileOpen ? 'mobile-visible' : ''}
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh',
          width: sidebarWidth,
          background: 'white',
          borderRight: '1px solid #e5e7eb',
          zIndex: 50,
          display: 'flex', flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          height: '72px', padding: '0 16px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Image src="/logo.png" alt="Logo" width={40} height={40} style={{ borderRadius: '12px' }} />
              <div>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Industry Mgmt</h2>
                <p style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 500 }}>Admin Panel</p>
              </div>
            </div>
          )}
          {collapsed && (
            <Image src="/logo.png" alt="Logo" width={40} height={40} style={{ borderRadius: '12px' }} />
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#94a3b8', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px', transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#ef4444',
                marginLeft: '8px'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: '12px',
                  padding: collapsed ? '10px' : '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.875rem', fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#64748b',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f8fafc'
                    e.currentTarget.style.color = '#334155'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#64748b'
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: '3px', height: '20px', borderRadius: '0 4px 4px 0',
                    background: '#2563eb',
                  }} />
                )}
                <Icon style={{
                  width: '20px', height: '20px', flexShrink: 0,
                  color: isActive ? '#2563eb' : '#94a3b8',
                  transition: 'color 0.15s',
                }} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer - Sign Out */}
        <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
          <form action={logout}>
            <button
              type="submit"
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: collapsed ? '10px' : '10px 14px',
                borderRadius: '12px', fontSize: '0.875rem', fontWeight: 500,
                width: '100%', border: 'none', cursor: 'pointer',
                background: 'transparent', color: '#ef4444',
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <LogOut style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
