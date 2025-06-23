// WebSocket connection
const ws = new WebSocket('ws://localhost:5000');

// DOM elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const energyDisplay = document.getElementById('energy');
const moodDisplay = document.getElementById('mood');
const confidenceDisplay = document.getElementById('confidence');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');
const modelSelect = document.getElementById('model-select');

// WebSocket event handlers
ws.onopen = () => {
    console.log('Connected to server');
    updateConnectionStatus('connected');
    addMessage('System', 'Connected to AI Self-Aware Agent', 'system');
};

ws.onclose = () => {
    console.log('Disconnected from server');
    updateConnectionStatus('disconnected');
    addMessage('System', 'Disconnected from server', 'system');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateConnectionStatus('error');
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
function updateConnectionStatus(status) {
    switch (status) {
        case 'connected':
            statusDot.style.background = '#27ae60';
            statusText.textContent = 'Connected';
            statusText.style.color = '#27ae60';
            break;
        case 'disconnected':
            statusDot.style.background = '#e74c3c';
            statusText.textContent = 'Disconnected';
            statusText.style.color = '#e74c3c';
            break;
        case 'error':
            statusDot.style.background = '#f39c12';
            statusText.textContent = 'Error';
            statusText.style.color = '#f39c12';
            break;
    }
}

function sendMessage() {
    const message = userInput.value.trim();
    const selectedModel = modelSelect.value;
    if (message) {
        ws.send(JSON.stringify({
            type: 'input',
            content: message,
            model: selectedModel
        }));
        addMessage('You', message, 'user');
        userInput.value = '';
        
        // Add loading indicator
        addLoadingMessage();
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

function addLoadingMessage() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message system-message';
    loadingDiv.id = 'loading-message';
    
    const loadingSpan = document.createElement('span');
    loadingSpan.className = 'loading';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = ' Agent is thinking...';
    
    loadingDiv.appendChild(loadingSpan);
    loadingDiv.appendChild(textSpan);
    
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

function updateStatus(state) {
    // Remove loading message when we get a response
    removeLoadingMessage();
    
    // Update energy with color coding and pulse animation
    energyDisplay.textContent = `${Math.round(state.energy)}%`;
    energyDisplay.className = 'value pulse ' + 
        (state.energy > 70 ? 'energy-high' : 
         state.energy > 30 ? 'energy-medium' : 'energy-low');
    
    // Update mood with emoji and color coding
    let moodEmoji, moodClass;
    if (state.mood > 0.3) {
        moodEmoji = '😊';
        moodClass = 'mood-happy';
    } else if (state.mood < -0.3) {
        moodEmoji = '😔';
        moodClass = 'mood-sad';
    } else {
        moodEmoji = '😐';
        moodClass = 'mood-neutral';
    }
    moodDisplay.textContent = moodEmoji;
    moodDisplay.className = 'value pulse ' + moodClass;
    
    // Update confidence with color coding
    const confidencePercent = Math.round(state.confidence * 100);
    confidenceDisplay.textContent = `${confidencePercent}%`;
    confidenceDisplay.className = 'value pulse ' + 
        (confidencePercent > 70 ? 'confidence-high' : 
         confidencePercent > 40 ? 'confidence-medium' : 'confidence-low');
    
    // Add visual feedback for status changes
    const statusItems = document.querySelectorAll('.status-item');
    statusItems.forEach(item => {
        item.classList.add('pulse');
        setTimeout(() => item.classList.remove('pulse'), 600);
    });
}

// Add welcome message with colorful styling
addMessage('System', '🎉 Welcome to the AI Self-Aware Agent interface! 🌟', 'system');
addMessage('System', 'Type a message or use :help for available commands.', 'system');

// Add some visual flair to the interface
document.addEventListener('DOMContentLoaded', () => {
    // Add subtle animation to the header
    const header = document.querySelector('header');
    header.style.animation = 'fadeInUp 1s ease';
    
    // Add hover effects to status items
    const statusItems = document.querySelectorAll('.status-item');
    statusItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-5px) scale(1.02)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click handlers for command cards
    const commandList = document.getElementById('command-list');
    if (commandList) {
        commandList.addEventListener('click', (e) => {
            const commandItem = e.target.closest('li[data-command]');
            if (commandItem) {
                const command = commandItem.dataset.command;
                userInput.value = command;
                userInput.focus();
            }
        });
    }

    // Add typing indicator
    let typingTimeout;
    userInput.addEventListener('input', () => {
        clearTimeout(typingTimeout);
        sendButton.style.background = 'linear-gradient(135deg, #f093fb, #667eea)';
        
        typingTimeout = setTimeout(() => {
            sendButton.style.background = 'linear-gradient(135deg, #f093fb, #667eea)';
        }, 1000);
    });
}); 