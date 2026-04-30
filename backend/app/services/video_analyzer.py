import cv2
import numpy as np
import os
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import urllib.request

MODEL_PATH = "app/model/face_landmarker.task"
POSE_MODEL_PATH = "app/model/pose_landmarker_lite.task"

def download_models():
    os.makedirs("app/model", exist_ok=True)
    
    if not os.path.exists(MODEL_PATH):
        print("Downloading face landmarker model...")
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            MODEL_PATH
        )
        print("Face landmarker downloaded.")
    
    if not os.path.exists(POSE_MODEL_PATH):
        print("Downloading pose landmarker model...")
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            POSE_MODEL_PATH
        )
        print("Pose landmarker downloaded.")

def extract_frames(video_path, fps=2):
    cap = cv2.VideoCapture(video_path)
    frames = []
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if video_fps <= 0:
        video_fps = 25
    frame_interval = max(1, int(video_fps / fps))
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % frame_interval == 0:
            frames.append(frame)
        frame_count += 1
    cap.release()
    return frames

def analyze_video(video_path: str) -> dict:
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")

    download_models()

    print(f"Analyzing video: {video_path}")
    frames = extract_frames(video_path, fps=2)

    if not frames:
        return _default_result("Could not extract frames from video")

    print(f"Extracted {len(frames)} frames")

    # Face landmarker
    face_options = vision.FaceLandmarkerOptions(
        base_options=python.BaseOptions(model_asset_path=MODEL_PATH),
        output_face_blendshapes=True,
        output_facial_transformation_matrixes=True,
        num_faces=1,
    )
    face_detector = vision.FaceLandmarker.create_from_options(face_options)

    # Pose landmarker
    pose_options = vision.PoseLandmarkerOptions(
        base_options=python.BaseOptions(model_asset_path=POSE_MODEL_PATH),
        output_segmentation_masks=False,
    )
    pose_detector = vision.PoseLandmarker.create_from_options(pose_options)

    eye_contact_frames  = 0
    good_posture_frames = 0
    face_detected_frames = 0
    nod_count = 0
    nose_y_prev = None

    for frame in frames:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        # Face detection
        face_result = face_detector.detect(mp_image)
        if face_result.face_landmarks:
            face_detected_frames += 1
            landmarks = face_result.face_landmarks[0]

            # Eye contact — check if nose tip is centered
            nose = landmarks[1]
            if abs(nose.x - 0.5) < 0.15:
                eye_contact_frames += 1

            # Nod detection
            if nose_y_prev is not None:
                dy = nose.y - nose_y_prev
                if dy > 0.02:
                    nod_count += 1
            nose_y_prev = nose.y

        # Pose detection
        pose_result = pose_detector.detect(mp_image)
        if pose_result.pose_landmarks:
            lm = pose_result.pose_landmarks[0]
            try:
                # Indices: LEFT_SHOULDER=11, RIGHT_SHOULDER=12, LEFT_EAR=7, RIGHT_EAR=8
                ls = lm[11]; rs = lm[12]
                le = lm[7];  re = lm[8]
                shoulder_diff = abs(ls.y - rs.y)
                avg_ear_y = (le.y + re.y) / 2
                avg_shoulder_y = (ls.y + rs.y) / 2
                if shoulder_diff < 0.05 and avg_ear_y < avg_shoulder_y:
                    good_posture_frames += 1
            except:
                pass

    face_detector.close()
    pose_detector.close()

    total = len(frames)
    face_pct    = round((face_detected_frames / total) * 100, 1) if total > 0 else 0
    eye_pct     = round((eye_contact_frames / face_detected_frames) * 100, 1) if face_detected_frames > 0 else 0
    posture_pct = round((good_posture_frames / total) * 100, 1) if total > 0 else 0

    eye_score     = min(100, eye_pct)
    posture_score = min(100, posture_pct)
    presence_score = min(100, face_pct)

    body_language_score = round(
        eye_score     * 0.40 +
        posture_score * 0.35 +
        presence_score * 0.25
    )

    feedback = []
    if eye_pct < 40:
        feedback.append({"type": "error",   "message": f"Poor eye contact — you looked away {100-eye_pct:.0f}% of the time. Look directly at the camera lens."})
    elif eye_pct < 70:
        feedback.append({"type": "warning", "message": f"Moderate eye contact ({eye_pct:.0f}%). Try to maintain consistent camera eye contact."})
    else:
        feedback.append({"type": "success", "message": f"Excellent eye contact ({eye_pct:.0f}%). Strong camera presence."})

    if posture_pct < 50:
        feedback.append({"type": "error",   "message": "Poor posture detected. Sit up straight with shoulders level."})
    elif posture_pct < 75:
        feedback.append({"type": "warning", "message": "Posture could be improved. Keep your back straight throughout."})
    else:
        feedback.append({"type": "success", "message": "Good posture maintained throughout the interview."})

    if nod_count > 5:
        feedback.append({"type": "success", "message": f"Good nodding detected ({nod_count} nods). Shows engagement."})

    if face_pct < 70:
        feedback.append({"type": "warning", "message": f"Face not visible {100-face_pct:.0f}% of the time. Ensure good lighting and stay centered."})

    return {
        "body_language_score": body_language_score,
        "breakdown": {
            "eye_contact": round(eye_score),
            "posture":     round(posture_score),
            "presence":    round(presence_score),
        },
        "stats": {
            "eye_contact_pct":   eye_pct,
            "good_posture_pct":  posture_pct,
            "face_detected_pct": face_pct,
            "nod_count":         nod_count,
            "excessive_movement": False,
        },
        "feedback":       feedback,
        "frames_analyzed": total,
    }

def _default_result(error_msg=""):
    return {
        "body_language_score": 0,
        "breakdown": {"eye_contact": 0, "posture": 0, "presence": 0},
        "stats": {"eye_contact_pct": 0, "good_posture_pct": 0, "face_detected_pct": 0, "nod_count": 0, "excessive_movement": False},
        "feedback": [{"type": "error", "message": error_msg or "Video analysis failed."}],
        "frames_analyzed": 0,
    }