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
      if (lowerText.includes('incentive') || lowerText.includes('bonus') || lowerText.includes('threshold')) {
        return 'Deal incentives are calculated based on total deal value, contract length, and growth metrics. Standard deals have a 2% incentive, while strategic deals can qualify for up to 5% incentives with proper approval.';
      } else if (lowerText.includes('discount') || lowerText.includes('approval')) {
        return 'Discount approval follows a tiered process: up to 10% can be approved by team leads, 10-20% by managers, and anything over 20% requires director approval. All discounts must be documented with business justification.';
      } else if (lowerText.includes('urgent') || lowerText.includes('fast track')) {
        return 'For urgent deals, mark "High Priority" in the submission form and add [URGENT] to the beginning of the deal name. Also, reach out directly to your regional deal desk manager to notify them of the urgent request.';
      } else if (lowerText.includes('growth') || lowerText.includes('opportunit')) {
        return 'Growth opportunities that qualify for incentives include: expanding to new markets, increasing contract value by at least 20%, extending contract terms beyond 24 months, or adding new product lines to existing contracts.';
      } else if (lowerText.includes('submit') || lowerText.includes('new deal')) {
        return 'To submit a new deal, navigate to the "Submit Deal" page from the main menu. Fill out all required fields, attach any necessary documentation, and then click "Submit for Review". You\'ll receive a confirmation email with the deal reference number.';
      } else {
        return 'Thanks for your question. For specific details about this topic, I recommend checking our documentation in the Guides section or reaching out to your deal desk manager.';
      }
    } 
    // Advanced model with context awareness (simulated)
    else if (aiModel === 'advanced') {
      // In a real implementation, we might send the full chat history to a more sophisticated AI model
      // For this example, we'll simulate a more sophisticated response by adding more detail
      
      if (lowerText.includes('incentive') || lowerText.includes('bonus') || lowerText.includes('threshold')) {
        return 'Deal incentives are calculated based on total deal value, contract length, and growth metrics. Standard deals have a 2% incentive, while strategic deals can qualify for up to 5% incentives with proper approval.\n\nFor 2025, the incentive thresholds have been updated:\n• Tier 1 (Basic): Deals $10k-$50k - 2% incentive\n• Tier 2 (Growth): Deals $50k-$200k - 3% incentive\n• Tier 3 (Strategic): Deals $200k+ - 5% incentive\n\nMulti-year contracts receive additional 0.5% per year beyond the first year.';
      } else if (lowerText.includes('discount') || lowerText.includes('approval')) {
        return 'Discount approval follows a tiered process: up to 10% can be approved by team leads, 10-20% by managers, and anything over 20% requires director approval. All discounts must be documented with business justification.\n\nTo request a discount approval, use the Discount Request form in the Deal Submission workflow and indicate the required approval level. The system will route your request to the appropriate approver automatically. For urgent discount approvals, use the expedited workflow option.';
      } else if (lowerText.includes('urgent') || lowerText.includes('fast track')) {
        return 'For urgent deals, mark "High Priority" in the submission form and add [URGENT] to the beginning of the deal name. Also, reach out directly to your regional deal desk manager to notify them of the urgent request.\n\nThe SLA for urgent deals is 4 business hours vs. the standard 2 business days. Remember that using the urgent flag too frequently may result in a review of your prioritization process.';
      } else {
        return 'I notice you\'re asking about ' + text.split(' ').slice(0, 3).join(' ') + '... For specific details about this topic, I recommend checking our documentation in the Guides section or reaching out to your deal desk manager. You can also ask me more specific questions about deal submission, incentive calculations, or approval processes.';
      }
    }
    
    // Default fallback
    return 'Thanks for your question. I\'m here to help with any deal desk related inquiries you might have.';
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