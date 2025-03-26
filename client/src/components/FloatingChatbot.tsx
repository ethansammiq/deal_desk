import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  Loader2Icon,
  TrashIcon,
  ClipboardCopyIcon,
  InfoIcon,
  LightbulbIcon,
  SettingsIcon
} from "lucide-react";
import { useChat } from '@/lib/chat-context';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

interface FloatingChatbotProps {
  title?: string;
  subtitle?: string;
  iconUrl?: string;
  primaryColor?: string;
  bubblePosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  bubbleSize?: 'small' | 'medium' | 'large';
  avatarUrl?: string;
  showTimestamps?: boolean;
}

export default function FloatingChatbot({
  title = "DealGenie",
  subtitle = "Ask me about deals & incentives",
  iconUrl,
  primaryColor,
  bubblePosition = 'bottom-right',
  bubbleSize = 'medium',
  avatarUrl,
  showTimestamps = false
}: FloatingChatbotProps) {
  const { messages, sendMessage, clearChatHistory, isLoading, suggestedQuestions, model } = useChat();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Function to copy message to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard",
        duration: 2000,
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Could not copy text. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    });
  };
  
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
  
  // Calculate position classes based on bubblePosition
  const getBubblePositionClasses = () => {
    switch (bubblePosition) {
      case 'bottom-left':
        return { button: 'bottom-6 left-6', panel: 'bottom-20 left-6' };
      case 'top-right':
        return { button: 'top-6 right-6', panel: 'top-20 right-6' };
      case 'top-left':
        return { button: 'top-6 left-6', panel: 'top-20 left-6' };
      case 'bottom-right':
      default:
        return { button: 'bottom-6 right-6', panel: 'bottom-20 right-6' };
    }
  };
  
  // Calculate size classes based on bubbleSize
  const getBubbleSizeClasses = () => {
    switch (bubbleSize) {
      case 'small':
        return { button: 'p-2', icon: 'h-4 w-4', panel: 'w-72 md:w-80' };
      case 'large':
        return { button: 'p-4', icon: 'h-8 w-8', panel: 'w-96 md:w-[30rem]' };
      case 'medium':
      default:
        return { button: 'p-3', icon: 'h-6 w-6', panel: 'w-80 md:w-96' };
    }
  };
  
  const positionClasses = getBubblePositionClasses();
  const sizeClasses = getBubbleSizeClasses();
  
  // Custom color style
  const customColorStyle = primaryColor ? { 
    '--custom-primary-color': primaryColor,
  } as React.CSSProperties : {};

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={toggleChat}
        style={customColorStyle}
        className={`fixed ${positionClasses.button} rounded-full ${sizeClasses.button} shadow-lg transition-all duration-300 focus:outline-none ${
          isOpen ? 'bg-red-500 rotate-90' : primaryColor ? 'bg-[var(--custom-primary-color)] hover:bg-[var(--custom-primary-color)]/90' : 'bg-primary hover:bg-primary/90'
        }`}
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
      >
        {isOpen ? (
          <XIcon className={`${sizeClasses.icon} text-white`} />
        ) : (
          iconUrl ? (
            <img src={iconUrl} alt="Chat" className={sizeClasses.icon} />
          ) : (
            <MessageCircleIcon className={`${sizeClasses.icon} text-white`} />
          )
        )}
      </button>
      
      {/* Chat panel */}
      <div 
        style={customColorStyle}
        className={`fixed ${positionClasses.panel} ${sizeClasses.panel} bg-white rounded-lg shadow-xl transition-all duration-300 transform z-50 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}>
        {/* Chat header */}
        <div className={primaryColor ? 'bg-[var(--custom-primary-color)] text-white p-4 rounded-t-lg flex justify-between items-center' : 'bg-primary text-white p-4 rounded-t-lg flex justify-between items-center'}>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="font-medium flex items-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={title} className="h-6 w-6 rounded-full mr-2 object-cover" />
                ) : (
                  <BotIcon className="h-5 w-5 mr-2" />
                )}
                {title}
              </h3>
              {/* AI Model Indicator */}
              <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded-sm">
                {model === 'advanced' ? 'Pro AI' : 'Basic AI'}
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-white/80 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Clear history button */}
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your chat history?')) {
                  clearChatHistory();
                  toast({
                    title: "Chat history cleared",
                    description: "All messages have been removed",
                    duration: 2000,
                  });
                }
              }} 
              className="text-white/70 hover:text-white focus:outline-none"
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={toggleChat} 
              className="text-white hover:text-slate-200 focus:outline-none"
              aria-label="Close chat"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Chat messages */}
        <div className="p-3 h-96 overflow-y-auto">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-2 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                style={message.sender === 'user' && primaryColor ? {backgroundColor: primaryColor} : {}}
                className={`max-w-[85%] rounded-lg px-3 py-1.5 group relative ${
                  message.sender === 'user' 
                    ? primaryColor ? 'text-white rounded-tr-none' : 'bg-primary text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Message header */}
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center">
                    {message.sender === 'bot' && (avatarUrl ? 
                      <img src={avatarUrl} alt={title} className="h-3 w-3 rounded-full mr-1 object-cover" /> :
                      <BotIcon className="h-3 w-3 mr-1" />)}
                    {message.sender === 'user' && <UserIcon className="h-3 w-3 mr-1" />}
                    <span className="text-xs">
                      {message.sender === 'user' ? 'You' : title}
                    </span>
                    {showTimestamps && (
                      <span className="text-xs ml-2 opacity-50">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  
                  {/* Message actions - visible on hover */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    message.sender === 'user' ? 'text-white/70' : 'text-slate-500'
                  }`}>
                    <button 
                      onClick={() => copyToClipboard(message.text)}
                      className="p-1 hover:bg-white/10 rounded"
                      title="Copy message"
                      aria-label="Copy message"
                    >
                      <ClipboardCopyIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                {/* Message content */}
                <div className="text-sm prose prose-sm max-w-none">
                  {message.sender === 'user' ? (
                    <p className="whitespace-pre-wrap text-white m-0">{message.text}</p>
                  ) : (
                    <div className="whitespace-pre-wrap dark:prose-invert prose prose-sm text-[0.9rem]">
                      {/* Apply custom components to fix markdown rendering issues */}
                      <ReactMarkdown
                        components={{
                          // Fix paragraphs with correct spacing
                          p: ({node, children, ...props}) => (
                            <p style={{marginTop: '0.25em', marginBottom: '0.25em', lineHeight: '1.5'}} {...props}>
                              {children}
                            </p>
                          ),
                          // Fix heading spacing
                          h1: ({node, children, ...props}) => (
                            <h1 style={{marginTop: '0.5em', marginBottom: '0.3em', fontWeight: 'bold', fontSize: '1.3em'}} {...props}>
                              {children}
                            </h1>
                          ),
                          h2: ({node, children, ...props}) => (
                            <h2 style={{marginTop: '0.5em', marginBottom: '0.3em', fontWeight: 'bold', fontSize: '1.2em'}} {...props}>
                              {children}
                            </h2>
                          ),
                          h3: ({node, children, ...props}) => (
                            <h3 style={{marginTop: '0.4em', marginBottom: '0.25em', fontWeight: 'bold', fontSize: '1.1em'}} {...props}>
                              {children}
                            </h3>
                          ),
                          // Fix lists with better spacing
                          ul: ({node, ...props}) => <ul style={{marginTop: '0.25em', marginBottom: '0.25em', paddingLeft: '1.2em'}} {...props} />,
                          ol: ({node, ...props}) => <ol style={{marginTop: '0.25em', marginBottom: '0.25em', paddingLeft: '1.2em'}} {...props} />,
                          li: ({node, children, ...props}) => (
                            <li style={{marginBottom: '0.15em', lineHeight: '1.4'}} {...props}>
                              {children}
                            </li>
                          ),
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
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