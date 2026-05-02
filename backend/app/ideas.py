import json
import re
import asyncio
from typing import Literal
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from app.state import IdeaGenerationState, IdeaCandidate
from app.config import settings

llm = ChatAnthropic(
    model=settings.CLAUDE_MODEL,
    anthropic_api_key=settings.ANTHROPIC_API_KEY,
    temperature=0.7,
    max_tokens=4000,
)

llm_fast = ChatAnthropic(
    model=settings.CLAUDE_MODEL,
    anthropic_api_key=settings.ANTHROPIC_API_KEY,
    temperature=0.2,
    max_tokens=500,
)


def _parse_json(text: str) -> dict | list:
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return json.loads(text)


GENERATOR_PROMPT = """Ты — эксперт по бизнес-идеям с 20-летним опытом.

ПРОФИЛЬ ПРЕДПРИНИМАТЕЛЯ:
- Стартовый капитал: {capital_range}
- Формат: {format}
- Город: {city}
- Тип клиентов: {business_type}
- Команда: {team_size} чел.
- Период окупаемости: {payback_period}
- Опыт: {experience}
- Исключения: {exclusions}
- Уровень технологичности: {tech_level}
- Риск-профиль: {risk_profile}
- Основной доход: {is_main_income}

Сгенерируй РОВНО 8 идей. Правила:
1. Идеи РАЗНООБРАЗНЫ — не давай похожие
2. Минимум 2 используют опыт пользователя напрямую
3. Минимум 1 — нестандартная, неочевидная
4. Не включай идеи из исключений
5. Капитал должен быть реалистичен

Верни ТОЛЬКО JSON массив из 8 объектов:
[{{
  "id": "idea_001",
  "title": "Название (3-5 слов)",
  "description": "Суть бизнеса (2-3 предложения)",
  "relevance_explanation": "Почему подходит (1 предложение)",
  "main_risk": "Главный конкретный риск",
  "success_factor": "Ключевой фактор успеха",
  "market_analogues": ["Пример 1", "Пример 2"],
  "estimated_capital_min": 500000,
  "estimated_team_min": 1,
  "requires_license": false,
  "license_type": null
}}]"""

FINANCIAL_DISC_PROMPT = """Оцени финансовую совместимость идеи с профилем. Отвечай ТОЛЬКО JSON.

ИДЕЯ: {title}
{description}

ПАРАМЕТРЫ:
- Капитал: {capital_range}
- Окупаемость: {payback_period} мес
- Основной доход: {is_main_income}

{{"verdict": "pass|warn|fail", "score": 0-100, "reason": "1 предложение", "flags": []}}

Флаги: capital_tight, capital_insufficient, payback_too_long, high_fixed_costs, seasonal_cashflow"""

MARKET_DISC_PROMPT = """Оцени рыночный потенциал. Отвечай ТОЛЬКО JSON.

ИДЕЯ: {title}
{description}

ПАРАМЕТРЫ:
- Город/формат: {city} ({format})
- Тип клиентов: {business_type}

{{"verdict": "pass|warn|fail", "score": 0-100, "reason": "1 предложение", "flags": []}}

Флаги: market_saturated, market_too_small, market_declining, high_competition, geography_mismatch, b2b_mismatch"""

OPS_DISC_PROMPT = """Оцени операционную реалистичность. Отвечай ТОЛЬКО JSON.

ИДЕЯ: {title}
{description}
Требует лицензию: {requires_license} ({license_type})
Мин. команда: {estimated_team_min}

ПАРАМЕТРЫ:
- Команда: {team_size}
- Опыт: {experience}
- Риск-профиль: {risk_profile}

{{"verdict": "pass|warn|fail", "score": 0-100, "reason": "1 предложение", "flags": []}}

Флаги: license_required, license_medical, license_education, license_alcohol, team_insufficient, experience_gap, high_ops_complexity"""

ENRICH_CARD_PROMPT = """Обогати карточку бизнес-идеи. Отвечай ТОЛЬКО JSON.

ИДЕЯ: {title}
{description}
Скор: {score}/100

{{"tagline": "Яркий слоган (7-10 слов)", "why_for_you": "2 предложения почему подходит", "difficulty": "easy|medium|hard", "trend": "growing|stable|declining", "unique_angle": "В чём выделиться"}}"""


async def generate_candidates(state: IdeaGenerationState) -> IdeaGenerationState:
    profile = state["profile"]
    try:
        prompt = GENERATOR_PROMPT.format(
            capital_range=profile.get("capital_range", "не указан"),
            format=profile.get("format", "не указан"),
            city=profile.get("city", "не указан"),
            business_type=", ".join(profile.get("business_type", [])),
            team_size=profile.get("team_size", "1-2"),
            payback_period=profile.get("payback_period", "12"),
            experience=profile.get("experience", "не указан"),
            exclusions=profile.get("exclusions", "нет"),
            tech_level=profile.get("tech_level", "medium"),
            risk_profile=profile.get("risk_profile", "moderate"),
            is_main_income=profile.get("is_main_income", True),
        )
        resp = await llm.ainvoke(prompt)
        ideas = _parse_json(resp.content)
        return {**state, "idea_candidates": ideas, "status": "discriminating"}
    except Exception as e:
        return {**state, "errors": [f"generation_failed:{str(e)[:200]}"], "status": "error"}


async def _run_discriminator(idea: dict, profile: dict, disc_type: str) -> dict:
    prompts = {
        "financial": FINANCIAL_DISC_PROMPT.format(
            title=idea["title"], description=idea["description"],
            capital_range=profile.get("capital_range", ""),
            payback_period=profile.get("payback_period", "12"),
            is_main_income=profile.get("is_main_income", True),
        ),
        "market": MARKET_DISC_PROMPT.format(
            title=idea["title"], description=idea["description"],
            city=profile.get("city", "не указан"),
            format=profile.get("format", ""),
            business_type=", ".join(profile.get("business_type", [])),
        ),
        "ops": OPS_DISC_PROMPT.format(
            title=idea["title"], description=idea["description"],
            requires_license=idea.get("requires_license", False),
            license_type=idea.get("license_type", "нет"),
            estimated_team_min=idea.get("estimated_team_min", 1),
            team_size=profile.get("team_size", "1-2"),
            experience=profile.get("experience", "нет"),
            risk_profile=profile.get("risk_profile", "moderate"),
        ),
    }
    try:
        resp = await llm_fast.ainvoke(prompts[disc_type])
        result = _parse_json(resp.content)
        return {"verdict": result.get("verdict", "warn"), "score": result.get("score", 50),
                "flags": result.get("flags", []), "reason": result.get("reason", "")}
    except Exception:
        return {"verdict": "warn", "score": 50, "flags": [], "reason": "discrimination_error"}


async def run_discriminators(state: IdeaGenerationState) -> IdeaGenerationState:
    profile = state["profile"]
    ideas = state["idea_candidates"]

    # Run all discriminators concurrently per idea
    async def score_idea(idea: dict) -> dict:
        fin, mkt, ops = await asyncio.gather(
            _run_discriminator(idea, profile, "financial"),
            _run_discriminator(idea, profile, "market"),
            _run_discriminator(idea, profile, "ops"),
        )
        return {
            **idea,
            "financial_score": fin["score"], "financial_verdict": fin["verdict"],
            "financial_flags": fin["flags"],
            "market_score": mkt["score"], "market_verdict": mkt["verdict"],
            "market_flags": mkt["flags"],
            "ops_score": ops["score"], "ops_verdict": ops["verdict"],
            "ops_flags": ops["flags"],
        }

    scored = await asyncio.gather(*[score_idea(idea) for idea in ideas])
    return {**state, "idea_candidates": list(scored)}


def aggregate_scores(state: IdeaGenerationState) -> IdeaGenerationState:
    candidates = state["idea_candidates"]
    filtered = []

    for idea in candidates:
        fin, mkt, ops = idea.get("financial_verdict", "warn"), idea.get("market_verdict", "warn"), idea.get("ops_verdict", "warn")
        verdicts = [fin, mkt, ops]

        if "fail" in verdicts:
            continue
        if sum(1 for v in verdicts if v == "warn") >= 2:
            continue

        total = round(
            idea.get("financial_score", 50) * 0.4 +
            idea.get("market_score", 50) * 0.4 +
            idea.get("ops_score", 50) * 0.2
        )
        all_flags = (idea.get("financial_flags", []) + idea.get("market_flags", []) + idea.get("ops_flags", []))

        filtered.append({**idea, "total_score": total, "all_flags": list(set(all_flags))})

    filtered.sort(key=lambda x: x["total_score"], reverse=True)
    top = filtered[:6]

    all_flags = list(set(f for idea in top for f in idea.get("all_flags", [])))
    return {**state, "idea_candidates": top, "all_flags": all_flags}


async def enrich_cards(state: IdeaGenerationState) -> IdeaGenerationState:
    ideas = state["idea_candidates"]

    async def enrich_one(idea: dict) -> dict:
        try:
            prompt = ENRICH_CARD_PROMPT.format(
                title=idea["title"], description=idea["description"],
                score=idea.get("total_score", 50)
            )
            resp = await llm_fast.ainvoke(prompt)
            extra = _parse_json(resp.content)
            return {**idea, **extra}
        except Exception:
            return idea

    enriched = await asyncio.gather(*[enrich_one(idea) for idea in ideas])
    return {**state, "idea_candidates": list(enriched), "status": "done"}


def route_generation(state: IdeaGenerationState) -> Literal["run_discriminators", END]:
    if state.get("status") == "error":
        return END
    return "run_discriminators"


def build_idea_generation_graph():
    g = StateGraph(IdeaGenerationState)
    g.add_node("generate_candidates", generate_candidates)
    g.add_node("run_discriminators", run_discriminators)
    g.add_node("aggregate_scores", aggregate_scores)
    g.add_node("enrich_cards", enrich_cards)

    g.set_entry_point("generate_candidates")
    g.add_conditional_edges("generate_candidates", route_generation, {
        "run_discriminators": "run_discriminators",
        END: END,
    })
    g.add_edge("run_discriminators", "aggregate_scores")
    g.add_edge("aggregate_scores", "enrich_cards")
    g.add_edge("enrich_cards", END)
    return g.compile()


idea_generation_graph = build_idea_generation_graph()


async def run_idea_generation(user_id: str, session_id: str, profile: dict) -> dict:
    result = await idea_generation_graph.ainvoke({
        "user_id": user_id,
        "session_id": session_id,
        "profile": profile,
        "idea_candidates": [],
        "all_flags": [],
        "errors": [],
        "status": "generating",
    })
    return result
