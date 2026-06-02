import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  TrendingUp,
  Wallet,
  Megaphone,
  CheckCircle,
  Clock,
  Building2,
  Zap,
} from 'lucide-react'
import { Layout, PageHeader, StatCard } from '../components/Layout'
import { Badge } from '../components/Badge'
import { LoadingScreen } from '../components/Spinner'
import { campaigns, companies, adminApi } from '../lib/api'
import { formatSat, relativeTime } from '../lib/utils'
import type { CampaignOut } from '../lib/types'

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-400',
    paused: 'bg-yellow-400',
    draft: 'bg-zinc-500',
    completed: 'bg-blue-400',
    cancelled: 'bg-red-400',
  }
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${colors[status] ?? 'bg-zinc-500'}`} />
  )
}

function CampaignRow({ c }: { c: CampaignOut }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/60 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <StatusDot status={c.status} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{c.name}</p>
          <p className="text-xs text-zinc-500">{relativeTime(c.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <Badge value={c.campaign_type} />
        <Badge value={c.reward_mode} />
        <span className="text-xs text-zinc-400 w-20 text-right">{formatSat(c.total_budget_sat)}</span>
      </div>
    </div>
  )
}

export function Dashboard() {
  const platform = useQuery({
    queryKey: ['platform-summary'],
    queryFn: campaigns.platformSummary,
    retry: 1,
  })

  const campaignList = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaigns.list(),
    retry: 1,
  })

  const companyList = useQuery({
    queryKey: ['companies'],
    queryFn: () => companies.list(),
    retry: 1,
  })

  const adminSummary = useQuery({
    queryKey: ['admin-summary'],
    queryFn: adminApi.campaignsSummary,
    retry: 1,
  })

  const referrals = useQuery({
    queryKey: ['referrals-summary'],
    queryFn: () => adminApi.referralsSummary(5),
    retry: 1,
  })

  const p = platform.data
  const c = campaignList.data ?? []
  const active = c.filter(x => x.status === 'active')
  const paused = c.filter(x => x.status === 'paused')
  const adm = adminSummary.data

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        subtitle={new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(new Date())}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <StatCard
          label="Total Campañas"
          value={p?.total_campaigns ?? c.length}
          sub={`${active.length} activas`}
          accent
        />
        <StatCard
          label="Presupuesto Total"
          value={formatSat(p?.total_budget_allocated_sat ?? adm?.total_budget_allocated)}
          sub={`Gastado: ${formatSat(p?.total_spent_sat ?? adm?.total_spent)}`}
        />
        <StatCard
          label="Empresas"
          value={companyList.data?.length ?? '—'}
          sub="registradas"
        />
        <StatCard
          label="Referrals"
          value={referrals.data?.total_referrals ?? '—'}
          sub={`${formatSat(referrals.data?.total_rewarded_sat)} pagados`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent campaigns */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Megaphone size={14} className="text-orange-400" />
              Campañas recientes
            </h2>
            <a href="/campaigns" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
              Ver todas →
            </a>
          </div>
          {campaignList.isLoading ? (
            <LoadingScreen />
          ) : c.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Sin campañas aún</p>
          ) : (
            <div>
              {c.slice(0, 8).map(camp => (
                <CampaignRow key={camp.id} c={camp} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Status breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
              <Activity size={14} className="text-orange-400" />
              Estado de campañas
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Activas', count: active.length, color: 'bg-emerald-500' },
                { label: 'Pausadas', count: paused.length, color: 'bg-yellow-500' },
                { label: 'Completadas', count: c.filter(x => x.status === 'completed').length, color: 'bg-blue-500' },
                { label: 'Borrador', count: c.filter(x => x.status === 'draft').length, color: 'bg-zinc-600' },
                { label: 'Canceladas', count: c.filter(x => x.status === 'cancelled').length, color: 'bg-red-500' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="flex-1 text-xs text-zinc-400">{label}</span>
                  <span className="text-xs font-medium text-zinc-200">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top referrers */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-orange-400" />
              Top Referrers
            </h2>
            {referrals.isLoading ? (
              <LoadingScreen />
            ) : (referrals.data?.top_referrers ?? []).length === 0 ? (
              <p className="text-xs text-zinc-500">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {(referrals.data?.top_referrers ?? []).map((r, i) => (
                  <div key={r.nostr_pubkey} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 w-4">{i + 1}</span>
                    <span className="flex-1 font-mono text-xs text-zinc-400 truncate">
                      {r.nostr_pubkey.slice(0, 16)}…
                    </span>
                    <span className="text-xs text-orange-400 font-medium">
                      {formatSat(r.total_rewarded_sat)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick health */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
              <Zap size={14} className="text-orange-400" />
              Tipo de rewards
            </h2>
            <div className="space-y-2">
              {(['simulate', 'zap'] as const).map(mode => {
                const cnt = c.filter(x => x.reward_mode === mode).length
                return (
                  <div key={mode} className="flex items-center gap-2">
                    <Badge value={mode} />
                    <span className="flex-1" />
                    <span className="text-xs font-medium text-zinc-300">{cnt} campañas</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
