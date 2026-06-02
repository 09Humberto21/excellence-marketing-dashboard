import { cn } from '../lib/utils'

const variants: Record<string, string> = {
  // Campaign status
  draft: 'bg-zinc-700/50 text-zinc-300 border-zinc-600',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  paused: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  // Verification
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  verified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  // Reward
  processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/15 text-red-400 border-red-500/30',
  // NWC
  active_nwc: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  invalid: 'bg-red-500/15 text-red-400 border-red-500/30',
  unconfigured: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
  // Generic
  simulate: 'bg-zinc-700/50 text-zinc-300 border-zinc-600',
  zap: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  simulated: 'bg-zinc-700/50 text-zinc-300 border-zinc-600',
  pre_boarded_treasury: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  external_treasury: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
}

const labels: Record<string, string> = {
  nostr_promotion: 'Nostr Promo',
  referral_boost: 'Referral',
  airdrop: 'Airdrop',
  engagement: 'Engagement',
  lightning_reward: 'Lightning',
  keyword: 'Keyword',
  hashtag: 'Hashtag',
  event_reference: 'Event Ref',
  profile_match: 'Profile',
  simulate: 'Simular',
  zap: 'Zap',
  simulated: 'Simulado',
  pre_boarded_treasury: 'Pre-boarded',
  external_treasury: 'Externo',
  share_event: 'Share Event',
  relay_post: 'Relay Post',
  refer_user: 'Referral',
  lightning_receive: 'Lightning',
  active_nwc: 'Activo',
  unconfigured: 'No Config',
}

interface BadgeProps {
  value: string
  className?: string
}

export function Badge({ value, className }: BadgeProps) {
  // #region agent log
  if (value == null || typeof value !== 'string') {
    fetch('http://127.0.0.1:7274/ingest/1f570826-b3ad-457f-aeed-80c82123d2aa',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8a1f42'},body:JSON.stringify({sessionId:'8a1f42',location:'Badge.tsx:invalid-value',message:'Badge received invalid value',data:{value,valueType:typeof value},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
  const cls = variants[value] ?? 'bg-zinc-700/50 text-zinc-300 border-zinc-600'
  const label = labels[value] ?? value.replace(/_/g, ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        cls,
        className,
      )}
    >
      {label}
    </span>
  )
}
