from pydantic import BaseModel
from typing import Optional

class TextRequest(BaseModel):
    question: str
    answer: str

class ScoreBreakdown(BaseModel):
    structure: float
    content: float
    confidence: float
    clarity: float

class FeedbackItem(BaseModel):
    type: str
    message: str

class AnalysisResponse(BaseModel):
    final_score: float
    breakdown: ScoreBreakdown
    feedback: list[FeedbackItem]
    word_count: int
    filler_count: int