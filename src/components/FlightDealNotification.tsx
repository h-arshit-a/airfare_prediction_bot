
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plane } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FlightDeal {
  id: string;
  source: string;
  destination: string;
  price: number;
  oldPrice?: number;
  currency: string;
  date: string;
  airline: string;
}

interface FlightDealNotificationProps {
  deal?: FlightDeal;
  onClose: () => void;
}

const FlightDealNotification: React.FC<FlightDealNotificationProps> = ({
  deal,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (deal) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for animation to finish
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [deal, onClose]);

  if (!deal) return null;

  const discount = deal.oldPrice 
    ? Math.round(((deal.oldPrice - deal.price) / deal.oldPrice) * 100) 
    : 0;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-transform duration-300 ${
      visible ? 'translate-x-0' : 'translate-x-[120%]'
    }`}>
      <Card className="w-[300px] shadow-lg border-primary/20">
        <CardHeader className="bg-primary text-primary-foreground pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Plane className="h-5 w-5 mr-2 animate-float" />
              <CardTitle className="text-lg">Flight Deal Alert!</CardTitle>
            </div>
          </div>
          <CardDescription className="text-primary-foreground/90">
            Price drop detected
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{deal.source} to {deal.destination}</span>
              <div className="text-right">
                {deal.oldPrice && (
                  <span className="text-muted-foreground line-through text-sm">
                    {deal.currency}{deal.oldPrice}
                  </span>
                )}
                <span className="font-bold text-primary ml-1">
                  {deal.currency}{deal.price}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span>{deal.date}</span>
              <span>{deal.airline}</span>
            </div>
            {discount > 0 && (
              <div className="bg-secondary py-1 px-2 rounded text-xs font-medium text-center">
                Save {discount}% compared to average price
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="w-full flex justify-between">
            <Button variant="outline" size="sm" onClick={onClose}>
              Dismiss
            </Button>
            <Button size="sm">View Deal</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FlightDealNotification;
