# Agent Usage Examples

This repository provides comprehensive examples of how to use intelligent agents in web applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Basic Agent Usage](#basic-agent-usage)
- [Advanced Examples](#advanced-examples)
- [Configuration](#configuration)
- [API Reference](#api-reference)

## Quick Start

To get started with the agent, follow these simple steps:

### 1. Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
    <title>Agent Example</title>
    <script src="https://cdn.jsdelivr.net/npm/agent-sdk@latest/dist/agent.min.js"></script>
</head>
<body>
    <div id="agent-container"></div>
    <script>
        // Initialize the agent
        const agent = new Agent({
            apiKey: 'your-api-key',
            containerId: 'agent-container'
        });
        
        agent.start();
    </script>
</body>
</html>
```

### 2. Simple Chat Integration

```javascript
// Basic chat example
const agent = new Agent({
    apiKey: 'your-api-key',
    mode: 'chat',
    onMessage: (message) => {
        console.log('Agent response:', message);
    }
});

// Send a message to the agent
agent.sendMessage('Hello, how can you help me?');
```

## Basic Agent Usage

### Text-based Interactions

```javascript
// Example 1: Simple Q&A
const agent = new Agent({
    apiKey: 'your-api-key',
    personality: 'helpful',
    language: 'en'
});

agent.ask('What is the weather today?')
    .then(response => {
        console.log(response.text);
    });
```

### Voice Interactions

```javascript
// Example 2: Voice-enabled agent
const voiceAgent = new Agent({
    apiKey: 'your-api-key',
    enableVoice: true,
    voiceSettings: {
        language: 'en-US',
        pitch: 1.0,
        rate: 1.0
    }
});

voiceAgent.startListening();
```

### Task Automation

```javascript
// Example 3: Automated task execution
const taskAgent = new Agent({
    apiKey: 'your-api-key',
    capabilities: ['web-search', 'calendar', 'email']
});

taskAgent.executeTask({
    type: 'schedule-meeting',
    participants: ['john@example.com', 'jane@example.com'],
    date: '2024-01-15',
    time: '14:00',
    duration: 60
});
```

## Advanced Examples

### Custom Agent Behavior

```javascript
// Creating a specialized customer service agent
const customerServiceAgent = new Agent({
    apiKey: 'your-api-key',
    personality: 'professional',
    knowledgeBase: 'customer-service-kb',
    customInstructions: `
        You are a helpful customer service representative.
        Always be polite and try to resolve issues efficiently.
        If you cannot help, escalate to a human agent.
    `,
    onEscalation: (context) => {
        // Handle escalation to human agent
        notifyHumanAgent(context);
    }
});
```

### Multi-modal Agent

```javascript
// Agent that handles text, images, and documents
const multiModalAgent = new Agent({
    apiKey: 'your-api-key',
    capabilities: ['text', 'image-analysis', 'document-processing'],
    onFileUpload: (file) => {
        agent.processFile(file)
            .then(analysis => {
                console.log('File analysis:', analysis);
            });
    }
});

// Process an image
multiModalAgent.analyzeImage('/path/to/image.jpg')
    .then(result => {
        console.log('Image contains:', result.objects);
    });
```

### Workflow Integration

```javascript
// Agent integrated with business workflows
const workflowAgent = new Agent({
    apiKey: 'your-api-key',
    workflows: {
        'order-processing': {
            steps: [
                'validate-order',
                'check-inventory',
                'process-payment',
                'ship-order'
            ],
            onStepComplete: (step, data) => {
                console.log(`Completed: ${step}`, data);
            }
        }
    }
});

// Trigger a workflow
workflowAgent.startWorkflow('order-processing', {
    orderId: '12345',
    customerId: 'cust-789'
});
```

## Configuration

### Environment Variables

```bash
# .env file
AGENT_API_KEY=your-secret-api-key
AGENT_MODEL=gpt-4
AGENT_TIMEOUT=30000
AGENT_MAX_TOKENS=2048
```

### Configuration File

```json
{
  "agent": {
    "apiKey": "${AGENT_API_KEY}",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2048,
    "timeout": 30000,
    "retryAttempts": 3,
    "enableLogging": true,
    "logLevel": "info"
  },
  "ui": {
    "theme": "light",
    "position": "bottom-right",
    "showTypingIndicator": true,
    "enableEmoji": true
  }
}
```

## API Reference

### Agent Class

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | Your API key for the agent service |
| `model` | string | 'gpt-3.5-turbo' | The AI model to use |
| `temperature` | number | 0.7 | Controls randomness in responses |
| `maxTokens` | number | 1024 | Maximum tokens in response |
| `personality` | string | 'neutral' | Agent personality (helpful, professional, casual) |

#### Methods

```javascript
// Core methods
agent.start()                    // Initialize the agent
agent.stop()                     // Stop the agent
agent.sendMessage(text)          // Send a text message
agent.ask(question)              // Ask a question and get response
agent.reset()                    // Reset conversation history

// Advanced methods
agent.setPersonality(type)       // Change agent personality
agent.loadKnowledgeBase(kb)      // Load custom knowledge
agent.enableVoice()              // Enable voice interactions
agent.processFile(file)          // Process uploaded files
agent.executeTask(task)          // Execute automated tasks
```

### Events

```javascript
agent.on('message', (data) => {
    console.log('New message:', data.text);
});

agent.on('thinking', () => {
    console.log('Agent is processing...');
});

agent.on('error', (error) => {
    console.error('Agent error:', error);
});

agent.on('ready', () => {
    console.log('Agent is ready to use');
});
```

## Examples in Action

See the `examples/` directory for complete working examples:

- `examples/basic-chat.html` - Simple chat interface
- `examples/voice-assistant.html` - Voice-enabled assistant
- `examples/file-processor.html` - Document analysis tool
- `examples/workflow-automation.js` - Business process automation
- `examples/custom-personality.js` - Specialized agent behaviors

## Contributing

To contribute examples or improvements:

1. Fork this repository
2. Create a feature branch
3. Add your example with documentation
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
