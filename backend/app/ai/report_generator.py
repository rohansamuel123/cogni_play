import json
import os
from typing import Any, Dict

import anthropic


REPORT_MODEL = os.getenv("ANTHROPIC_REPORT_MODEL", "claude-sonnet-4-5")


def generate_parent_report(reasoning: Dict[str, Any], profile: Dict[str, Any]) -> str:
    """
    Use Claude for parent-friendly wording. It should humanize the GPT reasoning,
    not create new scores or override deterministic backend results.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")

    client = anthropic.Anthropic(
        api_key=api_key,
        timeout=float(os.getenv("ANTHROPIC_TIMEOUT_SECONDS", "12")),
    )

    prompt = f"""
You are IntelliSight's parent report writer.
Convert the structured cognitive reasoning into a warm, educational, supportive report.
Avoid clinical or diagnostic language. Keep it concise and parent-readable.
Do not calculate or invent scores.

Child profile:
{json.dumps(profile, default=str)}

Structured reasoning:
{json.dumps(reasoning, default=str)}

Return only the narrative paragraph.
""".strip()

    response = client.messages.create(
        model=REPORT_MODEL,
        max_tokens=700,
        temperature=0.4,
        messages=[{"role": "user", "content": prompt}],
    )

    return "".join(
        block.text for block in response.content if getattr(block, "type", "") == "text"
    ).strip()
