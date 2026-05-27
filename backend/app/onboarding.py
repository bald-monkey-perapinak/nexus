import json
import re
from typing import Literal
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from app.state import OnboardingState
from app.config import settings

llm = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    temperature=0.3,
    max_tokens=1000,
)

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
Правила implied_segment: micro=до 100к или 100к–250к, small=250к–500к, medium=500к+.

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
    try:
        resp = await llm.ainvoke(ENRICH_PROMPT.format(
            profile=json.dumps(profile, ensure_ascii=False)
        ))
        text = re.sub(r"```(?:json)?", "", resp.content.strip()).strip().rstrip("`").strip()
        enriched = json.loads(text)
        return {**state, "profile": {**profile, **enriched}, "errors": []}
    except Exception as e:
        return {**state, "profile": {**profile, "city_tier": "3", "implied_segment": "small"}, "errors": [str(e)[:80]]}


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
