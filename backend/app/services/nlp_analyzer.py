import spacy

nlp = spacy.load("en_core_web_sm")

STAR_KEYWORDS = {
    "situation": [
        "when", "during", "at my", "in my previous", "there was",
        "i was working", "we were", "in my", "while i", "at the time",
        "last year", "in my final", "during my", "at university",
        "at college", "at school", "in my project", "one time",
        "once", "i remember", "there was a time", "it was",
        "i was in", "we had", "our team", "my team"
    ],
    "task": [
        "had to", "responsible for", "my role", "needed to",
        "my job was", "i was assigned", "was required", "my task",
        "i needed", "we needed", "the goal was", "objective was",
        "i was supposed to", "it was my job", "i was tasked",
        "my responsibility", "i was expected"
    ],
    "action": [
        "i did", "i created", "i implemented", "i led", "i built",
        "i decided", "i solved", "i developed", "i took", "i started",
        "i worked", "i used", "i applied", "i designed", "i wrote",
        "i made", "i helped", "i collaborated", "i communicated",
        "i reached out", "i approached", "i studied", "i learned",
        "i practiced", "i focused", "i tried", "i managed",
        "we implemented", "we built", "we created", "i came up with"
    ],
    "result": [
        "as a result", "which led to", "increased", "reduced",
        "achieved", "successfully", "improved", "we managed",
        "in the end", "finally", "ultimately", "the outcome",
        "we got", "i got", "received", "scored", "passed",
        "completed", "finished", "delivered", "the result was",
        "it worked", "we succeeded", "i learned", "i gained",
        "the project", "we won", "i was able to", "we were able to"
    ]
}

INTRO_KEYWORDS = {
    "background": [
        "i am", "i'm", "my name", "i study", "i'm studying", "i graduated",
        "i have been", "myself", "i did my", "i have done my",
        "i have completed", "i'm a", "i am a", "bs in", "ms in",
        "degree in", "university", "bahria", "internship", "academics",
        "i have done", "i'm currently", "i am currently", "i work",
        "i worked", "i come from", "my background", "i have experience",
        "pursuing", "studying", "enrolled", "student", "graduate",
        "i completed", "i finished", "i did", "from"
    ],
    "skills":     [
        "i know", "i can", "skilled in", "experience in", "proficient",
        "i work with", "my skills", "understanding of", "knowledge of",
        "i have done multiple", "projects", "algorithms", "i have built",
        "i have worked", "experienced in", "familiar with", "expertise",
        "i specialize", "i focus on", "my strengths", "i am good at",
        "tools", "technologies", "frameworks", "languages", "python",
        "machine learning", "ai", "data", "web", "software", "coding",
        "programming", "development", "i enjoy", "passionate about"
    ],
    "goals":      [
        "i want", "i aim", "my goal", "i hope", "looking to",
        "i aspire", "in the future", "i plan", "i wish", "my ambition",
        "i intend", "i would like", "my dream", "i seek",
        "i'm looking", "i want to", "i plan to", "my objective",
        "career goal", "i see myself", "i hope to", "i'd like to"
    ]
}  

STRENGTH_KEYWORDS = {
    "trait": [
        "strength is", "good at", "i excel", "i am good", "my strength",
        "i am strong", "greatest strength", "my ability", "i am able",
        "i have a strong", "i pride myself", "i consider myself",
        "one of my", "key strength", "natural ability", "i am particularly",
        "my strongest", "best at", "i thrive", "i am confident in",
        "my forte", "i am known for", "people say i am", "i have always been"
    ],
    "example": [
        "for example", "for instance", "such as", "like when", "one time",
        "i once", "when i", "during my", "in my", "i built", "i created",
        "i developed", "i completed", "i worked on", "a recent example",
        "last semester", "in my project", "i demonstrated", "i showed"
    ],
    "weakness": [
        "weakness is", "i struggle", "i need to improve", "working on",
        "i sometimes", "my weakness", "area of improvement", "i tend to",
        "i can be", "i am working", "i have been working", "i recognize",
        "however", "although", "on the other hand", "i acknowledge",
        "i am aware", "i need to work", "i am trying to", "not perfect"
    ]
}

TECHNICAL_KEYWORDS = {
    "definition": [
        "is a", "is an", "means", "refers to", "defined as", "is when", "is the",
        "can be defined", "is basically", "is essentially", "is a type of",
        "is a method", "is a process", "is a technique", "is a concept",
        "is a way", "is used to", "stands for", "is known as",
        "is a framework", "is a system", "is a model", "is a tool",
        "is an approach", "is an algorithm", "simply put", "in simple terms",
        "to put it simply", "in other words", "what this means is"
    ],
    "example": [
        "for example", "for instance", "such as", "like", "consider", "imagine",
        "take the example", "a good example", "a real world example",
        "in practice", "in real life", "think of", "suppose", "let's say",
        "as an example", "to illustrate", "e.g", "namely", "including",
        "one example", "another example", "in a real project", "i used this when",
        "we can see this in", "this can be seen in", "netflix", "google",
        "amazon", "facebook", "when i built", "in my project"
    ],
    "explanation": [
        "works by", "it uses", "it allows", "the process", "this means", "therefore",
        "the way it works", "how it works", "the idea behind", "the concept is",
        "what happens is", "this is because", "the reason is", "this enables",
        "this helps", "by doing this", "which means", "so that", "in order to",
        "the algorithm", "the model", "the system", "this approach",
        "under the hood", "at its core", "fundamentally", "essentially",
        "the key idea", "the main idea", "the basic idea", "this works",
        "it processes", "it computes", "it calculates", "it predicts",
        "it classifies", "it detects", "it generates", "it learns",
        "converts", "transforms", "decomposes", "breaks down", "separates",
        "reveals", "extracts", "identifies", "represents", "maps",
        "translates", "shifts", "moves", "changes", "outputs",
        "takes input", "produces", "returns", "gives us", "provides",
        "can be applied", "is applied", "is widely used", "used in",
        "commonly used", "often used", "applied to", "used for",
        "helps us", "allows us", "enables us", "makes it possible",
        "by converting", "by transforming", "by decomposing",
        "by breaking", "by analyzing", "by computing"
    ]
}

FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically", "literally",
    "actually", "sort of", "kind of", "i mean", "right",
    "so yeah", "yeah so", "and um", "and uh", "you see",
    "i think", "i guess", "i suppose", "pretty much",
    "more or less", "at the end of the day", "to be honest",
    "honestly", "clearly", "obviously", "simply", "just",
    "stuff", "things", "whatever", "anyway", "so basically",
    "and like", "and basically", "well um", "well uh"
]

def detect_question_type(question):
    q = question.lower().strip()

    # INTRO
    if any(p in q for p in [
        "tell me about yourself", "introduce yourself", "about yourself",
        "walk me through your background", "tell us about yourself"
    ]):
        return "intro"

    # STRENGTH/WEAKNESS
    if any(p in q for p in [
        "strength", "weakness", "greatest strength", "biggest weakness",
        "what are you good at", "where do you struggle"
    ]):
        return "strength"

    # TECHNICAL — category is already 'technical' so use that
    if any(p in q for p in [
        "explain", "what is", "what are", "how does", "how do",
        "difference between", "define", "describe the concept",
        "what do you mean", "how would you describe",
        "what is the difference", "explain the concept",
        "explain how", "explain what"
    ]):
        return "technical"

    # STAR — behavioral questions
    if any(p in q for p in [
        "describe a time", "tell me about a time", "give me an example",
        "when did you", "have you ever", "talk about a time",
        "tell me about a challenge", "tell me about a situation",
        "describe a situation", "describe a challenge",
        "tell me about a project", "describe a project",
        "tell me about a time you", "describe a time you",
        "why did you choose", "where do you see yourself",
        "tell me about a", "describe a"
    ]):
        return "star"
    
    if any(p in q for p in [
    "why did you choose", "where do you see yourself",
    "what motivates you", "why do you want",
    "tell me about your interest", "what are your goals",
    "why are you interested"
    ]):
        return "intro"

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