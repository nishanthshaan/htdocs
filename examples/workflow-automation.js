// Workflow Automation Agent Example
// This demonstrates how to use an agent for automated business processes

class WorkflowAgent {
    constructor(config = {}) {
        this.config = {
            apiKey: config.apiKey || 'demo-key',
            baseUrl: config.baseUrl || 'https://api.agent-service.com',
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            ...config
        };
        
        this.workflows = new Map();
        this.activeJobs = new Map();
        this.eventHandlers = new Map();
        
        this.setupDefaultWorkflows();
    }

    // Define common business workflows
    setupDefaultWorkflows() {
        // Customer onboarding workflow
        this.defineWorkflow('customer-onboarding', {
            name: 'Customer Onboarding',
            description: 'Automated process for new customer registration',
            steps: [
                {
                    id: 'validate-information',
                    name: 'Validate Customer Information',
                    action: this.validateCustomerInfo.bind(this),
                    timeout: 5000
                },
                {
                    id: 'create-account',
                    name: 'Create Customer Account',
                    action: this.createCustomerAccount.bind(this),
                    timeout: 10000
                },
                {
                    id: 'send-welcome-email',
                    name: 'Send Welcome Email',
                    action: this.sendWelcomeEmail.bind(this),
                    timeout: 5000
                },
                {
                    id: 'setup-dashboard',
                    name: 'Setup Customer Dashboard',
                    action: this.setupDashboard.bind(this),
                    timeout: 15000
                }
            ],
            onComplete: (result) => {
                console.log('Customer onboarding completed:', result);
            },
            onError: (error, step) => {
                console.error(`Error in step ${step.id}:`, error);
            }
        });

        // Order processing workflow
        this.defineWorkflow('order-processing', {
            name: 'Order Processing',
            description: 'End-to-end order fulfillment process',
            steps: [
                {
                    id: 'validate-order',
                    name: 'Validate Order Details',
                    action: this.validateOrder.bind(this),
                    timeout: 5000
                },
                {
                    id: 'check-inventory',
                    name: 'Check Inventory Availability',
                    action: this.checkInventory.bind(this),
                    timeout: 10000
                },
                {
                    id: 'calculate-pricing',
                    name: 'Calculate Total Pricing',
                    action: this.calculatePricing.bind(this),
                    timeout: 5000
                },
                {
                    id: 'process-payment',
                    name: 'Process Payment',
                    action: this.processPayment.bind(this),
                    timeout: 30000
                },
                {
                    id: 'reserve-inventory',
                    name: 'Reserve Inventory Items',
                    action: this.reserveInventory.bind(this),
                    timeout: 10000
                },
                {
                    id: 'generate-shipping-label',
                    name: 'Generate Shipping Label',
                    action: this.generateShippingLabel.bind(this),
                    timeout: 15000
                },
                {
                    id: 'send-confirmation',
                    name: 'Send Order Confirmation',
                    action: this.sendOrderConfirmation.bind(this),
                    timeout: 5000
                }
            ],
            onComplete: (result) => {
                console.log('Order processing completed:', result);
            },
            onError: (error, step) => {
                console.error(`Error in step ${step.id}:`, error);
            }
        });

        // Document approval workflow
        this.defineWorkflow('document-approval', {
            name: 'Document Approval',
            description: 'Multi-stage document review and approval process',
            steps: [
                {
                    id: 'initial-review',
                    name: 'Initial Document Review',
                    action: this.initialDocumentReview.bind(this),
                    timeout: 20000
                },
                {
                    id: 'manager-approval',
                    name: 'Manager Approval',
                    action: this.requestManagerApproval.bind(this),
                    timeout: 86400000, // 24 hours
                    requiresHumanAction: true
                },
                {
                    id: 'compliance-check',
                    name: 'Compliance Check',
                    action: this.complianceCheck.bind(this),
                    timeout: 30000
                },
                {
                    id: 'final-approval',
                    name: 'Final Approval',
                    action: this.finalApproval.bind(this),
                    timeout: 43200000, // 12 hours
                    requiresHumanAction: true
                },
                {
                    id: 'publish-document',
                    name: 'Publish Approved Document',
                    action: this.publishDocument.bind(this),
                    timeout: 10000
                }
            ],
            onComplete: (result) => {
                console.log('Document approval completed:', result);
            },
            onError: (error, step) => {
                console.error(`Error in step ${step.id}:`, error);
            }
        });
    }

    // Define a new workflow
    defineWorkflow(id, workflow) {
        this.workflows.set(id, workflow);
    }

    // Start a workflow execution
    async startWorkflow(workflowId, data = {}) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow '${workflowId}' not found`);
        }

        const jobId = this.generateJobId();
        const job = {
            id: jobId,
            workflowId,
            workflow,
            data,
            currentStep: 0,
            status: 'running',
            startTime: new Date(),
            results: []
        };

        this.activeJobs.set(jobId, job);
        
        console.log(`Starting workflow '${workflowId}' with job ID: ${jobId}`);
        
        try {
            await this.executeWorkflow(job);
            return jobId;
        } catch (error) {
            job.status = 'failed';
            job.error = error;
            throw error;
        }
    }

    // Execute workflow steps
    async executeWorkflow(job) {
        const { workflow, data } = job;
        
        for (let i = job.currentStep; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            job.currentStep = i;
            
            console.log(`Executing step: ${step.name}`);
            
            try {
                const stepResult = await this.executeStep(step, data, job);
                job.results.push({
                    stepId: step.id,
                    result: stepResult,
                    completedAt: new Date()
                });

                // Emit step completion event
                this.emit('stepComplete', {
                    jobId: job.id,
                    step,
                    result: stepResult
                });

                // If step requires human action, pause execution
                if (step.requiresHumanAction) {
                    job.status = 'waiting_for_approval';
                    console.log(`Workflow paused for human action: ${step.name}`);
                    return; // Will be resumed later
                }

            } catch (error) {
                job.status = 'failed';
                job.error = error;
                
                if (workflow.onError) {
                    workflow.onError(error, step);
                }
                
                this.emit('workflowError', {
                    jobId: job.id,
                    step,
                    error
                });
                
                throw error;
            }
        }
        
        // Workflow completed successfully
        job.status = 'completed';
        job.completedAt = new Date();
        
        if (workflow.onComplete) {
            workflow.onComplete(job.results);
        }
        
        this.emit('workflowComplete', {
            jobId: job.id,
            results: job.results
        });
    }

    // Execute a single workflow step
    async executeStep(step, data, job) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Step '${step.id}' timed out after ${step.timeout}ms`));
            }, step.timeout);

            step.action(data, job)
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }

    // Resume a paused workflow (after human approval)
    async resumeWorkflow(jobId, approvalData = {}) {
        const job = this.activeJobs.get(jobId);
        if (!job) {
            throw new Error(`Job '${jobId}' not found`);
        }

        if (job.status !== 'waiting_for_approval') {
            throw new Error(`Job '${jobId}' is not waiting for approval`);
        }

        // Merge approval data into job data
        Object.assign(job.data, approvalData);
        job.status = 'running';
        job.currentStep++; // Move to next step

        await this.executeWorkflow(job);
    }

    // Get workflow status
    getWorkflowStatus(jobId) {
        const job = this.activeJobs.get(jobId);
        if (!job) {
            return null;
        }

        return {
            id: job.id,
            workflowId: job.workflowId,
            status: job.status,
            currentStep: job.currentStep,
            totalSteps: job.workflow.steps.length,
            startTime: job.startTime,
            completedAt: job.completedAt,
            results: job.results,
            error: job.error
        };
    }

    // Event handling
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    // Utility methods
    generateJobId() {
        return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Sample workflow step implementations
    async validateCustomerInfo(data) {
        console.log('Validating customer information...');
        await this.delay(1000);
        
        if (!data.email || !data.name) {
            throw new Error('Missing required customer information');
        }
        
        return { valid: true, customerId: 'cust_' + Date.now() };
    }

    async createCustomerAccount(data) {
        console.log('Creating customer account...');
        await this.delay(2000);
        
        return { 
            accountId: 'acc_' + Date.now(),
            username: data.email,
            status: 'active'
        };
    }

    async sendWelcomeEmail(data) {
        console.log('Sending welcome email...');
        await this.delay(1000);
        
        return { 
            emailSent: true,
            emailId: 'email_' + Date.now(),
            recipient: data.email
        };
    }

    async setupDashboard(data) {
        console.log('Setting up customer dashboard...');
        await this.delay(3000);
        
        return { 
            dashboardUrl: `https://dashboard.example.com/user/${data.customerId}`,
            features: ['analytics', 'reports', 'settings']
        };
    }

    async validateOrder(data) {
        console.log('Validating order...');
        await this.delay(1000);
        
        return { 
            valid: true,
            orderId: data.orderId || 'ord_' + Date.now(),
            items: data.items || []
        };
    }

    async checkInventory(data) {
        console.log('Checking inventory...');
        await this.delay(2000);
        
        return { 
            available: true,
            reservationId: 'res_' + Date.now(),
            estimatedShipping: '2-3 business days'
        };
    }

    async calculatePricing(data) {
        console.log('Calculating pricing...');
        await this.delay(1000);
        
        return { 
            subtotal: 99.99,
            tax: 8.99,
            shipping: 5.99,
            total: 114.97
        };
    }

    async processPayment(data) {
        console.log('Processing payment...');
        await this.delay(3000);
        
        return { 
            paymentId: 'pay_' + Date.now(),
            status: 'completed',
            amount: data.total || 114.97
        };
    }

    async reserveInventory(data) {
        console.log('Reserving inventory...');
        await this.delay(1500);
        
        return { 
            reserved: true,
            reservationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }

    async generateShippingLabel(data) {
        console.log('Generating shipping label...');
        await this.delay(2000);
        
        return { 
            trackingNumber: 'TRK' + Date.now(),
            labelUrl: 'https://shipping.example.com/label/xyz123',
            carrier: 'UPS'
        };
    }

    async sendOrderConfirmation(data) {
        console.log('Sending order confirmation...');
        await this.delay(1000);
        
        return { 
            confirmationSent: true,
            confirmationNumber: 'CONF' + Date.now()
        };
    }

    async initialDocumentReview(data) {
        console.log('Performing initial document review...');
        await this.delay(5000);
        
        return { 
            reviewed: true,
            issues: [],
            recommendation: 'approve'
        };
    }

    async requestManagerApproval(data) {
        console.log('Requesting manager approval...');
        await this.delay(1000);
        
        return { 
            approvalRequested: true,
            approver: 'manager@example.com',
            approvalUrl: 'https://approval.example.com/doc/123'
        };
    }

    async complianceCheck(data) {
        console.log('Performing compliance check...');
        await this.delay(3000);
        
        return { 
            compliant: true,
            checkedRegulations: ['GDPR', 'SOX', 'HIPAA'],
            score: 95
        };
    }

    async finalApproval(data) {
        console.log('Requesting final approval...');
        await this.delay(1000);
        
        return { 
            finalApprovalRequested: true,
            approver: 'ceo@example.com'
        };
    }

    async publishDocument(data) {
        console.log('Publishing document...');
        await this.delay(2000);
        
        return { 
            published: true,
            documentUrl: 'https://docs.example.com/published/doc123',
            publishedAt: new Date()
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Example usage
async function demonstrateWorkflowAutomation() {
    console.log('=== Workflow Automation Agent Demo ===\n');
    
    // Initialize the workflow agent
    const agent = new WorkflowAgent({
        apiKey: 'demo-key',
        timeout: 60000
    });

    // Set up event listeners
    agent.on('stepComplete', (data) => {
        console.log(`✅ Step completed: ${data.step.name}`);
    });

    agent.on('workflowComplete', (data) => {
        console.log(`🎉 Workflow completed successfully! Job ID: ${data.jobId}`);
    });

    agent.on('workflowError', (data) => {
        console.log(`❌ Workflow error in step ${data.step.name}: ${data.error.message}`);
    });

    try {
        // Example 1: Customer Onboarding
        console.log('\n--- Customer Onboarding Workflow ---');
        const customerJobId = await agent.startWorkflow('customer-onboarding', {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890'
        });

        console.log(`Customer onboarding started with job ID: ${customerJobId}`);
        
        // Wait a bit for demo purposes
        await agent.delay(8000);

        // Example 2: Order Processing
        console.log('\n--- Order Processing Workflow ---');
        const orderJobId = await agent.startWorkflow('order-processing', {
            orderId: 'ORD-2024-001',
            customerId: 'cust_123',
            items: [
                { sku: 'PROD-001', quantity: 2, price: 49.99 },
                { sku: 'PROD-002', quantity: 1, price: 29.99 }
            ],
            shippingAddress: {
                street: '123 Main St',
                city: 'Anytown',
                state: 'CA',
                zip: '12345'
            }
        });

        console.log(`Order processing started with job ID: ${orderJobId}`);

        // Wait for completion
        await agent.delay(15000);

        // Check status
        const orderStatus = agent.getWorkflowStatus(orderJobId);
        console.log('\nOrder Status:', JSON.stringify(orderStatus, null, 2));

        // Example 3: Document Approval (will pause for human action)
        console.log('\n--- Document Approval Workflow ---');
        const docJobId = await agent.startWorkflow('document-approval', {
            documentId: 'DOC-2024-001',
            title: 'Privacy Policy Update',
            author: 'legal@example.com',
            type: 'policy'
        });

        console.log(`Document approval started with job ID: ${docJobId}`);

        // Wait for initial steps
        await agent.delay(25000);

        // Check status (should be waiting for approval)
        const docStatus = agent.getWorkflowStatus(docJobId);
        console.log('\nDocument Status:', JSON.stringify(docStatus, null, 2));

        // Simulate manager approval
        if (docStatus.status === 'waiting_for_approval') {
            console.log('\n--- Simulating Manager Approval ---');
            await agent.resumeWorkflow(docJobId, {
                managerApproval: true,
                approvedBy: 'manager@example.com',
                approvedAt: new Date(),
                comments: 'Approved with minor suggestions'
            });

            // Wait for compliance check
            await agent.delay(35000);

            // Simulate final approval
            const finalStatus = agent.getWorkflowStatus(docJobId);
            if (finalStatus.status === 'waiting_for_approval') {
                console.log('\n--- Simulating Final Approval ---');
                await agent.resumeWorkflow(docJobId, {
                    finalApproval: true,
                    approvedBy: 'ceo@example.com',
                    approvedAt: new Date(),
                    publishDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                });
            }
        }

        console.log('\n=== Demo completed ===');

    } catch (error) {
        console.error('Demo error:', error);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorkflowAgent, demonstrateWorkflowAutomation };
}

// Run demo if called directly
if (typeof window === 'undefined' && require.main === module) {
    demonstrateWorkflowAutomation();
}