import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronRight,
} from 'lucide-react'
import { Layout, PageHeader, Btn, Input, Select, Textarea } from '../components/Layout'
import { Modal } from '../components/Modal'
import { Badge } from '../components/Badge'
import { LoadingScreen, EmptyState } from '../components/Spinner'
import { useToast } from '../components/Toast'
import { campaigns, companies } from '../lib/api'
import { formatSat, formatDate, formatApiError } from '../lib/utils'
import type { CampaignCreate, CampaignOut, CampaignType, DetectionMode, FundingMode, RewardMode } from '../lib/types'

function defaultStartLocal(): string {
  return new Date().toISOString().slice(0, 16)
}

function defaultEndLocal(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 16)
}

const EMPTY_FORM: CampaignCreate = {
  name: '',
  description: '',
  company_id: '',
  campaign_type: 'nostr_promotion',
  detection_mode: 'keyword',
  reward_mode: 'simulate',
  funding_mode: 'simulated',
  budget_sat: 10_000,
  reward_per_action_sat: 100,
  max_actions_per_user: 1,
  start_at: defaultStartLocal(),
  end_at: defaultEndLocal(),
  target_keywords: [],
  comment_template: '',
  nwc_uri: '',
}

function buildCreatePayload(form: CampaignCreate): CampaignCreate {
  const payload: CampaignCreate = {
    name: form.name.trim(),
    description: form.description.trim() || '—',
    company_id: form.company_id,
    campaign_type: form.campaign_type,
    detection_mode: form.detection_mode,
    reward_mode: form.reward_mode,
    funding_mode: form.funding_mode,
    budget_sat: form.budget_sat,
    reward_per_action_sat: form.reward_per_action_sat,
    max_actions_per_user: form.max_actions_per_user,
    start_at: new Date(form.start_at).toISOString(),
    end_at: new Date(form.end_at).toISOString(),
  }
  if (form.campaign_type === 'nostr_promotion') {
    payload.target_keywords = form.target_keywords
    payload.comment_template = form.comment_template?.trim()
  }
  if (form.reward_mode === 'zap' && form.nwc_uri?.trim()) {
    payload.nwc_uri = form.nwc_uri.trim()
  }
  return payload
}

function CampaignCard({
  c,
  onAction,
}: {
  c: CampaignOut
  onAction: (action: string, id: string) => void
}) {
  const spent = c.spent_sat ?? 0
  const budget = c.budget_sat ?? 0
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${c.id}`}
            className="text-sm font-semibold text-zinc-100 hover:text-orange-400 transition-colors flex items-center gap-1"
          >
            {c.name}
            <ChevronRight size={12} className="text-zinc-500" />
          </Link>
          {c.description && (
            <p className="mt-0.5 text-xs text-zinc-500 truncate">{c.description}</p>
          )}
        </div>
        <Badge value={c.status} />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge value={c.campaign_type} />
        <Badge value={c.detection_mode} />
        <Badge value={c.reward_mode} />
        <Badge value={c.funding_mode} />
      </div>

      {/* Budget bar */}
      {budget > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Gastado</span>
            <span>{formatSat(spent)} / {formatSat(budget)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
        <span>{c.total_actions ?? 0} acciones</span>
        {c.reward_per_action_sat > 0 && <span>{formatSat(c.reward_per_action_sat)}/acción</span>}
        {c.max_actions_per_user > 0 && <span>max {c.max_actions_per_user}/usuario</span>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5">
        {c.status === 'draft' && (
          <Btn size="sm" variant="primary" onClick={() => onAction('activate', c.id)}>
            <Play size={11} /> Activar
          </Btn>
        )}
        {c.status === 'active' && (
          <Btn size="sm" variant="outline" onClick={() => onAction('pause', c.id)}>
            <Pause size={11} /> Pausar
          </Btn>
        )}
        {c.status === 'paused' && (
          <>
            <Btn size="sm" variant="primary" onClick={() => onAction('resume', c.id)}>
              <RotateCcw size={11} /> Reanudar
            </Btn>
            <Btn size="sm" variant="outline" onClick={() => onAction('complete', c.id)}>
              <CheckCircle size={11} /> Completar
            </Btn>
          </>
        )}
        {(c.status === 'active' || c.status === 'draft') && (
          <Btn size="sm" variant="outline" onClick={() => onAction('complete', c.id)}>
            <CheckCircle size={11} /> Completar
          </Btn>
        )}
        {c.status !== 'cancelled' && (
          <Btn size="sm" variant="danger" onClick={() => onAction('delete', c.id)}>
            <XCircle size={11} /> Cancelar
          </Btn>
        )}
        <Link to={`/campaigns/${c.id}`}>
          <Btn size="sm" variant="ghost">
            Ver detalle
          </Btn>
        </Link>
      </div>
    </div>
  )
}

export function Campaigns() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState<CampaignCreate>({ ...EMPTY_FORM })
  const [keywordInput, setKeywordInput] = useState('')

  const { data: companiesList } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companies.list(),
    retry: 1,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', statusFilter, typeFilter],
    queryFn: () =>
      campaigns.list({
        status: statusFilter || undefined,
        campaign_type: typeFilter || undefined,
      }),
    retry: 1,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['campaigns'] })

  const create = useMutation({
    mutationFn: () => campaigns.create(buildCreatePayload(form)),
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setForm({ ...EMPTY_FORM, start_at: defaultStartLocal(), end_at: defaultEndLocal() })
      toast('success', 'Campaña creada')
    },
    onError: (e: unknown) => toast('error', formatApiError(e, 'Error al crear campaña')),
  })

  const lifecycle = useMutation({
    mutationFn: ({ action, id }: { action: string; id: string }) => {
      const map: Record<string, (id: string) => Promise<any>> = {
        activate: campaigns.activate,
        pause: campaigns.pause,
        resume: campaigns.resume,
        complete: campaigns.complete,
        delete: campaigns.delete,
      }
      return map[action](id)
    },
    onSuccess: (_, { action }) => {
      invalidate()
      const labels: Record<string, string> = {
        activate: 'Campaña activada',
        pause: 'Campaña pausada',
        resume: 'Campaña reanudada',
        complete: 'Campaña completada',
        delete: 'Campaña cancelada',
      }
      toast('success', labels[action])
    },
    onError: (e: unknown) => toast('error', formatApiError(e, 'Error')),
  })

  const addKeyword = () => {
    if (!keywordInput.trim()) return
    setForm(p => ({ ...p, target_keywords: [...(p.target_keywords ?? []), keywordInput.trim()] }))
    setKeywordInput('')
  }

  const nostrPromotionValid =
    form.campaign_type !== 'nostr_promotion' ||
    ((form.target_keywords?.length ?? 0) > 0 && !!form.comment_template?.trim())

  return (
    <Layout>
      <PageHeader
        title="Campañas"
        subtitle="Gestión de campañas de marketing"
        action={
          <Btn variant="primary" onClick={() => setOpen(true)}>
            <Plus size={14} /> Nueva campaña
          </Btn>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {['draft', 'active', 'paused', 'completed', 'cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Todos los tipos</option>
          {['nostr_promotion', 'referral_boost', 'airdrop', 'engagement', 'lightning_reward'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <LoadingScreen />
      ) : !data?.length ? (
        <EmptyState message="No hay campañas con esos filtros" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map(c => (
            <CampaignCard
              key={c.id}
              c={c}
              onAction={(action, id) => lifecycle.mutate({ action, id })}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva campaña" size="lg">
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Mi campaña Nostr"
          />
          <Textarea
            label="Descripción"
            value={form.description ?? ''}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Descripción opcional"
            rows={2}
          />
          <Select
            label="Empresa *"
            value={form.company_id}
            onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}
          >
            <option value="">Selecciona empresa</option>
            {(companiesList ?? []).map(co => (
              <option key={co.id} value={co.id}>{co.name}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo *"
              value={form.campaign_type}
              onChange={e => setForm(p => ({ ...p, campaign_type: e.target.value as CampaignType }))}
            >
              {(['nostr_promotion', 'referral_boost', 'airdrop', 'engagement', 'lightning_reward'] as const).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Select
              label="Detección *"
              value={form.detection_mode}
              onChange={e => setForm(p => ({ ...p, detection_mode: e.target.value as DetectionMode }))}
            >
              {(['keyword', 'hashtag', 'event_reference', 'profile_match'] as const).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Select
              label="Reward mode *"
              value={form.reward_mode}
              onChange={e => setForm(p => ({ ...p, reward_mode: e.target.value as RewardMode }))}
            >
              <option value="simulate">simulate</option>
              <option value="zap">zap</option>
            </Select>
            <Select
              label="Funding mode *"
              value={form.funding_mode}
              onChange={e => setForm(p => ({ ...p, funding_mode: e.target.value as FundingMode }))}
            >
              {(['simulated', 'pre_boarded_treasury', 'external_treasury'] as const).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Inicio *"
              type="datetime-local"
              value={form.start_at}
              onChange={e => setForm(p => ({ ...p, start_at: e.target.value }))}
            />
            <Input
              label="Fin *"
              type="datetime-local"
              value={form.end_at}
              onChange={e => setForm(p => ({ ...p, end_at: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Presupuesto (sat) *"
              type="number"
              min={1000}
              value={form.budget_sat}
              onChange={e => setForm(p => ({ ...p, budget_sat: +e.target.value || 1000 }))}
              placeholder="10000"
            />
            <Input
              label="Reward por acción (sat) *"
              type="number"
              min={0}
              value={form.reward_per_action_sat}
              onChange={e => setForm(p => ({ ...p, reward_per_action_sat: +e.target.value || 0 }))}
              placeholder="100"
            />
            <Input
              label="Máx. acciones / usuario *"
              type="number"
              min={1}
              value={form.max_actions_per_user}
              onChange={e => setForm(p => ({ ...p, max_actions_per_user: +e.target.value || 1 }))}
              placeholder="1"
            />
          </div>

          {/* NWC URI for zap mode */}
          {form.reward_mode === 'zap' && (
            <Input
              label="NWC URI * (requerido para zap)"
              value={form.nwc_uri ?? ''}
              onChange={e => setForm(p => ({ ...p, nwc_uri: e.target.value }))}
              placeholder="nostr+walletconnect://pubkey?relay=wss://..."
            />
          )}

          {/* Target keywords */}
          {form.campaign_type === 'nostr_promotion' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">
                Target keywords * (requerido para nostr_promotion)
              </label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="bitcoin"
                />
                <Btn onClick={addKeyword} variant="outline" size="sm">+ Add</Btn>
              </div>
              {(form.target_keywords ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(form.target_keywords ?? []).map(k => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                    >
                      {k}
                      <button
                        className="text-zinc-500 hover:text-red-400"
                        onClick={() => setForm(p => ({ ...p, target_keywords: p.target_keywords?.filter(x => x !== k) }))}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {form.campaign_type === 'nostr_promotion' && (
            <Textarea
              label="Plantilla de comentario * (comment_template)"
              value={form.comment_template ?? ''}
              onChange={e => setForm(p => ({ ...p, comment_template: e.target.value }))}
              placeholder="¡Gracias por participar!"
              rows={2}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn
              variant="primary"
              disabled={
                !form.name ||
                !form.company_id ||
                !nostrPromotionValid ||
                (form.reward_mode === 'zap' && !form.nwc_uri?.trim()) ||
                create.isPending
              }
              onClick={() => create.mutate()}
            >
              {create.isPending ? 'Creando…' : 'Crear campaña'}
            </Btn>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
