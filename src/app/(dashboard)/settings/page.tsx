'use client'

import { useState, useEffect } from 'react'
import { User, Lock, Bell, Save, Loader2 } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'

type Tab = 'profile' | 'security' | 'notifications'

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState({ id: '', name: '', email: '', phone: '0300-1234567', role: 'admin' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [notifications, setNotifications] = useState({ email: true, salary: true, expense: false, reports: true })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          setProfile({ id: data.id, name: data.full_name || '', email: data.email || '', phone: '0300-1234567', role: data.role })
        }
      } else {
        // Fallback or demo user if not logged in (for development)
        const { data } = await supabase.from('profiles').select('*').limit(1).single()
        if (data) {
          setProfile({ id: data.id, name: data.full_name || 'Admin User', email: data.email || 'admin@company.com', phone: '0300-1234567', role: data.role })
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  async function handleProfileSave() {
    if (!profile.id) return
    const { error } = await supabase.from('profiles').update({ full_name: profile.name }).eq('id', profile.id)
    if (error) alert(error.message)
    else alert('Profile updated successfully')
  }

  async function handlePasswordUpdate() {
    if (passwords.new !== passwords.confirm) {
      return alert('New passwords do not match')
    }
    if (passwords.new.length < 6) {
      return alert('Password must be at least 6 characters')
    }
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    if (error) alert(error.message)
    else {
      alert('Password updated successfully')
      setPasswords({ current: '', new: '', confirm: '' })
    }
  }

  const tabs: { id: Tab; label: string; Icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
    { id: 'profile', label: 'Profile', Icon: User },
    { id: 'security', label: 'Security', Icon: Lock },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '4px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
            transition: 'all 0.15s',
            background: tab === t.id ? '#eff6ff' : 'transparent',
            color: tab === t.id ? '#1d4ed8' : '#64748b',
          }}>
            <t.Icon style={{ width: '16px', height: '16px' }} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#64748b' }}>
          <Loader2 className="animate-spin" style={{ width: '32px', height: '32px', color: '#1773cf' }} />
        </div>
      ) : (
        <>
          {/* Profile Tab */}
          {tab === 'profile' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>Profile Settings</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '600px' }}>
                <div><label style={labelStyle}>Full Name</label><input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Email</label><input type="email" value={profile.email} disabled style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b' }} /></div>
                <div><label style={labelStyle}>Phone</label><input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Role</label><input type="text" value={profile.role} disabled style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b', textTransform: 'capitalize' }} /></div>
              </div>
              <button className="btn-primary" style={{ marginTop: '24px' }} onClick={handleProfileSave}>
                <Save style={{ width: '16px', height: '16px' }} /> Save Changes
              </button>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>Change Password</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                <div><label style={labelStyle}>New Password</label><input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} style={inputStyle} placeholder="Enter new password" /></div>
                <div><label style={labelStyle}>Confirm Password</label><input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} style={inputStyle} placeholder="Confirm new password" /></div>
              </div>
              <button className="btn-primary" style={{ marginTop: '24px' }} onClick={handlePasswordUpdate}>
                <Lock style={{ width: '16px', height: '16px' }} /> Update Password
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {tab === 'notifications' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>Notification Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
                {[
                  { key: 'email' as const, label: 'Email Notifications', desc: 'Receive email alerts for important updates' },
                  { key: 'salary' as const, label: 'Salary Alerts', desc: 'Get notified when salary payments are due' },
                  { key: 'expense' as const, label: 'Expense Alerts', desc: 'Alerts for new expense entries' },
                  { key: 'reports' as const, label: 'Monthly Reports', desc: 'Receive monthly summary reports' },
                ].map(item => (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px', borderRadius: '14px', border: '1px solid #f1f5f9',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>{item.label}</p>
                      <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '2px' }}>{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      style={{
                        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: notifications[item.key] ? '#2563eb' : '#e2e8f0',
                        position: 'relative', transition: 'all 0.2s', flexShrink: 0,
                      }}>
                      <span style={{
                        position: 'absolute', top: '2px',
                        left: notifications[item.key] ? '22px' : '2px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: 'white', transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop: '24px' }}>
                <Save style={{ width: '16px', height: '16px' }} /> Save Preferences
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
