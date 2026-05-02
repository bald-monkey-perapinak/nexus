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


class IdeaCandidate(TypedDict, total=False):
    id: str
    title: str
    description: str
    relevance_explanation: str
    market_analogues: List[str]
    main_risk: str
    success_factor: str
    tagline: Optional[str]
    why_for_you: Optional[str]
    difficulty: Optional[str]
    trend: Optional[str]
    unique_angle: Optional[str]
    # Discriminator scores
    financial_score: int
    financial_verdict: str
    financial_flags: List[str]
    market_score: int
    market_verdict: str
    market_flags: List[str]
    ops_score: int
    ops_verdict: str
    ops_flags: List[str]
    total_score: int
    all_flags: List[str]


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
    idea_candidates: List[IdeaCandidate]
    all_flags: List[str]
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
