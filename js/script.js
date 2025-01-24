const convertButton = document.getElementById('click_to_convert');
const textArea = document.getElementById('convert_text');

// Check browser support for speech recognition
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    convertButton.addEventListener('click', () => {
        recognition.start();
    });

    recognition.onresult = (event) => {
        textArea.value = event.results[0][0].transcript;
    };

    recognition.onerror = (event) => {
        textArea.value = 'Error occurred in recognition: ' + event.error;
    };
} else {
    convertButton.disabled = true;
    textArea.value = 'Speech recognition not supported';
}