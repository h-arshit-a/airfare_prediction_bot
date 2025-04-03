import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "@/components/Header";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import { Message } from "@/components/ChatMessage";
import {
  generateChatbotResponse,
  getInitialMessages,
  parseFlightSearchCommand,
} from "@/services/chatbotService";
import {
  searchFlights,
  getFlightDeals,
  Flight,
  FlightSearchParams,
  FlightDeal,
} from "@/services/flightService";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(
    null
  );
  const [flights, setFlights] = useState<Flight[]>([]);
  const [deal, setDeal] = useState<FlightDeal | undefined>(undefined);
  const { toast } = useToast();

  // Initialize with welcome message
  useEffect(() => {
    setMessages(getInitialMessages());
  }, []);

  // Function to reset the chat
  const handleReset = () => {
    setMessages(getInitialMessages());
    setSearchParams(null);
    setFlights([]);
    setDeal(undefined);
  };

  // Function to add a new message to the chat
  const addMessage = (content: string, type: "user" | "bot") => {
    const newMessage: Message = {
      id: uuidv4(),
      content,
      type,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  // Handle sending a message
  const handleSendMessage = async (messageText: string) => {
    // Add user message to chat
    addMessage(messageText, "user");

    // Set loading state while we generate a response
    setLoading(true);

    try {
      // Generate a response based on the user's message
      const response = await generateChatbotResponse(
        messageText,
        searchParams,
        flights
      );

      // Add bot response to chat
      addMessage(response, "bot");

      // We'll let the ChatMessage component handle flight search commands via the onFlightSearch prop
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle flight search from chat
  const handleFlightSearch = async (data: FlightSearchParams) => {
    console.log("Flight search triggered:", data);
    setSearchParams(data);

    setLoading(true);

    try {
      // Search for flights
      console.log(
        `Searching flights from ${data.source} to ${
          data.destination
        } on ${data.date.toDateString()}`
      );
      const flightResults = await searchFlights(data);
      console.log(
        `Found ${flightResults.length} flights, first flight:`,
        flightResults.length > 0 ? flightResults[0] : "none"
      );
      setFlights(flightResults);

      // Generate and add a response about the flight results
      console.log("Generating flight results response");
      const response = await generateChatbotResponse("", data, flightResults);
      console.log(
        `Response length: ${
          response.length
        }, contains flight-results: ${response.includes("<flight-results>")}`
      );

      addMessage(response, "bot");

      // After a delay, simulate finding a deal
      setTimeout(async () => {
        try {
          const dealResult = await getFlightDeals(data);
          if (dealResult) {
            setDeal(dealResult);
          }
        } catch (error) {
          console.error("Error getting flight deal:", error);
        }
      }, 10000); // Show a deal after 10 seconds
    } catch (error) {
      console.error("Error searching for flights:", error);
      toast({
        title: "Error",
        description: "Failed to search for flights. Please try again.",
        variant: "destructive",
      });

      addMessage(
        "Sorry, I encountered an error while searching for flights. Please try again.",
        "bot"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onReset={handleReset} />

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <div className="chat-container w-full">
          <div className="chat-header">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-blue-500"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                  <line x1="10" x2="8" y1="9" y2="9" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-medium">Flight Assistant</h1>
                <p className="text-sm text-gray-500">
                  Ask me about flights, travel tips, and more
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatWindow
              messages={messages}
              loading={loading}
              onFlightSearch={handleFlightSearch}
            />
            <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
