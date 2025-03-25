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
  
  // Fetch suggested questions from API
  useEffect(() => {
    const fetchSuggestedQuestions = async () => {
      try {
        const response = await fetch(`${apiBasePath}/chat/suggested-questions`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.suggestedQuestions) {
            setSuggestedQuestions(data.suggestedQuestions);
          }
        }
      } catch (error) {
        console.error('Error fetching suggested questions:', error);
      }
    };
    
    fetchSuggestedQuestions();
  }, [apiBasePath]);
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (persistConversation && messages.length > 0) {
      // Limit the number of messages saved
      const messagesToSave = messages.slice(-maxHistoryLength);
      localStorage.setItem('chatMessages', JSON.stringify(messagesToSave));
    }
  }, [messages, persistConversation, maxHistoryLength]);

  // We've removed the local response generation since we're now using the backend API
  
  // Function to clear chat history
  const clearChatHistory = () => {
    // Remove both messages and conversation ID from localStorage
    if (persistConversation) {
      localStorage.removeItem('chatMessages');
    }
    localStorage.removeItem('chatConversationId');
    
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
    
    // Create a conversation ID if we don't have one already
    let currentConversationId = localStorage.getItem('chatConversationId');
    
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
      // If we don't have a conversation ID, start a new one
      if (!currentConversationId) {
        const startResponse = await fetch(`${apiBasePath}/chat/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        
        if (!startResponse.ok) {
          throw new Error('Failed to start conversation');
        }
        
        const startData = await startResponse.json();
        currentConversationId = startData.conversationId;
        localStorage.setItem('chatConversationId', currentConversationId);
      }
      
      // Send the message to our API
      const messageResponse = await fetch(`${apiBasePath}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          text
        })
      });
      
      if (!messageResponse.ok) {
        throw new Error('Failed to send message');
      }
      
      const messageData = await messageResponse.json();
      
      // Add the bot's response to the chat
      const botMessage: Message = {
        id: messageData.message.id,
        text: messageData.message.text,
        sender: 'bot',
        timestamp: new Date(messageData.message.timestamp)
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error processing your request. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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