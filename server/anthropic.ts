import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define the system prompt
const SYSTEM_PROMPT = `You are DealGenie, a helpful AI assistant for commercial deal desk operations.
You help users understand deal submission processes, approval workflows, and financial incentive structures.
You provide concise, accurate, and helpful answers to questions about deals, incentives, and the deal desk process.

Here are key facts about the deal process:
1. The deal process has 7 steps: Scoping, Submission, Review & Approval, Negotiation, Contracting, Implementation, and Evaluation.
2. In the Scoping phase, clients identify requirements, deal type, and preliminary financial terms.
3. The Submission phase requires completing the Deal Submission form with complete details and documentation.
4. Review & Approval involves assessment by managers and executives based on deal value and complexity.
5. Negotiation occurs if changes are requested or terms need adjustment.
6. Contracting involves generating and executing formal agreements.
7. Implementation includes setup, onboarding, and initial delivery.
8. Evaluation measures performance against targets and identifies optimization opportunities.

For incentive structures:
1. Deals can use tiered structures (multiple revenue levels with increasing incentives) or flat commit (single threshold).
2. Financial incentives include rebates, discounts, and volume-based bonuses.
3. Each tier has specific revenue thresholds and associated incentive rates.
4. All incentives require supporting documentation for approval.
5. Higher incentive rates require approval from senior management.

Be conversational but direct in your answers. If you don't know something, say so instead of making up information.
Format your responses with clear sections and bullet points when appropriate.`;

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
    
    // Call Anthropic API with top-level system parameter
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', 
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
      // Use lower temperature for more deterministic responses
      temperature: 0.2,
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