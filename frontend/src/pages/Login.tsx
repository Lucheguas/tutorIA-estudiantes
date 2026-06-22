import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('¡Bienvenido!')
    } catch (err: unknown) {
      const msg = (err as Error).message
      if (msg.includes('Invalid login')) toast.error('Correo o contraseña incorrectos.')
      else toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 mb-4">
            <BookOpen className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900">E-Tutor UNFV</h1>
          <p className="text-stone-500 mt-1">Plataforma de tutoría inteligente · UNFV</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <p className="text-sm text-stone-500 text-center mb-6">
            Ingresa con tu correo institucional<br/>
            <span className="text-orange-400 font-mono text-xs">codigo@unfv.edu.pe</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-stone-500 mb-1">Correo institucional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="202371426@unfv.edu.pe"
                  required
                  autoComplete="email"
                  className="w-full bg-[#ede9e4] border border-[#d6d0ca] rounded-xl pl-10 pr-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-stone-500 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#ede9e4] border border-[#d6d0ca] rounded-xl pl-10 pr-10 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 transition"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all glow mt-2"
            >
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-stone-400 mt-6">
            ¿Problemas para ingresar? Consulta a tu tutor.
          </p>
        </div>
      </div>
    </div>
  )
}
