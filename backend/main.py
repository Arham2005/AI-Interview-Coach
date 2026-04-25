from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import analyze, questions

app = FastAPI(title="AI Interview Coach", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(questions.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "AI Interview Coach API is running"}