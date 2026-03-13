'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Management',
  '/mess': 'Mess (Food) Records',
  '/salary': 'Salary & Payroll',
  '/thread-expense': 'Thread Expense',
  '/clipping-expense': 'Clipping Expense',
  '/rent': 'Rent Management',
  '/electricity': 'Electricity Bills',
  '/other-expenses': 'Other Expenses',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const title = pageTitles[pathname] || 'Industry Management'
  const marginLeft = collapsed ? '80px' : '270px'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div style={{ marginLeft, transition: 'margin-left 0.3s ease' }}>
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          title={title}
        />
        <main style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
