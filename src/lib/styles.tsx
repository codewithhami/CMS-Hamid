import React from 'react'

export const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '20px',
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '12px',
  border: '1.5px solid #e2e8f0', background: 'white', fontSize: '0.875rem',
  color: '#1e293b', outline: 'none',
}

export const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#334155', marginBottom: '6px',
}

export const thStyle: React.CSSProperties = {
  textAlign: 'left' as const, fontSize: '0.6875rem', fontWeight: 600, color: '#64748b',
  textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
}

export const tdStyle: React.CSSProperties = {
  padding: '14px 16px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f1f5f9',
}

export const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(4px)', zIndex: 50,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
}

export const modalCard: React.CSSProperties = {
  background: 'white', borderRadius: '20px',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  width: '100%', maxWidth: '40rem', maxHeight: '90vh', overflowY: 'auto' as const,
}

export const modalHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '24px', borderBottom: '1px solid #f1f5f9',
}

export const modalBody: React.CSSProperties = {
  padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px',
}

export const modalFooter: React.CSSProperties = {
  display: 'flex', justifyContent: 'flex-end', gap: '12px',
  padding: '24px', borderTop: '1px solid #f1f5f9',
}

export const cancelBtn: React.CSSProperties = {
  padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0',
  background: 'white', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', color: '#334155',
}

export const closeBtn: React.CSSProperties = {
  padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent',
  cursor: 'pointer', color: '#94a3b8',
}

export const iconBtn = (hoverBg: string, hoverColor: string): Record<string, React.CSSProperties> => ({
  base: { padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' },
  hover: { background: hoverBg, color: hoverColor },
})

export function statusBadge(status: string, colorMap?: Record<string, { bg: string; color: string; dot: string }>) {
  const defaultMap: Record<string, { bg: string; color: string; dot: string }> = {
    active: { bg: '#ecfdf5', color: '#059669', dot: '#10b981' },
    paid: { bg: '#ecfdf5', color: '#059669', dot: '#10b981' },
    pending: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
    inactive: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
    terminated: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
    overdue: { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  }
  const map = colorMap || defaultMap
  const s = map[status.toLowerCase()] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px',
      borderRadius: '20px', background: s.bg, color: s.color,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export const btnPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '10px 20px', borderRadius: '12px',
  background: 'linear-gradient(135deg, #1773cf 0%, #2563eb 100%)',
  color: 'white', fontWeight: 600, fontSize: '0.875rem', border: 'none',
  cursor: 'pointer', transition: 'all 0.2s',
  boxShadow: '0 4px 12px rgba(23,115,207,0.2)',
}

export const searchInputStyle: React.CSSProperties = {
  ...inputStyle, paddingLeft: '36px',
}

export const actionBtnStyle = (type: 'edit' | 'delete'): React.CSSProperties => ({
  padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer',
  color: type === 'edit' ? '#2563eb' : '#dc2626',
  transition: 'all 0.2s',
})

export function StatCard({ label, value, Icon, color, bg, small }: {
  label: string; value: string | number; Icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  color: string; bg: string; small?: boolean
}) {
  return (
    <div style={{ ...cardStyle, padding: small ? '16px' : '20px' }} className="dash-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: small ? '10px' : '14px' }}>
        <div style={{ 
          width: small ? '40px' : '48px', 
          height: small ? '40px' : '48px', 
          borderRadius: small ? '12px' : '14px', 
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Icon size={small ? 18 : 22} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p 
            style={{ 
              fontSize: small ? '1.125rem' : '1.375rem', 
              fontWeight: 700, 
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}
            title={String(value)}
          >
            {value}
          </p>
          <p 
            style={{ 
              fontSize: '0.8125rem', 
              color: '#64748b',
              marginTop: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={label}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}
