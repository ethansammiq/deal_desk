import { Express, Request, Response } from 'express';
import { IStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';

// Message types
export interface ChatMessage {
  id: string;
  conversationId: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface IChatStorage {
  getMessage(id: string): Promise<ChatMessage | undefined>;
  getMessagesByConversationId(conversationId: string): Promise<ChatMessage[]>;
  createMessage(message: ChatMessage): Promise<ChatMessage>;
  getAllKnowledgeBase(): Promise<Array<{ question: string; answer: string }>>;
}

// Chat storage implementation using MemStorage pattern
export class ChatMemStorage implements IChatStorage {
  private messages: Map<string, ChatMessage> = new Map();
  private knowledgeBase: Array<{ question: string; answer: string }> = [
    {
      question: "What are the incentive thresholds?",
      answer: "Deal incentives are calculated based on total deal value, contract length, and growth metrics. Standard deals have a 2% incentive, while strategic deals can qualify for up to 5% incentives with proper approval."
    },
    {
      question: "What are the approval requirements?",
      answer: "Discount approval follows a tiered process: up to 10% can be approved by team leads, 10-20% by managers, and anything over 20% requires director approval. All discounts must be documented with business justification."
    },
    {
      question: "How do I submit a new deal?",
      answer: "To submit a new deal, navigate to the \"Submit Deal\" page from the main menu. Fill out all required fields, attach any necessary documentation, and then click \"Submit for Review\". You'll receive a confirmation email with the deal reference number."
    },
    {
      question: "How are urgent deals handled?",
      answer: "For urgent deals, mark \"High Priority\" in the submission form and add [URGENT] to the beginning of the deal name. Also, reach out directly to your regional deal desk manager to notify them of the urgent request."
    },
    {
      question: "What growth opportunities qualify for incentives?",
      answer: "Growth opportunities that qualify for incentives include: expanding to new markets, increasing contract value by at least 20%, extending contract terms beyond 24 months, or adding new product lines to existing contracts."
    }
  ];

  async getMessage(id: string): Promise<ChatMessage | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversationId(conversationId: string): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(message: ChatMessage): Promise<ChatMessage> {
    this.messages.set(message.id, message);
    return message;
  }

  async getAllKnowledgeBase(): Promise<Array<{ question: string; answer: string }>> {
    return this.knowledgeBase;
  }
}

// Enhanced AI response generator
async function generateAIResponse(message: string, storage: IChatStorage): Promise<string> {
  // In a real implementation, this would call OpenAI API
  // For now, we'll do a keyword matching response with improved matching logic
  
  const kb = await storage.getAllKnowledgeBase();
  const lowerText = message.toLowerCase();
  
  // Import the keywords mapping from frontend to avoid duplication
  // This directly references client-side knowledge base since we're sharing logic
  const keywordMappingImport = {
    dealProcess: ['process', 'workflow', 'lifecycle', 'steps', 'stages', 'how deal works', 'deal flow', 'deal stages', 'deal lifecycle'],
    dealScoping: [
      'scoping', 'scope', 'initial stage', 'first step', 'begin deal', 'start deal', 
      'what is scoping', 'deal scoping', 'scoping stage', 'scoping process', 
      'how to scope a deal', 'deal parameters', 'customer needs', 'solution design'
    ],
    dealSubmission: [
      'submit', 'submission', 'new deal', 'create deal', 'start deal', 'enter deal', 'deal form',
      'how to submit', 'submission process', 'deal details', 'required fields'
    ],
    review: [
      'review', 'approval', 'approve', 'evaluate', 'assessment', 'appraise',
      'review process', 'approval process', 'deal desk review', 'stakeholder approval'
    ],
    negotiation: [
      'negotiation', 'contract', 'terms', 'agreement', 'finalize deal',
      'negotiation process', 'contract review', 'legal review'
    ],
    financialIncentives: [
      'financial incentive', 'money', 'revenue share', 'monetary', 'commission', 
      'discount', 'financial bonus', 'added value media'
    ],
    productIncentives: [
      'product incentive', 'feature', 'platform', 'product bonus', 'feature access', 
      'early access', 'integration services'
    ],
    resourceIncentives: [
      'resource incentive', 'training', 'technical resource', 'support', 'assistance', 
      'help resources', 'technical account manager'
    ],
    generalIncentives: [
      'incentive', 'bonus', 'threshold', 'rewards', 'perks', 'benefits', 'special offers',
      'what incentives', 'available incentives', 'incentive types'
    ],
    eligibility: [
      'eligibility', 'qualify', 'eligible', 'who can', 'requirements', 'criteria', 
      'qualification', 'who qualifies'
    ],
    documentation: [
      'document', 'paperwork', 'forms', 'required files', 'attachments', 'what to submit', 
      'required documents', 'what is required'
    ],
    urgent: [
      'urgent', 'fast track', 'expedite', 'rush', 'quick', 'emergency', 'immediate', 
      'asap', 'high priority'
    ],
    growth: [
      'growth', 'opportunity', 'expansion', 'increase', 'growing', 'scale', 'upsell',
      'new markets', 'contract value increase'
    ]
  };
  
  // Check against knowledge base for direct matching questions
  for (const entry of kb) {
    const keywords = entry.question.toLowerCase().split(' ');
    if (keywords.some(keyword => lowerText.includes(keyword) && keyword.length > 3)) {
      return entry.answer;
    }
  }
  
  // Define detailed responses for each category
  const responses = {
    dealProcess: 'The MIQ deal process follows these key stages:\n\n1. **Scoping**: Define customer needs and potential solutions\n2. **Submission**: Complete deal forms with all required details\n3. **Review**: Deal desk assesses commercial terms and requirements\n4. **Approval**: Stakeholders sign off based on deal value and terms\n5. **Negotiation**: Finalize terms with the customer\n6. **Contracting**: Execute legal agreements\n7. **Evaluation**: Post-deal review and performance tracking\n\nEach stage has specific requirements and documentation. Would you like more details about a particular stage?',
    
    dealScoping: 'Deal scoping is the critical first stage of our deal process. Here\'s what you need to know:\n\n• **Purpose**: Define deal parameters, customer needs, and potential solutions\n• **Requirements**: Customer profile, business needs assessment, preliminary solution design\n• **Process**: Complete the Deal Scoping Request form in the system\n• **Timeline**: Typically 1-3 days for initial review\n• **Next steps**: After approval, you can move to formal deal submission\n\nPro tip: The more detailed your scoping information, the faster your deal can progress through later stages.',
    
    dealSubmission: 'To submit a new deal, follow these steps:\n\n1. Navigate to the "Submit Deal" page from the main menu\n2. Complete all required fields:\n   • Customer information\n   • Deal value and term\n   • Product/service details\n   • Incentive requests (if applicable)\n   • Special terms or conditions\n3. Attach necessary documentation:\n   • Statement of Work (if services are included)\n   • Custom requirements document\n   • Pricing approval (if discounts are applied)\n4. Click "Submit for Review"\n\nYou\'ll receive a confirmation email with the deal reference number for tracking. The standard review time is 2 business days, or 4 hours for urgent deals.',
    
    review: 'The deal review and approval process involves these key steps:\n\n1. **Initial screening** (1 business day): Deal desk checks for completeness\n2. **Commercial review** (1-2 business days): Pricing and terms assessment\n3. **Technical review** (if applicable, 1-3 business days): Product/service feasibility\n4. **Legal review** (for non-standard terms, 2-5 business days): Contract assessment\n5. **Final approval** (based on deal value):\n   • Up to $50K: Manager approval\n   • $50K-$250K: Director approval\n   • $250K+: VP or C-level approval\n\nThe status of your deal is visible in real-time on the dashboard. You\'ll receive email notifications at each approval stage.',
    
    negotiation: 'The negotiation and contracting process follows these steps:\n\n1. **Term sheet preparation**: Deal desk prepares approved commercial terms\n2. **Customer negotiation**: Sales team leads discussions with support from deal desk\n3. **Term finalization**: All commercial terms documented and agreed\n4. **Contract preparation**: Legal team prepares final agreements\n5. **Signature process**: Electronic signature through our platform\n6. **Deal closure**: System updated, implementation begins\n\nModifications during negotiation may require additional approval if they differ significantly from the initially approved terms.',
    
    financialIncentives: 'MIQ offers the following financial incentives:\n\n• **Added Value Media**: Additional media inventory at no cost\n   - Eligibility: Deals >$50,000\n   - Approval: Director level\n   - Limit: Up to 10% of deal value\n\n• **Revenue Share**: Performance-based commission structure\n   - Eligibility: Deals >$100,000\n   - Approval: VP level\n   - Standard terms: 5-15% based on volume\n\n• **Performance Bonuses**: Financial rewards for exceeding KPIs\n   - Eligibility: All deals with measurable KPIs\n   - Approval: Manager with Finance review\n   - Documentation: Must include specific, measurable targets\n\nAll financial incentives require business justification and ROI analysis.',
    
    productIncentives: 'MIQ offers these product incentives:\n\n• **Feature Access**: Early or exclusive access to new platform features\n   - Eligibility: Strategic customers, deals >$75,000\n   - Approval: Product team and engineering\n   - Limitations: Subject to technical feasibility\n\n• **Integration Services**: Custom integration support\n   - Eligibility: Multi-year contracts, deals >$50,000\n   - Approval: Technical director\n   - Resource allocation: Up to 40 hours of engineering time\n\n• **Platform Customizations**: Tailored UI/UX or functionality\n   - Eligibility: Enterprise customers, deals >$150,000\n   - Approval: Product VP and CTO\n   - Requirements: Technical assessment and roadmap alignment\n\nProduct incentives are subject to engineering capacity and strategic alignment.',
    
    resourceIncentives: 'MIQ offers these resource incentives:\n\n• **Technical Resources**: Dedicated technical account manager or implementation specialist\n   - Eligibility: Deals >$50,000\n   - Approval: Technical services manager\n   - Duration: Typically 30-90 days post-implementation\n\n• **Training & Development**: Custom training programs\n   - Eligibility: All customers\n   - Approval: Team lead\n   - Standard allocation: 2-8 hours based on deal size\n\n• **Consultative Services**: Business strategy and optimization consulting\n   - Eligibility: Deals >$100,000\n   - Approval: Director level\n   - Scope: Defined by Statement of Work\n\nResource incentives are subject to team availability and capacity planning.',
    
    generalIncentives: 'MIQ offers three main categories of incentives to support your deals:\n\n• **Financial Incentives**: \n   - Added Value Media (up to 10% of deal value)\n   - Revenue Share (5-15% based on volume)\n   - Performance Bonuses (tied to KPIs)\n\n• **Product Incentives**: \n   - Early Feature Access\n   - Integration Services\n   - Platform Customizations\n\n• **Resource Incentives**: \n   - Technical Resources\n   - Training & Development\n   - Consultative Services\n\nEach incentive type has specific eligibility criteria based on deal size, customer tier, and strategic value. What specific incentive type are you interested in learning more about?',
    
    eligibility: 'Eligibility for MIQ incentive programs is determined by multiple factors:\n\n• **Deal Size**: Minimum thresholds vary by incentive type\n   - Financial incentives: Typically $50,000+\n   - Product incentives: Typically $75,000+\n   - Resource incentives: Various thresholds, some available to all customers\n\n• **Customer Tier**: Gold, Silver, and Bronze classifications\n   - Gold: Access to all incentive programs\n   - Silver: Limited access to financial incentives\n   - Bronze: Primarily eligible for resource incentives\n\n• **Contract Length**: Multi-year commitments receive enhanced incentives\n   - 1-year: Standard incentive levels\n   - 2-year: +25% incentive value\n   - 3+ year: +40% incentive value\n\n• **Strategic Alignment**: Deals that align with company priorities receive preferential treatment\n\nThe Deal Desk team makes the final determination on incentive eligibility.',
    
    documentation: 'The following documentation is required for deal submission and approval:\n\n1. **Deal Submission Form**: Core deal details including products, pricing, and term\n2. **Customer Requirements Document**: Specific needs and expectations\n3. **Statement of Work (SOW)**: Required for any service components\n4. **Business Justification**: Required for non-standard terms or pricing\n5. **Approval Documentation**: Evidence of proper approvals for discounts or incentives\n6. **Technical Assessment**: Required for product customizations or integrations\n7. **Legal Review**: Required for contract modifications\n\nPro tip: Use our templates (available in the Help Resources section) to ensure faster processing and reduce back-and-forth communications.',
    
    urgent: 'For urgent deals, follow these specific steps:\n\n1. Mark "High Priority" in the submission form\n2. Add [URGENT] to the beginning of the deal name\n3. Reach out directly to your regional deal desk manager via email or Slack\n4. Provide clear justification for the urgency in the comments section\n\nUrgent deals receive expedited review (typically within 4 business hours) but must still meet all documentation requirements. Note that repeated urgent requests without genuine time sensitivity may affect future urgent deal processing.',
    
    growth: 'Growth opportunities that qualify for enhanced incentives include:\n\n• **Market Expansion**: Entering new geographic markets or industries\n• **Contract Value Increase**: Growing existing contracts by at least 20%\n• **Term Extension**: Extending contract duration beyond 24 months\n• **Product Expansion**: Adding new product lines to existing contracts\n• **Strategic Alignment**: Deals that align with quarterly strategic focus areas\n\nGrowth deals are eligible for premium incentive rates and may qualify for executive sponsorship. Document the growth opportunity clearly in the "Strategic Value" section of the deal submission form.'
  };
  
  // Enhanced matching logic - check each topic's keywords against the user message
  for (const [topic, keywords] of Object.entries(keywordMappingImport)) {
    // Check if any keyword from this topic appears in the user message
    const topicMatch = keywords.some(keyword => {
      // For multi-word keywords, check for exact phrase
      if (keyword.includes(' ')) {
        return lowerText.includes(keyword);
      }
      // For single words, check for word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(lowerText);
    });
    
    if (topicMatch && responses[topic]) {
      return responses[topic];
    }
  }
  
  // Fallback for deal-related questions that don't match specific topics
  if (lowerText.includes('deal') || lowerText.includes('process') || lowerText.includes('workflow')) {
    return 'I notice you\'re asking about MIQ\'s commercial deal process. Our process is designed to support you through every stage from scoping to execution. Our incentive programs (Financial, Product, and Resource) can help you close more deals and drive customer satisfaction.\n\nFor more specific information, you can ask me about:\n- Deal process stages and requirements\n- Specific incentive programs and eligibility\n- Documentation requirements\n- Approval workflows\n\nOr browse our detailed guides in the Help Resources section.';
  }
  
  // Generic fallback for non-deal questions
  return 'Thanks for your question about MIQ\'s commercial deal process. I\'m here to help with information about deal workflows, incentive programs, eligibility requirements, and documentation needs. Could you provide more specific details about what you\'re looking for?';
}

// Config type
export interface ChatbotConfig {
  basePath: string;
  storage: IChatStorage;
  welcomeMessage?: string;
}

// Register routes
export function registerChatbotRoutes(
  app: Express,
  config: ChatbotConfig
) {
  const { basePath, storage, welcomeMessage = "Hi there! I'm your Deal Assistant. How can I help you with deals and incentives today?" } = config;
  
  // Start a new conversation
  app.post(`${basePath}/chat/start`, async (req: Request, res: Response) => {
    try {
      const conversationId = uuidv4();
      const welcomeMsg: ChatMessage = {
        id: uuidv4(),
        conversationId,
        text: welcomeMessage,
        sender: 'bot',
        timestamp: new Date()
      };
      
      await storage.createMessage(welcomeMsg);
      
      res.status(200).json({
        success: true,
        conversationId,
        message: welcomeMsg
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start conversation'
      });
    }
  });
  
  // Send a message and get a response
  app.post(`${basePath}/chat/message`, async (req: Request, res: Response) => {
    try {
      const { conversationId, text } = req.body;
      
      if (!conversationId || !text) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: conversationId and text'
        });
      }
      
      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        conversationId,
        text,
        sender: 'user',
        timestamp: new Date()
      };
      
      await storage.createMessage(userMessage);
      
      // Generate AI response
      const responseText = await generateAIResponse(text, storage);
      
      // Create bot message
      const botMessage: ChatMessage = {
        id: uuidv4(),
        conversationId,
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      await storage.createMessage(botMessage);
      
      res.status(200).json({
        success: true,
        message: botMessage
      });
    } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message'
      });
    }
  });
  
  // Get conversation history
  app.get(`${basePath}/chat/:conversationId`, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: conversationId'
        });
      }
      
      const messages = await storage.getMessagesByConversationId(conversationId);
      
      res.status(200).json({
        success: true,
        messages
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch conversation'
      });
    }
  });
  
  // Get suggested questions
  app.get(`${basePath}/chat/suggested-questions`, async (req: Request, res: Response) => {
    try {
      const knowledgeBase = await storage.getAllKnowledgeBase();
      const questions = knowledgeBase.map(entry => entry.question);
      
      res.status(200).json({
        success: true,
        questions
      });
    } catch (error) {
      console.error('Error fetching suggested questions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch suggested questions'
      });
    }
  });
}