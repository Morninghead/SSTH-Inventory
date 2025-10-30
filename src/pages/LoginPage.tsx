import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function LoginPage() {
  const [email, setEmail] = useState('nopanat.aplus@gmail.com')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-2xl font-bold text-gray-800">SSTH Inventory</h1>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
            {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            {!isForgotPassword && (
              <Input
                label="Password"
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            )}

            {error && (
              <div className="bg-okabe-ito-vermillion bg-opacity-10 text-okabe-ito-vermillion px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-okabe-ito-bluishGreen bg-opacity-10 text-okabe-ito-bluishGreen px-4 py-3 rounded-md text-sm">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : isForgotPassword ? 'Send Reset Link' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(!isForgotPassword)
                setError('')
                setSuccessMessage('')
              }}
              className="text-sm text-okabe-ito-blue hover:underline"
            >
              {isForgotPassword ? 'Back to Sign In' : 'Forgot your password?'}
            </button>
          </div>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          SSTH Inventory System v2.0
        </p>
      </div>
    </div>
  )
}
