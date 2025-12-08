import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n/I18nProvider'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { signIn, resetPassword } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  // Check if user is already authenticated (including dev auto-login)
  const { user } = useAuth()
  if (user) {
    navigate('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (isForgotPassword) {
        await resetPassword(email)
        setSuccessMessage('Check your email for the password reset link!')
        setIsForgotPassword(false)
        setEmail('')
      } else {
        await signIn(email, password)
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl mb-4">📦</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('appTitle')}</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isForgotPassword ? t('auth.resetPassword') : t('auth.signInToAccount')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? t('common.loading') : isForgotPassword ? t('auth.sendResetLink') : t('auth.signIn')}
            </button>

            <div className="text-center space-y-2">
              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true)
                    setError('')
                    setSuccessMessage('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {t('auth.forgotPassword')}
                </button>
              )}

              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false)
                    setError('')
                    setSuccessMessage('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {t('auth.backToSignIn')}
                </button>
              )}
            </div>

            
            {!isForgotPassword && (
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {t('auth.dontHaveAccount')}{' '}
                  <Link
                    to="/register"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t('auth.signUp')}
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          SSTH Inventory System v2.0
        </p>
      </div>
    </div>
  )
}
