import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Lock, Check, Eye, EyeOff, ArrowRight } from '../components/ui/Icons'
import { authService } from '../services/authService'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      return setError('Passwords do not match')
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <section className="max-w-md mx-auto px-4 py-12 lg:py-20">
        <div className="bg-night-900 rounded-2xl border border-night-700 p-8 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-500/10 border border-primary-500/20 mb-5">
            <Check size={26} className="text-primary-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Password updated</h1>
          <p className="text-sm text-gray-500 mt-2">
            Taking you to sign in…
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-md mx-auto px-4 py-12 lg:py-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Choose a new password</h1>
        <p className="text-gray-500 mt-2">This link expires in 1 hour</p>
      </div>

      <div className="bg-night-900 rounded-2xl border border-night-700 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock size={18} />
            )}
            {loading ? 'Updating...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-primary-400 font-medium hover:text-primary-300"
          >
            Back to sign in
            <ArrowRight size={16} />
          </Link>
        </p>
      </div>
    </section>
  )
}
