/**
 * WebSocket Agent Implementation
 * Real-time bidirectional communication with an AI agent
 */

class RealtimeAgent {
    constructor(wsURL, options = {}) {
        this.wsURL = wsURL;
        this.options = {
            reconnectDelay: 1000,
            maxReconnectAttempts: 5,
            heartbeatInterval: 30000,
            messageTimeout: 30000,
            ...options
        };

        // Connection state
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.connectionId = null;

        // Message handling
        this.pendingMessages = new Map();
        this.messageQueue = [];
        this.eventHandlers = new Map();

        // Heartbeat
        this.heartbeatTimer = null;
        this.lastHeartbeat = null;

        // Auto-reconnect
        this.shouldReconnect = true;
    }

    // Connection Management
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log('Connecting to agent WebSocket:', this.wsURL);
                this.ws = new WebSocket(this.wsURL);

                const connectionTimeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                    this.ws.close();
                }, 10000);

                this.ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    this.onConnectionOpen();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.onMessage(event);
                };

                this.ws.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    this.onConnectionClose(event);
                };

                this.ws.onerror = (error) => {
                    clearTimeout(connectionTimeout);
                    console.error('WebSocket error:', error);
                    reject(error);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    onConnectionOpen() {
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Generate connection ID
        this.connectionId = this.generateId();

        // Send authentication if provided
        if (this.options.apiKey) {
            this.sendInternal({
                type: 'auth',
                token: this.options.apiKey,
                connectionId: this.connectionId
            });
        }

        // Start heartbeat
        this.startHeartbeat();

        // Process queued messages
        this.processMessageQueue();

        // Emit connected event
        this.emit('connected', { connectionId: this.connectionId });
    }

    onConnectionClose(event) {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnected = false;
        this.stopHeartbeat();

        // Reject pending messages
        this.pendingMessages.forEach((handler, messageId) => {
            clearTimeout(handler.timeout);
            handler.reject(new Error('Connection closed'));
        });
        this.pendingMessages.clear();

        // Emit disconnected event
        this.emit('disconnected', { code: event.code, reason: event.reason });

        // Attempt reconnection if needed
        if (this.shouldReconnect && !event.wasClean) {
            this.attemptReconnect();
        }
    }

    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.handleIncomingMessage(data);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    disconnect() {
        this.shouldReconnect = false;
        this.stopHeartbeat();
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close(1000, 'Client disconnect');
        }
        
        this.ws = null;
        this.isConnected = false;
    }

    // Reconnection Logic
    attemptReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.emit('reconnectFailed', { attempts: this.reconnectAttempts });
            return;
        }

        this.reconnectAttempts++;
        const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
                this.attemptReconnect();
            });
        }, delay);
    }

    // Message Handling
    async sendMessage(content, options = {}) {
        const message = {
            type: 'chat',
            id: this.generateId(),
            content: content,
            timestamp: Date.now(),
            ...options
        };

        if (!this.isConnected) {
            // Queue message if not connected
            return new Promise((resolve, reject) => {
                this.messageQueue.push({ message, resolve, reject });
            });
        }

        return this.sendWithResponse(message);
    }

    sendWithResponse(message) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingMessages.delete(message.id);
                reject(new Error('Message timeout'));
            }, this.options.messageTimeout);

            this.pendingMessages.set(message.id, {
                resolve,
                reject,
                timeout,
                sentAt: Date.now()
            });

            this.sendInternal(message);
        });
    }

    sendInternal(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('Cannot send message: WebSocket not connected');
        }
    }

    handleIncomingMessage(data) {
        switch (data.type) {
            case 'response':
                this.handleResponse(data);
                break;
            case 'error':
                this.handleError(data);
                break;
            case 'heartbeat':
                this.handleHeartbeat(data);
                break;
            case 'status':
                this.handleStatus(data);
                break;
            case 'notification':
                this.handleNotification(data);
                break;
            default:
                console.log('Unknown message type:', data.type, data);
                this.emit('unknownMessage', data);
        }
    }

    handleResponse(data) {
        const handler = this.pendingMessages.get(data.messageId);
        if (handler) {
            clearTimeout(handler.timeout);
            handler.resolve({
                content: data.content,
                metadata: data.metadata,
                responseTime: Date.now() - handler.sentAt
            });
            this.pendingMessages.delete(data.messageId);
        }

        this.emit('response', data);
    }

    handleError(data) {
        const handler = this.pendingMessages.get(data.messageId);
        if (handler) {
            clearTimeout(handler.timeout);
            handler.reject(new Error(data.error));
            this.pendingMessages.delete(data.messageId);
        }

        this.emit('error', data);
    }

    handleHeartbeat(data) {
        this.lastHeartbeat = Date.now();
        // Send heartbeat response
        this.sendInternal({
            type: 'heartbeat_response',
            timestamp: Date.now()
        });
    }

    handleStatus(data) {
        console.log('Agent status:', data.status);
        this.emit('status', data);
    }

    handleNotification(data) {
        console.log('Agent notification:', data.message);
        this.emit('notification', data);
    }

    // Heartbeat Management
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.sendInternal({
                    type: 'heartbeat',
                    timestamp: Date.now()
                });
            }
        }, this.options.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // Message Queue Processing
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const { message, resolve, reject } = this.messageQueue.shift();
            
            this.sendWithResponse(message)
                .then(resolve)
                .catch(reject);
        }
    }

    // Event System
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }

    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Event handler error:', error);
                }
            });
        }
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            connectionId: this.connectionId,
            reconnectAttempts: this.reconnectAttempts,
            pendingMessages: this.pendingMessages.size,
            queuedMessages: this.messageQueue.length,
            lastHeartbeat: this.lastHeartbeat
        };
    }

    // Advanced Features
    async sendTypingIndicator(isTyping = true) {
        return this.sendInternal({
            type: 'typing',
            isTyping: isTyping,
            timestamp: Date.now()
        });
    }

    async requestAgentCapabilities() {
        return this.sendWithResponse({
            type: 'capabilities_request',
            id: this.generateId(),
            timestamp: Date.now()
        });
    }

    async setAgentPersonality(personality) {
        return this.sendWithResponse({
            type: 'set_personality',
            id: this.generateId(),
            personality: personality,
            timestamp: Date.now()
        });
    }

    async startConversation(context = {}) {
        return this.sendWithResponse({
            type: 'start_conversation',
            id: this.generateId(),
            context: context,
            timestamp: Date.now()
        });
    }

    async endConversation(conversationId) {
        return this.sendWithResponse({
            type: 'end_conversation',
            id: this.generateId(),
            conversationId: conversationId,
            timestamp: Date.now()
        });
    }
}

// Usage Example with UI Integration
class RealtimeAgentUI {
    constructor(wsURL, containerId, options = {}) {
        this.agent = new RealtimeAgent(wsURL, options);
        this.container = document.getElementById(containerId);
        this.isTyping = false;
        
        this.setupUI();
        this.setupEventHandlers();
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="realtime-agent">
                <div class="connection-status" id="connectionStatus">
                    <span class="status-indicator"></span>
                    <span class="status-text">Disconnected</span>
                </div>
                
                <div class="chat-area">
                    <div class="messages" id="messages"></div>
                    <div class="typing-indicator" id="typingIndicator" style="display: none;">
                        Agent is typing...
                    </div>
                </div>
                
                <div class="input-area">
                    <input type="text" id="messageInput" placeholder="Type a message..." disabled>
                    <button id="sendButton" disabled>Send</button>
                    <button id="connectButton">Connect</button>
                </div>
                
                <div class="debug-info" id="debugInfo" style="display: none;">
                    <h4>Debug Information</h4>
                    <pre id="debugContent"></pre>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .realtime-agent {
                font-family: Arial, sans-serif;
                max-width: 600px;
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .connection-status {
                background: #f8f9fa;
                padding: 10px;
                border-bottom: 1px solid #ddd;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #dc3545;
            }
            
            .status-indicator.connected {
                background: #28a745;
            }
            
            .chat-area {
                height: 300px;
                overflow-y: auto;
                padding: 20px;
                background: white;
            }
            
            .message {
                margin-bottom: 15px;
                padding: 10px;
                border-radius: 8px;
                max-width: 80%;
            }
            
            .message.user {
                background: #007bff;
                color: white;
                margin-left: auto;
            }
            
            .message.agent {
                background: #f1f1f1;
                color: #333;
            }
            
            .typing-indicator {
                font-style: italic;
                color: #666;
                padding: 5px 10px;
            }
            
            .input-area {
                padding: 15px;
                background: #f8f9fa;
                display: flex;
                gap: 10px;
            }
            
            #messageInput {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            #sendButton {
                background: #007bff;
                color: white;
            }
            
            #sendButton:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            
            #connectButton {
                background: #28a745;
                color: white;
            }
            
            .debug-info {
                background: #f8f9fa;
                border-top: 1px solid #ddd;
                padding: 15px;
            }
            
            .debug-info pre {
                background: #fff;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
                max-height: 200px;
                overflow-y: auto;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventHandlers() {
        // Agent events
        this.agent.on('connected', () => this.updateConnectionStatus(true));
        this.agent.on('disconnected', () => this.updateConnectionStatus(false));
        this.agent.on('response', (data) => this.handleAgentResponse(data));
        this.agent.on('notification', (data) => this.showNotification(data));
        this.agent.on('error', (data) => this.showError(data));

        // UI events
        document.getElementById('connectButton').onclick = () => this.toggleConnection();
        document.getElementById('sendButton').onclick = () => this.sendMessage();
        document.getElementById('messageInput').onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };

        // Debug toggle (double-click on status)
        document.getElementById('connectionStatus').ondblclick = () => this.toggleDebug();
    }

    async toggleConnection() {
        const button = document.getElementById('connectButton');
        
        if (this.agent.isConnected) {
            this.agent.disconnect();
            button.textContent = 'Connect';
        } else {
            try {
                button.textContent = 'Connecting...';
                button.disabled = true;
                await this.agent.connect();
                button.textContent = 'Disconnect';
            } catch (error) {
                alert('Connection failed: ' + error.message);
                button.textContent = 'Connect';
            } finally {
                button.disabled = false;
            }
        }
    }

    updateConnectionStatus(isConnected) {
        const indicator = document.querySelector('.status-indicator');
        const text = document.querySelector('.status-text');
        const input = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const connectButton = document.getElementById('connectButton');

        if (isConnected) {
            indicator.classList.add('connected');
            text.textContent = 'Connected';
            input.disabled = false;
            sendButton.disabled = false;
            connectButton.textContent = 'Disconnect';
        } else {
            indicator.classList.remove('connected');
            text.textContent = 'Disconnected';
            input.disabled = true;
            sendButton.disabled = true;
            connectButton.textContent = 'Connect';
        }

        this.updateDebugInfo();
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message) return;

        this.addMessage('user', message);
        input.value = '';

        try {
            this.showTypingIndicator(true);
            const response = await this.agent.sendMessage(message);
            this.showTypingIndicator(false);
            this.addMessage('agent', response.content);
        } catch (error) {
            this.showTypingIndicator(false);
            this.addMessage('agent', 'Error: ' + error.message, true);
        }
    }

    addMessage(sender, content, isError = false) {
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        if (isError) {
            messageDiv.style.background = '#dc3545';
            messageDiv.style.color = 'white';
        }
        
        messageDiv.textContent = content;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    handleAgentResponse(data) {
        this.updateDebugInfo();
    }

    showTypingIndicator(show) {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = show ? 'block' : 'none';
    }

    showNotification(data) {
        // You could use a toast library here
        console.log('Notification:', data.message);
    }

    showError(data) {
        console.error('Agent error:', data.error);
    }

    toggleDebug() {
        const debugInfo = document.getElementById('debugInfo');
        debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
        this.updateDebugInfo();
    }

    updateDebugInfo() {
        const debugContent = document.getElementById('debugContent');
        if (debugContent) {
            debugContent.textContent = JSON.stringify(this.agent.getConnectionStatus(), null, 2);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RealtimeAgent, RealtimeAgentUI };
}

// Global usage example
window.RealtimeAgentExample = {
    RealtimeAgent,
    RealtimeAgentUI,
    
    // Quick setup function
    setup(containerId, wsURL, options) {
        return new RealtimeAgentUI(wsURL, containerId, options);
    }
};