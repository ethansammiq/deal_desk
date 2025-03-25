import * as fs from 'fs';
import * as path from 'path';

// Define the knowledge base types for better TypeScript support
interface DealStage {
  name: string;
  description: string;
  details: string;
  [key: string]: any; // Allow for flexible additional properties
}

interface IncentiveType {
  name: string;
  description: string;
  varieties: string[];
  eligibility: string;
  approvalProcess: string;
}

interface DealStructure {
  name: string;
  description: string;
  bestFor: string;
  example: string;
  benefits: string[];
  considerations: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface KnowledgeBase {
  dealProcess: {
    overview: string;
    stages: DealStage[];
  };
  incentivePrograms: {
    overview: string;
    types: IncentiveType[];
    dealStructures: DealStructure[];
    approvalMatrix: any;
  };
  documentationRequirements: any;
  specialProcesses: any;
  faqs: FAQ[];
}

// Cache the knowledge base to avoid repeated file reads
let knowledgeBaseCache: KnowledgeBase | null = null;

/**
 * Loads the knowledge base from the JSON file
 */
export function loadKnowledgeBase(): KnowledgeBase {
  if (knowledgeBaseCache) {
    return knowledgeBaseCache;
  }

  try {
    const filePath = path.join(__dirname, '../shared/knowledge-base.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    knowledgeBaseCache = JSON.parse(fileContent) as KnowledgeBase;
    return knowledgeBaseCache;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    // Return an empty knowledge base structure as fallback
    return {
      dealProcess: { overview: '', stages: [] },
      incentivePrograms: { overview: '', types: [], dealStructures: [], approvalMatrix: { levels: [] } },
      documentationRequirements: { overview: '', requiredDocuments: [], bestPractices: [] },
      specialProcesses: { urgentDeals: {}, dealModifications: {} },
      faqs: []
    };
  }
}

/**
 * Gets information about a specific deal stage
 */
export function getDealStage(stageName: string): DealStage | null {
  const kb = loadKnowledgeBase();
  const stage = kb.dealProcess.stages.find(
    s => s.name.toLowerCase() === stageName.toLowerCase()
  );
  return stage || null;
}

/**
 * Gets information about all deal stages
 */
export function getAllDealStages(): DealStage[] {
  const kb = loadKnowledgeBase();
  return kb.dealProcess.stages;
}

/**
 * Gets information about incentive types
 */
export function getIncentiveTypes(): IncentiveType[] {
  const kb = loadKnowledgeBase();
  return kb.incentivePrograms.types;
}

/**
 * Gets information about deal structures
 */
export function getDealStructures(): DealStructure[] {
  const kb = loadKnowledgeBase();
  return kb.incentivePrograms.dealStructures;
}

/**
 * Gets FAQs that match a search term
 */
export function searchFAQs(searchTerm: string): FAQ[] {
  const kb = loadKnowledgeBase();
  if (!searchTerm) return kb.faqs;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return kb.faqs.filter(faq => 
    faq.question.toLowerCase().includes(lowerSearchTerm) || 
    faq.answer.toLowerCase().includes(lowerSearchTerm)
  );
}

/**
 * Creates a context-specific system prompt for Claude based on the query topic
 */
export function generateContextPrompt(query: string): string {
  console.log(`[Knowledge Service] Generating context prompt for query: "${query}"`);
  const kb = loadKnowledgeBase();
  const lowerQuery = query.toLowerCase();
  
  // Build a base system prompt
  let contextPrompt = `You are DealGenie, a helpful AI assistant for commercial deal desk operations.
You help users understand deal submission processes, approval workflows, and financial incentive structures.
You provide concise, accurate, and helpful answers to questions about deals, incentives, and the deal desk process.

Be conversational but direct in your answers. If you don't know something, say so instead of making up information.
Format your responses with clear sections and bullet points when appropriate.

IMPORTANT: Customize your answer to the exact question being asked. If asked "How many steps are in the deal process?", answer with the specific number first, then elaborate.
If asked "What are the steps in the deal process?", list all the steps first, then provide details about each.`;

  // Add deal process information if the query is about deal steps or stages
  if (lowerQuery.includes('step') || lowerQuery.includes('stage') || 
      lowerQuery.includes('process') || lowerQuery.includes('workflow')) {
    
    contextPrompt += `\n\nHere are key facts about the deal process:\n`;
    contextPrompt += `The deal process has ${kb.dealProcess.stages.length} steps: ${kb.dealProcess.stages.map(s => s.name).join(', ')}.\n`;
    
    // Add details about specific stages if they are mentioned
    for (const stage of kb.dealProcess.stages) {
      if (lowerQuery.includes(stage.name.toLowerCase())) {
        contextPrompt += `\nDetailed information about the ${stage.name} stage:\n`;
        contextPrompt += `- Description: ${stage.description}\n`;
        contextPrompt += `- ${stage.details}\n`;
        
        // Add stage-specific details when available
        for (const [key, value] of Object.entries(stage)) {
          if (['name', 'description', 'details'].includes(key)) continue;
          
          if (Array.isArray(value)) {
            contextPrompt += `- ${key}: ${value.join(', ')}\n`;
          } else if (typeof value === 'string') {
            contextPrompt += `- ${key}: ${value}\n`;
          }
        }
      }
    }
  }

  // Add incentive information if the query is about incentives
  if (lowerQuery.includes('incentive') || lowerQuery.includes('discount') ||
      lowerQuery.includes('rebate') || lowerQuery.includes('bonus')) {
    
    contextPrompt += `\n\nAbout incentive structures:\n`;
    
    // Add information about incentive types
    kb.incentivePrograms.types.forEach(type => {
      contextPrompt += `- ${type.name}: ${type.description}. ${type.eligibility}\n`;
    });
    
    // Add information about deal structures if relevant
    if (lowerQuery.includes('tier') || lowerQuery.includes('structure') || 
        lowerQuery.includes('flat') || lowerQuery.includes('commit')) {
      
      contextPrompt += `\nDeal structures available:\n`;
      kb.incentivePrograms.dealStructures.forEach(structure => {
        contextPrompt += `- ${structure.name}: ${structure.description}. Best for ${structure.bestFor}.\n`;
      });
    }
  }

  // Add documentation requirements if the query is about documentation
  if (lowerQuery.includes('document') || lowerQuery.includes('file') || 
      lowerQuery.includes('form') || lowerQuery.includes('requirement')) {
    
    contextPrompt += `\n\nRequired documentation includes:\n`;
    kb.documentationRequirements.requiredDocuments.forEach((doc: any) => {
      contextPrompt += `- ${doc.name}: ${doc.purpose}. ${doc.required === true ? 'Always required.' : doc.required}\n`;
    });
  }

  // Add urgent process information if the query is about urgent deals
  if (lowerQuery.includes('urgent') || lowerQuery.includes('expedite') || 
      lowerQuery.includes('rush') || lowerQuery.includes('emergency')) {
    
    const urgentInfo = kb.specialProcesses.urgentDeals;
    contextPrompt += `\n\nUrgent deal process:\n`;
    contextPrompt += `- Definition: ${urgentInfo.definition}\n`;
    contextPrompt += `- Process steps: ${urgentInfo.process.join(', ')}\n`;
    contextPrompt += `- Timeline: ${urgentInfo.timeline}\n`;
    contextPrompt += `- Valid reasons: ${urgentInfo.validReasons.join(', ')}\n`;
  }

  return contextPrompt;
}

/**
 * Finds the FAQ that best matches the query
 */
export function findMatchingFAQ(query: string): FAQ | null {
  const kb = loadKnowledgeBase();
  const lowerQuery = query.toLowerCase().trim();
  
  console.log(`[Knowledge Service] Finding matching FAQ for query: "${lowerQuery}"`);
  
  // Special case for "how many steps" questions since they're common
  if (lowerQuery.includes("how many") && 
     (lowerQuery.includes("steps") || lowerQuery.includes("stages")) &&
     (lowerQuery.includes("deal") || lowerQuery.includes("process"))) {
    console.log('[Knowledge Service] Detected steps count question, special handling');
    
    // Find the FAQ about deal process steps
    const stepsCountFAQ = kb.faqs.find(faq => 
      faq.question.toLowerCase().includes("how many steps") && 
      faq.question.toLowerCase().includes("deal process")
    );
    
    if (stepsCountFAQ) {
      console.log('[Knowledge Service] Found exact steps count FAQ');
      return stepsCountFAQ;
    }
  }
  
  // First try exact matches
  const exactMatch = kb.faqs.find(faq => 
    faq.question.toLowerCase() === lowerQuery
  );
  
  if (exactMatch) {
    console.log('[Knowledge Service] Found exact match for query');
    return exactMatch;
  }
  
  // Then try partial matches
  let bestMatch: FAQ | null = null;
  let highestScore = 0;
  
  for (const faq of kb.faqs) {
    let score = 0;
    const questionWords = faq.question.toLowerCase().split(/\s+/);
    
    // Check for significant keyword matches like "process", "steps", "approve", etc.
    const significantKeywords = ['process', 'steps', 'stages', 'approval', 'submit', 'incentive', 
                                'review', 'contract', 'negotiate', 'implement'];
    
    let hasSignificantMatch = false;
    
    for (const word of questionWords) {
      if (word.length > 3 && lowerQuery.includes(word)) {
        score += 1;
        
        // Significant keywords get extra score
        if (significantKeywords.includes(word)) {
          score += 2;
          hasSignificantMatch = true;
        }
      }
    }
    
    // Boost score if the query and FAQ have similar lengths (likely more related)
    const lengthDifference = Math.abs(lowerQuery.length - faq.question.toLowerCase().length);
    if (lengthDifference < 10) {
      score += 1;
    }
    
    // Exact phrase matches get a big boost
    const phrases = extractPhrases(faq.question.toLowerCase());
    for (const phrase of phrases) {
      if (phrase.length > 5 && lowerQuery.includes(phrase)) {
        score += 3;
        console.log(`[Knowledge Service] Found phrase match: "${phrase}"`);
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = faq;
    }
  }
  
  // Only return matches with a minimum score
  const matchQuality = highestScore >= 5 ? "excellent" : highestScore >= 3 ? "good" : "minimal";
  console.log(`[Knowledge Service] Best match found with score ${highestScore} (${matchQuality} match)`);
  
  return highestScore >= 3 ? bestMatch : null;
}

/**
 * Helper function to extract phrases from text
 */
function extractPhrases(text: string): string[] {
  // Split by common separators and extract 2-3 word phrases
  const words = text.split(/\s+/);
  const phrases: string[] = [];
  
  // Add 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i+1]}`);
  }
  
  // Add 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
  }
  
  return phrases;
}