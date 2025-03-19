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

// Advanced knowledge base - comprehensive structured knowledge for the 'advanced' AI model
export const advancedKnowledgeBase = {
  //=======================================================================================
  // DEAL PROCESS - OVERVIEW AND STAGES
  //=======================================================================================
  
  // Overall Deal Process
  dealProcess: `# MIQ Deal Process Overview

The MIQ deal process follows these key stages:

1. **Scoping**: Define customer needs and potential solutions
2. **Submission**: Complete deal forms with all required details
3. **Review & Approval**: Deal desk assesses and approves terms based on deal value
4. **Negotiation**: Finalize terms with the customer
5. **Contracting**: Execute legal agreements
6. **Implementation**: Solution deployment and customer onboarding
7. **Evaluation**: Post-deal review and performance tracking

Each stage has specific requirements and documentation. Would you like more details about a particular stage?`,
  
  //=======================================================================================
  // DEAL STAGES - DETAILED INFORMATION
  //=======================================================================================
  
  // Stage 1: Scoping
  dealScoping: `# Deal Scoping Stage

Deal scoping is the critical first stage of our deal process where we define initial deal feasibility and guardrails for pre-approval engagement.

## Key Components
• **Client Analysis**: Understand client's business strategy, challenges and needs
• **Value Proposition**: Define ROI and strategic benefits for customer

## Required Information
• Client information
• Business needs and challenges
• Potential path to grow with MIQ
• Estimated growth ambition

## Process Steps
1. Complete the Deal Scoping Request form under Deal Process
2. Have an initial discovery meeting with Partnership to assess client needs, and strategic fit
3. Collaborate with Trading, Marketing, and Creative teams to refine pricing structure and incentives.
4. Obtain sign-off from the RVP Trading and MD before presenting V1 to the client (framed as exploratory, not approved yet).
5. Present V1 to the client and ask for their feedback.

## Timeline & Next Steps
• Request for deal scoping will be processed within 48 hours. 
• After the discovery call with Partnership, proceed to formal deal submission

> **Pro Tip**: The more time you spend on scoping & qualifying the deal during this stage, the less questions you'll get during review stage. Don't skip the planning work`,
  
  // Stage 2: Deal Submission
  dealSubmission: `# Deal Submission Stage

The deal submission stage formalizes your opportunity with complete details needed for review and approval.

## Required Information
• Region
• Deal type
• Deal timeframe & terms
• Client details
• Revenue and Profit projection
• Incentive requests

## Approval Requirements
• All proposed financial incentives must be signed off by Trading and Finance.
• All proposed product incentives must be signed off by Solutions and Product.
• All proposed resources incentives must be signed off by relevant Department leads (Trading, AM, Solutions, Marketing, etc.).

## Timeframe
• Standard deals: 2 business days for initial review
• Non-standard deals: 3-5 business hours for initial review

> **Pro Tip**: Always include detailed competitive information to help justify any discounts or special terms you're requesting.`,
  
  // Stage 3: Review & Approval Process
  reviewAndApproval: `# Deal Review & Approval Process

The consolidated review and approval process ensures all deal aspects are thoroughly assessed and authorized in one streamlined stage.

## Process Overview
1. Deal submission enters the review queue
2. Cross-functional team evaluates all aspects
3. Approval decision based on deal parameters
4. Final sign-off based on approval matrix

## Review Components
• **Initial Screening** (Deal Desk): Check for completeness and basic criteria
• **Commercial Review** (Finance): Examine pricing, discounts, and financial terms
• **Technical Review** (Product/Engineering): Assess feasibility of technical requirements
• **Legal Assessment** (Legal): Evaluate contract terms and risk factors
• **Strategic Alignment** (Leadership): Ensure deal supports company objectives

## Approval Factors
• **Deal Value**: Higher values require more senior approvals
• **Discount Level**: Deeper discounts need higher-level approval
• **Contract Length**: Longer-term contracts may need additional review
• **Non-Standard Terms**: Any customizations require special approval
• **Strategic Importance**: High-priority customers have different workflows

## Approval Matrix
| Deal Value      | Standard Terms | Non-Standard Terms | High Discount (>20%) |
|-----------------|----------------|--------------------|-----------------------|
| Up to $50K      | Manager        | Director           | Director              |
| $50K-$250K      | Director       | VP                 | VP                    |
| $250K-$1M       | VP             | VP                 | SVP                   |
| Over $1M        | SVP            | C-Level            | C-Level               |

## Required Documentation
• Deal Summary Document
• Pricing and Discount Justification
• Terms Exception Report (for non-standard terms)
• Competitive Analysis (required for discounts)
• Financial Impact Analysis (for large deals)

## Timeline Expectations
• Standard deals: 2-3 business days
• Non-standard terms: 3-5 business days
• Strategic deals: 1-2 business days (expedited)
• Technical complexity: +1-3 days for product team review

## Tracking and Visibility
• Real-time status updates in Deal Dashboard
• Email notifications at key approval stages
• Comments from review team visible in Deal Details
• Centralized document repository for all reviewers

## Escalation Process
If your deal is urgent or has been delayed in approval:
1. Contact your regional Deal Desk Manager
2. Submit formal escalation request through the system
3. Provide business justification for expedited review

> **Pro Tip**: Respond promptly to any questions from the review team to avoid delays. For complex deals, consider scheduling a pre-review call with key stakeholders to address potential concerns before formal submission.`,
  
  // Stage 5: Negotiation
  negotiationProcess: `# Deal Negotiation Process

The negotiation stage finalizes commercial terms with the customer after internal approval.

## Key Negotiation Components
• **Terms Sheet**: Approved commercial parameters
• **Negotiation Framework**: Acceptable ranges for key terms
• **Approval Guardrails**: What requires re-approval
• **Escalation Path**: Process for handling unexpected requests

## Negotiation Team
• Sales Representative (lead negotiator)
• Deal Desk Support (available as needed)
• Legal Counsel (for contract language issues)
• Product Specialist (for technical discussions)
• Finance Representative (for complex financial structures)

## Negotiation Guidelines
• Stay within approved discount and incentive parameters
• Document all customer requests and responses
• Seek approval before modifying approved terms
• Use standard contract language when possible
• Focus on total deal value, not individual line items

## Documentation Updates
• Update deal record with all negotiation points
• Document all customer communications
• Record any deviations from approved terms
• Update forecast and revenue recognition if terms change

> **Pro Tip**: Always prepare a negotiation strategy document before engaging with customers to align internal stakeholders.`,
  
  // Stage 6: Contracting
  contractingProcess: `# Deal Contracting Process

The contracting stage formalizes the agreement with proper legal documentation.

## Contract Types
• **Standard Agreement**: For straightforward deals using our templates
• **Master Services Agreement (MSA)**: Framework for ongoing services
• **Statement of Work (SOW)**: Detailed deliverables specifications
• **Order Form**: Specific products and services being purchased
• **Custom Agreement**: For non-standard situations (avoid if possible)

## Contracting Process
1. Legal team drafts agreement based on approved terms
2. Sales team reviews for business accuracy
3. Customer receives agreement for review
4. Revisions and redlines are processed through legal
5. Final agreement prepared for signatures
6. Electronic signature process initiated
7. Fully executed contract stored in central repository

## Implementation Handoff
• Contract details entered into billing system
• Account team receives implementation checklist
• Customer success team assigned
• Kickoff meeting scheduled with customer
• Technical resources allocated based on contract

## Timeline Guidelines
• Standard contracts: 1-2 business days to draft
• Customer review: Typically 3-5 business days
• Revision cycles: 1-3 days per round
• Signature process: 1-3 days
• Total typical timeframe: 7-15 business days

> **Pro Tip**: Use our contract templates whenever possible to speed up the process and reduce legal review time.`,
  
  // Stage 7: Implementation
  implementationProcess: `# Deal Implementation Process

The implementation stage delivers the promised solution to the customer after contract signing.

## Implementation Team
• **Project Manager**: Oversees entire implementation
• **Technical Lead**: Handles technical configuration
• **Account Manager**: Primary customer contact
• **Subject Matter Experts**: Specialized technical resources
• **Customer Success Manager**: Ensures adoption and satisfaction

## Implementation Steps
1. Internal kickoff meeting with delivery team
2. Customer kickoff meeting
3. Detailed project plan creation
4. Regular status updates and milestone reviews
5. Technical configuration and customization
6. User acceptance testing
7. Training and knowledge transfer
8. Go-live and stabilization
9. Post-implementation review

## Key Documentation
• Implementation Project Plan
• Configuration Specifications
• Testing Plans and Results
• Training Materials
• Acceptance Criteria
• Post-Implementation Report

## Timeline Considerations
• Standard implementations: 2-4 weeks
• Complex implementations: 1-3 months
• Enterprise implementations: 3-6 months
• Phased rollouts: Customized timeline

> **Pro Tip**: Set clear expectations with customers about implementation timelines and required resources from their side to avoid delays.`,
  
  // Stage 8: Evaluation
  evaluationProcess: `# Deal Evaluation Process

The evaluation stage assesses deal performance after implementation to measure success and gather insights.

## Evaluation Metrics
• **Financial Performance**: Actual vs. projected revenue
• **Implementation Success**: On-time, on-budget delivery
• **Customer Satisfaction**: NPS scores and feedback
• **Product Adoption**: Usage metrics and feature utilization
• **Upsell/Cross-sell Opportunities**: Additional identified needs

## Evaluation Timeline
• Initial assessment: 30 days post-implementation
• Quarterly business reviews: Throughout contract term
• Mid-term evaluation: Halfway through contract
• Pre-renewal assessment: 90 days before renewal

## Documentation Requirements
• Deal Performance Scorecard
• Customer Success Story (for successful deals)
• Lessons Learned Document
• Growth Opportunity Assessment
• Contract Renewal Readiness Report

## Stakeholder Involvement
• Account Manager (lead)
• Customer Success Manager
• Sales Leadership
• Product Management
• Finance Team

> **Pro Tip**: Use deal evaluation data to inform your approach on future opportunities with the same customer.`,
  
  //=======================================================================================
  // INCENTIVE PROGRAMS - DETAILED INFORMATION
  //=======================================================================================
  
  // Financial Incentives
  financialIncentives: `# Financial Incentives

MIQ offers the following financial incentives to support deal closure and growth.

## Added Value Media
**Description**: Additional media inventory provided at no additional cost
• **Eligibility**: Deals >$50,000
• **Approval**: Director level
• **Limit**: Up to 10% of deal value
• **Documentation**: Requires business justification and ROI analysis
• **Best for**: Competitive situations or expanding into new markets

## Revenue Share
**Description**: Performance-based commission structure for partners
• **Eligibility**: Deals >$100,000
• **Approval**: VP level
• **Terms**: 5-15% based on volume and deal structure
• **Documentation**: Requires forecasting model and performance criteria
• **Best for**: Partner deals and reseller relationships

## Performance Bonuses
**Description**: Financial rewards for exceeding defined KPIs
• **Eligibility**: All deals with measurable KPIs
• **Approval**: Manager with Finance review
• **Structure**: Tiered bonuses based on performance thresholds
• **Documentation**: Requires specific, measurable targets with verification method
• **Best for**: Results-based deals where outcomes can be clearly measured

## Volume Discounts
**Description**: Reduced pricing based on commitment level
• **Eligibility**: Deals >$75,000
• **Approval**: Based on discount tier (see approval matrix)
• **Structure**: 5-20% based on volume tiers
• **Documentation**: Requires competitive justification
• **Best for**: Large deals with significant volume commitments

## Strategic Price Adjustments
**Description**: Custom pricing for strategic market opportunities
• **Eligibility**: Strategic accounts, new market entry
• **Approval**: VP or C-level depending on scope
• **Limit**: Determined case-by-case
• **Documentation**: Requires strategic value assessment and executive sponsorship
• **Best for**: Market disruption plays or strategic account acquisition

> **Pro Tip**: Financial incentives often have the most stringent approval requirements. Start the approval process early and gather strong justification data.`,
  
  // Product Incentives
  productIncentives: `# Product Incentives

MIQ offers these product-based incentives to enhance deal value beyond discounting.

## Feature Access
**Description**: Early or exclusive access to new platform features
• **Eligibility**: Strategic customers, deals >$75,000
• **Approval**: Product team and engineering
• **Limitations**: Subject to technical feasibility and roadmap alignment
• **Documentation**: Requires technical assessment and release timing analysis
• **Best for**: Innovation-focused customers who want cutting-edge capabilities

## Integration Services
**Description**: Custom integration support beyond standard offerings
• **Eligibility**: Multi-year contracts, deals >$50,000
• **Approval**: Technical director
• **Resource Allocation**: Up to 40 hours of engineering time
• **Documentation**: Requires integration specifications and resource plan
• **Best for**: Customers with complex technical environments needing custom connectors

## Platform Customizations
**Description**: Tailored UI/UX or functionality specific to customer needs
• **Eligibility**: Enterprise customers, deals >$150,000
• **Approval**: Product VP and CTO
• **Structure**: Custom development within platform architecture
• **Documentation**: Requires detailed specifications and product roadmap assessment
• **Best for**: Enterprise deals where specific workflow or branding needs exist

## Extended API Access
**Description**: Higher rate limits and access to advanced APIs
• **Eligibility**: Technology partners and high-volume customers
• **Approval**: Platform team lead
• **Structure**: Tiered access levels based on deal size
• **Documentation**: Requires API usage projections and use case documentation
• **Best for**: Integration partners and customers building on our platform

## Beta Program Inclusion
**Description**: Priority inclusion in beta testing for new products
• **Eligibility**: All customers willing to provide feedback
• **Approval**: Product manager
• **Structure**: Formalized beta testing agreement
• **Documentation**: Requires beta participant agreement
• **Best for**: Forward-thinking customers who want to shape product direction

> **Pro Tip**: Product incentives require coordination with technical teams. Consult with product management before promising specific features or customizations.`,
  
  // Resource Incentives
  resourceIncentives: `# Resource Incentives

MIQ offers these resource-based incentives to enhance customer success and adoption.

## Technical Resources
**Description**: Dedicated technical account manager or implementation specialist
• **Eligibility**: Deals >$50,000
• **Approval**: Technical services manager
• **Duration**: Typically 30-90 days post-implementation
• **Documentation**: Requires resource allocation request and project plan
• **Best for**: Complex implementations requiring specialized technical expertise

## Training & Development
**Description**: Custom training programs for customer teams
• **Eligibility**: All customers
• **Approval**: Team lead
• **Standard Allocation**: 2-8 hours based on deal size
• **Documentation**: Requires training needs assessment
• **Best for**: Ensuring customer adoption and platform proficiency

## Consultative Services
**Description**: Business strategy and optimization consulting
• **Eligibility**: Deals >$100,000
• **Approval**: Director level
• **Scope**: Defined by Statement of Work
• **Documentation**: Requires consulting SOW with deliverables
• **Best for**: Customers seeking strategic guidance beyond technical implementation

## Dedicated Support
**Description**: Enhanced support package with priority handling
• **Eligibility**: Enterprise deals >$200,000
• **Approval**: Support director
• **Features**: Faster SLAs, named support contacts, priority issue resolution
• **Documentation**: Requires support tier assignment
• **Best for**: Mission-critical implementations with high uptime requirements

## Executive Sponsorship
**Description**: C-level executive assigned as strategic sponsor
• **Eligibility**: Strategic accounts >$500,000
• **Approval**: C-level executive
• **Structure**: Quarterly business reviews with executive participation
• **Documentation**: Requires executive commitment letter
• **Best for**: Strategic partnerships and enterprise relationships

> **Pro Tip**: Resource incentives are subject to team availability and capacity planning. Always check resource availability before committing to specific timeframes.`,
  
  // General Incentives Overview
  generalIncentives: `# Incentive Programs Overview

MIQ offers three main categories of incentives to support your deals.

## Categories of Incentives

### Financial Incentives
• Added Value Media (up to 10% of deal value)
• Revenue Share (5-15% based on volume)
• Performance Bonuses (tied to KPIs)
• Volume Discounts (5-20% based on commitment)
• Strategic Price Adjustments (for market entry)

### Product Incentives
• Early Feature Access
• Integration Services
• Platform Customizations
• Extended API Access
• Beta Program Inclusion

### Resource Incentives
• Technical Resources
• Training & Development
• Consultative Services
• Dedicated Support
• Executive Sponsorship

## Choosing the Right Incentive
• **Consider customer priorities**: What does the customer value most?
• **Assess deal stage**: Different incentives work better at different stages
• **Evaluate competition**: What will differentiate our offer?
• **Calculate impact**: Which incentive provides the best ROI?
• **Check eligibility**: Ensure the deal qualifies for chosen incentives

## Incentive Combinations
Incentives can be combined strategically, typically following these guidelines:
• Maximum of two incentive types per deal
• Total incentive value capped at 25% of deal value
• Mix of different categories often more effective than multiple from same category

## Requesting Incentives
1. Determine appropriate incentives based on deal specifics
2. Document justification for each requested incentive
3. Submit through Deal Submission form
4. Prepare for approval discussions
5. Adjust based on approver feedback

> **Pro Tip**: When possible, offer incentives that add value rather than reduce price, as they protect margin while still providing customer benefits.`,
  
  //=======================================================================================
  // ELIGIBILITY & APPROVAL INFORMATION
  //=======================================================================================
  
  // Eligibility Requirements
  eligibilityRequirements: `# Incentive Eligibility Requirements

Eligibility for MIQ incentive programs is determined by multiple factors.

## Deal Size Thresholds
• **Standard Threshold Tiers**:
  - Tier 1: Deals $25,000-$49,999
  - Tier 2: Deals $50,000-$99,999
  - Tier 3: Deals $100,000-$249,999
  - Tier 4: Deals $250,000+

• **Incentive Availability by Tier**:
  - Tier 1: Limited resource incentives only
  - Tier 2: Most resource incentives, limited product incentives
  - Tier 3: All resource and product incentives, limited financial incentives
  - Tier 4: Full access to all incentive programs

## Customer Tier Classification
• **Gold Partners/Customers**:
  - Classification criteria: $1M+ annual revenue or strategic market position
  - Benefits: Access to all incentive programs
  - Special considerations: Expedited approval process

• **Silver Partners/Customers**:
  - Classification criteria: $250K-$999K annual revenue
  - Benefits: Limited access to financial incentives, full access to others
  - Special considerations: Quarterly incentive quota

• **Bronze Partners/Customers**:
  - Classification criteria: <$250K annual revenue
  - Benefits: Primarily eligible for resource incentives
  - Special considerations: Focused on growth incentives

## Contract Length Factors
• **1-year contracts**: Standard incentive levels
• **2-year contracts**: +25% incentive value or access to next tier
• **3+ year contracts**: +40% incentive value or access to next tier
• **Multi-phase contracts**: Evaluated based on total contract value

## Strategic Alignment Considerations
Deals that align with these strategic priorities receive preferential treatment:
• Expansion into target industries
• Platform adoption of strategic products
• Competitive displacements
• Reference-able implementations
• Innovation partnerships

## Eligibility Determination Process
1. Initial assessment by sales representative
2. Verification by Deal Desk during submission
3. Final determination by approving authority
4. Appeals process available for edge cases

> **Pro Tip**: When in doubt about eligibility, consult with your Deal Desk representative before promising specific incentives to customers.`,
  
  // Approval Process
  approvalProcess: `# Incentive Approval Process

The approval process ensures proper governance while enabling deal closure.

## Approval Workflow
1. **Incentive Request**: Sales submits via Deal Submission form
2. **Initial Review**: Deal Desk checks eligibility and documentation
3. **Financial Review**: Finance assesses margin impact
4. **Technical Review**: Product/Engineering evaluates technical incentives
5. **Decision Authority**: Final approver based on approval matrix
6. **Documentation**: Approval recorded in deal record
7. **Communication**: Approval status sent to requestor

## Approval Roles and Responsibilities
• **Sales Representative**: Submits properly documented requests
• **Deal Desk**: Validates eligibility and routes approvals
• **Finance Team**: Assesses financial impact
• **Product/Engineering**: Reviews technical feasibility
• **Approvers**: Evaluate strategic alignment and business case

## Common Approval Challenges
• **Incomplete Documentation**: Submit thorough business justification
• **Margin Impact**: Demonstrate long-term value beyond immediate deal
• **Technical Feasibility**: Consult product team before submission
• **Precedent Concerns**: Address uniqueness of situation
• **Budget Constraints**: Consider timing and resource availability

## Expedited Approval
For urgent deals, expedited approval may be requested:
1. Mark deal as "High Priority" in submission
2. Add [URGENT] to deal name
3. Contact Deal Desk manager directly
4. Provide clear business justification for urgency
5. Be available to answer questions quickly

## Approval Tracking
• All approvals documented in deal record
• Approval history visible to all stakeholders
• Conditional approvals tracked with requirements
• Approval expiration dates enforced (typically 60 days)

> **Pro Tip**: For complex or unusual incentive requests, schedule a pre-review with key stakeholders before formal submission to address potential concerns.`,
  
  //=======================================================================================
  // DOCUMENTATION REQUIREMENTS
  //=======================================================================================
  
  // Documentation Requirements
  documentationRequirements: `# Deal Documentation Requirements

The following documentation is required for deal submission and approval.

## Core Deal Documents
1. **Deal Submission Form**
   • Purpose: Captures all essential deal details
   • Required fields: Customer info, products, pricing, term
   • Template: Available in Deal Portal
   • Responsibility: Sales Representative

2. **Customer Requirements Document**
   • Purpose: Documents customer needs and expectations
   • Required sections: Business needs, success criteria, technical requirements
   • Template: Available in Help Resources
   • Responsibility: Sales with customer input

3. **Statement of Work (SOW)**
   • Purpose: Defines services scope and deliverables
   • When required: Any deal with service components
   • Template: Available by service type in Legal Portal
   • Responsibility: Solutions Consultant or Services Team

4. **Business Justification**
   • Purpose: Explains rationale for non-standard terms
   • When required: Discounts >10%, non-standard terms
   • Template: Available in Deal Portal
   • Responsibility: Sales Representative

## Supporting Documentation
5. **Approval Documentation**
   • Purpose: Evidence of proper approvals for special terms
   • Format: Email approvals or signed approval forms
   • Storage: Attached to deal record
   • Responsibility: Deal Desk to verify

6. **Technical Assessment**
   • Purpose: Validates feasibility of technical requirements
   • When required: Custom development, integrations
   • Template: Available in Technical Portal
   • Responsibility: Solutions Engineer

7. **Legal Review Memo**
   • Purpose: Identifies legal risks in contract modifications
   • When required: Any contract language changes
   • Format: Standard memo from Legal team
   • Responsibility: Legal Department

## Document Management
• All documents must be uploaded to the deal record
• Naming convention: [Deal ID]_[Document Type]_[Version]
• Version control required for documents with multiple revisions
• Documents must be in PDF format for final versions
• Retention policy: 7 years from deal closure

## Documentation Best Practices
• Use standard templates whenever possible
• Be comprehensive but concise
• Focus on relevant information for approvers
• Update documents when deal parameters change
• Ensure customer expectations match documentation

> **Pro Tip**: Use our templates (available in the Help Resources section) to ensure faster processing and reduce back-and-forth communications.`,

  //=======================================================================================
  // OTHER INFORMATION
  //=======================================================================================
  
  // Urgent Deals
  urgentDeals: `# Handling Urgent Deals

For time-sensitive opportunities, follow these specific protocols.

## Identifying Urgent Deals
Valid reasons for urgent status:
• Competitive threat with defined deadline
• End of customer budget period (use only within 2 weeks of deadline)
• Legal or regulatory requirement with fixed date
• Executive-sponsored strategic opportunity

## Urgent Deal Process
1. Mark "High Priority" in the submission form
2. Add [URGENT] to the beginning of the deal name
3. Contact your regional Deal Desk manager directly
4. Complete the Urgent Deal Justification form
5. Be available via phone/email during review process

## Expedited Review Timeline
• Initial screening: Within 2 business hours
• Commercial review: Within 4 business hours
• Full approval cycle: Within 1 business day
• Contract generation: Within 4 business hours after approval

## Documentation Requirements
Urgent deals require the same documentation as standard deals, but with these additions:
• Urgent Deal Justification Form
• Evidence of deadline (customer communication, RFP deadline, etc.)
• Executive sponsor (for strategic opportunities)

## Important Limitations
• Maximum of 3 urgent deals per quarter per sales representative
• Urgent status can be declined if justification is insufficient
• Repeated non-genuine urgent requests may affect future requests
• All urgent deals are reported to sales leadership weekly

> **Pro Tip**: For genuine urgent situations, a brief call with the Deal Desk manager can significantly expedite the process.`,

  // Growth Opportunities
  growthOpportunities: `# Growth Opportunity Incentives

Growth opportunities qualify for enhanced incentives to reward expansion.

## Qualifying Growth Scenarios
• **New Market Entry**: Expanding to new geographic regions or industries
• **Contract Value Increase**: Growing existing contracts by at least 20%
• **Term Extension**: Extending contract duration beyond initial term
• **Product Expansion**: Adding new product lines to existing contracts
• **Strategic Alignment**: Deals that align with quarterly strategic focus areas

## Enhanced Incentive Structure
• **Financial Growth Incentives**:
  - Additional 5% discount authority
  - Performance-based rewards up to 10% of incremental value
  - Extended payment terms (Net-60 vs standard Net-30)

• **Product Growth Incentives**:
  - Priority feature requests consideration
  - Extended beta access to new capabilities
  - Custom integration hours increased by 50%

• **Resource Growth Incentives**:
  - Executive sponsorship program eligibility
  - Additional implementation support hours
  - Dedicated customer success manager

## Documentation Requirements
• Growth Opportunity Assessment Form
• Baseline metrics from existing contract
• Projected growth metrics and timeline
• Customer expansion strategy document
• Competitive analysis (if applicable)

## Approval Considerations
• Clear demonstration of incremental value
• Sustainable growth metrics (not one-time spike)
• Strategic alignment with company priorities
• Resource availability for support
• Long-term profitability analysis

> **Pro Tip**: Document the growth opportunity clearly in the "Strategic Value" section of the deal submission form, with quantifiable metrics whenever possible.`,

  //=======================================================================================
  // STANDARD RESPONSES
  //=======================================================================================
  
  // General/Default Responses
  generalResponse: `I notice you're asking about MIQ's commercial deal process. Our process is designed to support you through every stage from scoping to execution. 

I can help with information about:
• Deal stages and requirements
• Incentive programs and eligibility
• Documentation and approval workflows
• Special situations (urgent deals, growth opportunities)

For more specific information, please ask about a particular aspect of the deal process that you'd like to learn more about.`,
  
  defaultResponse: `Thanks for your question about MIQ's commercial deal process. I'm here to help with information about deal workflows, incentive programs, eligibility requirements, and documentation needs. 

Could you provide more specific details about what you're looking for? For example:
• A particular deal stage
• Specific incentive programs
• Approval processes
• Documentation requirements`
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