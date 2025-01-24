class IELTSSpeakingSimulator {
    constructor() {
        this.conversation = document.getElementById('conversation');
        this.cueCard = document.getElementById('cue-card');
        this.feedback = document.getElementById('feedback');
        this.scoreDisplay = document.getElementById('score-display');
        this.startRecordingButton = document.getElementById('start-recording');
        this.practiceModeButton = document.getElementById('practice-mode');
        this.testModeButton = document.getElementById('test-mode');

        this.currentMode = 'practice'; // Default mode
        this.testParts = [ /* ... (IELTS test structure as before) */ ];
        this.currentPartIndex = 0;
        this.currentQuestionIndex = 0;
        this.isRecording = false;

        this.setupRecognition();
        this.setupEventListeners();
        this.startTest(); // Initialize the test on load
    }

    setupRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.startRecordingButton.textContent = "Stop Recording";
            }
            this.recognition.onend = () => {
                this.isRecording = false;
                this.startRecordingButton.textContent = "Start Recording";
            }

            this.recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                this.conversation.value += "\nSpeech recognition error.";
                this.isRecording = false;
                this.startRecordingButton.textContent = "Start Recording";
            };
            this.recognition.onresult = async (event) => {
                const transcript = event.results[0][0].transcript;
                this.conversation.value += "\nYou: " + transcript + "\n";

                if (this.currentMode === 'test') {
                    await this.handleTestTurn(transcript);
                } else {
                    this.providePronunciationFeedback(transcript);
                }
            };
        } else {
            this.conversation.value = "Speech Recognition is not supported in this browser.";
            this.startRecordingButton.disabled = true;
        }
    }

    setupEventListeners() {
        this.startRecordingButton.addEventListener('click', () => {
            if (this.isRecording) {
                this.recognition.stop();
            } else {
                this.recognition.start();
            }
        });
        this.practiceModeButton.addEventListener('click', () => {
            this.currentMode = 'practice';
            this.startTest();
        });
        this.testModeButton.addEventListener('click', () => {
            this.currentMode = 'test';
            this.startTest();
        });
    }

    async handleTestTurn(userTranscript) {
        let context = "";
        if (this.currentTestPart.type === "Part 2") {
            context = "Here is the cue card: " + this.currentTestPart.cueCard + ". ";
        }
        try {
            const examinerResponse = await this.getLLMResponse(userTranscript, "You are an IELTS examiner. " + context + "The user just said: ");
            this.conversation.value += "Examiner: " + examinerResponse + "\n";

            const feedbackFromLLM = await this.getLLMResponse(userTranscript, "You are an IELTS examiner. Provide feedback on the user's fluency, grammar, and vocabulary based on this text: ");
            this.feedback.innerHTML = "<p>" + feedbackFromLLM + "</p>";
            this.advanceTest();
        } catch (error) {
            this.conversation.value += "\nError communicating with the examiner.";
            console.error("Error in handleTestTurn:", error);
        }
    }

    advanceTest() {
        if (this.currentTestPart.type === "Part 1") {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex >= this.currentTestPart.questions.length) {
                this.currentQuestionIndex = 0;
                this.currentPartIndex++;
                this.currentTestPart = this.testParts[this.currentPartIndex];
                if (this.currentTestPart && this.currentTestPart.type === "Part 2") {
                    this.cueCard.textContent = this.currentTestPart.cueCard;
                    this.cueCard.style.display = "block";
                }
            }
        } else if (this.currentTestPart && this.currentTestPart.type === "Part 2") {
            this.currentPartIndex++;
            if (this.currentPartIndex < this.testParts.length) {
                this.currentTestPart = this.testParts[this.currentPartIndex];
                if (this.currentTestPart.type === "Part 3") {
                    this.cueCard.style.display = "none";
                }
            } else {
                this.conversation.value += "\nTest Complete!";
                this.startRecordingButton.disabled = true;
            }
        } else if (this.currentTestPart && this.currentTestPart.type === "Part 3") {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex >= this.currentTestPart.discussionQuestions.length) {
                this.conversation.value += "\nTest Complete!";
                this.startRecordingButton.disabled = true;
            }
        }
    }

    startTest() {
        this.currentPartIndex = 0;
        this.currentQuestionIndex = 0;
        this.currentTestPart = this.testParts[this.currentPartIndex];
        this.conversation.value = "";
        this.feedback.innerHTML = "";
        this.scoreDisplay.textContent = "";
        this.startRecordingButton.disabled = false;
        if (this.currentTestPart && this.currentTestPart.type === "Part 2") {
            this.cueCard.textContent = this.currentTestPart.cueCard;
            this.cueCard.style.display = "block";
        } else {
            this.cueCard.style.display = "none";
        }
    }

    async getLLMResponse(userText, context = "") {
        try {
            const response = await fetch('/api/getLLMResponse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: "system", content: "You are an IELTS examiner." }, { role: "user", content: context + userText }] })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error("Error calling LLM API:", error);
            return "Error getting response from examiner.";
        }
    }

    providePronunciationFeedback(text) { /* ... (Pronunciation feedback as before) */ }
}

document.addEventListener('DOMContentLoaded', () => {
    new IELTSSpeakingSimulator();
});