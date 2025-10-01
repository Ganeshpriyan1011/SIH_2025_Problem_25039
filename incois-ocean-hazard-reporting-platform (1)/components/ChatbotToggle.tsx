import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import { Report } from '../types';

interface ChatbotToggleProps {
  reports?: Report[];
}

const ChatbotToggle: React.FC<ChatbotToggleProps> = ({ reports = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <ChatWindow 
          onClose={() => setIsOpen(false)}
          reports={reports}
        />
      )}

      {/* Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className={`
            w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out
            flex items-center justify-center text-white text-xl
            hover:scale-110 hover:shadow-xl
            ${isOpen 
              ? 'bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rotate-45' 
              : 'bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-600 hover:via-teal-600 hover:to-emerald-600'
            }
          `}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <ion-icon name="close-outline"></ion-icon>
          ) : (
            <ion-icon name="chatbubble-outline"></ion-icon>
          )}
        </button>
        
        {/* Notification Badge (optional - for future use) */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </div>
    </>
  );
};

export default ChatbotToggle;
