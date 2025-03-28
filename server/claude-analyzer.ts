import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generates a response using Anthropic Claude specifically for structured analysis
 * @param {string} userQuery The user's question or message
 * @param {string} systemPrompt System prompt to guide the AI's response
 * @returns {Promise<string>} The AI-generated response
 */
export async function generateStructuredResponse(
  userQuery: string,
  systemPrompt: string
): Promise<{ content: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userQuery
        }
      ],
      temperature: 0.2
    });
    
    if (response.content[0].type === 'text') {
      return { content: (response.content[0] as any).text };
    }
    
    throw new Error('Unexpected response format from Claude API');
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Analyze a deal using Claude AI
 * @param dealData Object containing deal information
 * @returns Promise<object> Analysis results
 */
export async function analyzeDeal(dealData: any): Promise<any> {
  const systemPrompt = `You are an AI-powered Deal Analyzer for a commercial deals platform. 
  Evaluate the deal data provided and give concise, precise insights on revenue growth, 
  margin improvement, profitability, and overall value. Format your response as JSON 
  with the following structure:
  {
    "revenueGrowth": {
      "score": number (1-10),
      "analysis": "brief analysis"
    },
    "marginImprovement": {
      "score": number (1-10),
      "analysis": "brief analysis"
    },
    "profitabilityImpact": {
      "score": number (1-10),
      "analysis": "brief analysis"
    },
    "overallValue": {
      "score": number (1-10),
      "analysis": "brief analysis",
      "recommendation": "approve" | "review" | "reject"
    },
    "summary": "1-2 sentence overall deal summary"
  }
  
  Your response should be valid JSON without any additional text. Do not include markdown formatting or explanations outside the JSON structure.`;

  const query = `Analyze this commercial deal data: ${JSON.stringify(dealData)}`;

  try {
    const { content } = await generateStructuredResponse(query, systemPrompt);
    
    // Parse the JSON response
    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing deal with Claude:', error);
    
    // Return a fallback analysis if the API call fails
    return {
      revenueGrowth: { score: 5, analysis: "Could not analyze revenue growth." },
      marginImprovement: { score: 5, analysis: "Could not analyze margin improvement." },
      profitabilityImpact: { score: 5, analysis: "Could not analyze profitability impact." },
      overallValue: { 
        score: 5, 
        analysis: "Could not perform overall analysis.", 
        recommendation: "review" 
      },
      summary: "Analysis unavailable. Please review the deal manually."
    };
  }
}

/**
 * Get deal recommendations based on similar historical deals
 * @param dealData Object containing current deal information
 * @returns Promise<object> Recommendations and similar deals
 */
export async function getDealRecommendations(dealData: any): Promise<any> {
  const systemPrompt = `You are an AI-powered Deal Recommendation Engine. Based on the 
  deal data provided, suggest optimizations and incentives that might improve the deal. 
  Include hypothetical similar past deals that were successful. Format your response as JSON 
  with the following structure:
  {
    "optimizations": [
      {"area": "string", "suggestion": "string", "impact": "string"}
    ],
    "recommendedIncentives": [
      {"name": "string", "reason": "string"}
    ],
    "similarDeals": [
      {"name": "string", "outcome": "string", "keyLearning": "string"}
    ]
  }
  
  Your response should be valid JSON without any additional text. Do not include markdown formatting or explanations outside the JSON structure.`;

  const query = `Provide recommendations for this deal: ${JSON.stringify(dealData)}`;

  try {
    const { content } = await generateStructuredResponse(query, systemPrompt);
    
    // Parse the JSON response
    return JSON.parse(content);
  } catch (error) {
    console.error('Error getting recommendations with Claude:', error);
    
    // Return a fallback recommendation if the API call fails
    return {
      optimizations: [
        { area: "General", suggestion: "Recommendations unavailable", impact: "N/A" }
      ],
      recommendedIncentives: [],
      similarDeals: []
    };
  }
}

/**
 * Perform market analysis for a particular deal
 * @param dealData Object containing deal information
 * @returns Promise<object> Market analysis results
 */
export async function getMarketAnalysis(dealData: any): Promise<any> {
  const systemPrompt = `You are an AI-powered Market Analyst. Based on the deal data provided, 
  provide current market analysis that might impact this deal. Format your response as JSON 
  with the following structure:
  {
    "marketTrends": [
      {"trend": "string", "impact": "string", "recommendation": "string"}
    ],
    "competitiveAnalysis": {
      "summary": "string",
      "keyCompetitors": [
        {"name": "string", "strategy": "string"}
      ]
    },
    "risks": [
      {"type": "string", "description": "string", "mitigationStrategy": "string"}
    ]
  }
  
  Your response should be valid JSON without any additional text. Do not include markdown formatting or explanations outside the JSON structure.`;

  const query = `Provide market analysis for this deal: ${JSON.stringify(dealData)}`;

  try {
    const { content } = await generateStructuredResponse(query, systemPrompt);
    
    // Parse the JSON response
    return JSON.parse(content);
  } catch (error) {
    console.error('Error getting market analysis with Claude:', error);
    
    // Return a fallback analysis if the API call fails
    return {
      marketTrends: [
        { trend: "General", impact: "Market analysis unavailable", recommendation: "N/A" }
      ],
      competitiveAnalysis: {
        summary: "Competitive analysis unavailable",
        keyCompetitors: []
      },
      risks: []
    };
  }
}