import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  RotateCcw,
  Wifi,
  WifiOff,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { Layout, Btn, Input, Select, StatCard } from '../components/Layout'
import { Modal } from '../components/Modal'
import { Badge } from '../components/Badge'
import { LoadingScreen, EmptyState } from '../components/Spinner'
import { useToast } from '../components/Toast'
import { campaigns, actions, rewards, detectionRules } from '../lib/api'
import { formatSat, formatDate, truncate, relativeTime, formatApiError } from '../lib/utils'
import type {
  ActionType,
  CampaignActionCreate,
  CampaignDetectionRuleCreate,
  RuleType,
} from '../lib/types'

const TABS = ['overview', 'actions', 'detection', 'rewards', 'monitor', 'nwc'] as const
type Tab = typeof TABS[number]

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Resumen',
  actions: 'Acciones',
  detection: 'Reglas',
  rewards: 'Rewards',
  monitor: 'Monitor',
  nwc: 'NWC',
}

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [actionModal, setActionModal] = useState(false)
  const [ruleModal, setRuleModal] = useState(false)
  const [nwcUri, setNwcUri] = useState('')
  const [actionForm, setActionForm] = useState<CampaignActionCreate>({
    nostr_pubkey: '',
    action_type: 'share_event',
    event_id: '',
  })
  const [ruleForm, setRuleForm] = useState<CampaignDetectionRuleCreate>({
    rule_type: 'keyword',
    value: '',
  })

  const { data: campaign, isLoading, isError, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaigns.get(id!),
    enabled: !!id,
    retry: 1,
  })

  // #region agent log
  fetch('http://127.0.0.1:7274/ingest/1f570826-b3ad-457f-aeed-80c82123d2aa',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8a1f42'},body:JSON.stringify({sessionId:'8a1f42',location:'CampaignDetail.tsx:query',message:'campaign query state',data:{routeId:id,isLoading,isError,errorMsg:isError?String((error as Error)?.message??error):null,hasCampaign:!!campaign,campaignKeys:campaign?Object.keys(campaign):[],idField:(campaign as {id?:string})?.id,campaignIdField:(campaign as {campaign_id?:string})?.campaign_id,reward_mode:(campaign as {reward_mode?:unknown})?.reward_mode,funding_mode:(campaign as {funding_mode?:unknown})?.funding_mode,detection_mode:(campaign as {detection_mode?:unknown})?.detection_mode},timestamp:Date.now(),hypothesisId:'A-B'})}).catch(()=>{});
  // #endregion

  const { data: actionList, isLoading: actionsLoading } = useQuery({
    queryKey: ['actions', id],
    queryFn: () => actions.list(id!),
    enabled: !!id && tab === 'actions',
    retry: 1,
  })

  const { data: rewardList, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards', id],
    queryFn: () => rewards.list(id!),
    enabled: !!id && tab === 'rewards',
    retry: 1,
  })

  const { data: ruleList } = useQuery({
    queryKey: ['rules', id],
    queryFn: () => detectionRules.list(id!),
    enabled: !!id && tab === 'detection',
    retry: 1,
  })

  const { data: monitorJob } = useQuery({
    queryKey: ['monitor', id],
    queryFn: () => detectionRules.monitorJob(id!),
    enabled: !!id && tab === 'monitor',
    retry: 1,
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['campaign', id] })
    qc.invalidateQueries({ queryKey: ['campaigns'] })
  }

  const lifecycle = useMutation({
    mutationFn: (action: string) => {
      const map: Record<string, (id: string) => Promise<any>> = {
        activate: campaigns.activate,
        pause: campaigns.pause,
        resume: campaigns.resume,
        complete: campaigns.complete,
        delete: campaigns.delete,
      }
      return map[action](id!)
    },
    onSuccess: (_, action) => {
      invalidateAll()
      const labels: Record<string, string> = {
        activate: 'Activada', pause: 'Pausada', resume: 'Reanudada',
        complete: 'Completada', delete: 'Cancelada',
      }
      toast('success', `Campaña ${labels[action]}`)
    },
    onError: (e: unknown) => toast('error', formatApiError(e, 'Error')),
  })

  const createAction = useMutation({
    mutationFn: () => actions.create(id!, actionForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actions', id] })
      setActionModal(false)
      setActionForm({ nostr_pubkey: '', action_type: 'share_event', event_id: '' })
      toast('success', 'Acción registrada')
    },
    onError: (e: unknown) => toast('error', formatApiError(e, 'Error')),
  })

  const verifyAction = useMutation({
    mutationFn: (actionId: string) => actions.verify(actionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actions', id] })
      toast('success', 'Acción verificada')
    },
    onError: (e: unknown) => toast('error', formatApiError(e, 'Error')),
  })

  const createRule = useMutation({
    mutationFn: () => detectionRules.create(id!, ruleForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules', id] })
      setRuleModal(false)
      setRuleForm({ rule_type: 'keyword', value: '' })
      toast('success', 'Regla creada')
    },
    onError: (e: unknown) => toast('error', formatApiError(e, 'Error')),
  })

  const testNwc = useMutation({
    mutationFn: () => campaigns.testNwc(id!, nwcUri || undefined),
    onSuccess: (data) => toast('success', `NWC ${data.nwc_status} — ${data.methods.length} métodos`),
    onError: (e: unknown) => toast('error', formatApiError(e, 'Error al testear NWC')),
  })

  if (isLoading) return <Layout><LoadingScreen /></Layout>
  if (!campaign) return <Layout><p className="text-zinc-500">Campaña no encontrada</p></Layout>

  const c = campaign

  // #region agent log
  fetch('http://127.0.0.1:7274/ingest/1f570826-b3ad-457f-aeed-80c82123d2aa',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8a1f42'},body:JSON.stringify({sessionId:'8a1f42',runId:'post-fix',location:'CampaignDetail.tsx:pre-render',message:'about to render detail',data:{badgeFields:{status:c.status,reward_mode:c.reward_mode,funding_mode:c.funding_mode,detection_mode:c.detection_mode,nwc_status:c.nwc_status},rewardModeType:typeof c.reward_mode,hasId:!!c.id},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  return (
    <Layout>
      {/* Back + title */}
      <div className="mb-6">
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Volver a campañas
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{c.name}</h1>
            {c.description && <p className="mt-1 text-sm text-zinc-400">{c.description}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge value={c.status} />
              <Badge value={c.campaign_type} />
              <Badge value={c.reward_mode} />
              <Badge value={c.funding_mode} />
              {c.nwc_status && <Badge value={c.nwc_status === 'active' ? 'active_nwc' : c.nwc_status} />}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {c.status === 'draft' && (
              <Btn variant="primary" size="sm" onClick={() => lifecycle.mutate('activate')}>
                <Play size={12} /> Activar
              </Btn>
            )}
            {c.status === 'active' && (
              <Btn variant="outline" size="sm" onClick={() => lifecycle.mutate('pause')}>
                <Pause size={12} /> Pausar
              </Btn>
            )}
            {c.status === 'paused' && (
              <Btn variant="primary" size="sm" onClick={() => lifecycle.mutate('resume')}>
                <RotateCcw size={12} /> Reanudar
              </Btn>
            )}
            {(c.status === 'active' || c.status === 'paused' || c.status === 'draft') && (
              <Btn variant="outline" size="sm" onClick={() => lifecycle.mutate('complete')}>
                <CheckCircle size={12} /> Completar
              </Btn>
            )}
            {c.status !== 'cancelled' && (
              <Btn variant="danger" size="sm" onClick={() => lifecycle.mutate('delete')}>
                <XCircle size={12} /> Cancelar
              </Btn>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <StatCard label="Acciones" value={c.total_actions ?? 0} />
        <StatCard label="Presupuesto" value={formatSat(c.budget_sat)} />
        <StatCard label="Gastado" value={formatSat(c.spent_sat)} accent />
        <StatCard label="Reward/acción" value={formatSat(c.reward_per_action_sat)} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/40 p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-in">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-100">Detalles</h3>
                {[
                  ['ID', <span className="font-mono text-xs">{c.id}</span>],
                  ['Empresa', <span className="font-mono text-xs">{c.company_id ? `${c.company_id.slice(0, 12)}…` : '—'}</span>],
                  ['Detección', <Badge value={c.detection_mode} />],
                  ['Creada', formatDate(c.created_at)],
                  ['Inicio', formatDate(c.start_at)],
                  ['Fin', formatDate(c.end_at)],
                  ['Máx. acciones / usuario', c.max_actions_per_user ?? '—'],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 text-xs">{k}</span>
                    <span className="text-zinc-200 text-xs">{v as any}</span>
                  </div>
                ))}
              </div>
              {(c.target_keywords?.length || c.comment_template) ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
                  {c.target_keywords?.length ? (
                    <div>
                      <p className="text-xs font-medium text-zinc-400 mb-2">Target Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {c.target_keywords.map(k => (
                          <span key={k} className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-xs text-orange-400">{k}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {c.comment_template ? (
                    <div>
                      <p className="text-xs font-medium text-zinc-400 mb-2">Plantilla de comentario</p>
                      <p className="text-xs text-zinc-400 bg-zinc-800 rounded-lg px-3 py-2">{c.comment_template}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {tab === 'actions' && (
          <div>
            <div className="flex justify-end mb-3">
              <Btn variant="primary" size="sm" onClick={() => setActionModal(true)}>
                <Plus size={12} /> Registrar acción
              </Btn>
            </div>
            {actionsLoading ? <LoadingScreen /> : !actionList?.length ? (
              <EmptyState message="No hay acciones registradas" />
            ) : (
              <div className="space-y-2">
                {actionList.map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-zinc-300">{truncate(a.nostr_pubkey, 20)}</p>
                      <p className="text-xs text-zinc-500">{relativeTime(a.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge value={a.action_type} />
                      <Badge value={a.verification_status} />
                      <Badge value={a.reward_status} />
                      {a.reward_sat && (
                        <span className="text-xs text-orange-400">{formatSat(a.reward_sat)}</span>
                      )}
                      {a.verification_status === 'pending' && (
                        <Btn size="sm" variant="outline" onClick={() => verifyAction.mutate(a.id)}>
                          <ShieldCheck size={11} /> Verificar
                        </Btn>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'detection' && (
          <div>
            <div className="flex justify-end mb-3">
              <Btn variant="primary" size="sm" onClick={() => setRuleModal(true)}>
                <Plus size={12} /> Nueva regla
              </Btn>
            </div>
            {!ruleList?.length ? (
              <EmptyState message="No hay reglas de detección" />
            ) : (
              <div className="space-y-2">
                {ruleList.map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <div>
                      <p className="text-sm text-zinc-100">{r.value}</p>
                      <p className="text-xs text-zinc-500">{formatDate(r.created_at)}</p>
                    </div>
                    <Badge value={r.rule_type} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'rewards' && (
          <div>
            {rewardsLoading ? <LoadingScreen /> : !rewardList?.length ? (
              <EmptyState message="No hay intentos de reward" />
            ) : (
              <div className="space-y-2">
                {rewardList.map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <div>
                      <p className="text-xs font-mono text-zinc-400">{truncate(r.action_id, 16)}</p>
                      <p className="text-xs text-zinc-500">{relativeTime(r.created_at)}</p>
                      {r.error_message && (
                        <p className="text-xs text-red-400 mt-0.5">{r.error_message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.amount_sat && <span className="text-sm font-medium text-orange-400">{formatSat(r.amount_sat)}</span>}
                      <Badge value={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'monitor' && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            {!monitorJob ? (
              <EmptyState message="Sin job de monitor activo" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge value={monitorJob.status} />
                  <span className="text-sm text-zinc-100">{monitorJob.status}</span>
                </div>
                {[
                  ['ID', monitorJob.id],
                  ['Último scan', formatDate(monitorJob.last_scan_at)],
                  ['Eventos encontrados', monitorJob.events_found ?? 0],
                  ['Creado', formatDate(monitorJob.created_at)],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{k}</span>
                    <span className="text-zinc-200">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'nwc' && (
          <div className="max-w-lg space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
                {c.nwc_status === 'active' ? (
                  <Wifi size={14} className="text-emerald-400" />
                ) : (
                  <WifiOff size={14} className="text-zinc-500" />
                )}
                Estado NWC
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <Badge value={c.nwc_status === 'active' ? 'active_nwc' : (c.nwc_status ?? 'unconfigured')} />
                <span className="text-xs text-zinc-500">
                  {c.reward_mode === 'zap' ? 'Modo Zap activo' : 'No aplica (no es modo zap)'}
                </span>
              </div>
              <Input
                label="Nueva NWC URI (opcional — rota la existente)"
                value={nwcUri}
                onChange={e => setNwcUri(e.target.value)}
                placeholder="nostr+walletconnect://pubkey?relay=wss://..."
              />
              <div className="mt-3">
                <Btn
                  variant="primary"
                  onClick={() => testNwc.mutate()}
                  disabled={testNwc.isPending}
                >
                  <Wifi size={13} />
                  {testNwc.isPending ? 'Testeando…' : nwcUri ? 'Testear y rotar NWC' : 'Testear NWC almacenada'}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action modal */}
      <Modal open={actionModal} onClose={() => setActionModal(false)} title="Registrar acción">
        <div className="space-y-4">
          <Input
            label="Nostr Pubkey *"
            value={actionForm.nostr_pubkey}
            onChange={e => setActionForm(p => ({ ...p, nostr_pubkey: e.target.value }))}
            placeholder="npub1... o hex"
          />
          <Select
            label="Tipo de acción *"
            value={actionForm.action_type}
            onChange={e => setActionForm(p => ({ ...p, action_type: e.target.value as ActionType }))}
          >
            {(['share_event', 'relay_post', 'refer_user', 'lightning_receive', 'engagement'] as const).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Input
            label="Event ID (opcional)"
            value={actionForm.event_id ?? ''}
            onChange={e => setActionForm(p => ({ ...p, event_id: e.target.value }))}
            placeholder="note1..."
          />
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setActionModal(false)}>Cancelar</Btn>
            <Btn
              variant="primary"
              disabled={!actionForm.nostr_pubkey || createAction.isPending}
              onClick={() => createAction.mutate()}
            >
              {createAction.isPending ? 'Registrando…' : 'Registrar'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Rule modal */}
      <Modal open={ruleModal} onClose={() => setRuleModal(false)} title="Nueva regla de detección">
        <div className="space-y-4">
          <Select
            label="Tipo de regla *"
            value={ruleForm.rule_type}
            onChange={e => setRuleForm(p => ({ ...p, rule_type: e.target.value as RuleType }))}
          >
            {(['keyword', 'hashtag', 'author', 'event_tag', 'relay'] as const).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Input
            label="Valor *"
            value={ruleForm.value}
            onChange={e => setRuleForm(p => ({ ...p, value: e.target.value }))}
            placeholder="bitcoin / #nostr / pubkey…"
          />
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setRuleModal(false)}>Cancelar</Btn>
            <Btn
              variant="primary"
              disabled={!ruleForm.value || createRule.isPending}
              onClick={() => createRule.mutate()}
            >
              {createRule.isPending ? 'Creando…' : 'Crear regla'}
            </Btn>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
