"""
NEXUS · LLM Router (stable production version)

Strategy:
  1. Gemini Flash (primary)
  2. Groq (fast fallback)
  3. OpenRouter (optional best-effort)

Guarantee:
→ No provider can crash the system
"""

import asyncio
import time
import structlog
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Callable

from langchain_core.language_models import BaseChatModel

log = structlog.get_logger()


# =========================================================
# STATUS
# =========================================================

class ProviderStatus(Enum):
    OK = "ok"
    RATE_LIMITED = "rate_limited"
    ERROR = "error"


@dataclass
class ProviderState:
    name: str
    status: ProviderStatus = ProviderStatus.OK
    fail_count: int = 0
    failed_at: float = 0.0
    cooldown_sec: int = 30


# =========================================================
# ROUTER
# =========================================================

class LLMRouter:
    def __init__(self, settings):
        self.settings = settings
        self._states: dict[str, ProviderState] = {}
        self._heavy: list[tuple[str, Callable[[], BaseChatModel]]] = []
        self._build_providers()

    # =========================================================
    # BUILD PROVIDERS
    # =========================================================

    def _build_providers(self):
        s = self.settings

        # -------------------------
        # 1. GEMINI (PRIMARY)
        # -------------------------
        if getattr(s, "GEMINI_API_KEY", None):
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI

                def gemini_factory():
                    return ChatGoogleGenerativeAI(
                        model="gemini-1.5-flash-latest",
                        google_api_key=s.GEMINI_API_KEY,
                        temperature=0.7,
                        max_output_tokens=4096,
                    )

                self._heavy.append(("gemini", gemini_factory))
                self._states["gemini"] = ProviderState("gemini", cooldown_sec=10)

                log.info("Gemini enabled")

            except ImportError:
                log.warning("Gemini library not installed")

        # -------------------------
        # 2. GROQ (FALLBACK)
        # -------------------------
        if getattr(s, "GROQ_API_KEY", None):
            from langchain_groq import ChatGroq

            def groq_factory():
                return ChatGroq(
                    model=s.GROQ_MODEL,
                    api_key=s.GROQ_API_KEY,
                    temperature=0.7,
                    max_tokens=4096,
                )

            self._heavy.append(("groq", groq_factory))
            self._states["groq"] = ProviderState("groq", cooldown_sec=60)

            log.info("Groq enabled")

        # -------------------------
        # 3. OPENROUTER (BEST EFFORT)
        # -------------------------
        if getattr(s, "OPENROUTER_API_KEY", None):
            try:
                from langchain_openai import ChatOpenAI

                OPENROUTER_MODELS = [
                    "mistralai/mistral-7b-instruct",
                    "google/gemma-2-9b-it",
                    "meta-llama/llama-3.1-8b-instruct",
                ]

                def openrouter_factory():
                    last_err = None

                    for model in OPENROUTER_MODELS:
                        try:
                            return ChatOpenAI(
                                model=model,
                                base_url="https://openrouter.ai/api/v1",
                                api_key=s.OPENROUTER_API_KEY,
                                temperature=0.7,
                                max_tokens=4096,
                                default_headers={
                                    "HTTP-Referer": "https://nexus.app",
                                    "X-Title": "Nexus",
                                },
                            )
                        except Exception as e:
                            last_err = e
                            continue

                    raise RuntimeError(f"OpenRouter failed: {last_err}")

                self._heavy.append(("openrouter", openrouter_factory))
                self._states["openrouter"] = ProviderState("openrouter", cooldown_sec=15)

                log.info("OpenRouter enabled")

            except ImportError:
                log.warning("OpenRouter library not installed")

        log.info("LLM Router ready", providers=[p[0] for p in self._heavy])

    # =========================================================
    # PUBLIC API (COMPATIBLE)
    # =========================================================

    async def invoke(self, prompt: str) -> str:
        return await self._invoke(prompt)

    async def invoke_heavy(self, prompt: str) -> str:
        return await self._invoke(prompt)

    async def invoke_fast(self, prompt: str) -> str:
        return await self._invoke(prompt)

    # =========================================================
    # CORE LOGIC
    # =========================================================

    async def _invoke(self, prompt: str) -> str:
        last_error = None

        for name, factory in self._heavy:
            state = self._states.get(name)

            if state and not self._is_available(state):
                continue

            try:
                log.info("Trying provider", provider=name)

                llm = factory()

                resp = await llm.ainvoke(prompt)
                content = resp.content if hasattr(resp, "content") else str(resp)

                self._mark_ok(name)

                return content

            except Exception as e:
                last_error = e
                self._mark_error(name, str(e))

                log.warning("Provider failed", provider=name, error=str(e)[:120])

                continue

        raise RuntimeError(f"All providers failed. Last error: {last_error}")

    # =========================================================
    # STATE MANAGEMENT
    # =========================================================

    def _is_available(self, state: ProviderState) -> bool:
        if state.status == ProviderStatus.OK:
            return True

        if state.status == ProviderStatus.RATE_LIMITED:
            if time.time() - state.failed_at > state.cooldown_sec:
                state.status = ProviderStatus.OK
                state.fail_count = 0
                return True
            return False

        if state.status == ProviderStatus.ERROR:
            return state.fail_count < 3

        return True

    def _mark_error(self, name: str, error: str):
        state = self._states.get(name)
        if not state:
            return

        state.fail_count += 1
        state.failed_at = time.time()

        if "429" in error.lower() or "rate" in error.lower():
            state.status = ProviderStatus.RATE_LIMITED
        else:
            state.status = ProviderStatus.ERROR

    def _mark_ok(self, name: str):
        state = self._states.get(name)
        if state:
            state.status = ProviderStatus.OK
            state.fail_count = 0

    # =========================================================
    # HEALTH
    # =========================================================

    def get_status(self):
        return {
            name: {
                "status": state.status.value,
                "fail_count": state.fail_count,
            }
            for name, state in self._states.items()
        }


# =========================================================
# SINGLETON
# =========================================================

_router: Optional[LLMRouter] = None


def init_router(settings) -> LLMRouter:
    global _router
    _router = LLMRouter(settings)
    return _router


def get_router() -> LLMRouter:
    if _router is None:
        raise RuntimeError("Router not initialized")
    return _router
