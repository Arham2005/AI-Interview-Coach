import spacy

nlp = spacy.load("en_core_web_sm")

STAR_KEYWORDS = {
    "situation": ["when", "during", "at my", "in my previous", "there was", "i was working", "we were"],
    "task":      ["had to", "responsible for", "my role", "needed to", "my job was", "i was assigned"],
    "action":    ["i did", "i created", "i implemented", "i led", "i built", "i decided", "i solved", "i developed"],
    "result":    ["as a result", "which led to", "increased", "reduced", "achieved", "successfully", "improved", "we managed"]
}

INTRO_KEYWORDS = {
    "background": ["i am", "i'm", "my name", "i study", "i'm studying", "i graduated", 
                   "i have been", "myself", "i did my", "i have done my", "i did my bs",
                   "i have completed", "i'm a", "i am a", "bs in", "ms in", "degree in",
                   "university", "bahria", "internship", "academics", "i have done"],
    "skills":     ["i know", "i can", "skilled in", "experience in", "proficient", 
                   "i work with", "my skills", "understanding of", "knowledge of",
                   "i have done multiple", "projects", "algorithms", "i have built",
                   "i have worked", "experienced in", "familiar with", "expertise"],
    "goals":      ["i want", "i aim", "my goal", "i hope", "looking to", "i aspire", 
                   "in the future", "i plan", "i wish", "my ambition", "i intend",
                   "i would like", "my dream", "i seek", "i'm looking"]
}   

STRENGTH_KEYWORDS = {
    "trait":   ["strength is", "good at", "i excel", "i am good", "my strength", "i am strong"],
    "example": ["for example", "for instance", "such as", "like when", "one time", "i once"],
    "weakness":["weakness is", "i struggle", "i need to improve", "working on", "i sometimes"]
}

TECHNICAL_KEYWORDS = {
    "definition": ["is a", "is an", "means", "refers to", "defined as", "is when", "is the"],
    "example":    ["for example", "for instance", "such as", "like", "consider", "imagine"],
    "explanation":["works by", "it uses", "it allows", "the process", "this means", "therefore"]
}

FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", 
                "actually", "sort of", "kind of"]

def detect_question_type(question):
    q = question.lower().strip()
    if any(p in q for p in ["tell me about yourself", "introduce yourself", "about yourself"]):
        return "intro"
    if any(p in q for p in ["describe a time", "tell me about a time", "give me an example", 
                              "when did you", "have you ever", "talk about a time"]):
        return "star"
    if any(p in q for p in ["strength", "weakness", "greatest strength", "biggest weakness"]):
        return "strength"
    if any(p in q for p in ["explain", "what is", "what are", "how does", 
                              "difference between", "define", "describe the"]):
        return "technical"
    return "star"

def detect_star(text):
    text_lower = text.lower()
    found = {}
    for part, keywords in STAR_KEYWORDS.items():
        found[part] = any(kw in text_lower for kw in keywords)
    return found

def detect_intro(text):
    text_lower = text.lower()
    found = {}
    for part, keywords in INTRO_KEYWORDS.items():
        found[part] = any(kw in text_lower for kw in keywords)
    return found

def detect_strength(text):
    text_lower = text.lower()
    found = {}
    for part, keywords in STRENGTH_KEYWORDS.items():
        found[part] = any(kw in text_lower for kw in keywords)
    return found

def detect_technical(text):
    text_lower = text.lower()
    found = {}
    for part, keywords in TECHNICAL_KEYWORDS.items():
        found[part] = any(kw in text_lower for kw in keywords)
    return found

def count_fillers(text):
    text_lower = text.lower()
    count = 0
    for word in FILLER_WORDS:
        count += text_lower.count(word)
    return count

def check_clarity(text):
    words = text.split()
    sentences = [s.strip() for s in text.split(".") if s.strip()]
    avg_sentence_length = len(words) / max(len(sentences), 1)
    return {
        "word_count": len(words),
        "sentence_count": len(sentences),
        "avg_sentence_length": round(avg_sentence_length, 1),
        "too_short": len(words) < 50,
        "too_long": len(words) > 300,
    }

def analyze_text(text, question=""):
    question_type = detect_question_type(question)
    filler_count = count_fillers(text)
    clarity = check_clarity(text)

    if question_type == "intro":
        structure = detect_intro(text)
    elif question_type == "strength":
        structure = detect_strength(text)
    elif question_type == "technical":
        structure = detect_technical(text)
    else:
        structure = detect_star(text)

    return {
        "question_type": question_type,
        "structure":     structure,
        "filler_count":  filler_count,
        "clarity":       clarity,
    }