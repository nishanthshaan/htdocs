# Agent Usage Examples

This repository demonstrates various ways to use AI agents in web applications. Below are practical examples showing how to integrate and interact with different types of agents.

## Table of Contents
- [Quick Start](#quick-start)
- [Basic Agent Integration](#basic-agent-integration)
- [API Usage Examples](#api-usage-examples)
- [Advanced Features](#advanced-features)
- [Configuration](#configuration)
- [Best Practices](#best-practices)

## Quick Start

### 1. Basic Chatbot Agent

```html
<!DOCTYPE html>
<html>
<head>
    <title>Agent Example</title>
    <script src="agent.js"></script>
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <input type="text" id="user-input" placeholder="Ask the agent anything...">
        <button onclick="sendMessage()">Send</button>
    </div>
</body>
</html>
```

### 2. Initialize the Agent

```javascript
// Initialize agent with configuration
const agent = new Agent({
    apiKey: 'your-api-key',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 150
});

// Basic interaction
async function sendMessage() {
    const input = document.getElementById('user-input');
    const response = await agent.chat(input.value);
    displayMessage(response);
}
```

## Basic Agent Integration

### HTML Setup

Create a simple chat interface:

```html
<div class="agent-chat">
    <div class="chat-history" id="chatHistory"></div>
    <div class="input-area">
        <input type="text" id="messageInput" placeholder="Type your message...">
        <button onclick="sendToAgent()">Send</button>
    </div>
</div>
```

### JavaScript Integration

```javascript
class WebAgent {
    constructor(config) {
        this.apiEndpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';
        this.apiKey = config.apiKey;
        this.model = config.model || 'gpt-3.5-turbo';
    }

    async sendMessage(message) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: message }]
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Agent error:', error);
            return 'Sorry, I encountered an error. Please try again.';
        }
    }
}

// Usage
const agent = new WebAgent({
    apiKey: 'your-api-key-here',
    model: 'gpt-3.5-turbo'
});

async function sendToAgent() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message) {
        addMessageToChat('You', message);
        const response = await agent.sendMessage(message);
        addMessageToChat('Agent', response);
        input.value = '';
    }
}

function addMessageToChat(sender, message) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
```

## API Usage Examples

### 1. RESTful Agent API

```javascript
// GET request to agent
async function getAgentStatus() {
    const response = await fetch('/api/agent/status');
    const status = await response.json();
    return status;
}

// POST request with data
async function sendDataToAgent(data) {
    const response = await fetch('/api/agent/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    return await response.json();
}
```

### 2. WebSocket Agent Connection

```javascript
class RealtimeAgent {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.ws.onopen = () => {
            console.log('Connected to agent');
        };

        this.ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            this.handleAgentResponse(response);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from agent');
        };
    }

    sendMessage(message) {
        this.ws.send(JSON.stringify({
            type: 'message',
            content: message,
            timestamp: Date.now()
        }));
    }

    handleAgentResponse(response) {
        // Handle agent response
        console.log('Agent response:', response);
    }
}

// Usage
const realtimeAgent = new RealtimeAgent('ws://localhost:8080/agent');
```

## Advanced Features

### 1. Context-Aware Agent

```javascript
class ContextualAgent {
    constructor(config) {
        this.config = config;
        this.conversationHistory = [];
    }

    async chat(message, context = {}) {
        // Add context to the conversation
        const contextualMessage = {
            role: 'user',
            content: message,
            context: context
        };

        this.conversationHistory.push(contextualMessage);

        // Send to agent with full context
        const response = await this.sendWithContext();
        
        this.conversationHistory.push({
            role: 'assistant',
            content: response
        });

        return response;
    }

    async sendWithContext() {
        // Implementation with conversation history
        // This maintains context across multiple interactions
    }
}
```

### 2. Multi-Modal Agent (Text + Images)

```javascript
class MultiModalAgent {
    async processImageAndText(imageFile, textPrompt) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('prompt', textPrompt);

        const response = await fetch('/api/agent/multimodal', {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }
}

// Usage with file upload
document.getElementById('imageUpload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const prompt = document.getElementById('imagePrompt').value;
    
    const agent = new MultiModalAgent();
    const result = await agent.processImageAndText(file, prompt);
    
    displayResult(result);
});
```

## Configuration

### Environment Variables

```bash
# .env file
AGENT_API_KEY=your_api_key_here
AGENT_MODEL=gpt-3.5-turbo
AGENT_TEMPERATURE=0.7
AGENT_MAX_TOKENS=150
AGENT_TIMEOUT=30000
```

### Configuration File

```javascript
// agent-config.js
const agentConfig = {
    development: {
        apiEndpoint: 'http://localhost:3000/api/agent',
        apiKey: process.env.AGENT_API_KEY,
        debug: true
    },
    production: {
        apiEndpoint: 'https://api.yourservice.com/agent',
        apiKey: process.env.AGENT_API_KEY,
        debug: false
    }
};

module.exports = agentConfig[process.env.NODE_ENV || 'development'];
```

## Best Practices

### 1. Error Handling

```javascript
async function safeAgentCall(message) {
    try {
        const response = await agent.sendMessage(message);
        return response;
    } catch (error) {
        console.error('Agent call failed:', error);
        
        // Fallback response
        return 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
    }
}
```

### 2. Rate Limiting

```javascript
class RateLimitedAgent {
    constructor(config) {
        this.agent = new Agent(config);
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimitDelay = config.rateLimitDelay || 1000;
    }

    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ message, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        while (this.requestQueue.length > 0) {
            const { message, resolve, reject } = this.requestQueue.shift();
            
            try {
                const response = await this.agent.sendMessage(message);
                resolve(response);
            } catch (error) {
                reject(error);
            }

            // Wait before processing next request
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        }

        this.isProcessing = false;
    }
}
```

### 3. Input Validation

```javascript
function validateUserInput(input) {
    // Check for empty input
    if (!input || input.trim().length === 0) {
        throw new Error('Input cannot be empty');
    }

    // Check for maximum length
    if (input.length > 1000) {
        throw new Error('Input too long (max 1000 characters)');
    }

    // Check for potentially harmful content
    const forbiddenPatterns = [/<script>/i, /javascript:/i];
    for (const pattern of forbiddenPatterns) {
        if (pattern.test(input)) {
            throw new Error('Invalid input detected');
        }
    }

    return input.trim();
}
```

## Examples Directory

Check the `examples/` directory for complete working examples:

- `examples/basic-chat.html` - Simple chatbot interface
- `examples/api-integration.js` - RESTful API examples
- `examples/websocket-agent.js` - Real-time communication
- `examples/multimodal.html` - Text and image processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your agent example
4. Submit a pull request

## License

MIT License - feel free to use these examples in your own projects.
