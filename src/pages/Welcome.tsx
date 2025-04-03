import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const features = [
  "Find the best flight deals",
  "Get real-time flight status updates",
  "Compare prices across airlines",
  "Get airport information and tips",
  "Plan your perfect itinerary",
  "Receive travel alerts and notifications"
];

const Welcome = () => {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4"
    >
      <div className="max-w-2xl w-full text-center space-y-8">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold text-blue-600 mb-4"
        >
          Welcome to FlightFriend
        </motion.h1>
        
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-600 mb-8"
        >
          Your personal flight assistant is here to help you with all your travel needs.
          Get instant answers about flights, airports, and travel information.
        </motion.p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-lg mb-8"
        >
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">What I Can Do For You:</h2>
          <motion.div
            key={currentFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-lg text-gray-700"
          >
            {features[currentFeature]}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-4"
        >
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg transform hover:scale-105 transition-transform duration-200"
            onClick={() => navigate('/chat')}
          >
            Start Chatting
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Welcome; 