'use client'

import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  nombre: string
  rol: string
}

interface AuthStore {
  token: string | null
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  isAuthenticated: () => boolean
}

// Simple zustand store — persisted in localStorage
let _token: string | null = null
let _user: AuthUser | null = null

if (typeof window !== 'undefined') {
  _token = localStorage.getItem('spg_token')
  const raw = localStorage.getItem('spg_user')
  _user = raw ? (JSON.parse(raw) as AuthUser) : null
}

// We're using a simple closure pattern here to avoid SSR issues
// In production you'd use next-auth or similar
let _listeners: Array<() => void> = []
let _state = { token: _token, user: _user }

export function useAuth(): AuthStore {
  return {
    token: _state.token,
    user: _state.user,
    login(token, user) {
      _state = { token, user }
      if (typeof window !== 'undefined') {
        localStorage.setItem('spg_token', token)
        localStorage.setItem('spg_user', JSON.stringify(user))
      }
      _listeners.forEach((l) => l())
    },
    logout() {
      _state = { token: null, user: null }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('spg_token')
        localStorage.removeItem('spg_user')
        window.location.href = '/login'
      }
    },
    isAuthenticated: () => !!_state.token,
  }
}
