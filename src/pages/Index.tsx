import React, { useState, useEffect, useRef } from "react";
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
import { 
  saveMessage, 
  loadChatHistory, 
  startNewConversation, 
  loadConversation
} from "../services/chatHistoryService";
import ChatMessage from '@/components/ChatMessage';
import { motion, AnimatePresence } from "framer-motion";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Function to reset the chat and start a new conversation
  const handleReset = () => {
    // Start a new conversation
    startNewConversation();

    setMessages(getInitialMessages());
    setSearchParams(null);
    setFlights([]);
    setDeal(undefined);
    // Set a new random fact when chat is reset
    setRandomFact(flightFacts[Math.floor(Math.random() * flightFacts.length)]);
  };

  // Function to handle starting a new conversation
  const handleNewConversation = () => {
    handleReset();
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
  const handleSelectConversation = async (messages: Message[]) => {
    // If we're passed an array of messages, use them directly
    if (Array.isArray(messages) && messages.length > 0) {
      setMessages(messages);
      setIsSidebarOpen(false);
      return;
    }
    
    // Otherwise, try to load the conversation by ID (in case we're passed a conversation ID)
    const conversationId = messages as unknown as string;
    if (user && typeof conversationId === 'string') {
      try {
        const conversationMessages = await loadConversation(user.id, conversationId);
        if (conversationMessages.length > 0) {
          setMessages(conversationMessages);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: "Error",
          description: "Failed to load conversation history.",
          variant: "destructive",
        });
      }
    }
    
    setIsSidebarOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen relative overflow-hidden"
    >
      {/* Video Background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onReset={handleReset} />

        <ChatHistorySidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <motion.div 
          className="flex-1 flex flex-col items-center p-0"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col">
            {/* Chat messages container */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                    >
                      <ChatMessage
                        message={message}
                        onFlightSearch={handleFlightSearch}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </motion.div>
            </div>

            {/* Chat input */}
            <div className="border-t border-white/10 bg-white/10 backdrop-blur-md">
              <div className="max-w-6xl mx-auto">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  disabled={loading}
                  placeholder="Ask me about flights, travel tips, or deals..."
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Flight facts footer */}
        <motion.footer 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative py-3 px-6 text-center border-t border-white/10 bg-black/20 backdrop-blur-md"
        >
          <motion.div 
            className="flex flex-col items-center justify-center space-y-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <motion.p 
                key={randomFact}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-white/90"
              >
                {randomFact}
              </motion.p>
            </div>
            <p className="text-xs text-white/70">
              This chatbot is developed by: Harshita Khandelwal, Saket Rajak, Raj
            </p>
          </motion.div>
        </motion.footer>
      </div>
    </motion.div>
  );
};

export default Index;
