'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signup } from '../actions'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      {/* Logo & Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
          Create Account
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Join Industry Management System
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {error && (
          <div style={{
            background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem',
            borderRadius: '12px', fontSize: '0.875rem', border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
            Full Name
          </label>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
            <input
              type="text"
              name="fullName"
              required
              placeholder="John Doe"
              className="auth-input"
            />
          </div>
        </div>

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
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
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

        {/* Confirm Password */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              placeholder="Confirm your password"
              className="auth-input"
            />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: '0.25rem' }}>
          {loading ? (
            <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              Create Account
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#1773cf', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1.25rem' }}>
        © 2025 Industry Management System. All rights reserved.
      </p>
    </div>
  )
}
