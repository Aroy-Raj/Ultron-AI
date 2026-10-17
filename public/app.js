const $ = (id) => document.getElementById(id);

const micButton = $("micButton");
const orb = $("orb");
const orbCaption = $("orbCaption");
const micTitle = $("micTitle");
const micHint = $("micHint");
const transcriptPanel = $("transcriptPanel");
const transcriptText = $("transcriptText");
const responseText = $("responseText");
const responseTitle = $("responseTitle");
const sources = $("sources");
const sendButton = $("sendButton");
const textInput = $("textInput");
const voiceToggle = $("voiceToggle");
const voiceLabel = $("voiceLabel");

let recognition = null;
let isListening = false;
let speakReplies = true;
let lastAnswer = "";
let currentRequest = null;

function setStatus(mode, title, hint) {
  orb.classList.remove("listening", "thinking", "speaking");
  if (mode) orb.classList.add(mode);
  orbCaption.textContent = title.toUpperCase();
  micTitle.textContent = title;
  if (hint) micHint.textContent = hint;
  micButton.classList.toggle("active", mode === "listening");
}

function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  orb.classList.remove("speaking");
}

function speak(text) {
  if (!speakReplies || !("speechSynthesis" in window) || !text) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1.02;
  utterance.pitch = 1.0;
  utterance.onstart = () => setStatus("speaking", "Nova is speaking", "Tap the microphone when you want to talk.");
  utterance.onend = () => setStatus("", "Tap the orb to speak", "Your microphone is ready when you are.");
  utterance.onerror = () => setStatus("", "Tap the orb to speak", "Voice playback is not available right now.");
  window.speechSynthesis.speak(utterance);
}

function addSources(urls) {
  sources.replaceChildren();
  (urls || []).forEach((item) => {
    if (!item || !item.url || !/^https?:\/\//i.test(item.url)) return;
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.title || "Open source";
    sources.appendChild(a);
  });
}

async function askAI(question) {
  const prompt = question.trim();
  if (!prompt) return;
  stopSpeech();
  if (recognition && isListening) {
    try { recognition.stop(); } catch (_) {}
  }
  isListening = false;
  micButton.disabled = true;
  sendButton.disabled = true;
  responseTitle.textContent = "NOVA IS THINKING";
  responseText.textContent = "Let me look into that…";
  sources.replaceChildren();
  setStatus("thinking", "Thinking", "Connecting to the AI model and checking information when needed.");
  currentRequest = new AbortController();

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
      signal: currentRequest.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    lastAnswer = data.answer || "I couldn't create an answer for that.";
    responseTitle.textContent = "NOVA'S RESPONSE";
    responseText.textContent = lastAnswer;
    addSources(data.sources || []);
    setStatus("", "Tap the orb to speak", "Ask another question whenever you're ready.");
    speak(lastAnswer);
  } catch (error) {
    if (error.name === "AbortError") return;
    responseTitle.textContent = "CONNECTION ISSUE";
    responseText.textContent = error.message || "I couldn't connect to the AI service. Check that the server is running and your API key is configured.";
    setStatus("", "Tap the orb to try again", "Check your internet connection and server settings.");
  } finally {
    micButton.disabled = false;
    sendButton.disabled = false;
    currentRequest = null;
  }
}

function setupRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setStatus("", "Voice input not supported", "Use Chrome or Edge on a secure localhost/HTTPS page, or type below.");
    micButton.disabled = true;
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    transcriptPanel.hidden = false;
    transcriptText.textContent = "Listening…";
    setStatus("listening", "Listening to you…", "Speak clearly. Nova will answer when you finish.");
  };
  recognition.onresult = (event) => {
    let interim = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const phrase = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += phrase;
      else interim += phrase;
    }
    transcriptText.textContent = finalText || interim || "Listening…";
    if (finalText.trim()) {
      transcriptText.textContent = finalText.trim();
      askAI(finalText.trim());
    }
  };
  recognition.onerror = (event) => {
    isListening = false;
    const messages = {
      "not-allowed": "Microphone access was blocked. Allow it in your browser's site settings.",
      "no-speech": "I didn't hear anything. Tap the microphone and try again.",
      "network": "Speech recognition needs a working network connection in this browser.",
      "audio-capture": "No microphone was found. Check your input device."
    };
    setStatus("", "Tap the orb to speak", messages[event.error] || "Voice input stopped. Please try again.");
  };
  recognition.onend = () => {
    isListening = false;
    micButton.classList.remove("active");
    if (!orb.classList.contains("thinking") && !orb.classList.contains("speaking")) {
      orb.classList.remove("listening");
    }
  };
}

micButton.addEventListener("click", () => {
  if (!recognition) {
    setupRecognition();
    if (!recognition) return;
  }
  if (isListening) {
    try { recognition.stop(); } catch (_) {}
    isListening = false;
    setStatus("", "Tap the orb to speak", "Listening stopped.");
  } else {
    stopSpeech();
    try { recognition.start(); }
    catch (_) { setStatus("", "Microphone is busy", "Wait a moment, then tap the microphone again."); }
  }
});

$("askForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = textInput.value.trim();
  if (!value) return;
  textInput.value = "";
  transcriptPanel.hidden = false;
  transcriptText.textContent = value;
  askAI(value);
});

voiceToggle.addEventListener("click", () => {
  speakReplies = !speakReplies;
  voiceLabel.textContent = speakReplies ? "Voice on" : "Voice off";
  voiceToggle.firstChild.textContent = speakReplies ? "🔊 " : "🔇 ";
  if (!speakReplies) stopSpeech();
});

$("speakAgain").addEventListener("click", () => speak(lastAnswer));
$("stopSpeaking").addEventListener("click", () => {
  stopSpeech();
  setStatus("", "Tap the orb to speak", "Voice playback stopped.");
});
$("clearButton").addEventListener("click", () => {
  stopSpeech();
  if (recognition && isListening) { try { recognition.stop(); } catch (_) {} }
  transcriptPanel.hidden = true;
  transcriptText.textContent = "";
  sources.replaceChildren();
  responseTitle.textContent = "NOVA'S RESPONSE";
  responseText.textContent = "Ready for your next question. Tap the microphone and speak naturally.";
  lastAnswer = "";
  setStatus("", "Tap the orb to speak", "Allow microphone access when your browser asks.");
});
setupRecognition();
