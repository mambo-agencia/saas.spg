'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬜' },
  { href: '/casos', label: 'Casos', icon: '📁' },
  { href: '/agenda', label: 'Agenda', icon: '📅' },
  { href: '/analisis', label: 'Análisis', icon: '📊' },
  { href: '/conexiones', label: 'Conexiones', icon: '🔗' },
  { href: '/usuarios', label: 'Usuarios', icon: '👥', adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 flex-shrink-0 bg-bg-secondary border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <span className="font-display text-3xl text-accent tracking-widest">SPG</span>
        <span className="font-display text-sm text-text-secondary tracking-widest ml-1">
          JURIDICO
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.filter((item) => {
          if (item.adminOnly && user?.rol !== 'admin') return false
          return true
        }).map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150',
                active
                  ? 'bg-accent/10 text-accent font-medium border-l-2 border-accent pl-[10px]'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-sans">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-text truncate">{user?.nombre}</p>
          <p className="text-xs text-text-secondary capitalize">{user?.rol}</p>
        </div>
        <button
          onClick={logout}
          className="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-xs text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
        >
          <span>→</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
