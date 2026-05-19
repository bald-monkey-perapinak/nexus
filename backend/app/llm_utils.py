"""Shared LLM utilities: robust JSON extractor + model factory."""
import json, re
from typing import Any
from langchain_groq import ChatGroq
from app.config import settings

def make_llm(temperature: float = 0.3, max_tokens: int = 2000) -> ChatGroq:
    return ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=temperature,
        max_tokens=max_tokens,
    )

def extract_json(text: str) -> Any:
    text = text.strip()
    # Try last ```json block
    blocks = re.findall(r"```(?:json)?\s*([\s\S]*?)```", text)
    if blocks:
        try: return json.loads(blocks[-1].strip())
        except: pass
    # Try last {...} or [...]
    for pat in [r"(\{[\s\S]*\})", r"(\[[\s\S]*\])"]:
        matches = list(re.finditer(pat, text))
        if matches:
            try: return json.loads(matches[-1].group(1).strip())
            except: continue
    raise ValueError(f"No valid JSON in: {text[:300]}")

def safe_extract_json(text: str, fallback: Any) -> Any:
    try: return extract_json(text)
    except: return fallback
