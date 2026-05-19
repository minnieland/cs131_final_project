import cv2
# mediapipe only works with python 3.9-3.12
import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, 
                                  refine_landmarks=True)
mp_drawing = mp.solutions.drawing_utils
drawing_spec = mp_drawing.DrawingSpec(thickness=1, circle_radius=1)

def get_face_landmarks():
    video_capture = cv2.VideoCapture(0)
    
    if not video_capture.isOpened():
        print("Failed to open camera")
        return
    
    while video_capture.isOpened():
        success, image = video_capture.read()
        if not success:
            print("Failed to read frame")
            continue
        
        # RGB needed for mediapipe
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(image)

        #draw landmarks on the image
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                    image=image,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=drawing_spec,
                    connection_drawing_spec=drawing_spec)

        cv2.imshow('MediaPipe Face Mesh', image)
        # quit with 'esc' key
        if cv2.waitKey(1) & 0xFF == 27:
            break
    
    video_capture.release()
    cv2.destroyAllWindows()

def extract_landmarks(face_landmarks, width, height):
    landmarks = []
    for landmark in face_landmarks.landmark:
        x = int(landmark.x * width)
        y = int(landmark.y * height)
        landmarks.append((x, y))
    return landmarks

if __name__ == "__main__":
    get_face_landmarks()