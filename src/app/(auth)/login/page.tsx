'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { login } from '../actions'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      {/* Logo & Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Image
            src="/logo.png"
            alt="Industry Management System"
            width={64}
            height={64}
            style={{ borderRadius: '16px' }}
          />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Sign in to Industry Management System
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem',
            borderRadius: '12px', fontSize: '0.875rem', border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
            <input
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              className="auth-input"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#334155' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: '#1773cf', fontWeight: 500, textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="Enter your password"
              className="auth-input"
              style={{ paddingRight: '2.75rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
            >
              {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: '0.25rem' }}>
          {loading ? (
            <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              Sign In
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: '#1773cf', fontWeight: 600, textDecoration: 'none' }}>
            Create Account
          </Link>
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.5rem' }}>
        © 2025 Industry Management System. All rights reserved.
      </p>
    </div>
  )
}
