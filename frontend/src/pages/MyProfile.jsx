import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Save, Eye, EyeOff, Check, X } from '../components/ui/Icons'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export default function MyProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)

  const [pwOpen, setPwOpen] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState(null)

  /* Clears local auth state and returns to the sign-in screen. */
  const logoutAndRedirect = async () => {
    try {
      await logout()
    } catch {
      /* cookie is already cleared server-side */
    }
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    authService.getProfile()
      .then((res) => { setProfile(res.data); setForm({ name: res.data.name, email: res.data.email }) })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await authService.updateProfile({ name: form.name, email: form.email })
      setProfile(res.data)
      setEditing(false)
      flash('Profile updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError(null)
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match')
      return
    }
    setPwSaving(true)
    try {
      const res = await authService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      /* The server retires every existing token on a password change, so
         send the user to sign in again rather than letting the next
         request bounce them off a bare 401. */
      if (res.data?.reauth) {
        flash(res.data.message || 'Password changed — please sign in again')
        setTimeout(() => logoutAndRedirect(), 1500)
        return
      }
      setPwOpen(false)
      flash('Password changed')
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
      {success && (
        <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl flex items-center gap-2">
          <Check size={16} className="text-green-400" />
          {success}
        </div>
      )}

      {/* Profile header */}
      <div className="bg-night-900 rounded-2xl border border-night-700 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-500/15 rounded-full flex items-center justify-center">
              <User size={28} className="text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{profile?.name}</h1>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm font-medium text-primary-400 border border-primary-500/20 rounded-xl hover:bg-primary-500/15 transition-colors active:scale-[0.97]">
              Edit
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
            <X size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setEditing(false); setForm({ name: profile.name, email: profile.email }) }}
                className="flex-1 px-5 py-2.5 border border-night-600 text-gray-300 font-medium rounded-xl hover:bg-white/5 transition-colors active:scale-[0.97]">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors active:scale-[0.97] disabled:opacity-50">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-night-800 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Role</p>
              <p className="font-medium text-white capitalize">{profile?.role}</p>
            </div>
            <div className="p-4 bg-night-800 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</p>
              <p className="font-medium text-white">{new Date(profile?.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        )}
      </div>

      {/* Password section */}
      <div className="bg-night-900 rounded-2xl border border-night-700 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-white">Password</h2>
          </div>
          {!pwOpen && (
            <button onClick={() => setPwOpen(true)}
              className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors">
              Change
            </button>
          )}
        </div>

        {pwOpen && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{pwError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 pr-11 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
              <input type="password" required minLength={6} value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
              <input type="password" required minLength={6} value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setPwOpen(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwError(null) }}
                className="flex-1 px-5 py-2.5 border border-night-600 text-gray-300 font-medium rounded-xl hover:bg-white/5 transition-colors active:scale-[0.97]">
                Cancel
              </button>
              <button type="submit" disabled={pwSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-500 transition-colors active:scale-[0.97] disabled:opacity-50">
                {pwSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={18} />}
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {!pwOpen && (
          <p className="text-sm text-gray-500">Change your account password. You&apos;ll need your current password.</p>
        )}
      </div>
    </div>
  )
}
