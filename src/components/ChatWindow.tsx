
import React, { useEffect, useRef } from 'react';
import ChatMessage, { Message } from './ChatMessage';
import { ScrollArea } from './ui/scroll-area';

interface ChatWindowProps {
  messages: Message[];
  loading?: boolean;
  onFlightSearch?: (command: any) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading, onFlightSearch }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 h-full rounded-lg border bg-card shadow-sm">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onFlightSearch={onFlightSearch}
          />
        ))}
        
        {loading && (
          <div className="chat-bubble chat-bubble-bot">
            <div className="typing-indicator">
              <span style={{ '--delay': '0ms' } as React.CSSProperties}></span>
              <span style={{ '--delay': '200ms' } as React.CSSProperties}></span>
              <span style={{ '--delay': '400ms' } as React.CSSProperties}></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatWindow;