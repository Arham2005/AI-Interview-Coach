import whisper
import os

model = None

def load_model():
    global model
    if model is None:
        print("Loading Whisper model... (first time only)")
        model = whisper.load_model("base")
        print("Whisper model loaded successfully.")
    return model

def transcribe_audio(audio_path: str) -> str:
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    m = load_model()
    print(f"Transcribing: {audio_path}")
    result = m.transcribe(audio_path)
    return result["text"].strip()

def transcribe_from_text(text: str) -> str:
    return text.strip()