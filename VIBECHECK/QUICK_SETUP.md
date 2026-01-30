# 🚀 QUICK SETUP GUIDE

## Step 1: Extract Files
Extract the `vibe-check-improved` folder to your desired location.

## Step 2: Install Python Dependencies
```bash
# Navigate to project folder
cd vibe-check-improved

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

## Step 3: Set API Key
**Option A (Recommended):**
```bash
# Windows:
set GEMINI_API_KEY=your_api_key_here

# Mac/Linux:
export GEMINI_API_KEY=your_api_key_here
```

**Option B:**
Edit `app.py` line 11 and add your key directly.

## Step 4: Run
```bash
python app.py
```

Open browser: http://localhost:5000

## File Structure Check
```
vibe-check-improved/
├── app.py
├── requirements.txt
├── README.md
├── IMPROVEMENTS.md
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
└── templates/
    └── index.html
```

## Common Issues

### Camera Not Working
- Allow camera permissions in browser
- Close other apps using camera
- Use Chrome or Edge

### Microphone Not Working
- Allow microphone permissions
- Check system microphone settings
- Speak clearly and loudly

### API Errors
- Verify API key is correct
- Check internet connection
- Monitor API quota

## Features to Show Judges

1. **Real-time Tracking** - Show eye contact score changing
2. **Speech Analysis** - Demonstrate filler word detection
3. **AI Feedback** - End session and show structured report
4. **Professional UI** - Highlight modern design
5. **Keyboard Shortcuts** - Press Space to start/stop

## Demo Script (30 seconds)
"Hello, I'm excited to discuss my experience in software development. I have worked on multiple projects using Python and JavaScript. I'm particularly passionate about machine learning and AI applications. Thank you for this opportunity."

Good luck! 🎯
