"""
Nexus — Idea Generation Pipeline v2
====================================
Граф:
  check_contradictions
       │
  generate_candidates   (llama-70b, до 10 кандидатов)
       │
  run_discriminators    (параллельно по каждой идее, полный чеклист)
       │
  aggregate_scores      (стоп-факторы, сортировка, топ-8)
       │
  enrich_cards          (tagline, why_for_you, difficulty, trend)
       │
      END
"""

import json
import re
import asyncio
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from app.state import IdeaGenerationState, Contradiction
from app.config import settings
from app.validation_checklist import validate_idea_comprehensive, CITY_TIER_CONFIG
from app.llm_router import get_router

# ── LLM instances ────────────────────────────────────────────────────
_llm = None
_llm_fast = None
_graph = None

CAPITAL_MAP = {
    "до 100к":   75_000,
    "100к–250к":  175_000,
    "250к–500к":  375_000,
    "500к+":     1_000_000,
}
TEAM_MAP = {
    "1 (только я)": 1,
    "2–5": 3,
    "6–15": 8,
    "15+": 20,
}
PAYBACK_MAP = {
    "3–6": 6,
    "6–12": 12,
    "12–24": 24,
    "24+": 48,
}


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
            max_tokens=800,
        )
    return _llm_fast


def _parse(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    return json.loads(text)


# ══════════════════════════════════════════════════════════════════════
# NODE 1 — Детектор противоречий (детерминированный, без LLM)
# ══════════════════════════════════════════════════════════════════════

def check_contradictions(state: IdeaGenerationState) -> IdeaGenerationState:
    """
    Проверяет логические противоречия в профиле пользователя.
    Severity:
      "blocking" — комбинация нереалистична, генерация продолжается
                   но пользователь увидит предупреждение
      "warning"  — комбинация сложная, но возможная
    """
    p = state["profile"]
    contradictions: list[Contradiction] = []
    warnings: list[str] = []

    capital_rub = CAPITAL_MAP.get(p.get("capital_range", ""), 0)
    team_size = TEAM_MAP.get(p.get("team_size", ""), 1)
    payback_max = PAYBACK_MAP.get(p.get("payback_period", ""), 24)
    fmt = p.get("format", "")
    risk = p.get("risk_profile", "moderate")
    experience = (p.get("experience") or "").lower()
    exclusions = (p.get("exclusions") or "").lower()

    # 1. Капитал и оффлайн-формат
    if fmt == "offline" and capital_rub < 500_000:
        contradictions.append({
            "field_a": "format",
            "field_b": "capital_range",
            "description": (
                "Офлайн-бизнес требует минимум 500 тыс. руб. на аренду, "
                "ремонт и оборудование. При капитале до 500к рекомендуется "
                "онлайн или гибридный формат."
            ),
            "severity": "blocking",
        })

    # 2. Малый капитал + большая команда
    if capital_rub < 500_000 and team_size >= 6:
        contradictions.append({
            "field_a": "capital_range",
            "field_b": "team_size",
            "description": (
                f"Капитал {p.get('capital_range')} не покроет зарплаты "
                f"команды {p.get('team_size')} чел. даже на 3 месяца. "
                "Уменьшите команду или увеличьте капитал."
            ),
            "severity": "blocking",
        })

    # 3. Короткая окупаемость + консервативный риск + малый капитал
    if payback_max <= 6 and risk == "conservative" and capital_rub < 1_000_000:
        contradictions.append({
            "field_a": "payback_period",
            "field_b": "risk_profile",
            "description": (
                "Окупаемость за 3–6 мес. при консервативном риск-профиле "
                "и капитале до 1 млн практически невозможна. "
                "Такой горизонт требует либо агрессивных вложений, "
                "либо очень высокомаржинального онлайн-продукта."
            ),
            "severity": "blocking",
        })

    # 4. Опыт в исключениях
    experience_keywords = {
        "общепит": ["ресторан", "кафе", "еда", "общепит", "кухня", "повар"],
        "строительство": ["строй", "ремонт", "стройк"],
        "торговля": ["торгов", "магазин", "розниц", "ритейл"],
        "it": ["программ", "разработ", "it", "айти", "software"],
        "медицина": ["медицин", "врач", "клиник", "здоров"],
        "образование": ["образован", "учит", "школ", "курс", "обучен"],
        "финансы": ["финанс", "банк", "инвест", "бухгалт"],
    }
    exp_spheres = []
    exc_spheres = []
    for sphere, kws in experience_keywords.items():
        if any(k in experience for k in kws):
            exp_spheres.append(sphere)
        if any(k in exclusions for k in kws):
            exc_spheres.append(sphere)

    conflicting = set(exp_spheres) & set(exc_spheres)
    if conflicting:
        contradictions.append({
            "field_a": "experience",
            "field_b": "exclusions",
            "description": (
                f"Вы указали опыт в сфере «{', '.join(conflicting)}», "
                f"но добавили её в исключения. Мы это учтём: "
                "идеи из этой сферы генерироваться не будут, "
                "хотя ваш опыт может быть применён косвенно."
            ),
            "severity": "warning",
        })
        warnings.append(f"experience_excluded:{','.join(conflicting)}")

    # 5. B2G без опыта работы с госсектором + малый капитал
    if "B2G" in p.get("business_type", []) and capital_rub < 1_000_000:
        contradictions.append({
            "field_a": "business_type",
            "field_b": "capital_range",
            "description": (
                "Работа с госзаказчиками (B2G) требует значительного "
                "резервного капитала для участия в тендерах и "
                "кассовых разрывов (оплата — постфактум). "
                "Рекомендуется капитал от 1 млн руб."
            ),
            "severity": "warning",
        })

    # 6. Одиночка + offline + без помещения + высокий CAPEX-формат
    if (team_size == 1 and fmt == "offline"
            and not p.get("has_premises") and capital_rub < 1_000_000):
        contradictions.append({
            "field_a": "team_size",
            "field_b": "format",
            "description": (
                "Открыть офлайн-точку в одиночку без собственного "
                "помещения и при капитале до 1 млн очень сложно: "
                "аренда + оборудование + операционка = постоянный "
                "дефицит внимания и денег."
            ),
            "severity": "warning",
        })

    return {
        **state,
        "contradictions": contradictions,
        "generation_warnings": warnings,
    }


# ══════════════════════════════════════════════════════════════════════
# NODE 2 — Генератор кандидатов
# ══════════════════════════════════════════════════════════════════════

GENERATOR_PROMPT = """Ты — опытный бизнес-консультант с 20-летним стажем. Твоя задача — сгенерировать ровно 10 реалистичных бизнес-идей для конкретного предпринимателя.

═══════════════════════════════════════════════════════════════════════════════════════
ПРОФИЛЬ ПРЕДПРИНИМАТЕЛЯ
═══════════════════════════════════════════════════════════════════════════════════════
• КАПИТАЛ: {capital_range} (~{capital_rub} руб)
• ФОРМАТ: {format} (online/offline/hybrid)
• ГОРОД: {city} (тир {city_tier})
• ЦЕЛЕВЫЕ КЛИЕНТЫ: {business_type}
• КОМАНДА: {team_size} (~{team_num} человек)
• ГОРИЗОНТ ОКУПАЕМОСТИ: {payback_period} месяцев (макс {payback_max})
• ОПЫТ: {experience}
• КАТЕГОРИЧЕСКИ ИСКЛЮЧИТЬ: {exclusions}
• TECH-УРОВЕНЬ: {tech_level}
• РИСК-ПРОФИЛЬ: {risk_profile}
• ОСНОВНОЙ ДОХОД: {is_main_income}
• РЕСУРСЫ: клиенты={has_clients}, помещение={has_premises}, партнёры={has_partners}

ИЗВЕСТНЫЕ ПРОТИВОРЕЧИЯ В ПРОФИЛЕ:
{contradictions_summary}

═══════════════════════════════════════════════════════════════════════════════════════
ЖЁСТКИЕ ПРАВИЛА ГЕНЕРАЦИИ
═══════════════════════════════════════════════════════════════════════════════════════

1. РОВНО 10 ИДЕЙ разных ниш. Без дубликатов, без вариаций одной идеи.

2. АБСОЛЮТНЫЙ ЗАПРЕТ НА ИСКЛЮЧЕНИЯ:
   - Ни одна идея НЕ должна касаться запрещённых сфер даже косвенно
   - Если исключение "общепит" → НЕТ: ресторан, кафе, доставка еды, производство полуфабрикатов
   - Если исключение "строительство" → НЕТ: ремонт, отделка, строймеханизм
   - Проверяй название и описание два раза перед выводом

3. ОПЫТ И ИСКЛЮЧЕНИЯ (если пересекаются):
   - Пользователь имеет опыт в запрещённой для себя сфере
   - Используй НАВЫКИ, но не саму сферу
   - Пример: опыт "продажи в розницу" + исключение "магазины" → идея "B2B маркетплейс для оптовой торговли"

4. РАЗНООБРАЗИЕ ПО ТИПАМ:
   - Минимум 2 идеи с прямым применением опыта (если не конфликтует с исключениями)
   - Минимум 1 нестандартная, неочевидная идея
   - Остальное: смешанные идеи по нишам

5. ФИНАНСОВЫЕ ОГРАНИЧЕНИЯ:
   - Стартовые затраты (estimated_capital_min) ≤ 85% от {capital_rub}
   - Фиксированные расходы (estimated_monthly_fixed) должны окупаться за {payback_max} месяцев
   - Минимум компоненты: equipment 60%, inventory 20%, rent/prep 15%, working capital 5%

6. КОМАНДА:
   - Мин. команда на старте (estimated_team_min) ≤ {team_num} человек
   - При одиночке ({team_num}=1): максимум 2 человека на старте (себя + 1 помощник)

7. ГЕОГРАФИЧЕСКИЕ МНОЖИТЕЛИ для города тира {city_tier}:
   - Тир 1 (Москва/СПб): чек +40-50%, аренда ×2-3, конкуренция высокая, зато рынок большой
   - Тир 2 (регионы): норма, умеренная конкуренция, хороший рынок
   - Тир 3 (малые города): чек -20-30%, аренда ÷2, конкуренция низкая, но рынок мал

8. ОФЛАЙН/ГИБРИД:
   - Если format="offline" и {city_tier}=3: очень аккуратно, нужен местный спрос
   - Если format="offline" и {capital_rub}<500k: скорее всего невозможно, рекомендовать online/hybrid

9. РЕАЛИСТИЧНОСТЬ:
   - Не генерируй идеи в очень перенасыщенных нишах без УТП
   - Проверяй наличие реальных аналогов/конкурентов
   - Указывай конкретные риски, а не общие фразы

10. ЛИЦЕНЗИИ:
    - Указывай requires_license=true, если нужны разрешения/лицензии
    - Типы: пищевая промышленность, медицина, образование, алкоголь, строительство

═══════════════════════════════════════════════════════════════════════════════════════
JSON ФОРМАТ (ТОЛЬКО МАССИВ, БЕЗ MARKDOWN)
═══════════════════════════════════════════════════════════════════════════════════════
[
  {{
    "id": "idea_001",
    "title": "Название бизнеса (3-5 слов максимум)",
    "description": "Полное описание что это, как работает (2-3 предложения, конкретно)",
    "relevance_explanation": "Почему именно эта идея подходит этому человеку (1-2 предложения)",
    "main_risk": "Главный риск с конкретными цифрами/примерами (не общие фразы)",
    "success_factor": "Ключевой фактор успеха (конкретный, проверяемый)",
    "market_analogues": ["Реальный пример 1 (компания/проект)", "Реальный пример 2"],
    "estimated_capital_min": 300000,
    "estimated_monthly_fixed": 80000,
    "estimated_avg_check": 5000,
    "estimated_team_min": 1,
    "requires_license": false,
    "license_type": null,
    "offline_required": false,
    "foot_traffic_dependent": false,
    "logistics_complexity": "low"
  }},
  ...ещё 9 идей...
]

ВАЖНО: Не добавляй никакой текст до/после JSON. Ни комментариев, ни пояснений."""


async def generate_candidates(state: IdeaGenerationState) -> IdeaGenerationState:
    p = state["profile"]
    contradictions = state.get("contradictions", [])

    contradictions_summary = "Нет явных противоречий."
    if contradictions:
        lines = []
        for c in contradictions:
            lines.append(f"• [{c['severity'].upper()}] {c['description']}")
        contradictions_summary = "\n".join(lines)

    capital_rub = CAPITAL_MAP.get(p.get("capital_range", ""), 500_000)
    team_num = TEAM_MAP.get(p.get("team_size", ""), 1)
    payback_max = PAYBACK_MAP.get(p.get("payback_period", ""), 24)

    try:
        prompt = GENERATOR_PROMPT.format(
            capital_range=p.get("capital_range", "не указан"),
            capital_rub=capital_rub,
            format=p.get("format", "не указан"),
            city=p.get("city", "не указан"),
            city_tier=p.get("city_tier", "3"),
            business_type=", ".join(p.get("business_type", [])),
            team_size=p.get("team_size", "1-2"),
            team_num=team_num,
            payback_period=p.get("payback_period", "12"),
            payback_max=payback_max,
            experience=p.get("experience", "не указан"),
            exclusions=p.get("exclusions", "нет"),
            tech_level=p.get("tech_level", "medium"),
            risk_profile=p.get("risk_profile", "moderate"),
            is_main_income=p.get("is_main_income", True),
            has_clients=p.get("has_clients", False),
            has_premises=p.get("has_premises", False),
            has_partners=p.get("has_partners", False),
            contradictions_summary=contradictions_summary,
        )
        resp = await get_router().invoke_heavy(prompt)
        ideas = _parse(resp)
        if not isinstance(ideas, list):
            raise ValueError("Expected JSON array")
        return {**state, "idea_candidates": ideas[:10], "status": "discriminating"}
    except Exception as e:
        return {**state, "errors": [f"generation_failed:{str(e)[:200]}"], "status": "error"}


# ══════════════════════════════════════════════════════════════════════
# NODE 3 — Полный дискриминатор с чеклистом
# ══════════════════════════════════════════════════════════════════════

DISCRIMINATOR_PROMPT = """Ты — строгий аналитик бизнес-идей. Оцени идею по чеклисту из 19 критериев.
Отвечай ТОЛЬКО JSON, без markdown.

═══ ИДЕЯ ═══
Название: {title}
Описание: {description}
Стартовые затраты: {estimated_capital_min} руб.
Фикс. расходы/мес: {estimated_monthly_fixed} руб.
Средний чек: {estimated_avg_check} руб.
Мин. команда: {estimated_team_min} чел.
Лицензия: {requires_license} ({license_type})
Офлайн обязателен: {offline_required}
Зависит от трафика: {foot_traffic_dependent}
Логистика: {logistics_complexity}

═══ ПРОФИЛЬ ═══
Капитал: {capital_range} (~{capital_rub} руб.)
Формат: {format}
Город: {city} (тир {city_tier})
Клиенты: {business_type}
Команда: {team_size} (~{team_num} чел.)
Окупаемость: {payback_period} мес. (макс {payback_max} мес.)
Опыт: {experience}
Исключения: {exclusions}
Риск-профиль: {risk_profile}
Есть помещение: {has_premises}

═══ ЧЕКЛИСТ ═══
Оцени каждый критерий целым числом в диапазоне (0 = провал, максимум указан в скобках).

СТОП-ФАКТОРЫ — если есть хотя бы один, идея дисквалифицируется:
- Идея касается исключений пользователя (даже косвенно)
- Стартовые затраты > 90% капитала
- Требуемая команда > 2× доступной
- Рынок в упадке И высокая конкуренция одновременно
- Окупаемость заведомо > 3× от ожидаемой

БЛОК 1 — ФИНАНСЫ (макс 40 очков):
1. capital_covers_startup (0-10): Стартовые затраты покрываются капиталом с запасом
   0=затраты >90% капитала, 5=затраты 70-90%, 8=затраты 50-70%, 10=затраты <50%
2. payback_realistic (0-8): Срок окупаемости реалистичен
   0=нереально, 4=возможно с трудом, 8=реалистично
3. fixed_costs_covered (0-8): Фикс. расходы покрываются при 50% загрузке
   0=нет, 4=едва, 8=да с запасом
4. variable_costs_reasonable (0-7): Маржинальность на единицу разумна для ниши
   0=убыточна, 4=низкая, 7=хорошая
5. working_capital_exists (0-7): Остаётся оборотный капитал после запуска
   0=нет, 3=минимум, 7=нормальный

БЛОК 2 — РЫНОК (макс 30 очков):
6. market_exists_in_city (0-8): Спрос на продукт/услугу реально есть в этом городе
   0=нет рынка, 4=слабый, 8=явный спрос
7. competition_manageable (0-6): Конкуренция преодолима с данными ресурсами
   0=невозможно, 3=сложно, 6=реально
8. audience_large_enough (0-6): Целевая аудитория достаточна для достижения окупаемости
   0=слишком мало, 3=на грани, 6=достаточно
9. market_trend_ok (0-5): Тренд рынка позитивный или стабильный
   0=падает, 3=стабильно, 5=растёт
10. analogues_exist (0-5): Успешные аналоги существуют на рынке
    0=нет, 3=единичные, 5=много

БЛОК 3 — ОПЕРАЦИИ (макс 20 очков):
11. team_sufficient (0-5): Команда достаточна для запуска
    0=критически не хватает, 3=можно с трудом, 5=достаточно
12. licenses_obtainable (0-4): Лицензии/разрешения получаемы за разумные сроки и деньги
    0=невозможно/дорого, 2=сложно, 4=стандартно
13. suppliers_available (0-4): Поставщики/подрядчики доступны в регионе
    0=нет, 2=есть с трудом, 4=легко найти
14. tech_level_match (0-4): Технологическая сложность соответствует уровню пользователя
    0=не соответствует, 2=с натяжкой, 4=соответствует
15. risk_profile_match (0-3): Уровень риска соответствует риск-профилю пользователя
    0=не соответствует, 2=частично, 3=соответствует

БЛОК 4 — ЛОКАЦИЯ (макс 10 очков, для online ставь максимум если не нужно физическое присутствие):
16. rent_affordable (0-3): Аренда в городе вписывается в бюджет
    0=аренда недоступна, 2=дорого, 3=доступно
17. foot_traffic_available (0-3): Доступен нужный поток людей в городе
    0=нет трафика, 2=частично, 3=есть
18. logistics_feasible (0-2): Логистика поставок/доставки реалистична
    0=нереально, 1=сложно, 2=реалистично
19. infrastructure_ok (0-2): Базовая инфраструктура (электричество, интернет, склад) доступна
    0=нет, 1=частично, 2=есть

Флаги (добавляй только релевантные):
financial: capital_tight, capital_insufficient, payback_too_long, high_fixed_costs, seasonal_cashflow, low_margin
market: high_competition, market_saturated, market_too_small, market_declining, geography_mismatch, b2b_mismatch, niche_unproven
ops: license_required, license_medical, license_education, license_alcohol, license_construction, team_insufficient, experience_gap, high_ops_complexity, supplier_risk
location: high_rent, low_foot_traffic, logistics_complex, infrastructure_gap

JSON-ответ:
{{
  "capital_covers_startup": 8,
  "payback_realistic": 6,
  "fixed_costs_covered": 7,
  "variable_costs_reasonable": 5,
  "working_capital_exists": 5,
  "market_exists_in_city": 7,
  "competition_manageable": 4,
  "audience_large_enough": 5,
  "market_trend_ok": 4,
  "analogues_exist": 4,
  "team_sufficient": 4,
  "licenses_obtainable": 4,
  "suppliers_available": 4,
  "tech_level_match": 3,
  "risk_profile_match": 3,
  "rent_affordable": 2,
  "foot_traffic_available": 2,
  "logistics_feasible": 2,
  "infrastructure_ok": 2,
  "stop_factors": [],
  "fail_reasons": [],
  "flags": ["high_competition"],
  "realism_warnings": ["Конкуренция в нише высокая, потребуется чёткое УТП"],
  "verdict": "pass"
}}"""


def _capital_to_rub(capital_range: str) -> int:
    return CAPITAL_MAP.get(capital_range, 500_000)


def _team_to_num(team_size: str) -> int:
    return TEAM_MAP.get(team_size, 1)


def _payback_to_months(payback_period: str) -> int:
    return PAYBACK_MAP.get(payback_period, 24)


def _check_stop_factors_deterministic(idea: dict, profile: dict) -> list[str]:
    """Детерминированная проверка стоп-факторов до вызова LLM."""
    stops = []
    capital_rub = _capital_to_rub(profile.get("capital_range", ""))
    team_num = _team_to_num(profile.get("team_size", ""))
    exclusions = (profile.get("exclusions") or "").lower()
    experience = (profile.get("experience") or "").lower()

    # Стартовые затраты > 95% капитала
    if idea.get("estimated_capital_min", 0) > capital_rub * 0.95:
        stops.append("capital_insufficient_hard")

    # Команда > 3× доступной
    if idea.get("estimated_team_min", 1) > team_num * 3:
        stops.append("team_impossible")

    # Прямое попадание в исключения (ключевые слова)
    title_desc = (idea.get("title", "") + " " +
                  idea.get("description", "")).lower()
    exclusion_keywords = [w.strip()
                          for w in exclusions.split(",") if len(w.strip()) > 2]
    for kw in exclusion_keywords:
        if kw and kw in title_desc:
            stops.append(f"matches_exclusion:{kw}")
            break

    return stops


async def _discriminate_idea(idea: dict, profile: dict) -> dict:
    """Полный чеклист для одной идеи."""
    # Сначала быстрая детерминированная проверка
    det_stops = _check_stop_factors_deterministic(idea, profile)

    capital_rub = _capital_to_rub(profile.get("capital_range", ""))
    team_num = _team_to_num(profile.get("team_size", ""))
    payback_max = _payback_to_months(profile.get("payback_period", ""))

    try:
        prompt = DISCRIMINATOR_PROMPT.format(
            title=idea.get("title", ""),
            description=idea.get("description", ""),
            estimated_capital_min=idea.get("estimated_capital_min", 0),
            estimated_monthly_fixed=idea.get("estimated_monthly_fixed", 0),
            estimated_avg_check=idea.get("estimated_avg_check", 0),
            estimated_team_min=idea.get("estimated_team_min", 1),
            requires_license=idea.get("requires_license", False),
            license_type=idea.get("license_type", "нет"),
            offline_required=idea.get("offline_required", False),
            foot_traffic_dependent=idea.get("foot_traffic_dependent", False),
            logistics_complexity=idea.get("logistics_complexity", "low"),
            capital_range=profile.get("capital_range", ""),
            capital_rub=capital_rub,
            format=profile.get("format", ""),
            city=profile.get("city", "не указан"),
            city_tier=profile.get("city_tier", "3"),
            business_type=", ".join(profile.get("business_type", [])),
            team_size=profile.get("team_size", ""),
            team_num=team_num,
            payback_period=profile.get("payback_period", "12"),
            payback_max=payback_max,
            experience=profile.get("experience", "не указан"),
            exclusions=profile.get("exclusions", "нет"),
            risk_profile=profile.get("risk_profile", "moderate"),
            has_premises=profile.get("has_premises", False),
        )
        resp = await get_llm().ainvoke(prompt)
        r = _parse(resp.content)
    except Exception:
        # Fallback — нейтральные оценки
        r = {
            "capital_covers_startup": 5, "payback_realistic": 5,
            "fixed_costs_covered": 5, "variable_costs_reasonable": 5,
            "working_capital_exists": 5, "market_exists_in_city": 5,
            "competition_manageable": 4, "audience_large_enough": 4,
            "market_trend_ok": 3, "analogues_exist": 3,
            "team_sufficient": 4, "licenses_obtainable": 4,
            "suppliers_available": 4, "tech_level_match": 3,
            "risk_profile_match": 3, "rent_affordable": 2,
            "foot_traffic_available": 2, "logistics_feasible": 2,
            "infrastructure_ok": 2,
            "stop_factors": [], "fail_reasons": [],
            "flags": [], "realism_warnings": [], "verdict": "warn",
        }

    # Добавляем детерминированные стоп-факторы
    all_stops = list(set(r.get("stop_factors", []) + det_stops))
    if all_stops:
        r["stop_factors"] = all_stops
        r["verdict"] = "fail"

    # Считаем итоговый скор
    score_fields = [
        "capital_covers_startup", "payback_realistic", "fixed_costs_covered",
        "variable_costs_reasonable", "working_capital_exists",
        "market_exists_in_city", "competition_manageable", "audience_large_enough",
        "market_trend_ok", "analogues_exist",
        "team_sufficient", "licenses_obtainable", "suppliers_available",
        "tech_level_match", "risk_profile_match",
        "rent_affordable", "foot_traffic_available", "logistics_feasible",
        "infrastructure_ok",
    ]
    total = sum(int(r.get(f, 0)) for f in score_fields)

    # Автоматический verdict по скору если LLM не поставил fail
    if r.get("verdict") != "fail":
        if total >= 75:
            r["verdict"] = "pass"
        elif total >= 50:
            r["verdict"] = "warn"
        else:
            r["verdict"] = "fail"
            r.setdefault("fail_reasons", []).append(f"low_total_score:{total}")

    r["total_score"] = total

    # Разбивка по блокам для совместимости с фронтендом
    fin_score = sum(int(r.get(f, 0)) for f in [
        "capital_covers_startup", "payback_realistic",
        "fixed_costs_covered", "variable_costs_reasonable", "working_capital_exists"
    ])
    mkt_score = sum(int(r.get(f, 0)) for f in [
        "market_exists_in_city", "competition_manageable",
        "audience_large_enough", "market_trend_ok", "analogues_exist"
    ])
    ops_score = sum(int(r.get(f, 0)) for f in [
        "team_sufficient", "licenses_obtainable",
        "suppliers_available", "tech_level_match", "risk_profile_match"
    ])
    loc_score = sum(int(r.get(f, 0)) for f in [
        "rent_affordable", "foot_traffic_available",
        "logistics_feasible", "infrastructure_ok"
    ])

    def block_verdict(s, mx):
        pct = s / mx if mx > 0 else 0
        if pct >= 0.75:
            return "pass"
        if pct >= 0.50:
            return "warn"
        return "fail"

    r["financial_score"] = fin_score
    r["financial_verdict"] = block_verdict(fin_score, 40)
    r["market_score"] = mkt_score
    r["market_verdict"] = block_verdict(mkt_score, 30)
    r["ops_score"] = ops_score
    r["ops_verdict"] = block_verdict(ops_score, 20)
    r["location_score"] = loc_score
    r["location_verdict"] = block_verdict(loc_score, 10)

    return r


async def run_discriminators(state: IdeaGenerationState) -> IdeaGenerationState:
    profile = state["profile"]
    candidates = state["idea_candidates"]

    results = await asyncio.gather(
        *[_discriminate_idea(idea, profile) for idea in candidates],
        return_exceptions=True,
    )

    scored = []
    for idea, result in zip(candidates, results):
        if isinstance(result, Exception):
            result = {"verdict": "warn", "total_score": 40,
                      "flags": [], "realism_warnings": []}
        scored.append({
            **idea,
            "checklist": result,
            "financial_score":   result.get("financial_score", 0),
            "financial_verdict": result.get("financial_verdict", "warn"),
            "market_score":      result.get("market_score", 0),
            "market_verdict":    result.get("market_verdict", "warn"),
            "ops_score":         result.get("ops_score", 0),
            "ops_verdict":       result.get("ops_verdict", "warn"),
            "location_score":    result.get("location_score", 0),
            "location_verdict":  result.get("location_verdict", "warn"),
            "disc_total_score":  result.get("total_score", 40),
            "disc_verdict":      result.get("verdict", "warn"),
            "disc_flags":        result.get("flags", []),
            "disc_stops":        result.get("stop_factors", []),
            "realism_warnings":  result.get("realism_warnings", []),
        })

    return {**state, "idea_candidates": scored}


# ══════════════════════════════════════════════════════════════════════
# NODE 4 — Агрегация, стоп-факторы, сортировка
# ══════════════════════════════════════════════════════════════════════

def aggregate_scores(state: IdeaGenerationState) -> IdeaGenerationState:
    filtered = []
    for idea in state["idea_candidates"]:
        verdict = idea.get("disc_verdict", "warn")
        stops = idea.get("disc_stops", [])

        # Твёрдые стоп-факторы → идея отсеивается
        if verdict == "fail" or stops:
            continue

        # Два и более блока с вердиктом "fail" → отсев
        block_fails = sum(
            1 for v in [
                idea.get("financial_verdict"),
                idea.get("market_verdict"),
                idea.get("ops_verdict"),
            ] if v == "fail"
        )
        if block_fails >= 2:
            continue

        all_flags = list(set(idea.get("disc_flags", [])))
        filtered.append({
            **idea,
            "total_score": idea.get("disc_total_score", 50),
            "all_flags": all_flags,
        })

    # Сортировка: сначала pass-вердикт, потом по скору
    def sort_key(x):
        verdict_order = {"pass": 0, "warn": 1, "fail": 2}
        return (verdict_order.get(x.get("disc_verdict", "warn"), 1), -x.get("total_score", 0))

    filtered.sort(key=sort_key)
    top = filtered[:8]  # Топ-8

    all_flags = list(set(f for idea in top for f in idea.get("all_flags", [])))
    return {**state, "idea_candidates": top, "all_flags": all_flags}


# ══════════════════════════════════════════════════════════════════════
# NODE 5 — Обогащение карточек
# ══════════════════════════════════════════════════════════════════════

ENRICH_PROMPT = """Обогати карточку бизнес-идеи. Отвечай ТОЛЬКО JSON без markdown.

ИДЕЯ: {title}. {description}
Скор: {score}/100. Риски: {flags}

{{"tagline":"Яркий слоган 7-10 слов","why_for_you":"2 предложения почему подходит","difficulty":"easy|medium|hard","trend":"growing|stable|declining","unique_angle":"В чём выделиться среди конкурентов (конкретно)"}}"""


async def enrich_cards(state: IdeaGenerationState) -> IdeaGenerationState:
    async def enrich_one(idea: dict) -> dict:
        try:
            resp = await get_router().invoke_fast(ENRICH_PROMPT.format(
    title=idea.get("title", ""),
    description=idea.get("description", ""),
    score=idea.get("total_score", 50),
    flags=", ".join(idea.get("all_flags", [])) or "нет",
))
            extra = _parse(resp)
            return {**idea, **extra}
        except Exception:
            return idea

    enriched = await asyncio.gather(*[enrich_one(i) for i in state["idea_candidates"]])
    return {**state, "idea_candidates": list(enriched), "status": "done"}


# ══════════════════════════════════════════════════════════════════════
# Граф
# ══════════════════════════════════════════════════════════════════════

def route_after_generation(state: IdeaGenerationState) -> str:
    return END if state.get("status") == "error" else "run_discriminators"


def build_idea_generation_graph():
    g = StateGraph(IdeaGenerationState)
    g.add_node("check_contradictions",  check_contradictions)
    g.add_node("generate_candidates",   generate_candidates)
    g.add_node("run_discriminators",    run_discriminators)
    g.add_node("aggregate_scores",      aggregate_scores)
    g.add_node("enrich_cards",          enrich_cards)

    g.set_entry_point("check_contradictions")
    g.add_edge("check_contradictions", "generate_candidates")
    g.add_conditional_edges("generate_candidates", route_after_generation, {
        "run_discriminators": "run_discriminators",
        END: END,
    })
    g.add_edge("run_discriminators", "aggregate_scores")
    g.add_edge("aggregate_scores",   "enrich_cards")
    g.add_edge("enrich_cards",       END)
    return g.compile()


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_idea_generation_graph()
    return _graph


async def run_idea_generation(user_id: str, session_id: str, profile: dict) -> dict:
    return await get_graph().ainvoke({
        "user_id":             user_id,
        "session_id":          session_id,
        "profile":             profile,
        "contradictions":      [],
        "idea_candidates":     [],
        "all_flags":           [],
        "generation_warnings": [],
        "errors":              [],
        "status":              "generating",
    })
