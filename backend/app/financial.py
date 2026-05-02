import json
import re
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from app.state import FinancialModelState
from app.config import settings

llm = ChatAnthropic(
    model=settings.CLAUDE_MODEL,
    anthropic_api_key=settings.ANTHROPIC_API_KEY,
    temperature=0.2,
    max_tokens=2000,
)


def _parse_json(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return json.loads(text)


ASSUMPTIONS_PROMPT = """Финансовый консультант. Базовые допущения для модели.

ИДЕЯ: {title}
{description}

ПАРАМЕТРЫ:
- Город (тир {city_tier}): {city}
- Формат: {format}
- Команда: {team_size}
- Капитал: {capital_range}

Для тира 1 (Москва/СПб) средний чек и зарплаты выше на 40-50%.

Верни ТОЛЬКО JSON:
{{
  "avg_check_rub": 5000,
  "monthly_clients_base": 30,
  "monthly_clients_mature": 80,
  "fixed_costs_monthly": {{
    "rent": 50000,
    "salaries": 150000,
    "utilities": 10000,
    "marketing": 30000,
    "other": 20000,
    "total": 260000
  }},
  "variable_cost_pct": 25,
  "startup_costs": {{
    "equipment": 100000,
    "renovation": 0,
    "legal": 15000,
    "marketing_initial": 50000,
    "working_capital": 100000,
    "total": 265000
  }},
  "assumptions_notes": "2-3 предложения об ключевых допущениях"
}}"""

UNIT_ECONOMICS_PROMPT = """Рассчитай юнит-экономику. ТОЛЬКО JSON.

ИДЕЯ: {title}
ФОРМАТ: {format}
КЛИЕНТЫ: {business_type}
СРЕДНИЙ ЧЕК: {avg_check} руб.
МАРКЕТИНГ: {marketing_budget} руб./мес
КЛИЕНТОВ В МЕС: {monthly_clients}

{{
  "cac_rub": 1500,
  "avg_purchase_frequency": 4,
  "avg_client_lifetime_months": 18,
  "ltv_rub": 18000,
  "ltv_cac_ratio": 12.0,
  "ltv_cac_verdict": "excellent (>3)|good (2-3)|marginal (1-2)|poor (<1)",
  "margin_per_unit": 3000,
  "margin_pct": 60
}}"""


async def generate_base_assumptions(state: FinancialModelState) -> FinancialModelState:
    idea = state["idea"]
    profile = state["profile"]
    try:
        prompt = ASSUMPTIONS_PROMPT.format(
            title=idea["title"],
            description=idea.get("description", ""),
            city_tier=profile.get("city_tier", "3"),
            city=profile.get("city", "не указан"),
            format=profile.get("format", ""),
            team_size=profile.get("team_size", "1-2"),
            capital_range=profile.get("capital_range", ""),
        )
        resp = await llm.ainvoke(prompt)
        assumptions = _parse_json(resp.content)
        return {**state, "assumptions": assumptions, "errors": []}
    except Exception as e:
        return {**state, "errors": [f"assumptions_failed:{str(e)[:100]}"]}


def calculate_scenarios(state: FinancialModelState) -> FinancialModelState:
    a = state.get("assumptions", {})
    adj = state.get("user_adjustments", {})

    avg_check = adj.get("avg_check", a.get("avg_check_rub", 5000))
    clients = adj.get("monthly_clients", a.get("monthly_clients_base", 30))
    fixed = adj.get("fixed_costs", a.get("fixed_costs_monthly", {}).get("total", 200000))
    var_pct = adj.get("variable_cost_pct", a.get("variable_cost_pct", 30))
    startup = a.get("startup_costs", {}).get("total", 300000)

    def calc(check_mult: float, client_mult: float) -> dict:
        rev = avg_check * check_mult * clients * client_mult
        var_costs = rev * (var_pct / 100)
        profit = rev - var_costs - fixed
        margin = avg_check * check_mult * (1 - var_pct / 100)
        be_clients = fixed / margin if margin > 0 else 9999
        payback = startup / profit if profit > 0 else -1
        return {
            "monthly_revenue": round(rev),
            "monthly_variable_costs": round(var_costs),
            "monthly_fixed_costs": round(fixed),
            "monthly_profit": round(profit),
            "breakeven_clients": round(be_clients),
            "payback_months": round(payback, 1) if payback > 0 else None,
        }

    scenarios = {
        "pessimistic": calc(0.7, 0.5),
        "base": calc(1.0, 1.0),
        "optimistic": calc(1.3, 1.75),
    }
    return {**state, "scenarios": scenarios}


async def generate_unit_economics(state: FinancialModelState) -> FinancialModelState:
    idea = state["idea"]
    profile = state["profile"]
    a = state.get("assumptions", {})
    try:
        prompt = UNIT_ECONOMICS_PROMPT.format(
            title=idea["title"],
            format=profile.get("format", ""),
            business_type=", ".join(profile.get("business_type", [])),
            avg_check=a.get("avg_check_rub", 5000),
            marketing_budget=a.get("fixed_costs_monthly", {}).get("marketing", 30000),
            monthly_clients=a.get("monthly_clients_base", 30),
        )
        resp = await llm.ainvoke(prompt)
        ue = _parse_json(resp.content)
        return {**state, "unit_economics": ue}
    except Exception as e:
        return {**state, "unit_economics": {}, "errors": [f"unit_econ_failed:{str(e)[:100]}"]}


def validate_model(state: FinancialModelState) -> FinancialModelState:
    scenarios = state.get("scenarios", {})
    warnings = []
    pess = scenarios.get("pessimistic", {})
    if pess.get("monthly_profit", 0) < -500000:
        warnings.append("pessimistic_scenario_critical_loss")

    ue = state.get("unit_economics", {})
    if ue.get("ltv_cac_ratio", 2) < 1:
        warnings.append("unit_economics_negative")

    base = scenarios.get("base", {})
    fixed = base.get("monthly_fixed_costs", 0)
    rev = base.get("monthly_revenue", 1)
    if rev > 0 and fixed / rev > 0.8:
        warnings.append("high_fixed_cost_ratio")

    return {**state, "validation_warnings": warnings}


def build_financial_graph():
    g = StateGraph(FinancialModelState)
    g.add_node("generate_base_assumptions", generate_base_assumptions)
    g.add_node("calculate_scenarios", calculate_scenarios)
    g.add_node("generate_unit_economics", generate_unit_economics)
    g.add_node("validate_model", validate_model)

    g.set_entry_point("generate_base_assumptions")
    g.add_edge("generate_base_assumptions", "calculate_scenarios")
    g.add_edge("calculate_scenarios", "generate_unit_economics")
    g.add_edge("generate_unit_economics", "validate_model")
    g.add_edge("validate_model", END)
    return g.compile()


financial_graph = build_financial_graph()


async def run_financial_model(user_id: str, session_id: str, idea: dict, profile: dict, user_adjustments: dict = None) -> dict:
    result = await financial_graph.ainvoke({
        "user_id": user_id,
        "session_id": session_id,
        "idea": idea,
        "profile": profile,
        "assumptions": {},
        "scenarios": {},
        "unit_economics": {},
        "validation_warnings": [],
        "user_adjustments": user_adjustments or {},
        "errors": [],
    })
    return result
