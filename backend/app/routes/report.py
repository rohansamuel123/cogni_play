from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse
from typing import List
import traceback

router = APIRouter(prefix="/reports", tags=["Reports"])

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
    if not reports:
        raise HTTPException(status_code=404, detail="No reports found for this child")
    return reports

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
