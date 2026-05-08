import io
from typing import Any

from fpdf import FPDF
from app.models.report import Report


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        return "\n".join(str(item) for item in value)
    if isinstance(value, dict):
        return "\n".join(f"{key.replace('_', ' ').capitalize()}: {value[key]}" for key in value)
    return str(value)


def _write_section(pdf: FPDF, title: str, content: str) -> None:
    if not content:
        return

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, title, ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 7, content.strip())
    pdf.ln(3)


def _format_list_items(items: Any) -> str:
    if not items:
        return "None"
    if isinstance(items, (list, tuple)):
        return "\n".join(f"• {item}" for item in items)
    if isinstance(items, dict):
        return _normalize_text(items)
    return f"• {items}"


def generate_report_pdf(report: Report) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, "IntelliSight AI Cognitive Report", ln=True, align="C")
    pdf.ln(5)

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, f"Report ID: {report.report_id}", ln=True)
    pdf.cell(0, 6, f"Child ID: {report.child_id}", ln=True)
    pdf.cell(0, 6, f"Generated: {report.created_at.strftime('%Y-%m-%d %H:%M:%S') if report.created_at else 'N/A'}", ln=True)
    pdf.ln(4)

    if report.child is not None:
        pdf.cell(0, 6, f"Child Name: {report.child.name}", ln=True)
        pdf.cell(0, 6, f"Child Age: {report.child.age}", ln=True)
        pdf.cell(0, 6, f"Child Gender: {report.child.gender}", ln=True)
        pdf.ln(4)

    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 7, "Summary", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 7, report.summary or "No summary available.")
    pdf.ln(4)

    _write_section(pdf, "Strengths", _format_list_items(report.strengths))
    _write_section(pdf, "Areas to Watch", _format_list_items(report.weaknesses))
    _write_section(pdf, "Recommendations", _format_list_items(report.recommendations))

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "AI Insights", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 7, f"Readiness: {report.readiness_label or report.readiness_level}")
    pdf.multi_cell(0, 7, f"Next Recommended Game: {(report.next_game or 'N/A').replace('-', ' ')}")
    pdf.multi_cell(0, 7, f"Difficulty Adjustment: {report.difficulty_adjustment or 'N/A'}")
    pdf.ln(4)

    _write_section(pdf, "Behavioral Summary", _format_list_items(report.behavioral_summary))
    _write_section(pdf, "AI Providers Used", _format_list_items(report.providers))

    buffer = io.BytesIO()
    pdf.output(buffer)
    return buffer.getvalue()
