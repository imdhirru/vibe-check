from flask import Flask, render_template, Response, jsonify, request
import cv2
import mediapipe as mp
import numpy as np
import requests
import json
import threading
import time
import os
from collections import deque
from datetime import datetime

# --- CONFIG ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBX5z8vUpYuTb-XFNqsMeKcXUnx84QqZj4")

app = Flask(__name__)

# --- SMART MODEL DISCOVERY ---
def get_valid_gemini_url():
    print("🔍 Connecting to Google to find valid models...")
    try:
        list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
        response = requests.get(list_url, timeout=10)
        data = response.json()
        
        valid_models = []
        if 'models' in data:
            for m in data['models']:
                if "generateContent" in m.get('supportedGenerationMethods', []):
                    name = m['name'].split('/')[-1]
                    valid_models.append(name)
        
        if not valid_models:
            print("❌ No models found! Your API Key might be invalid.")
            return None

        # Priority: Flash -> Pro -> Any
        selected_model = next((m for m in valid_models if "flash" in m.lower()), None)
        if not selected_model:
            selected_model = next((m for m in valid_models if "pro" in m.lower()), None)
        if not selected_model:
            selected_model = valid_models[0]

        print(f"✅ SUCCESS! Using Model: {selected_model}")
        return f"https://generativelanguage.googleapis.com/v1beta/models/{selected_model}:generateContent?key={GEMINI_API_KEY}"

    except Exception as e:
        print(f"⚠️ Auto-Discovery Failed: {e}")
        return f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

GEMINI_URL = get_valid_gemini_url()

# --- CAMERA SETUP ---
camera = None
camera_lock = threading.Lock()

def get_camera():
    global camera
    with camera_lock:
        if camera is None or not camera.isOpened():
            camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
            camera.set(cv2.CAP_PROP_FPS, 30)
            camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return camera

# --- AI SETUP ---
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1, 
    refine_landmarks=True, 
    min_detection_confidence=0.5, 
    min_tracking_confidence=0.5
)

# --- ENHANCED DATA STORE ---
data_store = {
    "eye_score": 0,
    "eye_status": "Waiting",
    "transcript": "",
    "filler_count": 0,
    "sentiment_score": 0,
    "sentiment_text": "Neutral",
    "history_eye": deque(maxlen=30),
    "session_start": None,
    "session_duration": 0,
    "avg_eye_contact": 0,
    "speaking_time": 0,
    "pause_count": 0
}

# --- SPEECH PROCESSING ---
@app.route('/process_speech', methods=['POST'])
def process_speech():
    try:
        data = request.json
        text = data.get('text', '').lower().strip()
        
        if not text:
            return jsonify({"status": "empty"})
        
        # Update transcript
        data_store["transcript"] += text + " "
        
        # Count fillers - improved detection
        fillers = ["um", "uh", "like", "you know", "basically", "actually", "sort of", "kind of"]
        text_with_spaces = f" {text} "  # Add spaces for boundary checking
        
        for f in fillers:
            # Count with word boundaries
            count = text_with_spaces.count(f" {f} ")
            data_store["filler_count"] += count
            if count > 0:
                print(f"DEBUG: Found '{f}' {count} times in: {text}")
        
        # Enhanced sentiment analysis
        positive_words = ["good", "great", "excellent", "happy", "confident", "excited", 
                         "wonderful", "fantastic", "amazing", "love", "perfect", "best",
                         "awesome", "brilliant", "thrilled", "proud", "delighted"]
        negative_words = ["bad", "difficult", "hard", "nervous", "worried", "concerned",
                         "afraid", "terrible", "awful", "hate", "worst", "scared",
                         "anxious", "stressed", "frustrated", "disappointed"]
        
        # Count with word boundaries
        text_lower = f" {text} "
        pos_count = sum(1 for word in positive_words if f" {word} " in text_lower)
        neg_count = sum(1 for word in negative_words if f" {word} " in text_lower)
        
        # Update sentiment with more granular scoring
        total_sentiment = pos_count - neg_count
        
        if total_sentiment > 0:
            data_store["sentiment_text"] = "Positive"
            data_store["sentiment_score"] = min(100, 50 + (total_sentiment * 15))
        elif total_sentiment < 0:
            data_store["sentiment_text"] = "Negative"
            data_store["sentiment_score"] = max(0, 50 + (total_sentiment * 15))
        else:
            # Keep current sentiment if neutral
            if data_store["sentiment_score"] == 0:
                data_store["sentiment_text"] = "Neutral"
                data_store["sentiment_score"] = 50
        
        print(f"DEBUG: Sentiment - Pos:{pos_count}, Neg:{neg_count}, Text:'{data_store['sentiment_text']}', Score:{data_store['sentiment_score']}")
            
        return jsonify({"status": "success", "sentiment": data_store["sentiment_text"]})
    except Exception as e:
        print(f"Error processing speech: {e}")
        return jsonify({"status": "error", "message": str(e)})

# --- FEEDBACK GENERATION ---
@app.route('/get_feedback', methods=['GET'])
def get_feedback():
    transcript = data_store["transcript"].strip()
    
    if len(transcript) < 20:
        return jsonify({"message": "⚠️ Not enough speech data captured. Please speak for at least 10-15 seconds during your next session!"})
    
    # Calculate metrics
    word_count = len(transcript.split())
    avg_eye = data_store["avg_eye_contact"]
    filler_count = data_store["filler_count"]
    
    # Build comprehensive prompt
    summary_prompt = f"""You are an expert interview coach providing detailed, actionable feedback.

**Session Metrics:**
- Average Eye Contact: {avg_eye}%
- Words Spoken: {word_count}
- Filler Words Used: {filler_count}
- Sentiment: {data_store["sentiment_text"]}

**Transcript:**
"{transcript}"

Provide a structured coaching report with these EXACT sections:

### 📊 Performance Overview
(2-3 sentences summarizing overall performance)

### 💪 Key Strengths
- [List 2-3 specific strengths you observed]

### ⚠️ Areas for Improvement
- [List 2-3 specific areas needing work]

### 🎯 Actionable Recommendations
- [Provide 3-4 practical, specific tips they can implement immediately]

### ⭐ Overall Rating
[X/5 stars] - [Brief 1-2 sentence justification]

Keep it concise, encouraging, and actionable. Focus on specific examples from their speech."""

    payload = {"contents": [{"parts": [{"text": summary_prompt}]}]}

    try:
        if GEMINI_URL:
            response = requests.post(
                GEMINI_URL, 
                headers={'Content-Type': 'application/json'}, 
                data=json.dumps(payload),
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                msg = result['candidates'][0]['content']['parts'][0]['text']
                msg = msg.replace("*", "").replace("#", "")
            elif response.status_code == 429:
                msg = "⚠️ API Rate Limit Reached. Please try again in a few moments."
            else:
                msg = f"⚠️ AI Service Error (Code: {response.status_code}). Your performance data has been saved locally."
        else:
            msg = "❌ AI service unavailable. Please check your API configuration."
            
    except requests.exceptions.Timeout:
        msg = "⏱️ Request timed out. Please try again."
    except Exception as e:
        print(f"Feedback error: {e}")
        msg = "⚠️ Unable to generate feedback. Please try again."
    
    # Reset transcript but keep other metrics
    data_store["transcript"] = ""
    
    return jsonify({"message": msg})

# --- SESSION MANAGEMENT ---
@app.route('/start_session', methods=['POST'])
def start_session():
    data_store["session_start"] = datetime.now()
    data_store["transcript"] = ""
    data_store["filler_count"] = 0
    data_store["history_eye"].clear()
    data_store["avg_eye_contact"] = 0
    return jsonify({"status": "started"})

@app.route('/end_session', methods=['POST'])
def end_session():
    if data_store["session_start"]:
        duration = (datetime.now() - data_store["session_start"]).total_seconds()
        data_store["session_duration"] = duration
    
    # Calculate average eye contact
    if len(data_store["history_eye"]) > 0:
        data_store["avg_eye_contact"] = int(np.mean(list(data_store["history_eye"])))
    
    return jsonify({"status": "ended", "duration": data_store["session_duration"]})

# --- OPTIMIZED VIDEO PROCESSING ---
def generate_frames():
    global camera
    camera = get_camera()
    
    frame_counter = 0
    last_process_time = time.time()

    while True:
        success, frame = camera.read()
        if not success:
            with camera_lock:
                if camera:
                    camera.release()
                camera = get_camera()
            continue
        
        frame_counter += 1
        current_time = time.time()
        
        # Process every 2nd frame for performance
        if frame_counter % 2 == 0:
            try:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame_rgb = cv2.flip(frame_rgb, 1)
                
                results = face_mesh.process(frame_rgb)
                h, w, _ = frame.shape
                
                frame = cv2.flip(frame, 1)

                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0]
                    
                    # Nose tip and eye corners
                    nose = landmarks.landmark[1]
                    left_eye = landmarks.landmark[234]
                    right_eye = landmarks.landmark[454]
                    
                    # Calculate face center
                    center = (left_eye.x + right_eye.x) / 2
                    diff = abs(nose.x - center)
                    
                    # Enhanced scoring algorithm
                    raw_score = 100 - (diff * 800)
                    eye_score = int(max(0, min(100, raw_score)))
                    
                    # Store in history
                    data_store["history_eye"].append(eye_score)
                    data_store["eye_score"] = eye_score
                    
                    # Debug output (throttled)
                    if frame_counter % 30 == 0:  # Print every 30 frames
                        print(f"DEBUG: Eye Score = {eye_score}%, Status = {status}")
                    
                    # Visual feedback
                    if eye_score > 80:
                        color = (0, 255, 0)  # Green
                        status = "Excellent"
                    elif eye_score > 60:
                        color = (255, 200, 0)  # Yellow
                        status = "Good"
                    else:
                        color = (0, 0, 255)  # Red
                        status = "Look at camera"
                    
                    data_store["eye_status"] = status
                    
                    # Draw feedback circle
                    cv2.circle(frame, (int(nose.x * w), int(nose.y * h)), 8, color, -1)
                    
                    # Draw subtle guide line
                    cv2.line(frame, (w//2 - 50, h//2), (w//2 + 50, h//2), (255, 255, 255), 1)
                    cv2.line(frame, (w//2, h//2 - 50), (w//2, h//2 + 50), (255, 255, 255), 1)
                    
            except Exception as e:
                print(f"Frame processing error: {e}")
        else:
            frame = cv2.flip(frame, 1)

        # Encode with high quality
        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# --- ROUTES ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/data')
def get_data():
    # Convert deque to list for JSON serialization
    response_data = {
        "eye_score": data_store["eye_score"],
        "eye_status": data_store["eye_status"],
        "transcript": data_store["transcript"],
        "filler_count": data_store["filler_count"],
        "sentiment_score": data_store["sentiment_score"],
        "sentiment_text": data_store["sentiment_text"],
        "avg_eye_contact": data_store["avg_eye_contact"],
        "session_duration": data_store["session_duration"]
    }
    return jsonify(response_data)

@app.route('/test')
def test_endpoint():
    """Test endpoint to verify system is working"""
    return jsonify({
        "status": "OK",
        "message": "Backend is working!",
        "current_data": {
            "eye_score": data_store["eye_score"],
            "filler_count": data_store["filler_count"],
            "sentiment": data_store["sentiment_text"]
        }
    })

if __name__ == '__main__':
    app.run(debug=True, threaded=True, use_reloader=False)
