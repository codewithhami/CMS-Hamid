'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { thStyle, tdStyle } from '@/lib/styles'

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    perPage: number
    totalItems: number
  }
  onRowClick?: (item: T) => void
}

export default function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  loading, 
  emptyMessage = 'No data found.',
  pagination,
  onRowClick
}: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ ...thStyle, textAlign: col.align || 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={item.id} 
                onClick={() => onRowClick?.(item)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: col.align || 'left' }}>
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingTop: '16px', 
          marginTop: '16px', 
          borderTop: '1px solid #f1f5f9' 
        }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} of {pagination.totalItems}
          </p>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)} 
              disabled={pagination.currentPage === 1}
              style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: pagination.currentPage === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </button>
            <button 
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)} 
              disabled={pagination.currentPage === pagination.totalPages}
              style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: pagination.currentPage === pagination.totalPages ? 0.4 : 1 }}
            >
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
