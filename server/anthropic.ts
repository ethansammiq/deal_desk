import Anthropic from '@anthropic-ai/sdk';
import { generateContextPrompt, findMatchingFAQ } from './knowledge-service';

// Initialize the Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generates a response using Anthropic Claude
 * @param {string} userQuery The user's question or message
 * @param {string[]} conversationHistory Optional array of previous messages to provide context
 * @returns {Promise<string>} The AI-generated response
 */
export async function generateAIResponse(userQuery: string, conversationHistory: string[] = []): Promise<string> {
  try {
    // Prepare messages for conversation history with proper typing
    type MessageRole = "user" | "assistant";
    type Message = { role: MessageRole, content: string };
    
    const messages: Message[] = [];
    
    // Add conversation history if available (limited to last few messages to save tokens)
    const recentHistory = conversationHistory.slice(-6); // Keep last 6 messages maximum
    
    // We need to type 'role' properly as 'user' | 'assistant' for the Anthropic API
    for (let i = 0; i < recentHistory.length; i += 2) {
      const userMessage = recentHistory[i];
      const assistantMessage = recentHistory[i + 1];
      
      if (userMessage) {
        messages.push({ role: "user", content: userMessage });
      }
      
      if (assistantMessage) {
        messages.push({ role: "assistant", content: assistantMessage });
      }
    }
    
    // Add the current user query
    messages.push({ role: "user", content: userQuery });

    console.log("[Claude API] Sending request to Claude with message:", userQuery.substring(0, 50) + "...");
    console.log("[Claude API] Messages array length:", messages.length);
    
    // First check if this is an exact FAQ match
    const exactFaqMatch = findMatchingFAQ(userQuery);
    if (exactFaqMatch) {
      console.log('[Claude API] Found exact FAQ match, returning direct answer');
      return exactFaqMatch.answer;
    }
    
    // Generate a dynamic system prompt based on the user's query
    const contextPrompt = generateContextPrompt(userQuery);
    console.log(`[Claude API] Using dynamic context prompt with length: ${contextPrompt.length}`);

    // Call Anthropic API with dynamic context system parameter
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', 
      max_tokens: 1024,
      system: contextPrompt,
      messages: messages,
      // Use slight temperature increase for more natural responses
      temperature: 0.3,
    });
    
    console.log("[Claude API] Received response from Claude");

    // Return the generated response
    if (response.content[0].type === 'text') {
      return (response.content[0] as any).text;
    }
    return 'I encountered an issue processing your request.';
    
  } catch (err) {
    const error = err as Error; // Type assertion
    console.error('Error generating AI response:', error);
    
    // More detailed error logging
    console.error('[Claude API] Error details:', {
      message: error.message || 'Unknown error',
      name: error.name || 'UnknownError',
      stack: error.stack ? error.stack.substring(0, 200) : 'No stack trace' // First part of stack trace
    });
    
    // Check for API key issues
    if (error.message && error.message.includes('API key')) {
      console.error('[Claude API] Possible API key issue');
    }
    
    // Check for rate limiting
    if (error.message && error.message.includes('rate')) {
      console.error('[Claude API] Possible rate limiting issue');
    }
    
    return "I'm sorry, I encountered an error processing your request. Please try again later.";
  }
}