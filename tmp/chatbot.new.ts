import { Express, Request, Response } from 'express';
import { IStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { generateContextPrompt } from './knowledge-service';

// Message types
export interface ChatMessage {
  id: string;
  conversationId: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Define the knowledge base entry type
export interface KnowledgeBaseEntry {
  question: string;
  answer: string;
  variants?: string[];
}

export interface IChatStorage {
  getMessage(id: string): Promise<ChatMessage | undefined>;
  getMessagesByConversationId(conversationId: string): Promise<ChatMessage[]>;
  createMessage(message: ChatMessage): Promise<ChatMessage>;
  getAllKnowledgeBase(): Promise<Array<KnowledgeBaseEntry>>;
}

// Chat storage implementation using MemStorage pattern
export class ChatMemStorage implements IChatStorage {
  private messages: Map<string, ChatMessage> = new Map();
  
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
  
  async getAllKnowledgeBase(): Promise<Array<KnowledgeBaseEntry>> {
    // Return empty array since we're using Claude AI exclusively now
    return [];
  }
}

// Enhanced AI response generator using Claude exclusively
async function generateAIResponse(message: string, storage: IChatStorage): Promise<string> {
  // Generate a unique identifier for this request to track in logs
  const requestId = Math.random().toString(36).substring(2, 8);
  console.log(`\n\n==========================================================`);
  console.log(`[Chatbot][${requestId}] PROCESSING QUERY: "${message}"`);
  console.log(`==========================================================\n`);
  
  // Extract conversation ID if it's embedded in the message
  let conversationId = 'default';
  const originalMessage = message;
  
  if (message.includes('conversation-id:')) {
    const parts = message.split('conversation-id:');
    conversationId = parts[1].trim();
    message = parts[0].trim(); // Remove the conversation ID part from the actual message
    console.log(`[Chatbot][${requestId}] Extracted conversation ID: ${conversationId}`);
    console.log(`[Chatbot][${requestId}] Cleaned message: "${message}"`);
  }
  
  // Use Claude AI model for response, with no fallback to pattern matching
  try {
    // Special topic detection for better debugging
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('step') || lowerMessage.includes('stage')) {
      console.log(`[Chatbot][${requestId}] TOPIC DETECTED: Steps/Stages question`);
    } else if (lowerMessage.includes('incentive') || lowerMessage.includes('discount')) {
      console.log(`[Chatbot][${requestId}] TOPIC DETECTED: Incentives/Discounts question`);
    } else if (lowerMessage.includes('approve') || lowerMessage.includes('approval')) {
      console.log(`[Chatbot][${requestId}] TOPIC DETECTED: Approval process question`);
    } else {
      console.log(`[Chatbot][${requestId}] No specific topic detected, general query`);
    }
    
    // Import the Anthropic integration service
    const { generateAIResponse: claudeGenerate } = await import('./anthropic');
    console.log(`[Chatbot][${requestId}] Successfully imported Anthropic module`);
    
    // Get previous messages for context
    const previousMessages = await storage.getMessagesByConversationId(conversationId);
    console.log(`[Chatbot][${requestId}] Retrieved ${previousMessages.length} previous messages for conversation: ${conversationId}`);
    
    // Create a clean conversation history without metadata
    const conversationHistory = previousMessages
      .filter(msg => !msg.text.includes('conversation-id:') && !msg.text.includes('[QueryID:')) // Filter out metadata
      .map(msg => msg.text);
    
    console.log(`[Chatbot][${requestId}] Using ${conversationHistory.length} messages for context`);
    if (conversationHistory.length > 0) {
      console.log(`[Chatbot][${requestId}] First message: "${conversationHistory[0].substring(0, 30)}..."`);
      console.log(`[Chatbot][${requestId}] Last message: "${conversationHistory[conversationHistory.length-1].substring(0, 30)}..."`);
    }
    
    console.log(`[Chatbot][${requestId}] Calling Claude API with query:`, message.substring(0, 50) + '...');
    
    // Call Claude's API to get an AI-generated response
    const aiResponse = await claudeGenerate(message, conversationHistory);
    
    // Return the AI-generated response
    if (aiResponse) {
      console.log(`[Chatbot][${requestId}] Claude AI responded successfully with ${aiResponse.length} characters`);
      console.log(`[Chatbot][${requestId}] First 50 chars of response: "${aiResponse.substring(0, 50)}..."`);
      return aiResponse;
    } else {
      console.log(`[Chatbot][${requestId}] Claude returned empty or null response`);
      return "I'm having trouble generating a response at the moment. Please try asking your question again.";
    }
  } catch (error) {
    console.error('[Chatbot] Error using Claude AI, details:', error);
    // No fallback to pattern matching, just return a friendly error message
    return "I apologize, but I'm experiencing a technical issue right now. Please try again in a moment.";
  }
}

// Chatbot configuration type
export interface ChatbotConfig {
  basePath: string;
  storage: IChatStorage;
  welcomeMessage?: string;
}

// Register chatbot routes
export function registerChatbotRoutes(
  app: Express,
  config: ChatbotConfig
) {
  const { basePath, storage, welcomeMessage = "Hello! I'm your Deal Assistant. How can I help you today?" } = config;
  
  // Start a new chat conversation
  app.post(`${basePath}/chat/start`, async (req: Request, res: Response) => {
    try {
      const conversationId = uuidv4();
      console.log(`[Chatbot] Starting new conversation: ${conversationId}`);
      
      // Create welcome message from bot
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
        error: 'Failed to start chat conversation'
      });
    }
  });
  
  // Send a message in a chat conversation
  app.post(`${basePath}/chat/message`, async (req: Request, res: Response) => {
    try {
      const { conversationId, text } = req.body;
      
      if (!conversationId || !text) {
        return res.status(400).json({
          success: false,
          error: 'Missing conversationId or text'
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
      
      // Add conversation ID to text for context tracking
      const textWithContext = `${text} conversation-id:${conversationId}`;
      
      // Get AI response
      const aiResponseText = await generateAIResponse(textWithContext, storage);
      
      // Create bot message
      const botMessage: ChatMessage = {
        id: uuidv4(),
        conversationId,
        text: aiResponseText,
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
  
  // Get all messages in a conversation
  app.get(`${basePath}/chat/:conversationId`, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'Missing conversationId'
        });
      }
      
      const messages = await storage.getMessagesByConversationId(conversationId);
      
      res.status(200).json({
        success: true,
        conversationId,
        messages
      });
      
    } catch (error) {
      console.error('Error retrieving chat history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve chat history'
      });
    }
  });
  
  // Get suggested questions for the chatbot
  app.get(`${basePath}/chat/suggested-questions`, async (req: Request, res: Response) => {
    try {
      // Return a simplified set of suggested questions instead of using pattern matching
      const suggestedQuestions = [
        "What are the main stages in the deal process?",
        "How do I submit a new deal for approval?",
        "What incentive programs are available?",
        "Who needs to approve my deal?",
        "What documentation is required for deal submission?"
      ];
      
      res.status(200).json({
        success: true,
        suggestedQuestions
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