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
  isLoading: boolean;
  suggestedQuestions: string[];
};

// Create context with default values
const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: () => {},
  isLoading: false,
  suggestedQuestions: [],
});

// Hook for easy context access
export const useChat = () => useContext(ChatContext);

export function ChatProvider({ 
  children, 
  config 
}: { 
  children: React.ReactNode, 
  config: ChatConfig 
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm your Deal Assistant. How can I help you with deals and incentives today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    config.defaultSuggestedQuestions || []
  );

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
        // Simple response logic based on keywords in the message
        let botResponse = '';
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('incentive') || lowerText.includes('bonus') || lowerText.includes('threshold')) {
          botResponse = 'Deal incentives are calculated based on total deal value, contract length, and growth metrics. Standard deals have a 2% incentive, while strategic deals can qualify for up to 5% incentives with proper approval.';
        } else if (lowerText.includes('discount') || lowerText.includes('approval')) {
          botResponse = 'Discount approval follows a tiered process: up to 10% can be approved by team leads, 10-20% by managers, and anything over 20% requires director approval. All discounts must be documented with business justification.';
        } else if (lowerText.includes('urgent') || lowerText.includes('fast track')) {
          botResponse = 'For urgent deals, mark "High Priority" in the submission form and add [URGENT] to the beginning of the deal name. Also, reach out directly to your regional deal desk manager to notify them of the urgent request.';
        } else if (lowerText.includes('growth') || lowerText.includes('opportunit')) {
          botResponse = 'Growth opportunities that qualify for incentives include: expanding to new markets, increasing contract value by at least 20%, extending contract terms beyond 24 months, or adding new product lines to existing contracts.';
        } else if (lowerText.includes('submit') || lowerText.includes('new deal')) {
          botResponse = 'To submit a new deal, navigate to the "Submit Deal" page from the main menu. Fill out all required fields, attach any necessary documentation, and then click "Submit for Review". You\'ll receive a confirmation email with the deal reference number.';
        } else {
          botResponse = 'Thanks for your question. For specific details about this topic, I recommend checking our documentation in the Guides section or reaching out to your deal desk manager.';
        }
        
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
      isLoading, 
      suggestedQuestions 
    }}>
      {children}
    </ChatContext.Provider>
  );
}