// WebSocket connection
const ws = new WebSocket('ws://localhost:5000');

// DOM elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const energyDisplay = document.getElementById('energy');
const moodDisplay = document.getElementById('mood');
const confidenceDisplay = document.getElementById('confidence');

// WebSocket event handlers
ws.onopen = () => {
    console.log('Connected to server');
    addMessage('System', 'Connected to AI Self-Aware Agent', 'system');
};

ws.onclose = () => {
    console.log('Disconnected from server');
    addMessage('System', 'Disconnected from server', 'system');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    addMessage('System', 'Error connecting to server', 'error');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
        case 'state':
            updateStatus(data.data);
            break;
        case 'response':
            addMessage('Agent', data.data.content, 'agent');
            break;
        case 'error':
            addMessage('System', data.data.message, 'error');
            break;
    }
};

// UI event handlers
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Functions
function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        ws.send(JSON.stringify({
            type: 'input',
            content: message
        }));
        addMessage('You', message, 'user');
        userInput.value = '';
    }
}

function addMessage(sender, content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'sender';
    senderSpan.textContent = sender + ': ';
    
    const contentSpan = document.createElement('span');
    contentSpan.className = 'content';
    contentSpan.textContent = content;
    
    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(contentSpan);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateStatus(state) {
    // Update energy with color coding
    energyDisplay.textContent = `${Math.round(state.energy)}%`;
    energyDisplay.className = 'value ' + 
        (state.energy > 50 ? 'energy-high' : 
         state.energy > 20 ? 'energy-medium' : 'energy-low');
    
    // Update mood with emoji
    const moodEmoji = state.mood > 0.5 ? '😊' : 
                     state.mood < -0.5 ? '😔' : '😐';
    moodDisplay.textContent = moodEmoji;
    
    // Update confidence
    confidenceDisplay.textContent = `${Math.round(state.confidence * 100)}%`;
}

// Add welcome message
addMessage('System', 'Welcome to the AI Self-Aware Agent interface! Type a message or use :help for commands.', 'system'); 