from typing import TypedDict, Annotated, List, Optional
import operator


class UserProfile(TypedDict, total=False):
    capital_range: str
    payback_period: str
    format: str
    city: Optional[str]
    business_type: List[str]
    team_size: str
    experience: Optional[str]
    exclusions: Optional[str]
    tech_level: Optional[str]
    has_clients: bool
    has_premises: bool
    has_partners: bool
    risk_profile: Optional[str]
    is_main_income: Optional[bool]
    planning_horizon: Optional[str]
    # Enriched fields
    implied_segment: Optional[str]
    city_tier: Optional[str]
    experience_tags: Optional[List[str]]
    exclusion_tags: Optional[List[str]]


class Contradiction(TypedDict):
    field_a: str
    field_b: str
    description: str
    severity: str   # "blocking" | "warning"


class ChecklistResult(TypedDict):
    # Финансовый блок (0-40)
    capital_covers_startup: int
    payback_realistic: int
    fixed_costs_covered: int
    variable_costs_reasonable: int
    working_capital_exists: int
    # Рыночный блок (0-30)
    market_exists_in_city: int
    competition_manageable: int
    audience_large_enough: int
    market_trend_ok: int
    analogues_exist: int
    # Операционный блок (0-20)
    team_sufficient: int
    licenses_obtainable: int
    suppliers_available: int
    tech_level_match: int
    risk_profile_match: int
    # Локационный блок (0-10, для offline/hybrid)
    rent_affordable: int
    foot_traffic_available: int
    logistics_feasible: int
    infrastructure_ok: int
    # Стоп-факторы
    stop_factors: List[str]
    total_score: int
    verdict: str
    fail_reasons: List[str]


class IdeaCandidate(TypedDict, total=False):
    id: str
    title: str
    description: str
    relevance_explanation: str
    market_analogues: List[str]
    main_risk: str
    success_factor: str
    estimated_capital_min: int
    estimated_team_min: int
    requires_license: bool
    license_type: Optional[str]
    tagline: Optional[str]
    why_for_you: Optional[str]
    difficulty: Optional[str]
    trend: Optional[str]
    unique_angle: Optional[str]
    checklist: Optional[ChecklistResult]
    financial_score: int
    financial_verdict: str
    market_score: int
    market_verdict: str
    ops_score: int
    ops_verdict: str
    location_score: int
    location_verdict: str
    total_score: int
    all_flags: List[str]
    realism_warnings: List[str]


class OnboardingState(TypedDict):
    user_id: str
    profile: UserProfile
    profile_completeness: int
    errors: Annotated[List[str], operator.add]
    stage: str


class IdeaGenerationState(TypedDict):
    user_id: str
    session_id: str
    profile: UserProfile
    contradictions: List[Contradiction]
    idea_candidates: List[IdeaCandidate]
    all_flags: List[str]
    generation_warnings: List[str]
    errors: Annotated[List[str], operator.add]
    status: str


class FinancialModelState(TypedDict):
    user_id: str
    session_id: str
    idea: IdeaCandidate
    profile: UserProfile
    assumptions: dict
    scenarios: dict
    unit_economics: dict
    validation_warnings: List[str]
    user_adjustments: dict
    errors: Annotated[List[str], operator.add]
