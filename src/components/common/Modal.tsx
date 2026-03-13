'use client'

import React from 'react'
import { X } from 'lucide-react'
import { modalOverlay, modalCard, modalHeader, modalBody, modalFooter, cancelBtn, closeBtn } from '@/lib/styles'

interface ModalProps {
  show?: boolean // Make optional for better compatibility if needed, but usually true if rendered
  onClose: () => void
  onSave?: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
  saveLabel?: string
  loading?: boolean
}

export default function Modal({ 
  show = true, 
  onClose, 
  onSave, 
  title, 
  children, 
  footer, 
  maxWidth,
  saveLabel = 'Save Changes',
  loading = false
}: ModalProps) {
  if (!show) return null

  return (
    <div style={modalOverlay} onClick={onClose} className="animate-fade-in">
      <div 
        style={{ ...modalCard, maxWidth: maxWidth || modalCard.maxWidth }} 
        onClick={e => e.stopPropagation()}
        className="animate-scale-in"
      >
        <div style={modalHeader}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={closeBtn}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        
        <div style={modalBody}>
          {children}
        </div>

        <div style={modalFooter}>
          {footer ? footer : (
            <>
              <button onClick={onClose} style={cancelBtn}>Cancel</button>
              {onSave && (
                <button 
                  onClick={onSave} 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : saveLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
