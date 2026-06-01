"""
AnalyticsGraph v0.4 — Real market intelligence via Tavily.
Searches competitors, marketplace presence, market trends.
Synthesizes into structured report with LLM CoT.
"""
import asyncio
from typing import TypedDict, List, Annotated
import operator
from langgraph.graph import StateGraph, END
from app.llm_utils import ainvoke_with_fallback, extract_json, safe_extract_json
from app.config import settings


class AnalyticsState(TypedDict):
    user_id: str
    session_id: str
    idea: dict
    profile: dict
    competitor_results: List[dict]
    market_results: List[dict]
    marketplace_results: List[dict]
    report: dict
    errors: Annotated[List[str], operator.add]


async def tavily_search(query: str, max_results: int = 5) -> List[dict]:
    if not settings.TAVILY_API_KEY:
        return []
    try:
        from tavily import AsyncTavilyClient
        client = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
        resp = await client.search(
            query=query, max_results=max_results,
            search_depth="advanced", include_answer=True,
        )
        return resp.get("results", [])
    except Exception as e:
        from app.llm_utils import sanitize_exception
        return [{"error": sanitize_exception(e, "tavily_search_failed")}]


async def search_competitors(state: AnalyticsState) -> AnalyticsState:
    idea = state["idea"]
    profile = state["profile"]
    fmt = profile.get("format", "offline")
    city = profile.get("city", "")
    if fmt == "offline" and city:
        queries = [
            f"{idea['title']} {city} конкуренты компании отзывы цены",
            f"открыть {idea['title']} {city} сколько стоит бизнес",
        ]
    else:
        queries = [
            f"{idea['title']} онлайн Россия конкуренты сервисы 2024 2025",
            f"{idea['title']} российский рынок лидеры игроки",
        ]
    results = []
    for q in queries:
        results.extend(await tavily_search(q, 4))
    return {**state, "competitor_results": results}


async def search_marketplace(state: AnalyticsState) -> AnalyticsState:
    profile = state["profile"]
    idea = state["idea"]
    if profile.get("format") not in ("online", "hybrid"):
        return {**state, "marketplace_results": []}
    results = []
    for q in [
        f"{idea['title']} wildberries количество продавцов конкуренция",
        f"{idea['title']} ozon рынок продажи спрос 2024",
    ]:
        results.extend(await tavily_search(q, 3))
    return {**state, "marketplace_results": results}


async def search_market(state: AnalyticsState) -> AnalyticsState:
    idea = state["idea"]
    results = []
    for q in [
        f"рынок {idea['title']} Россия объём 2024 2025 млрд",
        f"тренды {idea['title']} Россия рост статистика",
    ]:
        results.extend(await tavily_search(q, 3))
    return {**state, "market_results": results}


SYNTHESIS_PROMPT = """Ты — рыночный аналитик. Синтезируй данные из поиска в структурированный отчёт.

ИДЕЯ: {title}
{description}
Город: {city}, формат: {format}, капитал: {capital_range}

ДАННЫЕ О КОНКУРЕНТАХ:
{competitor_data}

ДАННЫЕ О РЫНКЕ:
{market_data}

ДАННЫЕ О МАРКЕТПЛЕЙСАХ:
{marketplace_data}

ШАГ 1 — РАССУЖДЕНИЕ (5-7 предложений):
Что реально показывают данные? Насколько насыщен рынок? Кто доминирует?
Есть ли незанятые ниши? Каков реальный потенциал?

ШАГ 2 — ОТЧЁТ:
```json
{{
  "market_overview": {{
    "volume_estimate": "объём или 'данные не найдены'",
    "trend": "growing|stable|declining",
    "trend_evidence": "конкретный факт",
    "saturation": "low|medium|high",
    "saturation_note": "почему такая оценка"
  }},
  "competitors": [
    {{
      "name": "Название",
      "positioning": "как позиционируются",
      "weakness": "слабое место",
      "estimated_revenue": null,
      "source": "откуда данные"
    }}
  ],
  "marketplace_presence": {{
    "relevant": true,
    "seller_count_estimate": null,
    "competition_level": "low|medium|high",
    "key_finding": "главный вывод"
  }},
  "gaps": ["конкретная незанятая ниша 1", "ниша 2"],
  "competitor_strategies": ["что делают конкуренты — факт 1", "факт 2"],
  "entry_barriers": ["барьер 1"],
  "recommendation": "стоит входить или нет и почему — одна фраза",
  "data_quality": "good|partial|poor",
  "data_quality_note": "что нашли, чего не хватает"
}}
```"""


def _fmt(results: List[dict]) -> str:
    if not results:
        return "данные не найдены"
    parts = []
    for r in results[:8]:
        if "error" in r:
            continue
        parts.append(
            f"• {r.get('title', '')}\n  {r.get('content', '')[:280]}\n  {r.get('url', '')}")
    return "\n\n".join(parts) if parts else "результаты пусты"


FALLBACK_REPORT = {
    "market_overview": {
        "volume_estimate": "данные не найдены",
        "trend": "stable", "trend_evidence": "нет данных",
        "saturation": "medium", "saturation_note": "нет TAVILY_API_KEY",
    },
    "competitors": [],
    "marketplace_presence": {"relevant": False, "seller_count_estimate": None,
                             "competition_level": "medium", "key_finding": "недоступно"},
    "gaps": ["Добавьте TAVILY_API_KEY в .env для реального поиска"],
    "competitor_strategies": [],
    "entry_barriers": [],
    "recommendation": "Аналитика недоступна — добавьте TAVILY_API_KEY",
    "data_quality": "poor",
    "data_quality_note": "TAVILY_API_KEY не настроен",
}


async def synthesize_report(state: AnalyticsState) -> AnalyticsState:
    idea = state["idea"]
    profile = state["profile"]
    prompt = SYNTHESIS_PROMPT.format(
        title=idea["title"], description=idea.get("description", ""),
        city=profile.get("city", "не указан"),
        format=profile.get("format", ""),
        capital_range=profile.get("capital_range", ""),
        competitor_data=_fmt(state.get("competitor_results", [])),
        market_data=_fmt(state.get("market_results", [])),
        marketplace_data=_fmt(state.get("marketplace_results", [])),
    )
    try:
        content = await ainvoke_with_fallback(prompt, tier="heavy", temperature=0.2, max_tokens=3000)
        report = safe_extract_json(content, FALLBACK_REPORT)
        return {**state, "report": report}
    except Exception as e:
        from app.llm_utils import sanitize_exception
        return {**state, "report": FALLBACK_REPORT, "errors": [sanitize_exception(e, "synthesis_failed")]}


# LangGraph doesn't support fan-in natively without reducers,
# so we run marketplace + market sequentially after competitors
def build_analytics_graph():
    g = StateGraph(AnalyticsState)
    g.add_node("search_competitors", search_competitors)
    g.add_node("search_marketplace", search_marketplace)
    g.add_node("search_market",      search_market)
    g.add_node("synthesize_report",  synthesize_report)
    g.set_entry_point("search_competitors")
    g.add_edge("search_competitors", "search_marketplace")
    g.add_edge("search_marketplace", "search_market")
    g.add_edge("search_market",      "synthesize_report")
    g.add_edge("synthesize_report",  END)
    return g.compile()


analytics_graph = build_analytics_graph()


async def run_analytics(user_id: str, session_id: str, idea: dict, profile: dict) -> dict:
    return await analytics_graph.ainvoke({
        "user_id": user_id, "session_id": session_id,
        "idea": idea, "profile": profile,
        "competitor_results": [], "market_results": [],
        "marketplace_results": [], "report": {}, "errors": [],
    })
