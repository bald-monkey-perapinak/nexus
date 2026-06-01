"""
NEXUS · LLM Router
Умная ротация провайдеров: Groq → Gemini → OpenRouter
Автоматический fallback при rate limit (429) или ошибке.
"""

import asyncio
import time
import structlog
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
from langchain_core.language_models import BaseChatModel
from langchain_groq import ChatGroq

log = structlog.get_logger()


class ProviderStatus(Enum):
    OK = "ok"
    RATE_LIMITED = "rate_limited"
    ERROR = "error"
    UNAVAILABLE = "unavailable"


@dataclass
class ProviderState:
    name: str
    status: ProviderStatus = ProviderStatus.OK
    failed_at: float = 0.0
    fail_count: int = 0
    # Сколько секунд ждать после rate limit
    cooldown_sec: int = 60


class LLMRouter:
    """
    Роутер с автоматическим fallback между провайдерами.
    
    Порядок для тяжёлых запросов (70b):
      1. Groq llama-3.3-70b
      2. Gemini Flash (если настроен)
      3. OpenRouter llama-70b (если настроен)
    
    Порядок для лёгких запросов (дискриминаторы):
      1. Groq llama-3.1-8b
      2. OpenRouter mistral-7b (если настроен)
      3. Gemini Flash (если настроен)
    """

    def __init__(self, settings):
        self.settings = settings
        self._states: dict[str, ProviderState] = {}
        self._lock = asyncio.Lock()
        self._build_providers()

    def _build_providers(self):
        s = self.settings

        # --- Тяжёлые модели (генерация, финмодель, роадмап) ---
        self._heavy: list[tuple[str, callable]] = []

        # 1. Groq 70b
        if s.GROQ_API_KEY:
            self._heavy.append(("groq_70b", lambda api_key=s.GROQ_API_KEY: ChatGroq(
                model=s.GROQ_MODEL,
                api_key=api_key,
                temperature=0.7,
                max_tokens=4096,
            )))
            self._states["groq_70b"] = ProviderState("groq_70b", cooldown_sec=65)

        # 2. Gemini Flash
        if s.GEMINI_API_KEY:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self._heavy.append(("gemini_flash", lambda google_api_key=s.GEMINI_API_KEY: ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash-latest",
                    google_api_key=google_api_key,
                    temperature=0.7,
                    max_output_tokens=4096,
                )))
                self._states["gemini_flash"] = ProviderState("gemini_flash", cooldown_sec=30)
                log.info("Gemini Flash provider enabled")
            except ImportError:
                log.warning("langchain-google-genai not installed, Gemini disabled")

        # 3. OpenRouter (через OpenAI-совместимый API)
        if s.OPENROUTER_API_KEY:
            try:
                from langchain_openai import ChatOpenAI
                self._heavy.append(("openrouter_70b", lambda api_key=s.OPENROUTER_API_KEY: ChatOpenAI(
                    model="mistralai/mistral-7b-instruct:free",
                    base_url="https://openrouter.ai/api/v1",
                    api_key=api_key,
                    temperature=0.7,
                    max_tokens=4096,
                    default_headers={
                        "HTTP-Referer": "https://nexus.app",
                        "X-Title": "Nexus Business Platform",
                    },
                )))
                self._states["openrouter_70b"] = ProviderState("openrouter_70b", cooldown_sec=10)
                log.info("OpenRouter 70b provider enabled")
            except ImportError:
                log.warning("langchain-openai not installed, OpenRouter disabled")

        # --- Лёгкие модели (дискриминаторы, обогащение) ---
        self._fast: list[tuple[str, callable]] = []

        # 1. Groq 8b
        if s.GROQ_API_KEY:
            self._fast.append(("groq_8b", lambda api_key=s.GROQ_API_KEY: ChatGroq(
                model=s.GROQ_MODEL_FAST,
                api_key=api_key,
                temperature=0.1,
                max_tokens=600,
            )))
            self._states["groq_8b"] = ProviderState("groq_8b", cooldown_sec=65)

        # 2. OpenRouter Mistral (бесплатный)
        if s.OPENROUTER_API_KEY:
            try:
                from langchain_openai import ChatOpenAI
                self._fast.append(("openrouter_mistral", lambda api_key=s.OPENROUTER_API_KEY: ChatOpenAI(
                    model="mistralai/mistral-7b-instruct:free",
                    base_url="https://openrouter.ai/api/v1",
                    api_key=api_key,
                    temperature=0.1,
                    max_tokens=600,
                    default_headers={
                        "HTTP-Referer": "https://nexus.app",
                        "X-Title": "Nexus Business Platform",
                    },
                )))
                self._states["openrouter_mistral"] = ProviderState("openrouter_mistral", cooldown_sec=10)
            except ImportError:
                pass

        # 3. Gemini Flash как fallback для лёгких тоже
        if s.GEMINI_API_KEY:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self._fast.append(("gemini_flash_fast", lambda google_api_key=s.GEMINI_API_KEY: ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash-latest",
                    google_api_key=google_api_key,
                    temperature=0.1,
                    max_output_tokens=600,
                )))
                self._states["gemini_flash_fast"] = ProviderState("gemini_flash_fast", cooldown_sec=30)
            except ImportError:
                pass

        log.info(
            "LLM Router initialized",
            heavy_providers=[n for n, _ in self._heavy],
            fast_providers=[n for n, _ in self._fast],
        )

    def _is_available(self, state: ProviderState) -> bool:
        if state.status == ProviderStatus.OK:
            return True
        if state.status == ProviderStatus.RATE_LIMITED:
            if time.time() - state.failed_at > state.cooldown_sec:
                state.status = ProviderStatus.OK
                state.fail_count = 0
                log.info("Provider recovered", provider=state.name)
                return True
            return False
        if state.status == ProviderStatus.ERROR:
            # После 3 ошибок — пауза 5 минут
            if state.fail_count >= 3 and time.time() - state.failed_at < 300:
                return False
            return True
        return False

    def _mark_rate_limited(self, name: str):
        if name in self._states:
            s = self._states[name]
            s.status = ProviderStatus.RATE_LIMITED
            s.failed_at = time.time()
            log.warning("Provider rate limited", provider=name, cooldown=s.cooldown_sec)

    def _mark_error(self, name: str, error: str):
        if name in self._states:
            s = self._states[name]
            s.status = ProviderStatus.ERROR
            s.failed_at = time.time()
            s.fail_count += 1
            log.error("Provider error", provider=name, error=error, fail_count=s.fail_count)

    def _mark_ok(self, name: str):
        if name in self._states:
            s = self._states[name]
            if s.status != ProviderStatus.OK:
                log.info("Provider back to OK", provider=name)
            s.status = ProviderStatus.OK
            s.fail_count = 0

    def _is_rate_limit_error(self, error: Exception) -> bool:
        msg = str(error).lower()
        return any(x in msg for x in ["429", "rate limit", "rate_limit", "quota", "too many requests"])

    async def invoke_heavy(self, prompt: str, temperature: float = 0.7, max_tokens: int = 4096) -> str:
        """Вызов тяжёлой модели с автоматическим fallback."""
        return await self._invoke_with_fallback(
            self._heavy, prompt, temperature, max_tokens, "heavy"
        )

    async def invoke_fast(self, prompt: str, temperature: float = 0.1, max_tokens: int = 600) -> str:
        """Вызов лёгкой модели с автоматическим fallback."""
        return await self._invoke_with_fallback(
            self._fast, prompt, temperature, max_tokens, "fast"
        )

    async def _invoke_with_fallback(
        self,
        providers: list[tuple[str, callable]],
        prompt: str,
        temperature: float,
        max_tokens: int,
        tier: str,
    ) -> str:
        last_error = None

        for name, factory in providers:
            state = self._states.get(name)
            if state and not self._is_available(state):
                log.debug("Skipping unavailable provider", provider=name, tier=tier)
                continue

            try:
                log.debug("Trying provider", provider=name, tier=tier)
                llm = factory()
                resp = await llm.ainvoke(prompt)
                content = resp.content if hasattr(resp, "content") else str(resp)
                self._mark_ok(name)
                log.debug("Provider success", provider=name, tier=tier)
                return content

            except Exception as e:
                last_error = e
                if self._is_rate_limit_error(e):
                    self._mark_rate_limited(name)
                else:
                    self._mark_error(name, str(e)[:100])
                log.warning("Provider failed, trying next", provider=name, error=str(e)[:100])
                continue

        # Все провайдеры недоступны
        raise RuntimeError(
            f"All {tier} LLM providers exhausted. Last error: {last_error}"
        )

    def get_status(self) -> dict:
        """Статус всех провайдеров — для health endpoint."""
        return {
            name: {
                "status": state.status.value,
                "fail_count": state.fail_count,
                "cooldown_remaining": max(0, round(
                    state.cooldown_sec - (time.time() - state.failed_at)
                )) if state.status == ProviderStatus.RATE_LIMITED else 0,
            }
            for name, state in self._states.items()
        }


# Singleton — инициализируется при старте приложения
_router: Optional[LLMRouter] = None


def init_router(settings) -> LLMRouter:
    global _router
    _router = LLMRouter(settings)
    return _router


def get_router() -> LLMRouter:
    if _router is None:
        raise RuntimeError("LLM Router not initialized. Call init_router() first.")
    return _router
