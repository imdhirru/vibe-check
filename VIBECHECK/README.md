# 🎯 VIBE CHECK - AI Interview Coach

An advanced AI-powered interview coaching platform that provides real-time feedback on eye contact, speech patterns, and overall performance using computer vision and natural language processing.

## 🌟 Key Improvements & Features

### ✨ Enhanced Features
1. **Real-time Performance Metrics**
   - Live eye contact tracking with color-coded feedback
   - Filler word detection (um, uh, like, etc.)
   - Sentiment analysis of speech
   - Session timer and word count

2. **Advanced AI Feedback**
   - Structured coaching reports with ratings
   - Strengths and improvement areas
   - Actionable recommendations
   - Text-to-speech voice feedback

3. **Modern UI/UX**
   - Cyberpunk-inspired dark theme with unique aesthetics
   - Smooth animations and transitions
   - Responsive design for all screen sizes
   - Keyboard shortcuts for power users

4. **Technical Enhancements**
   - Better error handling and session management
   - Optimized video processing for 1080p
   - Thread-safe camera operations
   - Performance monitoring

### 🎨 Design Improvements
- **Unique Typography**: Outfit + JetBrains Mono (no generic fonts)
- **Dynamic Color System**: Cyberpunk-inspired with accent gradients
- **Smooth Animations**: Micro-interactions and state transitions
- **Professional Layout**: Grid-based responsive design
- **Glassmorphism Effects**: Modern backdrop blur and transparency

## 📋 Requirements

- Python 3.10+
- Webcam (720p or higher recommended)
- Microphone
- Chrome or Edge browser (for best compatibility)
- Google Gemini API Key

## 🚀 Installation

### 1. Clone or Download the Project

```bash
cd your-project-folder
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up API Key

**Option A: Environment Variable (Recommended)**
```bash
# Windows
set GEMINI_API_KEY=your_api_key_here

# Linux/Mac
export GEMINI_API_KEY=your_api_key_here
```

**Option B: Direct in Code**
Edit `app.py` line 11 and replace with your key:
```python
GEMINI_API_KEY = "your_actual_api_key"
```

### 5. Create Folder Structure

```
your-project/
├── app.py
├── requirements.txt
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
└── templates/
    └── index.html
```

### 6. Run the Application

```bash
python app.py
```

Open your browser to: **http://localhost:5000**

## 🎮 How to Use

### Basic Workflow
1. **Start Session** - Click the button and allow camera/mic permissions
2. **Practice Interview** - Look at the camera and speak naturally
3. **Monitor Metrics** - Watch real-time feedback on your performance
4. **End & Analyze** - Get AI-powered coaching feedback

### Keyboard Shortcuts
- `Space` - Start/Stop session
- `H` - Open help menu
- `Esc` - Close modals

### Performance Tips
- **Eye Contact**: Keep the green dot (nose tracker) near the center crosshair
- **Speech**: Speak for at least 30-60 seconds for meaningful feedback
- **Environment**: Use good lighting and minimal background noise
- **Browser**: Chrome/Edge for best Web Speech API support

## 🔧 Configuration Options

### Camera Settings (in app.py)
```python
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)   # Change resolution
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
camera.set(cv2.CAP_PROP_FPS, 30)             # Change frame rate
```

### AI Model Selection
The app automatically discovers and selects the best available Gemini model:
- Priority: Flash → Pro → Any available
- Logs model selection to console

### Performance Tuning
```python
# In generate_frames() function
if frame_counter % 2 == 0:  # Process every 2nd frame (change for performance)
```

## 📊 Metrics Explained

### Eye Contact Score
- **80-100%** 🟢 Excellent - Direct camera gaze
- **60-79%** 🟡 Good - Slightly off-center
- **0-59%** 🔴 Needs Work - Looking away

### Filler Words
Tracks: um, uh, like, you know, basically, actually, sort of, kind of

### Sentiment Analysis
- **Positive** - Confident, enthusiastic language
- **Neutral** - Balanced tone
- **Negative** - Uncertain, worried language

## 🐛 Troubleshooting

### Camera Not Working
- Check browser permissions (camera icon in address bar)
- Close other apps using the camera
- Try different browser (Chrome recommended)
- Restart the application

### Microphone Not Detecting Speech
- Check browser permissions for microphone
- Speak louder and clearer
- Reduce background noise
- Check system microphone settings

### API Errors
- Verify your Gemini API key is correct
- Check internet connection
- Monitor API quota/rate limits
- Review console logs for specific errors

### Performance Issues
- Lower camera resolution in `app.py`
- Increase frame skip rate (change `% 2` to `% 3`)
- Close other resource-intensive applications
- Use a modern computer with good CPU

## 🏆 Competition Tips (NIT Silchar Neurothon)

### Unique Selling Points
1. **Real-time Multi-modal Analysis** - Combines vision + speech
2. **Production-Ready UI** - Professional, modern design
3. **Actionable Insights** - Not just metrics, but coaching
4. **Accessibility** - Works on standard hardware

### Demo Strategy
1. Show the real-time tracking in action
2. Demonstrate clear before/after improvements
3. Highlight the AI feedback quality
4. Emphasize practical use cases

### Potential Extensions
- [ ] Multiple camera angles for body language
- [ ] Interview question database with practice mode
- [ ] Progress tracking across sessions
- [ ] Export reports as PDF
- [ ] Team/organization dashboards
- [ ] Integration with calendar for scheduled practice
- [ ] Mobile app version

## 📝 Project Structure

```
VIBE CHECK/
├── app.py                 # Flask backend with AI integration
├── requirements.txt       # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css     # Modern cyberpunk theme
│   └── js/
│       └── script.js     # Real-time UI logic
└── templates/
    └── index.html        # Main dashboard
```

## 🔐 Security Notes

- Never commit API keys to version control
- Use environment variables for production
- Validate user inputs on backend
- Rate limit API calls if deploying publicly

## 📄 License

This project is created for the NIT Silchar Neurothon. Feel free to use and modify for educational purposes.

## 🙏 Acknowledgments

- Google Gemini API for AI feedback
- MediaPipe for face mesh detection
- Web Speech API for transcription
- Flask framework for backend

## 📧 Support

For issues or questions during the competition:
1. Check the troubleshooting section
2. Review console logs for errors
3. Verify all dependencies are installed correctly

---

**Good luck with your Neurothon presentation! 🎯🚀**
