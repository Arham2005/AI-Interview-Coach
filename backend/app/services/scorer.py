def compute_score(question_type, structure, clarity, filler_count):

    # Clarity Score (20%) - same for all question types
    clarity_score = 100
    if clarity["too_short"]:
        clarity_score -= 30
    if clarity["too_long"]:
        clarity_score -= 15
    if clarity["avg_sentence_length"] > 30:
        clarity_score -= 10
    clarity_score = max(clarity_score, 0)

    # Confidence Score (20%) - same for all question types
    # Confidence Score (20%) - synced with confidence level
    confidence_score = 100
    if filler_count > 10:
        confidence_score = 30
    elif filler_count > 5:
        confidence_score = 55
    elif filler_count > 2:
        confidence_score = 75
    elif filler_count > 0:
        confidence_score = 88
    else:
        confidence_score = 100

    # Structure + Content Score (60%) - depends on question type
    if question_type == "star":
        parts_found = sum(structure.values())
        structure_score = (parts_found / 4) * 100
        content_score = 0
        if structure.get("action"):  content_score += 40
        if structure.get("result"):  content_score += 40
        if structure.get("situation"): content_score += 10
        if structure.get("task"):    content_score += 10
        content_score = min(content_score, 100)

    elif question_type == "intro":
        parts_found = sum(structure.values())
        structure_score = (parts_found / 3) * 100
        content_score = 0
        if structure.get("background"): content_score += 40
        if structure.get("skills"):     content_score += 40
        if structure.get("goals"):      content_score += 20
        content_score = min(content_score, 100)

    elif question_type == "strength":
        parts_found = sum(structure.values())
        structure_score = (parts_found / 3) * 100
        content_score = 0
        if structure.get("trait"):    content_score += 40
        if structure.get("example"):  content_score += 40
        if structure.get("weakness"): content_score += 20
        content_score = min(content_score, 100)

    elif question_type == "technical":
        parts_found = sum(structure.values())
        structure_score = (parts_found / 3) * 100
        content_score = 0
        if structure.get("definition"):  content_score += 40
        if structure.get("explanation"): content_score += 35
        if structure.get("example"):     content_score += 25
        content_score = min(content_score, 100)

    else:
        structure_score = 50
        content_score = 50

    # Final Weighted Score
    final_score = (
        structure_score  * 0.30 +
        content_score    * 0.30 +
        confidence_score * 0.20 +
        clarity_score    * 0.20
    )

    return {
        "final_score": round(final_score, 1),
        "breakdown": {
            "structure":  round(structure_score, 1),
            "content":    round(content_score, 1),
            "confidence": round(confidence_score, 1),
            "clarity":    round(clarity_score, 1),
        }
    }