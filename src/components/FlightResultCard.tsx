import React from 'react';
import { Card } from '@/components/ui/card';
import { Plane, Clock, ExternalLink, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

// Helper function to get airline booking URLs
const getAirlineBookingUrl = (airline: string, flightNumber: string) => {
  const airlineUrls: { [key: string]: string } = {
    'SpiceJet': 'https://www.spicejet.com',
    'Air India': 'https://www.airindia.com',
    'IndiGo': 'https://www.goindigo.in',
    'Vistara': 'https://www.airvistara.com',
    'GoAir': 'https://www.flygofirst.com',
    'AirAsia India': 'https://www.airasia.co.in'
  };
  
  return airlineUrls[airline] || 'https://www.makemytrip.com';
};

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

  // Add a function to determine if it's a good deal
  const isGoodDeal = () => {
    const priceNum = parseInt(flight.price.replace(/[^0-9]/g, ''));
    return priceNum < 4000; // Example threshold
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
        {isGoodDeal() && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          >
            Best Deal
          </Badge>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center flex-shrink-0">
            <motion.div 
              className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 shadow-inner"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05, type: "spring" }}
            >
              <Plane className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <div className="font-semibold text-sm md:text-base text-gray-800 dark:text-gray-100">
                {flight.airline}
                <span className="ml-2 inline-flex items-center text-xs text-green-600 dark:text-green-400">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{flight.flightNumber}</span>
                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                <span className="text-primary">On time</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center flex-1 gap-2 md:gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
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
              <div className="text-xs font-medium text-primary mb-0.5">{flight.duration}</div>
              <div className="w-16 sm:w-24 h-[2px] bg-gradient-to-r from-blue-200 via-primary to-blue-400 dark:from-blue-700 dark:to-blue-500 relative">
                <motion.div 
                  className="absolute top-1/2 right-0 w-2.5 h-2.5 rounded-full bg-primary transform -translate-y-1/2 border-2 border-white dark:border-gray-800 shadow-md"
                  initial={{ left: "0%" }}
                  animate={{ left: "100%" }}
                  transition={{ 
                    duration: 1.2, 
                    ease: "linear", 
                    delay: 0.3 + index * 0.05
                  }}
                ></motion.div>
              </div>
              <div className="text-[10px] font-medium text-primary mt-0.5">Non-stop</div>
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
            className="text-center sm:text-right mt-2 sm:mt-0 flex flex-col items-end gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.05, type: "spring", stiffness: 150 }}
          >
            <div>
              <div className="font-bold text-lg md:text-xl text-primary">
                {flight.price}
              </div>
              <div className="text-xs text-muted-foreground">per adult</div>
            </div>
            <a 
              href={getAirlineBookingUrl(flight.airline, flight.flightNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full sm:w-auto"
            >
              <Button 
                size="sm" 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                Book Now 
                <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </a>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FlightResultCard;
