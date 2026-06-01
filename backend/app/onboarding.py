import json
import re
from typing import Literal
from langgraph.graph import StateGraph, END
from app.state import OnboardingState
from app.llm_router import get_router
from app.llm_utils import ainvoke_with_fallback

REQUIRED_FIELDS = ["capital_range", "format", "business_type", "team_size"]

WEIGHTS = {
    "capital_range": 20, "format": 10, "business_type": 10, "team_size": 10,
    "payback_period": 10, "experience": 10, "exclusions": 5,
    "tech_level": 5, "risk_profile": 10, "planning_horizon": 5,
    "has_clients": 2, "has_premises": 2, "has_partners": 1,
}

ENRICH_PROMPT = """Ты — ассистент платформы Nexus для предпринимателей.
Нормализуй профиль пользователя и верни ТОЛЬКО JSON без markdown, без пояснений:
{{
  "experience_tags": [],
  "exclusion_tags": [],
  "implied_segment": "micro|small|medium",
  "city_tier": "1|2|3|online"
}}

Правила city_tier: 1=Москва/СПб, 2=города-миллионники, 3=остальные, online=онлайн.
Правила implied_segment: micro=до 500к, small=500к-2м, medium=2м+.

Профиль:
{profile}"""


def validate_input(state: OnboardingState) -> OnboardingState:
    profile = state.get("profile", {})
    missing = [f for f in REQUIRED_FIELDS if not profile.get(f)]
    if missing:
        return {**state, "stage": "incomplete", "errors": [f"missing:{','.join(missing)}"]}
    return {**state, "stage": "complete", "errors": []}


async def enrich_profile(state: OnboardingState) -> OnboardingState:
    profile = state["profile"]
    router = get_router()
    try:
        prompt = ENRICH_PROMPT.format(
            profile=json.dumps(profile, ensure_ascii=False)
        )
        content = await ainvoke_with_fallback(prompt, tier="fast", temperature=0.3, max_tokens=400)
        text = re.sub(r"```(?:json)?", "", content.strip()
                      ).strip().rstrip("`").strip()
        enriched = json.loads(text)
        return {**state, "profile": {**profile, **enriched}, "errors": []}
    except Exception as e:
        from app.llm_utils import sanitize_exception
        return {**state, "profile": {**profile, "city_tier": "3", "implied_segment": "small"}, "errors": [sanitize_exception(e, "enrich_profile_failed")]}


def calculate_completeness(state: OnboardingState) -> OnboardingState:
    profile = state["profile"]
    score = sum(w for f, w in WEIGHTS.items() if profile.get(f))
    return {**state, "profile_completeness": score}


def route_onboarding(state: OnboardingState) -> Literal["enrich_profile", "end_incomplete"]:
    return "end_incomplete" if state.get("stage") == "incomplete" else "enrich_profile"


def build_onboarding_graph():
    g = StateGraph(OnboardingState)
    g.add_node("validate_input", validate_input)
    g.add_node("enrich_profile", enrich_profile)
    g.add_node("calculate_completeness", calculate_completeness)
    g.set_entry_point("validate_input")
    g.add_conditional_edges("validate_input", route_onboarding, {
        "enrich_profile": "enrich_profile",
        "end_incomplete": END,
    })
    g.add_edge("enrich_profile", "calculate_completeness")
    g.add_edge("calculate_completeness", END)
    return g.compile()


onboarding_graph = build_onboarding_graph()


async def run_onboarding(user_id: str, profile: dict) -> dict:
    return await onboarding_graph.ainvoke({
        "user_id": user_id,
        "profile": profile,
        "profile_completeness": 0,
        "errors": [],
        "stage": "pending",
    })
