import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  Loader2Icon
} from "lucide-react";
import { useChat } from '@/lib/chat-context';

interface FloatingChatbotProps {
  title?: string;
  subtitle?: string;
  iconUrl?: string;
}

export default function FloatingChatbot({
  title = "Deal Assistant",
  subtitle = "Ask me about deals & incentives",
  iconUrl
}: FloatingChatbotProps) {
  const { messages, sendMessage, isLoading, suggestedQuestions } = useChat();
  const [isOpen, setIsOpen] = useState(false);
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
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };
  
  // Handle quick question selection
  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
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
          iconUrl ? (
            <img src={iconUrl} alt="Chat" className="h-6 w-6" />
          ) : (
            <MessageCircleIcon className="h-6 w-6 text-white" />
          )
        )}
      </button>
      
      {/* Chat panel */}
      <div className={`fixed bottom-20 right-6 w-80 md:w-96 bg-white rounded-lg shadow-xl transition-all duration-300 transform z-50 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      }`}>
        {/* Chat header */}
        <div className="bg-primary text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="font-medium flex items-center">
              <BotIcon className="h-5 w-5 mr-2" />
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-white/80 mt-1">{subtitle}</p>
            )}
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
                    {message.sender === 'user' ? 'You' : title}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-slate-100 text-slate-800 rounded-lg rounded-tl-none px-4 py-2 flex items-center">
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick questions */}
        {suggestedQuestions && suggestedQuestions.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Popular questions:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-full"
                  disabled={isLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat input */}
        <div className="p-3 border-t border-slate-200 flex items-center">
          <Input 
            type="text" 
            placeholder="Type your question here..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            className="rounded-r-none focus-visible:ring-0"
          />
          <Button 
            onClick={handleSendMessage}
            className="rounded-l-none"
            size="sm"
            variant="default"
            type="button"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}