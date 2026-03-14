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

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={`main-content-margin ${collapsed ? 'collapsed' : ''}`}>
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          title={title}
        />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
