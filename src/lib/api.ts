import axios, { AxiosInstance } from 'axios'
import { getConfig } from './utils'
import type {
  AdminCampaignsSummary,
  ArkDepositAddress,
  ArkPaymentRequest,
  ArkPaymentResponse,
  CampaignActionCreate,
  CampaignActionOut,
  CampaignCreate,
  CampaignDetectionRuleCreate,
  CampaignDetectionRuleOut,
  CampaignOut,
  CampaignSummary,
  CompanyCreate,
  CompanyOut,
  NWCTestResult,
  PlatformCampaignsSummary,
  ReferralsSummary,
  RelayMonitorJobOut,
  RewardAttemptOut,
} from './types'

function makeClient(base: string, apiKey: string): AxiosInstance {
  const c = axios.create({ baseURL: base })
  if (apiKey) {
    c.defaults.headers.common['X-Admin-Api-Key'] = apiKey
    c.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`
  }
  return c
}

let _mkt: AxiosInstance
let _adm: AxiosInstance

function mkt(): AxiosInstance {
  const cfg = getConfig()
  if (!_mkt || _mkt.defaults.baseURL !== cfg.marketingBaseUrl) {
    _mkt = makeClient(cfg.marketingBaseUrl, cfg.adminApiKey)
  }
  return _mkt
}

function adm(): AxiosInstance {
  const cfg = getConfig()
  if (!_adm || _adm.defaults.baseURL !== cfg.adminBaseUrl) {
    _adm = makeClient(cfg.adminBaseUrl, cfg.adminApiKey)
  }
  return _adm
}

export function invalidateClients() {
  _mkt = undefined as any
  _adm = undefined as any
}

// ─── Health ──────────────────────────────────────────────────────────────────

export const health = {
  marketing: () => mkt().get<{ status: string }>('/health').then(r => r.data),
  admin: () => adm().get<{ status: string }>('/health').then(r => r.data),
}

// ─── Companies ───────────────────────────────────────────────────────────────

export const companies = {
  list: (status?: string) =>
    mkt().get<CompanyOut[]>('/companies', { params: { status } }).then(r => r.data),
  create: (body: CompanyCreate) =>
    mkt().post<CompanyOut>('/companies', body).then(r => r.data),
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export const campaigns = {
  list: (params?: { status?: string; campaign_type?: string }) =>
    mkt().get<CampaignOut[]>('/campaigns', { params }).then(r => r.data),
  create: (body: CampaignCreate) =>
    mkt().post<CampaignOut>('/campaigns', body).then(r => r.data),
  get: (id: string) =>
    mkt().get<CampaignOut>(`/campaigns/${id}`).then(r => r.data),
  update: (id: string, body: Partial<CampaignCreate>) =>
    mkt().put<CampaignOut>(`/campaigns/${id}`, body).then(r => r.data),
  delete: (id: string) =>
    mkt().delete(`/campaigns/${id}`).then(r => r.data),
  activate: (id: string) =>
    mkt().post(`/campaigns/${id}/activate`).then(r => r.data),
  pause: (id: string) =>
    mkt().post(`/campaigns/${id}/pause`).then(r => r.data),
  resume: (id: string) =>
    mkt().post(`/campaigns/${id}/resume`).then(r => r.data),
  complete: (id: string) =>
    mkt().post(`/campaigns/${id}/complete`).then(r => r.data),
  testNwc: (id: string, nwc_uri?: string) =>
    mkt()
      .post<NWCTestResult>(`/campaigns/${id}/test-nwc`, nwc_uri ? { nwc_uri } : undefined)
      .then(r => r.data),
  platformSummary: () =>
    mkt().get<PlatformCampaignsSummary>('/platform/campaigns/summary').then(r => r.data),
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export const actions = {
  list: (campaignId: string, params?: { verification_status?: string; reward_status?: string }) =>
    mkt()
      .get<CampaignActionOut[]>(`/campaigns/${campaignId}/actions`, { params })
      .then(r => r.data),
  create: (campaignId: string, body: CampaignActionCreate) =>
    mkt().post<CampaignActionOut>(`/campaigns/${campaignId}/actions`, body).then(r => r.data),
  verify: (actionId: string) =>
    mkt().post<CampaignActionOut>(`/actions/${actionId}/verify`).then(r => r.data),
  byParticipant: (nostrPubkey: string, campaignId?: string) =>
    mkt()
      .get<CampaignActionOut[]>(`/participants/${nostrPubkey}/campaign-actions`, {
        params: { campaign_id: campaignId },
      })
      .then(r => r.data),
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export const rewards = {
  list: (campaignId: string, status?: string) =>
    mkt()
      .get<RewardAttemptOut[]>(`/campaigns/${campaignId}/rewards`, { params: { status } })
      .then(r => r.data),
}

// ─── Detection Rules ─────────────────────────────────────────────────────────

export const detectionRules = {
  list: (campaignId: string) =>
    mkt().get<CampaignDetectionRuleOut[]>(`/campaigns/${campaignId}/detection-rules`).then(r => r.data),
  create: (campaignId: string, body: CampaignDetectionRuleCreate) =>
    mkt()
      .post<CampaignDetectionRuleOut>(`/campaigns/${campaignId}/detection-rules`, body)
      .then(r => r.data),
  monitorJob: (campaignId: string) =>
    mkt().get<RelayMonitorJobOut>(`/campaigns/${campaignId}/monitor-job`).then(r => r.data),
}

// ─── Internal Workers ────────────────────────────────────────────────────────

export const workers = {
  scanActive: (duration_seconds = 60) =>
    mkt()
      .post('/internal/workers/scan-active-campaigns', null, { params: { duration_seconds } })
      .then(r => r.data),
  processCandidates: (campaign_id?: string) =>
    mkt()
      .post('/internal/workers/process-pending-candidates', null, { params: { campaign_id } })
      .then(r => r.data),
  verifyPending: (campaign_id?: string) =>
    mkt()
      .post('/internal/workers/verify-pending-events', null, { params: { campaign_id } })
      .then(r => r.data),
  processRewards: (campaign_id?: string) =>
    mkt()
      .post('/internal/workers/process-verified-rewards', null, { params: { campaign_id } })
      .then(r => r.data),
}

// ─── Ark ─────────────────────────────────────────────────────────────────────

export const ark = {
  board: (params: { user_id: string; user_pubkey: string; amount_sat: number; campaign_id?: string }) =>
    mkt().post<ArkDepositAddress>('/ark/board', null, { params }).then(r => r.data),
  pay: (params: { user_id: string; user_pubkey: string }, body: ArkPaymentRequest) =>
    mkt().post<ArkPaymentResponse>('/ark/pay', body, { params }).then(r => r.data),
  receive: (user_pubkey: string, body: ArkPaymentRequest) =>
    mkt().post<ArkPaymentResponse>('/ark/receive', body, { params: { user_pubkey } }).then(r => r.data),
  vtxos: (user_pubkey: string) =>
    mkt().get('/ark/vtxos', { params: { user_pubkey } }).then(r => r.data),
  offboard: (user_pubkey: string, destination_address: string, vtxo_keys?: string[]) =>
    mkt()
      .post('/ark/offboard', { vtxo_keys }, { params: { user_pubkey, destination_address } })
      .then(r => r.data),
  emergencyExit: (user_pubkey: string) =>
    mkt().post('/ark/emergency-exit', null, { params: { user_pubkey } }).then(r => r.data),
  round: () => mkt().get('/ark/round').then(r => r.data),
  info: () => mkt().get('/ark/info').then(r => r.data),
  processDeposit: (deposit_id: string) =>
    mkt().post(`/ark/deposits/${deposit_id}/process`).then(r => r.data),
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  campaignsSummary: () =>
    adm().get<AdminCampaignsSummary>('/campaigns/summary').then(r => r.data),
  referralsSummary: (limit = 10) =>
    adm().get<ReferralsSummary>('/referrals/summary', { params: { limit } }).then(r => r.data),
}
