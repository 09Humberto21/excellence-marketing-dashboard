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
import { formatSat, formatDate } from '../lib/utils'
import type { CampaignCreate, CampaignOut, CampaignType, DetectionMode, FundingMode, RewardMode } from '../lib/types'

const EMPTY_FORM: CampaignCreate = {
  name: '',
  description: '',
  company_id: '',
  campaign_type: 'nostr_promotion',
  detection_mode: 'keyword',
  reward_mode: 'simulate',
  funding_mode: 'simulated',
  total_budget_sat: undefined,
  reward_per_action_sat: undefined,
  max_actions: undefined,
  target_keywords: [],
  comment_templates: [],
  nwc_uri: '',
}

function CampaignCard({
  c,
  onAction,
}: {
  c: CampaignOut
  onAction: (action: string, id: string) => void
}) {
  const spent = c.total_spent_sat ?? 0
  const budget = c.total_budget_sat ?? 0
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
        <span>{c.actions_count ?? 0} acciones</span>
        {c.reward_per_action_sat && <span>{formatSat(c.reward_per_action_sat)}/acción</span>}
        {c.max_actions && <span>max {c.max_actions}</span>}
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
  const [templateInput, setTemplateInput] = useState('')

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
    mutationFn: () => {
      const body: CampaignCreate = { ...form }
      if (!body.nwc_uri) delete body.nwc_uri
      if (!body.description) delete body.description
      if (!body.total_budget_sat) delete body.total_budget_sat
      if (!body.reward_per_action_sat) delete body.reward_per_action_sat
      if (!body.max_actions) delete body.max_actions
      if (!body.target_keywords?.length) delete body.target_keywords
      if (!body.comment_templates?.length) delete body.comment_templates
      return campaigns.create(body)
    },
    onSuccess: () => {
      invalidate()
      setOpen(false)
      setForm({ ...EMPTY_FORM })
      toast('success', 'Campaña creada')
    },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error al crear campaña'),
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
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error'),
  })

  const addKeyword = () => {
    if (!keywordInput.trim()) return
    setForm(p => ({ ...p, target_keywords: [...(p.target_keywords ?? []), keywordInput.trim()] }))
    setKeywordInput('')
  }

  const addTemplate = () => {
    if (!templateInput.trim()) return
    setForm(p => ({ ...p, comment_templates: [...(p.comment_templates ?? []), templateInput.trim()] }))
    setTemplateInput('')
  }

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

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Presupuesto (sat)"
              type="number"
              value={form.total_budget_sat ?? ''}
              onChange={e => setForm(p => ({ ...p, total_budget_sat: e.target.value ? +e.target.value : undefined }))}
              placeholder="100000"
            />
            <Input
              label="Reward por acción (sat)"
              type="number"
              value={form.reward_per_action_sat ?? ''}
              onChange={e => setForm(p => ({ ...p, reward_per_action_sat: e.target.value ? +e.target.value : undefined }))}
              placeholder="1000"
            />
            <Input
              label="Máx. acciones"
              type="number"
              value={form.max_actions ?? ''}
              onChange={e => setForm(p => ({ ...p, max_actions: e.target.value ? +e.target.value : undefined }))}
              placeholder="100"
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

          {/* Comment templates */}
          {form.campaign_type === 'nostr_promotion' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">
                Comment templates * (requerido para nostr_promotion)
              </label>
              <div className="flex gap-2">
                <Input
                  value={templateInput}
                  onChange={e => setTemplateInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTemplate())}
                  placeholder="¡Gran post sobre Bitcoin!"
                />
                <Btn onClick={addTemplate} variant="outline" size="sm">+ Add</Btn>
              </div>
              {(form.comment_templates ?? []).length > 0 && (
                <div className="flex flex-col gap-1">
                  {(form.comment_templates ?? []).map((t, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2">
                      <span className="flex-1 text-xs text-zinc-300">{t}</span>
                      <button
                        className="text-zinc-500 hover:text-red-400"
                        onClick={() => setForm(p => ({ ...p, comment_templates: p.comment_templates?.filter((_, j) => j !== i) }))}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
            <Btn
              variant="primary"
              disabled={!form.name || !form.company_id || create.isPending}
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
