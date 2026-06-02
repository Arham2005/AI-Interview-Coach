# 🎯 AI Interview Coach

> An intelligent, multi-layer web application that helps students and job seekers prepare for professional interviews using NLP, computer vision, and large language models.

![Python](https://img.shields.io/badge/Python-3.13-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![FastAPI](https://img.shields.io/badge/FastAPI-0.136-green) ![License](https://img.shields.io/badge/License-MIT-orange)

---

## 📌 Overview

AI Interview Coach is a full-stack AI system that accepts interview responses in **text**, **audio**, and **video** formats and evaluates them across multiple dimensions — structural quality, content relevance, confidence, and clarity. Unlike generic chatbot wrappers, this system implements a **measurable, explainable scoring engine** with a custom-trained DistilBERT model and real-time body language analysis via MediaPipe.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 Text Mode | Type your answer and get instant NLP analysis |
| 🎤 Audio Mode | Record your voice — Whisper transcribes and analyzes |
| 🎥 Video Mode | Full interview simulation with body language scoring |
| 🎙️ Mock Interview | Real interview simulation — 5 questions back to back |
| 🤖 Custom AI Model | Fine-tuned DistilBERT trained on 4,470 labeled interview answers |
| ✨ Groq Questions | AI-generated field-specific questions at 4 difficulty levels |
| 📊 History Dashboard | Score trends, radar charts, field performance breakdown |
| 💡 Personalized Tips | Groq analyzes your history and gives targeted improvement advice |
| 🔐 Google Auth | Firebase Google OAuth — sign in with Gmail |
| 👁️ Body Language | MediaPipe tracks eye contact, posture, and nodding |

---

## 🏗️ System Architecture

```
User Input (Text / Audio / Video)
         ↓
Speech-to-Text (OpenAI Whisper)       [Audio/Video only]
         ↓
Question Type Detection
(intro / star / strength / technical)
         ↓
┌─────────────────────────────────────┐
│  Static Questions → DistilBERT Model │
│  AI Questions     → Groq LLM        │
└─────────────────────────────────────┘
         ↓
Confidence Analyzer (filler words, clarity)
         ↓
Body Language Analyzer (MediaPipe)    [Video only]
         ↓
Scoring Engine
Structure 30% + Content 30% + Confidence 20% + Clarity 20%
         ↓
Feedback Generator (rule-based + AI hybrid)
         ↓
Frontend Dashboard (React)
```

---

## 🧠 AI Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Answer Quality | Fine-tuned DistilBERT | Classifies answers into 5 quality levels |
| Speech-to-Text | OpenAI Whisper (base) | Local audio transcription |
| Question Generation | Groq llama-3.3-70b | Field-specific question generation |
| Answer Analysis | Groq llama-3.3-70b | Semantic analysis for AI-generated questions |
| Body Language | MediaPipe Face + Pose | Eye contact, posture, presence scoring |
| NLP | spaCy + Transformers | STAR detection, keyword extraction |
| Tips Generation | Groq llama-3.3-70b | Personalized improvement recommendations |

---

## 📊 Model Performance

The custom DistilBERT model was trained on **4,470 labeled interview answers** across 10 professional fields.

```
Accuracy:  74.27%
MAE:        5.96 points
R² Score:   0.7377

Per-class Performance:
  weak        → 66% precision
  below_avg   → 61% precision  
  average     → 73% precision
  good        → 84% precision
  excellent   → 87% precision
```

---

## 🗂️ Project Structure

```
ai-interview-coach/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt
│   └── app/
│       ├── routes/
│       │   ├── analyze.py         # Text/Audio/Video analysis endpoints
│       │   └── questions.py       # Question bank + Groq generation + Tips
│       ├── services/
│       │   ├── nlp_analyzer.py    # STAR/Intro/Technical/Strength detection
│       │   ├── confidence.py      # Filler word + clarity analysis
│       │   ├── scorer.py          # Weighted scoring engine
│       │   ├── transcriber.py     # Whisper speech-to-text
│       │   └── video_analyzer.py  # MediaPipe body language analysis
│       ├── models/
│       │   └── schemas.py         # Pydantic data models
│       └── model/
│           ├── generate_dataset.py  # Dataset generation with Groq
│           ├── train_model.py       # DistilBERT fine-tuning
│           └── predictor.py        # Model inference
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx           # Practice page
        │   ├── MockInterview.jsx  # Full interview simulation
        │   ├── History.jsx        # Dashboard with charts
        │   └── Tips.jsx           # Personalized tips
        └── components/
            ├── ScoreCard.jsx
            ├── FeedbackCard.jsx
            ├── VideoRecorder.jsx
            └── BodyLanguageCard.jsx
```

---

## ⚙️ Tech Stack

**Backend:** Python 3.13, FastAPI, Uvicorn  
**AI/ML:** HuggingFace Transformers, DistilBERT, PyTorch, spaCy, OpenAI Whisper, MediaPipe, OpenCV  
**LLM:** Groq API (llama-3.3-70b-versatile)  
**Frontend:** React 18, Firebase  
**Database:** Firebase Firestore (NoSQL)  
**Auth:** Firebase Google OAuth 2.0  
**Version Control:** Git + GitHub  

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key (free at console.groq.com)
- Firebase project (free Spark plan)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

Run backend:
```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Run frontend:
```bash
npm start
```

Open `http://localhost:3000`

### Train the Model (Optional)

```bash
cd backend
python app/model/generate_dataset.py   # Generate training data (~4500 samples)
python app/model/train_model.py         # Fine-tune DistilBERT (~3 hours on CPU)
```

---

## 📱 Supported Fields

Artificial Intelligence · Software Engineering · Data Science · Cybersecurity · Cloud Computing · Web Development · Electrical Engineering · Mechanical Engineering · Civil Engineering · Business Analysis · **Custom fields via Groq AI**

---

## 🎯 Scoring System

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Structure | 30% | STAR method, intro format, technical structure |
| Content | 30% | Answer quality, relevance, depth |
| Confidence | 20% | Filler words, speech patterns |
| Clarity | 20% | Word count, sentence length, conciseness |

**Video mode** adds body language scoring:
- Eye contact (40%), Posture (35%), Presence (25%)
- Final score = 70% answer + 30% body language

---

## 👥 Team

| Member | Role | Responsibilities |
|--------|------|-----------------|
| Member 1 | Backend & AI Engineer | FastAPI, NLP analyzer, scoring engine, Whisper, Groq |
| Member 2 | Confidence & Feedback | Confidence analyzer, feedback generator, API routes |
| Member 3 | Frontend Developer | React UI, Firebase auth, Firestore, all pages |

---

## 📄 License

MIT License — free to use for educational purposes.

---

## 🙏 Acknowledgements

- [HuggingFace Transformers](https://huggingface.co/transformers/)
- [OpenAI Whisper](https://github.com/openai/whisper)
- [MediaPipe](https://mediapipe.dev/)
- [Groq](https://groq.com/)
- [Firebase](https://firebase.google.com/)

---

*Built as a semester project for AI (Artificial Intelligence) course — Bahria University, Spring 2026*