import torch
import json
import os
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification

MODEL_DIR = "app/model/saved_model"

tokenizer = None
model = None

CLASS_TO_LABEL = {
    0: "weak",
    1: "below_avg",
    2: "average",
    3: "good",
    4: "excellent",
}

CLASS_TO_SCORE_MAP = {
    0: {"min": 0,  "max": 40},
    1: {"min": 41, "max": 55},
    2: {"min": 56, "max": 69},
    3: {"min": 70, "max": 84},
    4: {"min": 85, "max": 100},
}

def load_model():
    global tokenizer, model
    if model is None:
        if not os.path.exists(MODEL_DIR):
            raise FileNotFoundError(f"Model not found at {MODEL_DIR}. Run train_model.py first.")
        print("Loading trained interview model...")
        tokenizer = DistilBertTokenizer.from_pretrained(MODEL_DIR)
        model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
        model.eval()
        print("Model loaded successfully.")
    return tokenizer, model

def predict_score(question: str, answer: str) -> dict:
    tok, mdl = load_model()

    text = f"Question: {question} Answer: {answer}"
    inputs = tok(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=256
    )

    with torch.no_grad():
        outputs = mdl(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=1).squeeze().tolist()
        pred_class = torch.argmax(logits, dim=1).item()

    label = CLASS_TO_LABEL[pred_class]
    score_range = CLASS_TO_SCORE_MAP[pred_class]

    # Use probability-weighted score within the range
    confidence = probs[pred_class]
    score = int(score_range["min"] + confidence * (score_range["max"] - score_range["min"]))
    score = min(score, score_range["max"])

    return {
        "predicted_class":  pred_class,
        "label":            label,
        "score":            score,
        "confidence":       round(confidence * 100, 1),
        "probabilities": {
            CLASS_TO_LABEL[i]: round(p * 100, 1)
            for i, p in enumerate(probs)
        }
    }

def is_model_available() -> bool:
    return os.path.exists(MODEL_DIR) and os.path.exists(f"{MODEL_DIR}/config.json")