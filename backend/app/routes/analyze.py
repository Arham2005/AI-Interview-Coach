from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import shutil
import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()

from app.services.nlp_analyzer import analyze_text
from app.services.confidence import analyze_confidence
from app.services.scorer import compute_score
from app.services.transcriber import transcribe_audio, transcribe_from_text
from app.services.video_analyzer import analyze_video

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ─── GROQ ANALYSIS ────────────────────────────────────────────────────────────
def analyze_with_groq(question, answer):
    prompt = f"""You are an expert interview coach. Analyze this interview answer.

Question: {question}
Answer: {answer}

Evaluate the answer and return ONLY a JSON object in this exact format, nothing else:
{{
  "question_type": "star|intro|strength|technical",
  "structure_detected": {{
    "key1": true/false,
    "key2": true/false
  }},
  "final_score": <0-100>,
  "breakdown": {{
    "structure": <0-100>,
    "content": <0-100>,
    "confidence": <0-100>,
    "clarity": <0-100>
  }},
  "feedback": [
    {{"type": "error|warning|success", "message": "specific actionable feedback"}}
  ],
  "word_count": <number>,
  "filler_count": <number>,
  "confidence_level": "High|Medium|Low"
}}

Rules for question_type:
- "intro" for tell me about yourself
- "star" for behavioral/situational questions
- "strength" for strength/weakness questions  
- "technical" for technical concept questions

Rules for structure_detected keys:
- intro: background, skills, goals
- star: situation, task, action, result
- strength: trait, example, weakness
- technical: definition, explanation, example

Be specific and harsh in feedback. Give real actionable advice.
Score honestly — a weak answer should get 30-50, average 50-70, good 70-85, excellent 85-100."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000,
    )

    content = response.choices[0].message.content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    json_str = content[start:end]
    return json.loads(json_str)


# ─── KEYWORD ANALYSIS (improved) ──────────────────────────────────────────────
def generate_feedback(question_type, structure, clarity, confidence_data, scores):
    feedback = []

    if question_type == "star":
        if not structure.get("situation"):
            feedback.append({"type": "warning", "message": "No situation described. Start with 'When I was at...' or 'During a project...'"})
        if not structure.get("task"):
            feedback.append({"type": "warning", "message": "No task mentioned. Explain what your role or responsibility was."})
        if not structure.get("action"):
            feedback.append({"type": "error", "message": "No action described. Explain exactly what YOU did."})
        if not structure.get("result"):
            feedback.append({"type": "error", "message": "No result mentioned. End with a measurable outcome like 'reduced errors by 30%'."})
        if scores["breakdown"]["structure"] == 100:
            feedback.append({"type": "success", "message": "Perfect STAR structure. All four parts detected."})

    elif question_type == "intro":
        if not structure.get("background"):
            feedback.append({"type": "error", "message": "No background mentioned. Start with who you are — your degree, field, or current role."})
        if not structure.get("skills"):
            feedback.append({"type": "warning", "message": "No skills mentioned. Tell the interviewer what you bring to the table."})
        if not structure.get("goals"):
            feedback.append({"type": "warning", "message": "No goals mentioned. End with where you want to go or why you want this role."})
        if scores["breakdown"]["structure"] == 100:
            feedback.append({"type": "success", "message": "Great intro. You covered background, skills, and goals."})

    elif question_type == "strength":
        if not structure.get("trait"):
            feedback.append({"type": "error", "message": "You didn't clearly state your strength. Be direct — 'My greatest strength is...'"})
        if not structure.get("example"):
            feedback.append({"type": "error", "message": "No example given. Back up your strength with a real situation."})
        if not structure.get("weakness"):
            feedback.append({"type": "warning", "message": "No weakness acknowledged. Showing self-awareness impresses interviewers."})
        if scores["breakdown"]["structure"] == 100:
            feedback.append({"type": "success", "message": "Strong answer. Trait, example, and self-awareness all detected."})

    elif question_type == "technical":
        if not structure.get("definition"):
            feedback.append({"type": "error", "message": "No clear definition given. Start by defining the concept directly."})
        if not structure.get("explanation"):
            feedback.append({"type": "warning", "message": "No explanation of how it works. Go deeper than just the definition."})
        if not structure.get("example"):
            feedback.append({"type": "warning", "message": "No example given. A real-world example makes technical answers much stronger."})
        if scores["breakdown"]["structure"] == 100:
            feedback.append({"type": "success", "message": "Excellent technical answer. Definition, explanation, and example all detected."})

    if confidence_data["filler_count"] > 10:
        feedback.append({"type": "error", "message": f"Too many filler words ({confidence_data['filler_count']} detected)."})
    elif confidence_data["filler_count"] > 5:
        feedback.append({"type": "warning", "message": f"{confidence_data['filler_count']} filler words detected. Reduce 'basically', 'you know' etc."})

    if clarity["too_short"]:
        feedback.append({"type": "warning", "message": f"Answer is too short ({clarity['word_count']} words). Aim for at least 50 words."})
    if clarity["too_long"]:
        feedback.append({"type": "warning", "message": f"Answer is too long ({clarity['word_count']} words). Aim for under 300 words."})
    if clarity["avg_sentence_length"] > 30:
        feedback.append({"type": "warning", "message": "Sentences are too long. Break them into shorter ones."})
    if confidence_data["confidence_level"] == "High":
        feedback.append({"type": "success", "message": "Great confidence. Very few filler words detected."})

    return feedback


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────
@router.post("/analyze/text")
async def analyze_text_answer(
    question: str = Form(...),
    answer: str = Form(...),
    use_groq: str = Form("false")
):
    text = transcribe_from_text(answer)

    if use_groq == "true":
        try:
            result = analyze_with_groq(question, text)
            return result
        except Exception as e:
            print(f"Groq analysis failed: {e}, falling back to keyword analysis")

    # Keyword-based analysis
    nlp_result = analyze_text(text, question)
    confidence_data = analyze_confidence(text)
    scores = compute_score(
        nlp_result["question_type"],
        nlp_result["structure"],
        nlp_result["clarity"],
        nlp_result["filler_count"]
    )
    feedback = generate_feedback(
        nlp_result["question_type"],
        nlp_result["structure"],
        nlp_result["clarity"],
        confidence_data,
        scores
    )

    return {
        "question_type":      nlp_result["question_type"],
        "final_score":        scores["final_score"],
        "breakdown":          scores["breakdown"],
        "feedback":           feedback,
        "word_count":         nlp_result["clarity"]["word_count"],
        "filler_count":       nlp_result["filler_count"],
        "confidence_level":   confidence_data["confidence_level"],
        "structure_detected": nlp_result["structure"],
    }


@router.post("/analyze/audio")
async def analyze_audio_answer(
    question: str = Form(...),
    audio: UploadFile = File(...),
    use_groq: str = Form("false")
):
    temp_path = f"temp_{audio.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    try:
        text = transcribe_audio(temp_path)

        if use_groq == "true":
            try:
                result = analyze_with_groq(question, text)
                result["transcript"] = text
                return result
            except Exception as e:
                print(f"Groq analysis failed: {e}, falling back to keyword analysis")

        nlp_result = analyze_text(text, question)
        confidence_data = analyze_confidence(text)
        scores = compute_score(
            nlp_result["question_type"],
            nlp_result["structure"],
            nlp_result["clarity"],
            nlp_result["filler_count"]
        )
        feedback = generate_feedback(
            nlp_result["question_type"],
            nlp_result["structure"],
            nlp_result["clarity"],
            confidence_data,
            scores
        )

        return {
            "transcript":         text,
            "question_type":      nlp_result["question_type"],
            "final_score":        scores["final_score"],
            "breakdown":          scores["breakdown"],
            "feedback":           feedback,
            "word_count":         nlp_result["clarity"]["word_count"],
            "filler_count":       nlp_result["filler_count"],
            "confidence_level":   confidence_data["confidence_level"],
            "structure_detected": nlp_result["structure"],
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
            
@router.post("/analyze/video")
async def analyze_video_answer(
    question: str = Form(...),
    video: UploadFile = File(...),
    use_groq: str = Form("false")
):
    temp_path = f"temp_{video.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    try:
        # Extract audio and transcribe
        text = transcribe_audio(temp_path)

        # Analyze body language from video
        body_language = analyze_video(temp_path)

        # Analyze answer text
        nlp_result = analyze_text(text, question)
        confidence_data = analyze_confidence(text)
        scores = compute_score(
            nlp_result["question_type"],
            nlp_result["structure"],
            nlp_result["clarity"],
            nlp_result["filler_count"]
        )
        feedback = generate_feedback(
            nlp_result["question_type"],
            nlp_result["structure"],
            nlp_result["clarity"],
            confidence_data,
            scores
        )

        # Combined final score (70% answer + 30% body language)
        combined_score = round(
            scores["final_score"] * 0.70 +
            body_language["body_language_score"] * 0.30
        )

        return {
            "transcript":           text,
            "question_type":        nlp_result["question_type"],
            "final_score":          combined_score,
            "answer_score":         scores["final_score"],
            "body_language_score":  body_language["body_language_score"],
            "breakdown":            scores["breakdown"],
            "body_language_breakdown": body_language["breakdown"],
            "body_language_stats":  body_language["stats"],
            "feedback":             feedback,
            "body_language_feedback": body_language["feedback"],
            "word_count":           nlp_result["clarity"]["word_count"],
            "filler_count":         nlp_result["filler_count"],
            "confidence_level":     confidence_data["confidence_level"],
            "structure_detected":   nlp_result["structure"],
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)