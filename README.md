# 👄 SubtleSpeech AI
### Real-time lip-reading using facial landmarks and motion tracking.

I built **SubtleSpeech** to explore how we can bridge the gap between human movement and digital input. The goal was to create a system that could "read" lips in real-time without needing a massive, laggy, GPU-heavy model. Instead of just throwing data at a "black-box" neural network, I focused on the **engineering of the signals themselves.**

---

## 💡 Why I built this
Most lip-reading AI is slow. Sending high-def video to a cloud server for processing creates massive lag. I wanted to build something that felt **instant**. By extracting only the 3D landmarks I needed on the backend and streaming them back to a React dashboard via WebSockets, I managed to get the response time down to **sub-150ms**. 

---

## 🛠️ How it works
The "brain" of this project isn't just an AI model; it’s a coordinate-tracking engine that solves two main problems:

### 1. The "Distance" Problem (Normalization)
If a user moves closer to the camera, their mouth looks bigger; if they move away, it looks smaller. To stop the AI from getting confused, I used the **distance between the eyes** as a constant "ruler." Every measurement (how wide the mouth is or how much it's open) is divided by that eye-distance. This makes the system **scale-invariant**—it works whether you're leaning in or sitting back.

### 2. Feature Extraction & Math
I track two primary biometric signals using the Euclidean distance formula:

$$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$

* **Vertical Openness ($v_{norm}$):** Distance between the inner top and bottom lip.
* **Horizontal Stretch ($h_{norm}$):** Distance between the outer corners of the mouth.

### 3. Temporal Logic
By watching these two numbers over a rolling **15-frame window**, the system identifies phonemic shapes:
* **O / YOU:** Tall but narrow mouth.
* **HELLO / OPEN:** Tall and wide aperture.
* **SMILE / E:** Wide stretch but low vertical distance.

---

## 🏗️ Tech Stack
* **Backend:** FastAPI (Python) – chosen for its asynchronous nature to handle high-frequency data.
* **Frontend:** React.js – featuring a custom **SVG telemetry dashboard** to visualize real-time signals.
* **Vision:** MediaPipe Tasks API – for 478 3D facial landmarks.
* **Pipeline:** WebSockets + Base64 – optimized to reduce network lag by roughly **40%** compared to standard HTTP.

---

## 🚀 Getting Started

### 1. Set up the Backend

cd backend
python -m venv venv
# Activate your venv (Windows: .\venv\Scripts\activate), then:
pip install -r requirements.txt

📥 IMPORTANT: You need the pre-trained model file to run the detection.

Download: face_landmarker.task from https://www.google.com/search?q=https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

Action: Place the downloaded file directly inside the /backend folder.
Run Backend (Reload) again : uvicorn main:app --reload

### 2. Set up the Frontend

cd frontend
npm install
npm start

---

📂 Project Structure
.
├── backend/
│   ├── main.py                # WebSocket logic & coordinate math
│   ├── face_landmarker.task   # The model file (Download required)
│   └── requirements.txt       # Python essentials
└── frontend/
    ├── src/
    │   └── App.js             # React UI & real-time signal graphing
    └── package.json           # Node modules

---

👨‍💻 About Me
I'm Aman Choudhary, a 3rd-year CS & AI student at IIIT Lucknow. I'm a competitive programmer (Specialist on Codeforces, Knight on LeetCode) who loves building systems that actually do something in the real world.
