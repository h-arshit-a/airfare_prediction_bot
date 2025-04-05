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
import AuthButtons from "../components/AuthButtons";
import { ChatHistorySidebar } from "@/components/chat/ChatHistorySidebar";
import { useAuth } from "../context/AuthContext";
import { saveMessage, loadChatHistory } from "../services/chatHistoryService";

// Array of flight facts for the footer
const flightFacts = [
  "Did you know? The average cruising altitude for commercial flights is between 33,000 and 42,000 feet.",
  "Fun fact: The world's shortest scheduled flight is between Westray and Papa Westray in Scotland's Orkney Islands, lasting just under 2 minutes.",
  "Aviation trivia: In-flight Wi-Fi works by connecting to ground stations or satellites as the plane travels.",
  "Did you know? The humidity in an airplane cabin is lower than that of the Sahara Desert, typically around 10-20%.",
  "Travel tip: Tuesday and Wednesday are often the cheapest days to fly.",
  "Fun fact: Commercial airplanes have a cruising speed of around 550-580 mph (885-933 km/h).",
  "Did you know? The busiest route in the world is between Seoul and Jeju Island in South Korea.",
  "Aviation trivia: The 'black box' flight recorder is actually bright orange to make it easier to find after a crash.",
  "Travel tip: Book flights 1-3 months in advance for the best domestic flight deals.",
  "Did you know? A Boeing 747 is made up of approximately 6 million parts."
];

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<FlightSearchParams | null>(
    null
  );
  const [flights, setFlights] = useState<Flight[]>([]);
  const [deal, setDeal] = useState<FlightDeal | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [randomFact, setRandomFact] = useState<string>("");
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Initialize with welcome message and set a random flight fact
  useEffect(() => {
    const initializeChat = async () => {
      if (user) {
        // Load chat history if user is logged in
        try {
          const history = await loadChatHistory(user.id);
          if (history.length > 0) {
            setMessages(history);
            return;
          }
        } catch (error) {
          console.error("Error loading chat history:", error);
        }
      }
      // If no history or error, use initial messages
      setMessages(getInitialMessages());
    };

    if (!authLoading) {
      initializeChat();
    }
    
    setRandomFact(flightFacts[Math.floor(Math.random() * flightFacts.length)]);
  }, [user, authLoading]);

  // Reset chat when user logs out
  useEffect(() => {
    if (!user && messages.length > 2) {
      // User has logged out, reset to initial state
      setMessages(getInitialMessages());
      setSearchParams(null);
      setFlights([]);
      setDeal(undefined);
      // Show a toast notification
      toast({
        title: "Signed out",
        description: "You've been signed out. Your chat has been reset.",
        duration: 3000,
      });
    }
  }, [user, messages.length, toast]);

  // Check if user is logged in and show history button
  useEffect(() => {
    if (user && !isSidebarOpen && messages.length > 2) {
      // Show notification about chat history option
      toast({
        title: "Chat History Available",
        description: "You can access your chat history by clicking the history button in the top right.",
        duration: 5000,
      });
    }
  }, [user]);

  // Rotate flight facts every 30 seconds
  useEffect(() => {
    const factInterval = setInterval(() => {
      setRandomFact(flightFacts[Math.floor(Math.random() * flightFacts.length)]);
    }, 30000);
    
    return () => clearInterval(factInterval);
  }, []);

  // Function to reset the chat
  const handleReset = () => {
    setMessages(getInitialMessages());
    setSearchParams(null);
    setFlights([]);
    setDeal(undefined);
    // Set a new random fact when chat is reset
    setRandomFact(flightFacts[Math.floor(Math.random() * flightFacts.length)]);
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
    
    // Save message to database if user is logged in
    if (user) {
      saveMessage(user.id, newMessage);
    }
    
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

  // Handle loading a conversation from history
  const handleSelectConversation = (historyMessages: any[]) => {
    // Convert the stored message format back to our app's format
    const formattedMessages = historyMessages.map(msg => ({
      id: msg.id || uuidv4(),
      content: msg.content,
      type: (msg.role === 'user' ? 'user' : 'bot') as 'user' | 'bot',
      timestamp: new Date(msg.timestamp || new Date())
    }));

    setMessages(formattedMessages);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onReset={handleReset}>
        {/* Chat history button only for logged in users */}
        {user && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-sm px-3 py-1 bg-primary-700/20 hover:bg-primary-700/30 rounded-md flex items-center space-x-1"
          >
            <span>History</span>
          </button>
        )}
      </Header>

      {/* Chat history sidebar */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <div className="chat-container w-full">
          <div className="chat-header">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-blue-500 dark:text-blue-300"
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ask me about flights, travel tips, and more
                  </p>
                </div>
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

      {/* Flight facts footer */}
      <footer className="py-3 px-6 text-center border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>{randomFact}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
