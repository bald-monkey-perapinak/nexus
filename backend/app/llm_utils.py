"""Shared LLM utilities: robust JSON extractor + model factory."""
import json
import re
import asyncio
from typing import Any, Optional
import structlog
from langchain_groq import ChatGroq
from app.config import settings

log = structlog.get_logger()


def make_llm(temperature: float = 0.3, max_tokens: int = 2000, model: Optional[str] = None) -> ChatGroq:
    """Create a ChatGroq LLM instance. `model` overrides settings if provided."""
    m = model or settings.GROQ_MODEL
    return ChatGroq(
        model=m,
        api_key=settings.GROQ_API_KEY,
        temperature=temperature,
        max_tokens=max_tokens,
    )


async def ainvoke_with_fallback(
    prompt: str,
    tier: str = "fast",
    temperature: float = 0.3,
    max_tokens: int = 2000,
) -> str:
    """Invoke LLM with automatic fallback via `LLMRouter` if available.

    Behaviours:
    - Prefer `LLMRouter` when initialized (centralized provider rotation).
    - On router absence or router failure, fall back to a local `ChatGroq`.
    - Use `GROQ_MODEL_FAST` for `tier='fast'` fallbacks.
    - Enforce an asyncio timeout to avoid hanging tasks.
    """
    timeout = 60 if tier == "heavy" else 15

    try:
        # Import here to avoid circular import at module import time
        from app.llm_router import get_router

        router = get_router()
        if tier == "heavy":
            return await asyncio.wait_for(router.invoke_heavy(prompt, temperature=temperature, max_tokens=max_tokens), timeout=timeout)
        return await asyncio.wait_for(router.invoke_fast(prompt, temperature=temperature, max_tokens=max_tokens), timeout=timeout)
    except Exception as e:
        log.warning(
            "Router unavailable or failed, using local fallback", error=str(e)[:200])
        # Choose appropriate fallback model
        model = settings.GROQ_MODEL_FAST if tier == "fast" else settings.GROQ_MODEL
        llm = make_llm(temperature=temperature,
                       max_tokens=max_tokens, model=model)
        try:
            resp = await asyncio.wait_for(llm.ainvoke(prompt), timeout=timeout)
            return resp.content if hasattr(resp, "content") else str(resp)
        except asyncio.TimeoutError:
            log.error("Local LLM invocation timed out", tier=tier)
            raise
        except Exception as e2:
            log.error("Local LLM invocation failed", error=str(e2)[:200])
            raise


def sanitize_exception(e: Exception, context: str) -> str:
    """Log full exception and return a sanitized error code for clients."""
    try:
        log.exception("Exception in %s", context)
    except Exception:
        log.error("Failed to log exception for %s", context)
    return f"{context}:{type(e).__name__}"


def extract_json(text: str) -> Any:
    text = text.strip()
    # Safety: cap text length to avoid OOM from maliciously large responses
    MAX_JSON_PARSE = 200_000
    if len(text) > MAX_JSON_PARSE:
        text = text[:MAX_JSON_PARSE]
    # Try last ```json block
    blocks = re.findall(r"```(?:json)?\s*([\s\S]*?)```", text)
    if blocks:
        try:
            return json.loads(blocks[-1].strip())
        except:
            pass
    # Try last {...} or [...]
    for pat in [r"(\{[\s\S]*\})", r"(\[[\s\S]*\])"]:
        matches = list(re.finditer(pat, text))
        if matches:
            try:
                return json.loads(matches[-1].group(1).strip())
            except:
                continue
    raise ValueError(f"No valid JSON in: {text[:300]}")


def safe_extract_json(text: str, fallback: Any) -> Any:
    try:
        return extract_json(text)
    except:
        return fallback
