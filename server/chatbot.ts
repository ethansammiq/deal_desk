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

// Simple AI response generator
async function generateAIResponse(message: string, storage: IChatStorage): Promise<string> {
  // In a real implementation, this would call OpenAI API
  // For now, we'll do a simple keyword matching response
  
  const kb = await storage.getAllKnowledgeBase();
  const lowerText = message.toLowerCase();
  
  // Check against knowledge base for matching keywords
  for (const entry of kb) {
    const keywords = entry.question.toLowerCase().split(' ');
    if (keywords.some(keyword => lowerText.includes(keyword) && keyword.length > 3)) {
      return entry.answer;
    }
  }
  
  // Default responses based on keywords
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
  }
  
  // Generic fallback
  return 'Thanks for your question. For specific details about this topic, I recommend checking our documentation in the Guides section or reaching out to your deal desk manager.';
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