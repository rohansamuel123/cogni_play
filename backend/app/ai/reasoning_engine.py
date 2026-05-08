import json
import os
from typing import Any, Dict

from openai import OpenAI


REASONING_MODEL = os.getenv("OPENAI_REASONING_MODEL", "gpt-5.5")

EXPECTED_KEYS = {
    "strengths": [],
    "weaknesses": [],
    "recommendations": [],
    "next_game": "",
    "difficulty_adjustment": "",
    "readiness_level": "",
    "behavioral_summary": {
        "attention_consistency": "",
        "impulsivity": "",
        "memory_retention": "",
    },
}


def _extract_json(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(content[start : end + 1])


def _normalize_reasoning(data: Dict[str, Any]) -> Dict[str, Any]:
    normalized = EXPECTED_KEYS.copy()
    normalized.update(data)

    for key in ("strengths", "weaknesses", "recommendations"):
        if not isinstance(normalized.get(key), list):
            normalized[key] = [str(normalized[key])]

    behavioral_summary = normalized.get("behavioral_summary")
    if not isinstance(behavioral_summary, dict):
        behavioral_summary = {}

    normalized["behavioral_summary"] = {
        "attention_consistency": str(behavioral_summary.get("attention_consistency", "")),
        "impulsivity": str(behavioral_summary.get("impulsivity", "")),
        "memory_retention": str(behavioral_summary.get("memory_retention", "")),
    }

    return normalized


def analyze_cognitive_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use GPT for interpretive cognitive reasoning only.
    Scores are supplied by deterministic backend scoring and must not be recalculated here.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    client = OpenAI(api_key=api_key, timeout=float(os.getenv("OPENAI_TIMEOUT_SECONDS", "12")))

    system_prompt = """
You are IntelliSight's GPT cognitive reasoning engine.
Analyze child gameplay behavior, but do not diagnose, clinically label, or calculate scores.
Scores are already computed deterministically by the backend.
Return ONLY valid JSON with this exact shape:
{
  "strengths": [],
  "weaknesses": [],
  "recommendations": [],
  "next_game": "",
  "difficulty_adjustment": "",
  "readiness_level": "",
  "behavioral_summary": {
    "attention_consistency": "",
    "impulsivity": "",
    "memory_retention": ""
  }
}
""".strip()

    user_prompt = f"""
Analyze this IntelliSight cognitive profile and gameplay history.
Focus on sustained attention, impulsive behavior, processing speed consistency,
visual memory, logical reasoning, comprehension ability, and gameplay progression patterns.

Do not compute new scores. Interpret only the provided scores and sessions.

Profile JSON:
{json.dumps(profile, default=str)}
""".strip()

    response = client.chat.completions.create(
        model=REASONING_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    return _normalize_reasoning(_extract_json(content))
