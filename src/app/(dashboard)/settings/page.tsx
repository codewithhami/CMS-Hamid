'use client'

import { useState, useEffect } from 'react'
import { User, Lock, Bell, Save, Loader2, Building2, Plus, Edit, Trash2 } from 'lucide-react'
import { cardStyle, inputStyle, labelStyle, btnPrimaryStyle, actionBtnStyle } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { useFactory } from '@/context/FactoryContext'

type Tab = 'profile' | 'security' | 'notifications' | 'factories'

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState({ id: '', name: '', email: '', phone: '0300-1234567', role: 'admin' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [notifications, setNotifications] = useState({ email: true, salary: true, expense: false, reports: true })
  const [factoriesList, setFactoriesList] = useState<any[]>([])
  const [factoryForm, setFactoryForm] = useState({ id: '', name: '', is_default: false })
  const [showFactoryModal, setShowFactoryModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const { refreshFactories, factories } = useFactory()

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
    { id: 'factories', label: 'Factories', Icon: Building2 },
  ]

  async function handleSaveFactory() {
    if (!factoryForm.name) return alert('Name is required')
    
    // If setting as default, unset others first (optional but safer)
    if (factoryForm.is_default) {
      await supabase.from('factories').update({ is_default: false }).neq('id', '00000000-0000-0000-0000-000000000000') 
    }

    const { error } = factoryForm.id 
      ? await supabase.from('factories').update({ name: factoryForm.name, is_default: factoryForm.is_default }).eq('id', factoryForm.id)
      : await supabase.from('factories').insert({ name: factoryForm.name, is_default: factoryForm.is_default })
    
    if (error) alert(error.message)
    else {
      setShowFactoryModal(false)
      refreshFactories()
    }
  }

  async function handleDeleteFactory(id: string) {
    if (factories.length <= 1) return alert('Cannot delete the only factory')
    if (confirm('Are you sure? This will delete all data (Vendors, Employees, Expenses) associated with this factory!')) {
      const { error } = await supabase.from('factories').delete().eq('id', id)
      if (error) alert(error.message)
      else refreshFactories()
    }
  }

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

          {/* Factories Tab */}
          {tab === 'factories' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Managed Industries (Factories)</h2>
                <button 
                  onClick={() => { setFactoryForm({ id: '', name: '', is_default: false }); setShowFactoryModal(true) }} 
                  style={{ ...btnPrimaryStyle, padding: '8px 16px' }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} /> Add Factory
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {factories.map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px', borderRadius: '14px', border: '1px solid #f1f5f9',
                    background: f.is_default ? '#f0f9ff' : 'white'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>{f.name}</p>
                        {f.is_default && <span style={{ fontSize: '0.625rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>DEFAULT</span>}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>ID: {f.id.slice(0, 8)}...</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setFactoryForm({ id: f.id, name: f.name, is_default: f.is_default }); setShowFactoryModal(true) }} style={actionBtnStyle('edit')}><Edit size={16} /></button>
                      <button onClick={() => handleDeleteFactory(f.id)} style={actionBtnStyle('delete')}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {showFactoryModal && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
                }}>
                  <div style={{ ...cardStyle, width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>{factoryForm.id ? 'Edit Factory' : 'Add New Factory'}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Factory Name</label>
                        <input type="text" value={factoryForm.name} onChange={e => setFactoryForm({ ...factoryForm, name: e.target.value })} style={inputStyle} placeholder="e.g., Silk Unit 02" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" checked={factoryForm.is_default} onChange={e => setFactoryForm({ ...factoryForm, is_default: e.target.checked })} style={{ width: '18px', height: '18px' }} id="is_default" />
                        <label htmlFor="is_default" style={{ fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>Set as default factory</label>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <button onClick={handleSaveFactory} style={{ ...btnPrimaryStyle, flex: 1 }}>Save</button>
                        <button onClick={() => setShowFactoryModal(false)} style={{ ...btnPrimaryStyle, flex: 1, background: '#f1f5f9', color: '#475569' }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
