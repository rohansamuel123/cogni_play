from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreate, ReportGenerateRequest, ReportResponse
from app.auth.dependencies import get_current_user
from app.services.report_service import generate_child_report
from app.services.pdf_service import generate_report_pdf
from typing import List
import traceback

router = APIRouter(prefix="/reports", tags=["Reports"])
singular_router = APIRouter(prefix="/report", tags=["Reports"])

@router.post("/", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    try:
        new_report = Report(**report.dict())
        db.add(new_report)
        db.commit()
        db.refresh(new_report)
        return new_report
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ReportResponse])
def get_all_reports(db: Session = Depends(get_db)):
    return db.query(Report).all()

@router.get("/child/{child_id}", response_model=List[ReportResponse])
def get_reports_by_child(child_id: int, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.child_id == child_id).all()
    return reports

@router.post("/generate/{child_id}", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report_for_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return generate_child_report(db, child_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"OpenClaw report generation failed: {e}")

@singular_router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    request: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return generate_child_report(db, request.child_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"OpenClaw report generation failed: {e}")

@router.get("/{report_id}/pdf")
def download_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.child is None or report.child.parent_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        pdf_bytes = generate_report_pdf(report)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unable to render PDF: {e}")

    filename = f"intellisight-report-{report_id}.pdf"
    headers = {"Content-Disposition": f"attachment; filename=\"{filename}\""}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
