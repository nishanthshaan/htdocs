/**
 * Agent Configuration Examples
 * This file shows various ways to configure agents for different use cases
 */

// Example 1: Basic Configuration
const basicConfig = {
    apiKey: 'your-api-key-here',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 150,
    timeout: 30000
};

// Example 2: Production Configuration
const productionConfig = {
    apiEndpoint: 'https://api.youragent.com/v1/chat',
    apiKey: process.env.AGENT_API_KEY,
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 500,
    timeout: 60000,
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimitDelay: 1000,
    enableLogging: false,
    enableMetrics: true
};

// Example 3: Development Configuration
const developmentConfig = {
    apiEndpoint: 'http://localhost:3000/api/agent',
    apiKey: 'dev-key-123',
    model: 'gpt-3.5-turbo',
    temperature: 0.8,
    maxTokens: 200,
    timeout: 15000,
    enableLogging: true,
    enableDebug: true,
    enableMetrics: false,
    simulateDelay: 1000 // Simulate network delay
};

// Example 4: Multimodal Configuration
const multimodalConfig = {
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-vision-preview',
    temperature: 0.5,
    maxTokens: 300,
    supportedFormats: {
        images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        audio: ['mp3', 'wav', 'flac', 'm4a'],
        documents: ['pdf', 'doc', 'docx', 'txt']
    },
    maxFileSize: {
        images: 10 * 1024 * 1024, // 10MB
        audio: 25 * 1024 * 1024,  // 25MB
        documents: 50 * 1024 * 1024 // 50MB
    }
};

// Example 5: WebSocket Configuration
const websocketConfig = {
    wsURL: 'wss://ws.youragent.com/agent',
    apiKey: process.env.AGENT_API_KEY,
    reconnectDelay: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    messageTimeout: 30000,
    enableAutoReconnect: true
};

// Example 6: Enterprise Configuration
const enterpriseConfig = {
    apiEndpoint: 'https://enterprise-api.youragent.com/v2/chat',
    apiKey: process.env.ENTERPRISE_API_KEY,
    organizationId: process.env.ORG_ID,
    model: 'custom-enterprise-model',
    temperature: 0.2,
    maxTokens: 1000,
    timeout: 120000,
    retryAttempts: 5,
    retryDelay: 2000,
    rateLimitDelay: 500,
    enableLogging: true,
    enableMetrics: true,
    enableCompliance: true,
    auditLevel: 'full',
    encryption: 'aes-256',
    customHeaders: {
        'X-Client-Version': '1.0.0',
        'X-Request-ID': () => generateRequestId()
    },
    responseValidation: true,
    contentFiltering: true
};

// Example 7: Specialized Agent Configurations

// Conversational Agent
const conversationalConfig = {
    ...basicConfig,
    model: 'gpt-3.5-turbo',
    temperature: 0.9,
    systemPrompt: 'You are a helpful and friendly conversational AI assistant.',
    contextWindow: 10, // Keep last 10 messages
    personalityTraits: ['helpful', 'curious', 'empathetic']
};

// Analytical Agent
const analyticalConfig = {
    ...basicConfig,
    model: 'gpt-4',
    temperature: 0.1,
    systemPrompt: 'You are a precise analytical AI that provides data-driven insights.',
    focusAreas: ['analysis', 'insights', 'recommendations'],
    outputFormat: 'structured'
};

// Creative Agent
const creativeConfig = {
    ...basicConfig,
    model: 'gpt-4',
    temperature: 1.2,
    systemPrompt: 'You are a creative AI assistant that helps with creative tasks.',
    creativityLevel: 'high',
    inspirationSources: ['art', 'literature', 'music']
};

// Code Assistant Agent
const codeAssistantConfig = {
    ...basicConfig,
    model: 'gpt-4',
    temperature: 0.2,
    systemPrompt: 'You are a code assistant that helps with programming tasks.',
    supportedLanguages: ['javascript', 'python', 'java', 'go', 'rust'],
    codeStyle: 'clean',
    includeExplanations: true
};

// Configuration Factory
class AgentConfigFactory {
    static create(environment, agentType = 'basic', customOptions = {}) {
        let baseConfig;

        // Select base configuration by environment
        switch (environment) {
            case 'development':
                baseConfig = { ...developmentConfig };
                break;
            case 'production':
                baseConfig = { ...productionConfig };
                break;
            case 'enterprise':
                baseConfig = { ...enterpriseConfig };
                break;
            default:
                baseConfig = { ...basicConfig };
        }

        // Apply agent type specialization
        switch (agentType) {
            case 'conversational':
                Object.assign(baseConfig, conversationalConfig);
                break;
            case 'analytical':
                Object.assign(baseConfig, analyticalConfig);
                break;
            case 'creative':
                Object.assign(baseConfig, creativeConfig);
                break;
            case 'code':
                Object.assign(baseConfig, codeAssistantConfig);
                break;
            case 'multimodal':
                Object.assign(baseConfig, multimodalConfig);
                break;
            case 'websocket':
                Object.assign(baseConfig, websocketConfig);
                break;
        }

        // Apply custom options
        return { ...baseConfig, ...customOptions };
    }

    static validate(config) {
        const required = ['apiKey'];
        const missing = required.filter(key => !config[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }

        // Validate specific settings
        if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
            throw new Error('Temperature must be between 0 and 2');
        }

        if (config.maxTokens && config.maxTokens < 1) {
            throw new Error('maxTokens must be greater than 0');
        }

        return true;
    }
}

// Environment Configuration Loader
class ConfigLoader {
    static loadFromEnvironment() {
        const env = process.env.NODE_ENV || 'development';
        const agentType = process.env.AGENT_TYPE || 'basic';

        const config = AgentConfigFactory.create(env, agentType, {
            apiKey: process.env.AGENT_API_KEY,
            model: process.env.AGENT_MODEL,
            temperature: parseFloat(process.env.AGENT_TEMPERATURE) || undefined,
            maxTokens: parseInt(process.env.AGENT_MAX_TOKENS) || undefined
        });

        AgentConfigFactory.validate(config);
        return config;
    }

    static loadFromFile(configPath) {
        try {
            const fs = require('fs');
            const configData = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            AgentConfigFactory.validate(config);
            return config;
        } catch (error) {
            throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
        }
    }
}

// Usage Examples:

// Example 1: Create a basic development agent
const devAgent = AgentConfigFactory.create('development', 'basic', {
    temperature: 0.8
});

// Example 2: Create a production conversational agent
const prodChatAgent = AgentConfigFactory.create('production', 'conversational', {
    maxTokens: 300,
    systemPrompt: 'You are a customer service AI assistant.'
});

// Example 3: Create a custom analytical agent
const customAnalyticalAgent = AgentConfigFactory.create('production', 'analytical', {
    model: 'gpt-4-turbo',
    temperature: 0.05,
    timeout: 90000,
    customHeaders: {
        'X-Analysis-Mode': 'detailed'
    }
});

// Example 4: Load configuration from environment
// const envConfig = ConfigLoader.loadFromEnvironment();

// Example 5: Dynamic configuration based on user preferences
function createUserSpecificAgent(userPreferences) {
    const baseConfig = AgentConfigFactory.create('production', 'conversational');
    
    return {
        ...baseConfig,
        temperature: userPreferences.creativity || 0.7,
        maxTokens: userPreferences.responseLength || 150,
        systemPrompt: `You are an AI assistant. User preferences: ${JSON.stringify(userPreferences)}`
    };
}

// Utility function for generating request IDs
function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export configurations for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        basicConfig,
        productionConfig,
        developmentConfig,
        multimodalConfig,
        websocketConfig,
        enterpriseConfig,
        conversationalConfig,
        analyticalConfig,
        creativeConfig,
        codeAssistantConfig,
        AgentConfigFactory,
        ConfigLoader
    };
}

// Global usage for browser environments
if (typeof window !== 'undefined') {
    window.AgentConfigurations = {
        AgentConfigFactory,
        ConfigLoader,
        presets: {
            basic: basicConfig,
            production: productionConfig,
            development: developmentConfig,
            multimodal: multimodalConfig,
            websocket: websocketConfig,
            enterprise: enterpriseConfig
        }
    };
}