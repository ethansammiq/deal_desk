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
  private knowledgeBase: Array<KnowledgeBaseEntry> = [
    {
      question: "What are the incentive thresholds?",
      answer: "Deal incentives are calculated based on total deal value, contract length, and growth metrics. Standard deals have a 2% incentive, while strategic deals can qualify for up to 5% incentives with proper approval.",
      variants: [
        "How are incentives calculated?",
        "What incentive percentage can I get?",
        "Tell me about incentive thresholds",
        "Explain incentive calculations",
        "What's the standard incentive rate?",
        "Maximum incentive percentage?",
        "How do deal incentives work?",
        "What factors affect incentives?",
        "When do I qualify for higher incentives?"
      ]
    },
    {
      question: "What are the approval requirements?",
      answer: "Discount approval follows a tiered process: up to 10% can be approved by team leads, 10-20% by managers, and anything over 20% requires director approval. All discounts must be documented with business justification.",
      variants: [
        "Who needs to approve my deal?",
        "What's the approval process?",
        "How do I get deal approval?",
        "Approval hierarchy for deals",
        "Discount approval process",
        "Which discounts need director approval?",
        "Deal approval workflow",
        "Approval matrix explained",
        "Documentation needed for approval"
      ]
    },
    {
      question: "How do I submit a new deal?",
      answer: "To submit a new deal, navigate to the \"Submit Deal\" page from the main menu. Fill out all required fields, attach any necessary documentation, and then click \"Submit for Review\". You'll receive a confirmation email with the deal reference number.",
      variants: [
        "Deal submission process",
        "Steps to submit a deal",
        "Where do I create a new deal?",
        "What's the deal submission workflow?",
        "How to create deals in the system",
        "New deal creation steps",
        "Required fields for deal submission",
        "Documentation needed for new deals",
        "Deal submission confirmation process"
      ]
    },
    {
      question: "How are urgent deals handled?",
      answer: "For urgent deals, mark \"High Priority\" in the submission form and add [URGENT] to the beginning of the deal name. Also, reach out directly to your regional deal desk manager to notify them of the urgent request.",
      variants: [
        "Fast-tracking urgent deals",
        "Emergency deal process",
        "Expedited deal approval",
        "Rush deal submission process",
        "How to mark a deal as urgent",
        "Priority deals handling",
        "Escalating time-sensitive deals",
        "Quick approval for urgent deals",
        "Who to contact for urgent deals"
      ]
    },
    {
      question: "What growth opportunities qualify for incentives?",
      answer: "Growth opportunities that qualify for incentives include: expanding to new markets, increasing contract value by at least 20%, extending contract terms beyond 24 months, or adding new product lines to existing contracts.",
      variants: [
        "Which growth metrics earn incentives?",
        "Qualifying for growth incentives",
        "Contract value increase incentives",
        "New market expansion benefits",
        "Extended contract term incentives",
        "When do I qualify for growth incentives?",
        "Types of growth that earn bonuses",
        "Incentive-eligible growth metrics",
        "Revenue growth incentive qualification"
      ]
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

  async getAllKnowledgeBase(): Promise<Array<KnowledgeBaseEntry>> {
    return this.knowledgeBase;
  }
}

// Function to handle specific question patterns with direct answers
function getDirectResponse(text: string): string | null {
  console.log("[Chatbot] Inside getDirectResponse with text:", text);
  
  // Check for questions about deal process steps count - broader match
  if (/(how many|number of|total).+?(steps|stages).+?(deal|process|commercial)/.test(text) || 
      /(deal|process).+?(how many|number of|total).+?(steps|stages)/.test(text) ||
      /(steps|stages).+?(in|of).+?(deal|process)/.test(text) ||
      /(deal process|commercial process).+?(have|consist of|include)/.test(text) ||
      text.includes("how many steps does the deal process have")) {
    console.log("[Chatbot] Matched steps pattern!");
    return "The commercial deal process has 7 steps: Scoping, Submission, Review & Approval, Negotiation, Contracting, Implementation, and Evaluation.";
  }
  
  // Check for timeframe questions about deal review
  if (/(how long|timeframe|how many days|duration|time)/.test(text) && 
      /(review|approval|process take)/.test(text)) {
    return "Standard deals typically take 2-3 business days for review and approval. Non-standard deals may take 3-5 business days. Complex deals with technical requirements might need additional time for product team assessment.";
  }
  
  // Check for questions about document requirements
  if (/(what|which) (documents|documentation|files|paperwork)/.test(text) && 
      /(need|required|submit|provide)/.test(text)) {
    return "Required documentation includes: Deal Submission Form, Customer Requirements Document, Statement of Work (for service components), and Business Justification (for non-standard terms or pricing).";
  }
  
  // Check for questions about approval levels
  if (/(who|approval level|approver|sign off|authorization)/.test(text) && 
      /(approves|approve|approval)/.test(text)) {
    return "Approval levels depend on deal value and complexity. Managers can approve standard deals up to $50K, Directors for deals up to $250K, VPs for deals up to $1M, and SVP/C-Level executives for deals over $1M. Non-standard terms generally require higher-level approval.";
  }
  
  // Check for questions about incentive types
  if (/(what types of|what kind of|what|main|different) (incentives|rewards|bonuses)/.test(text)) {
    return "We offer three main incentive categories: 1) Financial Incentives (Added Value Media, Revenue Share), 2) Product Incentives (Feature Access, Integration Services), and 3) Resource Incentives (Technical Resources, Training). Each has specific eligibility criteria and approval processes.";
  }
  
  // Check for threshold/eligibility questions
  if (/(what|minimum|threshold|eligibility|qualify|requirement).{1,30}(incentive|deal|revenue|value)/.test(text)) {
    return "Deal eligibility is based on several factors: 1) Annual commitment of at least $50K, 2) Minimum contract term of 12 months, 3) Strategic alignment with company priorities, and 4) Technical compatibility with our platform requirements.";
  }
  
  // Check for deal structure questions
  if (/(what|difference|explain|compare).{1,30}(tiered|flat commit|structure)/.test(text)) {
    return "We offer two deal structures: 1) Tiered Commit - multiple spending thresholds with increasing incentives at each level, and 2) Flat Commit - a single spending threshold with a fixed incentive rate. Tiered is best for growing accounts, while Flat Commit provides predictability.";
  }
  
  // Check for urgent deal questions
  if (/(urgent|expedite|rush|emergency|fast(-| )track|priority|quick) .{1,30}(deal|approval)/.test(text)) {
    return "For urgent deals, follow these steps: 1) Mark as 'Urgent' in the submission form, 2) Add business justification explaining the urgency, 3) Notify your manager, and 4) Email deal-desk@example.com with the reference number. Urgent deals are typically reviewed within 24 hours.";
  }
  
  // Check for deal rejection questions
  if (/(why|reason|reject|decline|denied|not approved).{1,30}(deal|submission)/.test(text)) {
    return "Common reasons for deal rejection include: 1) Insufficient margin (below 15%), 2) Non-standard terms without proper justification, 3) Missing required documentation, 4) Incentives exceeding approval thresholds, and 5) Insufficient customer information or incomplete form submission.";
  }
  
  // Check for questions about deal modifications
  if (/(how|can I|update|modify|change|edit).{1,30}(submitted|existing) deal/.test(text)) {
    return "To modify a submitted deal: 1) Go to the Deal Dashboard, 2) Find your deal and click 'Request Modification', 3) Complete the modification form with changes and justification, 4) Submit for review. Note that significant changes may require a new approval process.";
  }
  
  // No direct pattern match
  return null;
}

// Enhanced AI response generator
async function generateAIResponse(message: string, storage: IChatStorage): Promise<string> {
  // In a real implementation, this would call OpenAI API
  // For now, we'll do a sophisticated keyword matching response with our comprehensive knowledge base
  
  const lowerText = message.toLowerCase().trim();
  
  // Check for specific question patterns that need direct answers
  console.log("[Chatbot] Processing question: ", lowerText);
  const directResponse = getDirectResponse(lowerText);
  console.log("[Chatbot] Direct response match: ", directResponse ? "YES" : "NO");
  if (directResponse) {
    return directResponse;
  }
  
  const kb = await storage.getAllKnowledgeBase();
  
  // Import the keywords mapping from frontend to avoid duplication
  // This directly references client-side knowledge base since we're sharing logic
  const keywordMappingImport = {
    // Deal Process Overview
    dealProcess: ['process', 'workflow', 'lifecycle', 'steps', 'stages', 'how deal works', 'deal flow', 'deal stages', 
                 'deal lifecycle', 'deal process', 'how deals work', 'process overview', 'deal steps'],
    
    // Deal Stages
    dealScoping: ['scoping', 'scope', 'initial stage', 'first step', 'begin deal', 'start deal', 
                 'what is scoping', 'deal scoping', 'scoping stage', 'scoping process', 'customer needs',
                 'how to scope', 'scoping requirements', 'define deal', 'discovery phase'],
                 
    dealSubmission: ['submit', 'submission', 'new deal', 'create deal', 'start deal', 'enter deal', 'deal form',
                    'how to submit', 'submission process', 'deal details', 'required fields', 'submit a deal',
                    'deal creation', 'submitting', 'deal submission'],
                   
    reviewAndApproval: ['review', 'approval', 'approve', 'evaluate', 'assessment', 'appraise',
                       'review process', 'approval process', 'deal desk review', 'stakeholder approval',
                       'how deals are reviewed', 'deal approval', 'how is a deal reviewed', 'review timeline',
                       'approval framework', 'approval matrix', 'who approves', 'approval hierarchy',
                       'sign off', 'approvers', 'approval structure', 'approval levels', 'approval factors',
                       'approval requirements', 'deal approval levels', 'who needs to approve', 
                       'review and approval', 'deal review', 'review & approval'],
                       
    negotiationProcess: ['negotiation', 'negotiate', 'terms', 'agreement', 'finalize deal',
                        'negotiation process', 'contract review', 'legal review', 'term sheet',
                        'how to negotiate', 'finalizing terms', 'negotiating'],
                        
    contractingProcess: ['contracting', 'contract', 'legal document', 'agreement', 'paperwork',
                        'contract process', 'signing', 'execution', 'legal agreement', 'MSA',
                        'statement of work', 'SOW', 'how contracts work', 'deal contract', 'signing process'],
                        
    implementationProcess: ['implementation', 'deliver', 'deployment', 'setup', 'configure', 'go-live',
                           'deployment process', 'delivery', 'project plan', 'project management',
                           'delivery timeline', 'implement', 'solution implementation', 'post-sale'],
                           
    evaluationProcess: ['evaluation', 'assess', 'measure', 'success metrics', 'performance', 'review',
                       'deal performance', 'post-implementation', 'success criteria', 'measure success',
                       'performance tracking', 'metrics', 'KPIs', 'deal success'],
    
    // Incentive Programs
    financialIncentives: ['financial incentive', 'money', 'revenue share', 'monetary', 'commission', 
                         'discount', 'financial bonus', 'added value media', 'monetary benefit',
                         'financial reward', 'volume discount', 'price adjustment'],
                         
    productIncentives: ['product incentive', 'feature', 'platform', 'product bonus', 'feature access', 
                       'early access', 'integration services', 'beta program', 'customization',
                       'product benefit', 'extended API', 'platform customization'],
                       
    resourceIncentives: ['resource incentive', 'training', 'technical resource', 'support', 'assistance', 
                        'help resources', 'technical account manager', 'implementation specialist',
                        'consulting', 'consultative services', 'education', 'dedicated support'],
                        
    generalIncentives: ['incentive', 'bonus', 'threshold', 'rewards', 'perks', 'benefits', 'special offers',
                       'what incentives', 'available incentives', 'incentive types', 'what benefits',
                       'what rewards', 'what bonuses', 'incentive programs', 'incentive categories'],
    
    // Eligibility & Approval
    eligibilityRequirements: ['eligibility', 'qualify', 'eligible', 'who can', 'requirements', 'criteria', 
                             'qualification', 'who qualifies', 'deal size threshold', 'customer tier',
                             'contract length', 'strategic alignment', 'eligibility requirements',
                             'how to qualify', 'who is eligible', 'qualification criteria'],
                             
    approvalProcess: ['approval process', 'how to get approval', 'approval workflow', 'approval steps',
                     'get deal approved', 'approval timeline', 'approval challenges', 'expedited approval',
                     'approval tracking', 'deal approval process', 'approval procedure'],
    
    // Documentation Requirements
    documentationRequirements: ['document', 'paperwork', 'forms', 'required files', 'attachments', 'what to submit', 
                              'required documents', 'what is required', 'documentation needed', 'deal submission form',
                              'customer requirements document', 'business justification', 'statement of work',
                              'supporting documentation', 'deal documents', 'documentation best practices'],
    
    // Other Information
    urgentDeals: ['urgent', 'fast track', 'expedite', 'rush', 'quick', 'emergency', 'immediate', 
                 'asap', 'high priority', 'urgent deal', 'time-sensitive', 'accelerated approval',
                 'priority review', 'urgent request', 'expedited process'],
                 
    growthOpportunities: ['growth', 'opportunity', 'expansion', 'increase', 'growing', 'scale', 'upsell',
                         'new markets', 'contract value increase', 'extending contract', 'term extension',
                         'product expansion', 'strategic alignment', 'growth incentives', 'enhancing incentives']
  };

  // First check for exact matches in the knowledge base including variants
  for (const entry of kb) {
    // Check main question
    const mainKeywords = entry.question.toLowerCase().split(' ');
    
    // Score match for main question
    let mainMatchScore = 0;
    for (const keyword of mainKeywords) {
      if (lowerText.includes(keyword) && keyword.length > 3) {
        mainMatchScore += 1;
      }
    }
    
    // If main question is a strong match, return answer immediately
    if (mainMatchScore >= 2 || (mainKeywords.length === 1 && mainMatchScore === 1)) {
      return entry.answer;
    }
    
    // Check variants if they exist
    if (entry.variants) {
      for (const variant of entry.variants) {
        // For exact variant matches
        if (lowerText === variant.toLowerCase()) {
          return entry.answer;
        }
        
        // For strong partial matches in variants
        const variantKeywords = variant.toLowerCase().split(' ');
        let variantMatchScore = 0;
        let containsSignificantKeyword = false;
        
        for (const keyword of variantKeywords) {
          if (lowerText.includes(keyword) && keyword.length > 3) {
            variantMatchScore += 1;
            // Some keywords are more significant
            if (keyword.length > 6) {
              containsSignificantKeyword = true;
            }
          }
        }
        
        // Return answer if variant is a very strong match or contains a significant keyword
        if (variantMatchScore >= 2 || (containsSignificantKeyword && variantMatchScore >= 1)) {
          return entry.answer;
        }
      }
    }
  }
  
  // Improved topic matching with topic scores to find the most relevant topic
  // Helper function to check if the message contains significant keywords
  // This helps prioritize important concepts even if the overall word count is lower
  const containsSignificantKeyword = (text: string, keywords: string[]): boolean => {
    const significantKeywords = [
      'process', 'workflow', 'submit', 'approval', 'negotiate', 'contract', 
      'incentive', 'financial', 'product', 'resource', 'eligibility', 'document', 
      'urgent', 'growth', 'scope', 'review'
    ];
    
    for (const keyword of keywords) {
      if (significantKeywords.some(significant => keyword.includes(significant)) && text.includes(keyword)) {
        return true;
      }
    }
    return false;
  };
  
  // Function to calculate contextual similarity between question and keywords
  const calculateContextualSimilarity = (text: string, keyword: string): number => {
    // Base score for exact match
    if (text.includes(keyword)) {
      return keyword.split(' ').length * 2;
    }
    
    // Partial match for multi-word keywords (matches 2+ consecutive words)
    if (keyword.includes(' ')) {
      const keywordParts = keyword.split(' ');
      for (let i = 0; i < keywordParts.length - 1; i++) {
        const twoWordPhrase = `${keywordParts[i]} ${keywordParts[i+1]}`;
        if (text.includes(twoWordPhrase)) {
          return 2; // Lower than full match but still significant
        }
      }
    }
    
    // Check for word boundary matches for individual words
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      return 1;
    }
    
    // No match
    return 0;
  };

  let bestMatch = '';
  let highestScore = 0;
  
  // Track if we found any significant keyword match
  let hasSignificantMatch = false;
  
  for (const [topic, keywords] of Object.entries(keywordMappingImport)) {
    let topicScore = 0;
    let hasSignificantKeyword = false;
    
    // Calculate score based on keyword matches
    for (const keyword of keywords) {
      const similarity = calculateContextualSimilarity(lowerText, keyword);
      topicScore += similarity;
      
      // Check if this is a significant keyword match
      if (similarity > 0 && containsSignificantKeyword(lowerText, [keyword])) {
        hasSignificantKeyword = true;
        topicScore += 2; // Bonus for significant keyword matches
      }
    }
    
    // If the topic name itself is mentioned, give extra weight
    if (lowerText.includes(topic.toLowerCase())) {
      topicScore += 5;
    }
    
    // If this topic has significant keywords, mark that we've found at least one significant match
    if (hasSignificantKeyword) {
      hasSignificantMatch = true;
    }
    
    // Prioritize topics with significant keyword matches if we're comparing similar scores
    if ((topicScore > highestScore) || 
        (hasSignificantKeyword && !hasSignificantMatch && topicScore > 0) ||
        (hasSignificantKeyword && topicScore >= highestScore - 1)) {
      highestScore = topicScore;
      bestMatch = topic;
      hasSignificantMatch = hasSignificantKeyword;
    }
  }
  
  // Map to handle different naming between keywordMapping and the response objects
  // This allows us to look up responses with the appropriate key
  const topicToResponseKey: Record<string, string> = {
    dealProcess: 'dealProcess',
    dealScoping: 'dealScoping',
    dealSubmission: 'dealSubmission',
    reviewAndApproval: 'reviewAndApproval',
    negotiationProcess: 'negotiationProcess',
    contractingProcess: 'contractingProcess',
    implementationProcess: 'implementationProcess',
    evaluationProcess: 'evaluationProcess',
    financialIncentives: 'financialIncentives',
    productIncentives: 'productIncentives',
    resourceIncentives: 'resourceIncentives',
    generalIncentives: 'generalIncentives',
    eligibilityRequirements: 'eligibilityRequirements',
    approvalProcess: 'approvalProcess',
    documentationRequirements: 'documentationRequirements',
    urgentDeals: 'urgentDeals',
    growthOpportunities: 'growthOpportunities'
  };
  
  // If we found a good match and have a score above threshold, use the advanced knowledge base response
  if (bestMatch && highestScore >= 1) {
    // These are predefined comprehensive responses for each topic
    // The actual responses are from our advanced knowledge base in client/src/lib/chatbot-knowledge.ts
    const responses: Record<string, string> = {
      dealProcess: '# MIQ Deal Process Overview\n\nThe MIQ deal process follows these key stages:\n\n1. **Scoping**: Define customer needs and potential solutions\n2. **Submission**: Complete deal forms with all required details\n3. **Review & Approval**: Deal desk assesses and approves terms based on deal value\n4. **Negotiation**: Finalize terms with the customer\n5. **Contracting**: Execute legal agreements\n6. **Implementation**: Solution deployment and customer onboarding\n7. **Evaluation**: Post-deal review and performance tracking\n\nEach stage has specific requirements and documentation. Would you like more details about a particular stage?',
      
      dealScoping: '# Deal Scoping Stage\n\nDeal scoping is the critical first stage of our deal process where we define what the customer needs and how we can help them.\n\n## Key Components\n• **Customer Analysis**: Understand customer\'s business, market position, and challenges\n• **Needs Assessment**: Identify specific requirements and success criteria\n• **Solution Design**: Develop preliminary solution architecture\n• **Value Proposition**: Define ROI and strategic benefits for customer\n\n## Required Information\n• Customer profile and background\n• Business needs and challenges\n• Potential solutions and approaches\n• Preliminary deal size estimate\n• Timeline and key milestones\n• Competitive landscape\n\n## Process Steps\n1. Complete the Deal Scoping Request form in the system\n2. Schedule initial customer discovery meeting\n3. Document all findings in the Deal Scoping Document\n4. Submit for initial assessment\n5. Receive approval to proceed to formal submission\n\n## Timeline & Next Steps\n• Typical review time: 1-3 business days\n• After approval, proceed to formal deal submission\n• Deal scoping document becomes foundation for full deal submission\n\n> **Pro Tip**: The more detailed your scoping information, the faster your deal can progress through later stages. Don\'t skip important details!',
      
      dealSubmission: '# Deal Submission Stage\n\nThe deal submission stage formalizes your opportunity with complete details needed for review and approval.\n\n## Required Information\n• Customer details (full company profile)\n• Deal specifics (products, services, pricing)\n• Contract terms (duration, payment schedule)\n• Deal value breakdown\n• Incentive requests (if applicable)\n• Special terms or customizations\n• Competitive situation\n\n## Documentation Requirements\n• Statement of Work (for service components)\n• Customer Requirements Document\n• Price Quote and Discount Approvals\n• Technical Specifications (if applicable)\n• Business Justification (for non-standard terms)\n\n## Submission Process\n1. Navigate to the "Submit Deal" page from the main menu\n2. Complete all mandatory fields\n3. Upload required documentation\n4. Add any supplementary information or context\n5. Submit for review\n6. Receive confirmation with deal reference number\n\n## Timeframe\n• Standard deals: 2 business days for initial review\n• Urgent deals: 4 business hours for initial review\n• Complex deals: 3-5 business days for initial review\n\n> **Pro Tip**: Always include detailed competitive information to help justify any discounts or special terms you\'re requesting.',
      
      reviewAndApproval: '# Deal Review & Approval Process\n\nThe consolidated review and approval process ensures all deal aspects are thoroughly assessed and authorized in one streamlined stage.\n\n## Process Overview\n1. Deal submission enters the review queue\n2. Cross-functional team evaluates all aspects\n3. Approval decision based on deal parameters\n4. Final sign-off based on approval matrix\n\n## Review Components\n• **Initial Screening** (Deal Desk): Check for completeness and basic criteria\n• **Commercial Review** (Finance): Examine pricing, discounts, and financial terms\n• **Technical Review** (Product/Engineering): Assess feasibility of technical requirements\n• **Legal Assessment** (Legal): Evaluate contract terms and risk factors\n• **Strategic Alignment** (Leadership): Ensure deal supports company objectives\n\n## Approval Factors\n• **Deal Value**: Higher values require more senior approvals\n• **Discount Level**: Deeper discounts need higher-level approval\n• **Contract Length**: Longer-term contracts may need additional review\n• **Non-Standard Terms**: Any customizations require special approval\n• **Strategic Importance**: High-priority customers have different workflows\n\n## Approval Matrix\n| Deal Value      | Standard Terms | Non-Standard Terms | High Discount (>20%) |\n|-----------------|----------------|--------------------|-----------------------|\n| Up to $50K      | Manager        | Director           | Director              |\n| $50K-$250K      | Director       | VP                 | VP                    |\n| $250K-$1M       | VP             | VP                 | SVP                   |\n| Over $1M        | SVP            | C-Level            | C-Level               |\n\n## Required Documentation\n• Deal Summary Document\n• Pricing and Discount Justification\n• Terms Exception Report (for non-standard terms)\n• Competitive Analysis (required for discounts)\n• Financial Impact Analysis (for large deals)\n\n## Timeline Expectations\n• Standard deals: 2-3 business days\n• Non-standard terms: 3-5 business days\n• Strategic deals: 1-2 business days (expedited)\n• Technical complexity: +1-3 days for product team review\n\n## Tracking and Visibility\n• Real-time status updates in Deal Dashboard\n• Email notifications at key approval stages\n• Comments from review team visible in Deal Details\n• Centralized document repository for all reviewers\n\n## Escalation Process\nIf your deal is urgent or has been delayed in approval:\n1. Contact your regional Deal Desk Manager\n2. Submit formal escalation request through the system\n3. Provide business justification for expedited review\n\n> **Pro Tip**: Respond promptly to any questions from the review team to avoid delays. For complex deals, consider scheduling a pre-review call with key stakeholders to address potential concerns before formal submission.',
      
      negotiationProcess: '# Deal Negotiation Process\n\nThe negotiation stage finalizes commercial terms with the customer after internal approval.\n\n## Key Negotiation Components\n• **Terms Sheet**: Approved commercial parameters\n• **Negotiation Framework**: Acceptable ranges for key terms\n• **Approval Guardrails**: What requires re-approval\n• **Escalation Path**: Process for handling unexpected requests\n\n## Negotiation Team\n• Sales Representative (lead negotiator)\n• Deal Desk Support (available as needed)\n• Legal Counsel (for contract language issues)\n• Product Specialist (for technical discussions)\n• Finance Representative (for complex financial structures)\n\n## Negotiation Guidelines\n• Stay within approved discount and incentive parameters\n• Document all customer requests and responses\n• Seek approval before modifying approved terms\n• Use standard contract language when possible\n• Focus on total deal value, not individual line items\n\n## Documentation Updates\n• Update deal record with all negotiation points\n• Document all customer communications\n• Record any deviations from approved terms\n• Update forecast and revenue recognition if terms change\n\n> **Pro Tip**: Always prepare a negotiation strategy document before engaging with customers to align internal stakeholders.',
      
      contractingProcess: '# Deal Contracting Process\n\nThe contracting stage formalizes the agreement with proper legal documentation.\n\n## Contract Types\n• **Standard Agreement**: For straightforward deals using our templates\n• **Master Services Agreement (MSA)**: Framework for ongoing services\n• **Statement of Work (SOW)**: Detailed deliverables specifications\n• **Order Form**: Specific products and services being purchased\n• **Custom Agreement**: For non-standard situations (avoid if possible)\n\n## Contracting Process\n1. Legal team drafts agreement based on approved terms\n2. Sales team reviews for business accuracy\n3. Customer receives agreement for review\n4. Revisions and redlines are processed through legal\n5. Final agreement prepared for signatures\n6. Electronic signature process initiated\n7. Fully executed contract stored in central repository\n\n## Implementation Handoff\n• Contract details entered into billing system\n• Account team receives implementation checklist\n• Customer success team assigned\n• Kickoff meeting scheduled with customer\n• Technical resources allocated based on contract\n\n## Timeline Guidelines\n• Standard contracts: 1-2 business days to draft\n• Customer review: Typically 3-5 business days\n• Revision cycles: 1-3 days per round\n• Signature process: 1-3 days\n• Total typical timeframe: 7-15 business days\n\n> **Pro Tip**: Use our contract templates whenever possible to speed up the process and reduce legal review time.',
      
      implementationProcess: '# Deal Implementation Process\n\nThe implementation stage delivers the promised solution to the customer after contract signing.\n\n## Implementation Team\n• **Project Manager**: Oversees entire implementation\n• **Technical Lead**: Handles technical configuration\n• **Account Manager**: Primary customer contact\n• **Subject Matter Experts**: Specialized technical resources\n• **Customer Success Manager**: Ensures adoption and satisfaction\n\n## Implementation Steps\n1. Internal kickoff meeting with delivery team\n2. Customer kickoff meeting\n3. Detailed project plan creation\n4. Regular status updates and milestone reviews\n5. Technical configuration and customization\n6. User acceptance testing\n7. Training and knowledge transfer\n8. Go-live and stabilization\n9. Post-implementation review\n\n## Key Documentation\n• Implementation Project Plan\n• Configuration Specifications\n• Testing Plans and Results\n• Training Materials\n• Acceptance Criteria\n• Post-Implementation Report\n\n## Timeline Considerations\n• Standard implementations: 2-4 weeks\n• Complex implementations: 1-3 months\n• Enterprise implementations: 3-6 months\n• Phased rollouts: Customized timeline\n\n> **Pro Tip**: Set clear expectations with customers about implementation timelines and required resources from their side to avoid delays.',
      
      evaluationProcess: '# Deal Evaluation Process\n\nThe evaluation stage assesses deal performance after implementation to measure success and gather insights.\n\n## Evaluation Metrics\n• **Financial Performance**: Actual vs. projected revenue\n• **Implementation Success**: On-time, on-budget delivery\n• **Customer Satisfaction**: NPS scores and feedback\n• **Product Adoption**: Usage metrics and feature utilization\n• **Upsell/Cross-sell Opportunities**: Additional identified needs\n\n## Evaluation Timeline\n• Initial assessment: 30 days post-implementation\n• Quarterly business reviews: Throughout contract term\n• Mid-term evaluation: Halfway through contract\n• Pre-renewal assessment: 90 days before renewal\n\n## Documentation Requirements\n• Deal Performance Scorecard\n• Customer Success Story (for successful deals)\n• Lessons Learned Document\n• Growth Opportunity Assessment\n• Contract Renewal Readiness Report\n\n## Stakeholder Involvement\n• Account Manager (lead)\n• Customer Success Manager\n• Sales Leadership\n• Product Management\n• Finance Team\n\n> **Pro Tip**: Use deal evaluation data to inform your approach on future opportunities with the same customer.',
      
      financialIncentives: '# Financial Incentives\n\nMIQ offers the following financial incentives to support deal closure and growth.\n\n## Added Value Media\n**Description**: Additional media inventory provided at no additional cost\n• **Eligibility**: Deals >$50,000\n• **Approval**: Director level\n• **Limit**: Up to 10% of deal value\n• **Documentation**: Requires business justification and ROI analysis\n• **Best for**: Competitive situations or expanding into new markets\n\n## Revenue Share\n**Description**: Performance-based commission structure for partners\n• **Eligibility**: Deals >$100,000\n• **Approval**: VP level\n• **Terms**: 5-15% based on volume and deal structure\n• **Documentation**: Requires forecasting model and performance criteria\n• **Best for**: Partner deals and reseller relationships\n\n## Performance Bonuses\n**Description**: Financial rewards for exceeding defined KPIs\n• **Eligibility**: All deals with measurable KPIs\n• **Approval**: Manager with Finance review\n• **Structure**: Tiered bonuses based on performance thresholds\n• **Documentation**: Requires specific, measurable targets with verification method\n• **Best for**: Results-based deals where outcomes can be clearly measured\n\n## Volume Discounts\n**Description**: Reduced pricing based on commitment level\n• **Eligibility**: Deals >$75,000\n• **Approval**: Based on discount tier (see approval matrix)\n• **Structure**: 5-20% based on volume tiers\n• **Documentation**: Requires competitive justification\n• **Best for**: Large deals with significant volume commitments\n\n## Strategic Price Adjustments\n**Description**: Custom pricing for strategic market opportunities\n• **Eligibility**: Strategic accounts, new market entry\n• **Approval**: VP or C-level depending on scope\n• **Limit**: Determined case-by-case\n• **Documentation**: Requires strategic value assessment and executive sponsorship\n• **Best for**: Market disruption plays or strategic account acquisition\n\n> **Pro Tip**: Financial incentives often have the most stringent approval requirements. Start the approval process early and gather strong justification data.',
      
      productIncentives: '# Product Incentives\n\nMIQ offers these product-based incentives to enhance deal value beyond discounting.\n\n## Feature Access\n**Description**: Early or exclusive access to new platform features\n• **Eligibility**: Strategic customers, deals >$75,000\n• **Approval**: Product team and engineering\n• **Limitations**: Subject to technical feasibility and roadmap alignment\n• **Documentation**: Requires technical assessment and release timing analysis\n• **Best for**: Innovation-focused customers who want cutting-edge capabilities\n\n## Integration Services\n**Description**: Custom integration support beyond standard offerings\n• **Eligibility**: Multi-year contracts, deals >$50,000\n• **Approval**: Technical director\n• **Resource Allocation**: Up to 40 hours of engineering time\n• **Documentation**: Requires integration specifications and resource plan\n• **Best for**: Customers with complex technical environments needing custom connectors\n\n## Platform Customizations\n**Description**: Tailored UI/UX or functionality specific to customer needs\n• **Eligibility**: Enterprise customers, deals >$150,000\n• **Approval**: Product VP and CTO\n• **Structure**: Custom development within platform architecture\n• **Documentation**: Requires detailed specifications and product roadmap assessment\n• **Best for**: Enterprise deals where specific workflow or branding needs exist\n\n## Extended API Access\n**Description**: Higher rate limits and access to advanced APIs\n• **Eligibility**: Technology partners and high-volume customers\n• **Approval**: Platform team lead\n• **Structure**: Tiered access levels based on deal size\n• **Documentation**: Requires API usage projections and use case documentation\n• **Best for**: Integration partners and customers building on our platform\n\n## Beta Program Inclusion\n**Description**: Priority inclusion in beta testing for new products\n• **Eligibility**: All customers willing to provide feedback\n• **Approval**: Product manager\n• **Structure**: Formalized beta testing agreement\n• **Documentation**: Requires beta participant agreement\n• **Best for**: Forward-thinking customers who want to shape product direction\n\n> **Pro Tip**: Product incentives require coordination with technical teams. Consult with product management before promising specific features or customizations.',
      
      resourceIncentives: '# Resource Incentives\n\nMIQ offers these resource-based incentives to enhance customer success and adoption.\n\n## Technical Resources\n**Description**: Dedicated technical account manager or implementation specialist\n• **Eligibility**: Deals >$50,000\n• **Approval**: Technical services manager\n• **Duration**: Typically 30-90 days post-implementation\n• **Documentation**: Requires resource allocation request and project plan\n• **Best for**: Complex implementations requiring specialized technical expertise\n\n## Training & Development\n**Description**: Custom training programs for customer teams\n• **Eligibility**: All customers\n• **Approval**: Team lead\n• **Standard Allocation**: 2-8 hours based on deal size\n• **Documentation**: Requires training needs assessment\n• **Best for**: Ensuring customer adoption and platform proficiency\n\n## Consultative Services\n**Description**: Business strategy and optimization consulting\n• **Eligibility**: Deals >$100,000\n• **Approval**: Director level\n• **Scope**: Defined by Statement of Work\n• **Documentation**: Requires consulting SOW with deliverables\n• **Best for**: Customers seeking strategic guidance beyond technical implementation\n\n## Dedicated Support\n**Description**: Enhanced support package with priority handling\n• **Eligibility**: Enterprise deals >$200,000\n• **Approval**: Support director\n• **Features**: Faster SLAs, named support contacts, priority issue resolution\n• **Documentation**: Requires support tier assignment\n• **Best for**: Mission-critical implementations with high uptime requirements\n\n## Executive Sponsorship\n**Description**: C-level executive assigned as strategic sponsor\n• **Eligibility**: Strategic accounts >$500,000\n• **Approval**: C-level executive\n• **Structure**: Quarterly business reviews with executive participation\n• **Documentation**: Requires executive commitment letter\n• **Best for**: Strategic partnerships and enterprise relationships\n\n> **Pro Tip**: Resource incentives are subject to team availability and capacity planning. Always check resource availability before committing to specific timeframes.',
      
      generalIncentives: '# Incentive Programs Overview\n\nMIQ offers three main categories of incentives to support your deals.\n\n## Categories of Incentives\n\n### Financial Incentives\n• Added Value Media (up to 10% of deal value)\n• Revenue Share (5-15% based on volume)\n• Performance Bonuses (tied to KPIs)\n• Volume Discounts (5-20% based on commitment)\n• Strategic Price Adjustments (for market entry)\n\n### Product Incentives\n• Early Feature Access\n• Integration Services\n• Platform Customizations\n• Extended API Access\n• Beta Program Inclusion\n\n### Resource Incentives\n• Technical Resources\n• Training & Development\n• Consultative Services\n• Dedicated Support\n• Executive Sponsorship\n\n## Choosing the Right Incentive\n• **Consider customer priorities**: What does the customer value most?\n• **Assess deal stage**: Different incentives work better at different stages\n• **Evaluate competition**: What will differentiate our offer?\n• **Calculate impact**: Which incentive provides the best ROI?\n• **Check eligibility**: Ensure the deal qualifies for chosen incentives\n\n## Incentive Combinations\nIncentives can be combined strategically, typically following these guidelines:\n• Maximum of two incentive types per deal\n• Total incentive value capped at 25% of deal value\n• Mix of different categories often more effective than multiple from same category\n\n## Requesting Incentives\n1. Determine appropriate incentives based on deal specifics\n2. Document justification for each requested incentive\n3. Submit through Deal Submission form\n4. Prepare for approval discussions\n5. Adjust based on approver feedback\n\n> **Pro Tip**: When possible, offer incentives that add value rather than reduce price, as they protect margin while still providing customer benefits.',
      
      eligibilityRequirements: '# Incentive Eligibility Requirements\n\nEligibility for MIQ incentive programs is determined by multiple factors.\n\n## Deal Size Thresholds\n• **Standard Threshold Tiers**:\n  - Tier 1: Deals $25,000-$49,999\n  - Tier 2: Deals $50,000-$99,999\n  - Tier 3: Deals $100,000-$249,999\n  - Tier 4: Deals $250,000+\n\n• **Incentive Availability by Tier**:\n  - Tier 1: Limited resource incentives only\n  - Tier 2: Most resource incentives, limited product incentives\n  - Tier 3: All resource and product incentives, limited financial incentives\n  - Tier 4: Full access to all incentive programs\n\n## Customer Tier Classification\n• **Gold Partners/Customers**:\n  - Classification criteria: $1M+ annual revenue or strategic market position\n  - Benefits: Access to all incentive programs\n  - Special considerations: Expedited approval process\n\n• **Silver Partners/Customers**:\n  - Classification criteria: $250K-$999K annual revenue\n  - Benefits: Limited access to financial incentives, full access to others\n  - Special considerations: Quarterly incentive quota\n\n• **Bronze Partners/Customers**:\n  - Classification criteria: <$250K annual revenue\n  - Benefits: Primarily eligible for resource incentives\n  - Special considerations: Focused on growth incentives\n\n## Contract Length Factors\n• **1-year contracts**: Standard incentive levels\n• **2-year contracts**: +25% incentive value or access to next tier\n• **3+ year contracts**: +40% incentive value or access to next tier\n• **Multi-phase contracts**: Evaluated based on total contract value\n\n## Strategic Alignment Considerations\nDeals that align with these strategic priorities receive preferential treatment:\n• Expansion into target industries\n• Platform adoption of strategic products\n• Competitive displacements\n• Reference-able implementations\n• Innovation partnerships\n\n## Eligibility Determination Process\n1. Initial assessment by sales representative\n2. Verification by Deal Desk during submission\n3. Final determination by approving authority\n4. Appeals process available for edge cases\n\n> **Pro Tip**: When in doubt about eligibility, consult with your Deal Desk representative before promising specific incentives to customers.',
      
      approvalProcess: '# Incentive Approval Process\n\nThe approval process ensures proper governance while enabling deal closure.\n\n## Approval Workflow\n1. **Incentive Request**: Sales submits via Deal Submission form\n2. **Initial Review**: Deal Desk checks eligibility and documentation\n3. **Financial Review**: Finance assesses margin impact\n4. **Technical Review**: Product/Engineering evaluates technical incentives\n5. **Decision Authority**: Final approver based on approval matrix\n6. **Documentation**: Approval recorded in deal record\n7. **Communication**: Approval status sent to requestor\n\n## Approval Roles and Responsibilities\n• **Sales Representative**: Submits properly documented requests\n• **Deal Desk**: Validates eligibility and routes approvals\n• **Finance Team**: Assesses financial impact\n• **Product/Engineering**: Reviews technical feasibility\n• **Approvers**: Evaluate strategic alignment and business case\n\n## Common Approval Challenges\n• **Incomplete Documentation**: Submit thorough business justification\n• **Margin Impact**: Demonstrate long-term value beyond immediate deal\n• **Technical Feasibility**: Consult product team before submission\n• **Precedent Concerns**: Address uniqueness of situation\n• **Budget Constraints**: Consider timing and resource availability\n\n## Expedited Approval\nFor urgent deals, expedited approval may be requested:\n1. Mark deal as "High Priority" in submission\n2. Add [URGENT] to deal name\n3. Contact Deal Desk manager directly\n4. Provide clear business justification for urgency\n5. Be available to answer questions quickly\n\n## Approval Tracking\n• All approvals documented in deal record\n• Approval history visible to all stakeholders\n• Conditional approvals tracked with requirements\n• Approval expiration dates enforced (typically 60 days)\n\n> **Pro Tip**: For complex or unusual incentive requests, schedule a pre-review with key stakeholders before formal submission to address potential concerns.',
      
      documentationRequirements: '# Deal Documentation Requirements\n\nThe following documentation is required for deal submission and approval.\n\n## Core Deal Documents\n1. **Deal Submission Form**\n   • Purpose: Captures all essential deal details\n   • Required fields: Customer info, products, pricing, term\n   • Template: Available in Deal Portal\n   • Responsibility: Sales Representative\n\n2. **Customer Requirements Document**\n   • Purpose: Documents customer needs and expectations\n   • Required sections: Business needs, success criteria, technical requirements\n   • Template: Available in Help Resources\n   • Responsibility: Sales with customer input\n\n3. **Statement of Work (SOW)**\n   • Purpose: Defines services scope and deliverables\n   • When required: Any deal with service components\n   • Template: Available by service type in Legal Portal\n   • Responsibility: Solutions Consultant or Services Team\n\n4. **Business Justification**\n   • Purpose: Explains rationale for non-standard terms\n   • When required: Discounts >10%, non-standard terms\n   • Template: Available in Deal Portal\n   • Responsibility: Sales Representative\n\n## Supporting Documentation\n5. **Approval Documentation**\n   • Purpose: Evidence of proper approvals for special terms\n   • Format: Email approvals or signed approval forms\n   • Storage: Attached to deal record\n   • Responsibility: Deal Desk to verify\n\n6. **Technical Assessment**\n   • Purpose: Validates feasibility of technical requirements\n   • When required: Custom development, integrations\n   • Template: Available in Technical Portal\n   • Responsibility: Solutions Engineer\n\n7. **Legal Review Memo**\n   • Purpose: Identifies legal risks in contract modifications\n   • When required: Any contract language changes\n   • Format: Standard memo from Legal team\n   • Responsibility: Legal Department\n\n## Document Management\n• All documents must be uploaded to the deal record\n• Naming convention: [Deal ID]_[Document Type]_[Version]\n• Version control required for documents with multiple revisions\n• Documents must be in PDF format for final versions\n• Retention policy: 7 years from deal closure\n\n## Documentation Best Practices\n• Use standard templates whenever possible\n• Be comprehensive but concise\n• Focus on relevant information for approvers\n• Update documents when deal parameters change\n• Ensure customer expectations match documentation\n\n> **Pro Tip**: Use our templates (available in the Help Resources section) to ensure faster processing and reduce back-and-forth communications.',
      
      urgentDeals: '# Handling Urgent Deals\n\nFor time-sensitive opportunities, follow these specific protocols.\n\n## Identifying Urgent Deals\nValid reasons for urgent status:\n• Competitive threat with defined deadline\n• End of customer budget period (use only within 2 weeks of deadline)\n• Legal or regulatory requirement with fixed date\n• Executive-sponsored strategic opportunity\n\n## Urgent Deal Process\n1. Mark "High Priority" in the submission form\n2. Add [URGENT] to the beginning of the deal name\n3. Contact your regional Deal Desk manager directly\n4. Complete the Urgent Deal Justification form\n5. Be available via phone/email during review process\n\n## Expedited Review Timeline\n• Initial screening: Within 2 business hours\n• Commercial review: Within 4 business hours\n• Full approval cycle: Within 1 business day\n• Contract generation: Within 4 business hours after approval\n\n## Documentation Requirements\nUrgent deals require the same documentation as standard deals, but with these additions:\n• Urgent Deal Justification Form\n• Evidence of deadline (customer communication, RFP deadline, etc.)\n• Executive sponsor (for strategic opportunities)\n\n## Important Limitations\n• Maximum of 3 urgent deals per quarter per sales representative\n• Urgent status can be declined if justification is insufficient\n• Repeated non-genuine urgent requests may affect future requests\n• All urgent deals are reported to sales leadership weekly\n\n> **Pro Tip**: For genuine urgent situations, a brief call with the Deal Desk manager can significantly expedite the process.',
      
      growthOpportunities: '# Growth Opportunity Incentives\n\nGrowth opportunities qualify for enhanced incentives to reward expansion.\n\n## Qualifying Growth Scenarios\n• **New Market Entry**: Expanding to new geographic regions or industries\n• **Contract Value Increase**: Growing existing contracts by at least 20%\n• **Term Extension**: Extending contract duration beyond initial term\n• **Product Expansion**: Adding new product lines to existing contracts\n• **Strategic Alignment**: Deals that align with quarterly strategic focus areas\n\n## Enhanced Incentive Structure\n• **Financial Growth Incentives**:\n  - Additional 5% discount authority\n  - Performance-based rewards up to 10% of incremental value\n  - Extended payment terms (Net-60 vs standard Net-30)\n\n• **Product Growth Incentives**:\n  - Priority feature requests consideration\n  - Extended beta access to new capabilities\n  - Custom integration hours increased by 50%\n\n• **Resource Growth Incentives**:\n  - Executive sponsorship program eligibility\n  - Additional implementation support hours\n  - Dedicated customer success manager\n\n## Documentation Requirements\n• Growth Opportunity Assessment Form\n• Baseline metrics from existing contract\n• Projected growth metrics and timeline\n• Customer expansion strategy document\n• Competitive analysis (if applicable)\n\n## Approval Considerations\n• Clear demonstration of incremental value\n• Sustainable growth metrics (not one-time spike)\n• Strategic alignment with company priorities\n• Resource availability for support\n• Long-term profitability analysis\n\n> **Pro Tip**: Document the growth opportunity clearly in the "Strategic Value" section of the deal submission form, with quantifiable metrics whenever possible.'
    };

    // Check if we have a response key for this topic
    const responseKey = topicToResponseKey[bestMatch] || bestMatch;
    // Type-safe lookup 
    if (responseKey in responses) {
      return responses[responseKey as keyof typeof responses];
    }
  }
  
  // Fallback for deal-related questions that don't match specific topics
  if (lowerText.includes('deal') || lowerText.includes('process') || lowerText.includes('workflow') || lowerText.includes('incentive')) {
    return 'I notice you\'re asking about MIQ\'s commercial deal process. Our process is designed to support you through every stage from scoping to execution. \n\nI can help with information about:\n• Deal stages and requirements\n• Incentive programs and eligibility\n• Documentation and approval workflows\n• Special situations (urgent deals, growth opportunities)\n\nFor more specific information, please ask about a particular aspect of the deal process that you\'d like to learn more about.';
  }
  
  // Generic fallback for non-deal questions
  return 'Thanks for your question about MIQ\'s commercial deal process. I\'m here to help with information about deal workflows, incentive programs, eligibility requirements, and documentation needs. \n\nCould you provide more specific details about what you\'re looking for? For example:\n• A particular deal stage\n• Specific incentive programs\n• Approval processes\n• Documentation requirements';
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
      // Include both main questions and a sample of variants
      const suggestedQuestions: string[] = [];
      
      // Add all main questions
      knowledgeBase.forEach(entry => {
        suggestedQuestions.push(entry.question);
        
        // Add 1-2 random variants for each entry to provide more options
        if (entry.variants && entry.variants.length > 0) {
          // Get up to 2 random variants
          const numVariantsToAdd = Math.min(2, entry.variants.length);
          const shuffledVariants = [...entry.variants].sort(() => 0.5 - Math.random());
          
          for (let i = 0; i < numVariantsToAdd; i++) {
            suggestedQuestions.push(shuffledVariants[i]);
          }
        }
      });
      
      res.status(200).json({
        success: true,
        questions: suggestedQuestions
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