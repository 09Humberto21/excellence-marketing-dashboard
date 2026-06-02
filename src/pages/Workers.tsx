import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Play, Sparkles, CheckCircle, Search, Coins } from 'lucide-react'
import { Layout, PageHeader, Btn, Card } from '../components/Layout'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/Toast'
import { workers, campaigns } from '../lib/api'
import type { CampaignOut } from '../lib/types'

const DEFAULT_RELAY_COUNT = 2

function WorkerCard({
  title,
  description,
  icon: Icon,
  step,
  children,
}: {
  title: string
  description: string
  icon: React.ElementType
  step?: number
  children: React.ReactNode
}) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
          <Icon size={18} className="text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {step != null && (
              <span className="mr-1.5 text-orange-400/80">Paso {step}.</span>
            )}
            {title}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

function ResultBlock({ data }: { data: unknown }) {
  if (!data) return null
  return (
    <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 overflow-auto max-h-64">
      <pre className="text-xs text-zinc-300 whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function relayCountForCampaign(campaign: CampaignOut): number {
  const configured = campaign.target_nostr_relays?.length ?? 0
  return configured > 0 ? configured : DEFAULT_RELAY_COUNT
}

function estimateScanSeconds(campaignList: CampaignOut[] | undefined, duration: number): number {
  const active = (campaignList ?? []).filter(c => c.status === 'active')
  if (!active.length) return 0
  return active.reduce((sum, c) => sum + relayCountForCampaign(c) * duration, 0)
}

export function Workers() {
  const { toast } = useToast()
  const [duration, setDuration] = useState(60)
  const [campaignId, setCampaignId] = useState('')
  const [candidateResult, setCandidateResult] = useState<unknown>(null)
  const [verifyResult, setVerifyResult] = useState<unknown>(null)
  const [rewardResult, setRewardResult] = useState<unknown>(null)
  const [scanResult, setScanResult] = useState<unknown>(null)

  const { data: campaignList } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaigns.list(),
    retry: 1,
  })

  const activeCount = useMemo(
    () => (campaignList ?? []).filter(c => c.status === 'active').length,
    [campaignList],
  )

  const estimatedScanSeconds = useMemo(
    () => estimateScanSeconds(campaignList, duration),
    [campaignList, duration],
  )

  const scan = useMutation({
    mutationFn: () => workers.scanActive(duration),
    onSuccess: (data) => {
      setScanResult(data)
      toast('success', `Scan completado — ${(data as { detections?: unknown[] })?.detections?.length ?? 0} detecciones`)
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast('error', e?.response?.data?.detail ?? 'Error en scan'),
  })

  const processCandidates = useMutation({
    mutationFn: () => workers.processCandidates(campaignId || undefined),
    onSuccess: (data) => {
      setCandidateResult(data)
      const counts = data as { analyzed_events?: number; decided_events?: number }
      toast(
        'success',
        `Candidatos procesados — ${counts.decided_events ?? 0} decididos (${counts.analyzed_events ?? 0} analizados)`,
      )
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast('error', e?.response?.data?.detail ?? 'Error procesando candidatos'),
  })

  const verify = useMutation({
    mutationFn: () => workers.verifyPending(campaignId || undefined),
    onSuccess: (data) => {
      setVerifyResult(data)
      toast('success', `Verificación completada — ${(data as { events?: unknown[] })?.events?.length ?? 0} eventos`)
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast('error', e?.response?.data?.detail ?? 'Error verificando'),
  })

  const processRewards = useMutation({
    mutationFn: () => workers.processRewards(campaignId || undefined),
    onSuccess: (data) => {
      setRewardResult(data)
      toast('success', `Rewards procesados — ${(data as { actions?: unknown[] })?.actions?.length ?? 0} acciones`)
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast('error', e?.response?.data?.detail ?? 'Error procesando rewards'),
  })

  return (
    <Layout>
      <PageHeader
        title="Workers internos"
        subtitle="Pipeline manual: scan → candidatos → verificar → rewards (requieren Admin API Key)"
      />

      <div className="space-y-4 max-w-2xl">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/40 p-4 text-xs text-zinc-400 space-y-2">
          <p>
            Ejecuta los pasos <strong className="text-zinc-300">en orden</strong>. Los posts detectados
            aparecen en <strong className="text-zinc-300">Detalle de campaña → Acciones</strong>, no en Monitor.
          </p>
          <p>
            Monitor muestra estado del worker y errores de relay. «Verificar» solo funciona después del paso
            de candidatos (IA + decisión).
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 mb-1 block">
            Campaña (pasos 2–4, opcional)
          </label>
          <select
            value={campaignId}
            onChange={e => setCampaignId(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500/60"
          >
            <option value="">Todas las campañas activas</option>
            {(campaignList ?? []).map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>
        </div>

        <WorkerCard
          step={1}
          title="Scan active campaigns"
          description="Escanea campañas activas en relays Nostr buscando posts con keywords/reglas"
          icon={Search}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">
                Duración por relay: {duration}s
              </label>
              <input
                type="range"
                min={1}
                max={300}
                value={duration}
                onChange={e => setDuration(+e.target.value)}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-0.5">
                <span>1s</span>
                <span>300s</span>
              </div>
            </div>
            {activeCount > 0 ? (
              <p className="text-xs text-zinc-500">
                Tiempo estimado:{' '}
                <strong className="text-zinc-300">~{estimatedScanSeconds}s</strong>
                {' '}({activeCount} campaña{activeCount !== 1 ? 's' : ''} activa
                {activeCount !== 1 ? 's' : ''} × relays × {duration}s). Publica en Nostr{' '}
                <em>durante</em> el scan.
              </p>
            ) : (
              <p className="text-xs text-amber-500/90">
                No hay campañas activas; el scan terminará de inmediato sin detecciones.
              </p>
            )}
            <Btn variant="primary" onClick={() => scan.mutate()} disabled={scan.isPending}>
              {scan.isPending ? (
                <>
                  <Spinner className="h-3 w-3" /> Escaneando… (~{estimatedScanSeconds || duration}s)
                </>
              ) : (
                <>
                  <Play size={13} /> Ejecutar scan
                </>
              )}
            </Btn>
            <ResultBlock data={scanResult} />
          </div>
        </WorkerCard>

        <WorkerCard
          step={2}
          title="Process pending candidates"
          description="Analiza eventos detectados con IA, aplica decisión (reply/zap/ignore) y genera respuestas"
          icon={Sparkles}
        >
          <div className="space-y-3">
            <Btn
              variant="primary"
              onClick={() => processCandidates.mutate()}
              disabled={processCandidates.isPending}
            >
              {processCandidates.isPending ? (
                <>
                  <Spinner className="h-3 w-3" /> Procesando candidatos…
                </>
              ) : (
                <>
                  <Sparkles size={13} /> Procesar candidatos
                </>
              )}
            </Btn>
            <ResultBlock data={candidateResult} />
          </div>
        </WorkerCard>

        <WorkerCard
          step={3}
          title="Verify pending events"
          description="Verifica eventos detectados que ya pasaron el paso de decisión"
          icon={CheckCircle}
        >
          <div className="space-y-3">
            <Btn variant="primary" onClick={() => verify.mutate()} disabled={verify.isPending}>
              {verify.isPending ? (
                <>
                  <Spinner className="h-3 w-3" /> Verificando…
                </>
              ) : (
                <>
                  <CheckCircle size={13} /> Verificar eventos
                </>
              )}
            </Btn>
            <ResultBlock data={verifyResult} />
          </div>
        </WorkerCard>

        <WorkerCard
          step={4}
          title="Process verified rewards"
          description="Procesa recompensas de acciones verificadas (NWC/zap o simulate)"
          icon={Coins}
        >
          <div className="space-y-3">
            <Btn
              variant="primary"
              onClick={() => processRewards.mutate()}
              disabled={processRewards.isPending}
            >
              {processRewards.isPending ? (
                <>
                  <Spinner className="h-3 w-3" /> Procesando…
                </>
              ) : (
                <>
                  <Coins size={13} /> Procesar rewards
                </>
              )}
            </Btn>
            <ResultBlock data={rewardResult} />
          </div>
        </WorkerCard>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-xs text-yellow-400">
            <strong>Nota:</strong> Todos estos endpoints requieren{' '}
            <code className="bg-yellow-500/10 px-1 rounded">X-Admin-Api-Key</code>.
            Configura la API key en <a href="/settings" className="underline">Configuración</a> si los
            requests fallan con 401/503.
          </p>
        </div>
      </div>
    </Layout>
  )
}
