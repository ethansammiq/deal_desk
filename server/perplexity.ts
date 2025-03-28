import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Generates a response using Perplexity AI
 * @param {string} userQuery The user's question or message
 * @param {string} systemPrompt Optional system prompt to guide the AI's response
 * @returns {Promise<string>} The AI-generated response
 */
export async function generatePerplexityResponse(
  userQuery: string,
  systemPrompt: string = "Be precise and concise."
): Promise<{ content: string; citations?: string[] }> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userQuery
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        stream: false,
        frequency_penalty: 1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
      citations?: string[];
    };
    
    // Extract content and citations from the response
    const content = data.choices[0].message.content;
    const citations = data.citations || [];

    return { 
      content, 
      citations 
    };
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
}

/**
 * Analyze a deal using Perplexity AI
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
  }`;

  const query = `Analyze this commercial deal data: ${JSON.stringify(dealData)}`;

  try {
    const { content } = await generatePerplexityResponse(query, systemPrompt);
    
    // Parse the JSON response
    return JSON.parse(content);
  } catch (error) {
    console.error('Error analyzing deal with Perplexity:', error);
    
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
  }`;

  const query = `Provide recommendations for this deal: ${JSON.stringify(dealData)}`;

  try {
    const { content } = await generatePerplexityResponse(query, systemPrompt);
    
    // Parse the JSON response
    return JSON.parse(content);
  } catch (error) {
    console.error('Error getting recommendations with Perplexity:', error);
    
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
  }`;

  const query = `Provide market analysis for this deal: ${JSON.stringify(dealData)}`;

  try {
    const { content } = await generatePerplexityResponse(query, systemPrompt);
    
    // Parse the JSON response
    return JSON.parse(content);
  } catch (error) {
    console.error('Error getting market analysis with Perplexity:', error);
    
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