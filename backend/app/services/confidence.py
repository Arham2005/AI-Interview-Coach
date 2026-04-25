def analyze_confidence(text):
    words = text.split()
    total_words = len(words)

    FILLER_WORDS = ["um", "uh", "like", "you know", "basically", 
                    "literally", "actually", "sort of", "kind of"]
    
    filler_count = 0
    filler_found = []
    text_lower = text.lower()
    
    for word in FILLER_WORDS:
        count = text_lower.count(word)
        if count > 0:
            filler_count += count
            filler_found.append({"word": word, "count": count})

    if total_words > 0:
        filler_percentage = round((filler_count / total_words) * 100, 1)
    else:
        filler_percentage = 0

    if filler_count > 10:
        confidence_level = "Low"
    elif filler_count > 5:
        confidence_level = "Medium"
    elif filler_count > 2:
        confidence_level = "Medium"
    elif filler_count > 0:
        confidence_level = "High"
    else:
        confidence_level = "High"

    sentences = [s.strip() for s in text.split(".") if s.strip()]
    if sentences:
        words_per_sentence = [len(s.split()) for s in sentences]
        avg_words_per_sentence = round(sum(words_per_sentence) / len(sentences), 1)
    else:
        avg_words_per_sentence = 0

    return {
        "filler_count":          filler_count,
        "filler_found":          filler_found,
        "filler_percentage":     filler_percentage,
        "confidence_level":      confidence_level,
        "total_words":           total_words,
        "avg_words_per_sentence": avg_words_per_sentence,
    }