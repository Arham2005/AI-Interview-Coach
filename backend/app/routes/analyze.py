from fastapi import APIRouter, UploadFile, File, Form
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


def analyze_with_groq(question, answer):
    prompt = f"""You are an expert interview coach. Analyze this interview answer.

Question: {question}
Answer: {answer}

Return ONLY a JSON object in this exact format:
{{
  "question_type": "star|intro|strength|technical",
  "structure_detected": {{"key1": true, "key2": false}},
  "final_score": <0-100>,
  "breakdown": {{"structure": <0-100>, "content": <0-100>, "confidence": <0-100>, "clarity": <0-100>}},
  "feedback": [{{"type": "error|warning|success", "message": "specific feedback"}}],
  "word_count": <number>,
  "filler_count": <number>,
  "confidence_level": "High|Medium|Low"
}}

Rules:
- intro: tell me about yourself
- star: behavioral/situational
- strength: strength/weakness
- technical: explain/define/what is

Score honestly: weak=30-50, average=50-70, good=70-85, excellent=85-100"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000,
    )
    content = response.choices[0].message.content.strip()
    return json.loads(content[content.find("{"):content.rfind("}")+1])


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
        feedback.append({"type": "warning", "message": f"{confidence_data['filler_count']} filler words detected."})

    if clarity["too_short"]:
        feedback.append({"type": "warning", "message": f"Answer is too short ({clarity['word_count']} words). Aim for at least 40 words."})
    if clarity["too_long"]:
        feedback.append({"type": "warning", "message": f"Answer is too long ({clarity['word_count']} words). Aim for under 300 words."})
    if clarity["avg_sentence_length"] > 30:
        feedback.append({"type": "warning", "message": "Sentences are too long. Break them into shorter ones."})
    if confidence_data["confidence_level"] == "High":
        feedback.append({"type": "success", "message": "Great confidence. Very few filler words detected."})

    return feedback


def build_breakdown(model_score, confidence_data, nlp_result):
    """Fix #13 — different scores per dimension instead of all identical"""
    filler = confidence_data["filler_count"]
    conf_level = confidence_data["confidence_level"]
    too_short = nlp_result["clarity"]["too_short"]
    too_long = nlp_result["clarity"]["too_long"]
    long_sentences = nlp_result["clarity"]["avg_sentence_length"] > 30

    structure_score = min(100, round(model_score * 1.05))
    content_score   = model_score
    confidence_score = 100 if conf_level == "High" else 70 if conf_level == "Medium" else 40
    if filler > 10: confidence_score = min(confidence_score, 30)
    elif filler > 5: confidence_score = min(confidence_score, 55)
    elif filler > 2: confidence_score = min(confidence_score, 75)

    clarity_score = 100
    if too_short:       clarity_score -= 30
    if too_long:        clarity_score -= 15
    if long_sentences:  clarity_score -= 10
    clarity_score = max(clarity_score, 0)

    final = round(
        structure_score  * 0.30 +
        content_score    * 0.30 +
        confidence_score * 0.20 +
        clarity_score    * 0.20
    )

    return final, {
        "structure":  structure_score,
        "content":    content_score,
        "confidence": confidence_score,
        "clarity":    clarity_score,
    }


@router.post("/analyze/text")
async def analyze_text_answer(
    question: str = Form(...),
    answer: str = Form(...),
    use_groq: str = Form("false")
):
    text = transcribe_from_text(answer)

    if use_groq == "true":
        try:
            return analyze_with_groq(question, text)
        except Exception as e:
            print(f"Groq failed: {e}, falling back...")

    try:
        from app.model.predictor import predict_score, is_model_available
        if is_model_available():
            model_result    = predict_score(question, text)
            nlp_result      = analyze_text(text, question)
            confidence_data = analyze_confidence(text)
            final_score, breakdown = build_breakdown(model_result["score"], confidence_data, nlp_result)
            feedback = generate_feedback(
                nlp_result["question_type"], nlp_result["structure"],
                nlp_result["clarity"], confidence_data, {"breakdown": breakdown}
            )
            return {
                "question_type":      nlp_result["question_type"],
                "final_score":        final_score,
                "breakdown":          breakdown,
                "feedback":           feedback,
                "word_count":         nlp_result["clarity"]["word_count"],
                "filler_count":       nlp_result["filler_count"],
                "confidence_level":   confidence_data["confidence_level"],
                "structure_detected": nlp_result["structure"],
                "model":              "custom",
                "label":              model_result["label"],
            }
    except Exception as e:
        print(f"Model failed: {e}, falling back to keywords...")

    nlp_result      = analyze_text(text, question)
    confidence_data = analyze_confidence(text)
    scores = compute_score(nlp_result["question_type"], nlp_result["structure"], nlp_result["clarity"], nlp_result["filler_count"])
    feedback = generate_feedback(nlp_result["question_type"], nlp_result["structure"], nlp_result["clarity"], confidence_data, scores)
    return {
        "question_type":      nlp_result["question_type"],
        "final_score":        scores["final_score"],
        "breakdown":          scores["breakdown"],
        "feedback":           feedback,
        "word_count":         nlp_result["clarity"]["word_count"],
        "filler_count":       nlp_result["filler_count"],
        "confidence_level":   confidence_data["confidence_level"],
        "structure_detected": nlp_result["structure"],
        "model":              "keywords",
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
        # If transcription is empty or too short, return early
        if not text or len(text.strip().split()) < 10:
            return {
                "transcript": text or "",
                "question_type": "star",
                "final_score": 0,
                "answer_score": 0,
                "body_language_score": 0,
                "breakdown": {"structure": 0, "content": 0, "confidence": 0, "clarity": 0},
                "body_language_breakdown": {"eye_contact": 0, "posture": 0, "presence": 0},
                "body_language_stats": {"eye_contact_pct": 0, "good_posture_pct": 0, "face_detected_pct": 0, "nod_count": 0, "excessive_movement": False},
                "feedback": [{"type": "error", "message": "No speech detected in the recording. Please speak clearly into the microphone."}],
                "body_language_feedback": [],
                "word_count": 0,
                "filler_count": 0,
                "confidence_level": "Low",
                "structure_detected": {},
            }
    
        if use_groq == "true":
            try:
                result = analyze_with_groq(question, text)
                result["transcript"] = text
                return result
            except Exception as e:
                print(f"Groq failed: {e}")

        nlp_result = analyze_text(text, question)
        confidence_data = analyze_confidence(text)
        scores = compute_score(nlp_result["question_type"], nlp_result["structure"], nlp_result["clarity"], nlp_result["filler_count"])
        feedback = generate_feedback(nlp_result["question_type"], nlp_result["structure"], nlp_result["clarity"], confidence_data, scores)
        return {
            "transcript": text,
            "question_type": nlp_result["question_type"],
            "final_score": scores["final_score"],
            "breakdown": scores["breakdown"],
            "feedback": feedback,
            "word_count": nlp_result["clarity"]["word_count"],
            "filler_count": nlp_result["filler_count"],
            "confidence_level": confidence_data["confidence_level"],
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
        text = transcribe_audio(temp_path)
        body_language = analyze_video(temp_path)
        nlp_result = analyze_text(text, question)
        confidence_data = analyze_confidence(text)
        scores = compute_score(nlp_result["question_type"], nlp_result["structure"], nlp_result["clarity"], nlp_result["filler_count"])
        feedback = generate_feedback(nlp_result["question_type"], nlp_result["structure"], nlp_result["clarity"], confidence_data, scores)
        combined_score = round(scores["final_score"] * 0.70 + body_language["body_language_score"] * 0.30)
        return {
            "transcript": text,
            "question_type": nlp_result["question_type"],
            "final_score": combined_score,
            "answer_score": scores["final_score"],
            "body_language_score": body_language["body_language_score"],
            "breakdown": scores["breakdown"],
            "body_language_breakdown": body_language["breakdown"],
            "body_language_stats": body_language["stats"],
            "feedback": feedback,
            "body_language_feedback": body_language["feedback"],
            "word_count": nlp_result["clarity"]["word_count"],
            "filler_count": nlp_result["filler_count"],
            "confidence_level": confidence_data["confidence_level"],
            "structure_detected": nlp_result["structure"],
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)