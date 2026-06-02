export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatSat(sat?: number): string {
  if (sat == null) return '—'
  if (sat >= 100_000_000) return `${(sat / 100_000_000).toFixed(4)} BTC`
  if (sat >= 1_000) return `${(sat / 1_000).toFixed(1)}k sat`
  return `${sat} sat`
}

export function truncate(str: string, len = 12): string {
  if (str.length <= len) return str
  return str.slice(0, 6) + '…' + str.slice(-6)
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export const DEFAULT_CONFIG = {
  marketingBaseUrl: 'http://localhost:8006',
  adminBaseUrl: 'http://localhost:8010',
  adminApiKey: '',
}

export function getConfig() {
  try {
    const raw = localStorage.getItem('api_config')
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_CONFIG }
}

export function saveConfig(cfg: typeof DEFAULT_CONFIG) {
  localStorage.setItem('api_config', JSON.stringify(cfg))
}
