// ================================
// VIBE CHECK - Enhanced JavaScript
// ================================

let recognition;
let isRecording = false;
let pollingInterval;
let timerInterval;
let sessionStartTime;
let finalTranscriptGlobal = "";
let wordCount = 0;

// ================================
// 1. SPEECH RECOGNITION SETUP
// ================================

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = function () {
        console.log("🎤 Microphone activated");
        updateStatus("Listening", true);
    };

    recognition.onerror = function (event) {
        console.error("Speech Error:", event.error);
        
        if (event.error === 'no-speech') {
            updateLiveTip("I can't hear you. Try speaking louder!");
        } else if (event.error === 'not-allowed') {
            showNotification("Microphone access denied. Please allow permissions.", "error");
            stopRecording();
        }
    };

    recognition.onend = function () {
        if (isRecording) {
            console.log("Restarting microphone...");
            try {
                recognition.start();
            } catch (e) {
                console.log("Microphone restart delayed");
            }
        }
    };

    // Real-time transcript processing
    recognition.onresult = function (event) {
        let interimTranscript = '';
        let newFinalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                newFinalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Process finalized text
        if (newFinalTranscript.length > 0) {
            finalTranscriptGlobal += " " + newFinalTranscript;
            sendTranscript(newFinalTranscript);
            
            // Update word count
            wordCount = finalTranscriptGlobal.trim().split(/\s+/).length;
            updateWordCount(wordCount);
        }

        // Update UI with styled interim text
        updateTranscriptDisplay(finalTranscriptGlobal, interimTranscript);
    };

} else {
    showNotification("Speech recognition not supported. Please use Chrome or Edge.", "error");
}

// ================================
// 2. TRANSCRIPT MANAGEMENT
// ================================

function sendTranscript(text) {
    fetch('/process_speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.json())
    .then(data => {
        if (data.sentiment) {
            // Smooth sentiment update handled by polling
        }
    })
    .catch(err => console.error("Transcript send error:", err));
}

function updateTranscriptDisplay(finalText, interimText) {
    const box = document.getElementById('transcriptBox');
    
    if (finalText.trim() === '' && interimText.trim() === '') {
        box.innerHTML = `
            <div class="transcript-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z"/>
                    <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8"/>
                </svg>
                <p>Say something to start real-time analysis...</p>
            </div>
        `;
    } else {
        box.innerHTML = `
            <span class="transcript-final">${finalText}</span>
            <span class="transcript-interim">${interimText}</span>
        `;
        autoScroll();
    }
}

function updateWordCount(count) {
    const wordCountEl = document.getElementById('wordCount');
    wordCountEl.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    
    // Animate on update
    wordCountEl.style.transform = 'scale(1.1)';
    setTimeout(() => {
        wordCountEl.style.transform = 'scale(1)';
    }, 200);
}

function autoScroll() {
    const box = document.getElementById('transcriptBox');
    box.scrollTop = box.scrollHeight;
}

// ================================
// 3. SESSION CONTROLS
// ================================

function startSession() {
    if (isRecording) return;

    // Notify backend
    fetch('/start_session', { method: 'POST' });

    isRecording = true;
    sessionStartTime = Date.now();
    finalTranscriptGlobal = "";
    wordCount = 0;

    // UI Updates
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'flex';
    document.getElementById('recordingIndicator').classList.add('active');
    
    updateStatus("Recording", true);
    updateTranscriptDisplay("", "");
    updateWordCount(0);
    updateLiveTip("Speak clearly and maintain eye contact with the camera!");

    // Start microphone
    try {
        recognition.start();
    } catch (e) {
        console.error("Recognition start error:", e);
    }

    // Start polling and timer
    pollingInterval = setInterval(fetchStats, 1000);
    timerInterval = setInterval(updateTimer, 1000);
}

function endSession() {
    if (!isRecording) return;

    // Notify backend
    fetch('/end_session', { method: 'POST' });

    isRecording = false;

    // UI Updates
    document.getElementById('startBtn').style.display = 'flex';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('recordingIndicator').classList.remove('active');
    
    updateStatus("Processing...", false);

    // Stop microphone
    try {
        recognition.stop();
    } catch (e) {
        console.error("Recognition stop error:", e);
    }

    // Stop intervals
    clearInterval(pollingInterval);
    clearInterval(timerInterval);

    // Show feedback
    showFeedbackModal();
    fetchFeedback();
}

function startNewSession() {
    closeFeedback();
    setTimeout(() => {
        startSession();
    }, 300);
}

function stopRecording() {
    if (isRecording) {
        endSession();
    }
}

// ================================
// 4. DATA FETCHING & STATS
// ================================

function fetchStats() {
    if (!isRecording) return;

    fetch('/data')
        .then(response => response.json())
        .then(data => {
            console.log('Stats received:', data);  // DEBUG
            updateEyeContact(data.eye_score, data.eye_status);
            updateFillerCount(data.filler_count);
            updateSentiment(data.sentiment_text, data.sentiment_score);
            
            // Dynamic tips based on performance
            generateLiveTips(data);
        })
        .catch(err => console.error("Stats fetch error:", err));
}

function updateEyeContact(score, status) {
    const scoreEl = document.getElementById('eyeScore');
    const statusEl = document.getElementById('eyeStatus');
    
    console.log(`Updating eye contact: ${score}% - ${status}`);  // DEBUG
    
    scoreEl.innerHTML = `${score}<span class="stat-unit">%</span>`;
    statusEl.textContent = status || "Analyzing...";
    
    // Color coding
    const card = scoreEl.closest('.stat-card');
    card.classList.remove('stat-excellent', 'stat-good', 'stat-poor');
    
    if (score > 80) {
        card.classList.add('stat-excellent');
    } else if (score > 60) {
        card.classList.add('stat-good');
    } else {
        card.classList.add('stat-poor');
    }
}

function updateFillerCount(count) {
    const fillerEl = document.getElementById('fillerCount');
    const currentCount = parseInt(fillerEl.textContent);
    
    console.log(`Updating filler count: ${currentCount} -> ${count}`);  // DEBUG
    
    if (count !== currentCount) {
        fillerEl.textContent = count;
        
        // Pulse animation on increase
        if (count > currentCount) {
            fillerEl.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                fillerEl.style.animation = '';
            }, 300);
        }
    }
}

function updateSentiment(text, score) {
    const sentimentEl = document.getElementById('sentimentText');
    const sentimentBar = document.getElementById('sentimentBar');
    
    console.log(`Updating sentiment: ${text} (${score}%)`);  // DEBUG
    
    sentimentEl.textContent = text;
    
    // Update progress bar
    const percentage = Math.max(0, Math.min(100, score));
    sentimentBar.style.width = `${percentage}%`;
    
    // Color based on sentiment
    if (text === 'Positive') {
        sentimentBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    } else if (text === 'Negative') {
        sentimentBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    } else {
        sentimentBar.style.background = 'linear-gradient(90deg, #6366f1, #818cf8)';
    }
}

function generateLiveTips(data) {
    const tipsEl = document.getElementById('liveTips');
    let tip = '';
    
    if (data.eye_score < 60) {
        tip = '👁️ Look directly at the camera for better eye contact';
    } else if (data.filler_count > 5 && wordCount > 50) {
        tip = '💬 Try to reduce filler words like "um" and "uh"';
    } else if (data.sentiment_text === 'Negative') {
        tip = '😊 Use more positive language to improve sentiment';
    } else if (data.eye_score > 80 && data.filler_count < 3) {
        tip = '🌟 Excellent! Keep up the great performance';
    } else {
        tip = '✨ You\'re doing great! Keep it natural';
    }
    
    if (tipsEl.textContent !== tip) {
        tipsEl.style.opacity = '0';
        setTimeout(() => {
            tipsEl.textContent = tip;
            tipsEl.style.opacity = '1';
        }, 150);
    }
}

function updateLiveTip(message) {
    const tipsEl = document.getElementById('liveTips');
    tipsEl.textContent = message;
}

// ================================
// 5. TIMER
// ================================

function updateTimer() {
    if (!sessionStartTime) return;
    
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const timerEl = document.getElementById('sessionTimer');
    const durationEl = document.getElementById('duration');
    
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    timerEl.textContent = timeString;
    durationEl.textContent = timeString;
}

// ================================
// 6. FEEDBACK MODAL
// ================================

function showFeedbackModal() {
    const overlay = document.getElementById('feedbackOverlay');
    const loadingState = document.getElementById('loadingState');
    const reportEl = document.getElementById('aiReport');
    
    overlay.style.display = 'flex';
    loadingState.style.display = 'flex';
    reportEl.style.display = 'none';
    
    // Animate in
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function fetchFeedback() {
    fetch('/get_feedback')
        .then(response => response.json())
        .then(data => {
            const loadingState = document.getElementById('loadingState');
            const reportEl = document.getElementById('aiReport');
            
            // Format the feedback
            const formattedFeedback = formatFeedbackHTML(data.message);
            
            reportEl.innerHTML = formattedFeedback;
            
            // Transition to report
            loadingState.style.display = 'none';
            reportEl.style.display = 'block';
            
            // Speak feedback
            speakText(data.message);
        })
        .catch(err => {
            console.error("Feedback error:", err);
            document.getElementById('aiReport').innerHTML = '<p class="error-message">⚠️ Unable to generate feedback. Please try again.</p>';
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('aiReport').style.display = 'block';
        });
}

function formatFeedbackHTML(text) {
    // Convert markdown-style formatting to HTML
    let html = text
        .replace(/### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/- (.*?)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/⭐/g, '<span class="star">⭐</span>');
    
    // Wrap lists
    html = html.replace(/(<li>.*?<\/li>\s*)+/gs, '<ul>$&</ul>');
    
    // Wrap in paragraphs if not already
    if (!html.startsWith('<h3>') && !html.startsWith('<p>')) {
        html = '<p>' + html + '</p>';
    }
    
    return html;
}

function closeFeedback() {
    const overlay = document.getElementById('feedbackOverlay');
    overlay.classList.remove('active');
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
    
    // Stop voice
    window.speechSynthesis.cancel();
}

// ================================
// 7. TEXT-TO-SPEECH
// ================================

function speakText(text) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Remove special characters for better pronunciation
    const cleanText = text
        .replace(/[#*-]/g, '')
        .replace(/\n+/g, '. ')
        .replace(/⭐|👁️|💬|🎭|💡|📊|💪|⚠️|🎯/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to get a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Zira') ||
        v.name.includes('Google UK English Female') ||
        (v.lang.includes('en') && v.name.includes('Female'))
    );
    
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }
    
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 0.9;
    
    window.speechSynthesis.speak(utterance);
}

// Load voices
window.speechSynthesis.onvoiceschanged = function() {
    window.speechSynthesis.getVoices();
};

// ================================
// 8. HELP MODAL
// ================================

function openHelp() {
    const overlay = document.getElementById('helpOverlay');
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.classList.add('active');
    }, 10);
}

function closeHelp() {
    const overlay = document.getElementById('helpOverlay');
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// ================================
// 9. UI UTILITIES
// ================================

function updateStatus(text, active) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = text;
    
    if (active) {
        statusDot.classList.add('status-active');
    } else {
        statusDot.classList.remove('status-active');
    }
}

function showNotification(message, type = 'info') {
    // Simple notification (you can enhance this)
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Could add toast notification here
    updateLiveTip(message);
}

// ================================
// 10. KEYBOARD SHORTCUTS
// ================================

document.addEventListener('keydown', function(e) {
    // Space to start/stop (when not typing)
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (!isRecording) {
            startSession();
        } else {
            endSession();
        }
    }
    
    // Escape to close modals
    if (e.code === 'Escape') {
        closeFeedback();
        closeHelp();
    }
    
    // H for help
    if (e.code === 'KeyH' && !isRecording) {
        openHelp();
    }
});

// ================================
// 11. INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 VIBE CHECK initialized');
    
    // Pre-load voices
    window.speechSynthesis.getVoices();
    
    // Initialize UI
    updateStatus("System Ready", false);
    updateWordCount(0);
    
    // Check for browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification("Camera/Microphone not supported in this browser", "error");
    }
});

// ================================
// 12. PERFORMANCE MONITORING
// ================================

// Detect if user leaves/returns to tab
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isRecording) {
        console.log('Tab hidden - session continues');
    } else if (!document.hidden && isRecording) {
        console.log('Tab visible again');
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function(e) {
    if (isRecording) {
        e.preventDefault();
        e.returnValue = 'You have an active session. Are you sure you want to leave?';
        return e.returnValue;
    }
});
