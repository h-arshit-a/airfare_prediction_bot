import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Plane } from 'lucide-react';
import FlightResultCard from './FlightResultCard';
import { parseFlightSearchCommand } from '@/services/chatbotService';
import { searchFlights } from '@/services/flightService';

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
}


interface ChatMessageProps {
  message: Message;
  onFlightSearch?: (command: any) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onFlightSearch }) => {
  const isUser = message.type === 'user';
  const searchProcessed = useRef(false);
  
  // Process flight search command only once
  useEffect(() => {
    // Skip if it's a user message, already processed, or no handler
    if (isUser || !onFlightSearch || searchProcessed.current) return;
    
    // Check for flight search command
    const searchCommand = parseFlightSearchCommand(message.content);
    if (searchCommand) {
      console.log(`Processing flight search command for message ${message.id}:`, searchCommand);
      searchProcessed.current = true;
      
      // Trigger flight search after a slight delay to avoid React rendering issues
      setTimeout(() => {
        onFlightSearch(searchCommand);
      }, 50);
    }
    
    // This effect should only run once per message
  }, [message.id, isUser, onFlightSearch]);
  
  // Process bot message content for special formatting
  const renderContent = () => {
    // Remove flight search commands from displayed text
    const content = message.content.replace(/<flight-search.*?\/>/, '');
    
    // Process flight results if present
    if (content.includes('<flight-results>')) {
      console.log("Found flight-results tag in message:", message.id);
      
      try {
        const beforeResults = content.split('<flight-results>')[0];
        const afterResults = content.split('</flight-results>')[1] || '';
        const resultsSection = content.match(/<flight-results>(.*?)<\/flight-results>/s);
        
        console.log("Results section found:", !!resultsSection);
        
        if (resultsSection) {
          const flightData = resultsSection[1].match(/<flight>(.*?)<\/flight>/gs);
          console.log("Number of flights found:", flightData ? flightData.length : 0);
          
          if (!flightData || flightData.length === 0) {
            console.warn("No flight data found in results section");
            return (
              <>
                <p>{beforeResults.trim()}</p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md my-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    I encountered an issue while preparing your flight results. 
                    Please try your search again with a different route or date.
                  </p>
                </div>
                <p>{afterResults.trim()}</p>
              </>
            );
          }
          
          // Parse the flights
          const flights = flightData.map(flightStr => {
            // Extract flight details (ensure tags match chatbotService)
            const airline = flightStr.match(/<airline>(.*?)<\/airline>/)?.[1] || 'Unknown Airline';
            const flightNumber = flightStr.match(/<flight_number>(.*?)<\/flight_number>/)?.[1] || 'Unknown';
            const departureTime = flightStr.match(/<departure_time>(.*?)<\/departure_time>/)?.[1] || 'TBD';
            const arrivalTime = flightStr.match(/<arrival_time>(.*?)<\/arrival_time>/)?.[1] || 'TBD';
            const departureIso = flightStr.match(/<departure_iso>(.*?)<\/departure_iso>/)?.[1] || '';
            const arrivalIso = flightStr.match(/<arrival_iso>(.*?)<\/arrival_iso>/)?.[1] || '';
            const duration = flightStr.match(/<duration>(.*?)<\/duration>/)?.[1] || 'Unknown';
            const price = flightStr.match(/<price>(.*?)<\/price>/)?.[1] || 'Unknown';
            
            return {
              airline,
              flightNumber,
              departureTime,
              arrivalTime,
              departureIso,
              arrivalIso,
              duration,
              price
            };
          });
          
          // Render the flights
          return (
            <>
              <p className="mb-4">{beforeResults.trim()}</p>
              <div className="space-y-0 my-4">
                {flights.map((flight, index) => (
                  <FlightResultCard key={`${message.id}-flight-${index}`} flight={flight} index={index} />
                ))}
              </div>
              <p className="mt-4">{afterResults.trim()}</p>
            </>
          );
        }
      } catch (error) {
        console.error("Error parsing flight results:", error);
        return (
          <div>
            <p>{content}</p>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md my-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                There was an error processing the flight results. Please try your search again.
              </p>
            </div>
          </div>
        );
      }
    }
    
    // For regular text content
    return content;
  };
  
  return (
    <div className={cn(
      "chat-bubble",
      isUser ? "chat-bubble-user" : "chat-bubble-bot",
    )}>
      {!isUser && (
        <div className="flex items-center mb-1 font-semibold text-sm">
          <Plane className="h-4 w-4 mr-1" />
          Flight Friend
        </div>
      )}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default ChatMessage;
