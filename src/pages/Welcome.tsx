import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Plane,
  MapPin,
  Clock,
  MessageSquareText,
  Info,
  Zap,
  Sun,
  Moon,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AuthButtons from "../components/AuthButtons";

// Potential welcome messages
const welcomeMessages = [
  "Your AI-powered flight assistant that helps you navigate the world of air travel with ease.",
  "Ready to plan your next trip? Let FlightFriend find the best options for you!",
  "Get instant, accurate answers to all your travel questions in seconds.",
  "Let's find your perfect flight. Tell me where you want to go!",
  "Flight planning made simple. Ask me anything about flights!",
];

// Potential travel facts
const travelFacts = [
  "Did you know? The busiest airport in India by passenger traffic is Delhi's Indira Gandhi International Airport (DEL).",
  "Travel Tip: Booking flights on Tuesdays or Wednesdays often yields lower prices.",
  "Fun Fact: The longest domestic flight route in India connects Delhi and Port Blair.",
  "Did you know? Goa has two international airports: Dabolim (GOI) and Mopa (GOX).",
  "Travel Tip: Always check baggage allowances before flying, as they vary between airlines.",
];

const Welcome = () => {
  const navigate = useNavigate();
  const [dynamicMessage, setDynamicMessage] = useState("");
  const [dynamicFact, setDynamicFact] = useState("");

  // Set random message and fact on component mount
  useEffect(() => {
    setDynamicMessage(
      welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
    );
    setDynamicFact(travelFacts[Math.floor(Math.random() * travelFacts.length)]);
  }, []);

  const features = [
    {
      icon: <Plane className="h-8 w-8 text-blue-500" />,
      title: "Flight Information",
      description: "Real-time updates on statuses, delays, and gates.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-blue-500" />,
      title: "Airport Details",
      description: "Info on terminals, amenities, and transport.",
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-500" />,
      title: "Travel Planning",
      description: "Assistance with connections and layovers.",
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      title: "Instant Answers",
      description: "Quick replies to your travel questions.",
    },
  ];

  // Get current time for greeting
  const hour = new Date().getHours();
  const timeOfDayGreeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const TimeIcon = hour < 12 ? Sun : hour < 18 ? Sun : Moon; // Adjust icon based on time

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-black dark:to-slate-800 p-4 text-gray-800 dark:text-gray-200"
    >
      {/* Header Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        <button
          onClick={() => navigate('/chat')}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
        >
          <MessageSquareText className="h-4 w-4" />
          <span>Go to Chat</span>
        </button>
        <AuthButtons />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
        className="max-w-5xl w-full text-center space-y-10 px-4"
      >
        {/* Time-based Greeting */}
        <motion.div
          className="flex items-center justify-center space-x-2 text-lg text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <TimeIcon className="h-5 w-5" />
          <span>{timeOfDayGreeting}!</span>
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", damping: 10 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300 mb-4 pb-1">
            Welcome to FlightFriend
          </h1>
          {/* Dynamic Subtitle */}
          <motion.p
            key={dynamicMessage} // Trigger animation on message change
            className="text-xl text-gray-600 dark:text-gray-400 mb-8 px-4 md:px-16"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {dynamicMessage}
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left px-4 md:px-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, staggerChildren: 0.1 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-start space-x-4 bg-white dark:bg-gray-800/50 p-5 rounded-xl shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex-shrink-0 mt-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-md text-blue-700 dark:text-blue-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Start Button */}
        <motion.div
          className="space-y-4 mt-12 flex flex-col items-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white px-12 py-7 text-xl rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 group animate-pulse"
            onClick={() => navigate("/chat")}
          >
            <MessageSquareText className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
            <span>Start Chatting</span>
          </Button>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
            Click to access the chatbot
          </p>
          {/* Dynamic Fact */}
          <motion.p
            key={dynamicFact} // Trigger animation on fact change
            className="text-sm text-gray-500 dark:text-gray-500 mt-4 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            {dynamicFact}
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Welcome;
