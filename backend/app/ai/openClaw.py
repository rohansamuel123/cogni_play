import json
import os
from typing import Any, Dict

from app.ai.reasoning_engine import analyze_cognitive_profile
from app.ai.report_generator import generate_parent_report


def _fallback_reasoning(profile: Dict[str, Any]) -> Dict[str, Any]:
    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise RuntimeError("Gemini fallback dependency is not installed") from exc

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash"))

    prompt = f"""
Return ONLY valid JSON for IntelliSight cognitive reasoning.
Do not calculate scores. Interpret the existing profile and sessions.
Required keys: strengths, weaknesses, recommendations, next_game,
difficulty_adjustment, readiness_level, behavioral_summary with
attention_consistency, impulsivity, memory_retention.

Profile JSON:
{json.dumps(profile, default=str)}
""".strip()

    response = model.generate_content(
        prompt,
        request_options={"timeout": float(os.getenv("GEMINI_TIMEOUT_SECONDS", "12"))},
    )
    content = getattr(response, "text", "") or "{}"
    start = content.find("{")
    end = content.rfind("}")
    if start == -1 or end == -1:
        raise RuntimeError("Gemini fallback did not return JSON")
    return json.loads(content[start : end + 1])


def _local_report(reasoning: Dict[str, Any]) -> str:
    strengths = ", ".join(reasoning.get("strengths") or ["emerging learning behaviors"])
    weaknesses = ", ".join(reasoning.get("weaknesses") or ["areas that may benefit from practice"])
    return (
        f"The child shows {strengths}. Areas to keep supporting include {weaknesses}. "
        "These observations are based on gameplay patterns and should be used as supportive guidance, "
        "not as a clinical assessment."
    )

def _local_reasoning(profile: Dict[str, Any]) -> Dict[str, Any]:
    sessions = profile.get("sessions", [])
    domain_scores = profile.get("domain_scores", [])

    if domain_scores:
        strongest = max(domain_scores, key=lambda item: item.get("score", 0))
        weakest = min(domain_scores, key=lambda item: item.get("score", 0))
        next_game = "color-recall" if weakest.get("domain") == "memory" else "story-builder"
        strengths = [f"Shows encouraging progress in {strongest.get('domain', 'played activities').replace('_', ' ')}."]
        weaknesses = [f"Would benefit from more practice in {weakest.get('domain', 'new activities').replace('_', ' ')}."]
    else:
        next_game = "color-recall"
        strengths = ["Has started building useful gameplay interaction data."]
        weaknesses = ["Needs more completed sessions before patterns become reliable."]

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": [
            "Encourage short, consistent play sessions.",
            "Replay activities that feel challenging before increasing difficulty.",
            "Celebrate effort and strategy, not only correct answers.",
        ],
        "next_game": next_game,
        "difficulty_adjustment": "maintain" if len(sessions) < 3 else "adaptive",
        "readiness_level": "Emerging" if len(sessions) < 3 else "Developing",
        "behavioral_summary": {
            "attention_consistency": "More sessions are needed to confidently describe attention consistency.",
            "impulsivity": "No strong impulsivity pattern detected from the available stored data.",
            "memory_retention": "Memory retention should be monitored across repeated memory-focused games.",
        },
    }


def run_openclaw_pipeline(profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Single OpenClaw entrypoint for the backend.
    Model-specific logic stays inside this orchestration layer.
    """
    try:
        reasoning = analyze_cognitive_profile(profile)
        reasoning_provider = "openai:gpt-5.5"
    except Exception as openai_error:
        try:
            reasoning = _fallback_reasoning(profile)
            reasoning_provider = "google:gemini-flash"
        except Exception as fallback_error:
            reasoning = _local_reasoning(profile)
            reasoning_provider = f"local:fallback ({openai_error}; {fallback_error})"

    try:
        narrative = generate_parent_report(reasoning, profile)
        report_provider = "anthropic:claude-sonnet"
    except Exception:
        narrative = _local_report(reasoning)
        report_provider = "local:fallback"

    return {
        "summary": narrative,
        "strengths": reasoning.get("strengths", []),
        "weaknesses": reasoning.get("weaknesses", []),
        "recommendations": reasoning.get("recommendations", []),
        "next_game": reasoning.get("next_game", ""),
        "difficulty_adjustment": reasoning.get("difficulty_adjustment", ""),
        "readiness_level": reasoning.get("readiness_level", ""),
        "behavioral_summary": reasoning.get("behavioral_summary", {}),
        "providers": {
            "reasoning": reasoning_provider,
            "report": report_provider,
        },
    }
