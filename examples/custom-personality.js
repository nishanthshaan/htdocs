// Custom Personality Agent Example
// This demonstrates how to create agents with specialized behaviors and personalities

class PersonalityAgent {
    constructor(config = {}) {
        this.config = {
            apiKey: config.apiKey || 'demo-key',
            personality: config.personality || 'neutral',
            customInstructions: config.customInstructions || '',
            knowledgeBase: config.knowledgeBase || null,
            capabilities: config.capabilities || ['chat'],
            ...config
        };
        
        this.conversationHistory = [];
        this.personality = this.loadPersonality(this.config.personality);
        this.customBehaviors = new Map();
        
        this.setupPersonalityBehaviors();
    }

    // Load predefined personality configurations
    loadPersonality(personalityType) {
        const personalities = {
            'customer-service': {
                name: 'Customer Service Representative',
                traits: ['helpful', 'patient', 'professional', 'empathetic'],
                greeting: 'Hello! I\'m here to help you with any questions or concerns you may have. How can I assist you today?',
                style: {
                    tone: 'formal-friendly',
                    responseLength: 'medium',
                    useEmojis: false,
                    alwaysAskFollowUp: true
                },
                specializedKnowledge: [
                    'product information',
                    'troubleshooting',
                    'billing support',
                    'return policies'
                ],
                escalationTriggers: [
                    'refund request',
                    'complaint',
                    'technical issue',
                    'billing dispute'
                ]
            },

            'technical-assistant': {
                name: 'Technical Assistant',
                traits: ['analytical', 'precise', 'thorough', 'logical'],
                greeting: 'Greetings! I\'m your technical assistant. I can help you with programming, system administration, troubleshooting, and technical problem-solving.',
                style: {
                    tone: 'technical',
                    responseLength: 'detailed',
                    useCodeExamples: true,
                    includeReferences: true
                },
                specializedKnowledge: [
                    'programming languages',
                    'system architecture',
                    'debugging techniques',
                    'best practices',
                    'documentation'
                ]
            },

            'creative-assistant': {
                name: 'Creative Assistant',
                traits: ['imaginative', 'inspiring', 'encouraging', 'artistic'],
                greeting: 'Hello, creative soul! I\'m here to help spark your imagination and bring your creative visions to life. What are we creating today? ✨',
                style: {
                    tone: 'enthusiastic',
                    responseLength: 'varied',
                    useEmojis: true,
                    encourageExploration: true
                },
                specializedKnowledge: [
                    'creative writing',
                    'design principles',
                    'artistic techniques',
                    'brainstorming methods'
                ]
            },

            'health-advisor': {
                name: 'Health & Wellness Advisor',
                traits: ['caring', 'knowledgeable', 'supportive', 'responsible'],
                greeting: 'Hello! I\'m your health and wellness advisor. I can provide general health information and wellness tips. Please remember that I\'m not a substitute for professional medical advice.',
                style: {
                    tone: 'caring-professional',
                    responseLength: 'comprehensive',
                    includeDisclaimer: true,
                    encourageConsultation: true
                },
                specializedKnowledge: [
                    'general health information',
                    'nutrition basics',
                    'exercise guidance',
                    'wellness practices'
                ],
                disclaimers: [
                    'Always consult healthcare professionals for medical concerns',
                    'This is general information, not personalized medical advice'
                ]
            },

            'educational-tutor': {
                name: 'Educational Tutor',
                traits: ['patient', 'encouraging', 'structured', 'adaptive'],
                greeting: 'Welcome, student! I\'m excited to help you learn and grow. What subject would you like to explore today?',
                style: {
                    tone: 'encouraging-educational',
                    responseLength: 'educational',
                    useExamples: true,
                    checkUnderstanding: true,
                    adaptToPace: true
                },
                specializedKnowledge: [
                    'educational methodologies',
                    'subject matter expertise',
                    'learning strategies',
                    'assessment techniques'
                ]
            },

            'business-consultant': {
                name: 'Business Consultant',
                traits: ['strategic', 'analytical', 'results-oriented', 'professional'],
                greeting: 'Good day! I\'m your business consultant, ready to help you with strategic planning, market analysis, and business growth strategies.',
                style: {
                    tone: 'professional-strategic',
                    responseLength: 'comprehensive',
                    includeActionItems: true,
                    dataEnabled: true
                },
                specializedKnowledge: [
                    'business strategy',
                    'market analysis',
                    'financial planning',
                    'operations optimization'
                ]
            }
        };

        return personalities[personalityType] || personalities['neutral'] || {
            name: 'General Assistant',
            traits: ['helpful', 'friendly'],
            greeting: 'Hello! How can I help you today?',
            style: { tone: 'neutral', responseLength: 'medium' }
        };
    }

    // Setup personality-specific behaviors
    setupPersonalityBehaviors() {
        const personalityType = this.config.personality;

        switch (personalityType) {
            case 'customer-service':
                this.setupCustomerServiceBehaviors();
                break;
            case 'technical-assistant':
                this.setupTechnicalAssistantBehaviors();
                break;
            case 'creative-assistant':
                this.setupCreativeAssistantBehaviors();
                break;
            case 'health-advisor':
                this.setupHealthAdvisorBehaviors();
                break;
            case 'educational-tutor':
                this.setupEducationalTutorBehaviors();
                break;
            case 'business-consultant':
                this.setupBusinessConsultantBehaviors();
                break;
        }
    }

    // Customer Service specific behaviors
    setupCustomerServiceBehaviors() {
        this.customBehaviors.set('greeting', () => {
            return this.personality.greeting + ' May I have your name or account number to better assist you?';
        });

        this.customBehaviors.set('escalation', (context) => {
            const triggers = this.personality.escalationTriggers;
            const message = context.message.toLowerCase();
            
            for (const trigger of triggers) {
                if (message.includes(trigger)) {
                    return {
                        shouldEscalate: true,
                        reason: trigger,
                        response: `I understand this is important to you. Let me connect you with a specialist who can better assist with ${trigger} matters. Please hold while I transfer you.`
                    };
                }
            }
            return { shouldEscalate: false };
        });

        this.customBehaviors.set('followUp', () => {
            const followUps = [
                'Is there anything else I can help you with today?',
                'Do you have any other questions or concerns?',
                'Was I able to resolve your issue completely?',
                'Is there anything else you\'d like to know about this topic?'
            ];
            return followUps[Math.floor(Math.random() * followUps.length)];
        });
    }

    // Technical Assistant specific behaviors
    setupTechnicalAssistantBehaviors() {
        this.customBehaviors.set('codeExample', (language, problem) => {
            const examples = {
                javascript: `
// Example solution:
function solveProblem() {
    // Implementation here
    return result;
}`,
                python: `
# Example solution:
def solve_problem():
    # Implementation here
    return result`,
                java: `
// Example solution:
public class Solution {
    public static void solveProblem() {
        // Implementation here
    }
}`
            };
            return examples[language.toLowerCase()] || examples.javascript;
        });

        this.customBehaviors.set('debuggingSteps', () => {
            return [
                '1. Identify the error message and line number',
                '2. Check syntax and variable names',
                '3. Verify input data and types',
                '4. Add logging or breakpoints',
                '5. Test with simplified inputs',
                '6. Review recent changes'
            ];
        });
    }

    // Creative Assistant specific behaviors
    setupCreativeAssistantBehaviors() {
        this.customBehaviors.set('brainstormIdeas', (topic) => {
            const techniques = [
                'Mind mapping around the central theme',
                'Free writing for 10 minutes',
                'What if scenarios and alternatives',
                'Combining unrelated concepts',
                'Reversing assumptions',
                'Building on existing ideas'
            ];
            return `Let's brainstorm around "${topic}"! Here are some techniques: ${techniques.join(', ')}`;
        });

        this.customBehaviors.set('creativePrompts', () => {
            const prompts = [
                'What would happen if gravity worked sideways?',
                'Describe a color that doesn\'t exist',
                'Write from the perspective of a forgotten object',
                'Combine two completely different time periods',
                'Create a character with an unusual superpower'
            ];
            return prompts[Math.floor(Math.random() * prompts.length)];
        });
    }

    // Health Advisor specific behaviors
    setupHealthAdvisorBehaviors() {
        this.customBehaviors.set('addDisclaimer', (response) => {
            const disclaimers = this.personality.disclaimers;
            return response + '\n\n⚠️ ' + disclaimers[Math.floor(Math.random() * disclaimers.length)];
        });

        this.customBehaviors.set('encourageConsultation', (symptom) => {
            return `For any persistent ${symptom} or concerning symptoms, I strongly recommend consulting with a healthcare professional for proper evaluation and personalized advice.`;
        });
    }

    // Educational Tutor specific behaviors
    setupEducationalTutorBehaviors() {
        this.customBehaviors.set('checkUnderstanding', () => {
            const checks = [
                'Does this make sense so far?',
                'Would you like me to explain any part in more detail?',
                'Can you tell me in your own words what we just covered?',
                'Do you have any questions about this concept?'
            ];
            return checks[Math.floor(Math.random() * checks.length)];
        });

        this.customBehaviors.set('adaptExplanation', (complexity) => {
            const levels = {
                beginner: 'Let me break this down into simple steps...',
                intermediate: 'Building on what you know...',
                advanced: 'Considering the complexities involved...'
            };
            return levels[complexity] || levels.beginner;
        });
    }

    // Business Consultant specific behaviors
    setupBusinessConsultantBehaviors() {
        this.customBehaviors.set('strategicFramework', (problem) => {
            return {
                analysis: '1. Current state assessment',
                planning: '2. Strategic planning and goal setting',
                implementation: '3. Action plan development',
                monitoring: '4. Performance tracking and adjustment'
            };
        });

        this.customBehaviors.set('actionItems', (discussion) => {
            return [
                'Identify key stakeholders',
                'Gather relevant data and metrics',
                'Develop timeline for implementation',
                'Assign responsibilities',
                'Set up regular review meetings'
            ];
        });
    }

    // Main message processing
    async processMessage(message, context = {}) {
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message,
            timestamp: new Date(),
            context
        });

        // Check for escalation (customer service)
        if (this.customBehaviors.has('escalation')) {
            const escalationCheck = this.customBehaviors.get('escalation')({ message, context });
            if (escalationCheck.shouldEscalate) {
                return {
                    response: escalationCheck.response,
                    action: 'escalate',
                    reason: escalationCheck.reason
                };
            }
        }

        // Generate response based on personality
        let response = await this.generatePersonalityResponse(message, context);

        // Apply personality-specific modifications
        response = this.applyPersonalityStyle(response);

        // Add to conversation history
        this.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            personality: this.config.personality
        });

        return {
            response,
            personality: this.personality.name,
            followUp: this.generateFollowUp()
        };
    }

    // Generate response based on personality
    async generatePersonalityResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        
        // Handle greetings
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            if (this.customBehaviors.has('greeting')) {
                return this.customBehaviors.get('greeting')();
            }
            return this.personality.greeting;
        }

        // Personality-specific response generation
        switch (this.config.personality) {
            case 'customer-service':
                return this.generateCustomerServiceResponse(message, context);
            case 'technical-assistant':
                return this.generateTechnicalResponse(message, context);
            case 'creative-assistant':
                return this.generateCreativeResponse(message, context);
            case 'health-advisor':
                return this.generateHealthResponse(message, context);
            case 'educational-tutor':
                return this.generateEducationalResponse(message, context);
            case 'business-consultant':
                return this.generateBusinessResponse(message, context);
            default:
                return this.generateGenericResponse(message, context);
        }
    }

    // Personality-specific response generators
    generateCustomerServiceResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
            return 'I\'m sorry to hear you\'re experiencing an issue. I\'m here to help resolve this for you. Could you please provide me with more details about the problem you\'re facing?';
        }
        
        if (lowerMessage.includes('refund') || lowerMessage.includes('return')) {
            return 'I understand you\'re interested in our return policy. Let me help you with that. Could you please provide your order number or account information so I can look into this for you?';
        }
        
        if (lowerMessage.includes('thank')) {
            return 'You\'re very welcome! I\'m glad I could help. Is there anything else I can assist you with today?';
        }
        
        return 'Thank you for contacting us. I\'m here to help with any questions or concerns you may have. Could you please provide more details about how I can assist you?';
    }

    generateTechnicalResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('error') || lowerMessage.includes('bug')) {
            const steps = this.customBehaviors.get('debuggingSteps')();
            return `I can help you troubleshoot this issue. Here's a systematic approach:\n\n${steps.join('\n')}\n\nCould you share the specific error message you're seeing?`;
        }
        
        if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
            return 'I\'d be happy to help with your programming question. Could you please share:\n1. The programming language you\'re using\n2. What you\'re trying to accomplish\n3. Any specific errors you\'re encountering\n\nThis will help me provide you with the most relevant assistance.';
        }
        
        return 'I\'m here to help with technical questions, programming problems, system administration, and troubleshooting. What technical challenge are you working on?';
    }

    generateCreativeResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('idea') || lowerMessage.includes('brainstorm')) {
            const prompt = this.customBehaviors.get('creativePrompts')();
            return `Let's get those creative juices flowing! ✨ Here's a creative prompt to spark your imagination: "${prompt}"\n\nWhat creative project are you working on? I'd love to help you explore new possibilities!`;
        }
        
        if (lowerMessage.includes('write') || lowerMessage.includes('story')) {
            return 'Writing is such a wonderful creative outlet! 📝 Whether you\'re working on a story, poem, article, or any other form of writing, I\'m here to help. What kind of writing are you interested in, and what\'s your current project or idea?';
        }
        
        if (lowerMessage.includes('stuck') || lowerMessage.includes('block')) {
            return 'Creative blocks happen to everyone - they\'re totally normal! 🎨 Sometimes the best way through is to try a completely different approach. Would you like to try some creative exercises, or would you prefer to talk through your project to find new angles?';
        }
        
        return 'Hello, creative spirit! ✨ I\'m here to help with all things creative - writing, art, design, brainstorming, and bringing ideas to life. What creative adventure shall we embark on today?';
    }

    generateHealthResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        let response = '';
        
        if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
            response = 'I understand you\'re experiencing discomfort. While I can provide general wellness information, pain can have many different causes and may require professional evaluation.';
            return this.customBehaviors.get('addDisclaimer')(response);
        }
        
        if (lowerMessage.includes('diet') || lowerMessage.includes('nutrition')) {
            response = 'Nutrition is an important aspect of overall health! A balanced diet typically includes a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. Individual nutritional needs can vary based on many factors.';
            return this.customBehaviors.get('addDisclaimer')(response);
        }
        
        if (lowerMessage.includes('exercise') || lowerMessage.includes('fitness')) {
            response = 'Regular physical activity is great for both physical and mental health! The general recommendation is at least 150 minutes of moderate aerobic activity per week, plus muscle-strengthening activities.';
            return this.customBehaviors.get('addDisclaimer')(response);
        }
        
        response = 'I\'m here to provide general health and wellness information to help you on your wellness journey.';
        return this.customBehaviors.get('addDisclaimer')(response);
    }

    generateEducationalResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('learn') || lowerMessage.includes('study')) {
            const understanding = this.customBehaviors.get('checkUnderstanding')();
            return `Learning is an exciting journey! 📚 I\'m here to help you understand concepts, work through problems, and develop your knowledge. What subject or topic would you like to explore?\n\n${understanding}`;
        }
        
        if (lowerMessage.includes('explain') || lowerMessage.includes('understand')) {
            return 'I\'d be happy to explain that concept! To give you the best explanation, could you tell me:\n1. What specific topic or concept you\'d like me to explain\n2. Your current level of familiarity with the subject\n3. Any particular aspects you\'re finding challenging\n\nThis helps me tailor the explanation to your learning style and level.';
        }
        
        if (lowerMessage.includes('homework') || lowerMessage.includes('assignment')) {
            return 'I\'m here to help you learn and understand, rather than just provide answers! Let\'s work through this together. Could you share what the assignment is about and which part you\'re finding challenging? This way, I can guide you to discover the solution yourself.';
        }
        
        return 'Welcome to our learning session! 🎓 I\'m excited to help you explore knowledge and develop understanding. What would you like to learn about today?';
    }

    generateBusinessResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('strategy') || lowerMessage.includes('plan')) {
            const framework = this.customBehaviors.get('strategicFramework')(message);
            return `Strategic planning is crucial for business success. Let me help you structure your approach:\n\n${Object.values(framework).join('\n')}\n\nWhat specific strategic challenge are you facing? I can help you develop a comprehensive approach.`;
        }
        
        if (lowerMessage.includes('market') || lowerMessage.includes('competition')) {
            return 'Market analysis is fundamental to business success. I can help you examine:\n• Market size and growth trends\n• Competitive landscape\n• Customer segments and needs\n• Market positioning opportunities\n\nWhat aspect of your market would you like to analyze first?';
        }
        
        if (lowerMessage.includes('grow') || lowerMessage.includes('scale')) {
            const actions = this.customBehaviors.get('actionItems')(message);
            return `Business growth requires strategic focus and execution. Key areas to consider:\n\n${actions.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\nWhat stage is your business at, and what growth challenges are you facing?`;
        }
        
        return 'Welcome! I\'m here to help with strategic business planning, market analysis, operational optimization, and growth strategies. What business challenge can we tackle together?';
    }

    generateGenericResponse(message, context) {
        return 'I\'m here to help! Could you please provide more details about what you\'d like assistance with?';
    }

    // Apply personality style to response
    applyPersonalityStyle(response) {
        const style = this.personality.style;
        
        // Add emojis if personality uses them
        if (style.useEmojis && Math.random() > 0.7) {
            const emojis = ['😊', '👍', '✨', '🎯', '💡', '🚀'];
            response += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
        }
        
        // Adjust response length
        if (style.responseLength === 'brief' && response.length > 100) {
            response = response.substring(0, 100) + '...';
        }
        
        return response;
    }

    // Generate follow-up based on personality
    generateFollowUp() {
        if (this.customBehaviors.has('followUp')) {
            return this.customBehaviors.get('followUp')();
        }
        
        const genericFollowUps = [
            'Is there anything else I can help you with?',
            'Do you have any other questions?',
            'How else can I assist you today?'
        ];
        
        return genericFollowUps[Math.floor(Math.random() * genericFollowUps.length)];
    }

    // Get conversation summary
    getConversationSummary() {
        return {
            personality: this.personality.name,
            messageCount: this.conversationHistory.length,
            topics: this.extractTopics(),
            sentiment: this.analyzeSentiment(),
            duration: this.calculateDuration()
        };
    }

    // Helper methods
    extractTopics() {
        // Simple topic extraction from conversation
        return ['general assistance']; // Simplified for demo
    }

    analyzeSentiment() {
        return 'positive'; // Simplified for demo
    }

    calculateDuration() {
        if (this.conversationHistory.length < 2) return 0;
        const start = this.conversationHistory[0].timestamp;
        const end = this.conversationHistory[this.conversationHistory.length - 1].timestamp;
        return Math.round((end - start) / 1000 / 60); // minutes
    }
}

// Demo function
function demonstratePersonalityAgents() {
    console.log('=== Personality Agent Demonstrations ===\n');
    
    const personalities = [
        'customer-service',
        'technical-assistant', 
        'creative-assistant',
        'health-advisor',
        'educational-tutor',
        'business-consultant'
    ];

    personalities.forEach(async (personality) => {
        console.log(`\n--- ${personality.toUpperCase()} AGENT ---`);
        
        const agent = new PersonalityAgent({ personality });
        
        // Demonstrate greeting
        const greeting = await agent.processMessage('Hello!');
        console.log('Greeting:', greeting.response);
        
        // Demonstrate specialized response
        let testMessage = '';
        switch (personality) {
            case 'customer-service':
                testMessage = 'I have a problem with my order';
                break;
            case 'technical-assistant':
                testMessage = 'I\'m getting a JavaScript error in my code';
                break;
            case 'creative-assistant':
                testMessage = 'I need help brainstorming ideas for a story';
                break;
            case 'health-advisor':
                testMessage = 'What should I know about nutrition?';
                break;
            case 'educational-tutor':
                testMessage = 'Can you explain how photosynthesis works?';
                break;
            case 'business-consultant':
                testMessage = 'I need help with my business strategy';
                break;
        }
        
        const response = await agent.processMessage(testMessage);
        console.log('Specialized Response:', response.response);
        console.log('Follow-up:', response.followUp);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PersonalityAgent, demonstratePersonalityAgents };
}

// Run demo if called directly
if (typeof window === 'undefined' && require.main === module) {
    demonstratePersonalityAgents();
}