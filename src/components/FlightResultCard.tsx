import React from 'react';
import { Card } from '@/components/ui/card';
import { Plane, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlightResultCardProps {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
}

const FlightResultCard: React.FC<FlightResultCardProps> = ({
  airline,
  flightNumber,
  departureTime,
  arrivalTime,
  duration,
  price
}) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{airline}</div>
            <div className="text-xs text-muted-foreground">{flightNumber}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between flex-1 mx-2">
          <div className="text-center">
            <div className="text-lg font-bold">{departureTime}</div>
          </div>
          
          <div className="flex flex-col items-center mx-2">
            <div className="text-xs text-muted-foreground">{duration}</div>
            <div className="w-16 md:w-24 h-[1px] bg-gray-300 dark:bg-gray-600 relative my-1">
              <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-primary transform -translate-y-1/2"></div>
            </div>
            <div className="text-xs text-muted-foreground">Non stop</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold">{arrivalTime}</div>
          </div>
        </div>
        
        <div className="flex items-center md:text-right">
          <div className="font-bold text-lg text-primary">
            {price}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FlightResultCard;
