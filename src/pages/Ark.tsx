import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Zap, ArrowUpRight, ArrowDownLeft, Info, Layers, LogOut, AlertTriangle } from 'lucide-react'
import { Layout, PageHeader, Btn, Input, Card } from '../components/Layout'
import { Spinner, EmptyState } from '../components/Spinner'
import { useToast } from '../components/Toast'
import { ark } from '../lib/api'
import { formatSat } from '../lib/utils'

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-4">
        <Icon size={15} className="text-orange-400" />
        {title}
      </h3>
      {children}
    </Card>
  )
}

function ResultBlock({ data }: { data: unknown }) {
  if (!data) return null
  return (
    <div className="mt-3 rounded-lg bg-zinc-950 border border-zinc-800 p-3 overflow-auto max-h-48">
      <pre className="text-xs text-zinc-300 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export function Ark() {
  const { toast } = useToast()

  // Board
  const [boardForm, setBoardForm] = useState({ user_id: '', user_pubkey: '', amount_sat: '', campaign_id: '' })
  const [boardResult, setBoardResult] = useState<unknown>(null)

  // Pay
  const [payForm, setPayForm] = useState({ user_id: '', user_pubkey: '', bolt11: '' })
  const [payResult, setPayResult] = useState<unknown>(null)

  // Receive
  const [rcvForm, setRcvForm] = useState({ user_pubkey: '', amount_sat: '' })
  const [rcvResult, setRcvResult] = useState<unknown>(null)

  // VTXOs
  const [vtxoPubkey, setVtxoPubkey] = useState('')
  const [vtxoResult, setVtxoResult] = useState<unknown>(null)

  // Offboard
  const [offForm, setOffForm] = useState({ user_pubkey: '', destination_address: '' })
  const [offResult, setOffResult] = useState<unknown>(null)

  // Emergency exit
  const [exitPubkey, setExitPubkey] = useState('')

  // Round / Info
  const arkInfo = useQuery({ queryKey: ['ark-info'], queryFn: ark.info, retry: 1 })
  const arkRound = useQuery({ queryKey: ['ark-round'], queryFn: ark.round, retry: 1 })

  const board = useMutation({
    mutationFn: () => ark.board({
      user_id: boardForm.user_id,
      user_pubkey: boardForm.user_pubkey,
      amount_sat: +boardForm.amount_sat,
      campaign_id: boardForm.campaign_id || undefined,
    }),
    onSuccess: (d) => { setBoardResult(d); toast('success', 'Dirección de depósito generada') },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error en board'),
  })

  const pay = useMutation({
    mutationFn: () => ark.pay(
      { user_id: payForm.user_id, user_pubkey: payForm.user_pubkey },
      { bolt11: payForm.bolt11 },
    ),
    onSuccess: (d) => { setPayResult(d); toast('success', 'Pago enviado') },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error en pay'),
  })

  const receive = useMutation({
    mutationFn: () => ark.receive(rcvForm.user_pubkey, { amount_sat: +rcvForm.amount_sat }),
    onSuccess: (d) => { setRcvResult(d); toast('success', 'Recibido') },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error en receive'),
  })

  const getVtxos = useMutation({
    mutationFn: () => ark.vtxos(vtxoPubkey),
    onSuccess: (d) => setVtxoResult(d),
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error obteniendo VTXOs'),
  })

  const offboard = useMutation({
    mutationFn: () => ark.offboard(offForm.user_pubkey, offForm.destination_address),
    onSuccess: (d) => { setOffResult(d); toast('success', 'Offboard iniciado') },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error en offboard'),
  })

  const emergencyExit = useMutation({
    mutationFn: () => ark.emergencyExit(exitPubkey),
    onSuccess: () => toast('success', 'Emergency exit iniciado'),
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error en emergency exit'),
  })

  return (
    <Layout>
      <PageHeader
        title="Ark / Lightning"
        subtitle="Integración Ark — nota: reward_mode=ark_lightning está bloqueado en MVP"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ark Info */}
        <Section title="Ark Info" icon={Info}>
          <div className="space-y-1">
            {arkInfo.isLoading ? <Spinner className="h-4 w-4 text-orange-400" /> :
              arkInfo.error ? <p className="text-xs text-red-400">No disponible</p> :
              <ResultBlock data={arkInfo.data} />
            }
          </div>
        </Section>

        {/* Ark Round */}
        <Section title="Round actual" icon={Layers}>
          {arkRound.isLoading ? <Spinner className="h-4 w-4 text-orange-400" /> :
            arkRound.error ? <p className="text-xs text-red-400">No disponible</p> :
            <ResultBlock data={arkRound.data} />
          }
        </Section>

        {/* Board */}
        <Section title="Board (Crear depósito)" icon={ArrowDownLeft}>
          <div className="space-y-3">
            <Input label="User ID *" value={boardForm.user_id}
              onChange={e => setBoardForm(p => ({ ...p, user_id: e.target.value }))}
              placeholder="user-uuid" />
            <Input label="User Pubkey *" value={boardForm.user_pubkey}
              onChange={e => setBoardForm(p => ({ ...p, user_pubkey: e.target.value }))}
              placeholder="hex pubkey" />
            <Input label="Monto (sat) *" type="number" value={boardForm.amount_sat}
              onChange={e => setBoardForm(p => ({ ...p, amount_sat: e.target.value }))}
              placeholder="10000" />
            <Input label="Campaign ID (opcional)" value={boardForm.campaign_id}
              onChange={e => setBoardForm(p => ({ ...p, campaign_id: e.target.value }))}
              placeholder="uuid" />
            <Btn variant="primary" disabled={!boardForm.user_id || !boardForm.user_pubkey || !boardForm.amount_sat || board.isPending}
              onClick={() => board.mutate()}>
              {board.isPending ? <><Spinner className="h-3 w-3" /> Generando…</> : <><ArrowDownLeft size={13} /> Generar dirección</>}
            </Btn>
            <ResultBlock data={boardResult} />
          </div>
        </Section>

        {/* Pay */}
        <Section title="Pay (Enviar pago)" icon={ArrowUpRight}>
          <div className="space-y-3">
            <Input label="User ID *" value={payForm.user_id}
              onChange={e => setPayForm(p => ({ ...p, user_id: e.target.value }))}
              placeholder="user-uuid" />
            <Input label="User Pubkey *" value={payForm.user_pubkey}
              onChange={e => setPayForm(p => ({ ...p, user_pubkey: e.target.value }))}
              placeholder="hex pubkey" />
            <Input label="BOLT11 invoice *" value={payForm.bolt11}
              onChange={e => setPayForm(p => ({ ...p, bolt11: e.target.value }))}
              placeholder="lnbc..." />
            <Btn variant="primary" disabled={!payForm.user_id || !payForm.user_pubkey || !payForm.bolt11 || pay.isPending}
              onClick={() => pay.mutate()}>
              {pay.isPending ? <><Spinner className="h-3 w-3" /> Pagando…</> : <><Zap size={13} /> Pagar</>}
            </Btn>
            <ResultBlock data={payResult} />
          </div>
        </Section>

        {/* Receive */}
        <Section title="Receive (Recibir)" icon={ArrowDownLeft}>
          <div className="space-y-3">
            <Input label="User Pubkey *" value={rcvForm.user_pubkey}
              onChange={e => setRcvForm(p => ({ ...p, user_pubkey: e.target.value }))}
              placeholder="hex pubkey" />
            <Input label="Monto (sat)" type="number" value={rcvForm.amount_sat}
              onChange={e => setRcvForm(p => ({ ...p, amount_sat: e.target.value }))}
              placeholder="1000" />
            <Btn variant="primary" disabled={!rcvForm.user_pubkey || receive.isPending}
              onClick={() => receive.mutate()}>
              {receive.isPending ? <><Spinner className="h-3 w-3" /> …</> : <><ArrowDownLeft size={13} /> Receive</>}
            </Btn>
            <ResultBlock data={rcvResult} />
          </div>
        </Section>

        {/* VTXOs */}
        <Section title="VTXOs" icon={Layers}>
          <div className="space-y-3">
            <Input label="User Pubkey *" value={vtxoPubkey}
              onChange={e => setVtxoPubkey(e.target.value)}
              placeholder="hex pubkey" />
            <Btn variant="primary" disabled={!vtxoPubkey || getVtxos.isPending}
              onClick={() => getVtxos.mutate()}>
              {getVtxos.isPending ? <Spinner className="h-3 w-3" /> : 'Consultar VTXOs'}
            </Btn>
            <ResultBlock data={vtxoResult} />
          </div>
        </Section>

        {/* Offboard */}
        <Section title="Offboard" icon={LogOut}>
          <div className="space-y-3">
            <Input label="User Pubkey *" value={offForm.user_pubkey}
              onChange={e => setOffForm(p => ({ ...p, user_pubkey: e.target.value }))}
              placeholder="hex pubkey" />
            <Input label="Destination address *" value={offForm.destination_address}
              onChange={e => setOffForm(p => ({ ...p, destination_address: e.target.value }))}
              placeholder="bc1q..." />
            <Btn variant="outline" disabled={!offForm.user_pubkey || !offForm.destination_address || offboard.isPending}
              onClick={() => offboard.mutate()}>
              {offboard.isPending ? <Spinner className="h-3 w-3" /> : 'Iniciar offboard'}
            </Btn>
            <ResultBlock data={offResult} />
          </div>
        </Section>

        {/* Emergency exit */}
        <Section title="Emergency Exit" icon={AlertTriangle}>
          <div className="space-y-3">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
              <p className="text-xs text-red-400">
                Acción irreversible — usar solo en emergencias para recuperar fondos unilateralmente.
              </p>
            </div>
            <Input label="User Pubkey *" value={exitPubkey}
              onChange={e => setExitPubkey(e.target.value)}
              placeholder="hex pubkey" />
            <Btn variant="danger" disabled={!exitPubkey || emergencyExit.isPending}
              onClick={() => {
                if (confirm('¿Confirmar emergency exit? Esta acción es irreversible.')) {
                  emergencyExit.mutate()
                }
              }}>
              {emergencyExit.isPending ? <Spinner className="h-3 w-3" /> : <><AlertTriangle size={13} /> Emergency Exit</>}
            </Btn>
          </div>
        </Section>
      </div>
    </Layout>
  )
}
