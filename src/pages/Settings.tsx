import { useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { Layout, PageHeader, Card, Btn, Input } from '../components/Layout'
import { useToast } from '../components/Toast'
import { getConfig, saveConfig, DEFAULT_CONFIG } from '../lib/utils'
import { invalidateClients } from '../lib/api'

export function Settings() {
  const { toast } = useToast()
  const [cfg, setCfg] = useState(() => getConfig())

  const save = () => {
    saveConfig(cfg)
    invalidateClients()
    toast('success', 'Configuración guardada')
  }

  const reset = () => {
    setCfg({ ...DEFAULT_CONFIG })
  }

  return (
    <Layout>
      <PageHeader
        title="Configuración"
        subtitle="URLs de la API y credenciales de administrador"
      />
      <Card className="max-w-xl p-5 space-y-4">
        <Input
          label="Marketing API (puerto 8006)"
          value={cfg.marketingBaseUrl}
          onChange={e => setCfg(p => ({ ...p, marketingBaseUrl: e.target.value }))}
          placeholder="http://localhost:8006"
        />
        <Input
          label="Admin API (puerto 8010)"
          value={cfg.adminBaseUrl}
          onChange={e => setCfg(p => ({ ...p, adminBaseUrl: e.target.value }))}
          placeholder="http://localhost:8010"
        />
        <Input
          label="Admin API Key (X-Admin-Api-Key)"
          type="password"
          value={cfg.adminApiKey}
          onChange={e => setCfg(p => ({ ...p, adminApiKey: e.target.value }))}
          placeholder="tu-api-key-secreta"
        />
        <div className="flex gap-2 pt-1">
          <Btn variant="primary" onClick={save}>
            <Save size={14} /> Guardar
          </Btn>
          <Btn variant="ghost" onClick={reset}>
            <RefreshCw size={14} /> Defaults
          </Btn>
        </div>
        <p className="text-xs text-zinc-500">
          En <code className="text-zinc-400">env_profile=local</code> sin API Key, el acceso admin
          queda abierto automáticamente.
        </p>
      </Card>
    </Layout>
  )
}
