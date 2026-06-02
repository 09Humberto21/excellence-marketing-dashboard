import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2 } from 'lucide-react'
import { Layout, PageHeader, Btn, Input, Select, Card } from '../components/Layout'
import { Modal } from '../components/Modal'
import { Badge } from '../components/Badge'
import { LoadingScreen, EmptyState } from '../components/Spinner'
import { useToast } from '../components/Toast'
import { companies } from '../lib/api'
import { formatDate } from '../lib/utils'

export function Companies() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState({ name: '', status: 'active' })

  const { data, isLoading } = useQuery({
    queryKey: ['companies', statusFilter],
    queryFn: () => companies.list(statusFilter || undefined),
    retry: 1,
  })

  const create = useMutation({
    mutationFn: () => companies.create({ name: form.name, status: form.status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] })
      setOpen(false)
      setForm({ name: '', status: 'active' })
      toast('success', 'Empresa creada')
    },
    onError: (e: any) => toast('error', e?.response?.data?.detail ?? 'Error al crear empresa'),
  })

  return (
    <Layout>
      <PageHeader
        title="Empresas"
        subtitle="Gestión de companies del sistema"
        action={
          <Btn variant="primary" onClick={() => setOpen(true)}>
            <Plus size={14} /> Nueva empresa
          </Btn>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </Select>
      </div>

      {isLoading ? (
        <LoadingScreen />
      ) : !data?.length ? (
        <EmptyState message="No hay empresas registradas" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(co => (
            <Card key={co.id} className="p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800">
                    <Building2 size={16} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{co.name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{co.id.slice(0, 8)}…</p>
                  </div>
                </div>
                <Badge value={co.status} />
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Creada {formatDate(co.created_at)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva empresa">
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Mi Empresa S.A."
          />
          <Select
            label="Estado"
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Btn>
            <Btn
              variant="primary"
              disabled={!form.name || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? 'Creando…' : 'Crear empresa'}
            </Btn>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
