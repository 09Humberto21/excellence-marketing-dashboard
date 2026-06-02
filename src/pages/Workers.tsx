import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Play, Cpu, CheckCircle, Search, Coins } from 'lucide-react'
import { Layout, PageHeader, Btn, Input, Card } from '../components/Layout'
import { Spinner } from '../components/Spinner'
import { useToast } from '../components/Toast'
import { workers, campaigns } from '../lib/api'

function WorkerCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
          <Icon size={18} className="text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
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

export function Workers() {
  const { toast } = useToast()
  const [duration, setDuration] = useState(60)
  const [scanCampaignId, setScanCampaignId] = useState('')
  const [verifyResult, setVerifyResult] = useState<unknown>(null)
  const [rewardResult, setRewardResult] = useState<unknown>(null)
  const [scanResult, setScanResult] = useState<unknown>(null)

  const { data: campaignList } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaigns.list(),
    retry: 1,
  })

  const scan = useMutation({
    mutationFn: () => workers.scanActive(duration),
    onSuccess: (data) => {
      setScanResult(data)
      toast('success', `Scan completado — ${(data as any)?.detections?.length ?? 0} detecciones`)
    },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error en scan'),
  })

  const verify = useMutation({
    mutationFn: () => workers.verifyPending(scanCampaignId || undefined),
    onSuccess: (data) => {
      setVerifyResult(data)
      toast('success', `Verificación completada — ${(data as any)?.events?.length ?? 0} eventos`)
    },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error verificando'),
  })

  const processRewards = useMutation({
    mutationFn: () => workers.processRewards(scanCampaignId || undefined),
    onSuccess: (data) => {
      setRewardResult(data)
      toast('success', `Rewards procesados — ${(data as any)?.actions?.length ?? 0} acciones`)
    },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error procesando rewards'),
  })

  return (
    <Layout>
      <PageHeader
        title="Workers internos"
        subtitle="Herramientas para disparar workers manualmente (requieren Admin API Key)"
      />

      <div className="space-y-4 max-w-2xl">
        {/* Scan active campaigns */}
        <WorkerCard
          title="Scan active campaigns"
          description="Escanea campañas activas en los relays buscando eventos que coincidan con las reglas de detección"
          icon={Search}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">
                Duración (segundos): {duration}s
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
                <span>1s</span><span>300s</span>
              </div>
            </div>
            <Btn
              variant="primary"
              onClick={() => scan.mutate()}
              disabled={scan.isPending}
            >
              {scan.isPending ? <><Spinner className="h-3 w-3" /> Escaneando…</> : <><Play size={13} /> Ejecutar scan</>}
            </Btn>
            <ResultBlock data={scanResult} />
          </div>
        </WorkerCard>

        {/* Verify pending events */}
        <WorkerCard
          title="Verify pending events"
          description="Verifica los eventos pendientes contra las reglas de detección de las campañas"
          icon={CheckCircle}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1 block">
                Campaign ID (opcional — filtra por campaña)
              </label>
              <select
                value={scanCampaignId}
                onChange={e => setScanCampaignId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500/60"
              >
                <option value="">Todas las campañas</option>
                {(campaignList ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Btn
              variant="primary"
              onClick={() => verify.mutate()}
              disabled={verify.isPending}
            >
              {verify.isPending ? <><Spinner className="h-3 w-3" /> Verificando…</> : <><CheckCircle size={13} /> Verificar eventos</>}
            </Btn>
            <ResultBlock data={verifyResult} />
          </div>
        </WorkerCard>

        {/* Process verified rewards */}
        <WorkerCard
          title="Process verified rewards"
          description="Procesa las recompensas de acciones ya verificadas — dispara los pagos vía NWC/zap"
          icon={Coins}
        >
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              Usa el mismo filtro de Campaign ID seleccionado arriba
            </p>
            <Btn
              variant="primary"
              onClick={() => processRewards.mutate()}
              disabled={processRewards.isPending}
            >
              {processRewards.isPending ? <><Spinner className="h-3 w-3" /> Procesando…</> : <><Coins size={13} /> Procesar rewards</>}
            </Btn>
            <ResultBlock data={rewardResult} />
          </div>
        </WorkerCard>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-xs text-yellow-400">
            <strong>Nota:</strong> Todos estos endpoints requieren <code className="bg-yellow-500/10 px-1 rounded">X-Admin-Api-Key</code>.
            Configura la API key en <a href="/settings" className="underline">Configuración</a> si los requests fallan con 401/503.
          </p>
        </div>
      </div>
    </Layout>
  )
}
