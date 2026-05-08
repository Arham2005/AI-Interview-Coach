import json
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, classification_report
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from transformers import TrainingArguments, Trainer
import torch
from torch.utils.data import Dataset
import warnings
warnings.filterwarnings('ignore')

MODEL_DIR = "app/model/saved_model"
DATASET_PATH = "app/model/dataset.json"

class InterviewDataset(Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item

def load_dataset(path=DATASET_PATH):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} samples")
    return data

def label_to_class(label):
    mapping = {
        "weak":      0,
        "below_avg": 1,
        "average":   2,
        "good":      3,
        "excellent": 4,
    }
    return mapping.get(label, 2)

def class_to_score(class_idx):
    mapping = {
        0: 20,
        1: 48,
        2: 62,
        3: 77,
        4: 92,
    }
    return mapping.get(class_idx, 62)

def prepare_text(item):
    return f"Question: {item['question']} Answer: {item['answer']}"

def train():
    print("\n=== AI Interview Coach — Model Training ===\n")

    # Load data
    data = load_dataset()
    df = pd.DataFrame(data)

    print(f"Label distribution:\n{df['label'].value_counts()}\n")
    print(f"Field distribution:\n{df['field'].value_counts()}\n")

    # Prepare texts and labels
    texts  = [prepare_text(item) for item in data]
    labels = [label_to_class(item['label']) for item in data]

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"Train: {len(X_train)} | Test: {len(X_test)}\n")

    # Tokenize
    print("Loading DistilBERT tokenizer...")
    tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')

    print("Tokenizing dataset...")
    train_encodings = tokenizer(X_train, truncation=True, padding=True, max_length=256)
    test_encodings  = tokenizer(X_test,  truncation=True, padding=True, max_length=256)

    train_dataset = InterviewDataset(train_encodings, y_train)
    test_dataset  = InterviewDataset(test_encodings,  y_test)

    # Load model
    print("Loading DistilBERT model (5 classes)...")
    model = DistilBertForSequenceClassification.from_pretrained(
        'distilbert-base-uncased',
        num_labels=5
    )

    # Training args
    training_args = TrainingArguments(
        output_dir=MODEL_DIR,
        num_train_epochs=3,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        warmup_steps=100,
        weight_decay=0.01,
        logging_dir=f'{MODEL_DIR}/logs',
        logging_steps=50,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
    )

    # Train
    print("\nStarting training...")
    print("This will take 15-30 minutes on CPU.\n")
    trainer.train()

    # Save
    print("\nSaving model...")
    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save_pretrained(MODEL_DIR)
    tokenizer.save_pretrained(MODEL_DIR)
    print(f"Model saved to {MODEL_DIR}")

    # Evaluate
    print("\n=== Evaluation ===")
    predictions = trainer.predict(test_dataset)
    pred_classes = np.argmax(predictions.predictions, axis=1)
    pred_scores  = [class_to_score(c) for c in pred_classes]
    true_scores  = [class_to_score(c) for c in y_test]

    print(f"\nClassification Report:")
    print(classification_report(
        y_test, pred_classes,
        target_names=["weak", "below_avg", "average", "good", "excellent"]
    ))

    mae = mean_absolute_error(true_scores, pred_scores)
    r2  = r2_score(true_scores, pred_scores)
    print(f"Mean Absolute Error: {mae:.2f} points")
    print(f"R² Score: {r2:.4f}")

    accuracy = sum(p == t for p, t in zip(pred_classes, y_test)) / len(y_test)
    print(f"Accuracy: {accuracy*100:.2f}%")

    # Save evaluation results
    eval_results = {
        "total_samples":   len(data),
        "train_samples":   len(X_train),
        "test_samples":    len(X_test),
        "accuracy":        round(accuracy * 100, 2),
        "mae":             round(mae, 2),
        "r2_score":        round(r2, 4),
        "label_dist":      df['label'].value_counts().to_dict(),
        "field_dist":      df['field'].value_counts().to_dict(),
    }

    with open("app/model/eval_results.json", "w") as f:
        json.dump(eval_results, f, indent=2)

    print(f"\n✅ Training complete!")
    print(f"✅ Evaluation saved to app/model/eval_results.json")
    return eval_results

if __name__ == "__main__":
    train()