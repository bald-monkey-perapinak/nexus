import json
import re
from datetime import datetime, timedelta
from typing import TypedDict, List, Annotated
import operator
from langgraph.graph import StateGraph, END
from app.llm_router import get_router
from app.llm_utils import ainvoke_with_fallback


def _parse(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return json.loads(text)


class RoadmapState(TypedDict):
    user_id: str
    session_id: str
    idea: dict
    profile: dict
    financial: dict
    all_flags: List[str]
    flag_tasks: List[dict]
    base_tasks: List[dict]
    roadmap: List[dict]
    errors: Annotated[List[str], operator.add]


FLAG_TASKS: dict[str, List[dict]] = {
    "license_medical": [{"week": 1, "title": "Изучить требования медлицензии", "description": "Проверить требования Росздравнадзора. Запросить список документов, уточнить наличие помещения и персонала.", "category": "legal", "priority": "critical", "resources": ["https://roszdravnadzor.gov.ru/"]}],
    "license_education": [{"week": 1, "title": "Консультация по образовательной лицензии", "description": "Обратиться в Рособрнадзор или к профильному юристу. Срок получения — до 60 дней.", "category": "legal", "priority": "critical", "resources": ["https://obrnadzor.gov.ru/"]}],
    "license_alcohol": [{"week": 2, "title": "Подать заявку на алкогольную лицензию", "description": "Подготовить пакет документов для ФСРАР. Проверить требования к помещению.", "category": "legal", "priority": "critical", "resources": ["https://fsrar.gov.ru/"]}],
    "high_competition": [{"week": 1, "title": "Глубокий анализ конкурентов", "description": "Посетить / протестировать топ-3 конкурентов лично. Зафиксировать цены, слабые места, отзывы.", "category": "marketing", "priority": "critical", "resources": []}],
    "capital_tight": [{"week": 1, "title": "Создать финансовый резерв", "description": "Зарезервировать минимум 15% капитала как неприкосновенный запас на форс-мажоры.", "category": "finance", "priority": "critical", "resources": []}],
    "seasonal_cashflow": [{"week": 3, "title": "Построить план cash-flow с учётом сезонности", "description": "Рассчитать кассовые разрывы по месяцам, предусмотреть кредитную линию или резерв.", "category": "finance", "priority": "important", "resources": []}],
    "market_saturated": [{"week": 2, "title": "Определить незанятую нишу", "description": "Провести JTBD-анализ: выявить незакрытые задачи клиентов, которые конкуренты игнорируют.", "category": "marketing", "priority": "critical", "resources": []}],
    "experience_gap": [{"week": 1, "title": "Найти ментора или партнёра с опытом", "description": "Обратиться в бизнес-клубы, акселераторы, отраслевые чаты. Договориться о 2-3 менторских сессиях.", "category": "hiring", "priority": "important", "resources": ["https://fasie.ru/"]}],
    "team_insufficient": [{"week": 3, "title": "Составить план найма", "description": "Определить первые 2-3 ключевые роли. Разместить вакансии на hh.ru и в профильных Telegram-каналах.", "category": "hiring", "priority": "important", "resources": ["https://hh.ru/"]}],
    "high_fixed_costs": [{"week": 2, "title": "Аудит постоянных расходов", "description": "Пересмотреть все фиксированные статьи: аренда, зарплаты, подписки. Найти способы снизить на 20%.", "category": "finance", "priority": "important", "resources": []}],
    "payback_too_long": [{"week": 4, "title": "Разработать стратегию ускорения окупаемости", "description": "Рассмотреть предоплатные тарифы, абонементы, партнёрские программы для сокращения периода.", "category": "finance", "priority": "important", "resources": []}],
}

ROADMAP_PROMPT = """Ты — бизнес-консультант. Создай детальный роадмап на 90 дней (12 недель) для запуска бизнеса.

ИДЕЯ: {title}
{description}

ПРОФИЛЬ:
- Капитал: {capital_range}
- Команда: {team_size}
- Формат: {format}
- Город: {city}
- Клиенты: {business_type}

ФИНАНСОВЫЕ ВВОДНЫЕ:
- Стартовые расходы: {startup_costs} руб.
- Фикс. расходы/мес: {fixed_costs} руб.
- Средний чек: {avg_check} руб.

УЖЕ ЗАПЛАНИРОВАННЫЕ ЗАДАЧИ (не дублируй):
{existing_tasks}

ЛОГИКА НЕДЕЛЬ:
- Недели 1-4: юридический фундамент, финансы, первая инфраструктура
- Недели 5-8: запуск продаж, первые клиенты, маркетинг
- Недели 9-12: оптимизация, масштабирование, анализ

Каждая неделя — 3-5 задач. Верни ТОЛЬКО JSON массив (без markdown):
[{{
  "id": "t001",
  "week": 1,
  "title": "Зарегистрировать ИП",
  "description": "Подать заявление через Госуслуги (форма Р21001). Выбрать ОКВЭД. Срок — 3 рабочих дня.",
  "category": "legal",
  "priority": "critical",
  "resources": ["https://gosuslugi.ru/"]
}}]

Категории: legal, finance, marketing, ops, hiring, product
Приоритеты: critical, important, optional
Возвращай ТОЛЬКО JSON массив."""


def load_flag_tasks(state: RoadmapState) -> RoadmapState:
    tasks = []
    for flag in state.get("all_flags", []):
        for t in FLAG_TASKS.get(flag, []):
            tasks.append({**t, "id": f"flag_{flag}",
                         "source_flag": flag, "status": "todo"})
    return {**state, "flag_tasks": tasks}


async def generate_base_roadmap(state: RoadmapState) -> RoadmapState:
    idea = state["idea"]
    profile = state["profile"]
    fin = state.get("financial", {})
    assumptions = fin.get("assumptions", {})
    existing = [t["title"] for t in state["flag_tasks"]]
    router = get_router()
    try:
        prompt = ROADMAP_PROMPT.format(
            title=idea["title"],
            description=idea.get("description", ""),
            capital_range=profile.get("capital_range", ""),
            team_size=profile.get("team_size", ""),
            format=profile.get("format", ""),
            city=profile.get("city", "не указан"),
            business_type=", ".join(profile.get("business_type", [])),
            startup_costs=assumptions.get(
                "startup_costs", {}).get("total", "не указаны"),
            fixed_costs=assumptions.get(
                "fixed_costs_monthly", {}).get("total", "не указаны"),
            avg_check=assumptions.get("avg_check_rub", "не указан"),
            existing_tasks=", ".join(existing) if existing else "нет",
        )
        content = await ainvoke_with_fallback(prompt, tier="heavy", temperature=0.4, max_tokens=4096)
        tasks = _parse(content)
        if not isinstance(tasks, list):
            raise ValueError("Expected array")
        tasks = [{**t, "status": "todo",
                  "id": t.get("id", f"base_{i}")} for i, t in enumerate(tasks)]
        return {**state, "base_tasks": tasks}
    except Exception as e:
        from app.llm_utils import sanitize_exception
        return {**state, "base_tasks": [], "errors": [sanitize_exception(e, "roadmap_gen_failed")]}


def merge_and_finalize(state: RoadmapState) -> RoadmapState:
    start_date = datetime.now()
    all_tasks = state["base_tasks"] + state["flag_tasks"]

    seen: set[str] = set()
    unique: List[dict] = []
    for t in all_tasks:
        key = t["title"][:35].lower().strip()
        if key not in seen:
            seen.add(key)
            week = max(1, min(int(t.get("week", 1)), 12))
            deadline = (start_date + timedelta(weeks=week)
                        ).strftime("%Y-%m-%d")
            unique.append({**t, "week": week, "deadline": deadline})

    priority_order = {"critical": 0, "important": 1, "optional": 2}
    unique.sort(key=lambda x: (x["week"], priority_order.get(
        x.get("priority", "optional"), 2)))

    return {**state, "roadmap": unique}


def build_roadmap_graph():
    g = StateGraph(RoadmapState)
    g.add_node("load_flag_tasks",       load_flag_tasks)
    g.add_node("generate_base_roadmap", generate_base_roadmap)
    g.add_node("merge_and_finalize",    merge_and_finalize)
    g.set_entry_point("load_flag_tasks")
    g.add_edge("load_flag_tasks",       "generate_base_roadmap")
    g.add_edge("generate_base_roadmap", "merge_and_finalize")
    g.add_edge("merge_and_finalize",    END)
    return g.compile()


roadmap_graph = build_roadmap_graph()


async def run_roadmap(user_id: str, session_id: str, idea: dict, profile: dict,
                      all_flags: List[str], financial: dict = None) -> dict:
    return await roadmap_graph.ainvoke({
        "user_id": user_id, "session_id": session_id,
        "idea": idea, "profile": profile,
        "financial": financial or {},
        "all_flags": all_flags,
        "flag_tasks": [], "base_tasks": [], "roadmap": [], "errors": [],
    })
