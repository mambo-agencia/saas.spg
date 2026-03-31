'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/auth/login', data)
      login(res.data.data.accessToken, res.data.data.usuario)
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al iniciar sesión'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl text-accent tracking-widest">SPG</h1>
          <p className="font-display text-xl text-text-secondary tracking-widest mt-1">
            JURIDICO
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="font-display text-display-md text-text mb-6">INICIAR SESIÓN</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                {...register('email', {
                  required: 'Email requerido',
                  pattern: { value: /^\S+@\S+$/, message: 'Email inválido' },
                })}
                type="email"
                className="input"
                placeholder="usuario@spgjuridico.com.ar"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                {...register('password', { required: 'Contraseña requerida' })}
                type="password"
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          SPG Juridico v0.1 — Grupo SPG Abogados
        </p>
      </div>
    </div>
  )
}
