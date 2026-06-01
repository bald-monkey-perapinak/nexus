import json
import re
import asyncio
from langgraph.graph import StateGraph, END
from app.llm_router import get_router
from app.llm_utils import ainvoke_with_fallback
from typing import TypedDict, List, Annotated
import operator


def _parse(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return json.loads(text)


class ValidationState(TypedDict):
    user_id: str
    session_id: str
    idea: dict
    profile: dict
    hypotheses: List[dict]
    custdev_script: dict
    mvp_tests: List[dict]
    checklist: List[dict]
    errors: Annotated[List[str], operator.add]


HYPOTHESES_PROMPT = """Определи 3-5 критических гипотез для проверки перед запуском бизнеса.
Отвечай ТОЛЬКО JSON без markdown.

ИДЕЯ: {title}. {description}
РИСКИ: {flags}

Хорошая гипотеза конкретна и проверяема. Плохо: "клиенты хотят продукт". Хорошо: "владельцы кафе в Казани готовы платить 3000 руб/мес за автоматизацию учёта".

{{"hypotheses":[{{"id":"h1","statement":"конкретная гипотеза с числами","type":"demand|pricing|channel|ops","risk_if_wrong":"что произойдёт если ложная","priority":"critical|important|nice_to_know"}}]}}"""

CUSTDEV_PROMPT = """Создай скрипт Customer Development интервью.
Отвечай ТОЛЬКО JSON без markdown.

ИДЕЯ: {title}
ГИПОТЕЗЫ: {hypotheses}
КЛИЕНТЫ: {business_type}, город {city}

{{"target_respondent":"точное описание кого искать","where_to_find":["канал1","канал2"],"interviews_needed":15,"duration_min":30,"opening":"вступительная фраза снимающая напряжение","questions":[{{"text":"вопрос","purpose":"какую гипотезу проверяет","type":"open|behavioral","follow_up":"уточняющий вопрос"}}],"success_criteria":{{"go":"при каких ответах идти вперёд","stop":"при каких ответах стоп"}},"red_flags":["фраза-предупреждение"]}}"""

MVP_PROMPT = """Разработай 2-3 варианта MVP-теста от дешевле к дороже.
Отвечай ТОЛЬКО JSON без markdown.

ИДЕЯ: {title}. {description}
КАПИТАЛ: {capital_range}, ФОРМАТ: {format}

{{"mvp_tests":[{{"name":"название теста","description":"как проводить (3-4 предложения)","budget_rub":5000,"duration_days":7,"success_metric":"конкретная метрика с числом","tools":["инструмент"],"steps":["шаг1","шаг2","шаг3"]}}]}}"""


async def identify_hypotheses(state: ValidationState) -> ValidationState:
    idea = state["idea"]
    router = get_router()
    try:
        content = await ainvoke_with_fallback(HYPOTHESES_PROMPT.format(
            title=idea["title"], description=idea.get("description", ""),
            flags=", ".join(idea.get("all_flags", []))
        ), tier="heavy", temperature=0.3, max_tokens=2000)
        result = _parse(content)
        return {**state, "hypotheses": result.get("hypotheses", [])}
    except Exception as e:
        from app.llm_utils import sanitize_exception
        return {**state, "errors": [sanitize_exception(e, "hypotheses_failed")]}


async def generate_custdev(state: ValidationState) -> ValidationState:
    idea = state["idea"]
    profile = state["profile"]
    router = get_router()
    try:
        content = await ainvoke_with_fallback(CUSTDEV_PROMPT.format(
            title=idea["title"],
            hypotheses=json.dumps(state["hypotheses"][:3], ensure_ascii=False),
            business_type=", ".join(profile.get("business_type", [])),
            city=profile.get("city", "не указан"),
        ), tier="heavy", temperature=0.3, max_tokens=2000)
        result = _parse(content)
        return {**state, "custdev_script": result}
    except Exception as e:
        from app.llm_utils import sanitize_exception
        return {**state, "errors": [sanitize_exception(e, "custdev_failed")]}


async def design_mvp_test(state: ValidationState) -> ValidationState:
    idea = state["idea"]
    profile = state["profile"]
    router = get_router()
    try:
        content = await ainvoke_with_fallback(MVP_PROMPT.format(
            title=idea["title"], description=idea.get("description", ""),
            capital_range=profile.get("capital_range", ""),
            format=profile.get("format", ""),
        ), tier="heavy", temperature=0.3, max_tokens=2000)
        result = _parse(content)
        return {**state, "mvp_tests": result.get("mvp_tests", [])}
    except Exception as e:
        from app.llm_utils import sanitize_exception
        return {**state, "errors": [sanitize_exception(e, "mvp_failed")]}


def build_checklist(state: ValidationState) -> ValidationState:
    checklist = []
    for h in state.get("hypotheses", []):
        checklist.append({
            "id": f"check_{h['id']}",
            "hypothesis_id": h["id"],
            "statement": h["statement"],
            "priority": h["priority"],
            "status": "todo",
            "method": "custdev" if h["type"] in ["demand", "pricing"] else "mvp_test",
        })
    for i, test in enumerate(state.get("mvp_tests", [])):
        checklist.append({
            "id": f"mvp_{i}",
            "title": test.get("name", ""),
            "budget_rub": test.get("budget_rub", 0),
            "duration_days": test.get("duration_days", 7),
            "success_metric": test.get("success_metric", ""),
            "status": "todo",
            "method": "mvp_test",
        })
    return {**state, "checklist": checklist}


def build_validation_graph():
    g = StateGraph(ValidationState)
    g.add_node("identify_hypotheses", identify_hypotheses)
    g.add_node("generate_custdev", generate_custdev)
    g.add_node("design_mvp_test", design_mvp_test)
    g.add_node("build_checklist", build_checklist)
    g.set_entry_point("identify_hypotheses")
    g.add_edge("identify_hypotheses", "generate_custdev")
    g.add_edge("generate_custdev", "design_mvp_test")
    g.add_edge("design_mvp_test", "build_checklist")
    g.add_edge("build_checklist", END)
    return g.compile()


validation_graph = build_validation_graph()


async def run_validation(user_id: str, session_id: str, idea: dict, profile: dict) -> dict:
    return await validation_graph.ainvoke({
        "user_id": user_id, "session_id": session_id,
        "idea": idea, "profile": profile,
        "hypotheses": [], "custdev_script": {},
        "mvp_tests": [], "checklist": [], "errors": [],
    })
