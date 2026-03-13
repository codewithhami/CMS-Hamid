'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { forgotPassword } from '../actions'
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await forgotPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      {/* Logo & Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Image src="/logo.png" alt="Industry Management System" width={64} height={64} style={{ borderRadius: '16px' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          Reset Password
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Enter your email to receive a reset link
        </p>
      </div>

      {success ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
          }}>
            <CheckCircle style={{ width: '28px', height: '28px', color: '#10b981' }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
            Check Your Email
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
            We&apos;ve sent a password reset link to your email address.
          </p>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            color: '#1773cf', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none'
          }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem',
              borderRadius: '12px', fontSize: '0.875rem', border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
              <input type="email" name="email" required placeholder="you@company.com" className="auth-input" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? (
              <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                Send Reset Link
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </>
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              color: '#1773cf', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none'
            }}>
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
