/**
 * MIQ Deal Chatbot Knowledge Base
 * This file contains the structured knowledge for the chatbot to reference when responding to user queries.
 * Organized into two sections:
 * 1. Simple responses - Brief, concise answers for quick information
 * 2. Advanced responses - Detailed, formatted responses with more comprehensive information
 */

// Simple knowledge base - brief answers for the 'simple' AI model
export const simpleKnowledgeBase = {
  // Deal Process Guidance
  dealProcess: 'The MIQ deal process workflow consists of several stages: scoping, submission, review, approval, negotiation, contracting, and evaluation. Each stage has specific requirements and documentation needs.',
  
  dealScoping: 'Deal scoping is the initial stage where you define the deal parameters, customer needs, and potential solutions. Complete the Deal Scoping Request form in the system to begin this process.',
  
  dealSubmission: 'To submit a new deal, navigate to the "Submit Deal" page from the main menu. Fill out all required fields, attach necessary documentation, and then click "Submit for Review". You\'ll receive a confirmation email with the deal reference number.',
  
  dealReviewApproval: 'The deal review process involves evaluation by the deal desk team, followed by approvals based on deal value and incentive requests. Standard deals are typically reviewed within 2 business days.',
  
  negotiationContracting: 'During negotiation and contracting, the deal terms are finalized with the customer. Legal review is required for all non-standard terms. Use our contract templates as a starting point for faster approval.',
  
  // Incentive Program Information
  financialIncentives: 'Financial incentives include Added Value Media, Revenue Share, and Performance Bonuses. These require approval based on the incentive amount and typically need finance team review.',
  
  productIncentives: 'Product incentives include Feature Access, Integration Services, and Platform Customizations. These require product team approval and technical feasibility assessment.',
  
  resourceIncentives: 'Resource incentives include Technical Resources, Training & Development, and Consultative Services. These are subject to team availability and typically require manager approval.',
  
  generalIncentives: 'MIQ offers three main incentive categories: Financial (Added Value Media, Revenue Share), Product (Feature Access, Integration Services), and Resource (Technical Resources, Training). Each has specific eligibility criteria and approval processes.',
  
  // Eligibility & Approval Support
  eligibilityRequirements: 'Eligibility for incentives depends on deal size, customer tier, contract length, and strategic alignment. Minimum deal values vary by incentive type, with financial incentives typically requiring larger deals.',
  
  // Documentation Requirements
  documentationRequirements: 'Required documentation includes the Deal Submission Form, Customer Requirements Document, Statement of Work (for service components), and Business Justification (for non-standard terms or pricing).',
  
  // Other Information
  urgentDeals: 'For urgent deals, mark "High Priority" in the submission form and add [URGENT] to the beginning of the deal name. Also, reach out directly to your regional deal desk manager to notify them of the urgent request.',
  
  growthOpportunities: 'Growth opportunities that qualify for enhanced incentives include: expanding to new markets, increasing contract value by at least 20%, extending contract terms beyond 24 months, or adding new product lines to existing contracts.',
  
  defaultResponse: 'Thanks for your question. For specific details about this topic, I recommend checking our documentation in the Help Resources section or reaching out to your deal desk manager.'
};

// Advanced knowledge base - detailed answers for the 'advanced' AI model
export const advancedKnowledgeBase = {
  // Deal Process Guidance
  dealProcess: 'The MIQ deal process follows these key stages:\n\n1. **Scoping**: Define customer needs and potential solutions\n2. **Submission**: Complete deal forms with all required details\n3. **Review**: Deal desk assesses commercial terms and requirements\n4. **Approval**: Stakeholders sign off based on deal value and terms\n5. **Negotiation**: Finalize terms with the customer\n6. **Contracting**: Execute legal agreements\n7. **Evaluation**: Post-deal review and performance tracking\n\nEach stage has specific requirements and documentation. Would you like more details about a particular stage?',
  
  dealScoping: 'Deal scoping is the critical first stage of our deal process. Here\'s what you need to know:\n\n• **Purpose**: Define deal parameters, customer needs, and potential solutions\n• **Requirements**: Customer profile, business needs assessment, preliminary solution design\n• **Process**: Complete the Deal Scoping Request form in the system\n• **Timeline**: Typically 1-3 days for initial review\n• **Next steps**: After approval, you can move to formal deal submission\n\nPro tip: The more detailed your scoping information, the faster your deal can progress through later stages.',
  
  dealSubmission: 'To submit a new deal, follow these steps:\n\n1. Navigate to the "Submit Deal" page from the main menu\n2. Complete all required fields:\n   • Customer information\n   • Deal value and term\n   • Product/service details\n   • Incentive requests (if applicable)\n   • Special terms or conditions\n3. Attach necessary documentation:\n   • Statement of Work (if services are included)\n   • Custom requirements document\n   • Pricing approval (if discounts are applied)\n4. Click "Submit for Review"\n\nYou\'ll receive a confirmation email with the deal reference number for tracking. The standard review time is 2 business days, or 4 hours for urgent deals.',
  
  // Incentive Program Information
  financialIncentives: 'MIQ offers the following financial incentives:\n\n• **Added Value Media**: Additional media inventory at no cost\n   - Eligibility: Deals >$50,000\n   - Approval: Director level\n   - Limit: Up to 10% of deal value\n\n• **Revenue Share**: Performance-based commission structure\n   - Eligibility: Deals >$100,000\n   - Approval: VP level\n   - Standard terms: 5-15% based on volume\n\n• **Performance Bonuses**: Financial rewards for exceeding KPIs\n   - Eligibility: All deals with measurable KPIs\n   - Approval: Manager with Finance review\n   - Documentation: Must include specific, measurable targets\n\nAll financial incentives require business justification and ROI analysis.',
  
  productIncentives: 'MIQ offers these product incentives:\n\n• **Feature Access**: Early or exclusive access to new platform features\n   - Eligibility: Strategic customers, deals >$75,000\n   - Approval: Product team and engineering\n   - Limitations: Subject to technical feasibility\n\n• **Integration Services**: Custom integration support\n   - Eligibility: Multi-year contracts, deals >$50,000\n   - Approval: Technical director\n   - Resource allocation: Up to 40 hours of engineering time\n\n• **Platform Customizations**: Tailored UI/UX or functionality\n   - Eligibility: Enterprise customers, deals >$150,000\n   - Approval: Product VP and CTO\n   - Requirements: Technical assessment and roadmap alignment\n\nProduct incentives are subject to engineering capacity and strategic alignment.',
  
  resourceIncentives: 'MIQ offers these resource incentives:\n\n• **Technical Resources**: Dedicated technical account manager or implementation specialist\n   - Eligibility: Deals >$50,000\n   - Approval: Technical services manager\n   - Duration: Typically 30-90 days post-implementation\n\n• **Training & Development**: Custom training programs\n   - Eligibility: All customers\n   - Approval: Team lead\n   - Standard allocation: 2-8 hours based on deal size\n\n• **Consultative Services**: Business strategy and optimization consulting\n   - Eligibility: Deals >$100,000\n   - Approval: Director level\n   - Scope: Defined by Statement of Work\n\nResource incentives are subject to team availability and capacity planning.',
  
  // Documentation Requirements
  documentationRequirements: 'The following documentation is required for deal submission and approval:\n\n1. **Deal Submission Form**: Core deal details including products, pricing, and term\n2. **Customer Requirements Document**: Specific needs and expectations\n3. **Statement of Work (SOW)**: Required for any service components\n4. **Business Justification**: Required for non-standard terms or pricing\n5. **Approval Documentation**: Evidence of proper approvals for discounts or incentives\n6. **Technical Assessment**: Required for product customizations or integrations\n7. **Legal Review**: Required for contract modifications\n\nPro tip: Use our templates (available in the Help Resources section) to ensure faster processing and reduce back-and-forth communications.',
  
  // Eligibility & Approval Support
  eligibilityRequirements: 'Eligibility for MIQ incentive programs is determined by multiple factors:\n\n• **Deal Size**: Minimum thresholds vary by incentive type\n   - Financial incentives: Typically $50,000+\n   - Product incentives: Typically $75,000+\n   - Resource incentives: Various thresholds, some available to all customers\n\n• **Customer Tier**: Gold, Silver, and Bronze classifications\n   - Gold: Access to all incentive programs\n   - Silver: Limited access to financial incentives\n   - Bronze: Primarily eligible for resource incentives\n\n• **Contract Length**: Multi-year commitments receive enhanced incentives\n   - 1-year: Standard incentive levels\n   - 2-year: +25% incentive value\n   - 3+ year: +40% incentive value\n\n• **Strategic Alignment**: Deals that align with company priorities receive preferential treatment\n\nThe Deal Desk team makes the final determination on incentive eligibility.',
  
  // Incentives Overview
  generalIncentives: 'MIQ offers three main categories of incentives to support your deals:\n\n• **Financial Incentives**: \n   - Added Value Media (up to 10% of deal value)\n   - Revenue Share (5-15% based on volume)\n   - Performance Bonuses (tied to KPIs)\n\n• **Product Incentives**: \n   - Early Feature Access\n   - Integration Services\n   - Platform Customizations\n\n• **Resource Incentives**: \n   - Technical Resources\n   - Training & Development\n   - Consultative Services\n\nEach incentive type has specific eligibility criteria based on deal size, customer tier, and strategic value. What specific incentive type are you interested in learning more about?',
  
  // Default/General Response
  generalResponse: 'I notice you\'re asking about MIQ\'s commercial deal process. Our process is designed to support you through every stage from scoping to execution. Our incentive programs (Financial, Product, and Resource) can help you close more deals and drive customer satisfaction.\n\nFor more specific information, you can ask me about:\n- Deal process stages and requirements\n- Specific incentive programs and eligibility\n- Documentation requirements\n- Approval workflows\n\nOr browse our detailed guides in the Help Resources section.',
  
  defaultResponse: 'Thanks for your question about MIQ\'s commercial deal process. I\'m here to help with information about deal workflows, incentive programs, eligibility requirements, and documentation needs. Could you provide more specific details about what you\'re looking for?'
};

// Keyword mapping to responses - Used to detect the topic being discussed
export const keywordMapping = {
  dealProcess: ['process', 'workflow', 'lifecycle', 'steps', 'stages', 'how deal works', 'deal flow', 'deal stages', 'deal lifecycle'],
  
  // More extensive keywords for deal scoping
  dealScoping: [
    'scoping', 'scope', 'initial stage', 'first step', 'begin deal', 'start deal', 
    'what is scoping', 'deal scoping', 'scoping stage', 'scoping process', 
    'how to scope a deal', 'deal parameters', 'customer needs', 'solution design',
    'scoping requirements', 'define deal'
  ],
  
  // More extensive keywords for deal submission
  dealSubmission: [
    'submit', 'submission', 'new deal', 'create deal', 'start deal', 'enter deal', 'deal form',
    'how to submit', 'submission process', 'deal details', 'required fields', 'submit for review',
    'create a new deal', 'deal creation', 'submit a deal', 'deal information', 'adding a deal'
  ],
  
  // More extensive keywords for review and approval
  review: [
    'review', 'approval', 'approve', 'evaluate', 'assessment', 'appraise',
    'review process', 'approval process', 'deal desk review', 'stakeholder approval', 
    'evaluation criteria', 'review timeline', 'deal approval', 'how long for approval',
    'who approves', 'approval workflow', 'approval stages'
  ],
  
  // More extensive keywords for negotiation and contracting
  negotiation: [
    'negotiation', 'contract', 'terms', 'agreement', 'finalize deal',
    'negotiation process', 'contract review', 'legal review', 'contract terms', 
    'finalize agreement', 'execute contract', 'contracting process', 'deal terms',
    'standard terms', 'non-standard terms', 'legal agreement'
  ],
  
  financialIncentives: [
    'financial incentive', 'money', 'revenue share', 'monetary', 'commission', 
    'discount', 'financial bonus', 'added value media', 'performance bonus',
    'financial rewards', 'monetary incentive'
  ],
  
  productIncentives: [
    'product incentive', 'feature', 'platform', 'product bonus', 'feature access', 
    'early access', 'integration services', 'platform customization', 'custom features',
    'product perks', 'product offering'
  ],
  
  resourceIncentives: [
    'resource incentive', 'training', 'technical resource', 'support', 'assistance', 
    'help resources', 'technical account manager', 'implementation specialist',
    'training programs', 'consultative services'
  ],
  
  generalIncentives: [
    'incentive', 'bonus', 'threshold', 'rewards', 'perks', 'benefits', 'special offers',
    'what incentives', 'available incentives', 'incentive types', 'incentive programs',
    'types of incentives', 'incentive categories', 'what bonuses', 'what benefits'
  ],
  
  eligibility: [
    'eligibility', 'qualify', 'eligible', 'who can', 'requirements', 'criteria', 
    'qualification', 'who qualifies', 'eligibility factors', 'deal size', 'customer tier',
    'contract length', 'strategic alignment', 'eligibility requirements'
  ],
  
  documentation: [
    'document', 'paperwork', 'forms', 'required files', 'attachments', 'what to submit', 
    'required documents', 'what is required', 'documentation needed', 'deal submission form',
    'customer requirements document', 'statement of work', 'business justification',
    'approval documentation', 'technical assessment', 'legal review'
  ],
  
  urgent: [
    'urgent', 'fast track', 'expedite', 'rush', 'quick', 'emergency', 'immediate', 
    'asap', 'high priority', 'urgent deal', 'time-sensitive', 'accelerated approval',
    'priority review', 'urgent request'
  ],
  
  growth: [
    'growth', 'opportunity', 'expansion', 'increase', 'growing', 'scale', 'upsell',
    'new markets', 'contract value increase', 'extending contract', 'adding product lines',
    'enhanced incentives', 'growth incentives'
  ]
};