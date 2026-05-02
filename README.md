# NEXUS — AI Бизнес-платформа

> Telegram MiniApp на базе LangGraph + Claude. Заполни профиль за 2 минуты — получи 6 бизнес-идей с финансовыми моделями, прошедших через 3 параллельных AI-дискриминатора.

[![Python](https://img.shields.io/badge/Python-3.11-3776ab?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2-1c3c3c)](https://langchain-ai.github.io/langgraph)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev)

---

## Архитектура

```
Telegram MiniApp (React + TypeScript)
         │  initData HMAC
         ▼
    FastAPI Backend
         │
    ┌────┴──────────────────────────────┐
    │          LangGraph Graphs         │
    │                                   │
    │  OnboardingGraph                  │
    │    validate → enrich → completeness│
    │                                   │
    │  IdeaGenerationGraph              │
    │    generate(12) →                 │
    │      [fin_disc ─┐                 │
    │       mkt_disc ─┼─ parallel]      │
    │       ops_disc ─┘                 │
    │    aggregate → enrich_cards       │
    │                                   │
    │  FinancialModelGraph              │
    │    assumptions → scenarios        │
    │    → unit_economics → validate    │
    └───────────────────────────────────┘
         │
    PostgreSQL  Redis
```

---

## Стек

| Слой | Технология |
|---|---|
| Frontend | React 18, TypeScript, Vite, CSS Variables |
| Backend | FastAPI 0.111, SQLAlchemy 2 async, Pydantic v2 |
| AI | LangGraph 0.2, LangChain, Claude Sonnet (Anthropic) |
| Auth | Telegram WebApp HMAC-SHA256 + JWT |
| DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Deploy | Docker Compose, Nginx |

---

## Запуск

### 1. Клонирование
```bash
git clone https://github.com/bald-monkey-perapinak/nexus
cd nexus
```

### 2. Конфиг
```bash
cp .env.example .env
# Заполните: BOT_TOKEN, ANTHROPIC_API_KEY, WEBAPP_URL, JWT_SECRET
```

### 3. Docker
```bash
docker compose up -d db redis
# Затем для разработки:
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

cd frontend && npm install && npm run dev

# Бот:
cd bot && pip install python-telegram-bot python-dotenv
python bot.py
```

### 4. ngrok (для Telegram WebApp)
```bash
ngrok http 5173
# Скопируйте https://xxx.ngrok-free.app в WEBAPP_URL
```

---

## LangGraph Графы

### OnboardingGraph
```
validate_input → enrich_profile (Claude) → calculate_completeness
```
Нормализует сырой ввод, определяет city_tier и segment.

### IdeaGenerationGraph
```
generate_candidates (Claude, 8 идей)
    └─→ run_discriminators (3x параллельно):
          ├─ financial_discriminator
          ├─ market_discriminator  
          └─ ops_discriminator
    └─→ aggregate_scores (режем по правилам)
    └─→ enrich_cards (tagline, difficulty, trend)
```

Правила агрегации:
- Любой `fail` → идея режется
- 2+ `warn` → идея режется  
- Итоговый скор: финансы 40% + рынок 40% + операции 20%

### FinancialModelGraph
```
generate_base_assumptions (Claude)
    └─→ calculate_scenarios (чистая математика)
    └─→ generate_unit_economics (Claude: CAC/LTV)
    └─→ validate_model (правила)
```

---

## API

| Метод | Эндпоинт | Описание |
|---|---|---|
| POST | `/api/auth/telegram` | Аутентификация через Telegram |
| POST | `/api/profile` | Сохранить профиль |
| GET | `/api/profile` | Получить профиль |
| POST | `/api/ideas/generate` | Запустить генерацию |
| GET | `/api/ideas/session/{id}` | Статус генерации |
| POST | `/api/ideas/session/{id}/select/{idea_id}` | Выбрать идею |
| POST | `/api/financial/model/{session}/{idea}` | Создать/пересчитать финмодель |
| GET | `/api/financial/model/{session}/{idea}` | Получить финмодель |

---

## Структура проекта

```
nexus/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI + lifespan
│   │   ├── config.py        # Settings
│   │   ├── database.py      # SQLAlchemy + models
│   │   ├── auth.py          # HMAC + JWT
│   │   ├── state.py         # LangGraph TypedDicts
│   │   ├── onboarding.py    # OnboardingGraph
│   │   ├── ideas.py         # IdeaGenerationGraph
│   │   ├── financial.py     # FinancialModelGraph
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── profile.py
│   │       ├── ideas.py
│   │       └── financial.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Главный роутер экранов
│   │   ├── api.ts           # HTTP клиент
│   │   ├── telegram.ts      # Telegram WebApp SDK
│   │   ├── types.ts         # TypeScript интерфейсы
│   │   ├── index.css        # Bauhaus design system
│   │   └── components/
│   │       ├── Icons.tsx    # Геометрические SVG
│   │       ├── Splash.tsx
│   │       ├── Onboarding.tsx
│   │       ├── Generating.tsx
│   │       ├── IdeasList.tsx
│   │       ├── IdeaDetail.tsx
│   │       └── FinancialModel.tsx
│   ├── Dockerfile
│   └── nginx.conf
├── bot/
│   ├── bot.py
│   └── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## Дизайн

Геометрический Bauhaus-стиль. Кремовый фон, красная сетка, монопространственный шрифт Space Mono, заголовки DM Serif Display. Вдохновлён конструктивистскими плакатами.

---

## Roadmap

- [ ] Граф 5 — Валидация гипотез (CustDev скрипт + MVP-тест)
- [ ] Граф 6 — Роадмап на 90 дней с флаговыми задачами
- [ ] Граф 7 — Документы и регуляторика
- [ ] Граф 8 — Еженедельный мониторинг (цикличный граф)
- [ ] Tavily web search для рыночной аналитики
- [ ] PostgreSQL checkpointer для персистентности LangGraph
