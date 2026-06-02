import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  Cpu,
  Layers,
  ShieldCheck,
  Settings,
  Zap,
} from 'lucide-react'
import { cn } from '../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/campaigns', label: 'Campañas', icon: Megaphone },
  { to: '/companies', label: 'Empresas', icon: Building2 },
  { to: '/workers', label: 'Workers', icon: Cpu },
  { to: '/ark', label: 'Ark / Lightning', icon: Zap },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
          <Layers size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-100 leading-none">Excellence</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Marketing Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-orange-400' : 'text-zinc-500'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t border-zinc-800 px-3 py-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-orange-500/10 text-orange-400'
                : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
            )
          }
        >
          <Settings size={16} className="text-zinc-500" />
          Configuración
        </NavLink>
      </div>
    </aside>
  )
}
