class SpeechRecognitionTool {
    constructor() {
        this.convertButton = document.getElementById('click_to_convert');
        this.textArea = document.getElementById('convert_text');
        this.feedbackArea = document.getElementById('pronunciation-feedback') || 
                             document.createElement('div');

        this.setupRecognition();
    }

    setupRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.setupEventListeners();
        } else {
            this.convertButton.disabled = true;
            this.textArea.value = 'Speech recognition not supported in this browser';
        }
    }

    setupEventListeners() {
        this.convertButton.addEventListener('click', () => this.toggleRecording());

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.textArea.value = transcript;
            this.providePronunciationFeedback(transcript);
        };

        this.recognition.onerror = (event) => {
            this.textArea.value = 'Error occurred in recognition: ' + event.error;
            this.stopRecording();
        };

        this.recognition.onend = () => {
            this.stopRecording();
        };
    }

    toggleRecording() {
        if (!this.convertButton.classList.contains('recording')) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        this.textArea.value = 'Listening...';
        this.convertButton.classList.add('recording');
        this.convertButton.textContent = 'Recording...';
        this.recognition.start();
    }

    stopRecording() {
        this.convertButton.classList.remove('recording');
        this.convertButton.textContent = 'Voice to Text';
        this.recognition.stop();
    }

    providePronunciationFeedback(text) {
        const commonPronunciationChallenges = {
            'schedule': 'Try pronouncing as "sked-jool"',
            'pronunciation': 'Focus on clear syllable separation',
            'comfortable': 'Stress the first syllable: "KUMF-ter-bul"',
            'vegetable': 'Pronounce as "VEJ-tuh-bul"'
        };

        let feedback = [];
        
        Object.entries(commonPronunciationChallenges).forEach(([word, tip]) => {
            if (text.toLowerCase().includes(word)) {
                feedback.push(`Word "${word}": ${tip}`);
            }
        });

        this.displayFeedback(feedback);
    }

    displayFeedback(feedbackList) {
        if (feedbackList.length > 0) {
            this.feedbackArea.innerHTML = `
                <h3>Pronunciation Tips:</h3>
                <ul>
                    ${feedbackList.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            `;
        } else {
            this.feedbackArea.innerHTML = 'No specific pronunciation feedback at this time.';
        }
    }
}

// Initialize the tool when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpeechRecognitionTool();
});