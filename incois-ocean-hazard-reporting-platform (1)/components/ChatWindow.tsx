import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, getQuickResponses, QuickResponse, ChatMessage } from '../services/chatbotService';
import { Report } from '../types';
import Spinner from './common/Spinner';

interface ChatWindowProps {
  onClose: () => void;
  reports?: Report[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, reports = [] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [showQuickResponses, setShowQuickResponses] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load quick responses on component mount
    loadQuickResponses();
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      message: '',
      response: 'Hello! I\'m your INCOIS Ocean Hazard Assistant. I can help you with ocean safety information, hazard reporting, emergency procedures, and general marine safety questions. How can I assist you today?',
      timestamp: new Date().toISOString(),
      isUser: false
    };
    setMessages([welcomeMessage]);

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollToBottom();
  }, [messages]);

  const loadQuickResponses = async () => {
    try {
      const responses = await getQuickResponses();
      setQuickResponses(responses);
    } catch (error) {
      console.error('Failed to load quick responses:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      response: '',
      timestamp: new Date().toISOString(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowQuickResponses(false);

    try {
      // Create simple context from reports data (keep it very short)
      let reportsContext = '';
      if (reports.length > 0) {
        const verified = reports.filter(r => r.verified).length;
        const rejected = reports.filter(r => r.verificationStatus === 'rejected').length;
        const pending = reports.length - verified - rejected;
        reportsContext = `System: ${reports.length} reports, ${verified} verified, ${pending} pending`;
      }

      const response = await sendChatMessage(message.trim(), reportsContext || undefined);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: '',
        response: response.response,
        timestamp: response.timestamp,
        isUser: false
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: '',
        response: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment, or contact INCOIS support for immediate assistance.',
        timestamp: new Date().toISOString(),
        isUser: false
      };

      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickResponse = (quickResponse: QuickResponse) => {
    handleSendMessage(quickResponse.message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-40 animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <ion-icon name="chatbubble-outline" className="text-sm"></ion-icon>
          </div>
          <div>
            <h3 className="font-semibold text-sm">INCOIS Assistant</h3>
            <p className="text-xs text-blue-200">Ocean Hazard Support</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-blue-200 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <ion-icon name="close-outline" className="text-lg"></ion-icon>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] p-3 rounded-lg text-sm
                ${message.isUser
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                }
              `}
            >
              <div className="whitespace-pre-wrap">
                {message.isUser ? message.message : message.response}
              </div>
              <div
                className={`text-xs mt-2 ${
                  message.isUser ? 'text-blue-200' : 'text-gray-500'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm p-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Spinner size="sm" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Responses */}
        {showQuickResponses && messages.length <= 1 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 font-medium">Quick questions:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickResponses.slice(0, 4).map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => handleQuickResponse(qr)}
                  className="text-left p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs"
                >
                  <div className="font-medium text-blue-600">{qr.title}</div>
                  <div className="text-gray-600 mt-1">{qr.message}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about ocean hazards, safety, or reporting..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <ion-icon name="send-outline" className="text-sm"></ion-icon>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ask me about ocean hazards, safety procedures, or emergency information.
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
