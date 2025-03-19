import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileTextIcon, 
  BuildingIcon, 
  TrendingUpIcon, 
  ClipboardIcon, 
  LifeBuoyIcon, 
  MessageSquareIcon,
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

enum TabTypes {
  GUIDES = "guides",
  TEMPLATES = "templates",
  FAQ = "faq",
  TRAINING = "training"
}

// Define Message type for chat
type Message = {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
};

// Sample predefined quick questions
const quickQuestions = [
  "How are deal incentives calculated?",
  "What is the approval process for discounts?",
  "How do I submit an urgent deal?",
  "What growth opportunities qualify for incentives?"
];

// Chatbot Component
function DealAssistantChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi there! I\'m the Deal Assistant. How can I help you with deal processes or incentives today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Toggle chat open/closed
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle sending a message
  const handleSendMessage = (text: string = inputText) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: text,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setInputText('');
    
    // Simulate bot response after a delay
    setTimeout(() => {
      let botResponse = '';
      
      // Very simple response logic based on keywords
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('incentive') || lowerText.includes('bonus')) {
        botResponse = 'Deal incentives are calculated based on total deal value, contract length, and growth metrics. Standard deals have a 2% incentive, while strategic deals can qualify for up to 5% incentives with proper approval.';
      } else if (lowerText.includes('discount') || lowerText.includes('approval')) {
        botResponse = 'Discount approval follows a tiered process: up to 10% can be approved by team leads, 10-20% by managers, and anything over 20% requires director approval. All discounts must be documented with business justification.';
      } else if (lowerText.includes('urgent') || lowerText.includes('fast track')) {
        botResponse = 'For urgent deals, mark "High Priority" in the submission form and add [URGENT] to the deal name. Contact your regional deal desk manager directly and provide the specific deadline.';
      } else if (lowerText.includes('growth') || lowerText.includes('opportunit')) {
        botResponse = 'Growth opportunities that qualify for incentives include: expanding to new markets, increasing contract value by at least 20%, extending contract terms beyond 24 months, or adding new product lines to existing contracts.';
      } else {
        botResponse = 'Thanks for your question. For specific details about this topic, I recommend checking our documentation in the Guides section or reaching out to your deal desk manager.';
      }
      
      const botMessage: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };
  
  // Handle quick question selection
  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };
  
  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 rounded-full p-3 shadow-lg transition-all duration-300 focus:outline-none ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-primary hover:bg-primary/90'
        }`}
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
      >
        {isOpen ? (
          <XIcon className="h-6 w-6 text-white" />
        ) : (
          <MessageCircleIcon className="h-6 w-6 text-white" />
        )}
      </button>
      
      {/* Chat panel */}
      <div className={`fixed bottom-20 right-6 w-80 md:w-96 bg-white rounded-lg shadow-xl transition-all duration-300 transform z-50 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      }`}>
        {/* Chat header */}
        <div className="bg-primary text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center">
            <BotIcon className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Deal Assistant</h3>
          </div>
          <button 
            onClick={toggleChat} 
            className="text-white hover:text-slate-200 focus:outline-none"
            aria-label="Close chat"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Chat messages */}
        <div className="p-4 h-80 overflow-y-auto">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.sender === 'bot' && <BotIcon className="h-3 w-3 mr-1" />}
                  {message.sender === 'user' && <UserIcon className="h-3 w-3 mr-1" />}
                  <span className="text-xs">
                    {message.sender === 'user' ? 'You' : 'Deal Assistant'}
                  </span>
                </div>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick questions */}
        <div className="px-4 py-2 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2">Popular questions:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-full"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
        
        {/* Chat input */}
        <div className="p-3 border-t border-slate-200 flex items-center">
          <Input 
            type="text" 
            placeholder="Type your question here..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            className="rounded-r-none focus-visible:ring-0"
          />
          <Button 
            onClick={() => handleSendMessage()}
            className="rounded-l-none"
            size="sm"
            variant="default"
            type="button"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

export default function HelpResources() {
  const [activeTab, setActiveTab] = useState<TabTypes>(TabTypes.GUIDES);
  
  return (
    <div className="p-6 relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Help & Resources</h1>
        <p className="mt-1 text-sm text-slate-500">Find guidance and resources to help you manage deals effectively</p>
      </div>
      
      {/* Help Tabs */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button 
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === TabTypes.GUIDES
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )} 
              onClick={() => setActiveTab(TabTypes.GUIDES)}
            >
              Guides & Documentation
            </button>
            <button 
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === TabTypes.TEMPLATES
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )} 
              onClick={() => setActiveTab(TabTypes.TEMPLATES)}
            >
              Templates & Forms
            </button>
            <button 
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === TabTypes.FAQ
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )} 
              onClick={() => setActiveTab(TabTypes.FAQ)}
            >
              FAQ
            </button>
            <button 
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === TabTypes.TRAINING
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )} 
              onClick={() => setActiveTab(TabTypes.TRAINING)}
            >
              Training
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {/* Guides & Documentation Tab */}
        {activeTab === TabTypes.GUIDES && (
          <Card>
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Guides & Documentation</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <GuideCard 
                  icon={<FileTextIcon className="h-6 w-6 text-primary" />}
                  title="Deal Submission Guide"
                  description="Complete walkthrough of the deal submission process, including required information and best practices."
                />
                
                <GuideCard 
                  icon={<BuildingIcon className="h-6 w-6 text-primary" />}
                  title="Pricing Guidelines"
                  description="Learn about standard pricing models, discount thresholds, and approval requirements for different deal types."
                />
                
                <GuideCard 
                  icon={<TrendingUpIcon className="h-6 w-6 text-primary" />}
                  title="Deal Approval Workflow"
                  description="Understand the approval process, stakeholders involved, and expected timelines for different deal sizes."
                />
                
                <GuideCard 
                  icon={<ClipboardIcon className="h-6 w-6 text-primary" />}
                  title="Contract Terms Reference"
                  description="Reference guide for standard contract terms, clauses, and conditions for different deal types."
                />
                
                <GuideCard 
                  icon={<LifeBuoyIcon className="h-6 w-6 text-primary" />}
                  title="Support Request Guide"
                  description="How to effectively request support for deal scoping, technical requirements, or pricing assistance."
                />
                
                <GuideCard 
                  icon={<MessageSquareIcon className="h-6 w-6 text-primary" />}
                  title="Client Communication Guide"
                  description="Best practices for communicating with clients throughout the deal process, from scoping to close."
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Templates & Forms Tab */}
        {activeTab === TabTypes.TEMPLATES && (
          <Card>
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Templates & Forms</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <TemplateItem 
                  title="Statement of Work Template"
                  fileType="DOCX"
                  fileSize="256 KB"
                  description="Standard SOW template for professional services engagements"
                />
                
                <TemplateItem 
                  title="Pricing Calculator"
                  fileType="XLSX"
                  fileSize="124 KB"
                  description="Excel calculator for standard pricing models and discounts"
                />
                
                <TemplateItem 
                  title="Client Requirements Form"
                  fileType="PDF"
                  fileSize="87 KB"
                  description="Form to gather detailed client requirements for custom solutions"
                />
                
                <TemplateItem 
                  title="Deal Risk Assessment"
                  fileType="DOCX"
                  fileSize="134 KB"
                  description="Template for assessing and documenting potential deal risks"
                />
                
                <TemplateItem 
                  title="Implementation Timeline"
                  fileType="XLSX"
                  fileSize="156 KB"
                  description="Project timeline template for implementation phases"
                />
                
                <TemplateItem 
                  title="Service Level Agreement"
                  fileType="DOCX"
                  fileSize="275 KB"
                  description="Standard SLA template with customizable service metrics"
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* FAQ Tab */}
        {activeTab === TabTypes.FAQ && (
          <Card>
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Frequently Asked Questions</h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-6">
                <FaqItem 
                  question="How long does the deal approval process typically take?"
                  answer="The approval timeline varies based on deal size and complexity. Standard deals under $50,000 are typically approved within 1-2 business days. Deals between $50,000-$250,000 may take 2-4 business days. Deals over $250,000 or with non-standard terms can take 5+ business days and may require executive review."
                />
                
                <FaqItem 
                  question="What information is required for a deal submission?"
                  answer="At minimum, you must provide the client name, deal type, total value, contract duration, and basic deal description. For faster approval, we recommend including detailed pricing breakdowns, client requirements, and any special terms or conditions being requested."
                />
                
                <FaqItem 
                  question="How do I request a non-standard discount?"
                  answer="Non-standard discounts (exceeding your approval threshold) require additional approval. Submit the deal with your proposed discount and include a business justification in the notes section. The system will automatically route it to the appropriate approver based on the discount amount."
                />
                
                <FaqItem 
                  question="Can I edit a deal after submission?"
                  answer="You can edit a deal while it's still in 'Draft' status. Once submitted, you can't directly edit the deal, but you can request changes by contacting your deal desk representative with the deal ID and the specific edits needed."
                />
                
                <FaqItem 
                  question="What should I do if a deal is urgent?"
                  answer="For truly urgent deals, mark the priority as 'High' during submission and add [URGENT] to the beginning of the deal name. Also, reach out directly to your regional deal desk manager to notify them of the urgent request."
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Training Tab */}
        {activeTab === TabTypes.TRAINING && (
          <Card>
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900">Training Resources</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <TrainingCourse 
                  title="Deal Desk Fundamentals"
                  description="A comprehensive overview of the deal desk process, submission guidelines, and approval workflows."
                  duration="45 minutes"
                />
                
                <TrainingCourse 
                  title="Advanced Pricing Strategies"
                  description="Learn how to structure complex deals, apply multi-year discounts, and handle special pricing scenarios."
                  duration="60 minutes"
                />
                
                <TrainingCourse 
                  title="Contract Negotiation Basics"
                  description="Understand the key components of contracts, common negotiation points, and how to structure favorable terms."
                  duration="55 minutes"
                />
                
                <TrainingCourse 
                  title="Deal Desk System Tour"
                  description="A guided tour of the deal desk platform with step-by-step instructions for all major features."
                  duration="30 minutes"
                />
              </div>
              
              <div className="mt-6 text-center">
                <a href="#" className="text-primary hover:text-blue-700 text-sm font-medium">View All Training Resources →</a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Guide Card Component
function GuideCard({ icon, title, description }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string 
}) {
  return (
    <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
      <div className="p-5">
        <div className="flex items-center mb-3">
          {icon}
          <h4 className="ml-2 text-base font-medium text-slate-900">{title}</h4>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          {description}
        </p>
        <a href="#" className="text-primary hover:text-blue-700 text-sm font-medium">View Guide →</a>
      </div>
    </div>
  );
}

// Template Item Component
function TemplateItem({ title, fileType, fileSize, description }: {
  title: string,
  fileType: string,
  fileSize: string,
  description: string
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
        <div className="ml-3">
          <h4 className="text-sm font-medium text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{fileType}, {fileSize}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 mb-3">{description}</p>
      <a href="#" className="text-primary hover:text-blue-700 text-sm">Download</a>
    </div>
  );
}

// FAQ Item Component
function FaqItem({ question, answer, showDivider = true }: {
  question: string,
  answer: string,
  showDivider?: boolean
}) {
  return (
    <div className={showDivider ? "pt-4 border-t border-slate-200" : ""}>
      <h4 className="text-base font-medium text-slate-900">{question}</h4>
      <p className="mt-2 text-sm text-slate-600">
        {answer}
      </p>
    </div>
  );
}

// Training Course Component
function TrainingCourse({ title, description, duration }: {
  title: string,
  description: string,
  duration: string
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="h-40 bg-slate-100 flex items-center justify-center">
        <svg className="h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </div>
      <div className="p-4">
        <h4 className="text-base font-medium text-slate-900">{title}</h4>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">Duration: {duration}</span>
          <a href="#" className="text-primary hover:text-blue-700 text-sm font-medium">Start Course</a>
        </div>
      </div>
    </div>
  );
}
