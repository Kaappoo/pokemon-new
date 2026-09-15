import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../lib/auth-context'
import { authApi } from '../lib/api'
import { User, KeyRound, Mail, Sparkles, LogIn, UserPlus, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const res = await authApi.login({
          username_or_email: username,
          password: password,
        })
        login(res.token, res.user)
        navigate({ to: '/profile' })
      } else {
        const res = await authApi.register({
          username: username,
          email: email,
          password: password,
        })
        login(res.token, res.user)
        navigate({ to: '/profile' })
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-(--bg-primary) text-(--text-primary)">
      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_12px_40px_rgba(136,59,207,0.15)] flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#883bcf] to-[#6d28d9] flex items-center justify-center text-white shadow-lg shadow-[#883bcf]/30 mb-1">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-white via-[#d9d0ff] to-white bg-clip-text text-transparent">
            {mode === 'login' ? 'Welcome Back Trainer' : 'Join Poké Cards'}
          </h1>
          <p className="text-xs text-(--text-secondary) max-w-xs">
            {mode === 'login'
              ? 'Sign in to sync your card wishlists and collection'
              : 'Create an account to start saving wishlists and managing cards'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
              mode === 'login'
                ? 'bg-[#883bcf] text-white shadow-md'
                : 'bg-transparent text-(--text-secondary) hover:text-white'
            }`}
          >
            <LogIn size={16} /> Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError(null)
            }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
              mode === 'register'
                ? 'bg-[#883bcf] text-white shadow-md'
                : 'bg-transparent text-(--text-secondary) hover:text-white'
            }`}
          >
            <UserPlus size={16} /> Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
              {mode === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-3 text-(--text-secondary) opacity-60" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'ash_ketchum or ash@pokemon.com' : 'ash_ketchum'}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-(--text-secondary)/40 outline-none focus:border-[#883bcf] focus:shadow-[0_0_12px_rgba(136,59,207,0.3)] transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail size={18} className="absolute left-3 text-(--text-secondary) opacity-60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ash@pokemon.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-(--text-secondary)/40 outline-none focus:border-[#883bcf] focus:shadow-[0_0_12px_rgba(136,59,207,0.3)] transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
              Password
            </label>
            <div className="relative flex items-center">
              <KeyRound size={18} className="absolute left-3 text-(--text-secondary) opacity-60" />
              <input
                type="password"
                required
                minLength={mode === 'register' ? 6 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-(--text-secondary)/40 outline-none focus:border-[#883bcf] focus:shadow-[0_0_12px_rgba(136,59,207,0.3)] transition-all"
              />
            </div>
            {mode === 'register' && (
              <span className="text-[0.65rem] text-(--text-secondary) opacity-60">Must be at least 6 characters</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-linear-to-r from-[#883bcf] to-[#a855f7] border-none cursor-pointer shadow-[0_4px_16px_rgba(136,59,207,0.3)] hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : mode === 'login' ? (
              <>Sign In</>
            ) : (
              <>Create Account</>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
