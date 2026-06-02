export type CampaignType = 'nostr_promotion' | 'referral_boost' | 'airdrop' | 'engagement' | 'lightning_reward'
export type DetectionMode = 'keyword' | 'hashtag' | 'event_reference' | 'profile_match'
export type RewardMode = 'simulate' | 'zap'
export type FundingMode = 'simulated' | 'pre_boarded_treasury' | 'external_treasury'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type RewardStatus = 'pending' | 'processing' | 'success' | 'failed'
export type ActionType = 'share_event' | 'relay_post' | 'refer_user' | 'lightning_receive' | 'engagement'
export type RuleType = 'keyword' | 'hashtag' | 'author' | 'event_tag' | 'relay'
export type NWCStatus = 'active' | 'invalid' | 'unconfigured'

export interface CompanyOut {
  id: string
  name: string
  status: string
  created_at: string
  updated_at?: string
}

export interface CompanyCreate {
  name: string
  status?: string
}

export interface CampaignOut {
  id: string
  name: string
  description: string
  company_id?: string | null
  campaign_type: CampaignType
  detection_mode: DetectionMode
  reward_mode: RewardMode
  funding_mode: FundingMode
  status: CampaignStatus
  budget_sat: number
  spent_sat: number
  reward_per_action_sat: number
  max_actions_per_user: number
  total_actions?: number
  target_keywords?: string[]
  comment_template?: string | null
  nwc_status?: NWCStatus
  start_at: string
  end_at: string
  created_at: string
}

export interface CampaignCreate {
  name: string
  description: string
  company_id: string
  campaign_type: CampaignType
  detection_mode: DetectionMode
  reward_mode: RewardMode
  funding_mode: FundingMode
  budget_sat: number
  reward_per_action_sat: number
  max_actions_per_user: number
  start_at: string
  end_at: string
  target_keywords?: string[]
  comment_template?: string
  nwc_uri?: string
}

export interface CampaignSummary extends CampaignOut {
  total_actions: number
  verified_actions: number
  total_rewards_sat: number
  recent_actions: CampaignActionOut[]
}

export interface PlatformCampaignsSummary {
  total_campaigns: number
  active_campaigns: number
  total_budget_allocated_sat?: number
  total_spent_sat?: number
}

export interface CampaignActionOut {
  id: string
  campaign_id: string
  nostr_pubkey: string
  action_type: ActionType
  verification_status: VerificationStatus
  reward_status: RewardStatus
  event_id?: string
  reward_sat?: number
  created_at: string
  verified_at?: string
}

export interface CampaignActionCreate {
  nostr_pubkey: string
  action_type: ActionType
  event_id?: string
}

export interface CampaignDetectionRuleOut {
  id: string
  campaign_id: string
  rule_type: RuleType
  value: string
  created_at: string
}

export interface CampaignDetectionRuleCreate {
  rule_type: RuleType
  value: string
}

export interface RelayMonitorJobOut {
  id: string
  campaign_id: string
  status: string
  last_scan_at?: string
  events_found?: number
  created_at: string
}

export interface RewardAttemptOut {
  id: string
  campaign_id: string
  action_id: string
  status: RewardStatus
  amount_sat?: number
  bolt11?: string
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface NWCTestResult {
  campaign_id: string
  wallet_pubkey: string
  methods: string[]
  nwc_status: NWCStatus
  last_validated_at: string
}

export interface AdminCampaignSummaryOut {
  id: string
  name: string
  status: CampaignStatus
  campaign_type: CampaignType
  total_budget_sat?: number
  total_spent_sat?: number
  actions_count?: number
}

export interface AdminCampaignsSummary {
  total_campaigns: number
  active_campaigns: number
  total_budget_allocated: number
  total_spent: number
  campaigns: AdminCampaignSummaryOut[]
}

export interface ReferrerStat {
  nostr_pubkey: string
  referral_count: number
  total_rewarded_sat: number
}

export interface ReferralsSummary {
  total_referrals: number
  total_rewarded_sat: number
  top_referrers: ReferrerStat[]
}

export interface ArkDepositAddress {
  address: string
  user_id?: string
  user_pubkey?: string
  amount_sat?: number
  campaign_id?: string
}

export interface ArkPaymentRequest {
  bolt11?: string
  amount_sat?: number
}

export interface ArkPaymentResponse {
  payment_id?: string
  status: string
  amount_sat?: number
  fee_sat?: number
  preimage?: string
}

export interface ApiConfig {
  marketingBaseUrl: string
  adminBaseUrl: string
  adminApiKey: string
}
