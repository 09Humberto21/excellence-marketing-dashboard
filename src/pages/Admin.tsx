import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, TrendingUp, Wallet, Megaphone } from 'lucide-react'
import { Layout, PageHeader, StatCard } from '../components/Layout'
import { Badge } from '../components/Badge'
import { LoadingScreen, EmptyState } from '../components/Spinner'
import { adminApi } from '../lib/api'
import { formatSat, truncate } from '../lib/utils'

export function Admin() {
  const summary = useQuery({
    queryKey: ['admin-campaigns-summary'],
    queryFn: adminApi.campaignsSummary,
    retry: 1,
  })

  const referrals = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: () => adminApi.referralsSummary(20),
    retry: 1,
  })

  const s = summary.data
  const r = referrals.data

  return (
    <Layout>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Vistas agregadas del servicio admin (puerto 8010)"
      />

      {/* Campaign stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <StatCard label="Total campañas" value={s?.total_campaigns ?? '—'} />
        <StatCard label="Activas" value={s?.active_campaigns ?? '—'} accent />
        <StatCard label="Presupuesto total" value={formatSat(s?.total_budget_allocated)} />
        <StatCard label="Total gastado" value={formatSat(s?.total_spent)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Campaigns table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4">
            <Megaphone size={14} className="text-orange-400" />
            Campañas (Admin view)
          </h2>
          {summary.isLoading ? <LoadingScreen /> :
            summary.error ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-xs text-red-400">
                  No se pudo conectar al Admin API. Verifica que el servicio esté corriendo en el puerto configurado y que la API key sea correcta.
                </p>
              </div>
            ) :
            !s?.campaigns?.length ? <EmptyState message="Sin campañas" /> : (
              <div className="space-y-2">
                {s.campaigns.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{c.name}</p>
                      <p className="text-xs text-zinc-500">{c.actions_count ?? 0} acciones</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge value={c.status} />
                      <Badge value={c.campaign_type} />
                      <span className="text-xs text-orange-400 w-20 text-right">
                        {formatSat(c.total_spent_sat)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Referrals */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-orange-400" />
              Referrals summary
            </h2>
            {referrals.isLoading ? <LoadingScreen /> :
              referrals.error ? (
                <p className="text-xs text-red-400">Admin API no disponible</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-zinc-800/50 p-3">
                      <p className="text-xs text-zinc-500">Total referrals</p>
                      <p className="text-xl font-bold text-zinc-100 mt-1">{r?.total_referrals ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 p-3">
                      <p className="text-xs text-zinc-500">Total pagado</p>
                      <p className="text-xl font-bold text-orange-400 mt-1">{formatSat(r?.total_rewarded_sat)}</p>
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-zinc-400 mb-2">Top referrers</h3>
                  {!r?.top_referrers?.length ? <EmptyState message="Sin referrers" /> : (
                    <div className="space-y-2">
                      {r.top_referrers.map((ref, i) => (
                        <div key={ref.nostr_pubkey} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                          <span className="text-sm font-bold text-zinc-500 w-5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-zinc-300 truncate">
                              {truncate(ref.nostr_pubkey, 24)}
                            </p>
                            <p className="text-xs text-zinc-500">{ref.referral_count} referrals</p>
                          </div>
                          <span className="text-sm font-medium text-orange-400 shrink-0">
                            {formatSat(ref.total_rewarded_sat)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            }
          </div>
        </div>
      </div>
    </Layout>
  )
}
