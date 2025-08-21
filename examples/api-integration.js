/**
 * API Integration Examples for Agent Usage
 * This file demonstrates various ways to integrate with agent APIs
 */

// Example 1: Basic REST API Integration
class RestAgent {
    constructor(config) {
        this.baseURL = config.baseURL || 'https://api.example.com';
        this.apiKey = config.apiKey;
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...config.headers
        };
    }

    async sendMessage(message, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}/agent/chat`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    message: message,
                    ...options
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('REST API Error:', error);
            throw error;
        }
    }

    async getAgentCapabilities() {
        try {
            const response = await fetch(`${this.baseURL}/agent/capabilities`, {
                headers: this.headers
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching capabilities:', error);
            throw error;
        }
    }

    async uploadFile(file, prompt) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prompt', prompt);

        try {
            const response = await fetch(`${this.baseURL}/agent/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            return await response.json();
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }
}

// Example 2: WebSocket Real-time Agent
class WebSocketAgent {
    constructor(wsURL, config = {}) {
        this.wsURL = wsURL;
        this.config = config;
        this.ws = null;
        this.messageHandlers = new Map();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.wsURL);

                this.ws.onopen = () => {
                    console.log('Connected to agent WebSocket');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    // Send authentication if required
                    if (this.config.apiKey) {
                        this.send({
                            type: 'auth',
                            token: this.config.apiKey
                        });
                    }
                    
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };

                this.ws.onclose = () => {
                    console.log('WebSocket connection closed');
                    this.isConnected = false;
                    this.attemptReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    send(data) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    sendMessage(message, conversationId = null) {
        const messageId = this.generateMessageId();
        
        this.send({
            type: 'message',
            id: messageId,
            content: message,
            conversationId: conversationId,
            timestamp: Date.now()
        });

        // Return a promise that resolves when we get the response
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.messageHandlers.delete(messageId);
                reject(new Error('Message timeout'));
            }, 30000); // 30 second timeout

            this.messageHandlers.set(messageId, {
                resolve,
                reject,
                timeout
            });
        });
    }

    handleMessage(data) {
        switch (data.type) {
            case 'response':
                this.handleResponse(data);
                break;
            case 'error':
                this.handleError(data);
                break;
            case 'status':
                this.handleStatus(data);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    handleResponse(data) {
        const handler = this.messageHandlers.get(data.messageId);
        if (handler) {
            clearTimeout(handler.timeout);
            handler.resolve(data.content);
            this.messageHandlers.delete(data.messageId);
        }
    }

    handleError(data) {
        const handler = this.messageHandlers.get(data.messageId);
        if (handler) {
            clearTimeout(handler.timeout);
            handler.reject(new Error(data.error));
            this.messageHandlers.delete(data.messageId);
        }
    }

    handleStatus(data) {
        console.log('Agent status:', data.status);
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
            
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    generateMessageId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }
}

// Example 3: Streaming Agent Response
class StreamingAgent {
    constructor(config) {
        this.config = config;
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
    }

    async *streamMessage(message, options = {}) {
        const response = await fetch(`${this.baseURL}/agent/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                message: message,
                stream: true,
                ...options
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            yield parsed;
                        } catch (error) {
                            console.warn('Failed to parse streaming data:', data);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
}

// Example 4: Batch Processing Agent
class BatchAgent {
    constructor(config) {
        this.config = config;
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
        this.batchQueue = [];
        this.isProcessing = false;
    }

    addToBatch(message, metadata = {}) {
        const batchItem = {
            id: this.generateId(),
            message: message,
            metadata: metadata,
            timestamp: Date.now()
        };

        this.batchQueue.push(batchItem);
        return batchItem.id;
    }

    async processBatch() {
        if (this.isProcessing || this.batchQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const batch = [...this.batchQueue];
        this.batchQueue = [];

        try {
            const response = await fetch(`${this.baseURL}/agent/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    items: batch
                })
            });

            const results = await response.json();
            this.isProcessing = false;
            return results;

        } catch (error) {
            console.error('Batch processing error:', error);
            this.isProcessing = false;
            throw error;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Example 5: Agent with Retry Logic
class ResilientAgent {
    constructor(config) {
        this.config = config;
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000;
    }

    async sendMessage(message, options = {}) {
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseURL}/agent/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        message: message,
                        ...options
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.response;
                }

                // If it's a client error (4xx), don't retry
                if (response.status >= 400 && response.status < 500) {
                    throw new Error(`Client error: ${response.status}`);
                }

                throw new Error(`Server error: ${response.status}`);

            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error.message);

                // Don't retry on the last attempt
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`All retry attempts failed. Last error: ${lastError.message}`);
    }
}

// Usage Examples:

// Example 1: Using REST Agent
async function restAgentExample() {
    const agent = new RestAgent({
        baseURL: 'https://api.youragent.com',
        apiKey: 'your-api-key'
    });

    try {
        const response = await agent.sendMessage('Hello, agent!');
        console.log('Agent response:', response);

        const capabilities = await agent.getAgentCapabilities();
        console.log('Agent capabilities:', capabilities);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Example 2: Using WebSocket Agent
async function websocketAgentExample() {
    const agent = new WebSocketAgent('wss://ws.youragent.com/agent', {
        apiKey: 'your-api-key',
        maxReconnectAttempts: 5
    });

    try {
        await agent.connect();
        
        const response = await agent.sendMessage('Hello via WebSocket!');
        console.log('Agent response:', response);

    } catch (error) {
        console.error('WebSocket error:', error);
    } finally {
        agent.disconnect();
    }
}

// Example 3: Using Streaming Agent
async function streamingAgentExample() {
    const agent = new StreamingAgent({
        baseURL: 'https://api.youragent.com',
        apiKey: 'your-api-key'
    });

    try {
        const messageElement = document.getElementById('streamingResponse');
        messageElement.textContent = '';

        for await (const chunk of agent.streamMessage('Tell me a story')) {
            if (chunk.content) {
                messageElement.textContent += chunk.content;
            }
        }
    } catch (error) {
        console.error('Streaming error:', error);
    }
}

// Example 4: Using Batch Agent
async function batchAgentExample() {
    const agent = new BatchAgent({
        baseURL: 'https://api.youragent.com',
        apiKey: 'your-api-key'
    });

    // Add multiple messages to batch
    agent.addToBatch('Translate this to Spanish: Hello');
    agent.addToBatch('What is 2+2?');
    agent.addToBatch('Tell me a joke');

    try {
        const results = await agent.processBatch();
        console.log('Batch results:', results);
    } catch (error) {
        console.error('Batch error:', error);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RestAgent,
        WebSocketAgent,
        StreamingAgent,
        BatchAgent,
        ResilientAgent
    };
}