import Anthropic from '@anthropic-ai/sdk';
import { generateContextPrompt } from './knowledge-service';

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
    console.log("\n\n=======================================");
    console.log(`[Claude API] NEW QUERY: "${userQuery}"`);
    console.log("=======================================\n");
    
    // Prepare messages for conversation history with proper typing
    type MessageRole = "user" | "assistant";
    type Message = { role: MessageRole, content: string };
    
    const messages: Message[] = [];
    
    // Add conversation history if available (limited to last few messages to save tokens)
    const recentHistory = conversationHistory.slice(-6); // Keep last 6 messages maximum
    
    console.log(`[Claude API] Processing conversation history (${recentHistory.length} messages)`);
    
    // Only use conversation history if it contains at least 2 messages (user and response)
    if (recentHistory.length >= 2) {
      console.log(`[Claude API] Adding conversation history to context`);
      
      // We need to type 'role' properly as 'user' | 'assistant' for the Anthropic API
      let userTurn = true; // Start with user message
      for (const message of recentHistory) {
        // Skip messages that contain conversation-id markers or query ID markers
        if (message.includes('conversation-id:') || message.includes('[QueryID:')) {
          console.log(`[Claude API] Skipping message with metadata marker`);
          continue;
        }
        
        // Alternate between user and assistant roles
        messages.push({ 
          role: userTurn ? "user" : "assistant", 
          content: message 
        });
        
        console.log(`[Claude API] Added ${userTurn ? "user" : "assistant"} message: ${message.substring(0, 30)}...`);
        
        userTurn = !userTurn; // Toggle for next message
      }
    } else {
      console.log(`[Claude API] No conversation history used (insufficient messages)`);
    }
    
    // Generate a unique query ID for this specific request
    // This helps ensure varied responses even for identical questions
    const uniqueQueryId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Add the current user query with a hidden unique identifier
    // The unique ID is invisible to the user but makes each query technically unique to Claude
    messages.push({ 
      role: "user", 
      content: `${userQuery} [QueryID:${uniqueQueryId}]` 
    });

    console.log("[Claude API] Processing request with unique query ID:", uniqueQueryId);
    console.log("[Claude API] Messages array length:", messages.length);
    
    // Generate a dynamic system prompt based on the user's query
    const contextPrompt = generateContextPrompt(userQuery);
    console.log(`[Claude API] Using dynamic context prompt with length: ${contextPrompt.length}`);
    
    // Log the first 300 characters of the context prompt for debugging
    console.log(`[Claude API] Start of context prompt: ${contextPrompt.substring(0, 300)}...`);
    
    // Check if the query is about steps specifically
    if (userQuery.toLowerCase().includes('step') || userQuery.toLowerCase().includes('stage')) {
      console.log('[Claude API] Step/stage related question detected - providing dynamic response');
    }

    // Call Anthropic API with dynamic context system parameter
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', 
      max_tokens: 1024,
      system: contextPrompt,
      messages: messages,
      // Use moderate temperature for more varied responses
      temperature: 0.5
      // Removed metadata as it's causing API errors
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