import cv2
import time
# mediapipe only works with python 3.9-3.12
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
face_landmarker = vision.FaceLandmarker.create_from_options(options)

def get_face_landmarks(frame):
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    results = face_landmarker.detect(mp_image)

    if results.face_landmarks:
        landmarks = results.face_landmarks[0]
        return [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
    return None

def extract_landmarks(face_landmarks, width, height):
    landmarks = []
    for landmark in face_landmarks.landmark:
        x = int(landmark.x * width)
        y = int(landmark.y * height)
        landmarks.append((x, y))
    return landmarks

if __name__ == "__main__":
    get_face_landmarks()