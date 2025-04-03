import React from 'react';
import { Card } from '@/components/ui/card';
import { Plane, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface FlightDetails {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureIso: string;
  arrivalIso: string;
  duration: string;
  price: string;
}

interface FlightResultCardProps {
  flight: FlightDetails;
  index: number;
}

const FlightResultCard: React.FC<FlightResultCardProps> = ({ flight, index }) => {

  const formatFullDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, h:mm a');
    } catch (error) {
      console.error("Error formatting date:", error);
      return isoString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" }}
      className="mb-3"
    >
      <Card className="p-4 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center flex-shrink-0">
            <motion.div 
              className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 shadow-inner"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05, type: "spring" }}
            >
              <Plane className="h-5 w-5 text-primary" />
            </motion.div>
            <div>
              <div className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-100">{flight.airline}</div>
              <div className="text-xs text-muted-foreground">{flight.flightNumber}</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center flex-1 gap-2 md:gap-4">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{flight.departureTime}</div>
              <div className="text-xs text-muted-foreground">{formatFullDateTime(flight.departureIso)}</div>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center mx-1 sm:mx-3 flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <div className="text-xs text-muted-foreground mb-0.5">{flight.duration}</div>
              <div className="w-16 sm:w-20 h-[1.5px] bg-gradient-to-r from-blue-200 to-blue-400 dark:from-blue-700 dark:to-blue-500 relative">
                <motion.div 
                  className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-primary transform -translate-y-1/2 border-2 border-white dark:border-gray-800 shadow"
                  initial={{ left: "0%" }}
                  animate={{ left: "100%" }}
                  transition={{ 
                    duration: 1.2, 
                    ease: "linear", 
                    delay: 0.3 + index * 0.05
                  }}
                ></motion.div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Non-stop</div>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{flight.arrivalTime}</div>
              <div className="text-xs text-muted-foreground">{formatFullDateTime(flight.arrivalIso)}</div>
            </motion.div>
          </div>
          
          <motion.div 
            className="text-center sm:text-right mt-2 sm:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.05, type: "spring", stiffness: 150 }}
          >
            <div className="font-bold text-lg md:text-xl text-primary">
              {flight.price}
            </div>
            <div className="text-xs text-muted-foreground">per adult</div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FlightResultCard;
