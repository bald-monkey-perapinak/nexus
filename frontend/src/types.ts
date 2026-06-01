export interface Contradiction {
  field_a: string
  field_b: string
  description: string
  severity: 'blocking' | 'warning'
}

export interface UserProfile {
  capital_range: string
  format: string
  business_type: string[]
  team_size: string
  payback_period?: string
  city?: string
  experience?: string
  exclusions?: string
  tech_level?: string
  risk_profile?: string
  is_main_income?: boolean
  planning_horizon?: string
  has_clients?: boolean
  has_premises?: boolean
  has_partners?: boolean
  // Enriched
  implied_segment?: string
  city_tier?: string
}

export interface IdeaCard {
  id: string
  title: string
  description: string
  relevance_explanation: string
  main_risk: string
  success_factor: string
  market_analogues: string[]
  tagline?: string
  why_for_you?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  trend?: 'growing' | 'stable' | 'declining'
  unique_angle?: string
  total_score: number
  all_flags: string[]
  realism_warnings?: string[]
  financial_verdict: string
  market_verdict: string
  ops_verdict: string
  location_verdict?: string
  financial_score?: number
  market_score?: number
  ops_score?: number
  location_score?: number
  is_online?: boolean
}

export interface FinancialScenario {
  monthly_revenue: number
  monthly_variable_costs: number
  monthly_fixed_costs: number
  monthly_profit: number
  breakeven_clients: number
  payback_months: number | null
}

export interface FinancialModel {
  assumptions: {
    avg_check_rub: number
    monthly_clients_base: number
    monthly_clients_mature: number
    fixed_costs_monthly: { total: number; [k: string]: number }
    variable_cost_pct: number
    startup_costs: { total: number; [k: string]: number }
    assumptions_notes?: string
  }
  scenarios: {
    pessimistic: FinancialScenario
    base: FinancialScenario
    optimistic: FinancialScenario
  }
  unit_economics: {
    cac_rub: number
    ltv_rub: number
    ltv_cac_ratio: number
    ltv_cac_verdict: string
    margin_pct: number
  }
  validation_warnings: string[]
  user_adjustments: object
}

export type AppScreen =
  | 'splash'
  | 'onboarding'
  | 'generating'
  | 'ideas'
  | 'idea_detail'
  | 'financial'
  | 'dashboard'
