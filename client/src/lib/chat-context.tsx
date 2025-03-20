import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  simpleKnowledgeBase, 
  advancedKnowledgeBase, 
  keywordMapping 
} from './chatbot-knowledge';

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
    welcomeMessage = "Hi there! I'm DealGenie. How can I help you with deals and incentives today?",
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
    
    // Direct topic mapping for common questions
    // First, check if we have any direct question matches
    if (lowerText.includes("what is the deal process") || 
        lowerText.includes("deal process workflow") || 
        lowerText.includes("how does the deal process work")) {
      return aiModel === 'advanced' ? advancedKnowledgeBase.dealProcess : simpleKnowledgeBase.dealProcess;
    }
    
    if (lowerText.includes("how do i submit a deal") || 
        lowerText.includes("how to submit a deal") || 
        lowerText.includes("deal submission")) {
      return aiModel === 'advanced' ? advancedKnowledgeBase.dealSubmission : simpleKnowledgeBase.dealSubmission;
    }
    
    if (lowerText.includes("financial incentive") || 
        lowerText.includes("money incentive") || 
        lowerText.includes("revenue share")) {
      return aiModel === 'advanced' ? advancedKnowledgeBase.financialIncentives : simpleKnowledgeBase.financialIncentives;
    }

    if (lowerText.includes("what incentives") || 
        lowerText.includes("available incentives") || 
        lowerText.includes("incentive types") ||
        lowerText.includes("types of incentives")) {
      return aiModel === 'advanced' ? advancedKnowledgeBase.generalIncentives : simpleKnowledgeBase.generalIncentives;
    }
    
    if (lowerText.includes("documentation") || 
        lowerText.includes("what documents") || 
        lowerText.includes("required documentation") ||
        lowerText.includes("what is required")) {
      return aiModel === 'advanced' ? advancedKnowledgeBase.documentationRequirements : simpleKnowledgeBase.documentationRequirements;
    }
    
    // Helper function to check if the user's query contains any of the keywords
    const matchesKeywords = (keywords: string[]): boolean => {
      return keywords.some(keyword => lowerText.includes(keyword));
    };
    
    // Match the user's query against the keyword mapping to determine the appropriate response
    const getTopicFromKeywords = (): string | null => {
      for (const [topic, keywords] of Object.entries(keywordMapping)) {
        // For compound topics that need multiple keyword matches
        if (topic === 'financialIncentives' && 
            (lowerText.includes('incentive') || lowerText.includes('bonus')) && 
            (lowerText.includes('financial') || lowerText.includes('money') || lowerText.includes('revenue'))) {
          return topic;
        }
        else if (topic === 'productIncentives' && 
                (lowerText.includes('incentive') || lowerText.includes('bonus')) && 
                (lowerText.includes('product') || lowerText.includes('feature'))) {
          return topic;
        }
        else if (topic === 'resourceIncentives' && 
                (lowerText.includes('incentive') || lowerText.includes('bonus')) && 
                (lowerText.includes('resource') || lowerText.includes('training'))) {
          return topic;
        }
        // For simple keyword matching
        else if (matchesKeywords(keywords as string[])) {
          return topic;
        }
      }
      
      // If the query mentions incentives generally
      if (lowerText.includes('incentive') || lowerText.includes('bonus') || lowerText.includes('threshold')) {
        return 'generalIncentives';
      }
      
      // If query includes process or workflow
      if (lowerText.includes('process') || lowerText.includes('workflow') || lowerText.includes('steps')) {
        return 'dealProcess';
      }
      
      return null;
    };
    
    const topic = getTopicFromKeywords();
    
    // Simple model responses
    if (aiModel === 'simple') {
      if (topic) {
        // Access the appropriate response from the knowledge base
        const knowledgeKey = topic as keyof typeof simpleKnowledgeBase;
        return simpleKnowledgeBase[knowledgeKey] || simpleKnowledgeBase.defaultResponse;
      }
      
      // Default response if no specific topic is matched
      return simpleKnowledgeBase.defaultResponse;
    } 
    // Advanced model responses
    else if (aiModel === 'advanced') {
      if (topic) {
        // Access the appropriate detailed response from the advanced knowledge base
        const knowledgeKey = topic as keyof typeof advancedKnowledgeBase;
        return advancedKnowledgeBase[knowledgeKey] || advancedKnowledgeBase.defaultResponse;
      }
      
      // Context-aware response for unmatched queries in advanced mode
      const contextualIntro = 'I notice you\'re asking about ' + text.split(' ').slice(0, 3).join(' ') + '... \n\n';
      return contextualIntro + advancedKnowledgeBase.generalResponse;
    }
    
    // Default fallback (should never reach here since we always have simple or advanced)
    return advancedKnowledgeBase.defaultResponse;
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