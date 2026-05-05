import json
import re
import asyncio
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from app.state import IdeaGenerationState
from app.config import settings

# Lazy initialization
_llm = None
_llm_fast = None
_graph = None


def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
            max_tokens=4096,
        )
    return _llm


def get_llm_fast():
    global _llm_fast
    if _llm_fast is None:
        _llm_fast = ChatGroq(
            model=settings.GROQ_MODEL_FAST,
            api_key=settings.GROQ_API_KEY,
            temperature=0.1,
            max_tokens=300,
        )
    return _llm_fast


def _parse_json(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return json.loads(text)


GENERATOR_PROMPT = """Ты — эксперт по бизнес-идеям с 20-летним опытом.

ПРОФИЛЬ ПРЕДПРИНИМАТЕЛЯ:
- Стартовый капитал: {capital_range}
- Формат: {format}
- Город: {city}
- Тип клиентов: {business_type}
- Команда: {team_size} чел.
- Период окупаемости: {payback_period} мес.
- Опыт: {experience}
- Исключения (НЕ хочет): {exclusions}
- Уровень технологичности: {tech_level}
- Риск-профиль: {risk_profile}
- Основной доход: {is_main_income}

Сгенерируй РОВНО 8 бизнес-идей. Правила:
1. Идеи РАЗНООБРАЗНЫ — не повторяй похожие ниши
2. Минимум 2 идеи используют опыт пользователя напрямую
3. Минимум 1 идея — нестандартная, неочевидная
4. Не включай идеи из исключений пользователя
5. Капитал реалистичен для каждой идеи

Верни ТОЛЬКО JSON массив (без markdown, без пояснений):
[
  {{
    "id": "idea_001",
    "title": "Название (3-5 слов)",
    "description": "Суть бизнеса (2-3 предложения)",
    "relevance_explanation": "Почему подходит этому человеку (1 предложение)",
    "main_risk": "Главный конкретный риск",
    "success_factor": "Ключевой фактор успеха",
    "market_analogues": ["Пример 1", "Пример 2"],
    "estimated_capital_min": 500000,
    "estimated_team_min": 1,
    "requires_license": false,
    "license_type": null
  }}
]"""

FINANCIAL_DISC_PROMPT = """Финансовый аналитик. Оцени совместимость идеи с финансовыми параметрами.
Ответь ТОЛЬКО JSON без markdown.

ИДЕЯ: {title}. {description}

ПАРАМЕТРЫ: капитал={capital_range}, окупаемость={payback_period}мес, основной доход={is_main_income}

{{"verdict":"pass|warn|fail","score":75,"reason":"одно предложение","flags":[]}}

Доступные флаги: capital_tight, capital_insufficient, payback_too_long, high_fixed_costs, seasonal_cashflow"""

MARKET_DISC_PROMPT = """Аналитик рынка. Оцени рыночный потенциал идеи.
Ответь ТОЛЬКО JSON без markdown.

ИДЕЯ: {title}. {description}

ПАРАМЕТРЫ: город={city}, формат={format}, клиенты={business_type}

{{"verdict":"pass|warn|fail","score":75,"reason":"одно предложение","flags":[]}}

Доступные флаги: market_saturated, market_too_small, market_declining, high_competition, geography_mismatch, b2b_mismatch"""

OPS_DISC_PROMPT = """Операционный директор. Оцени реалистичность запуска.
Ответь ТОЛЬКО JSON без markdown.

ИДЕЯ: {title}. {description}
Лицензия: {requires_license} ({license_type}), мин. команда: {estimated_team_min}

ПАРАМЕТРЫ: команда={team_size}, опыт={experience}, риск={risk_profile}

{{"verdict":"pass|warn|fail","score":75,"reason":"одно предложение","flags":[]}}

Доступные флаги: license_required, license_medical, license_education, license_alcohol, team_insufficient, experience_gap, high_ops_complexity"""

ENRICH_CARD_PROMPT = """Обогати карточку бизнес-идеи для отображения предпринимателю.
Ответь ТОЛЬКО JSON без markdown.

ИДЕЯ: {title}. {description}. Скор: {score}/100.

{{"tagline":"Яркий слоган 7-10 слов","why_for_you":"2 предложения почему подходит","difficulty":"easy|medium|hard","trend":"growing|stable|declining","unique_angle":"В чём выделиться среди конкурентов"}}"""


async def generate_candidates(state: IdeaGenerationState) -> IdeaGenerationState:
    p = state["profile"]
    try:
        prompt = GENERATOR_PROMPT.format(
            capital_range=p.get("capital_range", "не указан"),
            format=p.get("format", "не указан"),
            city=p.get("city", "не указан"),
            business_type=", ".join(p.get("business_type", [])),
            team_size=p.get("team_size", "1-2"),
            payback_period=p.get("payback_period", "12"),
            experience=p.get("experience", "не указан"),
            exclusions=p.get("exclusions", "нет"),
            tech_level=p.get("tech_level", "medium"),
            risk_profile=p.get("risk_profile", "moderate"),
            is_main_income=p.get("is_main_income", True),
        )
        resp = await get_llm().ainvoke(prompt)
        ideas = _parse_json(resp.content)
        if not isinstance(ideas, list):
            raise ValueError("Expected JSON array")
        return {**state, "idea_candidates": ideas, "status": "discriminating"}
    except Exception as e:
        return {**state, "errors": [f"generation_failed:{str(e)[:200]}"], "status": "error"}


async def _discriminate(idea: dict, profile: dict, disc_type: str) -> dict:
    try:
        if disc_type == "financial":
            prompt = FINANCIAL_DISC_PROMPT.format(
                title=idea["title"], description=idea.get("description", ""),
                capital_range=profile.get("capital_range", ""),
                payback_period=profile.get("payback_period", "12"),
                is_main_income=profile.get("is_main_income", True),
            )
        elif disc_type == "market":
            prompt = MARKET_DISC_PROMPT.format(
                title=idea["title"], description=idea.get("description", ""),
                city=profile.get("city", "не указан"),
                format=profile.get("format", ""),
                business_type=", ".join(profile.get("business_type", [])),
            )
        else:
            prompt = OPS_DISC_PROMPT.format(
                title=idea["title"], description=idea.get("description", ""),
                requires_license=idea.get("requires_license", False),
                license_type=idea.get("license_type", "нет"),
                estimated_team_min=idea.get("estimated_team_min", 1),
                team_size=profile.get("team_size", "1-2"),
                experience=profile.get("experience", "нет"),
                risk_profile=profile.get("risk_profile", "moderate"),
            )

        resp = await get_llm_fast().ainvoke(prompt)
        text = re.sub(r"```(?:json)?", "", resp.content.strip()
                      ).strip().rstrip("`")
        r = json.loads(text)
        return {
            "verdict": r.get("verdict", "warn"),
            "score": int(r.get("score", 50)),
            "flags": r.get("flags", []),
        }
    except Exception:
        return {"verdict": "warn", "score": 50, "flags": []}


async def run_discriminators(state: IdeaGenerationState) -> IdeaGenerationState:
    profile = state["profile"]

    async def score_idea(idea: dict) -> dict:
        fin, mkt, ops = await asyncio.gather(
            _discriminate(idea, profile, "financial"),
            _discriminate(idea, profile, "market"),
            _discriminate(idea, profile, "ops"),
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

    scored = await asyncio.gather(*[score_idea(idea) for idea in state["idea_candidates"]])
    return {**state, "idea_candidates": list(scored)}


def aggregate_scores(state: IdeaGenerationState) -> IdeaGenerationState:
    filtered = []
    for idea in state["idea_candidates"]:
        verdicts = [idea.get("financial_verdict", "warn"),
                    idea.get("market_verdict", "warn"),
                    idea.get("ops_verdict", "warn")]
        if "fail" in verdicts:
            continue
        if sum(1 for v in verdicts if v == "warn") >= 2:
            continue

        total = round(
            idea.get("financial_score", 50) * 0.4 +
            idea.get("market_score", 50) * 0.4 +
            idea.get("ops_score", 50) * 0.2
        )
        all_flags = list(set(
            idea.get("financial_flags", []) +
            idea.get("market_flags", []) +
            idea.get("ops_flags", [])
        ))
        filtered.append({**idea, "total_score": total, "all_flags": all_flags})

    filtered.sort(key=lambda x: x["total_score"], reverse=True)
    top = filtered[:6]
    all_flags = list(set(f for idea in top for f in idea.get("all_flags", [])))
    return {**state, "idea_candidates": top, "all_flags": all_flags}


async def enrich_cards(state: IdeaGenerationState) -> IdeaGenerationState:
    async def enrich_one(idea: dict) -> dict:
        try:
            prompt = ENRICH_CARD_PROMPT.format(
                title=idea["title"],
                description=idea.get("description", ""),
                score=idea.get("total_score", 50),
            )
            resp = await get_llm_fast().ainvoke(prompt)
            text = re.sub(r"```(?:json)?", "",
                          resp.content.strip()).strip().rstrip("`")
            extra = json.loads(text)
            return {**idea, **extra}
        except Exception:
            return idea

    enriched = await asyncio.gather(*[enrich_one(idea) for idea in state["idea_candidates"]])
    return {**state, "idea_candidates": list(enriched), "status": "done"}


def route_generation(state: IdeaGenerationState) -> str:
    return END if state.get("status") == "error" else "run_discriminators"


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


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_idea_generation_graph()
    return _graph


async def run_idea_generation(user_id: str, session_id: str, profile: dict) -> dict:
    return await get_graph().ainvoke({
        "user_id": user_id,
        "session_id": session_id,
        "profile": profile,
        "idea_candidates": [],
        "all_flags": [],
        "errors": [],
        "status": "generating",
    })
