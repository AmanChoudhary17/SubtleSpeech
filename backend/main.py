import cv2
import numpy as np
import base64
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json

app = FastAPI()

base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
detector = vision.FaceLandmarker.create_from_options(options)

def get_dist(p1, p2, w, h):
    return np.sqrt((p1.x*w - p2.x*w)**2 + (p1.y*h - p2.y*h)**2)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    from collections import deque
    motion_buffer = deque(maxlen=15)
    
    last_word = ""
    word_cooldown = 0
    
    try:
        while True:
            data = await websocket.receive_text()
            img_bytes = base64.b64decode(data)
            img_arr = np.frombuffer(img_bytes, dtype=np.uint8)
            frame = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)

            if frame is not None:
                h, w, _ = frame.shape
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
                detection_result = detector.detect(mp_image)

                v_norm, h_norm = 0, 0
                detected_now = "Listening..."

                if detection_result.face_landmarks:
                    landmarks = detection_result.face_landmarks[0]
                    v_dist = get_dist(landmarks[13], landmarks[14], w, h)
                    h_dist = get_dist(landmarks[61], landmarks[291], w, h)
                    face_size = get_dist(landmarks[33], landmarks[263], w, h)

                    v_norm = v_dist / face_size
                    h_norm = h_dist / face_size
                    motion_buffer.append((v_norm, h_norm))

                    if len(motion_buffer) == 15:
                        v_avg = sum([m[0] for m in motion_buffer]) / 15
                        h_avg = sum([m[1] for m in motion_buffer]) / 15

                        # PATTERN MATCHING LOGIC
                        if v_avg < 0.0035:
                            detected_now = "M / SILENCE"
                        elif v_avg > 0.15 and h_avg < 0.45:
                            detected_now = "O / YOU"
                        elif v_avg > 0.18 and h_avg > 0.48:
                            detected_now = "HELLO / OPEN"
                        elif h_avg > 0.58:
                            detected_now = "SMILE / EEE"
                        else:
                            detected_now = "Listening..."

                final_output = "Listening..."
                if detected_now != "Listening..." and detected_now != last_word and word_cooldown == 0:
                    final_output = f"Detecting: {detected_now}"
                    last_word = detected_now
                    word_cooldown = 15
                elif word_cooldown > 0:
                    word_cooldown -= 1
                    final_output = f"Processing {last_word}..."
                else:
                    last_word = "" 

                await websocket.send_json({
                    "prediction": final_output,
                    "v_norm": round(v_norm, 3),
                    "h_norm": round(h_norm, 3)
                })
                
    except WebSocketDisconnect:
        print("Client Disconnected")