import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export type ChatConfig = {
  apiBasePath: string;
  defaultSuggestedQuestions: string[];
  welcomeMessage?: string;
  autoSuggestThreshold?: number; // Number of characters typed before showing auto-suggestions
  persistConversation?: boolean; // Whether to save chat history in localStorage
  maxHistoryLength?: number; // Maximum number of messages to keep in history
  aiModel?: 'simple' | 'advanced'; // Which AI model to use for responses
};

type ChatContextType = {
  messages: Message[];
  sendMessage: (text: string) => void;
  clearChatHistory: () => void;
  isLoading: boolean;
  suggestedQuestions: string[];
  model: string;
};

// Create context with default values
const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: () => {},
  clearChatHistory: () => {},
  isLoading: false,
  suggestedQuestions: [],
  model: 'simple',
});

// Hook for easy context access
export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ 
  children, 
  config 
}: { 
  children: React.ReactNode, 
  config: ChatConfig 
}) {
  // Get configuration with defaults
  const {
    apiBasePath,
    defaultSuggestedQuestions = [],
    welcomeMessage = "Hi there! I'm your Deal Assistant. How can I help you with deals and incentives today?",
    autoSuggestThreshold = 3,
    persistConversation = false,
    maxHistoryLength = 50,
    aiModel = 'simple'
  } = config;
  
  // Initialize messages with welcome message or restore from localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    if (persistConversation) {
      try {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert string timestamps back to Date objects
          const messagesWithDates = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          return messagesWithDates;
        }
      } catch (error) {
        console.error('Error restoring chat history:', error);
      }
    }
    
    return [{
      id: '1',
      text: welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    }];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(defaultSuggestedQuestions);
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (persistConversation && messages.length > 0) {
      // Limit the number of messages saved
      const messagesToSave = messages.slice(-maxHistoryLength);
      localStorage.setItem('chatMessages', JSON.stringify(messagesToSave));
    }
  }, [messages, persistConversation, maxHistoryLength]);

  // Function to get a response based on AI model
  const getAIResponse = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based responses
    if (aiModel === 'simple') {
      // Deal Process Guidance
      if (lowerText.includes('process') || lowerText.includes('workflow') || lowerText.includes('lifecycle')) {
        return 'The MIQ deal process workflow consists of several stages: scoping, submission, review, approval, negotiation, contracting, and evaluation. Each stage has specific requirements and documentation needs.';
      } 
      // Deal Scoping
      else if (lowerText.includes('scoping') || lowerText.includes('scope')) {
        return 'Deal scoping is the initial stage where you define the deal parameters, customer needs, and potential solutions. Complete the Deal Scoping Request form in the system to begin this process.';
      }
      // Deal Submission
      else if (lowerText.includes('submit') || lowerText.includes('submission') || lowerText.includes('new deal')) {
        return 'To submit a new deal, navigate to the "Submit Deal" page from the main menu. Fill out all required fields, attach necessary documentation, and then click "Submit for Review". You\'ll receive a confirmation email with the deal reference number.';
      }
      // Deal Review & Approval
      else if (lowerText.includes('review') || lowerText.includes('approval') || lowerText.includes('approve')) {
        return 'The deal review process involves evaluation by the deal desk team, followed by approvals based on deal value and incentive requests. Standard deals are typically reviewed within 2 business days.';
      }
      // Negotiation & Contracting
      else if (lowerText.includes('negotiation') || lowerText.includes('contract')) {
        return 'During negotiation and contracting, the deal terms are finalized with the customer. Legal review is required for all non-standard terms. Use our contract templates as a starting point for faster approval.';
      }
      // Financial Incentives
      else if ((lowerText.includes('incentive') || lowerText.includes('bonus')) && (lowerText.includes('financial') || lowerText.includes('money') || lowerText.includes('revenue'))) {
        return 'Financial incentives include Added Value Media, Revenue Share, and Performance Bonuses. These require approval based on the incentive amount and typically need finance team review.';
      }
      // Product Incentives
      else if ((lowerText.includes('incentive') || lowerText.includes('bonus')) && (lowerText.includes('product') || lowerText.includes('feature'))) {
        return 'Product incentives include Feature Access, Integration Services, and Platform Customizations. These require product team approval and technical feasibility assessment.';
      }
      // Resource Incentives
      else if ((lowerText.includes('incentive') || lowerText.includes('bonus')) && (lowerText.includes('resource') || lowerText.includes('training'))) {
        return 'Resource incentives include Technical Resources, Training & Development, and Consultative Services. These are subject to team availability and typically require manager approval.';
      }
      // General Incentives
      else if (lowerText.includes('incentive') || lowerText.includes('bonus') || lowerText.includes('threshold')) {
        return 'MIQ offers three main incentive categories: Financial (Added Value Media, Revenue Share), Product (Feature Access, Integration Services), and Resource (Technical Resources, Training). Each has specific eligibility criteria and approval processes.';
      }
      // Eligibility Requirements
      else if (lowerText.includes('eligibility') || lowerText.includes('qualify') || lowerText.includes('eligible')) {
        return 'Eligibility for incentives depends on deal size, customer tier, contract length, and strategic alignment. Minimum deal values vary by incentive type, with financial incentives typically requiring larger deals.';
      }
      // Documentation Requirements
      else if (lowerText.includes('document') || lowerText.includes('paperwork') || lowerText.includes('forms')) {
        return 'Required documentation includes the Deal Submission Form, Customer Requirements Document, Statement of Work (for service components), and Business Justification (for non-standard terms or pricing).';
      }
      // Urgent Deals
      else if (lowerText.includes('urgent') || lowerText.includes('fast track') || lowerText.includes('expedite')) {
        return 'For urgent deals, mark "High Priority" in the submission form and add [URGENT] to the beginning of the deal name. Also, reach out directly to your regional deal desk manager to notify them of the urgent request.';
      }
      // Growth Opportunities
      else if (lowerText.includes('growth') || lowerText.includes('opportunity')) {
        return 'Growth opportunities that qualify for enhanced incentives include: expanding to new markets, increasing contract value by at least 20%, extending contract terms beyond 24 months, or adding new product lines to existing contracts.';
      }
      // Default response
      else {
        return 'Thanks for your question. For specific details about this topic, I recommend checking our documentation in the Help Resources section or reaching out to your deal desk manager.';
      }
    } 
    // Advanced model with context awareness (simulated)
    else if (aiModel === 'advanced') {
      // In a real implementation, we might send the full chat history to a more sophisticated AI model
      // For this example, we'll simulate a more sophisticated response with more detailed information
      
      // Deal Process Guidance
      if (lowerText.includes('process') || lowerText.includes('workflow') || lowerText.includes('lifecycle')) {
        return 'The MIQ deal process follows these key stages:\n\n1. **Scoping**: Define customer needs and potential solutions\n2. **Submission**: Complete deal forms with all required details\n3. **Review**: Deal desk assesses commercial terms and requirements\n4. **Approval**: Stakeholders sign off based on deal value and terms\n5. **Negotiation**: Finalize terms with the customer\n6. **Contracting**: Execute legal agreements\n7. **Evaluation**: Post-deal review and performance tracking\n\nEach stage has specific requirements and documentation. Would you like more details about a particular stage?';
      } 
      // Deal Scoping
      else if (lowerText.includes('scoping') || lowerText.includes('scope')) {
        return 'Deal scoping is the critical first stage of our deal process. Here\'s what you need to know:\n\n• **Purpose**: Define deal parameters, customer needs, and potential solutions\n• **Requirements**: Customer profile, business needs assessment, preliminary solution design\n• **Process**: Complete the Deal Scoping Request form in the system\n• **Timeline**: Typically 1-3 days for initial review\n• **Next steps**: After approval, you can move to formal deal submission\n\nPro tip: The more detailed your scoping information, the faster your deal can progress through later stages.';
      }
      // Deal Submission
      else if (lowerText.includes('submit') || lowerText.includes('submission') || lowerText.includes('new deal')) {
        return 'To submit a new deal, follow these steps:\n\n1. Navigate to the "Submit Deal" page from the main menu\n2. Complete all required fields:\n   • Customer information\n   • Deal value and term\n   • Product/service details\n   • Incentive requests (if applicable)\n   • Special terms or conditions\n3. Attach necessary documentation:\n   • Statement of Work (if services are included)\n   • Custom requirements document\n   • Pricing approval (if discounts are applied)\n4. Click "Submit for Review"\n\nYou\'ll receive a confirmation email with the deal reference number for tracking. The standard review time is 2 business days, or 4 hours for urgent deals.';
      }
      // Financial Incentives
      else if ((lowerText.includes('incentive') || lowerText.includes('bonus')) && (lowerText.includes('financial') || lowerText.includes('money') || lowerText.includes('revenue'))) {
        return 'MIQ offers the following financial incentives:\n\n• **Added Value Media**: Additional media inventory at no cost\n   - Eligibility: Deals >$50,000\n   - Approval: Director level\n   - Limit: Up to 10% of deal value\n\n• **Revenue Share**: Performance-based commission structure\n   - Eligibility: Deals >$100,000\n   - Approval: VP level\n   - Standard terms: 5-15% based on volume\n\n• **Performance Bonuses**: Financial rewards for exceeding KPIs\n   - Eligibility: All deals with measurable KPIs\n   - Approval: Manager with Finance review\n   - Documentation: Must include specific, measurable targets\n\nAll financial incentives require business justification and ROI analysis.';
      }
      // Product Incentives
      else if ((lowerText.includes('incentive') || lowerText.includes('bonus')) && (lowerText.includes('product') || lowerText.includes('feature'))) {
        return 'MIQ offers these product incentives:\n\n• **Feature Access**: Early or exclusive access to new platform features\n   - Eligibility: Strategic customers, deals >$75,000\n   - Approval: Product team and engineering\n   - Limitations: Subject to technical feasibility\n\n• **Integration Services**: Custom integration support\n   - Eligibility: Multi-year contracts, deals >$50,000\n   - Approval: Technical director\n   - Resource allocation: Up to 40 hours of engineering time\n\n• **Platform Customizations**: Tailored UI/UX or functionality\n   - Eligibility: Enterprise customers, deals >$150,000\n   - Approval: Product VP and CTO\n   - Requirements: Technical assessment and roadmap alignment\n\nProduct incentives are subject to engineering capacity and strategic alignment.';
      }
      // Resource Incentives
      else if ((lowerText.includes('incentive') || lowerText.includes('bonus')) && (lowerText.includes('resource') || lowerText.includes('training'))) {
        return 'MIQ offers these resource incentives:\n\n• **Technical Resources**: Dedicated technical account manager or implementation specialist\n   - Eligibility: Deals >$50,000\n   - Approval: Technical services manager\n   - Duration: Typically 30-90 days post-implementation\n\n• **Training & Development**: Custom training programs\n   - Eligibility: All customers\n   - Approval: Team lead\n   - Standard allocation: 2-8 hours based on deal size\n\n• **Consultative Services**: Business strategy and optimization consulting\n   - Eligibility: Deals >$100,000\n   - Approval: Director level\n   - Scope: Defined by Statement of Work\n\nResource incentives are subject to team availability and capacity planning.';
      }
      // Documentation Requirements
      else if (lowerText.includes('document') || lowerText.includes('paperwork') || lowerText.includes('forms')) {
        return 'The following documentation is required for deal submission and approval:\n\n1. **Deal Submission Form**: Core deal details including products, pricing, and term\n2. **Customer Requirements Document**: Specific needs and expectations\n3. **Statement of Work (SOW)**: Required for any service components\n4. **Business Justification**: Required for non-standard terms or pricing\n5. **Approval Documentation**: Evidence of proper approvals for discounts or incentives\n6. **Technical Assessment**: Required for product customizations or integrations\n7. **Legal Review**: Required for contract modifications\n\nPro tip: Use our templates (available in the Help Resources section) to ensure faster processing and reduce back-and-forth communications.';
      }
      // Eligibility Requirements
      else if (lowerText.includes('eligibility') || lowerText.includes('qualify') || lowerText.includes('eligible')) {
        return 'Eligibility for MIQ incentive programs is determined by multiple factors:\n\n• **Deal Size**: Minimum thresholds vary by incentive type\n   - Financial incentives: Typically $50,000+\n   - Product incentives: Typically $75,000+\n   - Resource incentives: Various thresholds, some available to all customers\n\n• **Customer Tier**: Gold, Silver, and Bronze classifications\n   - Gold: Access to all incentive programs\n   - Silver: Limited access to financial incentives\n   - Bronze: Primarily eligible for resource incentives\n\n• **Contract Length**: Multi-year commitments receive enhanced incentives\n   - 1-year: Standard incentive levels\n   - 2-year: +25% incentive value\n   - 3+ year: +40% incentive value\n\n• **Strategic Alignment**: Deals that align with company priorities receive preferential treatment\n\nThe Deal Desk team makes the final determination on incentive eligibility.';
      }
      // General response with context awareness
      else {
        return 'I notice you\'re asking about ' + text.split(' ').slice(0, 3).join(' ') + '... \n\nMIQ\'s commercial deal process is designed to support you through every stage from scoping to execution. Our incentive programs (Financial, Product, and Resource) can help you close more deals and drive customer satisfaction.\n\nFor more specific information, you can ask me about:\n- Deal process stages and requirements\n- Specific incentive programs and eligibility\n- Documentation requirements\n- Approval workflows\n\nOr browse our detailed guides in the Help Resources section.';
      }
    }
    
    // Default fallback
    return 'Thanks for your question about MIQ\'s commercial deal process. I\'m here to help with information about deal workflows, incentive programs, eligibility requirements, and documentation needs. Could you provide more specific details about what you\'re looking for?';
  };
  
  // Function to clear chat history
  const clearChatHistory = () => {
    if (persistConversation) {
      localStorage.removeItem('chatMessages');
    }
    
    setMessages([{
      id: Date.now().toString(),
      text: welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    }]);
  };
  
  // Function to send messages
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // In a real implementation, we would send a request to the backend API
      // For now, we'll simulate a response after a delay
      setTimeout(() => {
        // Get response from the appropriate AI model
        const botResponse = getAIResponse(text);
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error processing your request. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Provide chat functionality to all child components
  return (
    <ChatContext.Provider value={{ 
      messages, 
      sendMessage,
      clearChatHistory, 
      isLoading, 
      suggestedQuestions,
      model: aiModel
    }}>
      {children}
    </ChatContext.Provider>
  );
}