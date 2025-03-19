import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon,
} from "lucide-react";

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

export default function DealAssistantChatbot() {
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