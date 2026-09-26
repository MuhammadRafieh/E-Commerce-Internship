import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send, ArrowRight } from '../components/ui/Icons'
import { authService } from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-md mx-auto px-4 py-12 lg:py-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Forgot your password?</h1>
        <p className="text-gray-500 mt-2">
          {sent
            ? "We'll send a reset link to your inbox."
            : 'Enter your email and we’ll send you a link to reset it.'}
        </p>
      </div>

      <div className="bg-night-900 rounded-2xl border border-night-700 p-6 sm:p-8 shadow-sm">
        {sent ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-500/10 border border-primary-500/20 mb-5">
              <Mail size={26} className="text-primary-400" />
            </div>
            <p className="text-sm text-gray-400">
              If an account exists for{' '}
              <span className="text-gray-200 font-medium">{email}</span>, a reset link is on
              its way. The link expires in 1 hour.
            </p>
            <p className="text-xs text-gray-600 mt-3">
              Running this locally? The link is printed in the backend console.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm text-primary-400 font-medium hover:text-primary-300"
            >
              Back to sign in
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-night-700 rounded-xl text-sm bg-night-950 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                placeholder="you@example.com"
                autoComplete="off"
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
                <Send size={18} />
              )}
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        {!sent && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Remembered it?{' '}
            <Link
              to="/login"
              className="text-primary-400 font-medium hover:text-primary-300"
            >
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
