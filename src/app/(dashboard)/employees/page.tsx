'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Users, FileSpreadsheet } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, statusBadge, btnPrimaryStyle, actionBtnStyle, StatCard, searchInputStyle, cancelBtn } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { Employee } from '@/lib/types'
import { useSearchParams } from 'next/navigation'
import { exportToExcel } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import DataTable from '@/components/common/DataTable'

import { Suspense } from 'react'

const emptyEmployee: Omit<Employee, 'id' | 'created_at' | 'updated_at'> = {
  name: '', father_name: '', cnic: '', phone: '', designation: '',
  department: '', salary: 0, joining_date: new Date().toISOString().split('T')[0], status: 'active',
  address: ''
}

function EmployeesContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Employee, 'id' | 'created_at' | 'updated_at'>>(emptyEmployee)
  
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10
  const supabase = createClient()

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    const s = searchParams.get('search')
    if (s) setSearch(s)
  }, [searchParams])

  async function fetchEmployees() {
    setLoading(true)
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, father_name, cnic, phone, designation, department, salary, joining_date, status, address, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (!error && data) setEmployees(data)
    setLoading(false)
  }

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)
  const activeCount = employees.filter(e => e.status === 'active').length
  const inactiveCount = employees.filter(e => e.status !== 'active').length

  function openModal(employee?: Employee) {
    if (employee) {
      setEditingId(employee.id)
      const { id, created_at, updated_at, ...rest } = employee
      setForm({ ...rest, address: rest.address || '' })
    } else {
      setEditingId(null)
      setForm(emptyEmployee)
    }
    setShowModal(true)
  }

  async function handleSave() {
    if (editingId) {
      const { error } = await supabase.from('employees').update(form).eq('id', editingId)
      if (!error) {
        setEmployees(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
        setShowModal(false)
      } else {
        alert('Error updating employee: ' + error.message)
      }
    } else {
      const { data, error } = await supabase.from('employees').insert(form).select().single()
      if (!error && data) {
        setEmployees(prev => [data, ...prev])
        setShowModal(false)
      } else if (error) {
        alert('Error adding employee: ' + error.message)
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this employee?')) {
      const { error } = await supabase.from('employees').delete().eq('id', id)
      if (!error) {
        setEmployees(prev => prev.filter(e => e.id !== id))
      } else {
        alert('Error deleting employee: ' + error.message)
      }
    }
  }

  const columns = [
    {
      header: 'Name',
      accessor: (emp: Employee) => (
        <div>
          <p style={{ fontWeight: 600, color: '#0f172a' }}>{emp.name}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>s/o {emp.father_name}</p>
        </div>
      )
    },
    { header: 'CNIC', accessor: 'cnic' as keyof Employee },
    { header: 'Phone', accessor: 'phone' as keyof Employee },
    {
      header: 'Designation',
      accessor: (emp: Employee) => (
        <div>
          <p style={{ color: '#0f172a' }}>{emp.designation}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{emp.department}</p>
        </div>
      )
    },
    { 
      header: 'Salary', 
      accessor: (emp: Employee) => <span style={{ fontWeight: 600 }}>{formatCurrency(emp.salary || 0)}</span> 
    },
    { 
      header: 'Status', 
      accessor: (emp: Employee) => statusBadge(emp.status) 
    },
    {
      header: 'Actions',
      align: 'right' as const,
      accessor: (emp: Employee) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
          <button 
            onClick={() => openModal(emp)} 
            style={actionBtnStyle('edit')}
            onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Edit style={{ width: '16px', height: '16px' }} />
          </button>
          <button 
            onClick={() => handleDelete(emp.id)} 
            style={actionBtnStyle('delete')}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Trash2 style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Employees" value={loading ? '-' : employees.length} Icon={Users} color="#2563eb" bg="#eff6ff" />
        <StatCard label="Active" value={loading ? '-' : activeCount} Icon={UserCheck} color="#059669" bg="#ecfdf5" />
        <StatCard label="Inactive / Terminated" value={loading ? '-' : inactiveCount} Icon={UserX} color="#dc2626" bg="#fef2f2" />
      </div>

      {/* Table Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Employee Directory</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => exportToExcel(employees, 'Employees_Data', 'Employees')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '12px',
                background: '#f8fafc', border: '1.5px solid #e2e8f0',
                color: '#475569', fontWeight: 600, fontSize: '0.875rem',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
            >
              <FileSpreadsheet style={{ width: '18px', height: '18px', color: '#059669' }} />
              Export Excel
            </button>
            <button onClick={() => openModal()} style={btnPrimaryStyle}>
              <Plus style={{ width: '16px', height: '16px' }} /> Add Employee
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search by name, designation, or department..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={searchInputStyle} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <DataTable 
          data={paginated} 
          columns={columns} 
          loading={loading}
          emptyMessage="No employees found."
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
            perPage,
            totalItems: filtered.length
          }}
        />
      </div>

      {/* Modal */}
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        title={editingId ? 'Edit Employee' : 'Add New Employee'}
        footer={
          <>
            <button onClick={() => setShowModal(false)} style={{ ...cancelBtn, marginRight: '12px' }}>Cancel</button>
            <button onClick={handleSave} style={btnPrimaryStyle}>{editingId ? 'Update Employee' : 'Add Employee'}</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[
            { label: 'Full Name *', field: 'name', placeholder: 'Employee name' },
            { label: "Father's Name", field: 'father_name', placeholder: "Father's name" },
            { label: 'CNIC', field: 'cnic', placeholder: '35201-XXXXXXX-X' },
            { label: 'Phone', field: 'phone', placeholder: '03XX-XXXXXXX' },
            { label: 'Designation', field: 'designation', placeholder: 'Job title' },
            { label: 'Department', field: 'department', placeholder: 'Department' },
            { label: 'Address', field: 'address', placeholder: 'Residential address' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label style={labelStyle}>{label}</label>
              <input type="text" value={(form as any)[field]}
  onChange={e => setForm({ ...form, [field]: e.target.value })}
  style={inputStyle} placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Salary (Rs.)</label>
            <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })}
              style={inputStyle} placeholder="Monthly salary" />
          </div>
          <div>
            <label style={labelStyle}>Joining Date</label>
            <input type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })}
              style={inputStyle} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Employee['status'] })}
              style={inputStyle}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div>Loading employees...</div>}>
      <EmployeesContent />
    </Suspense>
  )
}
