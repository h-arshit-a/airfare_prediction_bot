import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFormData {
  source: string;
  destination: string;
  date: Date | undefined;
}

interface FlightSearchFormProps {
  onSearch: (data: SearchFormData) => void;
  className?: string;
}

const FlightSearchForm: React.FC<FlightSearchFormProps> = ({ onSearch, className }) => {
  const [formData, setFormData] = useState<SearchFormData>({
    source: '',
    destination: '',
    date: new Date(),
  });

  const handleChange = (field: keyof SearchFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.source && formData.destination && formData.date) {
      onSearch(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-1">From</label>
          <Input
            id="source"
            className="w-full"
            placeholder="Airport code (e.g., JFK)"
            value={formData.source}
            onChange={(e) => handleChange('source', e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="destination" className="block text-sm font-medium mb-1">To</label>
          <Input
            id="destination"
            className="w-full"
            placeholder="Airport code (e.g., LAX)"
            value={formData.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">When</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "EEE, MMM d") : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => handleChange('date', date)}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={!formData.source || !formData.destination || !formData.date}
      >
        Search Flights
      </Button>
    </form>
  );
};

export default FlightSearchForm;